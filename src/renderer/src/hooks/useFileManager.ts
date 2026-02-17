import { useState, useEffect, useCallback } from 'react'
import { getSnapshot, loadSnapshot, Editor } from 'tldraw'
import type { ConversionResult, FileInfo } from '../types'

export function useFileManager(editor: Editor | null, result: ConversionResult | null) {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)

  const refreshFileList = useCallback(async () => {
    const { files: list } = await window.api.fileList()
    setFiles(list)
  }, [])

  // Refresh file list on mount
  useEffect(() => {
    refreshFileList()
  }, [refreshFileList])

  const save = useCallback(async () => {
    if (!editor) return

    const name =
      currentFileName || formatTimestamp(new Date())

    const snapshot = getSnapshot(editor.store)
    const tldr = JSON.stringify(snapshot)

    // Build markdown
    let markdown = `# ${name}\n\n`
    markdown += '```\n'
    markdown += result?.ascii || ''
    markdown += '\n```\n'

    if (result && result.colors.length > 0) {
      const parts = result.colors.map((c) => `${c.shapeIds.length} shape(s)=${c.color}`)
      markdown += `\n<!-- Colors: ${parts.join(', ')} -->\n`
    }

    const res = await window.api.fileSave(name, tldr, markdown)
    if (res.success) {
      setCurrentFileName(name)
      await refreshFileList()
    }
  }, [editor, currentFileName, result, refreshFileList])

  const load = useCallback(
    async (name: string) => {
      if (!editor) return
      const { tldr } = await window.api.fileLoad(name)
      const parsed = JSON.parse(tldr)
      loadSnapshot(editor.store, parsed)
      setCurrentFileName(name)
    },
    [editor]
  )

  const newDrawing = useCallback(() => {
    if (!editor) return
    const shapeIds = [...editor.getCurrentPageShapeIds()]
    if (shapeIds.length > 0) {
      editor.deleteShapes(shapeIds)
    }
    setCurrentFileName(null)
  }, [editor])

  // Cmd+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [save])

  return { files, currentFileName, save, load, newDrawing, refreshFileList }
}

function formatTimestamp(d: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`
}
