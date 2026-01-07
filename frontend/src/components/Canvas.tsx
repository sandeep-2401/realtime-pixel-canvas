import { useRef, useEffect } from "react"
import type { Pixel, PixelLock } from "../types"

const CANVAS_WIDTH = 900
const CANVAS_HEIGHT = 540

const GRID_COLS = 90   // X axis
const GRID_ROWS = 54   // Y axis

const PIXEL_WIDTH = CANVAS_WIDTH / GRID_COLS
const PIXEL_HEIGHT = CANVAS_HEIGHT / GRID_ROWS

type Props = {
  pixels: Pixel[]
  locks: PixelLock[]
  onPixelClick: (x: number, y: number) => void
  onCursorMove: (x: number, y: number) => void
}

export function Canvas({
  pixels,
  locks,
  onPixelClick,
  onCursorMove
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    // ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw pixels
    for (const p of pixels) {
      ctx.fillStyle = p.color
      ctx.fillRect(
        p.x * PIXEL_WIDTH,
        p.y * PIXEL_HEIGHT,
        PIXEL_WIDTH,
        PIXEL_HEIGHT
      )
    }

    // Draw locks
    for (const lock of locks) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.4)"
      ctx.fillRect(
        lock.x * PIXEL_WIDTH,
        lock.y * PIXEL_HEIGHT,
        PIXEL_WIDTH,
        PIXEL_HEIGHT
      )
    }

    // Draw grid
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1

    // Vertical lines
    for (let i = 0; i <= GRID_COLS; i++) {
      ctx.beginPath()
      ctx.moveTo(i * PIXEL_WIDTH, 0)
      ctx.lineTo(i * PIXEL_WIDTH, CANVAS_HEIGHT)
      ctx.stroke()
    }

    // Horizontal lines
    for (let i = 0; i <= GRID_ROWS; i++) {
      ctx.beginPath()
      ctx.moveTo(0, i * PIXEL_HEIGHT)
      ctx.lineTo(CANVAS_WIDTH, i * PIXEL_HEIGHT)
      ctx.stroke()
    }
  }, [pixels, locks])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()

    const x = Math.floor((e.clientX - rect.left) / PIXEL_WIDTH)
    const y = Math.floor((e.clientY - rect.top) / PIXEL_HEIGHT)

    if (x < 0 || y < 0 || x >= GRID_COLS || y >= GRID_ROWS) return

    onPixelClick(x, y)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onCursorMove(
      e.clientX - rect.left,
      e.clientY - rect.top
    )
  }

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      style={{
        border: "2px solid black",
        cursor: "pointer",
        imageRendering: "pixelated",
        backgroundColor: "#222"
      }}
    />
  )
}
