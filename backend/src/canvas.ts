import type {Pixel} from './types.js'
import {prisma} from "./prisma.js"

const WIDTH = 50
const HEIGHT = 50

const canvas = new Map<String,Pixel>()

export async function loadFromDB() {
  const rows = await prisma.pixel.findMany()
  for (const r of rows) {
    canvas.set(`${r.x}:${r.y}`, { x: r.x, y: r.y, color: r.color })
  }
}

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

export async function updatePixel(x: number, y: number, color: string) {
  canvas.set(`${x}:${y}`, { x, y, color })

    await prisma.pixel.upsert({
    where: { x_y: { x, y } },
    update: { color },
    create: { x, y, color }
  })

}
