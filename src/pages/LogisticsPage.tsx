import { useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { PageHeader } from '../components/common/PageHeader'
import { DataTable, type DataTableColumn } from '../components/common/DataTable'
import { StatusBadge } from '../components/common/StatusBadge'
import { generateId } from '../utils/ids'
import { formatDateEs, fmtNumber } from '../utils/dates'
import type { LogisticsMovement } from '../types/logistics'

export function LogisticsPage() {
  const state = useAppStore()
  const addLogisticsMovement = useAppStore((s) => s.addLogisticsMovement)
  const [showForm, setShowForm] = useState(false)

  const salidas = state.logisticsMovements.filter((m) => m.type === 'salida')

  const byMatadero = useMemo(() => summarize(salidas, (m) => m.matadero ?? '—'), [salidas])
  const byMonth = useMemo(() => summarize(state.logisticsMovements, (m) => m.date.slice(0, 7)), [state.logisticsMovements])
  const byDriver = useMemo(() => summarize(salidas, (m) => m.driver ?? '—'), [salidas])

  const columns: DataTableColumn<LogisticsMovement>[] = [
    { key: 'date', header: 'Fecha', render: (m) => formatDateEs(m.date) },
    { key: 'type', header: 'Tipo', render: (m) => (m.type === 'salida' ? 'Salida' : 'Entrada') },
    { key: 'integ', header: 'Integrado', render: (m) => `#${m.integratedId} ${state.integrateds.find((i) => i.id === m.integratedId)?.name ?? ''}` },
    { key: 'dest', header: 'Matadero / Origen', render: (m) => m.matadero ?? m.origin ?? '—' },
    { key: 'animals', header: 'Nº cabezas', numeric: true, render: (m) => fmtNumber(m.animals) },
    { key: 'kg', header: 'Kg', numeric: true, render: (m) => fmtNumber(m.kg) },
    { key: 'welfare', header: 'Bienestar', render: (m) => (m.welfare ? 'Sí' : m.welfare === false ? 'No' : '—') },
    { key: 'transport', header: 'Transporte', render: (m) => m.driver ?? '—' },
    { key: 'alb', header: 'Albarán', render: (m) => m.albaran ?? '—' },
    { key: 'status', header: 'Archivo', render: (m) => (m.archiveStatus ? <StatusBadge status={m.archiveStatus} /> : '—') },
  ]

  return (
    <div>
      <PageHeader
        title="Logística"
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cerrar formulario' : '+ Nueva entrada/salida'}
          </button>
        }
      />

      {showForm ? <MovementForm onSubmit={(m) => { addLogisticsMovement(m); setShowForm(false) }} /> : null}

      <div className="grid-3 mb-4">
        <SummaryCard title="Salidas por matadero" rows={byMatadero} />
        <SummaryCard title="Movimientos por mes" rows={byMonth} />
        <SummaryCard title="Salidas por chófer/transportista" rows={byDriver} />
      </div>

      <DataTable
        columns={columns}
        rows={[...state.logisticsMovements].sort((a, b) => b.date.localeCompare(a.date))}
        rowKey={(m) => m.id}
      />
    </div>
  )
}

function summarize(movements: LogisticsMovement[], keyFn: (m: LogisticsMovement) => string) {
  const map = new Map<string, number>()
  for (const m of movements) {
    const key = keyFn(m)
    map.set(key, (map.get(key) ?? 0) + m.animals)
  }
  return [...map.entries()].sort(([, a], [, b]) => b - a)
}

function SummaryCard({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="card card--tight">
      <div className="kpi-card__label">{title}</div>
      <div className="summary-card__list">
        {rows.length === 0 ? <span className="page-subtitle">Sin datos.</span> : null}
        {rows.map(([key, count]) => (
          <div key={key} className="kv-row">
            <span className="kv-row__label">{key}</span>
            <span className="kv-row__value">{fmtNumber(count)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MovementForm({ onSubmit }: { onSubmit: (movement: LogisticsMovement) => void }) {
  const state = useAppStore()
  const activeCebas = state.cebas.filter((c) => c.status !== 'closed')
  const [type, setType] = useState<'salida' | 'entrada'>('salida')
  const [cebaId, setCebaId] = useState(activeCebas[0]?.id ?? '')
  const [animals, setAnimals] = useState(0)
  const [kg, setKg] = useState(0)
  const [matadero, setMatadero] = useState('')

  const ceba = state.cebas.find((c) => c.id === cebaId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ceba || animals <= 0 || kg <= 0) return
    onSubmit({
      id: generateId('log'),
      type,
      date: '2026-07-15',
      integratedId: ceba.integratedId,
      cebaId: ceba.id,
      animals,
      kg,
      matadero: type === 'salida' ? matadero || 'Matadero sin especificar' : undefined,
      archiveStatus: 'pendiente',
    })
  }

  return (
    <form className="card movement-form" onSubmit={handleSubmit}>
      <div className="field">
        <label className="field__label" htmlFor="mov-type">Tipo</label>
        <select id="mov-type" className="select" value={type} onChange={(e) => setType(e.target.value as 'salida' | 'entrada')}>
          <option value="salida">Salida</option>
          <option value="entrada">Entrada</option>
        </select>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="mov-ceba">Ceba</label>
        <select id="mov-ceba" className="select" value={cebaId} onChange={(e) => setCebaId(e.target.value)}>
          {activeCebas.map((c) => <option key={c.id} value={c.id}>{c.id} — #{c.integratedId}</option>)}
        </select>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="mov-animals">Nº cabezas</label>
        <input id="mov-animals" className="input movement-form__field--narrow" type="number" min={1} value={animals || ''} onChange={(e) => setAnimals(Number(e.target.value))} />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="mov-kg">Kg</label>
        <input id="mov-kg" className="input movement-form__field--medium" type="number" min={1} value={kg || ''} onChange={(e) => setKg(Number(e.target.value))} />
      </div>
      {type === 'salida' ? (
        <div className="field">
          <label className="field__label" htmlFor="mov-matadero">Matadero</label>
          <input id="mov-matadero" className="input movement-form__field--wide" value={matadero} onChange={(e) => setMatadero(e.target.value)} />
        </div>
      ) : null}
      <button type="submit" className="btn btn-primary">Registrar</button>
    </form>
  )
}
