import { describe, expect, it } from 'vitest'
import { calculatePrice } from './price'

const basePricing = {
  price: 100,
  saleType: 'none' as const,
  saleValue: null,
  saleStartsAt: null,
  saleEndsAt: null,
  fridayType: 'none' as const,
  fridayValue: null,
}

describe('calculatePrice', () => {
  it('keeps the original price when no discount is configured', () => {
    expect(calculatePrice(basePricing, '2026-01-05T12:00:00Z')).toEqual({
      originalPrice: 100,
      shownPrice: 100,
      percentOff: 0,
      isSaleActive: false,
      isFridayActive: false,
      fridayPrice: null,
    })
  })

  it.each([
    ['before its start', '2026-01-04T23:59:59Z', false],
    ['at its start', '2026-01-05T00:00:00Z', true],
    ['before its exclusive end', '2026-01-06T23:59:59Z', true],
    ['at its end', '2026-01-07T00:00:00Z', false],
    ['after its end', '2026-01-08T00:00:00Z', false],
  ])('checks a dated sale %s', (_label, instant, isSaleActive) => {
    const result = calculatePrice({
      ...basePricing,
      saleType: 'price',
      saleValue: 70,
      saleStartsAt: '2026-01-05T00:00:00Z',
      saleEndsAt: '2026-01-07T00:00:00Z',
    }, instant)

    expect(result.isSaleActive).toBe(isSaleActive)
    expect(result.shownPrice).toBe(isSaleActive ? 70 : 100)
  })

  it.each([
    ['without a start', { saleStartsAt: null, saleEndsAt: '2026-01-07T00:00:00Z' }, '2026-01-06T00:00:00Z', true],
    ['without an end', { saleStartsAt: '2026-01-05T00:00:00Z', saleEndsAt: null }, '2026-01-08T00:00:00Z', true],
    ['without either date', { saleStartsAt: null, saleEndsAt: null }, '2026-01-08T00:00:00Z', true],
    ['before a future start', { saleStartsAt: '2026-01-09T00:00:00Z', saleEndsAt: null }, '2026-01-08T00:00:00Z', false],
  ])('allows a sale %s', (_label, dates, instant, isSaleActive) => {
    const result = calculatePrice({ ...basePricing, saleType: 'price', saleValue: 70, ...dates }, instant)

    expect(result.isSaleActive).toBe(isSaleActive)
  })

  it.each([
    ['winter Cairo time', '2026-01-01T22:30:00Z'],
    ['summer Cairo time', '2026-07-02T22:30:00Z'],
  ])('starts Friday at Cairo midnight for %s', (_label, instant) => {
    const result = calculatePrice({ ...basePricing, fridayType: 'price', fridayValue: 80 }, instant)

    expect(result.isFridayActive).toBe(true)
    expect(result.fridayPrice).toBe(80)
    expect(result.shownPrice).toBe(80)
  })

  it('keeps a Friday deal available without applying it on another Cairo day', () => {
    const result = calculatePrice({ ...basePricing, fridayType: 'price', fridayValue: 80 }, '2026-01-03T12:00:00Z')

    expect(result.isFridayActive).toBe(false)
    expect(result.fridayPrice).toBe(80)
    expect(result.shownPrice).toBe(100)
  })

  it('uses the lower price when both discounts are active', () => {
    const result = calculatePrice({
      ...basePricing,
      saleType: 'price',
      saleValue: 75,
      saleStartsAt: '2026-01-01T00:00:00Z',
      fridayType: 'price',
      fridayValue: 60,
    }, '2026-01-02T12:00:00Z')

    expect(result.isSaleActive).toBe(true)
    expect(result.isFridayActive).toBe(true)
    expect(result.shownPrice).toBe(60)
  })

  it('rounds a percentage deal to whole pounds', () => {
    const result = calculatePrice({ ...basePricing, price: 99, fridayType: 'percent', fridayValue: 10 }, '2026-01-02T12:00:00Z')

    expect(result.fridayPrice).toBe(89)
    expect(result.shownPrice).toBe(89)
  })

  it('rounds a dated percentage sale to whole pounds', () => {
    const result = calculatePrice({ ...basePricing, price: 99, saleType: 'percent', saleValue: 10 }, '2026-01-05T12:00:00Z')

    expect(result.isSaleActive).toBe(true)
    expect(result.shownPrice).toBe(89)
  })

  it('derives the badge percentage from the original and shown prices', () => {
    const result = calculatePrice({
      ...basePricing,
      price: 99,
      saleType: 'price',
      saleValue: 70,
      saleStartsAt: null,
      saleEndsAt: null,
    }, '2026-01-05T12:00:00Z')

    expect(result.percentOff).toBe(29)
  })
})
