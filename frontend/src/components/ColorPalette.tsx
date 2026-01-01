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
    <div
      style={{
        width: 500,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        padding: 12,
        background: "#2a2a2a",
        borderRadius: 12,
        border: "2px solid #444"
      }}
    >
      {COLORS.map(color => (
        <button
          key={color}
          onClick={() => onSelect(color)}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: color,
            cursor: "pointer",
            border:
              selectedColor === color
                ? "3px solid white"
                : "2px solid #555"
          }}
        />
      ))}

      <label
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "2px solid #555",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, pink, purple)"
        }}
      >
        <input
          type="color"
          value={selectedColor}
          onChange={e => onSelect(e.target.value)}
          style={{ display: "none" }}
        />
        🎨
      </label>
    </div>
  )
}
