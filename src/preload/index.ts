import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  ping: (): Promise<string> => ipcRenderer.invoke('ping'),
  clipboardWrite: (text: string): Promise<void> =>
    ipcRenderer.invoke('clipboard:write', { text }),
  fileSave: (
    name: string,
    tldr: string,
    markdown: string
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('file:save', { name, tldr, markdown }),
  fileLoad: (name: string): Promise<{ tldr: string }> =>
    ipcRenderer.invoke('file:load', { name }),
  fileList: (): Promise<{ files: { name: string; modifiedAt: number }[] }> =>
    ipcRenderer.invoke('file:list'),
  settingsGet: (): Promise<Record<string, unknown>> => ipcRenderer.invoke('settings:get'),
  settingsSet: (key: string, value: unknown): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke('settings:set', { key, value }),
  openDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:openDirectory')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error fallback for non-isolated context
  window.electron = electronAPI
  // @ts-expect-error fallback for non-isolated context
  window.api = api
}
