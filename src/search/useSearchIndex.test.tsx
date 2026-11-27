import { renderHook, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { getSearchIndex } from '../data/catalog'
import { useSearchIndex } from './useSearchIndex'

vi.mock('../data/catalog', () => ({ getSearchIndex: vi.fn() }))

it('retries a failed search index request on the next mount', async () => {
  vi.mocked(getSearchIndex)
    .mockRejectedValueOnce(new Error('Network unavailable'))
    .mockResolvedValueOnce({ unavailable: true })
    .mockResolvedValueOnce({ unavailable: false, categories: [], products: [] })

  const first = renderHook(() => useSearchIndex())
  await waitFor(() => expect(first.result.current).toEqual({ unavailable: true }))
  first.unmount()

  const second = renderHook(() => useSearchIndex())
  await waitFor(() => expect(second.result.current).toEqual({ unavailable: true }))
  second.unmount()

  const third = renderHook(() => useSearchIndex())
  await waitFor(() => expect(third.result.current).toEqual({ unavailable: false, categories: [], products: [] }))
})
