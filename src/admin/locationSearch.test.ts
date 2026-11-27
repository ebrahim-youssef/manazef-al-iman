import { describe, expect, it } from 'vitest'
import { mapSearchResults, reserveSearchTime } from './locationSearch'

describe('place search', () => {
  it('reserves requests at least one second apart', () => {
    expect(reserveSearchTime(1000, 0)).toEqual({ time: 1000, delayMs: 0 })
    expect(reserveSearchTime(1200, 1000)).toEqual({ time: 2000, delayMs: 800 })
  })

  it('keeps valid named points and rejects malformed results', () => {
    expect(mapSearchResults([
      { display_name: 'القاهرة', lat: '30.0444', lon: '31.2357' },
      { display_name: 'خطأ', lat: 'abc', lon: '31' },
      { display_name: '', lat: '30', lon: '31' },
    ])).toEqual([{ name: 'القاهرة', lat: 30.0444, lng: 31.2357 }])
  })
})
