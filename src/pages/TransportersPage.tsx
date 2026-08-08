import { useAppStore } from '../store/useAppStore'
import { PageHeader } from '../components/common/PageHeader'
import { StatusBadge } from '../components/common/StatusBadge'

export function TransportersPage() {
  const state = useAppStore()

  return (
    <div>
      <PageHeader title="Transportistas y camiones" />

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Transportistas</div>
          <div className="kv-list">
            {state.transporters.map((t) => (
              <div key={t.id} className="kv-row">
                <span className="kv-row__label">{t.name}</span>
                <StatusBadge status={t.kind === 'propio' ? 'validated' : 'pending'} label={t.kind === 'propio' ? 'Propio' : 'Externo'} variant={t.kind === 'propio' ? 'success' : 'neutral'} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-title">Camiones propios</div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Matrícula</th><th>Chófer habitual</th></tr>
              </thead>
              <tbody>
                {state.trucks.map((truck) => (
                  <tr key={truck.id}>
                    <td className="cell-strong">{truck.plate}</td>
                    <td>{truck.driver ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
