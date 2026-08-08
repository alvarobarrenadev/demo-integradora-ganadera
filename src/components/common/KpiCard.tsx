import type { ReactNode } from 'react'

interface KpiCardProps {
  label: string
  value: ReactNode
  hint?: string
  warning?: boolean
}

export function KpiCard({ label, value, hint, warning }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-card__label">{label}</div>
      <div className={`kpi-card__value${warning ? ' kpi-card__value--warning' : ''}`}>{value}</div>
      {hint ? <div className="kpi-card__hint">{hint}</div> : null}
    </div>
  )
}
