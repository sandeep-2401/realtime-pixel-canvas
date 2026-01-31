import ws from "k6/ws"
import { check } from "k6"

export const options = {
  vus: 150,
  duration: "60s",
}

export default function () {
  const url = "ws://localhost:3000?roomId=tvow065n" 

  const res = ws.connect(url, {}, socket => {
    socket.on("open", () => {
      socket.setInterval(() => {
        socket.send(JSON.stringify({
          type: "DRAW_PIXEL",
          payload: {
            x: Math.floor(Math.random() * 100),
            y: Math.floor(Math.random() * 100),
            color: "#ff0000",
            sentAt: Date.now()
          }
        }))
      }, 200) // 5 updates/sec
    })

    socket.on("message", msg => {
      const data = JSON.parse(msg)
      if (data.payload?.sentAt) {
        const latency = Date.now() - data.payload.sentAt
      }
    })

    socket.setTimeout(() => socket.close(), 60000)
  })

  check(res, { connected: r => r && r.status === 101 })
}
