import { useEffect, useState } from "react"

/* ===================== TYPES ===================== */
type Room = {
  roomId: string
  users: number
}

type Props = {
  rooms: Room[]
  onJoin: (roomId: string) => void
}

/* ===================== UTILS ===================== */
function generateRoomId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/* ===================== WANDERING PIXEL BACKGROUND ===================== */
function PixelPlayground() {
  const [pixels, setPixels] = useState(
    Array.from({ length: 70 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      dx: (Math.random() - 0.5) * 0.015,
      dy: (Math.random() - 0.5) * 0.015,
      life: Math.random(),
      size: 2,
    }))
  )

  useEffect(() => {
    let raf: number

    const tick = () => {
      setPixels(prev =>
        prev.map(p => {
          let nx = (p.x + p.dx + 100) % 100
          let ny = (p.y + p.dy + 100) % 100
          let life = p.life + 0.01

          // occasional pop reset
          if (life > 1) {
            life = 0
            nx = Math.random() * 100
            ny = Math.random() * 100
          }

          return { ...p, x: nx, y: ny, life }
        })
      )

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      {pixels.map((p, i) => (
        <div
          key={i}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: Math.sin(p.life * Math.PI),
          }}
          className="
            absolute
            bg-cyan-400
            rounded-sm
            shadow-[0_0_10px_rgba(34,211,238,0.8)]
            pointer-events-none
          "
        />
      ))}
    </>
  )
}

/* ===================== PIXEL MASCOT ===================== */
function PixelMascotWithFollowers() {
  const FOLLOWER_COUNT = 6

  const [leader, setLeader] = useState({
    x: 20,
    y: 70,
    dx: 0.03,
    dy: -0.02,
  })

  // history of positions
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([])

  useEffect(() => {
    let raf: number

    const tick = () => {
      setLeader(p => {
        let nx = p.x + p.dx
        let ny = p.y + p.dy

        // bounce from edges
        if (nx < 2 || nx > 95) p.dx *= -1
        if (ny < 2 || ny > 95) p.dy *= -1

        return {
          ...p,
          x: nx,
          y: ny,
          dx: p.dx + (Math.random() - 0.5) * 0.002,
          dy: p.dy + (Math.random() - 0.5) * 0.002,
        }
      })

      setTrail(prev => {
        const next = [{ x: leader.x, y: leader.y }, ...prev]
        return next.slice(0, FOLLOWER_COUNT * 6) // enough spacing
      })

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [leader])

  return (
    <>
      {/* Followers */}
      {trail
        .filter((_, i) => i % 6 === 0) // spacing between followers
        .slice(0, FOLLOWER_COUNT)
        .map((p, i) => (
          <div
            key={`f-${i}`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: 15 - i * 0.4,     // taper gradually
              height: 15 - i * 0.4,
              opacity: 0.9 - i * 0.08,
            }}
            className="
              absolute
              bg-cyan-400
              rounded-sm
              shadow-[0_0_14px_rgba(34,211,238,0.9)]
              pointer-events-none
            "
          />
        ))}

      {/* Leader */}
      <div
        style={{
          left: `${leader.x}%`,
          top: `${leader.y}%`,
        }}
        className="
          absolute
          w-4 h-4
          bg-cyan-300
          rounded-sm
          shadow-[0_0_22px_rgba(34,211,238,1)]
          animate-[mascot-bob_2s_ease-in-out_infinite]
          pointer-events-none
        "
      />
    </>
  )
}

/* ===================== LOBBY ===================== */
export function Lobby({ rooms, onJoin }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const createRoom = () => {
    onJoin(generateRoomId())
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
      {/* 🎮 Playground */}
      <PixelPlayground />
      <PixelMascotWithFollowers />

      {/* UI */}
      <div className="relative z-10 w-full max-w-md px-6 text-center space-y-8 -translate-y-12 rotate-[0.2deg]">
        {/* Title */}
        <div>
          <h1 className="text-5xl font-extrabold text-cyan-400 drop-shadow-[0_0_24px_rgba(34,211,238,1)]">
            PIXELVERSE
          </h1>
          <p className="text-gray-400 mt-2">
            Draw together. Create chaos.
          </p>
        </div>

        {/* Create Room */}
        <button
          onClick={createRoom}
          className="
            w-full py-4 rounded-xl
            border border-cyan-400/40
            bg-cyan-500/10
            transition-all duration-300
            shadow-[0_0_35px_rgba(34,211,238,0.5)]
            hover:shadow-[0_0_60px_rgba(34,211,238,1)]
            hover:scale-[1.04]
            animate-[pulse_3s_ease-in-out_infinite]
            -rotate-[0.2deg]
          "
        >
          CREATE A NEW REALITY
        </button>

        {/* Rooms */}
        <div className="w-full">
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="
              w-full flex justify-between items-center
              px-4 py-3 rounded-lg
              bg-white/5 border border-white/10
            "
          >
            <span>
              ACTIVE ROOMS ({rooms.length})
            </span>
            <span className="text-cyan-400">
              {dropdownOpen ? "▲" : "▼"}
            </span>
          </button>

          {dropdownOpen && (
            <div className="mt-2 rounded-lg bg-black/70 border border-white/10">
              {rooms.map(room => (
                <div
                  key={room.roomId}
                  onClick={() => onJoin(room.roomId)}
                  style={{
                    transform: `rotate(${(room.users % 3 - 1) * 0.4}deg)`,
                  }}
                  className="
                    px-4 py-3 text-sm cursor-pointer
                    transition
                    hover:bg-cyan-500/10
                    hover:animate-[wiggle_0.2s_ease-in-out]
                  "
                >
                  {room.roomId} ({room.users})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes mascot-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes wiggle {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(1deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  )
}
