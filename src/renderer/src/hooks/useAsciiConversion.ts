import { useState, useEffect, useRef, useCallback } from 'react'
import type { Editor } from 'tldraw'
import type { ConversionOptions, ConversionResult } from '../types'
import { convertToAscii } from '../engine/converter'

const DEBOUNCE_MS = 500

export function useAsciiConversion(
  editor: Editor | null,
  options?: Partial<ConversionOptions>
) {
  const [result, setResult] = useState<ConversionResult | null>(null)
  const editorRef = useRef(editor)
  const optionsRef = useRef(options)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  editorRef.current = editor
  optionsRef.current = options

  const runConversion = useCallback(() => {
    const ed = editorRef.current
    if (!ed) return
    try {
      const r = convertToAscii(ed, optionsRef.current)
      setResult(r)
    } catch (err) {
      console.error('ASCII conversion error:', err)
    }
  }, [])

  const scheduleConversion = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(runConversion, DEBOUNCE_MS)
  }, [runConversion])

  // Subscribe to store changes
  useEffect(() => {
    if (!editor) return

    // Run initial conversion
    runConversion()

    const unsub = editor.store.listen(scheduleConversion, {
      source: 'user',
      scope: 'document'
    })

    return () => {
      unsub()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [editor, runConversion, scheduleConversion])

  // Re-run when options change
  useEffect(() => {
    if (editor) {
      runConversion()
    }
  }, [editor, options, runConversion])

  const refresh = useCallback(() => {
    runConversion()
  }, [runConversion])

  return { result, refresh }
}
