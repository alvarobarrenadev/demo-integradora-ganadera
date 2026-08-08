import { describe, expect, it } from 'vitest'
import { roundTo } from './numbers'
import { roundCurrency } from './currency'

describe('roundTo', () => {
  it('rounds a value naive Math.round(value*100)/100 mis-rounds', () => {
    // 1.005 * 100 === 100.49999999999999 in IEEE-754, so a naive round gives 1 (i.e. 1.00), not 1.01.
    expect(Math.round(1.005 * 100) / 100).toBe(1)
    expect(roundTo(1.005, 2)).toBe(1.01)
  })

  it('rounds ordinary values correctly', () => {
    expect(roundTo(196.804, 2)).toBe(196.8)
    expect(roundTo(340.746, 2)).toBe(340.75)
    expect(roundTo(2.309569, 2)).toBe(2.31)
  })
})

describe('roundCurrency', () => {
  it('is roundTo(value, 2)', () => {
    expect(roundCurrency(17037.304)).toBe(17037.3)
    expect(roundCurrency(1.005)).toBe(1.01)
  })
})
