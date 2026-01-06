import { useState } from "react"

type Room = {
  roomId: string
  users: number
}

type Props = {
  rooms: Room[]
  currentRoom: string
  onJoin: (roomId: string) => void
}

export function RoomSelector({ rooms, currentRoom, onJoin }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={`h-full bg-[#0f0f0f] border-r border-[#222] transition-all duration-200
        ${collapsed ? "w-14" : "w-64"}
      `}
    >
      <div className="p-4 h-full flex flex-col">

        {/* TOGGLE BUTTON */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="mb-4 text-gray-400 hover:text-white transition self-end"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "➤" : "◀"}
        </button>

        {!collapsed && (
          <>
            <div className="text-sm text-gray-400 mb-3">
              Active Rooms
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto">
              {rooms.map(room => {
                const active = room.roomId === currentRoom

                return (
                  <button
                    key={room.roomId}
                    onClick={() => onJoin(room.roomId)}
                    className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm transition
                      ${active
                        ? "bg-cyan-600 text-black"
                        : "bg-[#1a1a1a] text-gray-300 hover:bg-[#222]"
                      }`}
                  >
                    <span className="font-mono">
                      {room.roomId}
                    </span>
                    <span className="text-xs opacity-70">
                      {room.users}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
