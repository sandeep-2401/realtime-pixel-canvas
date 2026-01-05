import { useEffect, useState, useRef } from "react"
import { Canvas } from "./components/Canvas"
import type { Pixel, PixelLock, UserPresence } from "./types"
import { ColorPalette } from "./components/ColorPalette"

function App(){
  const [pixels, setPixels] = useState<Pixel[]>([])
  const [locks, setLocks] = useState<PixelLock[]>([])
  const [color, setColor] = useState("#ff0000")
  const [error, setError] = useState<string | null>(null)
  const [presence, setPresence] = useState<UserPresence[]>([])
  const [users, setUsers] = useState<{ userId: number; name: string }[]>([])

  const wsRef = useRef<WebSocket | null>(null)
  const pendingDrawRef = useRef<{ x: number; y: number; color: string } | null>(null)
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!error) return

    const timer = setTimeout(() => {
      setError(null)
    }, 2000)

    return () => clearTimeout(timer)
  }, [error])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const roomId = params.get("roomId") ?? "default"

    const ws = new WebSocket(`ws://localhost:3000?roomId=${roomId}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)

      if (msg.type === "CANVAS_SNAPSHOT"){
        setPixels(msg.payload.pixels)
        setLocks(msg.payload.locks)
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

      else if(msg.type === "USER_CURSOR"){
        setPresence(prev => [
          ...prev.filter(p=> p.userId !== msg.payload.userId),
          msg.payload
        ])
      }
      else if(msg.type === "USER_LEFT"){
        setPresence(prev =>
          prev.filter(p=> p.userId !== msg.payload.userId)
        )
      }
      else if(msg.type === "USER_LIST"){
        setUsers(msg.payload)
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

  function onCursorMove(x: number, y: number) {
    wsRef.current?.send(JSON.stringify({
      type: "CURSOR_MOVE",
      payload: { x, y }
    }))
  }

  function getCanvasOffset() {
    const wrapper = canvasWrapperRef.current
    const canvas = wrapper?.querySelector("canvas")
    if (!wrapper || !canvas) return { x: 0, y: 0 }

    const wrapperRect = wrapper.getBoundingClientRect()
    const canvasRect = canvas.getBoundingClientRect()

    return {
      x: canvasRect.left - wrapperRect.left,
      y: canvasRect.top - wrapperRect.top
    }
  }

  const { x: offsetX, y: offsetY } = getCanvasOffset()


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

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 w-full max-w-md">
          <div className="text-sm text-gray-400 mb-2">
            Users in this room ({users.length})
          </div>

          <div className="flex flex-wrap gap-2">
            {users.map(u => (
              <div
                key={u.userId}
                className="px-3 py-1 rounded-full text-xs bg-[#0f172a] text-cyan-300 border border-cyan-500/30"
              >
                {u.name}
              </div>
            ))}
          </div>
        </div>


        <div 
          ref={canvasWrapperRef} 
          className="relative bg-[#1a1a1a] p-4 rounded-2xl shadow-xl border border-[#2a2a2a]">
          <Canvas
            pixels={pixels}
            locks={locks}
            onPixelClick={onPixelClick}
            onCursorMove={onCursorMove}
          />

          {presence.map(p => (
            <div
              key={p.userId}
              style={{
                position: "absolute",
                left: offsetX + p.x,
                top: offsetY + p.y,
                pointerEvents: "none",
                transform: "translate(-50%, -100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4
              }}
            >
              {/* USER NAME */}
              <div
                style={{
                  fontSize: 10,
                  color: "#67e8f9",
                  background: "rgba(0,0,0,0.65)",
                  padding: "2px 6px",
                  borderRadius: 6,
                  whiteSpace: "nowrap"
                }}
              >
                {p.name}
              </div>

              {/* CURSOR DOT */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#67e8f9"
                }}
              />
            </div>
          ))}

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