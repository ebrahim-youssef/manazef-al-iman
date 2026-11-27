import { act, renderHook, waitFor } from '@testing-library/react'
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

it('loads only when enabled and refreshes a cached index after five minutes', async () => {
  vi.resetModules()
  const { useSearchIndex: useFreshIndex } = await import('./useSearchIndex')
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  vi.mocked(getSearchIndex).mockReset().mockResolvedValue({ unavailable: false, categories: [], products: [] })
  const first = renderHook(({ enabled }) => useFreshIndex(enabled), { initialProps: { enabled: false } })
  expect(getSearchIndex).not.toHaveBeenCalled()
  await act(async () => { first.rerender({ enabled: true }) })
  expect(getSearchIndex).toHaveBeenCalledTimes(1)
  first.unmount()
  vi.advanceTimersByTime(4 * 60 * 1000)
  const second = renderHook(() => useFreshIndex(true))
  await act(async () => {})
  expect(getSearchIndex).toHaveBeenCalledTimes(1)
  second.unmount()
  vi.advanceTimersByTime(2 * 60 * 1000)
  const third = renderHook(() => useFreshIndex(true))
  await act(async () => {})
  expect(getSearchIndex).toHaveBeenCalledTimes(2)
  third.unmount()
  vi.useRealTimers()
})
