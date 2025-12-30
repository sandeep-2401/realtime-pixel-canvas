import WebSocket, {WebSocketServer} from "ws";
import { IncomingMessage } from "node:http";
import { getCanvasState } from "./canvas.js";

let userCounter = 0

export function setupWebSocket(server : any){
    const wss = new WebSocketServer({server})

    wss.on("connection", (ws, _req : IncomingMessage) => {
        const userId = ++userCounter
        console.log(`User ${userId} connected`)

        ws.send(
            JSON.stringify({
                type : "CANVAS_SNAPSHOT",
                payload : getCanvasState()
            })
        )
    })
}