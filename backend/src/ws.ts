import {WebSocketServer} from "ws";
import { IncomingMessage } from "node:http";
import { getAuthoritativeSnapshot, updatePixel } from "./canvas.js";
import { getLock, releaseLock, tryLockPixel } from "./locks.js"

let userCounter = 0

export function setupWebSocket(server : any){
    const wss = new WebSocketServer({server})

    wss.on("connection", (ws, _req : IncomingMessage) => {
        const userId = ++userCounter
        console.log(`User ${userId} connected`)

        ws.send(
            JSON.stringify({
                type : "CANVAS_SNAPSHOT",
                payload : getAuthoritativeSnapshot()
            })
        )

        ws.on("message",(data)=>{
            const msg = JSON.parse(data.toString())

            if(msg.type == "LOCK_PIXEL"){
                const {x,y} = msg.payload

                const lock = tryLockPixel(x,y,userId)

                if(!lock){
                    ws.send(JSON.stringify({
                        type: "LOCK_DENIED",
                        payload : {x,y, reason: "ALREADY_LOCKED" }
                    }))
                    return
                }

                wss.clients.forEach(client =>{
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
                const lock = getLock(key)

                if(!lock || lock.ownerId !== userId || lock.expiresAt < Date.now()){
                    ws.send(JSON.stringify({
                        type : "DRAW_DENIED",
                        payload : {x,y, reason: "NOT_LOCKED_BY_YOU" }
                    }))
                    return
                }

                updatePixel(x,y,color)
                setTimeout(() => {
                    releaseLock(key)
                }, 2000)


                wss.clients.forEach(client =>{
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
                        payload : getAuthoritativeSnapshot()
                    })
                )
            }
        })
    })


}