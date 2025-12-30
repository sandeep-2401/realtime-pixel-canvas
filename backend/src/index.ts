import http from "http"
import {initCanvas, getCanvasState} from './canvas.js'
import { setupWebSocket } from "./ws.js"

initCanvas()

const server = http.createServer((req,res)=>{
    if (req.method === "GET" && req.url === '/canvas'){
        res.writeHead(200, {"Content-Type" : "application/json"})
        res.end(JSON.stringify(getCanvasState()))
        return
    }

    res.writeHead(404)
    res.end()
})

setupWebSocket(server)

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000")
})
