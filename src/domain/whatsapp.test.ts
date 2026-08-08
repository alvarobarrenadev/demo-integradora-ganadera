import { describe, expect, it } from 'vitest'
import { parseWhatsAppEntry } from './whatsapp'
import { integrateds } from '../data/seeds/integrateds'

describe('parseWhatsAppEntry', () => {
  it('parses the multiline example from the brief', () => {
    const result = parseWhatsAppEntry(
      'Vienen de Casa Ezequiel\n750 lechones\npara Ismael Cuesta\ncon 14.600 kg',
      integrateds,
    )

    expect(result).toEqual({
      ok: true,
      proposal: { origin: 'Casa Ezequiel', animals: 750, integratedId: 14, kg: 14600 },
    })
  })

  it('accepts the integrated number and Spanish thousands separators', () => {
    expect(parseWhatsAppEntry(
      'Vienen de Casa Ezequiel 750 lechones para el integrado 14 con 15.200 kg',
      integrateds,
    )).toMatchObject({ ok: true, proposal: { integratedId: 14, kg: 15200 } })
  })

  it('returns useful errors for unknown integrateds and malformed messages', () => {
    expect(parseWhatsAppEntry('Vienen de Casa Ezequiel 750 lechones para Nadie con 14.600 kg', integrateds))
      .toEqual({ ok: false, error: 'No se encuentra el integrado “Nadie”.' })
    expect(parseWhatsAppEntry('Mañana llegan animales', integrateds)).toMatchObject({ ok: false })
  })
})
