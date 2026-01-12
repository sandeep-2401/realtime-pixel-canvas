import {WebSocketServer} from "ws";
import type { WebSocket as WS } from "ws";
import { getPrisma } from "./prisma.js"
import { IncomingMessage } from "node:http";
import { getAuthoritativeSnapshot, updatePixel } from "./canvas.js";
import { getLock, releaseLock, tryLockPixel } from "./locks.js"
import { getOrCreateRoom,removeRoomIfEmpty, getRoomSummaries } from "./rooms.js";
import { assignRandomName,broadcastUserList } from "./names.js";

let userCounter = 0

export function setupWebSocket(server : any){
    const wss = new WebSocketServer({server})

    function broadcastRoomList() {
        // console.log("Broadcasting ROOM_LIST:", getRoomSummaries())
        const msg = JSON.stringify({
            type: "ROOM_LIST",
            payload: getRoomSummaries()
        })

        wss.clients.forEach(client => {
            if (client.readyState === 1) {
            client.send(msg)
            }
        })
    }

    wss.on("connection", async (ws : WS, _req : IncomingMessage) => {
        try{
            const userId = ++userCounter
            console.log(`User ${userId} connected`)

            const url = new URL(_req.url!, "http://localhost")
            const roomId = url.searchParams.get("roomId")

            if (!roomId) {
                ws.send(JSON.stringify({
                type: "ROOM_LIST",
                payload: getRoomSummaries()
                }))
                return
            }

            const room = await getOrCreateRoom(roomId)
            const userName = assignRandomName(room.usedNames)
            // room.usedNames.add(userName)
            const room_canvas = room.canvas
            const room_locks = room.locks
            room.clients.add(ws)
            broadcastRoomList()

            ws.send(
                JSON.stringify({
                    type : "CANVAS_SNAPSHOT",
                    payload : getAuthoritativeSnapshot(room_locks,room_canvas)
                })
            )
            broadcastUserList(room)

            ws.on("close",()=>{
                room.clients.delete(ws)
                room.presence.delete(userId)
                room.usedNames.delete(userName)
                
                room.clients.forEach(client =>{
                    if(client.readyState ===1){
                        client.send(JSON.stringify({
                            type : "USER_LEFT",
                            payload : {userId}
                        }))
                    }
                })
                broadcastUserList(room)
                removeRoomIfEmpty(roomId)
                broadcastRoomList()
            })

            ws.on("message",async (data)=>{
                const msg = JSON.parse(data.toString())

                if(msg.type == "LOCK_PIXEL"){
                    const {x,y} = msg.payload

                    const lock = tryLockPixel(room_locks,x,y,userId)

                    if(!lock){
                        ws.send(JSON.stringify({
                            type: "LOCK_DENIED",
                            payload : {x,y, reason: "ALREADY_LOCKED" }
                        }))
                        return
                    }

                    room.clients.forEach(client =>{
                        if(client.readyState ===1){
                            client.send(JSON.stringify({
                                type: "PIXEL_LOCKED",
                                payload : {
                                    x,
                                    y,
                                    ownerId : userId,
                                    expiresAt : lock.expiresAt
                                }
                            }))
                        }
                    })
                }

                else if(msg.type === "DRAW_PIXEL"){
                    const {x,y,color} = msg.payload
                    const key = `${x}:${y}`
                    const lock = getLock(room_locks,key)

                    if(!lock || lock.ownerId !== userId || lock.expiresAt < Date.now()){
                        ws.send(JSON.stringify({
                            type : "DRAW_DENIED",
                            payload : {x,y, reason: "NOT_LOCKED_BY_YOU" }
                        }))
                        return
                    }

                    await updatePixel(roomId,room_canvas,x,y,color)
                    setTimeout(() => {
                        releaseLock(room_locks,key)
                    }, 2)


                    room.clients.forEach(client =>{
                        if(client.readyState ===1){
                            client.send(JSON.stringify({
                                type : "PIXEL_UPDATED",
                                payload : {x,y,color}
                            }))
                        }
                    })
                }

                else if(msg.type === "REQUEST_SNAPSHOT"){
                    ws.send(
                        JSON.stringify({
                            type : "CANVAS_SNAPSHOT",
                            payload : getAuthoritativeSnapshot(room_locks,room_canvas)
                        })
                    )
                }

                else if(msg.type === "CURSOR_MOVE"){
                    const {x,y} = msg.payload
                    broadcastUserList(room)
                    const presence = {
                        userId,
                        name: userName,
                        x,
                        y,
                        lastSeen : Date.now()
                    }

                    room.presence.set(userId, presence)

                    room.clients.forEach(client=>{
                        if(client!==ws && client.readyState ===1){
                            client.send(JSON.stringify({
                                type : "USER_CURSOR",
                                payload : presence
                            }))
                        }
                    })
                }
                else if (msg.type === "RESET_CANVAS") {
                    // clear in-memory canvas
                    room_canvas.clear()

                    // clear locks
                    room_locks.clear()

                    // clear DB (for persistence)
                    try{
                        const prisma = getPrisma()
                        await prisma.pixel.deleteMany({
                            where: { roomId }
                        })
                    }
                    catch (err){
                        console.error("DB reset failed, continuing in-memory")
                    }

                    // broadcast reset
                    room.clients.forEach(client => {
                        if (client.readyState === 1) {
                        client.send(JSON.stringify({
                            type: "CANVAS_RESET"
                        }))
                        }
                    })
                }
            })
        }
        catch(err){
            console.error("WS message handling failed:", err)
        }
    })

}

