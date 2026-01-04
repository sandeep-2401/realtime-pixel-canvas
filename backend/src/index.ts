import http from "http"
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

  res.writeHead(404)
  res.end()
})

function startServer() {
  setupWebSocket(server)

  server.listen(3000, () => {
    console.log("Server running on http://localhost:3000")
  })
}

startServer()
