import dotenv from 'dotenv'

// dotenv/config only loads .env — Next.js projects keep secrets in .env.local
dotenv.config({ path: '.env.local' })
dotenv.config() // .env as fallback, won't override already-set vars
