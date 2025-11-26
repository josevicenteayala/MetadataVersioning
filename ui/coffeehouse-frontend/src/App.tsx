import './App.css'

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
        <article className="glass-card">
          <h2>Next steps</h2>
          <p>
            Phase 2 plumbing is ready. Start delivering dashboard, history, lifecycle, diff, and
            auth experiences with confidence in the shared infrastructure.
          </p>
        </article>
      </main>
    </div>
  )
}

export default App
