export const UNKNOWN = '¯\\_(ツ)_/¯'

const UNKNOWN_TOKENS = new Set(['<unknown>', 'unknown', 'n/a', 'tba', 'tbd'])

export function displayValue(v: string | null | undefined): string {
  const s = (v ?? '').trim()
  if (!s) return UNKNOWN
  return UNKNOWN_TOKENS.has(s.toLowerCase()) ? UNKNOWN : s
}
