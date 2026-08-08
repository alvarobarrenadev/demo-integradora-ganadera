import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { DashboardPage } from '../pages/DashboardPage'
import { InvoicesPage } from '../pages/InvoicesPage'
import { InvoiceDetailPage } from '../pages/InvoiceDetailPage'
import { TreasuryPage } from '../pages/TreasuryPage'
import { FeedPage } from '../pages/FeedPage'
import { CebasPage } from '../pages/CebasPage'
import { CebaDetailPage } from '../pages/CebaDetailPage'
import { LogisticsPage } from '../pages/LogisticsPage'
import { IntegratedsPage } from '../pages/IntegratedsPage'
import { IntegratedDetailPage } from '../pages/IntegratedDetailPage'
import { ProvidersPage } from '../pages/ProvidersPage'
import { TransportersPage } from '../pages/TransportersPage'
import { EmittedInvoicesPage } from '../pages/EmittedInvoicesPage'
import { AccountingPage } from '../pages/AccountingPage'

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/facturas', element: <InvoicesPage /> },
      { path: '/facturas/:id', element: <InvoiceDetailPage /> },
      { path: '/tesoreria', element: <TreasuryPage /> },
      { path: '/pienso', element: <FeedPage /> },
      { path: '/pienso/tarifas', element: <FeedPage /> },
      { path: '/cebas', element: <CebasPage /> },
      { path: '/cebas/:id', element: <CebaDetailPage /> },
      { path: '/logistica', element: <LogisticsPage /> },
      { path: '/integrados', element: <IntegratedsPage /> },
      { path: '/integrados/:id', element: <IntegratedDetailPage /> },
      { path: '/proveedores', element: <ProvidersPage /> },
      { path: '/transportistas', element: <TransportersPage /> },
      { path: '/facturas-emitidas', element: <EmittedInvoicesPage /> },
      { path: '/contabilidad', element: <AccountingPage /> },
    ],
  },
])
