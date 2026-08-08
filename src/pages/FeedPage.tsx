import { useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { PageHeader } from '../components/common/PageHeader'
import { Modal } from '../components/common/Modal'
import { fmtEUR, fmtPricePerKg } from '../utils/currency'
import { fmtNumber } from '../utils/dates'
import { selectFeedExpenseByMonth } from '../store/selectors'

type Tab = 'consumos' | 'tarifas' | 'analisis'

export function FeedPage() {
  const state = useAppStore()
  const applyAugustTariffs = useAppStore((s) => s.applyAugustTariffs)
  const [tab, setTab] = useState<Tab>('consumos')
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
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  applyAugustTariffs()
                  setConfirmOpen(false)
                }}
              >
                Confirmar
              </button>
            </>
          }
        >
          Se añadirán las nuevas tarifas de agosto para Piensos Norteña, NutriCampo, Piensos del Valle y AgroFeed. VetSalud
          (Medicado M-2) permanece estable en 0,512 €/kg. Esta acción no se puede repetir dos veces.
        </Modal>
      ) : null}
    </div>
  )
}

function ConsumosView() {
  const invoices = useAppStore((s) => s.invoices)
  const providers = useAppStore((s) => s.providers)

  const byProvider = useMemo(() => {
    const map = new Map<string, { kg: number; base: number; freight: number }>()
    for (const invoice of invoices) {
      if (invoice.status !== 'validated' || invoice.kg == null || invoice.invoicedPricePerKg == null) continue
      const provider = providers.find((p) => p.id === invoice.providerId)
      if (provider?.category !== 'feed') continue
      const entry = map.get(provider.id) ?? { kg: 0, base: 0, freight: 0 }
      entry.kg += invoice.kg
      entry.base += invoice.kg * invoice.invoicedPricePerKg
      entry.freight += invoice.freight
      map.set(provider.id, entry)
    }
    return [...map.entries()].map(([providerId, v]) => ({ provider: providers.find((p) => p.id === providerId)!, ...v }))
  }, [invoices, providers])

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Proveedor</th>
            <th className="cell-num">Kg</th>
            <th className="cell-num">Base pienso</th>
            <th className="cell-num">Porte</th>
            <th className="cell-num">Total</th>
            <th className="cell-num">€/kg efectivo</th>
          </tr>
        </thead>
        <tbody>
          {byProvider.map(({ provider, kg, base, freight }) => (
            <tr key={provider.id}>
              <td className="cell-strong">{provider.name}</td>
              <td className="cell-num">{fmtNumber(kg)}</td>
              <td className="cell-num">{fmtEUR(base)}</td>
              <td className="cell-num">{fmtEUR(freight)}</td>
              <td className="cell-num cell-strong">{fmtEUR(base + freight)}</td>
              <td className="cell-num">{kg > 0 ? fmtPricePerKg((base + freight) / kg) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TarifasView() {
  const state = useAppStore()
  const months = useMemo(() => [...new Set(state.tariffs.map((t) => t.month))].sort(), [state.tariffs])
  const lastTwo = months.slice(-2)

  const series = useMemo(() => {
    const map = new Map<string, { provider: string; feedType: string; prices: Record<string, number> }>()
    for (const t of state.tariffs) {
      if (!lastTwo.includes(t.month)) continue
      const key = `${t.providerId}:${t.feedType}`
      const provider = state.providers.find((p) => p.id === t.providerId)?.name ?? t.providerId
      const entry = map.get(key) ?? { provider, feedType: t.feedType, prices: {} }
      entry.prices[t.month] = t.pricePerKg
      map.set(key, entry)
    }
    return [...map.values()]
  }, [state.tariffs, state.providers, lastTwo])

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Pienso</th>
            {lastTwo.map((m) => <th key={m} className="cell-num">{m}</th>)}
            <th className="cell-num">Variación</th>
          </tr>
        </thead>
        <tbody>
          {series.map((s) => {
            const [prev, curr] = lastTwo.map((m) => s.prices[m])
            const variation = prev && curr ? ((curr - prev) / prev) * 100 : null
            return (
              <tr key={`${s.provider}-${s.feedType}`}>
                <td>{s.provider}</td>
                <td className="cell-strong">{s.feedType}</td>
                {lastTwo.map((m) => <td key={m} className="cell-num">{s.prices[m] != null ? fmtPricePerKg(s.prices[m]) : '—'}</td>)}
                <td className="cell-num">
                  {variation != null ? (
                    <span className={variation >= 0 ? 'badge badge--warning' : 'badge badge--success'}>
                      {variation >= 0 ? '+' : ''}{variation.toFixed(1)}%
                    </span>
                  ) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function AnalisisView() {
  const state = useAppStore()
  const expenseByMonth = selectFeedExpenseByMonth(state)

  const byYear = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of state.tariffs) {
      const year = t.month.slice(0, 4)
      map.set(year, (map.get(year) ?? 0) + t.pricePerKg)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [state.tariffs])

  return (
    <div className="grid-2">
      <div className="card">
        <div className="section-title">Gasto en pienso por mes (facturas validadas)</div>
        <div className="kv-list">
          {expenseByMonth.map((e) => (
            <div key={e.month} className="kv-row">
              <span className="kv-row__label">{e.month}</span>
              <span className="kv-row__value">{fmtEUR(e.total)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="section-title">Resumen anual (suma de tarifas €/kg por año, referencia)</div>
        <div className="kv-list">
          {byYear.map(([year, total]) => (
            <div key={year} className="kv-row">
              <span className="kv-row__label">{year}</span>
              <span className="kv-row__value">{total.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <p className="page-subtitle mt-3">Comparativa año anterior derivada del histórico de tarifas 2025 vs. 2026.</p>
      </div>
    </div>
  )
}
