import type { GridCell } from '../types'

export class CharGrid {
  readonly width: number
  readonly height: number
  private cells: GridCell[][]

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.cells = []
    for (let r = 0; r < height; r++) {
      const row: GridCell[] = []
      for (let c = 0; c < width; c++) {
        row.push({ char: ' ', z: -1 })
      }
      this.cells.push(row)
    }
  }

  private inBounds(col: number, row: number): boolean {
    return col >= 0 && col < this.width && row >= 0 && row < this.height
  }

  set(col: number, row: number, char: string, z: number): void {
    if (!this.inBounds(col, row)) return
    const cell = this.cells[row][col]
    if (z >= cell.z) {
      cell.char = char
      cell.z = z
    }
  }

  get(col: number, row: number): GridCell | undefined {
    if (!this.inBounds(col, row)) return undefined
    return this.cells[row][col]
  }

  writeString(col: number, row: number, text: string, z: number): void {
    for (let i = 0; i < text.length; i++) {
      this.set(col + i, row, text[i], z)
    }
  }

  hLine(col: number, row: number, length: number, char: string, z: number): void {
    for (let i = 0; i < length; i++) {
      this.set(col + i, row, char, z)
    }
  }

  vLine(col: number, row: number, length: number, char: string, z: number): void {
    for (let i = 0; i < length; i++) {
      this.set(col, row + i, char, z)
    }
  }

  isOccupied(col: number, row: number): boolean {
    if (!this.inBounds(col, row)) return false
    return this.cells[row][col].char !== ' '
  }

  regionOccupied(col: number, row: number, w: number, h: number): boolean {
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        if (this.isOccupied(c, r)) return true
      }
    }
    return false
  }

  toString(): string {
    const lines: string[] = []
    for (let r = 0; r < this.height; r++) {
      let line = ''
      for (let c = 0; c < this.width; c++) {
        line += this.cells[r][c].char
      }
      lines.push(line.replace(/\s+$/, ''))
    }

    // Trim trailing empty lines
    while (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop()
    }

    return lines.join('\n')
  }
}
