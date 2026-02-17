import type { CharGrid } from './grid'
import type { ResolvedRect, ResolvedEllipse, ResolvedText, GridBounds, GridPoint } from '../types'
import { wordWrap, centerText } from './labels'

export function renderRect(
  grid: CharGrid,
  _rect: ResolvedRect,
  bounds: GridBounds,
  z: number
): void {
  const { col, row, width, height } = bounds

  // Enforce minimum size
  const w = Math.max(width, 3)
  const h = Math.max(height, 3)

  // Corners
  grid.set(col, row, '+', z)
  grid.set(col + w - 1, row, '+', z)
  grid.set(col, row + h - 1, '+', z)
  grid.set(col + w - 1, row + h - 1, '+', z)

  // Top and bottom borders
  grid.hLine(col + 1, row, w - 2, '-', z)
  grid.hLine(col + 1, row + h - 1, w - 2, '-', z)

  // Left and right borders
  grid.vLine(col, row + 1, h - 2, '|', z)
  grid.vLine(col + w - 1, row + 1, h - 2, '|', z)

  // Interior fill with spaces (to establish z-order for labels)
  for (let r = row + 1; r < row + h - 1; r++) {
    for (let c = col + 1; c < col + w - 1; c++) {
      grid.set(c, r, ' ', z)
    }
  }

  // Label
  if (_rect.label) {
    const innerWidth = w - 4 // 2 for border + 1 padding each side
    if (innerWidth > 0) {
      const lines = wordWrap(_rect.label, innerWidth)
      const innerHeight = h - 2
      const startRow = row + 1 + Math.max(0, Math.floor((innerHeight - lines.length) / 2))

      for (let i = 0; i < lines.length && startRow + i < row + h - 1; i++) {
        const centered = centerText(lines[i], innerWidth)
        grid.writeString(col + 2, startRow + i, centered, z)
      }
    }
  }
}

export function renderEllipse(
  grid: CharGrid,
  ellipse: ResolvedEllipse,
  bounds: GridBounds,
  z: number
): void {
  const { col, row, width, height } = bounds

  const w = Math.max(width, 5)
  const h = Math.max(height, 3)

  // Inner width for content (between parentheses + padding)
  const innerW = w - 4

  if (h === 3) {
    // Simple single-row ellipse:  .---------.
    //                             (  Label   )
    //                             '---------'
    grid.set(col + 1, row, '.', z)
    grid.hLine(col + 2, row, w - 4, '-', z)
    grid.set(col + w - 2, row, '.', z)

    grid.set(col, row + 1, '(', z)
    grid.set(col + w - 1, row + 1, ')', z)
    // Fill interior
    for (let c = col + 1; c < col + w - 1; c++) {
      grid.set(c, row + 1, ' ', z)
    }

    grid.set(col + 1, row + 2, "'", z)
    grid.hLine(col + 2, row + 2, w - 4, '-', z)
    grid.set(col + w - 2, row + 2, "'", z)

    // Label in middle row
    if (ellipse.label && innerW > 0) {
      const truncated =
        ellipse.label.length > innerW ? ellipse.label.slice(0, innerW) : ellipse.label
      const centered = centerText(truncated, innerW)
      grid.writeString(col + 2, row + 1, centered, z)
    }
  } else {
    // Taller ellipse with multiple middle rows
    // Top: space + . + dashes + . + space
    grid.set(col + 1, row, '.', z)
    grid.hLine(col + 2, row, w - 4, '-', z)
    grid.set(col + w - 2, row, '.', z)

    // Middle rows with ( and )
    for (let r = row + 1; r < row + h - 1; r++) {
      grid.set(col, r, '(', z)
      grid.set(col + w - 1, r, ')', z)
      // Fill interior
      for (let c = col + 1; c < col + w - 1; c++) {
        grid.set(c, r, ' ', z)
      }
    }

    // Bottom: space + ' + dashes + ' + space
    grid.set(col + 1, row + h - 1, "'", z)
    grid.hLine(col + 2, row + h - 1, w - 4, '-', z)
    grid.set(col + w - 2, row + h - 1, "'", z)

    // Label vertically centered
    if (ellipse.label && innerW > 0) {
      const lines = wordWrap(ellipse.label, innerW)
      const bodyHeight = h - 2
      const startRow = row + 1 + Math.max(0, Math.floor((bodyHeight - lines.length) / 2))

      for (let i = 0; i < lines.length && startRow + i < row + h - 1; i++) {
        const centered = centerText(lines[i], innerW)
        grid.writeString(col + 2, startRow + i, centered, z)
      }
    }
  }
}

export function renderText(
  grid: CharGrid,
  text: ResolvedText,
  point: GridPoint,
  z: number
): void {
  if (!text.text) return
  const lines = text.text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    grid.writeString(point.col, point.row + i, lines[i], z)
  }
}
