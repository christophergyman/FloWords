import React, { useEffect, useCallback } from 'react'
import type { AppSettings } from '../types'

interface SettingsProps {
  settings: AppSettings
  onUpdate: (key: string, value: unknown) => void
  onClose: () => void
}

export function Settings({ settings, onUpdate, onClose }: SettingsProps): React.JSX.Element {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleBrowse = async (): Promise<void> => {
    const path = await window.api.openDirectory()
    if (path) {
      onUpdate('saveDir', path)
    }
  }

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val) && val >= 40 && val <= 200) {
      onUpdate('exportWidth', val)
    }
  }

  return (
    <div className="terminal-modal-overlay" onClick={onClose}>
      <div
        className="terminal-modal terminal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="terminal-header"
          style={{
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: 14 }}>SETTINGS</span>
          <button onClick={onClose} className="terminal-btn">
            X
          </button>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Global Hotkey */}
          <div>
            <label className="terminal-label">Global Hotkey</label>
            <input
              type="text"
              className="terminal-input"
              value={settings.hotkey}
              onChange={(e) => onUpdate('hotkey', e.target.value)}
            />
          </div>

          {/* Save Directory */}
          <div>
            <label className="terminal-label">Save Directory</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="terminal-input"
                style={{ flex: 1 }}
                value={settings.saveDir}
                readOnly
              />
              <button onClick={handleBrowse} className="terminal-btn">
                Browse
              </button>
            </div>
          </div>

          {/* Export Width */}
          <div>
            <label className="terminal-label">Export Width (40-200)</label>
            <input
              type="number"
              className="terminal-input"
              min={40}
              max={200}
              value={settings.exportWidth}
              onChange={handleWidthChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
