export type UserRole = 'admin' | 'direction' | 'accounting'

export const ROLE_PROFILES: Record<UserRole, { name: string; label: string; initial: string }> = {
  admin: { name: 'Mario', label: 'Administrador', initial: 'M' },
  direction: { name: 'Dirección', label: 'Solo lectura', initial: 'D' },
  accounting: { name: 'Contable', label: 'Exportaciones', initial: 'C' },
}

const ACCOUNTING_ROUTES = ['/contabilidad', '/facturas-emitidas']

export function canOperate(role: UserRole) {
  return role === 'admin'
}

export function canExport(role: UserRole) {
  return role === 'admin' || role === 'accounting'
}

export function canAccessRoute(role: UserRole, pathname: string) {
  return role !== 'accounting' || ACCOUNTING_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
}

export function getDefaultRoute(role: UserRole) {
  return role === 'accounting' ? '/contabilidad' : '/'
}
