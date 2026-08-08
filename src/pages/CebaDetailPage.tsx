import { useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { StatusBadge } from '../components/common/StatusBadge'
import { calculateConversion, getCebaDaysInCycle, isFullyAccountedFor } from '../domain/cebas'
import { selectSettlementForCeba } from '../store/selectors'
import { fmtEUR } from '../utils/currency'
import { formatDateEs, fmtNumber, DEMO_REFERENCE_DATE } from '../utils/dates'

export function CebaDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const state = useAppStore()
  const closeCeba = useAppStore((s) => s.closeCeba)
  const generateSettlement = useAppStore((s) => s.generateSettlement)

  const ceba = state.cebas.find((c) => c.id === id)
  if (!ceba) {
    return <p className="page-subtitle">Ceba no encontrada.</p>
  }

  const integrated = state.integrateds.find((i) => i.id === ceba.integratedId)
  const conversion = calculateConversion(ceba)
  const gain = ceba.exitKg - ceba.entryKg
  const days = getCebaDaysInCycle(ceba, DEMO_REFERENCE_DATE)
  const settlement = selectSettlementForCeba(state, ceba.id)
  const canClose = ceba.status === 'ready_to_close' && isFullyAccountedFor(ceba) && conversion != null

  const movements = state.logisticsMovements
    .filter((m) => m.cebaId === ceba.id)
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div>
      <div className="detail-header">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">Ceba {ceba.id}</h1>
            <StatusBadge status={ceba.status} />
          </div>
          <p className="page-subtitle">#{ceba.integratedId} · {integrated?.name}</p>
        </div>
        <div className="page-header__actions">
          {ceba.status !== 'closed' ? (
            <button type="button" className="btn btn-primary" disabled={!canClose} onClick={() => closeCeba(ceba.id)}>
              Cerrar ceba
            </button>
          ) : null}
        </div>
      </div>

      <div className="ceba-metric-grid">
        <MetricCard label="Entrada" value={`${fmtNumber(ceba.animalsEntered)} cab.`} hint={`${formatDateEs(ceba.entryDate)} · ${fmtNumber(ceba.entryKg)} kg`} />
        <MetricCard label="Salidas" value={`${fmtNumber(ceba.animalsExited)} cab.`} hint={`${fmtNumber(ceba.exitKg)} kg · engorde ${fmtNumber(gain)} kg`} />
        <MetricCard label="Consumo pienso" value={`${fmtNumber(ceba.feedKg)} kg`} hint={`Coste: ${fmtEUR(ceba.feedCost)}`} />
        <MetricCard label="Días en ceba" value={fmtNumber(days)} hint={ceba.closeDate ? `Cerrada ${formatDateEs(ceba.closeDate)}` : 'En curso'} />
        <div className="conversion-card">
          <div className="flex justify-between items-center mb-2">
            <span className="kpi-card__label kpi-card__label--flush">Índice conversión</span>
            {conversion != null ? <span className="badge badge--success">{conversion <= 2.35 ? 'BUENA' : conversion <= 2.45 ? 'ACEPTABLE' : 'REVISAR'}</span> : null}
          </div>
          <div className="conversion-card__value">{conversion?.toFixed(2) ?? '—'}</div>
          <div className="kpi-card__hint">Medicación {fmtEUR(ceba.medicationCost)} · Bajas {fmtNumber(ceba.deaths)}</div>
        </div>
      </div>

      {ceba.status === 'closed' ? (
        <SettlementSection cebaId={ceba.id} settlementId={settlement?.id} onGenerate={() => generateSettlement(ceba.id)} />
      ) : null}

      <div className="card">
        <div className="section-title">Historial de la ceba</div>
        <div className="timeline-list">
          <div className="timeline-item">
            <div className="timeline-dot" />
            <div>
              <div className="kpi-card__label kpi-card__label--flush">{formatDateEs(ceba.entryDate)}</div>
              <div className="timeline-item__title">Entrada de animales</div>
              <div className="page-subtitle">{fmtNumber(ceba.animalsEntered)} cabezas · {fmtNumber(ceba.entryKg)} kg · Origen {ceba.origin}</div>
            </div>
          </div>
          {movements.map((m) => (
            <div className="timeline-item" key={m.id}>
              <div className="timeline-dot" />
              <div>
                <div className="kpi-card__label kpi-card__label--flush">{formatDateEs(m.date)}</div>
                <div className="timeline-item__title">{m.type === 'salida' ? 'Salida a matadero' : 'Entrada de animales'}</div>
                <div className="page-subtitle">
                  {fmtNumber(m.animals)} cabezas · {fmtNumber(m.kg)} kg{m.matadero ? ` · ${m.matadero}` : ''}
                </div>
              </div>
            </div>
          ))}
          {ceba.closeDate ? (
            <div className="timeline-item">
              <div className="timeline-dot" />
              <div>
                <div className="kpi-card__label kpi-card__label--flush">{formatDateEs(ceba.closeDate)}</div>
                <div className="timeline-item__title">Ceba cerrada</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <p className="mt-4">
        <button type="button" className="link-button" onClick={() => navigate('/cebas')}>← Volver a Cebas</button>
      </p>
    </div>
  )
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card__label">{label}</div>
      <div className="metric-card__value">{value}</div>
      {hint ? <div className="kpi-card__hint">{hint}</div> : null}
    </div>
  )
}

