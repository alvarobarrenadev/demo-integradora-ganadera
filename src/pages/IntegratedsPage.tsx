import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { PageHeader } from '../components/common/PageHeader'
import { DataTable, type DataTableColumn } from '../components/common/DataTable'
import { StatusBadge } from '../components/common/StatusBadge'
import { isDvrExpiringSoon } from '../domain/dvr'
import { DEMO_REFERENCE_DATE, fmtNumber } from '../utils/dates'
import type { Integrated } from '../types/integrated'

function toISO(dmy: string) {
  const [d, m, y] = dmy.split('/')
  return `${y}-${m}-${d}`
}

export function IntegratedsPage() {
  const navigate = useNavigate()
  const state = useAppStore()
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.integrateds.filter((i) => !q || i.name.toLowerCase().includes(q) || String(i.id).includes(q) || i.location.toLowerCase().includes(q))
  }, [state.integrateds, query])

  const columns: DataTableColumn<Integrated>[] = [
    { key: 'id', header: 'Nº', render: (i) => <span className="cell-strong">#{i.id}</span> },
    { key: 'name', header: 'Nombre', render: (i) => i.name },
    { key: 'loc', header: 'Ubicación', render: (i) => i.location },
    { key: 'cap', header: 'Plazas', numeric: true, render: (i) => fmtNumber(i.capacity) },
    { key: 'prov', header: 'Proveedor', render: (i) => state.providers.find((p) => p.id === i.feedProviderId)?.name },
    { key: 'ceba', header: 'Ceba activa', render: (i) => (i.activeCebaId ? <StatusBadge status="active" label={i.activeCebaId} /> : <StatusBadge status="closed" label="Sin ceba" />) },
    {
      key: 'dvr',
      header: 'DVR',
      render: (i) => (
        <span className={isDvrExpiringSoon(toISO(i.dvrRenewalDate), DEMO_REFERENCE_DATE) ? 'badge badge--warning' : undefined}>
          {i.dvrRenewalDate}
        </span>
      ),
    },
    { key: 'welfare', header: 'Bienestar', render: (i) => (i.welfareCertified ? 'Sí' : 'No') },
  ]

  return (
    <div>
      <PageHeader title={`Integrados (${state.integrateds.length} explotaciones)`} />
      <div className="toolbar">
        <input
          className="input search-field"
          placeholder="Buscar por nombre, nº o ubicación..."
          aria-label="Buscar integrados"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <DataTable columns={columns} rows={rows} rowKey={(i) => String(i.id)} onRowClick={(i) => navigate(`/integrados/${i.id}`)} />
    </div>
  )
}
