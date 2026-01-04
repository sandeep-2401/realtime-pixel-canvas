import {WebSocketServer} from "ws";
import type { WebSocket as WS } from "ws";
import { IncomingMessage } from "node:http";
import { getAuthoritativeSnapshot, updatePixel } from "./canvas.js";
import { getLock, releaseLock, tryLockPixel } from "./locks.js"
import { getOrCreateRoom } from "./rooms.js";

let userCounter = 0

export function setupWebSocket(server : any){
    const wss = new WebSocketServer({server})

    wss.on("connection", async (ws : WS, _req : IncomingMessage) => {
        const userId = ++userCounter
        console.log(`User ${userId} connected`)

        const url = new URL(_req.url!, "http://localhost")
        const roomId = url.searchParams.get("roomId") ?? "default"

        const room = await getOrCreateRoom(roomId)
        const room_canvas = room.canvas
        const room_locks = room.locks
        room.clients.add(ws)

        ws.send(
            JSON.stringify({
                type : "CANVAS_SNAPSHOT",
                payload : getAuthoritativeSnapshot(room_locks,room_canvas)
            })
        )

        ws.on("close",()=>{
            room.clients.delete(ws)
        })

        ws.on("message",(data)=>{
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

                updatePixel(roomId,room_canvas,x,y,color)
                setTimeout(() => {
                    releaseLock(room_locks,key)
                }, 2000)


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
        })
    })


}