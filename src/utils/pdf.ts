import jsPDF from 'jspdf'
import { fmtEUR } from './currency'
import { formatDateEs } from './dates'

export interface EmittedInvoicePdfData {
  emittedNumber: string
  integratedName: string
  date: string
  baseAmount: number
  bonusAmount: number
  grossAmount: number
  retentionAmount: number
  netAmount: number
}

/**
 * Real downloadable PDF for a "factura emitida" — an explicit brief
 * requirement, not just an on-screen preview (which the page also renders,
 * separately, from the same data).
 */
export function downloadEmittedInvoicePdf(data: EmittedInvoicePdfData): void {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('Agroganadera Valdeón SL', 20, 20)
  doc.setFontSize(12)
  doc.text('Factura emitida', 20, 30)

  doc.setFontSize(10)
  doc.text(`Número: ${data.emittedNumber}`, 20, 42)
  doc.text(`Fecha: ${formatDateEs(data.date)}`, 20, 48)
  doc.text(`Integrado: ${data.integratedName}`, 20, 54)

  doc.line(20, 62, 190, 62)

  let y = 70
  const row = (label: string, value: string) => {
    doc.text(label, 20, y)
    doc.text(value, 190, y, { align: 'right' })
    y += 8
  }
  row('Liquidación base', fmtEUR(data.baseAmount))
  row('Bonus por conversión', fmtEUR(data.bonusAmount))
  doc.line(20, y - 2, 190, y - 2)
  row('Bruto', fmtEUR(data.grossAmount))
  row('Retención (2%)', `− ${fmtEUR(data.retentionAmount)}`)
  doc.line(20, y - 2, 190, y - 2)

  doc.setFontSize(13)
  row('NETO A PAGAR', fmtEUR(data.netAmount))

  doc.save(`${data.emittedNumber}.pdf`)
}
