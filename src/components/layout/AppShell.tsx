import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ToastHost } from '../common/ToastHost'
import { useAppStore } from '../../store/useAppStore'
import { canAccessRoute, getDefaultRoute } from '../../domain/roles'

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const currentRole = useAppStore((state) => state.currentRole)
  const [lastPathname, setLastPathname] = useState(location.pathname)

  // Close the mobile drawer on navigation — adjusting state during render
  // (React's documented pattern) instead of a setState-in-effect, which
  // avoids an extra cascading render.
  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname)
    setSidebarOpen(false)
  }

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <div className="app-main">
        <Header onMenuClick={() => setSidebarOpen((v) => !v)} />
        <main className="app-content">
          {canAccessRoute(currentRole, location.pathname) ? (
            <div className="page-transition" key={location.pathname}>
              <Outlet />
            </div>
          ) : (
            <Navigate to={getDefaultRoute(currentRole)} replace />
          )}
        </main>
      </div>
      <ToastHost />
    </div>
  )
}
