/**
 * Settings route component
 */
import { AuthSettingsPanel } from '../components/AuthSettingsPanel'

export const SettingsRoute = () => {
  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-page-title">Settings</h1>
        <div className="settings-sections">
          <AuthSettingsPanel />
        </div>
      </div>
    </div>
  )
}
