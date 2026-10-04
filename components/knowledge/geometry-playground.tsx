"use client";

import { useId, useState, type ReactNode } from "react";
import styles from "./geometry-playground.module.css";

type GeometryStage = "point" | "line" | "plane" | "solid";

const dotPositions = [
  { row: 1, column: 1, x: 115, y: 75 },
  { row: 1, column: 2, x: 200, y: 75 },
  { row: 1, column: 3, x: 285, y: 75 },
  { row: 2, column: 1, x: 115, y: 150 },
  { row: 2, column: 2, x: 200, y: 150 },
  { row: 2, column: 3, x: 285, y: 150 },
  { row: 3, column: 1, x: 115, y: 225 },
  { row: 3, column: 2, x: 200, y: 225 },
  { row: 3, column: 3, x: 285, y: 225 },
];

const cubeFaces = [
  { number: 1, color: "#d9ecae", x: 204, y: 25 },
  { number: 2, color: "#a8ded2", x: 204, y: 87 },
  { number: 3, color: "#b8dced", x: 266, y: 87 },
  { number: 4, color: "#f2c3af", x: 142, y: 87 },
  { number: 5, color: "#eddf9f", x: 204, y: 149 },
  { number: 6, color: "#d6c8eb", x: 204, y: 211 },
];

function Observation({ children }: { children: ReactNode }) {
  return (
    <p className={styles.observation} role="status" aria-live="polite">
      <span className={styles.observationLabel}>我发现</span>
      {children}
    </p>
  );
}

function PointPlayground() {
  const [selected, setSelected] = useState(4);
  const titleId = useId();
  const current = dotPositions[selected];

  return (
    <div className={styles.playground}>
      <p className={styles.instruction}>点一个小圆点，告诉我它在哪里。</p>
      <div className={styles.pointBoard}>
        <svg viewBox="0 0 340 305" role="img" aria-labelledby={titleId}>
          <title id={titleId}>{`三行三列的点阵，选中了第${current.row}行第${current.column}列。行从上往下数，列从左往右数。`}</title>
          {[75, 150, 225].map((y, index) => (
            <g key={y}>
              <path d={`M 95 ${y} H 305`} className={styles.guideLine} />
              <text x="40" y={y + 6} className={styles.svgSmallText} textAnchor="middle">第{index + 1}行</text>
            </g>
          ))}
          {[115, 200, 285].map((x, index) => (
            <g key={x}>
              <path d={`M ${x} 58 V 242`} className={styles.guideLine} />
              <text x={x} y="35" className={styles.svgSmallText} textAnchor="middle">第{index + 1}列</text>
            </g>
          ))}
          {dotPositions.map((point, index) => (
            <g key={`${point.row}-${point.column}`}>
              {index === selected ? <circle cx={point.x} cy={point.y} r="24" fill="#def0e7" /> : null}
              <circle cx={point.x} cy={point.y} r={index === selected ? 10 : 7} fill={index === selected ? "#226c59" : "#9ebcb1"} />
            </g>
          ))}
          <text x="170" y="282" className={styles.svgSmallText} textAnchor="middle">行从上往下数，列从左往右数</text>
        </svg>
        {dotPositions.map((point, index) => (
          <button
            key={`${point.row}-${point.column}`}
            type="button"
            className={styles.dotButton}
            style={{ left: `${(point.x / 340) * 100}%`, top: `${(point.y / 305) * 100}%` }}
            aria-label={`选择第${point.row}行第${point.column}列的点`}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          />
        ))}
      </div>
      <Observation>这个点在第 <strong>{current.row}</strong> 行、第 <strong>{current.column}</strong> 列。点可以帮我们表示位置。</Observation>
    </div>
  );
}

function CornerPlayground() {
  const [markedCount, setMarkedCount] = useState(0);
  const titleId = useId();
  const corners = [{ x: 240, y: 45 }, { x: 120, y: 235 }, { x: 360, y: 235 }];

  return (
    <div className={styles.playground}>
      <p className={styles.instruction}>找一找三角形的尖角，用点标出来。</p>
      <div className={styles.controlRow}>
        <button type="button" className={styles.choiceButton} disabled={markedCount === 3} onClick={() => setMarkedCount((count) => Math.min(3, count + 1))}>标出一个顶点</button>
        <button type="button" className={styles.choiceButton} disabled={markedCount === 0} onClick={() => setMarkedCount(0)}>重新找一遍</button>
      </div>
      <svg className={styles.illustration} viewBox="0 0 480 290" role="img" aria-labelledby={titleId}>
        <title id={titleId}>{`一个三角形，已用小圆点标出${markedCount}个顶点。`}</title>
        <polygon points="240,45 120,235 360,235" fill="#eef4e8" stroke="#6b9e87" strokeWidth="4" strokeLinejoin="round" />
        {corners.slice(0, markedCount).map((corner, index) => (
          <g key={index}>
            <circle cx={corner.x} cy={corner.y} r="12" fill="#398c76" stroke="#fffdf7" strokeWidth="3" />
            <text x={corner.x + (index === 1 ? -25 : 25)} y={corner.y + 6} className={styles.svgText} textAnchor="middle">{index + 1}</text>
          </g>
        ))}
      </svg>
      <Observation>{markedCount === 3 ? "三个尖角都找到了！三角形有 3 个顶点，点能标出它们的位置。" : <>已经标出 <strong>{markedCount}</strong> 个顶点。沿着边找一找，哪里有尖角？</>}</Observation>
    </div>
  );
}

