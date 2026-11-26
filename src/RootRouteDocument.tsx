import { useLoaderData } from '@tanstack/react-router'
import RootDocument from './RootDocument'

export default function RootRouteDocument() {
  const settings = useLoaderData({ from: '__root__' })
  return <RootDocument settings={settings} />
}
