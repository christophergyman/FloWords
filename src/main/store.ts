import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'

export interface AppSettings {
  hotkey: string
  saveDir: string
  exportWidth: number
}

const DEFAULTS: AppSettings = {
  hotkey: process.platform === 'darwin' ? 'Command+\\' : 'Control+\\',
  saveDir: join(app.getPath('home'), 'FloWords'),
  exportWidth: 100
}

function getSettingsPath(): string {
  const dir = app.getPath('userData')
  mkdirSync(dir, { recursive: true })
  return join(dir, 'settings.json')
}

export function getSettings(): AppSettings {
  try {
    const raw = readFileSync(getSettingsPath(), 'utf-8')
    const parsed = JSON.parse(raw)
    return { ...DEFAULTS, ...parsed }
  } catch {
    return { ...DEFAULTS }
  }
}

export function setSettings(key: string, value: unknown): AppSettings {
  const current = getSettings()
  const updated = { ...current, [key]: value }
  writeFileSync(getSettingsPath(), JSON.stringify(updated, null, 2), 'utf-8')
  return updated
}
