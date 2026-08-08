import type { Client } from '../../types/treasury'

/** Literal brief client data (§4.5). */
export const clients: Client[] = [
  { id: 'CLI-1', name: 'Cárnicas del Norte SA', paymentMethod: 'Transferencia', bankId: 'Banco Duero', avgCollectionDays: 32 },
  { id: 'CLI-2', name: 'Matadero Río Frío SL', paymentMethod: 'Confirming', bankId: 'Caja Rural del Páramo', avgCollectionDays: 45 },
  { id: 'CLI-3', name: 'Embutidos La Vega SL', paymentMethod: 'Pagaré', bankId: 'Banco Duero', avgCollectionDays: 60 },
  { id: 'CLI-4', name: 'Ganados del Sur SL', paymentMethod: 'Transferencia', bankId: 'BanNorte', avgCollectionDays: 15 },
]
