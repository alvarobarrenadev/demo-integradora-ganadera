import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAppStore } from '../store/useAppStore'
import { PageHeader } from '../components/common/PageHeader'
import { Modal } from '../components/common/Modal'
import { fmtEUR, fmtPricePerKg } from '../utils/currency'
import { fmtNumber } from '../utils/dates'

type Tab = 'consumos' | 'tarifas' | 'analisis'
type Consumption = { kg: number; base: number; freight: number }

export function FeedPage() {
  const location = useLocation()
  const state = useAppStore()
  const applyAugustTariffs = useAppStore((s) => s.applyAugustTariffs)
  const [tab, setTab] = useState<Tab>(location.pathname.endsWith('/tarifas') ? 'tarifas' : 'consumos')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const augustApplied = state.tariffs.some((t) => t.month === '2026-08')

  return (
    <div>
      <PageHeader
        title="Pienso y tarifas"
        actions={
          <button type="button" className="btn btn-primary" disabled={augustApplied} onClick={() => setConfirmOpen(true)}>
            {augustApplied ? 'Tarifa de agosto aplicada' : 'Aplicar tarifa de agosto'}
          </button>
        }
      />

      <div className="tabs">
        <button type="button" className={`tab${tab === 'consumos' ? ' is-active' : ''}`} onClick={() => setTab('consumos')}>Consumos</button>
        <button type="button" className={`tab${tab === 'tarifas' ? ' is-active' : ''}`} onClick={() => setTab('tarifas')}>Tarifas</button>
        <button type="button" className={`tab${tab === 'analisis' ? ' is-active' : ''}`} onClick={() => setTab('analisis')}>Análisis</button>
      </div>

      {tab === 'consumos' ? <ConsumosView /> : null}
      {tab === 'tarifas' ? <TarifasView /> : null}
      {tab === 'analisis' ? <AnalisisView /> : null}

      {confirmOpen ? (
        <Modal
          title="Aplicar tarifa de agosto"
          onClose={() => setConfirmOpen(false)}
          actions={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={() => { applyAugustTariffs(); setConfirmOpen(false) }}>
                Confirmar
              </button>
            </>
          }
        >
          Se añadirán las nuevas tarifas de agosto para los cuatro proveedores de pienso. VetSalud permanece estable en 0,512 €/kg.
        </Modal>
      ) : null}
    </div>
  )
}

function addConsumption(map: Map<string, Consumption>, key: string, kg: number, base: number, freight: number) {
  const current = map.get(key) ?? { kg: 0, base: 0, freight: 0 }
  map.set(key, { kg: current.kg + kg, base: current.base + base, freight: current.freight + freight })
}

