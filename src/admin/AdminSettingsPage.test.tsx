import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { TestProviders } from '../test-utils'
import { AdminClientContext } from './AdminClientContext'
import AdminSettingsPage from './AdminSettingsPage'

const update = vi.fn()
vi.mock('@tanstack/react-router', () => ({ useRouter: () => ({ invalidate: vi.fn() }) }))
vi.mock('./ShopLocationPicker', () => ({ default: ({ onChange }: { onChange: (point: { lat: number; lng: number }) => void }) => (
  <button type="button" onClick={() => onChange({ lat: 31.2, lng: 29.9 })}>اختيار الموقع</button>
) }))

afterEach(() => { cleanup(); vi.clearAllMocks() })

it('saves the selected Shop location only when settings are saved', async () => {
  const settings = { shop_name: 'المتجر', whatsapp_number: '', phone_number: '', address: '', map_lat: 30, map_lng: 31, opening_hours_text: '', facebook_url: '', instagram_url: '', tiktok_url: '', delivery_areas: ['القاهرة'] }
  const client = { from: () => ({
    select: () => ({ maybeSingle: async () => ({ data: settings, error: null }) }),
    update: (values: unknown) => { update(values); return { eq: () => ({ select: () => ({ maybeSingle: async () => ({ data: { id: true }, error: null }) }) }) } },
  }) }
  render(<TestProviders><AdminClientContext.Provider value={client as never}><AdminSettingsPage /></AdminClientContext.Provider></TestProviders>)
  fireEvent.click(await screen.findByRole('button', { name: 'اختيار الموقع' }))
  expect(update).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'حفظ الإعدادات' }))
  await waitFor(() => expect(update).toHaveBeenCalledWith(expect.objectContaining({ map_lat: 31.2, map_lng: 29.9 })))
})
