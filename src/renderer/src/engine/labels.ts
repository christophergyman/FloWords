/**
 * Greedy word-wrap: packs words into lines up to maxWidth characters.
 */
export function wordWrap(text: string, maxWidth: number): string[] {
  if (maxWidth <= 0) return []
  const words = text.split(/\s+/).filter((w) => w.length > 0)
  if (words.length === 0) return []

  const lines: string[] = []
  let currentLine = words[0]

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    if (currentLine.length + 1 + word.length <= maxWidth) {
      currentLine += ' ' + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  lines.push(currentLine)
  return lines
}

/**
 * Center text within a given width, padding with spaces.
 */
export function centerText(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width)
  const leftPad = Math.floor((width - text.length) / 2)
  return text.padStart(leftPad + text.length).padEnd(width)
}

/**
 * Left-align text within a given width, padding with spaces on the right.
 */
export function leftAlignText(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width)
  return text.padEnd(width)
}
