import React, { useState, useCallback, useMemo } from 'react'
import { Tldraw, Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { useAsciiConversion } from './hooks/useAsciiConversion'
import type { ConversionMode, ConversionOptions } from './types'

export default function App(): React.JSX.Element {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [mode, setMode] = useState<ConversionMode>('architecture')
  const [zoom, setZoom] = useState(0) // 0 = auto-fit
  const [showPreview, setShowPreview] = useState(true)

  const options = useMemo<Partial<ConversionOptions>>(
    () => ({ mode, zoom }),
    [mode, zoom]
  )

  const { result, refresh } = useAsciiConversion(editor, options)

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
      {/* TLDraw canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Tldraw onMount={handleMount} />
      </div>

      {/* Preview panel */}
      {showPreview && (
        <div
          style={{
            width: 400,
            backgroundColor: '#0a0a0a',
            borderLeft: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid #333',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            <button onClick={toggleMode} style={buttonStyle}>
              {mode === 'architecture' ? 'Arch' : 'Wire'}
            </button>
            <button onClick={zoomOut} style={buttonStyle}>
              -
            </button>
            <span style={{ color: '#d4a017', fontFamily: 'monospace', fontSize: 12 }}>
              {zoom === 0 ? 'auto' : `${zoom.toFixed(1)}x`}
            </span>
            <button onClick={zoomIn} style={buttonStyle}>
              +
            </button>
            <button onClick={autoFit} style={buttonStyle}>
              Fit
            </button>
            <button onClick={refresh} style={buttonStyle}>
              Refresh
            </button>
          </div>

          {/* ASCII output */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: 12
            }}
          >
            <pre
              style={{
                color: '#d4a017',
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 11,
                lineHeight: 1.2,
                margin: 0,
                whiteSpace: 'pre'
              }}
            >
              {result?.ascii || '(draw something to see ASCII output)'}
            </pre>

            {/* Color annotations */}
            {result && result.colors.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 8,
                  borderTop: '1px solid #333',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: '#888'
                }}
              >
                {result.colors.map((c) => (
                  <div key={c.color}>
                    [{c.color}]: {c.shapeIds.length} shape(s)
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toggle preview button */}
      <button
        onClick={() => setShowPreview((s) => !s)}
        style={{
          position: 'fixed',
          top: 8,
          right: showPreview ? 408 : 8,
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
