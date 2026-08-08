import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ToastHost } from '../common/ToastHost'

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
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
          <Outlet />
        </main>
      </div>
      <ToastHost />
    </div>
  )
}
