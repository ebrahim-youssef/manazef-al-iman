import { describe, expect, it, vi } from 'vitest'
import { verifyTurnstile } from './turnstile'

const TEST_SECRET_KEY = '1x0000000000000000000000000000000AA'

describe('verifyTurnstile', () => {
  it('sends the token and secret to Cloudflare Siteverify', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 }))

    await expect(verifyTurnstile('test-token', TEST_SECRET_KEY, fetcher)).resolves.toBe(true)
    expect(fetcher).toHaveBeenCalledWith('https://challenges.cloudflare.com/turnstile/v0/siteverify', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: TEST_SECRET_KEY, response: 'test-token' }),
    }))
  })

  it('rejects a missing token without calling Cloudflare', async () => {
    const fetcher = vi.fn()

    await expect(verifyTurnstile('', TEST_SECRET_KEY, fetcher)).rejects.toThrow('Turnstile token is required')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('rejects failed Siteverify responses and names the returned condition', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }), { status: 200 }))

    await expect(verifyTurnstile('bad-token', TEST_SECRET_KEY, fetcher))
      .rejects.toThrow('Turnstile verification failed: invalid-input-response')
  })

  it('rejects unsuccessful HTTP responses', async () => {
    const fetcher = vi.fn(async () => new Response('', { status: 503 }))

    await expect(verifyTurnstile('test-token', TEST_SECRET_KEY, fetcher))
      .rejects.toThrow('Turnstile Siteverify returned HTTP 503')
  })
})
