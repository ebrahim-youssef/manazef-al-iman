import { DirectionProvider, MantineProvider } from '@mantine/core'
import type { ReactNode } from 'react'
import { theme } from './theme'

export function TestProviders({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} forceColorScheme="light">
      <DirectionProvider initialDirection="rtl">{children}</DirectionProvider>
    </MantineProvider>
  )
}
