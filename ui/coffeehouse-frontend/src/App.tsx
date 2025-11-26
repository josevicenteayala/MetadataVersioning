import './App.css'
import DashboardRoute from '@app/routes/DashboardRoute'

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
        <DashboardRoute />
      </main>
    </div>
  )
}

export default App
