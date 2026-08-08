import { useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { StatusBadge } from '../components/common/StatusBadge'
import { isDvrExpiringSoon } from '../domain/dvr'
import { DEMO_REFERENCE_DATE, fmtNumber } from '../utils/dates'
import { fmtEUR } from '../utils/currency'

function toISO(dmy: string) {
  const [d, m, y] = dmy.split('/')
  return `${y}-${m}-${d}`
}

export function IntegratedDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const state = useAppStore()

  const integrated = state.integrateds.find((i) => String(i.id) === id)
  if (!integrated) return <p className="page-subtitle">Integrado no encontrado.</p>

  const provider = state.providers.find((p) => p.id === integrated.feedProviderId)
  const cebas = state.cebas.filter((c) => c.integratedId === integrated.id)
  const invoices = state.invoices.filter((i) => i.integratedId === integrated.id)
  const dvrSoon = isDvrExpiringSoon(toISO(integrated.dvrRenewalDate), DEMO_REFERENCE_DATE)

  return (
    <div>
      <div className="detail-header">
        <div>
          <h1 className="page-title">#{integrated.id} {integrated.name}</h1>
          <p className="page-subtitle">{integrated.location} · CEA {integrated.cea}</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/integrados')}>Volver</button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-card__label">Plazas</div><div className="kpi-card__value">{fmtNumber(integrated.capacity)}</div></div>
        <div className="kpi-card"><div className="kpi-card__label">Proveedor de pienso</div><div className="kpi-card__value kpi-card__value--sm">{provider?.name}</div></div>
        <div className="kpi-card">
          <div className="kpi-card__label">DVR</div>
          <div className={`kpi-card__value kpi-card__value--sm${dvrSoon ? ' kpi-card__value--warning' : ''}`}>{integrated.dvrRenewalDate}</div>
        </div>
        <div className="kpi-card"><div className="kpi-card__label">Precio/cerdo</div><div className="kpi-card__value">{fmtEUR(integrated.pricePerPig)}</div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Datos de contacto</div>
          <div className="kv-row"><span className="kv-row__label">Controlador</span><span className="kv-row__value">{integrated.controller}</span></div>
          <div className="kv-row"><span className="kv-row__label">Unidad veterinaria</span><span className="kv-row__value">{integrated.veterinaryUnit}</span></div>
          <div className="kv-row"><span className="kv-row__label">DNI</span><span className="kv-row__value">{integrated.dni}</span></div>
          <div className="kv-row"><span className="kv-row__label">Email</span><span className="kv-row__value">{integrated.email}</span></div>
          <div className="kv-row"><span className="kv-row__label">Teléfono</span><span className="kv-row__value">{integrated.phone}</span></div>
          <div className="kv-row"><span className="kv-row__label">Día de facturación</span><span className="kv-row__value">{integrated.billingDay}</span></div>
          <div className="kv-row"><span className="kv-row__label">Bienestar</span><span className="kv-row__value">{integrated.welfareCertified ? 'Certificado' : 'No certificado'}</span></div>
        </div>

        <div className="card">
          <div className="section-title">Cebas</div>
          {cebas.length === 0 ? <p className="page-subtitle">Sin cebas registradas.</p> : null}
          <div className="kv-list">
            {cebas.map((c) => (
              <button key={c.id} type="button" className="kv-row kv-row--button" onClick={() => navigate(`/cebas/${c.id}`)}>
                <span className="kv-row__label">{c.id}</span>
                <StatusBadge status={c.status} />
              </button>
            ))}
          </div>
          <div className="section-title section-title--spaced">Facturas ({invoices.length})</div>
          <div className="kv-list kv-list--tight">
            {invoices.slice(0, 6).map((inv) => (
              <button key={inv.id} type="button" className="kv-row kv-row--button" onClick={() => navigate(`/facturas/${inv.id}`)}>
                <span className="kv-row__label">{inv.internalNumber}</span>
                <StatusBadge status={inv.status} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
