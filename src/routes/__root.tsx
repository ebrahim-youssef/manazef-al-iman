import { createRootRoute } from '@tanstack/react-router'
import RootRouteDocument from '../RootRouteDocument'
import { getNavigationCategories, getShopSettings } from '../data/settings'

export const Route = createRootRoute({
  loader: async () => {
    const [settings, categories] = await Promise.all([getShopSettings(), getNavigationCategories()])
    return { ...settings, categories }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'description', content: 'منظفات الإيمان - متجر إلكتروني للمنظفات ومستحضرات التجميل بأسعار مميزة' },
    ],
    links: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  }),
  component: RootRouteDocument,
})
