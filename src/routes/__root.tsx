import { createRootRoute } from '@tanstack/react-router'
import RootDocument from '../RootDocument'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'description', content: 'منظفات الإيمان - متجر إلكتروني للمنظفات ومستحضرات التجميل بأسعار مميزة' },
    ],
    links: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  }),
  component: RootDocument,
})
