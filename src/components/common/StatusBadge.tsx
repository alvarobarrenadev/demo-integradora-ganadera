type Variant = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const STATUS_MAP: Record<string, { label: string; variant: Variant }> = {
  pending: { label: 'Pendiente', variant: 'warning' },
  validated: { label: 'Validada', variant: 'success' },
  discrepancy: { label: 'Discrepancia', variant: 'danger' },
  paid: { label: 'Pagado', variant: 'success' },
  overdue: { label: 'Vencido', variant: 'danger' },
  active: { label: 'Activa', variant: 'success' },
  ready_to_close: { label: 'Lista para cierre', variant: 'warning' },
  closed: { label: 'Cerrada', variant: 'neutral' },
  archivado: { label: 'Archivado', variant: 'success' },
  Previsto: { label: 'Previsto', variant: 'info' },
  Programado: { label: 'Programado', variant: 'success' },
}

interface StatusBadgeProps {
  status: string
  label?: string
  variant?: Variant
}

export function StatusBadge({ status, label, variant }: StatusBadgeProps) {
  const resolved = STATUS_MAP[status]
  const finalVariant = variant ?? resolved?.variant ?? 'neutral'
  const finalLabel = label ?? resolved?.label ?? status
  return <span className={`badge badge--${finalVariant}`}><span className="badge__dot" aria-hidden="true" />{finalLabel}</span>
}
