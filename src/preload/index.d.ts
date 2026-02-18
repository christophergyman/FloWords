import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      ping: () => Promise<string>
      clipboardWrite: (text: string) => Promise<void>
      fileSave: (
        name: string,
        tldr: string,
        markdown: string
      ) => Promise<{ success: boolean; error?: string }>
      fileLoad: (name: string) => Promise<{ tldr: string }>
      fileList: () => Promise<{ files: { name: string; modifiedAt: number }[] }>
      settingsGet: () => Promise<Record<string, unknown>>
      settingsSet: (key: string, value: unknown) => Promise<Record<string, unknown>>
      openDirectory: () => Promise<string | null>
    }
  }
}
