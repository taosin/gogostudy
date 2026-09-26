import type { Question } from "@/lib/catalog";
export function QuestionVisual({ question }: { question: Question }) {
  const v = question.visual;
  if (!v) return null;
  if (v.type === "groups")
    return (
      <div
        className="dot-groups"
        aria-label={`${v.groups} 组，每组 ${v.each} 个圆点`}
      >
        {Array.from({ length: v.groups }, (_, i) => (
          <span key={i}>
            {Array.from({ length: v.each }, (_, j) => (
              <i key={j} />
            ))}
          </span>
        ))}
      </div>
    );
  return (
    <svg
      className="clock-face"
      viewBox="0 0 220 220"
      role="img"
      aria-label="观察钟面上的时针和分针"
    >
      <circle
        cx="110"
        cy="110"
        r="101"
        fill="#fff"
        stroke="#dce8fa"
        strokeWidth="6"
      />
      {Array.from({ length: 12 }, (_, i) => {
        const angle = ((i + 1) * Math.PI) / 6;
        return (
          <text
            key={i}
            x={110 + 80 * Math.sin(angle)}
            y={116 - 80 * Math.cos(angle)}
            textAnchor="middle"
            fill="#486385"
            fontSize="17"
          >
            {i + 1}
          </text>
        );
      })}
      <line
        x1="110"
        y1="110"
        x2="110"
        y2="61"
        stroke="#344e70"
        strokeWidth="7"
        strokeLinecap="round"
        transform={`rotate(${v.hour * 30 + v.minute / 2} 110 110)`}
      />
      <line
        x1="110"
        y1="110"
        x2="110"
        y2="40"
        stroke="#377cf6"
        strokeWidth="4"
        strokeLinecap="round"
        transform={`rotate(${v.minute * 6} 110 110)`}
      />
      <circle cx="110" cy="110" r="6" fill="#377cf6" />
    </svg>
  );
}
