import { useState, useEffect, useCallback } from 'react'
import type { AppSettings } from '../types'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    window.api.settingsGet().then((s) => setSettings(s as AppSettings))
  }, [])

  const update = useCallback(async (key: string, value: unknown) => {
    const updated = await window.api.settingsSet(key, value)
    setSettings(updated as AppSettings)
  }, [])

  return { settings, update }
}
