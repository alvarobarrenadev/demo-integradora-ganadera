import { useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { PageHeader } from '../components/common/PageHeader'
import { DataTable, type DataTableColumn } from '../components/common/DataTable'
import { StatusBadge } from '../components/common/StatusBadge'
import { generateId } from '../utils/ids'
import { DEMO_REFERENCE_DATE, formatDateEs, fmtNumber } from '../utils/dates'
import type { LogisticsMovement } from '../types/logistics'

export function LogisticsPage() {
  const state = useAppStore()
  const addLogisticsMovement = useAppStore((s) => s.addLogisticsMovement)
  const [showForm, setShowForm] = useState(false)

  const salidas = state.logisticsMovements.filter((m) => m.type === 'salida')

  const byMatadero = useMemo(() => summarize(salidas, (m) => m.matadero ?? '—'), [salidas])
  const byMonth = useMemo(() => summarize(state.logisticsMovements, (m) => m.date.slice(0, 7)), [state.logisticsMovements])
  const byWeek = useMemo(() => summarize(state.logisticsMovements, (m) => weekLabel(m.date)), [state.logisticsMovements])
  const byDriver = useMemo(() => summarize(salidas, (m) => m.driver ?? '—'), [salidas])

  const columns: DataTableColumn<LogisticsMovement>[] = [
    { key: 'date', header: 'Fecha', render: (m) => formatDateEs(m.date) },
    { key: 'type', header: 'Tipo', render: (m) => (m.type === 'salida' ? 'Salida' : 'Entrada') },
    { key: 'integ', header: 'Integrado', render: (m) => `#${m.integratedId} ${state.integrateds.find((i) => i.id === m.integratedId)?.name ?? ''}` },
    { key: 'dest', header: 'Matadero / Origen', render: (m) => m.matadero ?? m.origin ?? '—' },
    { key: 'animals', header: 'Nº cabezas', numeric: true, render: (m) => fmtNumber(m.animals) },
    { key: 'kg', header: 'Kg', numeric: true, render: (m) => fmtNumber(m.kg) },
    { key: 'welfare', header: 'Bienestar', render: (m) => (m.welfare ? 'Sí' : m.welfare === false ? 'No' : '—') },
    { key: 'transport', header: 'Transporte', render: (m) => m.transportType ? `${m.transportType === 'interno' ? 'Interno' : 'Externo'} · ${m.driver ?? '—'}` : '—' },
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

      <div className="grid-2 mb-4">
        <div className="flex-col gap-4">
          <SummaryCard title="Salidas por matadero" rows={byMatadero} />
          <SummaryCard title="Movimientos por semana" rows={byWeek} />
        </div>
        <div className="flex-col gap-4">
          <SummaryCard title="Movimientos por mes" rows={byMonth} />
          <SummaryCard title="Salidas por chófer/transportista" rows={byDriver} />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={[...state.logisticsMovements].sort((a, b) => b.date.localeCompare(a.date))}
        rowKey={(m) => m.id}
      />
    </div>
  )
}

function weekLabel(date: string): string {
  const value = new Date(`${date}T00:00:00Z`)
  const day = value.getUTCDay() || 7
  value.setUTCDate(value.getUTCDate() - day + 1)
  const start = value.toISOString().slice(0, 10)
  value.setUTCDate(value.getUTCDate() + 6)
  return `${formatDateEs(start).slice(0, 5)}–${formatDateEs(value.toISOString().slice(0, 10)).slice(0, 5)}`
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
  const availableIntegrateds = state.integrateds.filter((integrated) => {
    const current = integrated.activeCebaId ? state.cebas.find((c) => c.id === integrated.activeCebaId) : undefined
    return !current || current.status === 'closed'
  })
  const [type, setType] = useState<'salida' | 'entrada'>('salida')
  const [cebaId, setCebaId] = useState(activeCebas[0]?.id ?? '')
  const [integratedId, setIntegratedId] = useState(availableIntegrateds[0]?.id ?? 0)
  const [date, setDate] = useState(DEMO_REFERENCE_DATE)
  const [animals, setAnimals] = useState(0)
  const [kg, setKg] = useState(0)
  const [matadero, setMatadero] = useState('')
  const [origin, setOrigin] = useState('')
  const [feedType, setFeedType] = useState('')
  const [welfare, setWelfare] = useState(true)
  const [transportType, setTransportType] = useState<'interno' | 'externo'>('interno')
  const [driver, setDriver] = useState('')
  const [albaran, setAlbaran] = useState('')
  const [archiveStatus, setArchiveStatus] = useState<'archivado' | 'pendiente'>('pendiente')

  const ceba = state.cebas.find((c) => c.id === cebaId)
  const integrated = state.integrateds.find((i) => i.id === integratedId)
  const availableFeedTypes = [...new Set(state.tariffs
    .filter((tariff) => tariff.providerId === integrated?.feedProviderId)
    .map((tariff) => tariff.feedType))]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (animals <= 0 || kg <= 0 || !date || !albaran) return
    if (type === 'salida' && (!ceba || !matadero || !driver)) return
    if (type === 'entrada' && (!integrated || !origin || !(feedType || availableFeedTypes[0]))) return
    onSubmit({
      id: generateId('log'),
      type,
      date,
      integratedId: type === 'salida' ? ceba!.integratedId : integratedId,
      cebaId: type === 'salida' ? ceba!.id : generateId('ceba'),
      animals,
      kg,
      matadero: type === 'salida' ? matadero : undefined,
      welfare: type === 'salida' ? welfare : undefined,
      transportType: type === 'salida' ? transportType : undefined,
      driver: type === 'salida' ? driver : undefined,
      origin: type === 'entrada' ? origin : undefined,
      feedType: type === 'entrada' ? feedType || availableFeedTypes[0] : undefined,
      albaran,
      archiveStatus,
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
      {type === 'salida' ? (
        <div className="field">
          <label className="field__label" htmlFor="mov-ceba">Ceba</label>
          <select id="mov-ceba" className="select" value={cebaId} onChange={(e) => setCebaId(e.target.value)} required>
            {activeCebas.map((c) => <option key={c.id} value={c.id}>{c.id} — #{c.integratedId}</option>)}
          </select>
        </div>
      ) : (
        <div className="field">
          <label className="field__label" htmlFor="mov-integrated">Integrado sin ceba activa</label>
          <select id="mov-integrated" className="select" value={integratedId} onChange={(e) => { setIntegratedId(Number(e.target.value)); setFeedType('') }} required>
            {availableIntegrateds.map((i) => <option key={i.id} value={i.id}>#{i.id} {i.name}</option>)}
          </select>
        </div>
      )}
      <div className="field">
        <label className="field__label" htmlFor="mov-date">Fecha</label>
        <input id="mov-date" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="mov-animals">Nº cabezas</label>
        <input id="mov-animals" className="input movement-form__field--narrow" type="number" min={1} value={animals || ''} onChange={(e) => setAnimals(Number(e.target.value))} required />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="mov-kg">Kg</label>
        <input id="mov-kg" className="input movement-form__field--medium" type="number" min={1} value={kg || ''} onChange={(e) => setKg(Number(e.target.value))} required />
      </div>
      {type === 'salida' ? (
        <div className="field">
          <label className="field__label" htmlFor="mov-matadero">Matadero</label>
          <input id="mov-matadero" className="input movement-form__field--wide" value={matadero} onChange={(e) => setMatadero(e.target.value)} required />
        </div>
      ) : (
        <>
          <div className="field">
            <label className="field__label" htmlFor="mov-origin">Origen</label>
            <input id="mov-origin" className="input movement-form__field--wide" value={origin} onChange={(e) => setOrigin(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="mov-feed">Tipo de pienso</label>
            <select id="mov-feed" className="select" value={feedType || availableFeedTypes[0] || ''} onChange={(e) => setFeedType(e.target.value)} required>
              {availableFeedTypes.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
        </>
      )}
      {type === 'salida' ? (
        <>
          <div className="field">
            <label className="field__label" htmlFor="mov-welfare">Bienestar</label>
            <select id="mov-welfare" className="select" value={welfare ? 'si' : 'no'} onChange={(e) => setWelfare(e.target.value === 'si')}>
              <option value="si">Sí</option><option value="no">No</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="mov-transport">Transporte</label>
            <select id="mov-transport" className="select" value={transportType} onChange={(e) => setTransportType(e.target.value as 'interno' | 'externo')}>
              <option value="interno">Interno</option><option value="externo">Externo</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="mov-driver">Chófer / transportista</label>
            <input id="mov-driver" className="input movement-form__field--wide" value={driver} onChange={(e) => setDriver(e.target.value)} required />
          </div>
        </>
      ) : null}
      <div className="field">
        <label className="field__label" htmlFor="mov-albaran">Albarán</label>
        <input id="mov-albaran" className="input movement-form__field--wide" value={albaran} onChange={(e) => setAlbaran(e.target.value)} required />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="mov-archive">Archivo</label>
        <select id="mov-archive" className="select" value={archiveStatus} onChange={(e) => setArchiveStatus(e.target.value as 'archivado' | 'pendiente')}>
          <option value="pendiente">Pendiente</option><option value="archivado">Archivado</option>
        </select>
      </div>
      <button type="submit" className="btn btn-primary">Registrar</button>
    </form>
  )
}
