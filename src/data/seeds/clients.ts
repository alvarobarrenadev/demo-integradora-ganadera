import type { Client } from '../../types/treasury'

/** Literal brief client names (§15.6); payment method/bank/avg-days are invented mock CRM data. */
export const clients: Client[] = [
  { id: 'CLI-1', name: 'Cárnicas del Norte SA', paymentMethod: 'Transferencia', bankId: 'Banco Duero', avgCollectionDays: 28 },
  { id: 'CLI-2', name: 'Matadero Río Frío SL', paymentMethod: 'Transferencia', bankId: 'Caja Rural del Páramo', avgCollectionDays: 35 },
  { id: 'CLI-3', name: 'Embutidos La Vega SL', paymentMethod: 'Recibo', bankId: 'BanNorte', avgCollectionDays: 21 },
  { id: 'CLI-4', name: 'Ganados del Sur SL', paymentMethod: 'Transferencia', bankId: 'Caja Vega', avgCollectionDays: 42 },
]
