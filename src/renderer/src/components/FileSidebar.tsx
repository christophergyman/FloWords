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
      className="terminal-panel"
      style={{
        width: 200,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%'
      }}
    >
      {/* Header */}
      <div
        className="terminal-header"
        style={{
          padding: '10px 12px 6px',
          fontSize: 13,
          fontWeight: 'bold'
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
          borderBottom: '1px solid var(--term-border)'
        }}
      >
        <button onClick={onNew} className="terminal-btn" style={{ flex: 1 }}>
          New
        </button>
        <button onClick={onSave} className="terminal-btn" style={{ flex: 1 }}>
          Save
        </button>
      </div>

      {/* File list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {files.length === 0 && (
          <div
            className="terminal-text"
            style={{
              padding: '12px',
              fontSize: 11,
              color: 'var(--term-text-dim)'
            }}
          >
            No saved files
          </div>
        )}
        {files.map((f) => (
          <div
            key={f.name}
            onClick={() => onFileSelect(f.name)}
            className={
              'terminal-file-item' +
              (f.name === currentFileName ? ' terminal-file-item--active' : '')
            }
          >
            {f.name}
          </div>
        ))}
      </div>
    </div>
  )
}
