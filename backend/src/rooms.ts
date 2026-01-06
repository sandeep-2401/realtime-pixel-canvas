import type { RoomState } from "./types.js";
import { initCanvas, loadRoomFromDB } from "./canvas.js";
import { broadcastUserList } from "./names.js";
const rooms = new Map<string, RoomState>()

export async function getOrCreateRoom(
    roomId : string
):Promise<RoomState>{
    let room = rooms.get(roomId)

    if(!room){
        room = {
            canvas : new Map(),
            locks : new Map(),
            clients : new Set(),
            presence: new Map(),
            usedNames: new Set()

        }
        initCanvas(room.canvas)
        await loadRoomFromDB(roomId,room.canvas)
        rooms.set(roomId,room)
    }

    return room
}

export function removeRoomIfEmpty(roomId : string){
    const room = rooms.get(roomId)
    if(!room) return

    if(room.clients.size ===0){
        rooms.delete(roomId)
        console.log(`Room ${roomId} cleaned up`)
    }
}

export function getRoomSummaries() {
  return Array.from(rooms.entries()).map(([roomId, room]) => ({
    roomId,
    users: room.clients.size
  }))
}

setInterval(() => {
  const now = Date.now()

  for (const [roomId, room] of rooms.entries()) {
    for (const [userId, presence] of room.presence.entries()) {
      if (now - presence.lastSeen > 5000) {
        room.presence.delete(userId)
        // room.usedNames.delete(presence.name)

        room.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: "USER_LEFT",
              payload: { userId }
            }))
          }
        })

        broadcastUserList(room)
      }
    }

    if (room.clients.size === 0) {
      rooms.delete(roomId)
      console.log(`Room ${roomId} cleaned up (inactivity)`)
    }
  }
}, 1000)
