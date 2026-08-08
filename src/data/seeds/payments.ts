import type { Payment } from '../../types/treasury'

/**
 * One Payment per seed invoice already marked `status: 'validated'` — the
 * app is seeded as a coherent snapshot, never replayed through
 * validateInvoice() at startup. status here reflects dueDate vs
 * DEMO_REFERENCE_DATE (2026-07-15) at seed-authoring time.
 */
export const payments: Payment[] = [
  { id: 'PAY-7088', sourceType: 'invoice', sourceId: '7088', beneficiary: 'Piensos Norteña SA', amount: 4967.8, dueDate: '2026-08-09', paymentMethod: 'Transferencia', bankId: 'Banco Duero', status: 'pending' },
  { id: 'PAY-7089', sourceType: 'invoice', sourceId: '7089', beneficiary: 'NutriCampo SL', amount: 7427.16, dueDate: '2026-08-10', paymentMethod: 'Transferencia', bankId: 'Caja Rural del Páramo', status: 'pending' },
  { id: 'PAY-5211', sourceType: 'invoice', sourceId: '5211', beneficiary: 'NutriCampo SL', amount: 3050.4, dueDate: '2026-06-27', paymentMethod: 'Transferencia', bankId: 'BanNorte', status: 'overdue' },
  { id: 'PAY-6001', sourceType: 'invoice', sourceId: '6001', beneficiary: 'Piensos Norteña SA', amount: 5225, dueDate: '2026-07-05', paymentMethod: 'Transferencia', bankId: 'Banco Duero', status: 'paid', paidAt: '2026-07-08' },
  { id: 'PAY-6002', sourceType: 'invoice', sourceId: '6002', beneficiary: 'AgroFeed Ibérica SL', amount: 3542.2, dueDate: '2026-07-25', paymentMethod: 'Transferencia', bankId: 'Caja Vega', status: 'pending' },
  { id: 'PAY-6003', sourceType: 'invoice', sourceId: '6003', beneficiary: 'AgroFeed Ibérica SL', amount: 2470, dueDate: '2026-07-28', paymentMethod: 'Transferencia', bankId: 'BanNorte', status: 'pending' },
  { id: 'PAY-6004', sourceType: 'invoice', sourceId: '6004', beneficiary: 'Piensos Norteña SA', amount: 6156, dueDate: '2026-07-22', paymentMethod: 'Transferencia', bankId: 'Caja Rural del Páramo', status: 'pending' },
  { id: 'PAY-6005', sourceType: 'invoice', sourceId: '6005', beneficiary: 'Piensos Norteña SA', amount: 4821.6, dueDate: '2026-07-25', paymentMethod: 'Transferencia', bankId: 'Banco Duero', status: 'pending' },
  { id: 'PAY-6006', sourceType: 'invoice', sourceId: '6006', beneficiary: 'Piensos Norteña SA', amount: 4455, dueDate: '2026-07-28', paymentMethod: 'Transferencia', bankId: 'Caja Vega', status: 'pending' },
  { id: 'PAY-6007', sourceType: 'invoice', sourceId: '6007', beneficiary: 'Piensos del Valle SL', amount: 4201.6, dueDate: '2026-07-30', paymentMethod: 'Transferencia', bankId: 'BanNorte', status: 'pending' },
  { id: 'PAY-6008', sourceType: 'invoice', sourceId: '6008', beneficiary: 'NutriCampo SL', amount: 3619.2, dueDate: '2026-07-15', paymentMethod: 'Transferencia', bankId: 'Caja Rural del Páramo', status: 'pending' },
]
