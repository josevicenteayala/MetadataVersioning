import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import DashboardRoute from '@app/routes/DashboardRoute'
import DocumentRoute from '@app/routes/DocumentRoute'

const App = () => {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div>
          <p className="badge">alpha</p>
          <h1>Metadata Coffeehouse</h1>
          <p className="subhead">Trace every schema sip without leaving the barista station.</p>
        </div>
        <div className="status-pill" aria-live="polite">
          <span className="dot" />
          Backend connected
        </div>
      </header>
      <main className="app-shell__content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/documents/:documentId" element={<DocumentRoute />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
