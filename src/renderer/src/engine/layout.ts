import { Editor, renderPlaintextFromRichText, getArrowInfo, getArrowBindings } from 'tldraw'
import type { TLShape, TLGeoShape, TLArrowShape, TLTextShape } from 'tldraw'
import type {
  ResolvedShape,
  ResolvedRect,
  ResolvedEllipse,
  ResolvedText,
  ResolvedArrow,
  ConversionOptions,
  GridPoint,
  GridBounds
} from '../types'

interface PageBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

function isGeoShape(shape: TLShape): shape is TLGeoShape {
  return shape.type === 'geo'
}

function isArrowShape(shape: TLShape): shape is TLArrowShape {
  return shape.type === 'arrow'
}

function isTextShape(shape: TLShape): shape is TLTextShape {
  return shape.type === 'text'
}

export function resolveShapes(editor: Editor): ResolvedShape[] {
  const shapes = editor.getCurrentPageShapes()
  const resolved: ResolvedShape[] = []

  for (const shape of shapes) {
    if (isGeoShape(shape)) {
      const bounds = editor.getShapePageBounds(shape)
      if (!bounds) continue

      const label = shape.props.richText
        ? renderPlaintextFromRichText(editor, shape.props.richText)
        : ''

      const geo = shape.props.geo
      if (geo === 'ellipse' || geo === 'oval') {
        const ellipse: ResolvedEllipse = {
          kind: 'ellipse',
          id: shape.id,
          x: bounds.x,
          y: bounds.y,
          w: bounds.w,
          h: bounds.h,
          label: label.trim(),
          color: shape.props.color
        }
        resolved.push(ellipse)
      } else {
        // Treat all other geo types as rectangles
        const rect: ResolvedRect = {
          kind: 'rect',
          id: shape.id,
          x: bounds.x,
          y: bounds.y,
          w: bounds.w,
          h: bounds.h,
          label: label.trim(),
          color: shape.props.color
        }
        resolved.push(rect)
      }
    } else if (isTextShape(shape)) {
      const bounds = editor.getShapePageBounds(shape)
      if (!bounds) continue

      const text = shape.props.richText
        ? renderPlaintextFromRichText(editor, shape.props.richText)
        : ''

      const resolved_text: ResolvedText = {
        kind: 'text',
        id: shape.id,
        x: bounds.x,
        y: bounds.y,
        w: bounds.w,
        text: text.trim(),
        color: shape.props.color
      }
      resolved.push(resolved_text)
    } else if (isArrowShape(shape)) {
      const info = getArrowInfo(editor, shape)
      if (!info || !info.isValid) continue

      const transform = editor.getShapePageTransform(shape)
      const pagePoints: { x: number; y: number }[] = []

      if (info.type === 'elbow' && info.route) {
        // Elbow arrows have a routed polyline
        for (const pt of info.route.points) {
          const pagePt = transform.applyToPoint(pt)
          pagePoints.push({ x: pagePt.x, y: pagePt.y })
        }
      } else {
        // Straight and arc arrows: simplify to start → end
        const startPt = transform.applyToPoint(info.start.point)
        const endPt = transform.applyToPoint(info.end.point)
        pagePoints.push({ x: startPt.x, y: startPt.y })
        pagePoints.push({ x: endPt.x, y: endPt.y })
      }

      const bindings = getArrowBindings(editor, shape)

      const arrow: ResolvedArrow = {
        kind: 'arrow',
        id: shape.id,
        points: pagePoints,
        label: (shape.props.text || '').trim(),
        color: shape.props.color,
        arrowheadStart: shape.props.arrowheadStart,
        arrowheadEnd: shape.props.arrowheadEnd,
        startBinding: bindings.start?.toId ?? null,
        endBinding: bindings.end?.toId ?? null
      }
      resolved.push(arrow)
    }
  }

  return resolved
}

export function computePageBounds(shapes: ResolvedShape[]): PageBounds {
  if (shapes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const shape of shapes) {
    if (shape.kind === 'arrow') {
      for (const pt of shape.points) {
        minX = Math.min(minX, pt.x)
        minY = Math.min(minY, pt.y)
        maxX = Math.max(maxX, pt.x)
        maxY = Math.max(maxY, pt.y)
      }
    } else if (shape.kind === 'text') {
      minX = Math.min(minX, shape.x)
      minY = Math.min(minY, shape.y)
      maxX = Math.max(maxX, shape.x + shape.w)
      maxY = Math.max(maxY, shape.y) // text height approximated
    } else {
      minX = Math.min(minX, shape.x)
      minY = Math.min(minY, shape.y)
      maxX = Math.max(maxX, shape.x + shape.w)
      maxY = Math.max(maxY, shape.y + shape.h)
    }
  }

  return { minX, minY, maxX, maxY }
}

export function calculateAutoZoom(
  pageBounds: PageBounds,
  options: ConversionOptions
): number {
  const pageWidth = pageBounds.maxX - pageBounds.minX
  if (pageWidth <= 0) return 1

  const availableCols = options.targetWidth - options.padding * 2
  return (availableCols * options.cellWidth) / pageWidth
}

export function pageToGrid(
  px: number,
  py: number,
  originX: number,
  originY: number,
  cellWidth: number,
  cellHeight: number,
  zoom: number,
  padding: number
): GridPoint {
  return {
    col: Math.round(((px - originX) * zoom) / cellWidth) + padding,
    row: Math.round(((py - originY) * zoom) / cellHeight) + padding
  }
}

export function pageBoundsToGrid(
  x: number,
  y: number,
  w: number,
  h: number,
  originX: number,
  originY: number,
  cellWidth: number,
  cellHeight: number,
  zoom: number,
  padding: number
): GridBounds {
  const topLeft = pageToGrid(x, y, originX, originY, cellWidth, cellHeight, zoom, padding)
  const bottomRight = pageToGrid(
    x + w,
    y + h,
    originX,
    originY,
    cellWidth,
    cellHeight,
    zoom,
    padding
  )
  return {
    col: topLeft.col,
    row: topLeft.row,
    width: Math.max(bottomRight.col - topLeft.col, 1),
    height: Math.max(bottomRight.row - topLeft.row, 1)
  }
}
