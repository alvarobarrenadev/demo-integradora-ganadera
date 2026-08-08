interface ProcessingOverlayProps {
  label: string
  step: number
  totalSteps: number
}

export function ProcessingOverlay({ label, step, totalSteps }: ProcessingOverlayProps) {
  return (
    <div className="modal-backdrop" role="status" aria-live="polite">
      <div className="processing-modal">
        <div className="processing-spinner" aria-hidden="true" />
        <div className="processing-label">{label}</div>
        <div className="processing-dots">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`processing-dot${i < step ? ' is-done' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
