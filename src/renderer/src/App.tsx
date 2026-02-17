import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Tldraw, Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { useAsciiConversion } from './hooks/useAsciiConversion'
import { useFileManager } from './hooks/useFileManager'
import { AsciiPreview } from './components/AsciiPreview'
import { FileSidebar } from './components/FileSidebar'
import type { ConversionMode, ConversionOptions } from './types'

function useDragDivider(initialWidth: number) {
  const [width, setWidth] = useState(initialWidth)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dragging.current = true
      startX.current = e.clientX
      startWidth.current = width
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    },
    [width]
  )

  useEffect(() => {
    const onMouseMove = (e: MouseEvent): void => {
      if (!dragging.current) return
      const newWidth = startWidth.current + (startX.current - e.clientX)
      setWidth(Math.max(200, Math.min(800, newWidth)))
    }
    const onMouseUp = (): void => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return { width, onMouseDown }
}

export default function App(): React.JSX.Element {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [mode, setMode] = useState<ConversionMode>('architecture')
  const [zoom, setZoom] = useState(0) // 0 = auto-fit
  const [showPreview, setShowPreview] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)

  const options = useMemo<Partial<ConversionOptions>>(
    () => ({ mode, zoom }),
    [mode, zoom]
  )

  const { result, refresh } = useAsciiConversion(editor, options)
  const { files, currentFileName, save, load, newDrawing } = useFileManager(editor, result)
  const { width: previewWidth, onMouseDown: onDividerMouseDown } = useDragDivider(400)

  const handleMount = useCallback((ed: Editor) => {
    setEditor(ed)
  }, [])

  const toggleMode = useCallback(() => {
    setMode((m) => (m === 'architecture' ? 'wireframe' : 'architecture'))
  }, [])

  const zoomIn = useCallback(() => {
    setZoom((z) => {
      const current = z === 0 && result ? (result.gridWidth > 0 ? z : 1) : z
      return Math.round((current || 1) * 1.2 * 10) / 10
    })
  }, [result])

  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const current = z === 0 ? 1 : z
      return Math.max(0.1, Math.round((current / 1.2) * 10) / 10)
    })
  }, [])

  const autoFit = useCallback(() => {
    setZoom(0)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex' }}>
      {/* File sidebar */}
      {showSidebar && (
        <FileSidebar
          files={files}
          currentFileName={currentFileName}
          onFileSelect={load}
          onNew={newDrawing}
          onSave={save}
        />
      )}

      {/* TLDraw canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Tldraw onMount={handleMount} />
      </div>

      {/* Preview panel with drag divider */}
      {showPreview && (
        <>
          {/* Drag divider */}
          <div
            onMouseDown={onDividerMouseDown}
            style={{
              width: 6,
              cursor: 'col-resize',
              backgroundColor: '#1a1a1a',
              borderLeft: '1px solid #333',
              borderRight: '1px solid #333',
              flexShrink: 0
            }}
          />
          <div style={{ width: previewWidth, flexShrink: 0 }}>
            <AsciiPreview
              result={result}
              mode={mode}
              zoom={zoom}
              onToggleMode={toggleMode}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onAutoFit={autoFit}
              onRefresh={refresh}
            />
          </div>
        </>
      )}

      {/* Toggle sidebar button */}
      <button
        onClick={() => setShowSidebar((s) => !s)}
        style={{
          position: 'fixed',
          top: 8,
          left: showSidebar ? 208 : 8,
          zIndex: 1000,
          ...buttonStyle
        }}
      >
        {showSidebar ? '<' : '>'}
      </button>

      {/* Toggle preview button */}
      <button
        onClick={() => setShowPreview((s) => !s)}
        style={{
          position: 'fixed',
          top: 8,
          right: showPreview ? previewWidth + 14 : 8,
          zIndex: 1000,
          ...buttonStyle
        }}
      >
        {showPreview ? '>' : '<'}
      </button>
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  background: '#222',
  color: '#d4a017',
  border: '1px solid #444',
  borderRadius: 4,
  padding: '4px 10px',
  fontFamily: 'monospace',
  fontSize: 12,
  cursor: 'pointer'
}
