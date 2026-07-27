import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { InputConfigModules } from '@medusajs/types'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

if (process.env.NODE_ENV === 'production') {
  const jwtSecret = process.env.JWT_SECRET
  const cookieSecret = process.env.COOKIE_SECRET
  if (!jwtSecret || jwtSecret === 'supersecret') {
    throw new Error('JWT_SECRET must be set to a secure value in production')
  }
  if (!cookieSecret || cookieSecret === 'supersecret') {
    throw new Error('COOKIE_SECRET must be set to a secure value in production')
  }

  if (process.env.S3_BUCKET) {
    if (!process.env.S3_REGION) {
      throw new Error('S3_REGION is required when S3 storage is enabled in production')
    }
    if (!process.env.S3_ACCESS_KEY_ID) {
      throw new Error('S3_ACCESS_KEY_ID is required when S3 storage is enabled in production')
    }
    if (!process.env.S3_SECRET_ACCESS_KEY) {
      throw new Error('S3_SECRET_ACCESS_KEY is required when S3 storage is enabled in production')
    }
    if (!process.env.S3_FILE_URL) {
      throw new Error('S3_FILE_URL is required when S3 storage is enabled in production')
    }
  }
}

const modules: InputConfigModules = [
  {
    resolve: "@medusajs/medusa/translation",
  },
  {
    resolve: "@medusajs/medusa/fulfillment",
    options: {
      providers: [
        {
          resolve: "./src/modules/regional-fulfillment",
          id: "regional-fulfillment",
        },
      ],
    },
  },
]

if (process.env.S3_BUCKET) {
  modules.push({
    resolve: "@medusajs/medusa/file",
    options: {
      providers: [
        {
          resolve: "@medusajs/medusa/file-s3",
          id: "s3",
          options: {
            file_url: process.env.S3_FILE_URL || process.env.S3_URL,
            access_key_id: process.env.S3_ACCESS_KEY_ID,
            secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
            bucket: process.env.S3_BUCKET,
            region: process.env.S3_REGION,
            endpoint: process.env.S3_URL || undefined,
          },
        },
      ],
    },
  })
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL || undefined,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules,
  featureFlags: {
    translation: true,
  },
})
