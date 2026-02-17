import { useRef, useCallback } from 'react'
import { Tldraw, Editor } from 'tldraw'
import 'tldraw/tldraw.css'

export default function App(): JSX.Element {
  const editorRef = useRef<Editor | null>(null)

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor

    // Log shapes on store changes to verify store access
    editor.store.listen(
      () => {
        const shapes = editor.getCurrentPageShapes()
        if (shapes.length > 0) {
          console.log('Current shapes:', shapes)
        }
      },
      { source: 'user', scope: 'document' }
    )
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw onMount={handleMount} />
    </div>
  )
}
