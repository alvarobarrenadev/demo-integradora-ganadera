import { useLocation } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { useAppStore } from '../../store/useAppStore'
import { ROLE_PROFILES } from '../../domain/roles'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const currentRole = useAppStore((state) => state.currentRole)
  const { pathname } = useLocation()
  const profile = ROLE_PROFILES[currentRole]
  const section = ROUTE_TITLES.find(([path]) => path === '/' ? pathname === '/' : pathname.startsWith(path))?.[1] ?? 'Valdeón Gestión'

  return (
    <header className="app-header">
      <button type="button" className="menu-toggle" aria-label="Abrir menú de navegación" onClick={onMenuClick}>
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div className="app-header__context">
        <span className="app-header__eyebrow">Espacio de trabajo</span>
        <span className="app-header__title">{section}</span>
      </div>
      <div className="app-header__actions">
        <span className="environment-badge"><span aria-hidden="true" /> Demo activa</span>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? (
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
              <circle cx="12" cy="12" r="4.5" />
              <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
            </svg>
          ) : (
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
              <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
            </svg>
          )}
        </button>
        <div className="header-user">
          <div className="avatar">{profile.initial}</div>
          <div className="header-user__copy">
            <span className="header-user__name">{profile.name}</span>
            <span className="header-user__role">{profile.label}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

const ROUTE_TITLES: [string, string][] = [
  ['/facturas-emitidas', 'Facturas emitidas'],
  ['/transportistas', 'Transportistas'],
  ['/contabilidad', 'Contabilidad'],
  ['/proveedores', 'Proveedores'],
  ['/integrados', 'Integrados'],
  ['/logistica', 'Logística'],
  ['/tesoreria', 'Tesorería'],
  ['/facturas', 'Facturas'],
  ['/pienso', 'Pienso y tarifas'],
  ['/cebas', 'Cebas'],
  ['/', 'Panel general'],
]
