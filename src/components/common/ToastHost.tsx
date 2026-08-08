import { useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'

export function ToastHost() {
  const toast = useAppStore((s) => s.toast)
  const dismissToast = useAppStore((s) => s.dismissToast)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(dismissToast, 4500)
    return () => clearTimeout(timer)
  }, [toast, dismissToast])

  if (!toast) return null

  const icon = toast.variant === 'success' ? '✓' : toast.variant === 'warning' ? '!' : '✕'

  return (
    <div className={`toast toast--${toast.variant}`} role="status">
      <div className="toast__icon" aria-hidden="true">{icon}</div>
      <div>
        <div className="toast__title">{toast.title}</div>
        {toast.description ? <div className="toast__description">{toast.description}</div> : null}
      </div>
    </div>
  )
}
