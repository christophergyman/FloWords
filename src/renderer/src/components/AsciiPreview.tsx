import React, { useState, useCallback } from 'react'
import type { ConversionMode, ConversionResult } from '../types'

interface AsciiPreviewProps {
  result: ConversionResult | null
  mode: ConversionMode
  zoom: number
  onToggleMode: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onAutoFit: () => void
  onRefresh: () => void
}

export function AsciiPreview({
  result,
  mode,
  zoom,
  onToggleMode,
  onZoomIn,
  onZoomOut,
  onAutoFit,
  onRefresh
}: AsciiPreviewProps): React.JSX.Element {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!result?.ascii) return
    const text = '```\n' + result.ascii + '\n```'
    await window.api.clipboardWrite(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [result])

  return (
    <div
      className="terminal-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      {/* Toolbar */}
      <div
        className="terminal-header"
        style={{
          padding: '8px 12px',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <button onClick={onToggleMode} className="terminal-btn">
          {mode === 'architecture' ? 'Arch' : 'Wire'}
        </button>
        <button onClick={onZoomOut} className="terminal-btn">
          -
        </button>
        <span className="terminal-text" style={{ fontSize: 12 }}>
          {zoom === 0 ? 'auto' : `${zoom.toFixed(1)}x`}
        </span>
        <button onClick={onZoomIn} className="terminal-btn">
          +
        </button>
        <button onClick={onAutoFit} className="terminal-btn">
          Fit
        </button>
        <button onClick={onRefresh} className="terminal-btn">
          Refresh
        </button>
        <button onClick={handleCopy} className="terminal-btn">
          {copied ? 'Copied!' : 'Copy'}
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
          className="terminal-text"
          style={{
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
            className="terminal-text"
            style={{
              marginTop: 16,
              paddingTop: 8,
              borderTop: '1px solid var(--term-border)',
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
  )
}
