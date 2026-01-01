import type {Pixel} from './types.js'

const WIDTH = 50
const HEIGHT = 50

const canvas = new Map<String,Pixel>()

export function initCanvas() {
  for (let x = 0; x < WIDTH; x++) {
    for (let y = 0; y < HEIGHT; y++) {
      const key = `${x}:${y}`
      canvas.set(key, { x, y, color: "#ffffff" })
    }
  }
}

export function getCanvasState(): Pixel[]{
  return Array.from(canvas.values())
}

export function updatePixel(x: number, y: number, color: string) {
  canvas.set(`${x}:${y}`, { x, y, color })
}
