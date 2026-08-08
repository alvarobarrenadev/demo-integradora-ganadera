import type { Integrated } from '../../types/integrated'

const CONTROLLERS = ['L. Vega', 'M. Robles'] as const // exactly 2, per the brief
const VETERINARY_UNITS = ['UV-1', 'UV-2', 'UV-3'] as const // exactly 3, per the brief
const FEED_PROVIDERS = ['P1', 'P2', 'P3', 'P4'] as const // P5 is medication-only, never a feed assignment

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE'

function dniFor(id: number): string {
  const digits = String(12000000 + id * 137).padStart(8, '0')
  const letter = DNI_LETTERS[Number(digits) % 23]
  return `${digits}${letter}`
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')
}

function phoneFor(id: number): string {
  return `6${String(10000000 + id * 9137).slice(0, 8)}`
}

/** DVR dates for the additional integrateds are deliberately kept well outside the <30-day alert window from DEMO_REFERENCE_DATE (2026-07-15), so only the brief-named #5/#22 alerts fire. */
function dvrDateFor(id: number): string {
  const monthOffset = 6 + (id % 15) // 6-20 months after July 2026
  const totalMonth = 7 + monthOffset
  const year = 2026 + Math.floor((totalMonth - 1) / 12)
  const month = ((totalMonth - 1) % 12) + 1
  const day = 1 + (id % 27)
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

interface GivenIntegrated {
  id: number
  name: string
  location: string
  cea: string
  capacity: number
  feedProviderId: string
  dvrRenewalDate: string
  welfareCertified: boolean
  controller: (typeof CONTROLLERS)[number]
  veterinaryUnit: (typeof VETERINARY_UNITS)[number]
}

/** Literal brief seed data (§15.3) — exact values, never altered. */
const givenIntegrateds: GivenIntegrated[] = [
  { id: 1, name: 'Casa Robledo', location: 'Vega Alta', cea: 'ES-24-0101', capacity: 1150, feedProviderId: 'P1', dvrRenewalDate: '12/09/2026', welfareCertified: true, controller: 'L. Vega', veterinaryUnit: 'UV-3' },
  { id: 5, name: 'Granja El Encinar', location: 'Robles del Río', cea: 'ES-24-0105', capacity: 880, feedProviderId: 'P4', dvrRenewalDate: '03/08/2026', welfareCertified: true, controller: 'L. Vega', veterinaryUnit: 'UV-3' },
  { id: 9, name: 'Toral del Monte (F. Prado)', location: 'Toral del Monte', cea: 'ES-24-0109', capacity: 1000, feedProviderId: 'P1', dvrRenewalDate: '21/11/2026', welfareCertified: true, controller: 'M. Robles', veterinaryUnit: 'UV-2' },
  { id: 12, name: 'Casa Fontanar', location: 'Fontanar', cea: 'ES-24-0112', capacity: 960, feedProviderId: 'P2', dvrRenewalDate: '30/10/2026', welfareCertified: false, controller: 'M. Robles', veterinaryUnit: 'UV-2' },
  { id: 14, name: 'Granja Ismael Cuesta', location: 'La Llanada', cea: 'ES-24-0114', capacity: 1200, feedProviderId: 'P2', dvrRenewalDate: '15/12/2026', welfareCertified: true, controller: 'L. Vega', veterinaryUnit: 'UV-1' },
  { id: 18, name: 'El Requejo', location: 'Vallehondo', cea: 'ES-24-0118', capacity: 1050, feedProviderId: 'P3', dvrRenewalDate: '02/02/2027', welfareCertified: true, controller: 'M. Robles', veterinaryUnit: 'UV-1' },
  { id: 22, name: 'Casa Milán', location: 'Prado Verde', cea: 'ES-24-0122', capacity: 1050, feedProviderId: 'P2', dvrRenewalDate: '09/08/2026', welfareCertified: false, controller: 'L. Vega', veterinaryUnit: 'UV-2' },
  { id: 26, name: 'Granja Los Castaños', location: 'Castañeda', cea: 'ES-24-0126', capacity: 1150, feedProviderId: 'P1', dvrRenewalDate: '28/01/2027', welfareCertified: true, controller: 'M. Robles', veterinaryUnit: 'UV-3' },
  { id: 29, name: 'La Braña Vieja', location: 'Altomonte', cea: 'ES-24-0129', capacity: 760, feedProviderId: 'P4', dvrRenewalDate: '07/10/2026', welfareCertified: true, controller: 'L. Vega', veterinaryUnit: 'UV-1' },
  { id: 32, name: 'Finca Arroyo (J. Arcayo)', location: 'Arroyo de Abajo', cea: 'ES-24-0132', capacity: 900, feedProviderId: 'P3', dvrRenewalDate: '11/11/2026', welfareCertified: true, controller: 'M. Robles', veterinaryUnit: 'UV-2' },
  { id: 33, name: 'Casa Faustino', location: 'Peñalba', cea: 'ES-24-0133', capacity: 840, feedProviderId: 'P4', dvrRenewalDate: '25/09/2026', welfareCertified: false, controller: 'L. Vega', veterinaryUnit: 'UV-3' },
  { id: 40, name: 'Granja Valdecillo', location: 'Valdecillo', cea: 'ES-24-0140', capacity: 1100, feedProviderId: 'P1', dvrRenewalDate: '14/10/2026', welfareCertified: true, controller: 'M. Robles', veterinaryUnit: 'UV-1' },
]

/** Deterministic literal fixtures for the remaining 28 farms needed to reach 40 total. */
const ADDITIONAL_NAMES: Record<number, [name: string, location: string]> = {
  2: ['Granja Fuente Vieja', 'Fuentelviejo'],
  3: ['Casa Bermejo', 'Bermejo'],
  4: ['Granja Los Álamos', 'Los Álamos'],
  6: ['Finca La Cabaña', 'La Cabaña'],
  7: ['Granja Peña Larga', 'Peña Larga'],
  8: ['Casa del Soto', 'El Soto'],
  10: ['Granja Valdesomera', 'Valdesomera'],
  11: ['Finca Robledal', 'Robledal'],
  13: ['Casa Miravalles', 'Miravalles'],
  15: ['Granja Los Tejares', 'Los Tejares'],
  16: ['Finca La Cotarra', 'La Cotarra'],
  17: ['Casa Prado Alto', 'Prado Alto'],
  19: ['Granja Sanabria', 'Villar de Sanabria'],
  20: ['Finca El Chaparral', 'El Chaparral'],
  21: ['Casa Ordás', 'Ordás'],
  23: ['Granja La Vallina', 'La Vallina'],
  24: ['Finca Los Corrales', 'Los Corrales'],
  25: ['Casa Bustillo', 'Bustillo'],
  27: ['Granja El Pontón', 'El Pontón'],
  28: ['Finca Valdemora', 'Valdemora'],
  30: ['Casa Trascastro', 'Trascastro'],
  31: ['Granja Los Barrios', 'Los Barrios'],
  34: ['Finca La Cepeda', 'La Cepeda'],
  35: ['Casa Villoria', 'Villoria'],
  36: ['Granja Los Nogales', 'Los Nogales'],
  37: ['Finca Robledo de Torío', 'Robledo de Torío'],
  38: ['Casa Vegamián', 'Vegamián'],
  39: ['Granja Los Llanos', 'Los Llanos'],
}

function buildAdditionalIntegrated(id: number): Integrated {
  const [name, location] = ADDITIONAL_NAMES[id]
  return {
    id,
    name,
    location,
    cea: `ES-24-${String(id).padStart(4, '0')}`,
    capacity: 700 + ((id * 53) % 600),
    feedProviderId: FEED_PROVIDERS[id % FEED_PROVIDERS.length],
    dvrRenewalDate: dvrDateFor(id),
    welfareCertified: id % 3 !== 0,
    controller: CONTROLLERS[id % 2],
    veterinaryUnit: VETERINARY_UNITS[id % 3],
    dni: dniFor(id),
    email: `${slug(name)}@agrocorreo.es`,
    phone: phoneFor(id),
    pricePerPig: 13.5,
    billingDay: 1 + ((id * 7) % 28),
  }
}

function buildGivenIntegrated(g: GivenIntegrated): Integrated {
  return {
    ...g,
    dni: dniFor(g.id),
    email: `${slug(g.name)}@agrocorreo.es`,
    phone: phoneFor(g.id),
    pricePerPig: 13.5,
    // Documented invented mock data (billing contact fixtures aren't given by the brief).
    // #14 is fixed at 25 so the V-118 settlement due date lands inside the visible forecast window.
    billingDay: g.id === 14 ? 25 : 1 + ((g.id * 7) % 28),
  }
}

const additionalIds = Object.keys(ADDITIONAL_NAMES).map(Number)

export const integrateds: Integrated[] = [
  ...givenIntegrateds.map(buildGivenIntegrated),
  ...additionalIds.map(buildAdditionalIntegrated),
].sort((a, b) => a.id - b.id)
