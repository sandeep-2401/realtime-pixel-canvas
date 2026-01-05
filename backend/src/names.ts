import type { RoomState } from "./types.js"
export const NAMES = [
  "Falcon", "Tiger", "Wolf", "Eagle", "Panther",
  "Viper", "Hawk", "Raven", "Fox", "Bear",
  "Lion", "Cobra", "Jaguar", "Shark", "Dragon",
  "Otter", "Puma", "Bison", "Leopard", "Orca",
  "Lynx", "Badger", "Kite", "Mongoose", "Cougar",
  "Hyena", "Buffalo", "Osprey", "Crane", "Koala"
]

export function assignRandomName(usedNames: Set<string>): string {
  const available = NAMES.filter(n => !usedNames.has(n))

  if (available.length === 0) {
    return "Anonymous"
  }

  const index = Math.floor(Math.random() * available.length)
  const name = available[index]!   // ✅ non-null assertion is safe here

  usedNames.add(name)
  return name
}

export function broadcastUserList(room: RoomState) {
  const users = Array.from(room.presence.values()).map(p => ({
    userId: p.userId,
    name: p.name
  }))

  room.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({
        type: "USER_LIST",
        payload: users
      }))
    }
  })
}


