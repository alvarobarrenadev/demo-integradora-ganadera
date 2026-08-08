import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { PageHeader } from '../components/common/PageHeader'
import { DataTable, type DataTableColumn } from '../components/common/DataTable'
import { StatusBadge } from '../components/common/StatusBadge'
import { ProcessingOverlay } from '../components/common/ProcessingOverlay'
import { fmtEUR, fmtPricePerKg } from '../utils/currency'
import { formatDateEs, fmtNumber } from '../utils/dates'
import type { Invoice } from '../types/invoice'
import { canOperate } from '../domain/roles'

const PROCESSING_STEPS = ['Recibiendo factura...', 'Procesando documento...', 'Extrayendo datos...', 'Factura procesada']

type Tab = 'todas' | 'pendientes' | 'discrepancias' | 'validadas'

export function InvoicesPage() {
  const navigate = useNavigate()
  const state = useAppStore()
  const simulateIncomingInvoice = useAppStore((s) => s.simulateIncomingInvoice)

  const [tab, setTab] = useState<Tab>('todas')
  const [query, setQuery] = useState('')
  const [processingStep, setProcessingStep] = useState<number | null>(null)

  const discrepanciaCount = state.invoices.filter((i) => i.status === 'discrepancy').length

  const filtered = useMemo(() => {
    let rows = state.invoices
    if (tab === 'pendientes') rows = rows.filter((i) => i.status === 'pending')
    if (tab === 'discrepancias') rows = rows.filter((i) => i.status === 'discrepancy')
    if (tab === 'validadas') rows = rows.filter((i) => i.status === 'validated')
    const q = query.trim().toLowerCase()
    if (q) {
      rows = rows.filter((i) => {
        const integrated = state.integrateds.find((x) => x.id === i.integratedId)
        const provider = state.providers.find((p) => p.id === i.providerId)
        return (
          i.internalNumber.toLowerCase().includes(q) ||
          provider?.name.toLowerCase().includes(q) ||
          integrated?.name.toLowerCase().includes(q) ||
          i.date.includes(q)
        )
      })
    }
    return [...rows].sort((a, b) => b.date.localeCompare(a.date) || b.internalNumber.localeCompare(a.internalNumber))
  }, [state.invoices, state.integrateds, state.providers, tab, query])

  const handleSimulate = () => {
    setProcessingStep(1)
    let step = 1
    const advance = () => {
      window.setTimeout(() => {
        if (step < PROCESSING_STEPS.length) {
          step += 1
          setProcessingStep(step)
          advance()
        } else {
          simulateIncomingInvoice()
          setProcessingStep(null)
          const newId = useAppStore.getState().lastSimulatedInvoiceId
          if (newId) navigate(`/facturas/${newId}`)
        }
      }, 700)
    }
    advance()
  }

  const columns: DataTableColumn<Invoice>[] = [
    { key: 'num', header: 'Nº int.', render: (i) => <span className="cell-strong">{i.internalNumber}</span> },
    { key: 'prov', header: 'Proveedor', render: (i) => state.providers.find((p) => p.id === i.providerId)?.name ?? i.providerId },
    { key: 'sup', header: 'Nº factura', render: (i) => i.supplierInvoiceNumber },
    { key: 'date', header: 'Fecha', render: (i) => formatDateEs(i.date) },
    {
      key: 'integ',
      header: 'Integrado',
      render: (i) => (i.integratedId != null ? `#${i.integratedId} ${state.integrateds.find((x) => x.id === i.integratedId)?.name ?? ''}` : '—'),
    },
    { key: 'feed', header: 'Pienso', render: (i) => i.feedType ?? '—' },
    { key: 'kg', header: 'Kg', numeric: true, render: (i) => (i.kg != null ? fmtNumber(i.kg) : '—') },
    { key: 'price', header: '€/kg', numeric: true, render: (i) => (i.invoicedPricePerKg != null ? fmtPricePerKg(i.invoicedPricePerKg) : '—') },
    { key: 'total', header: 'Total', numeric: true, render: (i) => <span className="cell-strong">{fmtEUR(i.total)}</span> },
    { key: 'due', header: 'Vence', render: (i) => formatDateEs(i.dueDate) },
    { key: 'status', header: 'Estado', render: (i) => <StatusBadge status={i.status} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Facturas"
        subtitle="Gestión y conciliación de facturas de pienso."
        actions={canOperate(state.currentRole) ? (
          <button type="button" className="btn btn-primary" onClick={handleSimulate}>
            + Simular factura entrante
          </button>
        ) : null}
      />

      <div className="tabs">
        <button type="button" className={`tab${tab === 'todas' ? ' is-active' : ''}`} onClick={() => setTab('todas')}>Todas</button>
        <button type="button" className={`tab${tab === 'pendientes' ? ' is-active' : ''}`} onClick={() => setTab('pendientes')}>Pendientes</button>
        <button type="button" className={`tab${tab === 'discrepancias' ? ' is-active' : ''}`} onClick={() => setTab('discrepancias')}>
          Discrepancias {discrepanciaCount > 0 ? <span className="tag-count">{discrepanciaCount}</span> : null}
        </button>
        <button type="button" className={`tab${tab === 'validadas' ? ' is-active' : ''}`} onClick={() => setTab('validadas')}>Validadas</button>
      </div>

      <div className="toolbar">
        <input
          className="input search-field"
          placeholder="Buscar por nº, proveedor, integrado, fecha..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar facturas"
        />
      </div>

      <DataTable columns={columns} rows={filtered} rowKey={(i) => i.id} onRowClick={(i) => navigate(`/facturas/${i.id}`)} />

      {processingStep != null ? (
        <ProcessingOverlay label={PROCESSING_STEPS[processingStep - 1]} step={processingStep} totalSteps={PROCESSING_STEPS.length} />
      ) : null}
    </div>
  )
}
