import { ipcMain, clipboard, dialog } from 'electron'
import { join } from 'path'
import { mkdir, writeFile, readFile, readdir, stat } from 'fs/promises'
import { getSettings, setSettings } from './store'

interface IpcOptions {
  onHotkeyChange: (newKey: string) => void
}

function getSaveDir(): string {
  return getSettings().saveDir
}

export function registerIpcHandlers({ onHotkeyChange }: IpcOptions): void {
  ipcMain.handle('clipboard:write', async (_event, { text }: { text: string }) => {
    clipboard.writeText(text)
  })

  ipcMain.handle(
    'file:save',
    async (_event, { name, tldr, markdown }: { name: string; tldr: string; markdown: string }) => {
      try {
        const saveDir = getSaveDir()
        await mkdir(saveDir, { recursive: true })
        await writeFile(join(saveDir, `${name}.tldr`), tldr, 'utf-8')
        await writeFile(join(saveDir, `${name}.md`), markdown, 'utf-8')
        return { success: true }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle('file:load', async (_event, { name }: { name: string }) => {
    const saveDir = getSaveDir()
    const tldr = await readFile(join(saveDir, `${name}.tldr`), 'utf-8')
    return { tldr }
  })

  ipcMain.handle('file:list', async () => {
    try {
      const saveDir = getSaveDir()
      await mkdir(saveDir, { recursive: true })
      const entries = await readdir(saveDir)
      const tldrFiles = entries.filter((e) => e.endsWith('.tldr'))
      const files = await Promise.all(
        tldrFiles.map(async (f) => {
          const s = await stat(join(saveDir, f))
          return {
            name: f.replace(/\.tldr$/, ''),
            modifiedAt: s.mtimeMs
          }
        })
      )
      files.sort((a, b) => b.modifiedAt - a.modifiedAt)
      return { files }
    } catch {
      return { files: [] }
    }
  })

  ipcMain.handle('settings:get', async () => {
    return getSettings()
  })

  ipcMain.handle(
    'settings:set',
    async (_event, { key, value }: { key: string; value: unknown }) => {
      const updated = setSettings(key, value)
      if (key === 'hotkey') {
        onHotkeyChange(value as string)
      }
      return updated
    }
  )

  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })
}
