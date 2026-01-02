import { useEffect, useState, useRef } from "react"
import { Canvas } from "./components/Canvas"
import type { Pixel, PixelLock } from "./types"
import { ColorPalette } from "./components/ColorPalette"

function App(){
  const [pixels, setPixels] = useState<Pixel[]>([])
  const [locks, setLocks] = useState<PixelLock[]>([])
  const [color, setColor] = useState("#ff0000")
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const pendingDrawRef = useRef<{ x: number; y: number; color: string } | null>(null)

  useEffect(() => {
    if (!error) return

    const timer = setTimeout(() => {
      setError(null)
    }, 2000)

    return () => clearTimeout(timer)
  }, [error])


  useEffect(() => {
    fetch("http://localhost:3000/canvas")
      .then(res => res.json())
      .then(setPixels)
  }, [])

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000")
    wsRef.current = ws

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)

      if (msg.type === "CANVAS_SNAPSHOT"){
        setPixels(msg.payload)
      }

      else if (msg.type === "LOCK_DENIED") {
        setError("Pixel is already locked")
      }

      else if(msg.type === "PIXEL_LOCKED"){
        setLocks(prev => [
          ...prev.filter(
            l => !(l.x === msg.payload.x && l.y === msg.payload.y)
          ),
          msg.payload
        ])

        const pending = pendingDrawRef.current
        if (!pending) return

        wsRef.current?.send(JSON.stringify({
          type: "DRAW_PIXEL",
          payload: pending
        }))

        pendingDrawRef.current = null
      }

      else if(msg.type === "PIXEL_UPDATED"){
        setPixels(prev =>
          prev.map(p => 
            p.x === msg.payload.x && p.y === msg.payload.y 
            ? {...p, color:msg.payload.color}
            : p
          )
        )

        setLocks(prev =>{
          return prev.filter(l => !(l.x === msg.payload.x && l.y === msg.payload.y))
        })
      }

      else if (msg.type === "DRAW_DENIED") {
        setError("You cannot draw this pixel")
      }
    }
    return () => ws.close()
  }, [])

  function onPixelClick(x: number, y: number) {
    pendingDrawRef.current = { x, y, color }
    wsRef.current?.send(
      JSON.stringify({
        type: "LOCK_PIXEL",
        payload: { x, y }
      })
    )
  }

  return (
  <>
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="bg-[#1a1a1a] px-4 py-3 rounded-xl shadow-md border border-[#2a2a2a]">
          <ColorPalette
            selectedColor={color}
            onSelect={setColor}
          />
        </div>

        <div className="bg-[#1a1a1a] p-4 rounded-2xl shadow-xl border border-[#2a2a2a]">
          <Canvas
            pixels={pixels}
            locks={locks}
            onPixelClick={onPixelClick}
          />
        </div>
      </div>

      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-5 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  </>
  )
}

export default App