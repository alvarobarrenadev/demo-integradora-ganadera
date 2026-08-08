import { describe, expect, it } from 'vitest'
import { isDvrExpiringSoon } from './dvr'
import { DEMO_REFERENCE_DATE } from '../utils/dates'

describe('isDvrExpiringSoon', () => {
  it('alerts for the two brief-named cases relative to DEMO_REFERENCE_DATE', () => {
    expect(isDvrExpiringSoon('2026-08-03', DEMO_REFERENCE_DATE)).toBe(true) // El Encinar, #5
    expect(isDvrExpiringSoon('2026-08-09', DEMO_REFERENCE_DATE)).toBe(true) // Casa Milán, #22
  })

  it('does not alert for a renewal 30+ days away', () => {
    expect(isDvrExpiringSoon('2026-08-14', DEMO_REFERENCE_DATE)).toBe(false)
  })

  it('alerts for a renewal less than 30 days away', () => {
    expect(isDvrExpiringSoon('2026-08-13', DEMO_REFERENCE_DATE)).toBe(true)
  })
})
