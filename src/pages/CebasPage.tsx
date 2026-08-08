import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { PageHeader } from '../components/common/PageHeader'
import { DataTable, type DataTableColumn } from '../components/common/DataTable'
import { StatusBadge } from '../components/common/StatusBadge'
import { calculateConversion } from '../domain/cebas'
import { selectActiveCebas, selectAverageConversion, selectClosedCebas, selectReadyToCloseCebas } from '../store/selectors'
import { formatDateEs, fmtNumber } from '../utils/dates'
import type { Ceba } from '../types/ceba'

type Tab = 'activas' | 'todas' | 'resumen'

export function CebasPage() {
  const navigate = useNavigate()
  const state = useAppStore()
  const [tab, setTab] = useState<Tab>('activas')

  const active = selectActiveCebas(state)
  const readyToClose = selectReadyToCloseCebas(state)
  const closed = selectClosedCebas(state)
  const avgConversion = selectAverageConversion(state)

  const rows = tab === 'todas' ? state.cebas : active

  const columns: DataTableColumn<Ceba>[] = [
    { key: 'id', header: 'Ceba', render: (c) => <span className="cell-strong">{c.id}</span> },
    { key: 'integ', header: 'Integrado', render: (c) => `#${c.integratedId} ${state.integrateds.find((i) => i.id === c.integratedId)?.name ?? ''}` },
    { key: 'entry', header: 'Entrada', render: (c) => formatDateEs(c.entryDate) },
    { key: 'animals', header: 'Animales', numeric: true, render: (c) => fmtNumber(c.animalsEntered) },
    { key: 'feed', header: 'Kg pienso', numeric: true, render: (c) => fmtNumber(c.feedKg) },
    { key: 'conv', header: 'Conversión', numeric: true, render: (c) => calculateConversion(c)?.toFixed(2) ?? '—' },
    { key: 'deaths', header: 'Bajas', numeric: true, render: (c) => fmtNumber(c.deaths) },
    { key: 'status', header: 'Estado', render: (c) => <StatusBadge status={c.status} /> },
  ]

  return (
    <div>
      <PageHeader title="Cebas" />

      <div className="kpi-grid">
        <KpiInline label="Activas" value={active.length} />
        <KpiInline label="Listas para cierre" value={readyToClose.length} warning={readyToClose.length > 0} />
        <KpiInline label="Cerradas" value={closed.length} />
        <KpiInline label="Conversión media" value={avgConversion != null ? avgConversion.toFixed(2) : '—'} />
      </div>

      <div className="tabs">
        <button type="button" className={`tab${tab === 'activas' ? ' is-active' : ''}`} onClick={() => setTab('activas')}>Activas</button>
        <button type="button" className={`tab${tab === 'todas' ? ' is-active' : ''}`} onClick={() => setTab('todas')}>Todas</button>
        <button type="button" className={`tab${tab === 'resumen' ? ' is-active' : ''}`} onClick={() => setTab('resumen')}>Resumen global</button>
      </div>

      {tab === 'resumen' ? (
        <CebaSummary />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(c) => c.id} onRowClick={(c) => navigate(`/cebas/${c.id}`)} />
      )}
    </div>
  )
}

function KpiInline({ label, value, warning }: { label: string; value: number | string; warning?: boolean }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card__label">{label}</div>
      <div className={`kpi-card__value${warning ? ' kpi-card__value--warning' : ''}`}>{value}</div>
    </div>
  )
}

function CebaSummary() {
  const state = useAppStore()

  const ranking = useMemo(
    () =>
      state.cebas
        .map((c) => ({ ceba: c, conversion: calculateConversion(c) }))
        .filter((r): r is { ceba: Ceba; conversion: number } => r.conversion != null)
        .sort((a, b) => a.conversion - b.conversion),
    [state.cebas],
  )

  const originMatrix = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of state.cebas) {
      const integrated = state.integrateds.find((i) => i.id === c.integratedId)
      const provider = integrated ? state.providers.find((p) => p.id === integrated.feedProviderId) : undefined
      const key = `${c.origin} × ${provider?.name ?? '—'}`
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return [...map.entries()]
  }, [state.cebas, state.integrateds, state.providers])

  return (
    <div className="grid-2">
      <div className="card">
        <div className="section-title">Ranking por conversión (menor = mejor)</div>
        <div className="kv-list">
          {ranking.map((r, i) => (
            <div key={r.ceba.id} className="kv-row">
              <span className="kv-row__label">{i + 1}. {r.ceba.id} — #{r.ceba.integratedId}</span>
              <span className="kv-row__value">{r.conversion.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="section-title">Origen del lechón × pienso</div>
        <div className="kv-list">
          {originMatrix.map(([key, count]) => (
            <div key={key} className="kv-row">
              <span className="kv-row__label">{key}</span>
              <span className="kv-row__value">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
