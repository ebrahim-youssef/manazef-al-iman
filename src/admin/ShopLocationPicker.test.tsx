import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { TestProviders } from '../test-utils'
import ShopLocationPicker from './ShopLocationPicker'

const leaflet = vi.hoisted(() => {
  const handlers: Record<string, (...args: never[]) => void> = {}
  const map = { setView: () => map, on: (event: string, handler: (...args: never[]) => void) => { handlers[event] = handler }, remove: vi.fn(), panTo: vi.fn() }
  const marker = { addTo: () => marker, on: (event: string, handler: (...args: never[]) => void) => { handlers[event] = handler }, getLatLng: () => ({ wrap: () => ({ lat: 30, lng: -170 }) }), setLatLng: vi.fn() }
  const tiles = { on: () => tiles, addTo: vi.fn() }
  return { handlers, map, marker, tiles }
})

vi.mock('leaflet', () => ({ map: () => leaflet.map, marker: () => leaflet.marker, icon: () => ({}), tileLayer: () => leaflet.tiles }))
afterEach(cleanup)

it('wraps longitudes on map clicks and marker drags', async () => {
  const onChange = vi.fn()
  render(<TestProviders><ShopLocationPicker value={{ lat: 30, lng: 31 }} onChange={onChange} /></TestProviders>)
  await waitFor(() => expect(leaflet.handlers.click).toBeDefined())
  leaflet.handlers.click!({ latlng: { lat: 30, lng: 190, wrap: () => ({ lat: 30, lng: -170 }) } } as never)
  leaflet.handlers.dragend!()
  expect(onChange).toHaveBeenNthCalledWith(1, { lat: 30, lng: -170 })
  expect(onChange).toHaveBeenNthCalledWith(2, { lat: 30, lng: -170 })
})
