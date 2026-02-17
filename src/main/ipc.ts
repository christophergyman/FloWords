import { ipcMain, clipboard } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { mkdir, writeFile, readFile, readdir, stat } from 'fs/promises'

const SAVE_DIR = join(homedir(), 'FloWords')

export function registerIpcHandlers(): void {
  ipcMain.handle('clipboard:write', async (_event, { text }: { text: string }) => {
    clipboard.writeText(text)
  })

  ipcMain.handle(
    'file:save',
    async (_event, { name, tldr, markdown }: { name: string; tldr: string; markdown: string }) => {
      try {
        await mkdir(SAVE_DIR, { recursive: true })
        await writeFile(join(SAVE_DIR, `${name}.tldr`), tldr, 'utf-8')
        await writeFile(join(SAVE_DIR, `${name}.md`), markdown, 'utf-8')
        return { success: true }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle('file:load', async (_event, { name }: { name: string }) => {
    const tldr = await readFile(join(SAVE_DIR, `${name}.tldr`), 'utf-8')
    return { tldr }
  })

  ipcMain.handle('file:list', async () => {
    try {
      await mkdir(SAVE_DIR, { recursive: true })
      const entries = await readdir(SAVE_DIR)
      const tldrFiles = entries.filter((e) => e.endsWith('.tldr'))
      const files = await Promise.all(
        tldrFiles.map(async (f) => {
          const s = await stat(join(SAVE_DIR, f))
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
}
