import { useRef, useEffect } from "react";
import type { Pixel, PixelLock } from "./types";

const CANVAS_SIZE = 500
const GRID_SIZE = 50
const PIXEL_SIZE = CANVAS_SIZE / GRID_SIZE

type Props = {
  pixels: Pixel[]
  locks: PixelLock[]
  onPixelClick: (x: number, y: number) => void
}

export function Canvas({pixels, locks, onPixelClick} : Props){
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

        for (const p of pixels) {
            ctx.fillStyle = p.color
            ctx.fillRect(
            p.x * PIXEL_SIZE,
            p.y * PIXEL_SIZE,
            PIXEL_SIZE,
            PIXEL_SIZE
            )
        }

        for (const lock of locks) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.4)"
            ctx.fillRect(
                lock.x * PIXEL_SIZE,
                lock.y * PIXEL_SIZE,
                PIXEL_SIZE,
                PIXEL_SIZE
            )
        }

    }, [pixels,locks])

    const handleClick = (e : React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect()
        const x = Math.floor((e.clientX - rect.left)/ PIXEL_SIZE)
        const y = Math.floor((e.clientY - rect.top)/ PIXEL_SIZE)
        onPixelClick(x, y)
    }


    return (
        <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{
                border: "2px solid black",
                backgroundColor: "#222"
            }}
            onClick={handleClick}

        />
    )
}
