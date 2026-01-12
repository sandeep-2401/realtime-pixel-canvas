import type { Pixel, PixelLock, CanvasSnapshot } from "./types.js"
import { getPrisma } from "./prisma.js"
import { getActiveLocks } from "./locks.js"

const WIDTH = 50
const HEIGHT = 50

export async function loadRoomFromDB(
  roomId: string,
  canvas: Map<string, Pixel>
) {
  try {
    const prisma = getPrisma()
    const rows = await prisma.pixel.findMany({
      where: { roomId }
    })

    for (const r of rows) {
      canvas.set(`${r.x}:${r.y}`, { x: r.x, y: r.y, color: r.color })
    }

    console.log(`Room ${roomId} hydrated from DB`)
  } catch (err) {
    console.error(`DB unavailable for room ${roomId}, starting empty`)
  }
}

export function initCanvas(canvas: Map<string, Pixel>) {
  for (let x = 0; x < WIDTH; x++) {
    for (let y = 0; y < HEIGHT; y++) {
      const key = `${x}:${y}`
      canvas.set(key, { x, y, color: "#ffffff" })
    }
  }
}

export async function updatePixel(
  roomId: string,
  canvas: Map<string, Pixel>,
  x: number,
  y: number,
  color: string
) {
  canvas.set(`${x}:${y}`, { x, y, color })

  try {
    const prisma = getPrisma()
    await prisma.pixel.upsert({
      where: { roomId_x_y: { roomId, x, y } },
      update: { color },
      create: { roomId, x, y, color }
    })
  } catch (err) {
    console.error(
      `DB write failed for room ${roomId} at (${x}, ${y})`
    )
  }
}

function getCanvasState(
  canvas: Map<string, Pixel>
): Pixel[] {
  return Array.from(canvas.values())
}

export function getAuthoritativeSnapshot(
  locks: Map<string, PixelLock>,
  canvas: Map<string, Pixel>
): CanvasSnapshot {
  return {
    pixels: getCanvasState(canvas),
    locks: getActiveLocks(locks)
  }
}
