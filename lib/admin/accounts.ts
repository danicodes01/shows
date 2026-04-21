export type AdminAccount = { username: string; hash: string }

function splitEnv(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function getAdmins(): AdminAccount[] {
  const usernames = splitEnv(process.env.ADMIN_USERNAME)
  const hashes = splitEnv(process.env.ADMIN_PASSWORD_HASH)
  const count = Math.min(usernames.length, hashes.length)
  const admins: AdminAccount[] = []
  for (let i = 0; i < count; i++) {
    admins.push({ username: usernames[i], hash: hashes[i] })
  }
  return admins
}

export function getAdminUsernames(): string[] {
  return getAdmins().map((a) => a.username)
}
