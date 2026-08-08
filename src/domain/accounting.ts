import type { Integrated } from '../types/integrated'
import type { Invoice } from '../types/invoice'
import type { Provider } from '../types/provider'

function csvCell(value: string | number) {
  const text = String(value)
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}

function decimal(value: number | undefined, digits = 2) {
  return value == null ? '' : value.toFixed(digits).replace('.', ',')
}

export function buildAccountingCsv(
  month: string,
  invoices: Invoice[],
  providers: Provider[],
  integrateds: Integrated[],
) {
  const rows = invoices
    .filter((invoice) => invoice.status === 'validated' && invoice.date.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date) || a.internalNumber.localeCompare(b.internalNumber))
  const total = rows.reduce((sum, invoice) => sum + invoice.total, 0)
  const line = (...values: (string | number)[]) => values.map(csvCell).join(';')

  return [
    line('EXPORTACIÓN CONTABLE', 'Agroganadera Valdeón SL'),
    line('Mes', month),
    line('Nº facturas', rows.length),
    line('Importe total (€)', decimal(total)),
    '',
    line('Nº interno', 'Nº proveedor', 'Fecha', 'Proveedor', 'Integrado', 'Concepto', 'Kg', '€/kg', 'Porte (€)', 'Total (€)', 'Vencimiento', 'Forma de pago', 'Banco', 'Archivada'),
    ...rows.map((invoice) => line(
      invoice.internalNumber,
      invoice.supplierInvoiceNumber,
      invoice.date,
      providers.find((provider) => provider.id === invoice.providerId)?.name ?? invoice.providerId,
      invoice.integratedId == null
        ? ''
        : `#${invoice.integratedId} ${integrateds.find((integrated) => integrated.id === invoice.integratedId)?.name ?? ''}`.trim(),
      invoice.feedType ?? '',
      decimal(invoice.kg, 0),
      decimal(invoice.invoicedPricePerKg, 3),
      decimal(invoice.freight),
      decimal(invoice.total),
      invoice.dueDate,
      invoice.paymentMethod,
      invoice.bankId ?? '',
      invoice.archived ? 'Sí' : 'No',
    )),
  ].join('\r\n')
}