function LinePlayground() {
  const [curved, setCurved] = useState(false);
  const titleId = useId();

  return (
    <div className={styles.playground}>
      <p className={styles.instruction}>同样的两个点，可以怎样连起来？</p>
      <div className={styles.controlRow} role="group" aria-label="选择连接方式">
        <button type="button" className={styles.choiceButton} aria-pressed={!curved} onClick={() => setCurved(false)}>直直地连</button>
        <button type="button" className={styles.choiceButton} aria-pressed={curved} onClick={() => setCurved(true)}>弯弯地连</button>
      </div>
      <svg className={styles.illustration} viewBox="0 0 480 260" role="img" aria-labelledby={titleId}>
        <title id={titleId}>{`${curved ? "两个点之间连着一条弯曲的线" : "两个点之间连着一条直直的线段"}，两端的位置不变。`}</title>
        <path d="M 95 133 H 385" className={styles.guideLine} />
        <path d={curved ? "M 95 133 C 168 8, 309 258, 385 133" : "M 95 133 H 385"} fill="none" stroke="#398c76" strokeWidth="7" strokeLinecap="round" />
        {[95, 385].map((x, index) => (
          <g key={x}>
            <circle cx={x} cy="133" r="13" fill="#fffdf7" stroke="#226c59" strokeWidth="4" />
            <text x={x} y="175" className={styles.svgSmallText} textAnchor="middle">{index === 0 ? "这一端" : "那一端"}</text>
          </g>
        ))}
        <text x="240" y="229" className={styles.svgText} textAnchor="middle">{curved ? "这是一条曲线" : "这是一条线段"}</text>
      </svg>
      <Observation>{curved ? "两端的位置没有变，连起来的线有弯。再和直直的线段比一比。" : "线段是直的，有两个端点。小圆点标出了它的两端。"}</Observation>
    </div>
  );
}

function ClosedLinePlayground() {
  const [closed, setClosed] = useState(false);
  const titleId = useId();

  return (
    <div className={styles.playground}>
      <p className={styles.instruction}>小围栏还差一段，把它合上看看。</p>
      <div className={styles.controlRow} role="group" aria-label="选择围栏是否有开口">
        <button type="button" className={styles.choiceButton} aria-pressed={!closed} onClick={() => setClosed(false)}>留一个开口</button>
        <button type="button" className={styles.choiceButton} aria-pressed={closed} onClick={() => setClosed(true)}>把开口合上</button>
      </div>
      <svg className={styles.illustration} viewBox="0 0 480 290" role="img" aria-labelledby={titleId}>
        <title id={titleId}>{closed ? "三条线段首尾相接，围成了一个三角形，没有开口" : "三角形围栏的右边缺了一段，还留着开口，没有围好"}</title>
        {closed ? <polygon points="240,45 120,235 360,235" fill="#e7f2e5" /> : null}
        <path d={closed ? "M 240 45 L 120 235 H 360 Z" : "M 240 45 L 120 235 H 360 L 303 145"} fill="none" stroke="#398c76" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        {closed ? (
          <text x="240" y="185" className={styles.svgText} textAnchor="middle">围好了</text>
        ) : (
          <g>
            <circle cx="240" cy="45" r="8" fill="#fffdf7" stroke="#398c76" strokeWidth="3" />
            <circle cx="303" cy="145" r="8" fill="#fffdf7" stroke="#398c76" strokeWidth="3" />
            <path d="M 333 82 L 286 99" fill="none" stroke="#ae8054" strokeWidth="2" />
            <text x="341" y="81" className={styles.svgSmallText}>开口</text>
          </g>
        )}
      </svg>
      <Observation>{closed ? "线段一段接一段，首尾也接上，围出了一个三角形。" : "这里还有一个开口，围栏没有合拢。补上这一段会怎样？"}</Observation>
    </div>
  );
}

