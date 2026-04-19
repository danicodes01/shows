export const SESSION_COOKIE = 'admin_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

async function hmacHex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

export async function signSessionToken(username: string, secret: string): Promise<string> {
  const timestamp = Date.now().toString()
  const sig = await hmacHex(`${timestamp}:${username}`, secret)
  return `${timestamp}.${sig}`
}

export async function verifySessionToken(
  token: string | undefined,
  username: string,
  secret: string,
): Promise<boolean> {
  if (!token) return false
  const [timestamp, sig] = token.split('.')
  if (!timestamp || !sig) return false

  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return false
  const ageSec = (Date.now() - ts) / 1000
  if (ageSec < 0 || ageSec > SESSION_MAX_AGE) return false

  const expected = await hmacHex(`${timestamp}:${username}`, secret)
  return constantTimeEqual(sig, expected)
}
