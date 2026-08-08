import { useNavigate } from 'react-router-dom'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAppStore } from '../store/useAppStore'
import {
  selectActiveCebas,
  selectAverageConversion,
  selectDvrAlerts,
  selectFeedExpenseByMonth,
  selectInvoicesThisMonth,
  selectPaymentsNext7Days,
  selectPendingInvoices,
  selectPriceDiscrepancies,
  selectReadyToCloseCebas,
} from '../store/selectors'
import { KpiCard } from '../components/common/KpiCard'
import { fmtEUR } from '../utils/currency'
import { fmtNumber } from '../utils/dates'

export function DashboardPage() {
  const navigate = useNavigate()
  const state = useAppStore()

  const invoicesThisMonth = selectInvoicesThisMonth(state)
  const pending = selectPendingInvoices(state)
  const paymentsNext7 = selectPaymentsNext7Days(state)
  const activeCebas = selectActiveCebas(state)
  const avgConversion = selectAverageConversion(state)
  const discrepancies = selectPriceDiscrepancies(state)
  const readyToClose = selectReadyToCloseCebas(state)
  const dvrAlerts = selectDvrAlerts(state)
  const highMortalityCebas = state.cebas.filter((c) => c.status !== 'closed' && c.deaths >= 25)
  const augustApplied = state.tariffs.some((t) => t.month === '2026-08')

  const paymentsNext7Total = paymentsNext7.reduce((sum, p) => sum + p.amount, 0)

  const alerts = [
    ...discrepancies.map((d) => ({
      key: `disc-${d.invoiceId}`,
      variant: 'danger' as const,
      title: `Discrepancia en factura ${state.invoices.find((i) => i.id === d.invoiceId)?.internalNumber ?? d.invoiceId}`,
      description: `El importe calculado difiere del documento original (${fmtEUR(d.amount)}).`,
      onClick: () => navigate(`/facturas/${d.invoiceId}`),
    })),
    ...readyToClose.map((c) => ({
      key: `ready-${c.id}`,
      variant: 'info' as const,
      title: `Ceba ${c.id} lista para cierre`,
      description: 'El lote ha alcanzado el peso objetivo estimado.',
      onClick: () => navigate(`/cebas/${c.id}`),
    })),
    ...dvrAlerts.map((d) => ({
      key: `dvr-${d.integratedId}`,
      variant: 'warning' as const,
      title: `DVR de ${d.name} próximo a caducar`,
      description: 'Vence en menos de 30 días.',
      onClick: () => navigate(`/integrados/${d.integratedId}`),
    })),
    ...highMortalityCebas.map((c) => ({
      key: `deaths-${c.id}`,
      variant: 'danger' as const,
      title: `${c.deaths} bajas registradas en la ceba ${c.id}`,
      description: 'Por encima de la media histórica.',
      onClick: () => navigate(`/cebas/${c.id}`),
    })),
    ...(!augustApplied
      ? [
          {
            key: 'august-tariff',
            variant: 'info' as const,
            title: 'Nueva tarifa de agosto disponible',
            description: 'Pendiente de aplicar a los integrados.',
            onClick: () => navigate('/pienso/tarifas'),
          },
        ]
      : []),
  ]

  return (
    <div>
      <h1 className="dashboard-greeting">Buenos días, Mario</h1>
      <p className="page-subtitle mb-6">
        Han entrado {fmtNumber(invoicesThisMonth.length)} facturas este mes.{' '}
        <strong>{invoicesThisMonth.length - pending.length}</strong> se han procesado correctamente y{' '}
        <strong>{pending.length}</strong> {pending.length === 1 ? 'necesita' : 'necesitan'} revisión.
      </p>

      <div className="kpi-grid">
        <KpiCard label="Facturas del mes" value={fmtNumber(invoicesThisMonth.length)} />
        <KpiCard label="Pendientes de validar" value={<>{fmtNumber(pending.length)} <span>⚠</span></>} warning={pending.length > 0} />
        <KpiCard label="Pagos próximos 7 días" value={fmtEUR(paymentsNext7Total)} />
        <KpiCard label="Cebas activas" value={fmtNumber(activeCebas.length)} />
        <KpiCard label="Conversión media" value={avgConversion != null ? avgConversion.toFixed(2) : '—'} />
      </div>

      <div className="grid-aside-left">
        <div className="card">
          <div className="section-title">Requieren tu atención</div>
          {alerts.length === 0 ? (
            <p className="page-subtitle">No hay avisos pendientes.</p>
          ) : (
            <div className="alert-list">
              {alerts.map((alert) => (
                <button
                  key={alert.key}
                  type="button"
                  className="alert-row"
                  onClick={alert.onClick}
                >
                  <span className={`alert-row__dot alert-row__dot--${alert.variant}`} aria-hidden="true">
                    {alert.variant === 'info' ? 'i' : '!'}
                  </span>
                  <span>
                    <span className="alert-row__title">{alert.title}</span>
                    <span className="alert-row__desc">{alert.description}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-col gap-4">
          <div className="card">
            <div className="section-title section-title--tight">Gasto en pienso por mes</div>
            <FeedExpenseChart />
          </div>
          <div className="card">
            <div className="section-title section-title--tight">Actividad reciente</div>
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  )
}

function FeedExpenseChart() {
  const state = useAppStore()
  const data = selectFeedExpenseByMonth(state)

  if (data.length === 0) return <p className="page-subtitle">Sin datos de gasto todavía.</p>

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <XAxis dataKey="month" tick={{ fontSize: 10.5, fill: 'var(--color-text-faint)' }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
        <YAxis hide />
        <Tooltip formatter={(value) => fmtEUR(Number(value))} contentStyle={{ fontSize: 12, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
        <Line type="monotone" dataKey="total" stroke="var(--color-accent)" strokeWidth={2.2} dot={{ r: 3, fill: 'var(--color-accent)' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function RecentActivity() {
  const state = useAppStore()
  const items = [...state.payments]
    .filter((p) => p.sourceType === 'settlement')
    .slice(-3)
    .reverse()
    .map((p) => `Liquidación generada para ${p.beneficiary} (${fmtEUR(p.amount)}).`)

  const validatedInvoices = state.invoices
    .filter((i) => i.status === 'validated')
    .slice(-3)
    .reverse()
    .map((i) => `Factura ${i.internalNumber} validada.`)

  const combined = [...items, ...validatedInvoices].slice(0, 4)

  if (combined.length === 0) return <p className="page-subtitle">Sin actividad reciente.</p>

  return (
    <div className="alert-list">
      {combined.map((text, i) => (
        <div key={i} className="flex gap-3">
          <div className="activity-dot" aria-hidden="true" />
          <span className="activity-text">{text}</span>
        </div>
      ))}
    </div>
  )
}
