import { describe, expect, it } from 'vitest'
import { validateCategoryName } from './adminCategories'

describe('category name validation', () => {
  const categories = [{ id: 'one', name: 'Cleaners' }, { id: 'two', name: 'عروض' }]

  it('accepts a trimmed name for the same category', () => {
    expect(validateCategoryName('  cleaners  ', 'one', categories)).toBe('')
  })

  it('asks for a name when it is blank', () => {
    expect(validateCategoryName('  ', 'one', categories)).not.toBe('')
  })

  it('rejects names longer than 40 characters', () => {
    expect(validateCategoryName('a'.repeat(41), 'one', categories)).not.toBe('')
  })

  it('rejects another category name regardless of case and whitespace', () => {
    expect(validateCategoryName(' CLEANERS ', 'two', categories)).not.toBe('')
  })
})
