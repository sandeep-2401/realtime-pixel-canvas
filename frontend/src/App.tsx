import { useEffect, useState, useRef } from "react"
import { Canvas } from "./components/Canvas"
import type { Pixel, PixelLock, UserPresence } from "./types"
import { ColorPalette } from "./components/ColorPalette"
// import { RoomSelector } from "./components/RoomSelector"

function App(){
  const [pixels, setPixels] = useState<Pixel[]>([])
  const [locks, setLocks] = useState<PixelLock[]>([])
  const [color, setColor] = useState("#ff0000")
  const [error, setError] = useState<string | null>(null)
  const [presence, setPresence] = useState<UserPresence[]>([])
  const [users, setUsers] = useState<{ userId: number; name: string }[]>([])
  const [rooms, setRooms] = useState<{ roomId: string; users: number }[]>([])
  const [roomId, setRoomId] = useState(() => {
        const params = new URLSearchParams(window.location.search)
        return params.get("roomId") ?? "default"
      })
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
    if (!roomId) return

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
        setPixels(prev => {
          const exists = prev.some(
            p => p.x === msg.payload.x && p.y === msg.payload.y
          )

          if (exists) {
            return prev.map(p =>
              p.x === msg.payload.x && p.y === msg.payload.y
                ? { ...p, color: msg.payload.color }
                : p
            )
          }

          // resolved pixel not present (after reset) problem
          return [
            ...prev,
            {
              x: msg.payload.x,
              y: msg.payload.y,
              color: msg.payload.color
            }
          ]
        })
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

      else if(msg.type === "CANVAS_RESET"){
        wsRef.current?.send(JSON.stringify({
          type: "REQUEST_SNAPSHOT"
        }))
      }

      else if(msg.type ==="ROOM_LIST"){
        console.log("ROOM_LIST received:", msg.payload)
        setRooms([])
        setRooms(msg.payload)

        if (!roomId && msg.payload.length > 0) {
          setRoomId(msg.payload[0].roomId)
        }
      }

    }
    return () => {
      ws.close()
      wsRef.current = null
      setPixels([])
      setLocks([])
      setPresence([])
      setUsers([])
    }
  }, [roomId])

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

  function onResetCanvas() {
    wsRef.current?.send(JSON.stringify({
      type: "RESET_CANVAS"
    }))
  }


  const { x: offsetX, y: offsetY } = getCanvasOffset()


  return (
  <div className="h-screen bg-[#0f0f0f] flex text-white">

    {/* LEFT SIDEBAR — ROOMS */}
    {/* <RoomSelector
      rooms={rooms}
      currentRoom={roomId}
      onJoin={(newRoomId) => {
        if (newRoomId === roomId) return
        wsRef.current?.close()
        setRoomId(newRoomId)
      }}
    /> */}

    {/* MAIN CONTENT */}
    <div className="flex-1 flex justify-center overflow-y-auto">
      <div className="flex flex-col items-center gap-6 w-full max-w-3xl py-6">

        {/* TOP CONTROLS */}
        <div className="flex items-center gap-4 bg-[#1a1a1a] px-4 py-3 rounded-xl shadow-md border border-[#2a2a2a]">
          <ColorPalette
            selectedColor={color}
            onSelect={setColor}
          />

          <button
            onClick={onResetCanvas}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
          >
            Reset Canvas
          </button>

          <button
            onClick={async () => {
              const shareUrl = `${window.location.origin}/?roomId=${roomId}`

              // Native share (mobile / supported browsers)
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: "Join my pixel room",
                    text: `Join my room (${roomId})`,
                    url: shareUrl
                  })
                } catch {
                  // user cancelled — ignore
                }
              } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(shareUrl)
                setError("Room link copied to clipboard")
              }
            }}
            className="px-4 py-2 text-sm rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-cyan-300 border border-[#2a2a2a] transition"
          >
            Share Room
          </button>
        </div>

        {/* USERS LIST */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 w-full max-w-md">
          <div className="text-sm text-gray-400 mb-2 text-center">
            Users in this room ({users.length})
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
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

        {/* CANVAS */}
        <div
          ref={canvasWrapperRef}
          className="relative bg-[#1a1a1a] p-4 rounded-2xl shadow-xl border border-[#2a2a2a]"
        >
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
    </div>

    {/* ERROR TOAST */}
    {error && (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-5 py-2 rounded-lg shadow-lg">
        {error}
      </div>
    )}

    <button
      onClick={() => {
        const newRoomId = Math.random().toString(36).slice(2, 8)
        const url = `${window.location.origin}/?roomId=${newRoomId}`
        window.open(url, "_blank")
        // setRoomId(newRoomId)
      }}
      className="
        fixed bottom-6 right-6
        w-14 h-14 rounded-full
        bg-cyan-600 hover:bg-cyan-500
        text-black text-2xl font-bold
        shadow-lg shadow-cyan-600/30
        transition active:scale-95
      "
      title="Create Room"
    >
      +
    </button>

  </div>
)
}

export default App