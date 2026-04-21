#!/usr/bin/env node
import { execSync } from 'node:child_process'

const { VERCEL_ENV } = process.env

if (VERCEL_ENV === 'preview') {
  console.log('[migrate] preview build, skipping migrate deploy')
  process.exit(0)
}

let migrationsChanged = true
try {
  execSync('git rev-parse HEAD~1', { stdio: 'ignore' })
  const diff = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' })
  migrationsChanged = diff
    .split('\n')
    .some((f) => f.startsWith('prisma/migrations/'))
} catch {
  console.warn('[migrate] cannot diff against previous commit; running migrate to be safe')
}

if (!migrationsChanged) {
  console.log('[migrate] no migration changes in this commit, skipping migrate deploy')
  process.exit(0)
}

const maxAttempts = 3
for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
    console.log(`[migrate] attempt ${attempt}/${maxAttempts}: prisma migrate deploy`)
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    process.exit(0)
  } catch (err) {
    const status = err.status ?? 1
    if (attempt < maxAttempts) {
      console.warn(`[migrate] attempt ${attempt} failed (exit ${status}); retrying in 20s`)
      execSync('sleep 20')
    } else {
      console.error(`[migrate] all ${maxAttempts} attempts failed`)
      process.exit(status)
    }
  }
}
