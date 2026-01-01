import { useEffect, useState, useRef } from "react"
import { Canvas } from "./Canvas"
import type { Pixel, PixelLock } from "./types"

function App(){
  const [pixels, setPixels] = useState<Pixel[]>([])
  const [locks, setLocks] = useState<PixelLock[]>([])
  const [color, setColor] = useState("#ff0000")

  const wsRef = useRef<WebSocket | null>(null)

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
        alert("Pixel already locked")
      }

      else if(msg.type === "PIXEL_LOCKED"){
        setLocks(prev => [
          ...prev.filter(
            l => !(l.x === msg.payload.x && l.y === msg.payload.y)
          ),
          msg.payload
        ])
      }

    }
    return () => ws.close()
  }, [])

  function onPixelClick(x: number, y: number) {
    wsRef.current?.send(
      JSON.stringify({
        type: "LOCK_PIXEL",
        payload: { x, y }
      })
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <input
        type="color"
        value={color}
        onChange={e => setColor(e.target.value)}
      />

      <Canvas 
        pixels={pixels} 
        locks={locks} 
        onPixelClick={onPixelClick} 
      />
    </div>
  )
}

export default App