function ConsumosView() {
  const state = useAppStore()
  const months = [...new Set(state.invoices.map((invoice) => invoice.date.slice(0, 7)))].sort().reverse()
  const [month, setMonth] = useState(months[0] ?? '2026-07')

  const { byProvider, byIntegrated } = useMemo(() => {
    const providers = new Map<string, Consumption>()
    const integrateds = new Map<string, Consumption>()
    for (const invoice of state.invoices) {
      if (invoice.status !== 'validated' || !invoice.date.startsWith(month) || invoice.kg == null || invoice.invoicedPricePerKg == null || invoice.integratedId == null) continue
      if (state.providers.find((provider) => provider.id === invoice.providerId)?.category !== 'feed') continue
      const base = invoice.kg * invoice.invoicedPricePerKg
      addConsumption(providers, invoice.providerId, invoice.kg, base, invoice.freight)
      addConsumption(integrateds, String(invoice.integratedId), invoice.kg, base, invoice.freight)
    }
    return { byProvider: [...providers.entries()], byIntegrated: [...integrateds.entries()] }
  }, [month, state.invoices, state.providers])

  const total = byProvider.reduce((sum, [, row]) => ({
    kg: sum.kg + row.kg,
    base: sum.base + row.base,
    freight: sum.freight + row.freight,
  }), { kg: 0, base: 0, freight: 0 })

  return (
    <>
      <div className="toolbar mb-4">
        <div className="field">
          <label className="field__label" htmlFor="feed-month">Mes</label>
          <select id="feed-month" className="select" value={month} onChange={(event) => setMonth(event.target.value)}>
            {months.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
      </div>
      <div className="kpi-grid">
        <FeedKpi label="Kg del mes" value={fmtNumber(total.kg)} />
        <FeedKpi label="Pienso" value={fmtEUR(total.base)} />
        <FeedKpi label="Portes" value={fmtEUR(total.freight)} />
        <FeedKpi label="Coste efectivo" value={total.kg ? fmtPricePerKg((total.base + total.freight) / total.kg) : '—'} />
      </div>
      <div className="grid-2">
        <ConsumptionTable
          title="Resumen por proveedor"
          rows={byProvider.map(([id, values]) => ({ label: state.providers.find((provider) => provider.id === id)?.name ?? id, ...values }))}
        />
        <ConsumptionTable
          title="Resumen por integrado"
          rows={byIntegrated.map(([id, values]) => ({ label: `#${id} ${state.integrateds.find((integrated) => integrated.id === Number(id))?.name ?? ''}`, ...values }))}
        />
      </div>
    </>
  )
}

function ConsumptionTable({ title, rows }: { title: string; rows: Array<Consumption & { label: string }> }) {
  return (
    <div className="card">
      <div className="section-title">{title}</div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Nombre</th><th className="cell-num">Kg</th><th className="cell-num">Total</th><th className="cell-num">€/kg</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={4}>Sin consumos validados en este mes.</td></tr> : null}
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="cell-strong">{row.label}</td>
                <td className="cell-num">{fmtNumber(row.kg)}</td>
                <td className="cell-num">{fmtEUR(row.base + row.freight)}</td>
                <td className="cell-num">{fmtPricePerKg((row.base + row.freight) / row.kg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TarifasView() {
  const state = useAppStore()
  const feedProviders = state.providers.filter((provider) => provider.category === 'feed')
  const [providerId, setProviderId] = useState(feedProviders[0]?.id ?? '')
  const months = [...new Set(state.tariffs.map((tariff) => tariff.month))].sort()
  const lastTwo = months.slice(-2)

  const rows = useMemo(() => {
    const map = new Map<string, Record<string, number>>()
    for (const tariff of state.tariffs.filter((item) => item.providerId === providerId)) {
      const prices = map.get(tariff.feedType) ?? {}
      prices[tariff.month] = tariff.pricePerKg
      map.set(tariff.feedType, prices)
    }
    return [...map.entries()].map(([feedType, prices]) => ({ feedType, prices }))
  }, [providerId, state.tariffs])

  const chartData = months.map((month) => {
    const point: Record<string, string | number> = { month }
    for (const row of rows) if (row.prices[month] != null) point[row.feedType] = row.prices[month]
    return point
  })
  const colors = ['var(--color-accent)', 'var(--color-info)', 'var(--color-warning-strong)', 'var(--color-danger)']

  return (
    <>
      <div className="toolbar mb-4">
        <div className="field">
          <label className="field__label" htmlFor="tariff-provider">Proveedor</label>
          <select id="tariff-provider" className="select" value={providerId} onChange={(event) => setProviderId(event.target.value)}>
            {feedProviders.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
          </select>
        </div>
      </div>
      <div className="card mb-4">
        <div className="section-title">Evolución histórica de precios</div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
            <Tooltip formatter={(value) => fmtPricePerKg(Number(value))} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
            <Legend />
            {rows.map((row, index) => <Line key={row.feedType} type="monotone" dataKey={row.feedType} stroke={colors[index % colors.length]} strokeWidth={2} dot={false} connectNulls />)}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Pienso</th>{lastTwo.map((month) => <th key={month} className="cell-num">{month}</th>)}<th className="cell-num">Variación</th></tr></thead>
          <tbody>
            {rows.map((row) => {
              const [previous, current] = lastTwo.map((month) => row.prices[month])
              const variation = previous && current ? ((current - previous) / previous) * 100 : null
              return (
                <tr key={row.feedType}>
                  <td className="cell-strong">{row.feedType}</td>
                  {lastTwo.map((month) => <td key={month} className="cell-num">{row.prices[month] != null ? fmtPricePerKg(row.prices[month]) : '—'}</td>)}
                  <td className="cell-num">{variation == null ? '—' : `${variation >= 0 ? '+' : ''}${variation.toFixed(1)}%`}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

function AnalisisView() {
  const state = useAppStore()
  const [month, setMonth] = useState('2026-07')
  const months = [...new Set(state.feedConsumptionHistory.map((row) => row.month))].sort().reverse()
  const monthRows = state.feedConsumptionHistory.filter((row) => row.month === month)
  const monthKg = monthRows.reduce((sum, row) => sum + row.kg, 0)
  const monthTotal = monthRows.reduce((sum, row) => sum + row.total, 0)

  const annual = useMemo(() => {
    const map = new Map<string, { kg: number; total: number }>()
    for (const row of state.feedConsumptionHistory) {
      const year = row.month.slice(0, 4)
      const current = map.get(year) ?? { kg: 0, total: 0 }
      map.set(year, { kg: current.kg + row.kg, total: current.total + row.total })
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [state.feedConsumptionHistory])

  const trend = useMemo(() => {
    const map = new Map<string, { month: string; kg2025: number; kg2026: number }>()
    for (const row of state.feedConsumptionHistory) {
      const monthNumber = row.month.slice(5)
      const point = map.get(monthNumber) ?? { month: monthNumber, kg2025: 0, kg2026: 0 }
      if (row.month.startsWith('2025')) point.kg2025 += row.kg
      if (row.month.startsWith('2026')) point.kg2026 += row.kg
      map.set(monthNumber, point)
    }
    return [...map.values()].sort((a, b) => a.month.localeCompare(b.month))
  }, [state.feedConsumptionHistory])

  const previous = annual.find(([year]) => year === '2025')?.[1]
  const current = annual.find(([year]) => year === '2026')?.[1]
  const yoy = previous && current ? ((current.kg - previous.kg) / previous.kg) * 100 : null

  return (
    <>
      <div className="toolbar mb-4">
        <div className="field">
          <label className="field__label" htmlFor="analysis-month">Mes del cuadro de mando</label>
          <select id="analysis-month" className="select" value={month} onChange={(event) => setMonth(event.target.value)}>
            {months.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
      </div>
      <div className="kpi-grid">
        <FeedKpi label={`Kg ${month}`} value={fmtNumber(monthKg)} />
        <FeedKpi label={`Coste ${month}`} value={fmtEUR(monthTotal)} />
        <FeedKpi label="Coste efectivo" value={monthKg ? fmtPricePerKg(monthTotal / monthKg) : '—'} />
        <FeedKpi label="Variación anual kg" value={yoy == null ? '—' : `${yoy >= 0 ? '+' : ''}${yoy.toFixed(1)}%`} />
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="section-title">Consumo mensual: 2025 frente a 2026</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <YAxis hide />
              <Tooltip formatter={(value) => `${fmtNumber(Number(value))} kg`} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
              <Legend />
              <Line type="monotone" dataKey="kg2025" name="2025" stroke="var(--color-text-muted)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="kg2026" name="2026" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="section-title">Resumen anual</div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Año</th><th className="cell-num">Kg</th><th className="cell-num">Coste</th><th className="cell-num">€/kg</th></tr></thead>
              <tbody>{annual.map(([year, values]) => <tr key={year}><td className="cell-strong">{year}</td><td className="cell-num">{fmtNumber(values.kg)}</td><td className="cell-num">{fmtEUR(values.total)}</td><td className="cell-num">{fmtPricePerKg(values.total / values.kg)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

function FeedKpi({ label, value }: { label: string; value: string }) {
  return <div className="kpi-card"><div className="kpi-card__label">{label}</div><div className="kpi-card__value">{value}</div></div>
}
