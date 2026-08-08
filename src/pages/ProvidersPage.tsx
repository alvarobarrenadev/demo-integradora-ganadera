import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { PageHeader } from '../components/common/PageHeader'
import { fmtNumber } from '../utils/dates'

export function ProvidersPage() {
  const state = useAppStore()

  const volumeByProvider = useMemo(() => {
    const map = new Map<string, number>()
    for (const invoice of state.invoices) {
      if (invoice.kg == null) continue
      map.set(invoice.providerId, (map.get(invoice.providerId) ?? 0) + invoice.kg)
    }
    return map
  }, [state.invoices])

  return (
    <div>
      <PageHeader title="Proveedores" />
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Tipo</th>
              <th>Cobra porte</th>
              <th className="cell-num">€/kg porte</th>
              <th className="cell-num">Volumen aprox. (kg)</th>
            </tr>
          </thead>
          <tbody>
            {state.providers.map((p) => (
              <tr key={p.id}>
                <td className="cell-strong">{p.name}</td>
                <td>{p.category === 'feed' ? 'Pienso' : 'Medicación'}</td>
                <td>{p.freightRatePerKg > 0 ? 'Sí' : 'No'}</td>
                <td className="cell-num">{p.freightRatePerKg > 0 ? p.freightRatePerKg.toFixed(3) : '—'}</td>
                <td className="cell-num">{fmtNumber(volumeByProvider.get(p.id) ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
