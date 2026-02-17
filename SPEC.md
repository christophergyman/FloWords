# FloWords — Product Specification

> A macOS Electron app that wraps TLDraw with a retro terminal aesthetic and converts drawings to ASCII art in Markdown for LLM agent consumption.

---

## 1. Overview

FloWords is a single-user, macOS-native desktop drawing tool built on top of TLDraw. It runs as a background daemon with a global hotkey (`Cmd+\`) to summon/dismiss the window instantly. The core value proposition is bridging visual thinking (diagrams, wireframes) with text-based LLM agent workflows by converting structured drawings into ASCII art wrapped in Markdown code fences.

### Target User

Senior product engineers and architects who think visually, draw constantly during meetings, and work heavily with LLM coding agents (Claude, OpenClaw, etc.) that consume Markdown.

### Core Workflow

1. Press `Cmd+\` to summon FloWords
2. Draw shapes, arrows, and labels on the TLDraw canvas
3. See a live ASCII preview in a side panel (debounced ~500ms)
4. Click "Copy" to get the ASCII art (wrapped in triple backtick code fence) on the clipboard
5. Paste directly into an agent conversation
6. Optionally save the drawing (auto-saved as `.tldr` + `.md` to a configurable directory)
7. Press `Cmd+\` to dismiss FloWords back to the background

---

## 2. Tech Stack

| Layer            | Technology                          |
| ---------------- | ----------------------------------- |
| Runtime          | Electron (macOS only, v1)           |
| Build tooling    | electron-vite                       |
| Package manager  | Bun                                 |
| Language         | TypeScript (strict)                 |
| UI framework     | React 18+                           |
| Styling          | Tailwind CSS v4                     |
| Drawing engine   | TLDraw v4.x (`tldraw` npm package) |
| Bundler          | Vite (via electron-vite)            |

### Project Structure

```
FloWords/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # App lifecycle, window management, tray, global shortcuts
│   │   ├── ipc.ts               # IPC handlers (file save/load, clipboard, settings)
│   │   └── store.ts             # Settings persistence (save directory, hotkey, etc.)
│   ├── preload/
│   │   └── index.ts             # contextBridge API exposed to renderer
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── main.tsx         # React entry point
│           ├── App.tsx          # Root layout (sidebar + canvas + ASCII panel)
│           ├── components/
│           │   ├── Canvas.tsx           # TLDraw wrapper with store listeners
│           │   ├── AsciiPreview.tsx     # Live ASCII preview panel
│           │   ├── FileSidebar.tsx      # .tldr file browser
│           │   ├── Toolbar.tsx          # Mode toggle (UI/Architecture), copy button
│           │   └── Settings.tsx         # Settings page
│           ├── engine/
│           │   ├── converter.ts         # Main conversion orchestrator
│           │   ├── grid.ts              # Character grid data structure
│           │   ├── shapes.ts            # Shape-to-grid rendering (boxes, circles)
│           │   ├── arrows.ts            # Arrow routing and rendering
│           │   ├── labels.ts            # Text placement and word wrapping
│           │   └── layout.ts            # Spatial layout / coordinate mapping
│           ├── hooks/
│           │   ├── useAsciiConversion.ts # Debounced conversion hook
│           │   ├── useFileManager.ts     # File save/load/list operations
│           │   └── useSettings.ts        # Settings state
│           ├── types/
│           │   └── index.ts             # Shared type definitions
│           └── assets/
│               └── main.css             # Tailwind + terminal theme styles
├── resources/
│   └── trayIconTemplate.png     # macOS tray icon (template image)
├── electron.vite.config.ts
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
└── tailwind.config.ts
```

---

## 3. Electron Shell Behavior

### Background Daemon

- The app starts hidden (no splash screen, no landing page).
- The dock icon is hidden via `app.dock.hide()` on macOS.
- A system tray icon is created with a context menu: "Show/Hide" and "Quit".
- Closing the window hides it instead of quitting the app.
- The app stays resident in memory for instant recall.

### Global Hotkey

- Default: `Cmd+\`
- Registered via `globalShortcut.register()` after `app.whenReady()`.
- Toggles window visibility (show + focus, or hide).
- The hotkey binding is user-configurable via the Settings page.
- Unregistered on `will-quit`.

### Window Behavior

- On summon: window shows and receives focus, opens to a blank canvas (or the last open drawing if one was active).
- On dismiss: window hides, app continues running in tray.
- Window is resizable with a sensible default size (e.g., 1200x800).

---

## 4. UI Layout

```
+--------+----------------------------+--------------------+
| File   |                            |                    |
| Side-  |      TLDraw Canvas         |   ASCII Preview    |
| bar    |      (stock UI)            |   Panel            |
|        |                            |                    |
| .tldr  |                            |  +-------------+   |
| files  |                            |  | Live ASCII   |   |
|        |                            |  | rendering    |   |
| [New]  |                            |  | here...      |   |
| [Save] |                            |  +-------------+   |
|        |                            |                    |
|        |                            |  [Copy] [Zoom+-]   |
+--------+----------------------------+--------------------+
|  [UI / Architecture toggle]    [Settings]                |
+----------------------------------------------------------+
```

### Sidebar (Left)

- File browser listing `.tldr` files from the configured save directory.
- Sorted by modification date (newest first).
- Shows file title (or auto-generated date/time name).
- Click to open a previous drawing.
- "New" button to create a blank canvas.
- "Save" button (also accessible via `Cmd+S`).

### Canvas (Center)

- Stock TLDraw component with default icons, toolbar, and typography.
- The following TLDraw features are left available but **ignored during export**: frames, sticky notes, images, pen/draw tool, highlight, laser.
- Supported export shapes: `geo:rectangle`, `geo:ellipse`, `arrow`, `text`.
- TLDraw's native undo/redo is used as-is.

### ASCII Preview Panel (Right)

- Resizable split pane (draggable divider between canvas and preview).
- Can be collapsed into a toggleable drawer (button to show/hide).
- Displays live ASCII art rendering of the current canvas state.
- Updates on a ~500ms debounce after the last canvas change.
- Zoom level control (slider or +/- buttons) to adjust ASCII detail/compactness.
- Auto-fits to a sensible width by default (80-120 characters).
- "Copy to Clipboard" button — copies ASCII wrapped in Markdown code fence.

### Mode Toggle

- A toggle switch in the bottom toolbar: **UI Wireframe** vs **Architecture Diagram**.
- **Architecture mode**: prioritizes arrow routing clarity, connection rendering, and flow.
- **UI Wireframe mode**: prioritizes spatial fidelity, no arrows expected, layout preservation.
- Defaults to Architecture mode.

### Terminal Aesthetic

- Applied to: Electron chrome, sidebar, ASCII preview panel, bottom toolbar, settings page.
- **Not** applied to: TLDraw canvas (stock UI for v1).
- Color palette: amber on black base, inspired by Alien franchise / Fallout Pip-Boy / IBM amber terminals.
- Visual effects: scanlines, subtle phosphor glow, monospace fonts for all non-TLDraw UI.
- Single fixed theme for v1 (no theme switching).

---

## 5. ASCII Conversion Engine

This is the core of the product. The engine reads TLDraw's document store (shapes, bindings, text) and renders them onto a character grid.

### Input

The engine reads from TLDraw's reactive store:

- **Shapes** (`typeName: 'shape'`):
  - `type: 'geo'` with `props.geo: 'rectangle'` — renders as ASCII box
  - `type: 'geo'` with `props.geo: 'ellipse'` — renders as ASCII circle
  - `type: 'arrow'` — renders as ASCII arrow with routing
  - `type: 'text'` — renders as standalone text label
  - All other shape types are ignored during conversion.
- **Bindings** (`typeName: 'binding'`):
  - Arrow bindings connect arrows to shapes via `fromId` (arrow) and `toId` (target).
  - `props.terminal: 'start' | 'end'` indicates which end of the arrow is bound.
  - Used via `getArrowBindings(editor, arrowShape)` to resolve connections.

### Coordinate Mapping

1. Collect all exportable shapes from the store.
2. Compute the bounding box of all shapes (min/max x/y).
3. Map pixel coordinates to character grid positions based on zoom level.
4. Default character cell size: ~8px wide, ~16px tall (adjustable via zoom).
5. The grid auto-sizes to fit all shapes with padding.

### Shape Rendering

**Rectangles:**

```
+--------------------+
| Label text here    |
+--------------------+
```

- Box width auto-sizes to fit label text on one line.
- If the user has manually resized the shape smaller, text word-wraps:

```
+------------------+
| This is a longer |
| label that wraps |
+------------------+
```

- Characters used: `+` corners, `-` horizontal, `|` vertical.

**Circles / Ellipses:**

```
  .--------.
 (  Label   )
  '--------'
```

- Characters used: `.` and `'` for top/bottom curves, `(` and `)` for sides.
- Label centered inside.

**Text (standalone):**

```
Just plain text rendered at position
```

- No box, no decoration. Placed at the mapped grid position.

### Arrow Rendering

**Simple horizontal:**

```
+---+       +---+
| A |------>| B |
+---+       +---+
```

**Simple vertical:**

```
+---+
| A |
+---+
  |
  v
+---+
| B |
+---+
```

**With label:**

```
+---+  HTTP req  +---+
| A |----------->| B |
+---+            +---+
```

**Routed (avoids obstacles):**

The engine attempts to route arrows around other shapes using a simple pathfinding approach:
1. Determine start edge and end edge of connected shapes.
2. Attempt a straight horizontal or vertical line.
3. If blocked by another shape's bounding box, route around with one or two bends.
4. Use `|` for vertical segments, `-` for horizontal segments, `+` for bends.
5. Arrowheads: `>` (right), `<` (left), `v` (down), `^` (up).

**Characters used:** `-` horizontal, `|` vertical, `+` bend/junction, `>`, `<`, `v`, `^` arrowheads.

### Color Preservation

- If a shape has a non-default color in TLDraw, add a small annotation comment below the ASCII art block:

```
<!-- Colors: A=red, B=blue, Connection1=green -->
```

- This is appended after the code fence in the Markdown output, only if colors were used.

### Mode Behavior

**Architecture mode:**
- Arrow rendering is prioritized; connections are the primary information.
- Shapes are spaced to allow clear arrow routing between them.
- Grid spacing may be adjusted to prevent arrow overlap.

**UI Wireframe mode:**
- Spatial position is prioritized; layout fidelity is the primary information.
- Shapes are placed as close to their visual canvas position as possible.
- Arrows are not expected (but rendered if present).
- Nested shapes (e.g., cards inside a container) are rendered with containment.

### Zoom Level

- Controls the character-per-pixel ratio.
- Lower zoom = more compact, less detail.
- Higher zoom = more spread out, more detail, larger output.
- Default: auto-fit (calculates optimal zoom to fit all shapes within 80-120 character width).
- User can override via +/- controls in the ASCII panel.
- Larger drawings automatically get more detail at the default zoom.

### Error Handling

- Best-effort rendering at all times.
- Overlapping shapes: last-drawn shape wins (overwrites grid cells).
- Very complex drawings may produce messy output — this is acceptable.
- No error dialogs or warnings for conversion issues.

---

## 6. File Management

### Save Directory

- Configurable via Settings page.
- Default: `~/FloWords/` (created on first launch if it doesn't exist).
- All `.tldr` and `.md` files are saved side-by-side in this directory.

### File Naming

- Auto-generated name: `YYYY-MM-DD_HH-mm` (e.g., `2026-02-17_21-45`).
- User can override with a custom title via the save dialog or an inline title field.
- Both files share the same base name: `my-drawing.tldr` + `my-drawing.md`.

### File Format — .tldr

Standard TLDraw file format:

```json
{
  "tldrawFileFormatVersion": 1,
  "schema": { ... },
  "records": [ ... ]
}
```

Saved via `getSnapshot(editor.store)` and loaded via `loadSnapshot(editor.store, snapshot)`.

### File Format — .md

```markdown
# Drawing Title

> Created: 2026-02-17 21:45

\`\`\`
+----------+    +----------+    +----------+
| Frontend |--->|   API    |--->|    DB    |
+----------+    +----------+    +----------+
\`\`\`
```

That's it. Title heading, timestamp, code-fenced ASCII, nothing else. If colors were used, a single HTML comment is appended after the code fence.

### File Browser

- Sidebar lists all `.tldr` files from the save directory.
- `.md` files are **not** shown in the sidebar.
- Click a `.tldr` file to load it into the canvas.
- The ASCII panel updates to reflect the loaded drawing.
- To get the Markdown for a previous drawing: open it, then click "Copy to Clipboard".

### Save Behavior

- `Cmd+S` saves (or overwrites) the current drawing.
- No version history. Overwrite-on-save.
- Both `.tldr` and `.md` files are written on every save.

---

## 7. Clipboard

When the user clicks "Copy to Clipboard" or uses a keyboard shortcut:

```
\`\`\`
+----------+    +----------+
| Frontend |--->|   API    |
+----------+    +----------+
\`\`\`
```

- Raw ASCII art wrapped in a Markdown code fence (triple backticks).
- No title, no timestamp, no metadata.
- Copied as plain text to the system clipboard via Electron's `clipboard.writeText()`.

---

## 8. Settings

Accessible via a settings icon/button in the bottom toolbar. A simple settings panel (can be a modal or a dedicated view).

| Setting                 | Type       | Default         | Description                                  |
| ----------------------- | ---------- | --------------- | -------------------------------------------- |
| Global hotkey           | Keybinding | `Cmd+\`         | Shortcut to summon/dismiss the window        |
| Save directory          | File path  | `~/FloWords/`   | Where `.tldr` and `.md` files are stored     |
| ASCII style             | Dropdown   | `simple`        | ASCII character style for box rendering      |
| Default export width    | Number     | `100`           | Default character width for ASCII output     |

### ASCII Style Options (Future)

For v1, only the simple style is implemented:

- **Simple**: `+--+`, `--->`, `( )` — maximally compatible, no Unicode.

Future styles could include:
- **Unicode**: `┌──┐`, `───▶`, rounded corners.
- **Minimal**: No box borders, just labels with spatial positioning.

---

## 9. TLDraw Integration Details

### Embedding

```tsx
<Tldraw
  onMount={(editor) => {
    // Store editor reference for ASCII conversion
    // Set up store.listen() for live preview updates
  }}
  overrides={{
    tools: (_editor, tools) => {
      // All tools remain available for drawing flexibility
      // No tools are removed in v1
      return tools
    },
  }}
/>
```

### Store Listener (for live ASCII preview)

```typescript
editor.store.listen(
  (change) => {
    // Debounce and trigger ASCII re-conversion
    // Filter for shape and binding changes only
  },
  { source: 'user', scope: 'document' }
)
```

### Shape Data Access

For each shape on the current page:

```typescript
const shapes = editor.getCurrentPageShapes()
```

For arrow bindings:

```typescript
import { getArrowBindings } from 'tldraw'
const bindings = getArrowBindings(editor, arrowShape)
// bindings.start?.toId — the shape the arrow starts from
// bindings.end?.toId   — the shape the arrow ends at
```

### Rich Text Extraction

TLDraw v4.x uses `richText` instead of plain `text` for shape labels. The engine will need to extract plain text from the rich text structure for ASCII rendering.

---

## 10. IPC Architecture

Communication between Electron's main process and the renderer:

| Channel                    | Direction          | Payload                          | Purpose                              |
| -------------------------- | ------------------ | -------------------------------- | ------------------------------------ |
| `file:save`                | Renderer → Main    | `{ name, tldr, markdown }`       | Save both files to disk              |
| `file:load`                | Renderer → Main    | `{ name }`                       | Load a .tldr file                    |
| `file:load:result`         | Main → Renderer    | `{ tldr }` or `{ error }`        | Return loaded file contents          |
| `file:list`                | Renderer → Main    | —                                | List .tldr files in save directory   |
| `file:list:result`         | Main → Renderer    | `{ files: FileInfo[] }`          | Return file listing                  |
| `clipboard:write`          | Renderer → Main    | `{ text }`                       | Write to system clipboard            |
| `settings:get`             | Renderer → Main    | —                                | Fetch current settings               |
| `settings:set`             | Renderer → Main    | `{ key, value }`                 | Update a setting                     |
| `settings:result`          | Main → Renderer    | `{ settings }`                   | Return settings object               |

The preload script exposes these as typed async functions via `contextBridge.exposeInMainWorld()`.

---

## 11. Implementation Phases

### Phase 1 — Skeleton (Electron + TLDraw running)

- [ ] Scaffold electron-vite project with Bun + React + TypeScript + Tailwind
- [ ] Embed TLDraw in the renderer with stock UI
- [ ] Implement background daemon behavior (tray icon, dock hiding)
- [ ] Implement global hotkey (`Cmd+\`) to summon/dismiss
- [ ] Blank canvas on launch, window show/hide toggle
- [ ] Verify TLDraw store access (can read shapes from `editor.getCurrentPageShapes()`)

### Phase 2 — ASCII Conversion Engine

- [ ] Implement character grid data structure
- [ ] Implement coordinate mapping (pixel → character grid)
- [ ] Implement rectangle rendering
- [ ] Implement circle/ellipse rendering
- [ ] Implement text label rendering (standalone + inside shapes)
- [ ] Implement word wrapping for shape labels
- [ ] Implement arrow rendering (straight horizontal/vertical)
- [ ] Implement arrow routing (around obstacles, one or two bends)
- [ ] Implement arrow labels
- [ ] Implement zoom level control
- [ ] Implement Architecture vs UI Wireframe mode toggle
- [ ] Wire up store listener with 500ms debounce for live preview

### Phase 3 — UI Layout & Side Panels

- [ ] Implement resizable split pane layout (canvas + ASCII preview)
- [ ] Implement ASCII preview panel with live rendering
- [ ] Implement collapsible drawer mode for ASCII panel
- [ ] Implement "Copy to Clipboard" button (code-fence wrapped)
- [ ] Implement file sidebar (list .tldr files)
- [ ] Implement file browser click-to-open
- [ ] Implement New/Save functionality with auto-naming
- [ ] Implement save dialog with custom title override
- [ ] Implement zoom +/- controls in ASCII panel

### Phase 4 — Terminal Aesthetic

- [ ] Design and implement terminal theme CSS (amber on black)
- [ ] Apply scanline overlay effect
- [ ] Apply phosphor glow effect (CSS text-shadow / box-shadow)
- [ ] Monospace font for all chrome (sidebar, preview, toolbar)
- [ ] Style the file sidebar with terminal aesthetic
- [ ] Style the ASCII preview panel
- [ ] Style the bottom toolbar and mode toggle
- [ ] Style the settings panel
- [ ] Create macOS tray icon (template image)

### Phase 5 — Settings & Polish

- [ ] Implement settings panel UI
- [ ] Implement configurable global hotkey (re-register on change)
- [ ] Implement configurable save directory (with folder picker)
- [ ] Implement ASCII export width setting
- [ ] Color annotation support in Markdown output
- [ ] Edge case testing (large drawings, overlapping shapes, empty canvas)
- [ ] Keyboard shortcut for copy (`Cmd+Shift+C` or similar)

### Phase 6 (Future) — TLDraw Reskin

- [ ] Custom SVG icons for TLDraw toolbar
- [ ] Custom typography for TLDraw canvas
- [ ] Full terminal aesthetic applied to TLDraw internals
- [ ] Theme variants (amber, green, custom)
- [ ] Additional ASCII style options (Unicode, minimal)

---

## 12. Open Questions

These are decisions that can be deferred to implementation time:

1. **Rich text parsing** — TLDraw v4.x uses `richText` objects. Need to determine the exact structure and how to extract plain text for ASCII rendering.
2. **Arrow routing algorithm** — Simple A* on the character grid, or a more purpose-built orthogonal routing algorithm? Can be decided during Phase 2 implementation.
3. **Performance threshold** — At what number of shapes does the 500ms debounce become insufficient? May need to profile and adjust.
4. **Tray icon design** — Needs a small monochrome icon that fits the FloWords brand.
5. **Auto-save behavior** — Should drawings auto-save periodically, or only on explicit `Cmd+S`? Currently spec'd as explicit save only.
