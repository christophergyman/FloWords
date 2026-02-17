import type { CharGrid } from './grid'
import type { ResolvedArrow, GridPoint } from '../types'
import { centerText } from './labels'

export function renderArrow(
  grid: CharGrid,
  arrow: ResolvedArrow,
  gridPoints: GridPoint[],
  z: number
): void {
  if (gridPoints.length < 2) return

  // Draw segments between consecutive points
  for (let i = 0; i < gridPoints.length - 1; i++) {
    const from = gridPoints[i]
    const to = gridPoints[i + 1]
    drawSegment(grid, from, to, z)
  }

  // Draw bends at interior points
  for (let i = 1; i < gridPoints.length - 1; i++) {
    const pt = gridPoints[i]
    grid.set(pt.col, pt.row, '+', z)
  }

  // Arrowhead at start (uses direction from point[1] → point[0])
  if (arrow.arrowheadStart !== 'none' && gridPoints.length >= 2) {
    const tip = gridPoints[0]
    const next = gridPoints[1]
    const headChar = getArrowhead(next, tip)
    grid.set(tip.col, tip.row, headChar, z)
  }

  // Arrowhead at end (uses direction from second-to-last → last)
  if (arrow.arrowheadEnd !== 'none' && gridPoints.length >= 2) {
    const tip = gridPoints[gridPoints.length - 1]
    const prev = gridPoints[gridPoints.length - 2]
    const headChar = getArrowhead(prev, tip)
    grid.set(tip.col, tip.row, headChar, z)
  }
}

function drawSegment(grid: CharGrid, from: GridPoint, to: GridPoint, z: number): void {
  const dx = to.col - from.col
  const dy = to.row - from.row

  if (dy === 0 && dx !== 0) {
    // Horizontal segment
    const startCol = Math.min(from.col, to.col)
    const endCol = Math.max(from.col, to.col)
    for (let c = startCol; c <= endCol; c++) {
      grid.set(c, from.row, '-', z)
    }
  } else if (dx === 0 && dy !== 0) {
    // Vertical segment
    const startRow = Math.min(from.row, to.row)
    const endRow = Math.max(from.row, to.row)
    for (let r = startRow; r <= endRow; r++) {
      grid.set(from.col, r, '|', z)
    }
  } else {
    // Diagonal — convert to L-shape
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal-first L-bend
      const midCol = to.col
      // Horizontal part
      const hStart = Math.min(from.col, midCol)
      const hEnd = Math.max(from.col, midCol)
      for (let c = hStart; c <= hEnd; c++) {
        grid.set(c, from.row, '-', z)
      }
      // Bend
      grid.set(midCol, from.row, '+', z)
      // Vertical part
      const vStart = Math.min(from.row, to.row)
      const vEnd = Math.max(from.row, to.row)
      for (let r = vStart; r <= vEnd; r++) {
        grid.set(midCol, r, '|', z)
      }
    } else {
      // Vertical-first L-bend
      const midRow = to.row
      // Vertical part
      const vStart = Math.min(from.row, midRow)
      const vEnd = Math.max(from.row, midRow)
      for (let r = vStart; r <= vEnd; r++) {
        grid.set(from.col, r, '|', z)
      }
      // Bend
      grid.set(from.col, midRow, '+', z)
      // Horizontal part
      const hStart = Math.min(from.col, to.col)
      const hEnd = Math.max(from.col, to.col)
      for (let c = hStart; c <= hEnd; c++) {
        grid.set(c, midRow, '-', z)
      }
    }
  }
}

function getArrowhead(from: GridPoint, tip: GridPoint): string {
  const dx = tip.col - from.col
  const dy = tip.row - from.row

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? '>' : '<'
  } else {
    return dy > 0 ? 'v' : '^'
  }
}

export function renderArrowLabel(
  grid: CharGrid,
  label: string,
  gridPoints: GridPoint[],
  z: number
): void {
  if (!label || gridPoints.length < 2) return

  // Find midpoint of the path
  const midIdx = Math.floor(gridPoints.length / 2)
  const midPt =
    gridPoints.length % 2 === 0
      ? {
          col: Math.round((gridPoints[midIdx - 1].col + gridPoints[midIdx].col) / 2),
          row: Math.round((gridPoints[midIdx - 1].row + gridPoints[midIdx].row) / 2)
        }
      : gridPoints[midIdx]

  // Determine direction at midpoint
  const prevIdx = Math.max(0, midIdx - 1)
  const nextIdx = Math.min(gridPoints.length - 1, midIdx)
  const dx = Math.abs(gridPoints[nextIdx].col - gridPoints[prevIdx].col)
  const dy = Math.abs(gridPoints[nextIdx].row - gridPoints[prevIdx].row)

  const centered = centerText(label, label.length)

  if (dx >= dy) {
    // Horizontal segment — place label one row above, centered on midpoint
    const startCol = midPt.col - Math.floor(centered.length / 2)
    grid.writeString(startCol, midPt.row - 1, centered, z)
  } else {
    // Vertical segment — place label one column to the right
    grid.writeString(midPt.col + 2, midPt.row, centered, z)
  }
}
