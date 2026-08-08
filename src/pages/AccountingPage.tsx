import { useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { PageHeader } from '../components/common/PageHeader'
import { StatusBadge } from '../components/common/StatusBadge'
import { fmtEUR } from '../utils/currency'

export function AccountingPage() {
  const state = useAppStore()
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set())

  const byMonth = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>()
    for (const invoice of state.invoices) {
      if (invoice.status !== 'validated') continue
      const month = invoice.date.slice(0, 7)
      const entry = map.get(month) ?? { count: 0, total: 0 }
      entry.count += 1
      entry.total += invoice.total
      map.set(month, entry)
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a))
  }, [state.invoices])

  return (
    <div>
      <PageHeader title="Contabilidad" subtitle="Exportación de facturas ya archivadas y enviadas a contabilidad." />

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mes</th>
              <th className="cell-num">Nº facturas</th>
              <th className="cell-num">Importe total</th>
              <th>Estado</th>
              <th>Exportación</th>
            </tr>
          </thead>
          <tbody>
            {byMonth.map(([month, { count, total }]) => (
              <tr key={month}>
                <td className="cell-strong">{month}</td>
                <td className="cell-num">{count}</td>
                <td className="cell-num">{fmtEUR(total)}</td>
                <td><StatusBadge status="validated" label="Preparado" /></td>
                <td>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setDownloaded((prev) => new Set(prev).add(month))}
                  >
                    {downloaded.has(month) ? 'Paquete descargado ✓' : 'Descargar paquete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {byMonth.length === 0 ? <div className="table-empty">Todavía no hay facturas validadas.</div> : null}
      </div>
    </div>
  )
}
