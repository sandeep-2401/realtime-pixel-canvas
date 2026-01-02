const COLORS = [
  "#000000", // black
  "#ffffff", // white
  "#ff0000", // red
  "#00ff00", // green
  "#0000ff", // blue
  "#ffff00", // yellow
  "#ffa500", // orange
  "#800080", // purple
  "#8b4513", // brown
  "#808080", // gray
  "#00ffff"  // cyan
]

type Props = {
  selectedColor: string
  onSelect: (color: string) => void
}

export function ColorPalette({ selectedColor, onSelect }: Props) {
  return (
    <div className="w-[500px] flex items-center justify-center gap-2 p-3 bg-neutral-800 border-2 border-neutral-600 rounded-xl">
      {COLORS.map(color => (
        <button
          key={color}
          onClick={() => onSelect(color)}
          className={`w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 ${
            selectedColor === color
              ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-800"
              : "border-2 border-neutral-600"
          }`}
          style={{ backgroundColor: color }}
        />
      ))}

      {/* Custom color picker */}
      <label className="w-8 h-8 rounded-full border-2 border-neutral-600 cursor-pointer flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-600 hover:scale-110 transition-transform">
        <input
          type="color"
          value={selectedColor}
          onChange={e => onSelect(e.target.value)}
          className="hidden"
        />
        <span className="text-sm">🎨</span>
      </label>
    </div>
  )
}
