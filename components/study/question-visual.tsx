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

  if (v.type === "classification") {
    const categories = [...new Set(v.items.map((item) => item.category))];
    return (
      <div
        className="classification-visual"
        role="img"
        aria-label={categories
          .map(
            (category) =>
              `${category}：${v.items
                .filter((item) => item.category === category)
                .map((item) => item.label)
                .join("、")}`,
          )
          .join("；")}
      >
        {categories.map((category) => (
          <section key={category}>
            <strong>{category}</strong>
            <div>
              {v.items
                .filter((item) => item.category === category)
                .map((item, index) => (
                  <span key={`${item.label}-${index}`}>{item.label}</span>
                ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (v.type === "ruler") {
    const first = Math.min(v.start, v.end);
    const last = Math.max(v.start, v.end);
    const span = Math.max(1, last - first);
    const ticks = Array.from({ length: span + 1 }, (_, index) => first + index);
    return (
      <div
        className="ruler-visual"
        role="img"
        aria-label={`物体左端在 ${v.start} 厘米，右端在 ${v.end} 厘米`}
      >
        <div className="ruler-object" aria-hidden="true">
          <i />
          <span />
          <i />
        </div>
        <div className="ruler-track" aria-hidden="true">
          {ticks.map((tick, index) => (
            <span key={tick} className="ruler-tick">
              <i />
              <b>{tick}</b>
              {index < ticks.length - 1 && <em />}
            </span>
          ))}
        </div>
        <small>厘米</small>
      </div>
    );
  }

  if (v.type !== "clock") return null;

  return (
    <svg
      className="clock-face"
      viewBox="0 0 220 220"
      role="img"
      aria-label={`钟面显示 ${v.hour} 点${v.minute ? ` ${v.minute} 分` : "整"}`}
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
