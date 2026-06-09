const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const pgBin = path.join("C:", "Program Files", "PostgreSQL", "16", "bin");
const psql = path.join(pgBin, "psql.exe");

function getActiveKey() {
  if (!fs.existsSync(psql)) {
    console.warn(`PostgreSQL psql binary not found at ${psql}. Skipping automatic env sync.`);
    return null;
  }

  // Get key from the database medusa_imported
  const query = "SELECT token FROM api_key WHERE type = 'publishable' LIMIT 1;";
  const result = spawnSync(psql, [
    "-h", "localhost",
    "-U", "medusa",
    "-d", "medusa_imported",
    "-tAc", query
  ], { encoding: "utf8" });

  if (result.status !== 0) {
    console.error("Failed to query database for publishable key:", result.stderr || result.stdout);
    return null;
  }

  return result.stdout.trim();
}

function ensureAdminUser() {
  if (!fs.existsSync(psql)) return;

  // Check if there are any users in the "user" table
  const query = 'SELECT count(*) FROM "user";';
  const result = spawnSync(psql, [
    "-h", "localhost",
    "-U", "medusa",
    "-d", "medusa_imported",
    "-tAc", query
  ], { encoding: "utf8" });

  if (result.status !== 0) {
    console.error("Failed to check for admin users:", result.stderr || result.stdout);
    return;
  }

  const count = parseInt(result.stdout.trim(), 10);
  if (isNaN(count) || count === 0) {
    console.log("[Sync] User table is empty. Automatically creating default admin user...");
    const createResult = spawnSync(
      "npm",
      ["exec", "--prefix", "backend", "--workspace", "@dtc/backend", "--", "medusa", "user", "-e", "admin@test.com", "-p", "supersecret"],
      { shell: true, stdio: "inherit" }
    );

    if (createResult.status === 0) {
      console.log("[Sync] Default admin user created successfully: admin@test.com / supersecret");
    } else {
      console.error("[Sync] Failed to create default admin user.");
    }
  } else {
    console.log(`[Sync] Found ${count} existing admin user(s).`);
  }
}

function syncEnv() {
  const token = getActiveKey();
  if (!token) return;

  const envPath = path.join(__dirname, "..", "storefront", ".env.local");
  let content = "";
  
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf8");
  } else {
    content = "NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000\n";
  }

  const keyPattern = /^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*$/m;
  const newLine = `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${token}`;

  if (keyPattern.test(content)) {
    // Only update if it actually changed
    const currentMatch = content.match(keyPattern);
    if (currentMatch && currentMatch[0] === newLine) {
      console.log(`[Sync] Storefront publishable key is already up-to-date: ${token}`);
    } else {
      content = content.replace(keyPattern, newLine);
      fs.writeFileSync(envPath, content, "utf8");
      console.log(`[Sync] Successfully synchronized Medusa publishable API key in storefront/.env.local: ${token}`);
    }
  } else {
    content += `\n${newLine}\n`;
    fs.writeFileSync(envPath, content, "utf8");
    console.log(`[Sync] Successfully synchronized Medusa publishable API key in storefront/.env.local: ${token}`);
  }
}

// First ensure admin user exists, then sync the publishable key
ensureAdminUser();
syncEnv();
