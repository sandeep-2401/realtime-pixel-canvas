import { useEffect, useRef, useState } from "react"
import { Lobby } from "./Lobby"
import { CanvasPage } from "./CanvasPage"

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

  // 🔹 LOBBY-ONLY WebSocket (room list)
  useEffect(() => {
    if (roomId) return // already inside a room

    const ws = new WebSocket("ws://localhost:3000")
    lobbyWsRef.current = ws

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)

      if (msg.type === "ROOM_LIST") {
        setRooms(msg.payload)
      }
    }

    return () => {
      ws.close()
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
