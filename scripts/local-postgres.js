const fs = require("fs")
const net = require("net")
const os = require("os")
const path = require("path")
const { spawnSync } = require("child_process")

const pgBin = path.join("C:", "Program Files", "PostgreSQL", "16", "bin")
const pgCtl = path.join(pgBin, "pg_ctl.exe")
const initdb = path.join(pgBin, "initdb.exe")
const psql = path.join(pgBin, "psql.exe")
const createdb = path.join(pgBin, "createdb.exe")
const dataDir = path.join(os.homedir(), "AppData", "Local", "Sunluk", "postgres-data")
const logFile = path.join(dataDir, "server.log")
const port = 5432
const user = "medusa"
const database = "medusa"

function fail(message) {
  console.error(message)
  process.exit(1)
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "pipe",
    encoding: "utf8",
    ...options,
  })

  if (result.status !== 0) {
    const stderr = result.stderr?.trim()
    const stdout = result.stdout?.trim()
    fail(stderr || stdout || `${command} exited with code ${result.status}`)
  }

  return result.stdout?.trim() ?? ""
}

function fileExists(target) {
  return fs.existsSync(target)
}

function checkBinaries() {
  for (const binary of [pgCtl, initdb, psql, createdb]) {
    if (!fileExists(binary)) {
      fail(`PostgreSQL binary not found: ${binary}`)
    }
  }
}

function isPortOpen(host, portNumber) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port: portNumber })
    socket.once("connect", () => {
      socket.destroy()
      resolve(true)
    })
    socket.once("error", () => resolve(false))
    socket.once("timeout", () => {
      socket.destroy()
      resolve(false)
    })
    socket.setTimeout(1000)
  })
}

async function waitForPort(host, portNumber, timeoutMs) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (await isPortOpen(host, portNumber)) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  fail(`PostgreSQL did not start on ${host}:${portNumber}`)
}

function initCluster() {
  if (fileExists(path.join(dataDir, "PG_VERSION"))) {
    console.log(`PostgreSQL cluster already initialized at ${dataDir}`)
    return
  }

  fs.mkdirSync(dataDir, { recursive: true })
  run(initdb, ["-D", dataDir, "-U", user, "-A", "trust", "-E", "UTF8"])
  console.log(`Initialized PostgreSQL cluster at ${dataDir}`)
}

async function startCluster() {
  if (await isPortOpen("127.0.0.1", port)) {
    console.log(`PostgreSQL already listening on localhost:${port}`)
    return
  }

  fs.mkdirSync(path.dirname(logFile), { recursive: true })
  run(pgCtl, ["-D", dataDir, "-l", logFile, "start"])
  await waitForPort("127.0.0.1", port, 15000)
  console.log(`Started PostgreSQL on localhost:${port}`)
}

async function stopCluster() {
  if (!(await isPortOpen("127.0.0.1", port))) {
    console.log(`PostgreSQL already stopped on localhost:${port}`)
    return
  }

  run(pgCtl, ["-D", dataDir, "stop", "-m", "fast"])
  console.log(`Stopped PostgreSQL on localhost:${port}`)
}


function databaseExists() {
  const output = run(psql, [
    "-h",
    "localhost",
    "-U",
    user,
    "-d",
    "postgres",
    "-tAc",
    `SELECT 1 FROM pg_database WHERE datname = '${database}'`,
  ])

  return output.trim() === "1"
}

function ensureDatabase() {
  if (databaseExists()) {
    console.log(`Database ${database} already exists`)
    return
  }

  run(createdb, ["-h", "localhost", "-U", user, database])
  console.log(`Created database ${database}`)
}

async function main() {
  checkBinaries()

  const command = process.argv[2] ?? "setup"

  if (command === "setup") {
    initCluster()
    await startCluster()
    ensureDatabase()
    return
  }

  if (command === "start") {
    await startCluster()
    return
  }
  if (command === "stop") {
    await stopCluster()
    return
  }

  if (command === "status") {
    const open = await isPortOpen("127.0.0.1", port)
    console.log(open ? "running" : "stopped")
    return
  }

  fail(`Unknown command: ${command}`)
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)))
