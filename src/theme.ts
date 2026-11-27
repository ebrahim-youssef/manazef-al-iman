import { Container, createTheme } from '@mantine/core'

export const theme = createTheme({
  colors: {
    iman: ['#eaf5ee', '#d4eadc', '#acd5bc', '#83c19c', '#59ad7d', '#30995d', '#168a45', '#126b37', '#0e542b', '#0a3e20'],
  },
  primaryColor: 'iman',
  primaryShade: 6,
  fontFamily: '"Thmanyah Sans", "Cairo", system-ui, sans-serif',
  headings: { fontFamily: '"Thmanyah Serif Display", "Thmanyah Sans", "Cairo", serif' },
  radius: { sm: '10px', md: '14px' },
  defaultRadius: 'md',
  shadows: { sm: '0 1px 2px rgba(0, 0, 0, 0.04)', md: '0 6px 20px rgba(17, 24, 39, 0.06)' },
  components: { Container: Container.extend({ defaultProps: { size: '1280px', px: 0 } }) },
})
