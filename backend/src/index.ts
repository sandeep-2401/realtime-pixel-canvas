import http from "http"
import { initCanvas, getAuthoritativeSnapshot, loadFromDB } from "./canvas.js"
import { setupWebSocket } from "./ws.js"

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === "GET" && req.url === "/canvas") {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify(getAuthoritativeSnapshot()))
    return
  }

  res.writeHead(404)
  res.end()
})

async function startServer() {
  initCanvas()
  await loadFromDB()          
  setupWebSocket(server)

  server.listen(3000, () => {
    console.log("Server running on http://localhost:3000")
  })
}

startServer()
