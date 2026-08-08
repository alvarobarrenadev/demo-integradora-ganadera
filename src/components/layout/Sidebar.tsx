import { NavLink } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { canAccessRoute, canOperate, type UserRole } from '../../domain/roles'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  section?: string
}

const iconProps = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', strokeWidth: 1.7 }

const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Panel general',
    section: 'Operaciones',
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/facturas',
    label: 'Facturas',
    icon: (
      <svg {...iconProps}>
        <rect x="5" y="3" width="14" height="18" rx="1.5" />
        <line x1="8" y1="8" x2="16" y2="8" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="8" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
  {
    to: '/tesoreria',
    label: 'Tesorería',
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="7" width="18" height="13" rx="1.5" />
        <path d="M3 10h18" />
        <circle cx="16" cy="14" r="1.4" />
      </svg>
    ),
  },
  {
    to: '/pienso',
    label: 'Pienso y tarifas',
    section: 'Producción',
    icon: (
      <svg {...iconProps}>
        <path d="M4 20c4-1 5-6 5-10" />
        <path d="M9 10c3 0 6-2 6-6" />
        <path d="M20 20c-4-1-5-6-5-10" />
        <path d="M15 10c-3 0-6-2-6-6" />
      </svg>
    ),
  },
  {
    to: '/cebas',
    label: 'Cebas',
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="4" width="16" height="5" rx="1" />
        <rect x="4" y="10.5" width="16" height="5" rx="1" />
        <rect x="4" y="17" width="16" height="3" rx="1" />
      </svg>
    ),
  },
  {
    to: '/logistica',
    label: 'Logística',
    icon: (
      <svg {...iconProps}>
        <rect x="2" y="8" width="12" height="9" rx="1" />
        <path d="M14 11h4l3 3v3h-7z" />
        <circle cx="6" cy="19" r="1.6" />
        <circle cx="17" cy="19" r="1.6" />
      </svg>
    ),
  },
  {
    to: '/integrados',
    label: 'Integrados',
    section: 'Gestión',
    icon: (
      <svg {...iconProps}>
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M2.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
        <path d="M14.8 14.3c2.3.2 4.2 2 4.2 4.7" />
      </svg>
    ),
  },
  {
    to: '/proveedores',
    label: 'Proveedores',
    icon: (
      <svg {...iconProps}>
        <path d="M3 9l1.5-5h15L21 9" />
        <rect x="3" y="9" width="18" height="11" rx="1" />
        <line x1="3" y1="13" x2="21" y2="13" />
      </svg>
    ),
  },
  {
    to: '/transportistas',
    label: 'Transportistas',
    icon: (
      <svg {...iconProps}>
        <rect x="2" y="9" width="13" height="8" rx="1" />
        <path d="M15 12h4l3 3v2h-7z" />
        <circle cx="6.5" cy="19" r="1.6" />
        <circle cx="18" cy="19" r="1.6" />
      </svg>
    ),
  },
  {
    to: '/facturas-emitidas',
    label: 'Facturas emitidas',
    icon: (
      <svg {...iconProps}>
        <rect x="5" y="3" width="14" height="18" rx="1.5" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    to: '/contabilidad',
    label: 'Contabilidad',
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="3" width="16" height="18" rx="1.5" />
        <line x1="8" y1="8" x2="16" y2="8" />
        <line x1="8" y1="12" x2="10.5" y2="12" />
        <line x1="13" y1="12" x2="16" y2="12" />
        <line x1="8" y1="16" x2="10.5" y2="16" />
        <line x1="13" y1="16" x2="16" y2="16" />
      </svg>
    ),
  },
]

interface SidebarProps {
  open: boolean
  onNavigate: () => void
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const resetDemo = useAppStore((s) => s.resetDemo)
  const currentRole = useAppStore((s) => s.currentRole)
  const setCurrentRole = useAppStore((s) => s.setCurrentRole)
  const visibleItems = NAV_ITEMS.filter((item) => canAccessRoute(currentRole, item.to))

  return (
    <nav className={`sidebar${open ? ' is-open' : ''}`} aria-label="Navegación principal">
      <div className="sidebar-brand">
        <div className="sidebar-brand__mark" aria-hidden="true">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
        </div>
        <div>
          <div className="sidebar-brand__name">Valdeón Gestión</div>
          <div className="sidebar-brand__company">AGROGANADERA VALDEÓN SL</div>
        </div>
      </div>

      <div className="sidebar-nav">
        {visibleItems.map((item, index) => (
          <div className="sidebar-nav__item" key={item.to}>
            {item.section || (currentRole === 'accounting' && index === 0) ? (
              <div className="sidebar-nav__section">{item.section ?? 'Exportaciones'}</div>
            ) : null}
            <NavLink
              to={item.to}
              end={item.to === '/'}
              onClick={onNavigate}
              className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          </div>
        ))}
      </div>

      <div className="sidebar-spacer" />

      <div className="sidebar-footer">
        {canOperate(currentRole) ? (
          <button type="button" className="sidebar-reset" onClick={resetDemo}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
              <path d="M3 12a9 9 0 1 1 3 6.7" />
              <path d="M3 21v-5h5" />
            </svg>
            <span>Restablecer demo</span>
          </button>
        ) : null}
        <label className="sidebar-role-select">
          <span>Perfil de usuario</span>
          <select
            value={currentRole}
            onChange={(event) => setCurrentRole(event.target.value as UserRole)}
            aria-label="Cambiar perfil de usuario"
          >
            <option value="admin">Mario · Administrador</option>
            <option value="direction">Dirección · Solo lectura</option>
            <option value="accounting">Contable · Exportaciones</option>
          </select>
        </label>
      </div>
    </nav>
  )
}
