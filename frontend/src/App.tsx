import { useEffect, useRef, useState } from "react"
import { Lobby } from "./Lobby"
import { CanvasPage } from "./CanvasPage"
import { WS_BASE_URL } from "./config"

type Room = {
  roomId: string
  users: number
}

function App() {
  const [roomId, setRoomId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get("roomId")
  })

  const [rooms, setRooms] = useState<Room[]>([])
  const lobbyWsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<number | null>(null)

  useEffect(() => {
    if (roomId) return

    function connect() {
      const ws = new WebSocket(WS_BASE_URL)
      lobbyWsRef.current = ws

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data)
        if (msg.type === "ROOM_LIST") {
          setRooms(msg.payload)
        }
      }

      ws.onclose = () => {
        reconnectTimer.current = window.setTimeout(connect, 2000)
      }

      ws.onerror = () => ws.close()
    }

    connect()

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      lobbyWsRef.current?.close()
      lobbyWsRef.current = null
    }
  }, [roomId])

  if (!roomId) {
    return (
      <Lobby
        rooms={rooms}
        onJoin={(id) => {
          setRoomId(id)
          window.history.pushState({}, "", `/?roomId=${id}`)
        }}
      />
    )
  }

  return <CanvasPage roomId={roomId} />
}

export default App
