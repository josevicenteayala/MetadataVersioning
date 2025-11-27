import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import './App.css'
import { ErrorBoundary } from '@app/components'

// Lazy load route components for code splitting
const DashboardRoute = lazy(() => import('@app/routes/DashboardRoute'))
const DocumentRoute = lazy(() => import('@app/routes/DocumentRoute'))
const SettingsRoute = lazy(() =>
  import('@features/settings').then((m) => ({ default: m.SettingsRoute })),
)
const CompareRoute = lazy(() => import('@features/compare/routes/CompareRoute'))

// Loading fallback component
const RouteLoadingFallback = () => (
  <div className="route-loading" role="status" aria-live="polite">
    <div className="route-loading__spinner" aria-hidden="true" />
    <p className="route-loading__text">Loading...</p>
  </div>
)

const App = () => {
  const location = useLocation()

  return (
    <ErrorBoundary>
      <div className="app-shell">
        <header className="app-shell__header">
          <div>
            <p className="badge">alpha</p>
            <h1>Metadata Coffeehouse</h1>
            <p className="subhead">Trace every schema sip without leaving the barista station.</p>
          </div>
          <nav className="app-nav" aria-label="Main navigation">
            <Link
              to="/dashboard"
              className={`app-nav-link ${location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/documents') ? 'app-nav-link--active' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/compare"
              className={`app-nav-link ${location.pathname === '/compare' ? 'app-nav-link--active' : ''}`}
            >
              Compare
            </Link>
            <Link
              to="/settings"
              className={`app-nav-link ${location.pathname === '/settings' ? 'app-nav-link--active' : ''}`}
            >
              Settings
            </Link>
          </nav>
          <div className="status-pill" aria-live="polite">
            <span className="dot" />
            Backend connected
          </div>
        </header>
        <main className="app-shell__content">
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardRoute />} />
              <Route path="/documents/:documentId" element={<DocumentRoute />} />
              <Route path="/compare" element={<CompareRoute />} />
              <Route path="/settings" element={<SettingsRoute />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App
