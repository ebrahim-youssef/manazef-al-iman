import { useLoaderData, useLocation } from '@tanstack/react-router'
import RootDocument from './RootDocument'

export default function RootRouteDocument() {
  const settings = useLoaderData({ from: '__root__' })
  const isAdmin = useLocation({ select: (location) => location.pathname.startsWith('/admin') })
  return <RootDocument settings={settings} isAdmin={isAdmin} />
}
