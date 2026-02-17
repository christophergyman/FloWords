import React from 'react'
import type { FileInfo } from '../types'

interface FileSidebarProps {
  files: FileInfo[]
  currentFileName: string | null
  onFileSelect: (name: string) => void
  onNew: () => void
  onSave: () => void
}

export function FileSidebar({
  files,
  currentFileName,
  onFileSelect,
  onNew,
  onSave
}: FileSidebarProps): React.JSX.Element {
  return (
    <div
      style={{
        width: 200,
        backgroundColor: '#111',
        borderRight: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 12px 6px',
          fontFamily: 'monospace',
          fontSize: 13,
          fontWeight: 'bold',
          color: '#d4a017',
          borderBottom: '1px solid #333'
        }}
      >
        Files
      </div>

      {/* Action buttons */}
      <div
        style={{
          padding: '8px 12px',
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid #333'
        }}
      >
        <button onClick={onNew} style={buttonStyle}>
          New
        </button>
        <button onClick={onSave} style={buttonStyle}>
          Save
        </button>
      </div>

      {/* File list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {files.length === 0 && (
          <div
            style={{
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: 11,
              color: '#666'
            }}
          >
            No saved files
          </div>
        )}
        {files.map((f) => (
          <div
            key={f.name}
            onClick={() => onFileSelect(f.name)}
            style={{
              padding: '6px 12px',
              fontFamily: 'monospace',
              fontSize: 11,
              color: f.name === currentFileName ? '#0a0a0a' : '#d4a017',
              backgroundColor: f.name === currentFileName ? '#d4a017' : 'transparent',
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {f.name}
          </div>
        ))}
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
  cursor: 'pointer',
  flex: 1
}
