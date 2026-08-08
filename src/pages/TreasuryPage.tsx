import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { PageHeader } from '../components/common/PageHeader'
import { DataTable, type DataTableColumn } from '../components/common/DataTable'
import { StatusBadge } from '../components/common/StatusBadge'
import { selectDailyCashForecast, selectPaymentsNext7Days, selectWeeklyCashForecast } from '../store/selectors'
import { fmtEUR } from '../utils/currency'
import { formatDateEs, DEMO_REFERENCE_DATE } from '../utils/dates'
import type { Payment, Receivable } from '../types/treasury'

type Tab = 'resumen' | 'pagos' | 'cobros' | 'clientes'

export function TreasuryPage() {
  const state = useAppStore()
  const [tab, setTab] = useState<Tab>('resumen')

  const paymentsNext7 = selectPaymentsNext7Days(state)
  const paymentsNext7Total = paymentsNext7.reduce((s, p) => s + p.amount, 0)
  const receivablesTotal = state.receivables.filter((r) => !r.paidAt).reduce((s, r) => s + r.amount, 0)
  const pendingPaymentsTotal = state.payments.filter((p) => p.status !== 'paid').reduce((s, p) => s + p.amount, 0)
  const weekly = selectWeeklyCashForecast(state, 4)
  const netNext7 = receivablesTotal - pendingPaymentsTotal

  return (
    <div>
      <PageHeader title="Tesorería" />

      <div className="tabs">
        <button type="button" className={`tab${tab === 'resumen' ? ' is-active' : ''}`} onClick={() => setTab('resumen')}>Resumen</button>
        <button type="button" className={`tab${tab === 'pagos' ? ' is-active' : ''}`} onClick={() => setTab('pagos')}>Pagos</button>
        <button type="button" className={`tab${tab === 'cobros' ? ' is-active' : ''}`} onClick={() => setTab('cobros')}>Cobros</button>
        <button type="button" className={`tab${tab === 'clientes' ? ' is-active' : ''}`} onClick={() => setTab('clientes')}>Clientes</button>
      </div>

      {tab === 'resumen' ? (
        <ResumenTab
          paymentsNext7Total={paymentsNext7Total}
          receivablesTotal={receivablesTotal}
          netNext7={netNext7}
          weekly={weekly}
        />
      ) : null}
      {tab === 'pagos' ? <PagosTab /> : null}
      {tab === 'cobros' ? <CobrosTab /> : null}
      {tab === 'clientes' ? <ClientesTab /> : null}
    </div>
  )
}

function ResumenTab({
  paymentsNext7Total,
  receivablesTotal,
  netNext7,
  weekly,
}: {
  paymentsNext7Total: number
  receivablesTotal: number
  netNext7: number
  weekly: ReturnType<typeof selectWeeklyCashForecast>
}) {
  const state = useAppStore()
  const daily = selectDailyCashForecast(state, 7)

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-card__label">Cobros pendientes</div><div className="kpi-card__value">{fmtEUR(receivablesTotal)}</div></div>
        <div className="kpi-card"><div className="kpi-card__label">Pagos próximos 7 días</div><div className="kpi-card__value">{fmtEUR(paymentsNext7Total)}</div></div>
        <div className="kpi-card"><div className="kpi-card__label">Neto próximo 7d</div><div className="kpi-card__value">{fmtEUR(netNext7)}</div></div>
      </div>

      <div className="card mb-4">
        <div className="section-title">Previsión semanal</div>
        <div className="forecast-grid forecast-grid--weeks4 scroll-x">
          <div />
          {weekly.map((w) => (
            <div key={w.start} className="forecast-grid__cell forecast-grid__cell--muted">
              {formatDateEs(w.start).slice(0, 5)}–{formatDateEs(w.end).slice(0, 5)}
            </div>
          ))}
          <div className="forecast-grid__label">Cobros</div>
          {weekly.map((w) => (
            <div key={`r-${w.start}`} className="forecast-grid__cell forecast-grid__cell--positive">{fmtEUR(w.receivables)}</div>
          ))}
          <div className="forecast-grid__label forecast-grid__row--divider">Pagos</div>
          {weekly.map((w) => (
            <div key={`p-${w.start}`} className="forecast-grid__cell forecast-grid__row--divider forecast-grid__cell--negative">{fmtEUR(w.payments)}</div>
          ))}
          <div className="forecast-grid__label forecast-grid__row--divider forecast-grid__label--strong">Neto</div>
          {weekly.map((w) => (
            <div key={`n-${w.start}`} className="forecast-grid__cell forecast-grid__row--divider">{w.net >= 0 ? '+' : ''}{fmtEUR(w.net)}</div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-title">Calendario diario (próximos 7 días desde {formatDateEs(DEMO_REFERENCE_DATE)})</div>
        <div className="kv-list">
          {daily.map((d) => (
            <div key={d.date} className="kv-row">
              <span className="kv-row__label">{formatDateEs(d.date)}</span>
              <span className="kv-row__value">{d.net >= 0 ? '+' : ''}{fmtEUR(d.net)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function PagosTab() {
  const state = useAppStore()
  const columns: DataTableColumn<Payment>[] = [
    { key: 'ben', header: 'Beneficiario', render: (p) => <span className="cell-strong">{p.beneficiary}</span> },
    { key: 'src', header: 'Origen', render: (p) => (p.sourceType === 'settlement' ? 'Liquidación' : 'Factura') },
    { key: 'due', header: 'Vencimiento', render: (p) => formatDateEs(p.dueDate) },
    { key: 'bank', header: 'Banco', render: (p) => p.bankId ?? '—' },
    { key: 'method', header: 'Forma de pago', render: (p) => p.paymentMethod },
    { key: 'status', header: 'Estado', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'amount', header: 'Importe', numeric: true, render: (p) => <span className="cell-strong">{fmtEUR(p.amount)}</span> },
  ]
  const rows = [...state.payments].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  return <DataTable columns={columns} rows={rows} rowKey={(p) => p.id} />
}

function CobrosTab() {
  const state = useAppStore()
  const columns: DataTableColumn<Receivable>[] = [
    { key: 'client', header: 'Cliente', render: (r) => <span className="cell-strong">{state.clients.find((c) => c.id === r.clientId)?.name}</span> },
    { key: 'date', header: 'Fecha', render: (r) => formatDateEs(r.date) },
    { key: 'due', header: 'Vencimiento', render: (r) => formatDateEs(r.dueDate) },
    { key: 'method', header: 'Forma de pago', render: (r) => r.paymentMethod },
    {
      key: 'status',
      header: 'Estado',
      render: (r) => {
        if (r.paidAt) return <StatusBadge status="paid" />
        return <StatusBadge status={r.dueDate < DEMO_REFERENCE_DATE ? 'overdue' : 'pending'} />
      },
    },
    { key: 'amount', header: 'Importe', numeric: true, render: (r) => <span className="cell-strong">{fmtEUR(r.amount)}</span> },
  ]
  const rows = [...state.receivables].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  return <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
}

function ClientesTab() {
  const state = useAppStore()
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Forma de pago</th>
            <th>Banco</th>
            <th className="cell-num">Media días de cobro</th>
          </tr>
        </thead>
        <tbody>
          {state.clients.map((c) => (
            <tr key={c.id}>
              <td className="cell-strong">{c.name}</td>
              <td>{c.paymentMethod}</td>
              <td>{c.bankId ?? '—'}</td>
              <td className="cell-num">{c.avgCollectionDays} días</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