function PlanePlayground() {
  const [joined, setJoined] = useState(false);
  const titleId = useId();

  return (
    <div className={styles.playground}>
      <p className={styles.instruction}>两块一样大的三角形，能拼成什么？</p>
      <div className={styles.controlRow} role="group" aria-label="移动三角形">
        <button type="button" className={styles.choiceButton} aria-pressed={!joined} onClick={() => setJoined(false)}>分开看看</button>
        <button type="button" className={styles.choiceButton} aria-pressed={joined} onClick={() => setJoined(true)}>拼在一起</button>
      </div>
      <svg className={styles.illustration} viewBox="0 0 480 310" role="img" aria-labelledby={titleId}>
        <title id={titleId}>{joined ? "两个大小相同的直角三角形沿斜边拼合，正好组成一个长方形，中间没有空隙，也没有重叠" : "两块大小相同的直角三角形分开放着，绿色在右上，橙色在左下"}</title>
        <g transform={joined ? undefined : "translate(30 -20)"}>
          <polygon points="140,75 340,75 340,235" fill="#b9e3d0" stroke="#398c76" strokeWidth="3" strokeLinejoin="round" />
          <path d="M 324 75 V 91 H 340" fill="none" stroke="#398c76" strokeWidth="2" />
          <text x="279" y="124" className={styles.svgText} textAnchor="middle">1</text>
        </g>
        <g transform={joined ? undefined : "translate(-30 20)"}>
          <polygon points="140,75 340,235 140,235" fill="#f4d3b7" stroke="#bb8961" strokeWidth="3" strokeLinejoin="round" />
          <path d="M 140 219 H 156 V 235" fill="none" stroke="#bb8961" strokeWidth="2" />
          <text x="194" y="202" className={styles.svgText} textAnchor="middle">2</text>
        </g>
        <text x="240" y="291" className={styles.svgSmallText} textAnchor="middle">{joined ? "没有空隙，也没有重叠" : "找一找：两块三角形哪条边一样长？"}</text>
      </svg>
      <Observation>{joined ? "两块三角形沿着长长的斜边拼好，变成了一个长方形。" : "每块三角形都有一个方方的角。把它们拼起来，看看外面的形状。"}</Observation>
    </div>
  );
}

function SquarePlayground() {
  const [mark, setMark] = useState<"none" | "sides" | "corners">("none");
  const titleId = useId();
  const corners = [{ x: 150, y: 50 }, { x: 330, y: 50 }, { x: 330, y: 230 }, { x: 150, y: 230 }];
  const sides = [
    { path: "M 150 50 H 330", x: 240, y: 30, color: "#398c76" },
    { path: "M 330 50 V 230", x: 354, y: 145, color: "#608ab0" },
    { path: "M 330 230 H 150", x: 240, y: 264, color: "#ae8054" },
    { path: "M 150 230 V 50", x: 123, y: 145, color: "#8a71ad" },
  ];

  return (
    <div className={styles.playground}>
      <p className={styles.instruction}>摸摸正方形的边，找找它的顶点。</p>
      <div className={styles.controlRow} role="group" aria-label="选择正方形的观察位置">
        <button type="button" className={styles.choiceButton} aria-pressed={mark === "none"} onClick={() => setMark("none")}>看整个图形</button>
        <button type="button" className={styles.choiceButton} aria-pressed={mark === "sides"} onClick={() => setMark("sides")}>标出边</button>
        <button type="button" className={styles.choiceButton} aria-pressed={mark === "corners"} onClick={() => setMark("corners")}>标出顶点</button>
      </div>
      <svg className={styles.illustration} viewBox="0 0 480 290" role="img" aria-labelledby={titleId}>
        <title id={titleId}>{`一个正方形${mark === "sides" ? "，四条边分别用颜色和编号1至4标出" : mark === "corners" ? "，四个顶点分别用圆点和编号1至4标出" : "，有4条一样长的边和4个顶点"}。`}</title>
        <rect x="150" y="50" width="180" height="180" fill="#e6f1e3" stroke="#76a38a" strokeWidth="4" />
        {mark === "sides" ? sides.map((side, index) => (
          <g key={side.path}>
            <path d={side.path} fill="none" stroke={side.color} strokeWidth="7" />
            <text x={side.x} y={side.y} className={styles.svgText} textAnchor="middle">{index + 1}</text>
          </g>
        )) : null}
        {mark === "corners" ? corners.map((corner, index) => (
          <g key={index}>
            <circle cx={corner.x} cy={corner.y} r="11" fill="#398c76" stroke="#fffdf7" strokeWidth="3" />
            <text x={corner.x + (corner.x < 240 ? -27 : 27)} y={corner.y + 7} className={styles.svgText} textAnchor="middle">{index + 1}</text>
          </g>
        )) : null}
      </svg>
      <Observation>{mark === "sides" ? "沿着外边走一圈，数到 4 条边。正方形的 4 条边一样长。" : mark === "corners" ? "相邻两条边碰头的地方是顶点。一圈数下来，一共有 4 个顶点。" : "这是正方形。点上面的按钮，把它的边和顶点分别找出来。"}</Observation>
    </div>
  );
}

