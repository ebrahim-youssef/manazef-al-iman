declare module 'cloudflare:workers' {
  export const env: {
    SUPABASE_URL: string
    SUPABASE_ANON_KEY: string
    SUPABASE_SERVICE_ROLE_KEY: string
    TURNSTILE_SITE_KEY: string
    TURNSTILE_SECRET_KEY: string
  }
}

interface Window {
  turnstile?: {
    render: (container: HTMLElement, options: {
      sitekey: string
      execution: 'execute'
      appearance: 'interaction-only'
      callback: (token: string) => void
      'error-callback': () => void
      'expired-callback': () => void
    }) => string
    reset: (widgetId: string) => void
    execute: (widgetId: string) => void
    remove: (widgetId: string) => void
  }
}
