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
  const [showUserPopover, setShowUserPopover] = useState(false)
  const userPopoverRef = useRef<HTMLDivElement | null>(null)

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
    function handleClickOutside(e: MouseEvent) {
      if (
        showUserPopover &&
        userPopoverRef.current &&
        !userPopoverRef.current.contains(e.target as Node)
      ) {
        setShowUserPopover(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showUserPopover])


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
    <div className="h-screen bg-[#0f0f0f] text-white flex flex-col relative">

      {/* TOP BAR */}
      <div
        className="
          flex flex-col md:flex-row
          md:items-center md:justify-between
          gap-3
          px-4 md:px-6
          py-3
          border-b border-[#222]
          bg-[#0f0f0f]
        "
      >

        {/* LEFT — Room identity + users */}
        <div className="flex flex-col gap-1">

          {/* Room name */}
          <div className="text-sm font-medium text-white">
            Room <span className="font-mono text-cyan-300">{roomId}</span>
          </div>

          {/* Users */}
          <div className="flex items-center gap-2 flex-wrap relative">
            <span className="text-xs text-gray-400">
              Active users:
            </span>

            {/* Mobile: show 2 */}
            <div className="flex items-center gap-2 md:hidden">
              {users.slice(0, 2).map(u => (
                <div
                  key={u.userId}
                  className="
                    px-2 py-0.5
                    text-xs rounded-full
                    bg-[#1a1a1a]
                    border border-[#2a2a2a]
                    text-cyan-300
                    whitespace-nowrap
                  "
                >
                  {u.name}
                </div>
              ))}

              {users.length > 2 && (
                <button
                  onClick={() => setShowUserPopover(v => !v)}
                  className="
                    px-2 py-0.5 text-xs rounded-full
                    bg-[#1a1a1a]
                    border border-[#2a2a2a]
                    text-gray-300 hover:bg-[#222]
                  "
                >
                  +{users.length - 2}
                </button>
              )}
            </div>

            {/* Desktop: show minimum 4 */}
            <div className="hidden md:flex items-center gap-2">
              {users.slice(0, 4).map(u => (
                <div
                  key={u.userId}
                  className="
                    px-2 py-0.5
                    text-xs rounded-full
                    bg-[#1a1a1a]
                    border border-[#2a2a2a]
                    text-cyan-300
                    whitespace-nowrap
                  "
                >
                  {u.name}
                </div>
              ))}

              {users.length > 4 && (
                <button
                  onClick={() => setShowUserPopover(v => !v)}
                  className="
                    px-2 py-0.5 text-xs rounded-full
                    bg-[#1a1a1a]
                    border border-[#2a2a2a]
                    text-gray-300 hover:bg-[#222]
                  "
                >
                  +{users.length - 4}
                </button>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT — Tools */}
        <div
          className="
            flex flex-wrap md:flex-nowrap
            items-center gap-3
            bg-[#111]
            px-3 py-2
            rounded-xl
            border border-[#222]
          "
        >
          {/* Palette */}
          <div className="max-w-full overflow-x-auto">
            <ColorPalette
              selectedColor={color}
              onSelect={setColor}
            />
          </div>

          {/* Share */}
          <button
            onClick={async () => {
              const shareUrl = `${window.location.origin}/?roomId=${roomId}`

              if (navigator.share) {
                try {
                  await navigator.share({
                    title: "Join my pixel room",
                    url: shareUrl
                  })
                } catch {}
              } else {
                await navigator.clipboard.writeText(shareUrl)
                setError("Room link copied to clipboard")
              }
            }}
            className="
              px-3 py-1.5 text-sm rounded-lg
              bg-[#1a1a1a] hover:bg-[#222]
              text-cyan-300 border border-[#2a2a2a]
            "
          >
            Share
          </button>

          {/* Divider */}
          <div className="hidden md:block h-6 w-px bg-[#333]" />

          {/* Reset */}
          <button
            onClick={onResetCanvas}
            className="
              px-3 py-1.5 text-sm rounded-lg
              bg-red-600 hover:bg-red-700
              text-white
            "
          >
            Reset
          </button>
        </div>
      </div>

      {/* USER POPOVER */}
      {showUserPopover && (
        <div
          ref={userPopoverRef}
          className="
            absolute top-16 left-4 md:left-6
            w-64 max-h-64
            bg-[#0f0f0f]
            border border-[#222]
            rounded-lg shadow-xl
            overflow-y-auto
            z-50
          "
        >
          <div className="px-3 py-2 text-xs text-gray-400 border-b border-[#222]">
            {users.length} users in this room
          </div>

          {users.map(u => (
            <div
              key={u.userId}
              className="px-3 py-2 text-sm text-gray-200 hover:bg-[#1a1a1a]"
            >
              {u.name}
            </div>
          ))}
        </div>
      )}

      {/* CANVAS AREA */}
      <div
        className="
          flex-1
          flex justify-center items-start md:items-center
          overflow-auto
          p-3 md:p-6
        "
      >
        <div
          ref={canvasWrapperRef}
          className="
            relative
            bg-[#1a1a1a]
            p-3 md:p-4
            rounded-2xl
            shadow-xl
            border border-[#2a2a2a]
          "
        >
          <Canvas
            pixels={pixels}
            locks={locks}
            onPixelClick={onPixelClick}
            onCursorMove={onCursorMove}
          />

          {/* CURSOR PRESENCE */}
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

      {/* ERROR TOAST */}
      {error && (
        <div
          className="
            fixed bottom-6 left-1/2 -translate-x-1/2
            bg-red-600 text-white px-5 py-2
            rounded-lg shadow-lg
          "
        >
          {error}
        </div>
      )}

    </div>
  )
}

export default App