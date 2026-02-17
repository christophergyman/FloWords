export type ConversionMode = 'architecture' | 'wireframe'

export interface ConversionOptions {
  mode: ConversionMode
  cellWidth: number
  cellHeight: number
  zoom: number // 0 = auto-fit
  targetWidth: number
  padding: number
}

export const DEFAULT_OPTIONS: ConversionOptions = {
  mode: 'architecture',
  cellWidth: 8,
  cellHeight: 16,
  zoom: 0,
  targetWidth: 100,
  padding: 2
}

export interface GridCell {
  char: string
  z: number
}

export interface GridPoint {
  col: number
  row: number
}

export interface GridBounds {
  col: number
  row: number
  width: number
  height: number
}

export interface ResolvedRect {
  kind: 'rect'
  id: string
  x: number
  y: number
  w: number
  h: number
  label: string
  color: string
}

export interface ResolvedEllipse {
  kind: 'ellipse'
  id: string
  x: number
  y: number
  w: number
  h: number
  label: string
  color: string
}

export interface ResolvedText {
  kind: 'text'
  id: string
  x: number
  y: number
  w: number
  text: string
  color: string
}

export interface ResolvedArrow {
  kind: 'arrow'
  id: string
  points: { x: number; y: number }[]
  label: string
  color: string
  arrowheadStart: string
  arrowheadEnd: string
  startBinding: string | null
  endBinding: string | null
}

export type ResolvedShape = ResolvedRect | ResolvedEllipse | ResolvedText | ResolvedArrow

export interface ColorEntry {
  color: string
  shapeIds: string[]
}

export interface ConversionResult {
  ascii: string
  colors: ColorEntry[]
  gridWidth: number
  gridHeight: number
}
