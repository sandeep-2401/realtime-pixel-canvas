import type {Pixel,PixelLock, CanvasSnapshot} from './types.js'
import {prisma} from "./prisma.js"
import { getActiveLocks } from './locks.js'

const WIDTH = 50
const HEIGHT = 50

// const canvas = new Map<String,Pixel>()

export async function loadRoomFromDB(
  roomId : string,
  canvas : Map<string,Pixel>
) {
  const rows = await prisma.pixel.findMany({
    where : {roomId}
  })
  for (const r of rows) {
    canvas.set(`${r.x}:${r.y}`, { x: r.x, y: r.y, color: r.color })
  }
}

export function initCanvas(canvas : Map<String,Pixel>) {
  for (let x = 0; x < WIDTH; x++) {
    for (let y = 0; y < HEIGHT; y++) {
      const key = `${x}:${y}`
      canvas.set(key, { x, y, color: "#ffffff" })
    }
  }
}

export async function updatePixel(
  roomId : string,
  canvas : Map<String,Pixel>,
  x: number, y: number, 
  color: string
) {
  canvas.set(`${x}:${y}`, { x, y, color })

    await prisma.pixel.upsert({
    where: { roomId_x_y: { roomId,x, y } },
    update: { color },
    create: { roomId,x, y, color }
  })

}

function getCanvasState(
  canvas : Map<String,Pixel>
): Pixel[]{
  return Array.from(canvas.values())
}

export function getAuthoritativeSnapshot(
  locks : Map<string, PixelLock>,
  canvas : Map<String,Pixel> 
) : CanvasSnapshot  {
  return {
    pixels: getCanvasState(canvas),
    locks: getActiveLocks(locks)
  }
}
