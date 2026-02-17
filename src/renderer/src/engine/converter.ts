import type { Editor } from 'tldraw'
import type { ConversionOptions, ConversionResult, ColorEntry, GridPoint } from '../types'
import { DEFAULT_OPTIONS } from '../types'
import { CharGrid } from './grid'
import {
  resolveShapes,
  computePageBounds,
  calculateAutoZoom,
  pageToGrid,
  pageBoundsToGrid
} from './layout'
import { renderRect, renderEllipse, renderText } from './shapes'
import { renderArrow, renderArrowLabel } from './arrows'

export function convertToAscii(
  editor: Editor,
  options?: Partial<ConversionOptions>
): ConversionResult {
  const opts: ConversionOptions = { ...DEFAULT_OPTIONS, ...options }

  // 1. Resolve TLDraw shapes to intermediate format
  const shapes = resolveShapes(editor)
  if (shapes.length === 0) {
    return { ascii: '', colors: [], gridWidth: 0, gridHeight: 0 }
  }

  // 2. Compute page bounds
  const pageBounds = computePageBounds(shapes)

  // 3. Calculate zoom
  let zoom = opts.zoom
  if (zoom === 0) {
    zoom = calculateAutoZoom(pageBounds, opts)
  }

  // 4. Architecture mode: reduce effective cell sizes for extra spacing
  let cellWidth = opts.cellWidth
  let cellHeight = opts.cellHeight
  if (opts.mode === 'architecture') {
    cellWidth = opts.cellWidth * 1.3
    cellHeight = opts.cellHeight * 1.3
  }

  // 5. Compute grid dimensions
  const pageWidth = pageBounds.maxX - pageBounds.minX
  const pageHeight = pageBounds.maxY - pageBounds.minY
  const gridWidth = Math.ceil((pageWidth * zoom) / cellWidth) + opts.padding * 2 + 1
  const gridHeight = Math.ceil((pageHeight * zoom) / cellHeight) + opts.padding * 2 + 1

  // 6. Create grid
  const grid = new CharGrid(gridWidth, gridHeight)

  // Separate arrows from non-arrows for z-ordering
  const nonArrows = shapes.filter((s) => s.kind !== 'arrow')
  const arrows = shapes.filter((s) => s.kind === 'arrow')

  // 7. Render non-arrow shapes first (ascending z-order by draw order)
  for (let i = 0; i < nonArrows.length; i++) {
    const shape = nonArrows[i]
    const z = i

    if (shape.kind === 'rect') {
      const bounds = pageBoundsToGrid(
        shape.x, shape.y, shape.w, shape.h,
        pageBounds.minX, pageBounds.minY,
        cellWidth, cellHeight, zoom, opts.padding
      )
      renderRect(grid, shape, bounds, z)
    } else if (shape.kind === 'ellipse') {
      const bounds = pageBoundsToGrid(
        shape.x, shape.y, shape.w, shape.h,
        pageBounds.minX, pageBounds.minY,
        cellWidth, cellHeight, zoom, opts.padding
      )
      renderEllipse(grid, shape, bounds, z)
    } else if (shape.kind === 'text') {
      const point = pageToGrid(
        shape.x, shape.y,
        pageBounds.minX, pageBounds.minY,
        cellWidth, cellHeight, zoom, opts.padding
      )
      renderText(grid, shape, point, z)
    }
  }

  // 8. Render arrows last (higher z so arrowheads punch through box borders)
  const arrowBaseZ = nonArrows.length
  for (let i = 0; i < arrows.length; i++) {
    const arrow = arrows[i]
    if (arrow.kind !== 'arrow') continue
    const z = arrowBaseZ + i

    const gridPoints: GridPoint[] = arrow.points.map((pt) =>
      pageToGrid(
        pt.x, pt.y,
        pageBounds.minX, pageBounds.minY,
        cellWidth, cellHeight, zoom, opts.padding
      )
    )

    renderArrow(grid, arrow, gridPoints, z)

    if (arrow.label) {
      renderArrowLabel(grid, arrow.label, gridPoints, z)
    }
  }

  // 9. Collect colors
  const colorMap = new Map<string, string[]>()
  for (const shape of shapes) {
    const color = shape.color
    if (color && color !== 'black') {
      if (!colorMap.has(color)) {
        colorMap.set(color, [])
      }
      colorMap.get(color)!.push(shape.id)
    }
  }

  const colors: ColorEntry[] = []
  for (const [color, shapeIds] of colorMap) {
    colors.push({ color, shapeIds })
  }

  // 10. Serialize
  return {
    ascii: grid.toString(),
    colors,
    gridWidth,
    gridHeight
  }
}
