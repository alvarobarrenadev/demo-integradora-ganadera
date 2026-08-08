import type { Integrated } from '../types/integrated'

export interface WhatsAppEntryProposal {
  origin: string
  animals: number
  integratedId: number
  kg: number
}

export type WhatsAppParseResult =
  | { ok: true; proposal: WhatsAppEntryProposal }
  | { ok: false; error: string }

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function parseSpanishInteger(value: string): number {
  return Number(value.replace(/[.\s]/g, ''))
}

/** Parses the simulated incoming-pig WhatsApp format defined in the brief. */
export function parseWhatsAppEntry(message: string, integrateds: Integrated[]): WhatsAppParseResult {
  const compact = message.replace(/\s+/g, ' ').trim()
  const match = compact.match(
    /^vienen\s+de\s+(.+?)\s+(\d[\d.\s]*)\s+lechones?\s+para\s+(.+?)\s+con\s+(\d[\d.\s]*)\s*kg\.?$/i,
  )

  if (!match) {
    return { ok: false, error: 'No se reconoce el formato. Incluye origen, lechones, integrado y kilos.' }
  }

  const [, origin, animalsText, integratedText, kgText] = match
  const animals = parseSpanishInteger(animalsText)
  const kg = parseSpanishInteger(kgText)
  const integratedQuery = normalize(integratedText)
  const idMatch = integratedQuery.match(/(?:integrado\s*)?#?(\d+)/)
  const integrated = integrateds.find((item) =>
    idMatch ? item.id === Number(idMatch[1]) : normalize(item.name).includes(integratedQuery),
  )

  if (!Number.isInteger(animals) || animals <= 0 || !Number.isInteger(kg) || kg <= 0) {
    return { ok: false, error: 'El número de animales y los kilos deben ser cantidades positivas.' }
  }
  if (!integrated) {
    return { ok: false, error: `No se encuentra el integrado “${integratedText.trim()}”.` }
  }

  return {
    ok: true,
    proposal: { origin: origin.trim(), animals, integratedId: integrated.id, kg },
  }
}