function SolidPlayground() {
  const [unfolded, setUnfolded] = useState(false);
  const [selectedFace, setSelectedFace] = useState(2);
  const titleId = useId();
  const reversed = selectedFace > 3;
  const visibleFaces = reversed ? [5, 4, 6] : [1, 2, 3];
  const polygons = ["240,54 331,105 240,156 149,105", "149,105 240,156 240,257 149,206", "240,156 331,105 331,206 240,257"];
  const labelPositions = [{ x: 240, y: 112 }, { x: 192, y: 187 }, { x: 286, y: 187 }];

  return (
    <div className={styles.playground}>
      <p className={styles.instruction}>把小方块展开，找一找它的 6 个面。</p>
      <div className={styles.controlRow} role="group" aria-label="选择小方块的样子">
        <button type="button" className={styles.choiceButton} aria-pressed={!unfolded} onClick={() => setUnfolded(false)}>合成小方块</button>
        <button type="button" className={styles.choiceButton} aria-pressed={unfolded} onClick={() => setUnfolded(true)}>展开看看</button>
      </div>
      <svg className={styles.illustration} viewBox="0 0 480 305" role="img" aria-labelledby={titleId}>
        <title id={titleId}>{`${unfolded ? "正方体的六个正方形面展开：第1面在第2面上方，第4面在左，第3面在右，第5面和第6面依次在下方" : `正方体，当前能看见第${visibleFaces.join("、")}面`}。粗边框标出了第${selectedFace}面。`}</title>
        {unfolded ? cubeFaces.map((face) => (
          <g key={face.number}>
            <rect x={face.x} y={face.y} width="62" height="62" fill={face.color} stroke="#fffdf7" strokeWidth="2" />
            <text x={face.x + 31} y={face.y + 39} textAnchor="middle" className={styles.svgText}>{face.number}</text>
          </g>
        )) : visibleFaces.map((faceNumber, index) => (
          <g key={faceNumber}>
            <polygon points={polygons[index]} fill={cubeFaces[faceNumber - 1].color} stroke="#fffdf7" strokeWidth="3" strokeLinejoin="round" />
            <text x={labelPositions[index].x} y={labelPositions[index].y} textAnchor="middle" className={styles.svgText}>{faceNumber}</text>
          </g>
        ))}
        {unfolded ? (
          <rect x={cubeFaces[selectedFace - 1].x + 2} y={cubeFaces[selectedFace - 1].y + 2} width="58" height="58" fill="none" stroke="#315f50" strokeWidth="4" />
        ) : (
          <polygon points={polygons[visibleFaces.indexOf(selectedFace)]} fill="none" stroke="#315f50" strokeWidth="4" strokeLinejoin="round" />
        )}
      </svg>
      <div className={styles.faceControls} role="group" aria-label="选择要观察的面">
        {cubeFaces.map((face) => (
          <button type="button" key={face.number} className={styles.faceButton} aria-pressed={selectedFace === face.number} onClick={() => setSelectedFace(face.number)}>
            <span className={styles.faceSwatch} style={{ backgroundColor: face.color }} aria-hidden="true" />
            第{face.number}面
          </button>
        ))}
      </div>
      <Observation>{unfolded ? <>6 个面都是一样大的正方形。第 <strong>{selectedFace}</strong> 面的颜色和编号没有变。</> : <>{reversed ? "转过来后，看到了另外 3 个面。" : "现在能看到 3 个面，还有 3 个面藏在另一侧。"} 点下面的编号，就能找到那一面。</>}</Observation>
    </div>
  );
}

export function GeometryPlayground({ stage, nodeId }: { stage: GeometryStage; nodeId?: string }) {
  if (nodeId === "point-corners") return <CornerPlayground />;
  if (nodeId === "line-closed") return <ClosedLinePlayground />;
  if (nodeId === "plane-sides") return <SquarePlayground />;
  switch (stage) {
    case "point": return <PointPlayground />;
    case "line": return <LinePlayground />;
    case "plane": return <PlanePlayground />;
    case "solid": return <SolidPlayground />;
  }
}
