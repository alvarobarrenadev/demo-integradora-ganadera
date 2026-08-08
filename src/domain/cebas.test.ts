import { describe, expect, it } from 'vitest'
import { calculateConversion, isFullyAccountedFor } from './cebas'
import { cebas } from '../data/seeds/cebas'

describe('calculateConversion', () => {
  it('matches V-112 (~2.33)', () => {
    const v112 = cebas.find((c) => c.id === 'V-112')!
    expect(calculateConversion(v112)).toBeCloseTo(2.33, 2)
  })

  it('matches V-115 (~2.45)', () => {
    const v115 = cebas.find((c) => c.id === 'V-115')!
    expect(calculateConversion(v115)).toBeCloseTo(2.45, 2)
  })

  it('returns null when there is no exit weight yet', () => {
    const v119 = cebas.find((c) => c.id === 'V-119')!
    expect(calculateConversion(v119)).toBeNull()
  })

  it('returns null on non-positive weight gain', () => {
    expect(calculateConversion({ feedKg: 1000, entryKg: 500, exitKg: 400 })).toBeNull()
    expect(calculateConversion({ feedKg: 1000, entryKg: 500, exitKg: 0 })).toBeNull()
  })
})

describe('V-118 seed consistency', () => {
  it('has animalsExited/exitKg derived from its two seeded salida movements', () => {
    const v118 = cebas.find((c) => c.id === 'V-118')!
    expect(v118.animalsExited).toBe(1159)
    expect(v118.exitKg).toBe(118100)
    expect(v118.status).toBe('ready_to_close')
  })

  it('is not yet fully closable-conversion positive before the demo feed invoice, but is coherent', () => {
    const v118 = cebas.find((c) => c.id === 'V-118')!
    const conversion = calculateConversion(v118)
    expect(conversion).not.toBeNull()
    expect(conversion).toBeCloseTo(2.12, 2)
  })
})

describe('isFullyAccountedFor', () => {
  it('is true once exited + dead equals entered', () => {
    expect(isFullyAccountedFor({ animalsEntered: 100, animalsExited: 90, deaths: 10 })).toBe(true)
    expect(isFullyAccountedFor({ animalsEntered: 100, animalsExited: 80, deaths: 10 })).toBe(false)
  })
})
