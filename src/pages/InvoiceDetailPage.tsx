import { useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { getApplicableTariff, calculatePriceDiscrepancy } from '../domain/invoices'
import { fmtEUR, fmtPricePerKg } from '../utils/currency'
import { formatDateEs, fmtNumber } from '../utils/dates'

export function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const state = useAppStore()
  const validateInvoice = useAppStore((s) => s.validateInvoice)

  const invoice = state.invoices.find((i) => i.id === id)

  if (!invoice) {
    return (
      <div>
        <p className="page-subtitle">Factura no encontrada.</p>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/facturas')}>Volver a la bandeja</button>
      </div>
    )
  }

  const provider = state.providers.find((p) => p.id === invoice.providerId)
  const integrated = state.integrateds.find((i) => i.id === invoice.integratedId)
  const tariff = invoice.feedType ? getApplicableTariff(invoice.providerId, invoice.feedType, invoice.date, state.tariffs) : undefined
  const discrepancy = calculatePriceDiscrepancy(invoice, tariff)
  const activeCeba = integrated?.activeCebaId
    ? state.cebas.find((ceba) => ceba.id === integrated.activeCebaId && ceba.status !== 'closed')
    : undefined

  const isValidated = invoice.status === 'validated'
  const subtotal = invoice.kg != null && invoice.invoicedPricePerKg != null ? invoice.kg * invoice.invoicedPricePerKg : 0

  return (
    <div>
      <div className="app-header__breadcrumb">
        <button type="button" className="link-button" onClick={() => navigate('/facturas')}>Facturas</button>
        {' › '}Factura {invoice.internalNumber}
      </div>
      <div className="detail-header detail-header--tight">
        <h1 className="page-title">Detalle de factura</h1>
        <div className="page-header__actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/facturas')}>Volver a la bandeja</button>
          {!isValidated && discrepancy.hasDiscrepancy ? (
            <>
              <button type="button" className="btn btn-danger" disabled title="Simulado — sin backend real">Reclamar a proveedor</button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!activeCeba}
                title={!activeCeba ? 'No se puede propagar: el integrado no tiene una ceba activa' : undefined}
                onClick={() => validateInvoice(invoice.id)}
              >
                Aceptar sobreprecio
              </button>
            </>
          ) : null}
          {!isValidated && !discrepancy.hasDiscrepancy ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!activeCeba}
              title={!activeCeba ? 'No se puede propagar: el integrado no tiene una ceba activa' : undefined}
              onClick={() => validateInvoice(invoice.id)}
            >
              Validar factura
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid-aside-right">
        <div className="card">
          <div className="invoice-doc-card__header">
            <span className="kpi-card__label kpi-card__label--flush">Documento original (PDF simulado)</span>
          </div>
          <div className="invoice-detail-doc">
            <div className="invoice-doc__header">
              <div>
                <div className="invoice-doc__provider">{provider?.name.toUpperCase()}</div>
                <div className="invoice-doc__fine invoice-doc__fine--mt">Pol. Ind. · CIF A-00000000</div>
              </div>
              <div className="invoice-doc__meta">
                <b>FACTURA</b><br />
                Nº {invoice.supplierInvoiceNumber}<br />
                Fecha: {formatDateEs(invoice.date)}
              </div>
            </div>
            <div className="invoice-doc__fine invoice-doc__fine--mb">
              Cliente: Agroganadera Valdeón SL<br />
              {integrated ? `#${integrated.id} ${integrated.name}` : 'Sin integrado asociado'}
            </div>
            <div className="invoice-doc__line">
              <div>{invoice.feedType ?? '—'}</div>
              <div>{invoice.kg != null ? fmtNumber(invoice.kg) : '—'}</div>
              <div>{invoice.invoicedPricePerKg != null ? fmtPricePerKg(invoice.invoicedPricePerKg) : '—'}</div>
              <div className="text-right">{fmtEUR(subtotal)}</div>
            </div>
            {invoice.freight > 0 ? (
              <div className="invoice-doc__freight">Porte: {fmtEUR(invoice.freight)}</div>
            ) : null}
            <div className="invoice-doc__total-row">
              <div className="invoice-doc__total">TOTAL: {fmtEUR(invoice.total)}</div>
            </div>
          </div>
        </div>

        <div className="flex-col gap-4">
          {discrepancy.hasDiscrepancy ? (
            <div className="discrepancy-panel">
              <div className="discrepancy-panel__title">⚠ Discrepancia de precio {isValidated ? '(histórica)' : 'detectada'}</div>
              <div className="grid-3-tight">
                <div>
                  <div className="kpi-card__label mb-1">Facturado</div>
                  <div className="text-strong-danger">{invoice.invoicedPricePerKg != null ? fmtPricePerKg(invoice.invoicedPricePerKg) : '—'}</div>
                </div>
                <div>
                  <div className="kpi-card__label mb-1">Tarifa vigente</div>
                  <div className="text-strong">{tariff ? fmtPricePerKg(tariff.pricePerKg) : '—'}</div>
                </div>
                <div>
                  <div className="kpi-card__label mb-1">Impacto</div>
                  <div className="text-strong-danger">{discrepancy.amount > 0 ? '+' : ''}{fmtEUR(discrepancy.amount)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="ok-panel"><span>✓</span><span>Todo cuadra</span></div>
          )}

          <div className="card card--tight">
            <div className="kpi-card__label">Datos extraídos</div>
            <div className="mt-3">
              <div className="kv-row"><span className="kv-row__label">Proveedor</span><span className="kv-row__value">{provider?.name}</span></div>
              <div className="kv-row"><span className="kv-row__label">Nº factura</span><span className="kv-row__value">{invoice.supplierInvoiceNumber}</span></div>
              <div className="kv-row"><span className="kv-row__label">Fecha</span><span className="kv-row__value">{formatDateEs(invoice.date)}</span></div>
              <div className="kv-row"><span className="kv-row__label">Integrado</span><span className="kv-row__value">{integrated ? `#${integrated.id} ${integrated.name}` : '—'}</span></div>
              <div className="kv-row"><span className="kv-row__label">Tipo de pienso</span><span className="kv-row__value">{invoice.feedType ?? '—'}</span></div>
              <div className="kv-row"><span className="kv-row__label">Kg</span><span className="kv-row__value">{invoice.kg != null ? fmtNumber(invoice.kg) : '—'}</span></div>
              <div className="kv-row"><span className="kv-row__label">Precio facturado</span><span className="kv-row__value">{invoice.invoicedPricePerKg != null ? fmtPricePerKg(invoice.invoicedPricePerKg) : '—'}</span></div>
              <div className="kv-row"><span className="kv-row__label">Tarifa vigente</span><span className="kv-row__value">{tariff ? fmtPricePerKg(tariff.pricePerKg) : '—'}</span></div>
              {invoice.freight > 0 ? (
                <div className="kv-row"><span className="kv-row__label">Porte</span><span className="kv-row__value">{fmtEUR(invoice.freight)}</span></div>
              ) : null}
              <div className="kv-row kv-row--divider"><span className="kv-row__label">Total</span><span className="kv-row__value">{fmtEUR(invoice.total)}</span></div>
              <div className="kv-row"><span className="kv-row__label">Vencimiento</span><span className="kv-row__value">{formatDateEs(invoice.dueDate)}</span></div>
              <div className="kv-row"><span className="kv-row__label">Forma de pago</span><span className="kv-row__value">{invoice.paymentMethod}{invoice.bankId ? ` · ${invoice.bankId}` : ''}</span></div>
              <div className="kv-row"><span className="kv-row__label">Estado</span><span className="kv-row__value"><StatusInline status={invoice.status} /></span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusInline({ status }: { status: string }) {
  const labels: Record<string, string> = { pending: 'Pendiente', validated: 'Validada', discrepancy: 'Discrepancia' }
  return <>{labels[status] ?? status}</>
}
