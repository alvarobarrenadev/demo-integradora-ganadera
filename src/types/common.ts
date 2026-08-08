/** Transient UI feedback message, surfaced by store actions that can succeed, warn, or fail. */
export interface ToastMessage {
  id: string
  variant: 'success' | 'warning' | 'error'
  title: string
  description?: string
}
