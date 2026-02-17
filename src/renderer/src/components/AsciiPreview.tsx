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
      style={{
        backgroundColor: '#0a0a0a',
        borderLeft: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
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
        <button onClick={onToggleMode} style={buttonStyle}>
          {mode === 'architecture' ? 'Arch' : 'Wire'}
        </button>
        <button onClick={onZoomOut} style={buttonStyle}>
          -
        </button>
        <span style={{ color: '#d4a017', fontFamily: 'monospace', fontSize: 12 }}>
          {zoom === 0 ? 'auto' : `${zoom.toFixed(1)}x`}
        </span>
        <button onClick={onZoomIn} style={buttonStyle}>
          +
        </button>
        <button onClick={onAutoFit} style={buttonStyle}>
          Fit
        </button>
        <button onClick={onRefresh} style={buttonStyle}>
          Refresh
        </button>
        <button onClick={handleCopy} style={buttonStyle}>
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
