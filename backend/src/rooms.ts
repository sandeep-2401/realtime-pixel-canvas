import type { Pixel, PixelLock } from "./types.js";
import { initCanvas, loadRoomFromDB } from "./canvas.js";
import type { WebSocket as WS } from "ws"

export type RoomState = {
    canvas : Map<string,Pixel>
    locks : Map<string,PixelLock>
    clients : Set<WS>
}

const rooms = new Map<string, RoomState>()

export async function getOrCreateRoom(
    roomId : string
):Promise<RoomState>{
    let room = rooms.get(roomId)

    if(!room){
        room = {
            canvas : new Map(),
            locks : new Map(),
            clients : new Set()
        }
        initCanvas(room.canvas)
        await loadRoomFromDB(roomId,room.canvas)
        rooms.set(roomId,room)
    }

    return room
}