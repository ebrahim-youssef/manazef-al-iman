const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function verifyTurnstile(
  token: string,
  secret: string,
  fetcher: typeof fetch = fetch,
) {
  if (!token) throw new Error('Turnstile token is required')
  if (!secret) throw new Error('TURNSTILE_SECRET_KEY is not configured')

  const response = await fetcher(SITEVERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token }),
  })
  if (!response.ok) throw new Error(`Turnstile Siteverify returned HTTP ${response.status}`)

  const result = await response.json() as { success?: boolean; 'error-codes'?: string[] }
  if (!result.success) {
    throw new Error(`Turnstile verification failed: ${result['error-codes']?.join(', ') || 'success was false'}`)
  }
  return true
}
