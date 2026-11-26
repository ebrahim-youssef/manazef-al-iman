import { createFileRoute } from '@tanstack/react-router'
import Home from '../pages/Home'
import { getCatalog } from '../data/catalog'

export const Route = createFileRoute('/')({ loader: () => getCatalog(), component: Home })