function SettlementSection({
  cebaId,
  settlementId,
  onGenerate,
}: {
  cebaId: string
  settlementId: string | undefined
  onGenerate: () => void
}) {
  const navigate = useNavigate()
  const state = useAppStore()
  const settlement = settlementId ? state.settlements.find((s) => s.id === settlementId) : undefined
  const integrated = state.integrateds.find((i) => i.id === state.cebas.find((c) => c.id === cebaId)?.integratedId)

  return (
    <div className="card mb-4">
      <div className="settlement-title">Liquidación · {integrated?.name}</div>
      <p className="page-subtitle settlement-subtitle">Ceba {cebaId}</p>

      {settlement ? (
        <>
          <div className="ok-panel ok-panel--spaced">
            <span>✓</span>
            <span>Liquidación generada con éxito. El pago se ha añadido a Tesorería y a la previsión semanal.</span>
          </div>
          <div className="settlement-summary">
            <div className="kv-row"><span className="kv-row__label">Cerdos liquidados</span><span className="kv-row__value">{fmtNumber(settlement.pigs)}</span></div>
            <div className="kv-row"><span className="kv-row__label">Precio por cerdo</span><span className="kv-row__value">{fmtEUR(integrated?.pricePerPig ?? 0)}</span></div>
            <div className="kv-row"><span className="kv-row__label">Base</span><span className="kv-row__value">{fmtEUR(settlement.baseAmount)}</span></div>
            <div className="kv-row"><span className="kv-row__label">Conversión</span><span className="kv-row__value">{settlement.conversion.toFixed(2)}</span></div>
            <div className="kv-row"><span className="kv-row__label">Prima por conversión</span><span className="kv-row__value">+{fmtEUR(settlement.bonusPerPig)}/cerdo</span></div>
            <div className="kv-row"><span className="kv-row__label">Importe prima</span><span className="kv-row__value">+{fmtEUR(settlement.bonusAmount)}</span></div>
            <div className="kv-row kv-row--divider"><span className="kv-row__label">Bruto</span><span className="kv-row__value">{fmtEUR(settlement.grossAmount)}</span></div>
            <div className="kv-row"><span className="kv-row__label">Retención 2%</span><span className="kv-row__value">− {fmtEUR(settlement.retentionAmount)}</span></div>
            <div className="kv-row kv-row--total">
              <span className="kv-row__label--net">NETO A PAGAR</span>
              <span className="kv-row__value--net">{fmtEUR(settlement.netAmount)}</span>
            </div>
          </div>
          <div className="settlement-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/tesoreria')}>Ver en previsión semanal</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/facturas-emitidas')}>Generar factura emitida</button>
          </div>
        </>
      ) : (
        <button type="button" className="btn btn-primary" onClick={onGenerate}>Generar liquidación</button>
      )}
    </div>
  )
}
