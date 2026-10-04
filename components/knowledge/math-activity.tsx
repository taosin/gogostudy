"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import type { MathActivityKind } from "@/lib/math-curriculum";
import styles from "./math-activity.module.css";

type Activity = {
  kind: MathActivityKind;
  instruction: string;
  values: number[];
  labels?: string[];
};

const colors = ["#46846d", "#d9934b", "#8a78b7"];
const labelColor = (label: string, index: number) => label.includes("红") ? "#c76565" : label.includes("蓝") ? "#5476c8" : label.includes("黄") ? "#c59435" : colors[index % colors.length];
const numbers = (length: number) => Array.from({ length }, (_, index) => index);
const bounded = (value: number | undefined, fallback: number, max: number, min = 0) =>
  Math.max(min, Math.min(max, Math.floor(value ?? fallback)));

function Result({ children }: { children: ReactNode }) {
  return <p className={styles.result} role="status" aria-live="polite">{children}</p>;
}

function Dots({ count, color = colors[0] }: { count: number; color?: string }) {
  return <span className={styles.dots} aria-label={`${count}个`}>
    {numbers(count).map((index) => <span key={index} className={styles.smallDot} style={{ background: color }} aria-hidden="true" />)}
    {count === 0 ? <span className={styles.empty}>空的</span> : null}
  </span>;
}

function Count({ values }: Pick<Activity, "values">) {
  const total = bounded(values[0], 5, 12);
  const [counted, setCounted] = useState<number[]>([]);
  const [bundled, setBundled] = useState(false);
  return <>
    {bundled ? <div className={styles.twoGroups}><div className={styles.basket}><strong>1 个十</strong><Dots count={10} /></div><div className={styles.basket}><strong>{total - 10} 个一</strong><Dots count={total - 10} color={colors[1]} /></div></div> :
    <div className={styles.countBoard}>
      {numbers(total).map((index) => {
        const order = counted.indexOf(index);
        return <button key={index} className={styles.counter} aria-label={`第${index + 1}个圆片${order >= 0 ? `，已经数过，数到${order + 1}` : "，还没数"}`} aria-pressed={order >= 0}
          onClick={() => setCounted((previous) => previous.includes(index) ? previous : [...previous, index])}>
          {order >= 0 ? order + 1 : <span aria-hidden="true">●</span>}
        </button>;
      })}
      {total === 0 ? <div className={styles.emptyBasket}>篮子里一个圆片也没有</div> : null}
    </div>}
    <Result>{total === 0 ? "一个也没有，用 0 表示。" : bundled ? `10 个一组成 1 个十。${total} 里面有 1 个十和 ${total - 10} 个一。` : counted.length === total ? `数完了！最后数到 ${total}，这里一共有 ${total} 个。` : `已经数了 ${counted.length} 个。点一个还没数过的圆片，再往下数。`}</Result>
    <div className={styles.controls}>{total >= 10 ? <button className={styles.button} disabled={counted.length !== total || bundled} onClick={() => setBundled(true)}>把 10 个一合成 1 个十</button> : null}<button className={styles.button} onClick={() => { setCounted([]); setBundled(false); }}>重新数一数</button></div>
  </>;
}

function Compare({ values, labels }: Pick<Activity, "values" | "labels">) {
  const left = bounded(values[0], 4, 10);
  const right = bounded(values[1], 6, 10);
  const pairs = Math.min(left, right);
  const [paired, setPaired] = useState(0);
  const leftName = labels?.[0] ?? "左边";
  const rightName = labels?.[1] ?? "右边";
  return <>
    <div className={styles.pairBoard}>
      <div className={styles.pairHead}><span>{leftName}</span><span /><span>{rightName}</span></div>
      {numbers(Math.max(left, right)).map((index) => <div className={styles.pairRow} key={index}>
        <span className={index < left ? styles.pairDot : styles.missing} style={{ background: index < left ? colors[0] : undefined }}>{index < left ? index + 1 : ""}</span>
        <span className={styles.pairLine} data-connected={index < paired} aria-label={index < paired ? "已经配成一对" : undefined} />
        <span className={index < right ? styles.pairDot : styles.missing} style={{ background: index < right ? colors[1] : undefined }}>{index < right ? index + 1 : ""}</span>
      </div>)}
    </div>
    <div className={styles.controls}><button className={styles.button} disabled={paired === pairs} onClick={() => setPaired((value) => value + 1)}>配成一对</button><button className={styles.button} onClick={() => setPaired(0)}>重新配对</button></div>
    <Result>{paired < pairs ? `已经配好 ${paired} 对。每次从两边各取一个。` : left === right ? `刚好一一对应，两边都是 ${left} 个，一样多。${left} = ${right}。` : `${left > right ? leftName : rightName}还剩 ${Math.abs(left - right)} 个没有伙伴，所以${left > right ? leftName : rightName}更多。${left} ${left > right ? ">" : "<"} ${right}，相差 ${Math.abs(left - right)}。`}</Result>
  </>;
}

function Compose({ values }: Pick<Activity, "values">) {
  const total = bounded(values[0], 7, 12, 1);
  const initial = bounded(values[1], 3, total);
  const [left, setLeft] = useState(initial);
  return <>
    <div className={styles.twoGroups}>
      <div className={styles.basket}><span>左边 · {left} 个</span><Dots count={left} /></div>
      <div className={styles.basket}><span>右边 · {total - left} 个</span><Dots count={total - left} color={colors[1]} /></div>
    </div>
    <div className={styles.controls}>
      <button className={styles.button} disabled={left === total} onClick={() => setLeft((value) => value + 1)}>← 移一个到左边</button>
      <button className={styles.button} disabled={left === 0} onClick={() => setLeft((value) => value - 1)}>移一个到右边 →</button>
    </div>
    <Result>{left} + {total - left} = {total}。两部分变了，合起来的总数没有变。</Result>
  </>;
}

function ChangeAmount({ kind, values }: Pick<Activity, "kind" | "values">) {
  const initial = bounded(values[0], 5, 12);
  const subtract = kind === "subtract";
  const change = bounded(values[1], 2, subtract ? initial : 12);
  const [steps, setSteps] = useState(0);
  const current = initial + (subtract ? -steps : steps);
  return <>
    <div className={styles.basket}><span>{subtract ? "还在这里" : "现在有"} · {current} 个</span><Dots count={subtract ? current : initial} />{!subtract && steps > 0 ? <Dots count={steps} color={colors[1]} /> : null}</div>
    {subtract && steps > 0 ? <div className={styles.removed}><span>拿走了 {steps} 个</span><Dots count={steps} color="#b5bcb7" /></div> : null}
    <div className={styles.controls}><button className={styles.button} disabled={steps === change} onClick={() => setSteps((value) => value + 1)}>{subtract ? "拿走一个" : "加入一个"}</button><button className={styles.button} onClick={() => setSteps(0)}>再试一次</button></div>
    <Result>{initial} {subtract ? "−" : "+"} {steps} = {current}。{steps === change ? `我们${subtract ? "拿走" : "加入"}了 ${change} 个，${subtract ? "还剩" : "一共有"} ${current} 个。` : `再${subtract ? "拿走" : "加入"} ${change - steps} 个，看看数量怎样变。`}</Result>
  </>;
}

function Groups({ values }: Pick<Activity, "values">) {
  const groups = bounded(values[0], 3, 5, 1);
  const amount = bounded(values[1], 4, 6, 1);
  const [shown, setShown] = useState(0);
  return <>
    <div className={styles.groupGrid}>{numbers(groups).map((index) => <div className={styles.basket} key={index} data-muted={index >= shown}><span>第 {index + 1} 组</span>{index < shown ? <Dots count={amount} /> : <span className={styles.empty}>等你来放</span>}</div>)}</div>
    <div className={styles.controls}><button className={styles.button} disabled={shown === groups} onClick={() => setShown((value) => value + 1)}>放入一组（{amount} 个）</button><button className={styles.button} onClick={() => setShown(0)}>重新放</button></div>
    <Result>{shown === 0 ? `每一组都放 ${amount} 个，试着放进第一组。` : `${numbers(shown).map(() => amount).join(" + ")} = ${shown * amount}。${shown} 组，每组 ${amount} 个：${amount} × ${shown} = ${shown * amount}。`}</Result>
  </>;
}

function Share({ values }: Pick<Activity, "values">) {
  const total = bounded(values[0], 12, 24, 1);
  const groups = bounded(values[1], 3, 5, 1);
  const [given, setGiven] = useState(0);
  const each = Math.floor(total / groups);
  const remainder = total % groups;
  return <>
    <div className={styles.remaining}><span>还没分的 · {total - given} 个</span><Dots count={total - given} color={colors[1]} /></div>
    <div className={styles.groupGrid}>{numbers(groups).map((index) => <div key={index} className={styles.basket} data-next={given < total - remainder && given % groups === index}><span>第 {index + 1} 份</span><Dots count={Math.floor(given / groups) + (index < given % groups ? 1 : 0)} /></div>)}</div>
    <div className={styles.controls}><button className={styles.button} disabled={given === total - remainder} onClick={() => setGiven((value) => value + 1)}>给第 {given % groups + 1} 份一个</button><button className={styles.button} onClick={() => setGiven(0)}>重新分</button></div>
    <Result>{given === total - remainder ? `${total} 个平均分成 ${groups} 份，每份 ${each} 个${remainder ? `，还余 ${remainder} 个` : "，每份一样多"}。${total} ÷ ${groups} = ${each}${remainder ? `……${remainder}` : ""}。` : "轮流给每份一个，这一轮分完，每份就会一样多。"}</Result>
  </>;
}

function Measure({ values }: Pick<Activity, "values">) {
  const length = bounded(values[0], 6, 10, 1);
  const [aligned, setAligned] = useState(false);
  const [read, setRead] = useState(false);
  const start = aligned ? 30 : 54;
  return <>
    <svg className={styles.svg} viewBox="0 0 320 150" role="img" aria-label={`一支需要测量的纸条，${aligned ? "左端已对齐0刻度" : "左端还没有对齐0刻度"}`}>
      <title>把纸条的一端与尺子的零刻度对齐</title>
      <rect x={start} y="32" width={length * 24} height="29" rx="4" fill="#e3ab61" />
      <rect x="18" y="78" width="276" height="46" rx="5" fill="#e6eee5" />
      {numbers(11).map((index) => <g key={index}><line x1={30 + index * 24} x2={30 + index * 24} y1="78" y2="91" stroke="#527965" strokeWidth="2" /><text x={30 + index * 24} y="111" textAnchor="middle" className={styles.svgText}>{index}</text></g>)}
      <text x="292" y="143" textAnchor="end" className={styles.svgSmall}>图上的刻度单位：厘米</text>
      {aligned ? <line x1={30 + length * 24} x2={30 + length * 24} y1="62" y2="78" stroke="#bb7134" strokeDasharray="3 3" /> : null}
    </svg>
    <div className={styles.controls}><button className={styles.button} aria-pressed={aligned} onClick={() => { setAligned(true); setRead(false); }}>先对齐 0 刻度</button><button className={styles.button} disabled={!aligned} onClick={() => setRead(true)}>读出另一端的刻度</button></div>
    <Result>{read ? `从 0 到 ${length}，经过 ${length} 个 1 厘米，纸条长 ${length} 厘米。` : aligned ? "左端对齐了 0。看看右端对着哪个数。" : "测长度前，先让纸条的一端对齐 0 刻度。"}</Result>
    <p className={styles.note}>这是测量示意图，屏幕上的格子不代表真实的 1 厘米。</p>
  </>;
}

function Fraction({ values, decimal = false }: Pick<Activity, "values"> & { decimal?: boolean }) {
  const total = decimal ? 10 : bounded(values[1], 4, 10, 2);
  const percent = values[2] === 100 && total === 4;
  const [subdivided, setSubdivided] = useState(false);
  const columns = percent ? 2 : total <= 5 ? total : total % 2 === 0 ? total / 2 : total === 9 ? 3 : 1;
  const target = bounded(values[0], 1, total);
  const [selected, setSelected] = useState<number[]>([]);
  return <>
    <div className={styles.fractionWhole} style={{ "--parts": columns } as CSSProperties} aria-label={`一个整体平均分成${total}份`}>
      {numbers(total).map((index) => <button className={styles.fractionPart} data-percent={percent} aria-label={`第${index + 1}份${subdivided ? "，包含25小格" : ""}`} aria-pressed={selected.includes(index)} key={index}
        onClick={() => setSelected((previous) => previous.includes(index) ? previous.filter((item) => item !== index) : [...previous, index])}>{subdivided ? <span className={styles.hundredQuarter} aria-hidden="true">{numbers(25).map((cell) => <span key={cell} />)}</span> : selected.includes(index) ? "✓" : ""}</button>)}
    </div>
    <p className={styles.label}>{subdivided ? "每个大方块分成 25 小格，整个图形共有 100 小格。" : "外框是 1 个整体，每一份一样大。"}</p>
    <Result>{selected.length === target ? "做到了！" : `试着涂 ${target} 份。`}现在涂了 {selected.length}/{total}{subdivided ? ` = ${selected.length * 25}/100 = ${selected.length * 25}%` : decimal ? `，写成小数是 ${(selected.length / 10).toFixed(1)}` : `，读作“${total}分之${selected.length}”`}。</Result>
    <div className={styles.controls}>{percent ? <button className={styles.button} aria-pressed={subdivided} onClick={() => setSubdivided((value) => !value)}>{subdivided ? "回到原来的 4 等份" : "把每份再分成 25 小份"}</button> : null}<button className={styles.button} onClick={() => setSelected([])}>擦掉重涂</button></div>
  </>;
}

function Pattern({ values, labels }: Pick<Activity, "values" | "labels">) {
  const period = bounded(values[0], 2, 3, 2);
  const names = labels?.length === period ? labels : ["圆形", "三角形", "正方形"].slice(0, period);
  const [added, setAdded] = useState(0);
  const [feedback, setFeedback] = useState("");
  const length = period * 2 + added;
  const glyphs = ["●", "▲", "■"];
  return <>
    <div className={styles.patternRow}>{numbers(length).map((index) => <span className={styles.patternItem} key={index} style={{ color: labelColor(names[index % period], index % period) }} aria-label={names[index % period]}>{glyphs[index % period]}</span>)}<span className={styles.patternBlank}>?</span></div>
    <div className={styles.controls}>{names.map((name, index) => <button className={styles.button} key={index} disabled={added === period} onClick={() => {
      if (index === length % period) { setAdded((previous) => previous + 1); setFeedback(`接对了，是${name}。`); }
      else setFeedback(`再看看，每一组都是“${names.join("、")}”。`);
    }}><span style={{ color: labelColor(name, index) }} aria-hidden="true">{glyphs[index]}</span> {name}</button>)}</div>
    <Result>{added === period ? `你接出了一整组！“${names.join("、")}”一直按同样的顺序重复。` : feedback || `观察重复的一组，下一个应该是什么？`}</Result>
    <button className={styles.button} onClick={() => { setAdded(0); setFeedback(""); }}>重新接一组</button>
  </>;
}

function Data({ values, labels }: Pick<Activity, "values" | "labels">) {
  const totals = values.slice(0, 3).map((value) => bounded(value, 0, 8));
  const names = totals.map((_, index) => labels?.[index] ?? ["圆形", "三角形", "正方形"][index]);
  const items = numbers(Math.max(0, ...totals)).flatMap((round) => totals.flatMap((total, index) => round < total ? [index] : []));
  const [sorted, setSorted] = useState(0);
  const [feedback, setFeedback] = useState("");
  const counts = totals.map((_, category) => items.slice(0, sorted).filter((item) => item === category).length);
  const current = items[sorted];
  return <>
    <div className={styles.sortingCard}>{sorted < items.length ? <><span>把它放进对应的一类</span><strong><i className={styles.smallDot} style={{ background: labelColor(names[current], current) }} />{names[current]}</strong><span>还有 {items.length - sorted} 个待整理</span></> : <strong>全部整理好了</strong>}</div>
    <div className={styles.dataColumns}>{totals.map((_, index) => <div className={styles.dataColumn} key={index}>
      <div className={styles.barTrack} aria-label={`${names[index]}：${counts[index]}个`}><div className={styles.bar} style={{ height: `${counts[index] / Math.max(1, ...totals) * 100}%`, background: labelColor(names[index], index) }} /><span>{counts[index]}</span></div>
      <button className={styles.button} disabled={sorted === items.length} onClick={() => {
        if (index === current) { setSorted((previous) => previous + 1); setFeedback(`${names[index]}这一类增加了 1 个。`); }
        else setFeedback(`看看它的名字，是“${names[current]}”，再找找对应的一类。`);
      }}>{names[index]}</button>
    </div>)}</div>
    <Result>{sorted === items.length ? `整理后，${names.map((name, index) => `${name}有 ${counts[index]} 个`).join("，")}。柱子越高，这一类就越多。` : feedback || "一个一个分好类，每放入一个，对应的柱子就增加一格。"}</Result>
    <button className={styles.button} onClick={() => { setSorted(0); setFeedback(""); }}>重新整理</button>
  </>;
}

function Shape({ values }: Pick<Activity, "values">) {
  const sides = values[0] === 0 || values[0] === 2 || values[0] === 3 ? values[0] : 4;
  const [marked, setMarked] = useState<number[]>([]);
  const [position, setPosition] = useState<number | null>(null);
  const [walked, setWalked] = useState(0);
  const edgeLength = sides === 4 ? bounded(values[1], 0, 10) : 0;
  const edgeLabels = [[160, 24], [270, 125], [160, 225], [48, 125]];
  const points = sides === 2 ? [[45, 115], [275, 115]] : sides === 3 ? [[160, 35], [55, 205], [265, 205]] : [[80, 40], [240, 40], [240, 200], [80, 200]];
  if (sides === 0) return <>
    <div className={styles.positionGrid}>{numbers(9).map((index) => <button className={styles.positionButton} aria-label={`第${Math.floor(index / 3) + 1}行第${index % 3 + 1}列的位置`} aria-pressed={position === index} key={index} onClick={() => setPosition(index)}>{position === index ? "●" : "+"}</button>)}</div>
    <Result>{position === null ? "点一个位置，留下一个记号。" : `记号在从上往下第 ${Math.floor(position / 3) + 1} 行，从左往右第 ${position % 3 + 1} 列。点能告诉我们一个位置。`}</Result>
  </>;
  return <>
    <svg className={styles.svg} viewBox="0 0 320 240" role="img" aria-label={edgeLength ? `正方形每边${edgeLength}米，已经走过${walked}条边` : sides === 2 ? "一条线段的两个端点" : `${sides === 3 ? "三角形" : "正方形"}的边和顶点`}>
      <title>{edgeLength ? "沿正方形的四条边围一圈" : sides === 2 ? "找到线段的两个端点" : "沿着图形的边找到每个顶点"}</title>
      {sides === 2 ? <line x1="45" y1="115" x2="275" y2="115" stroke="#46846d" strokeWidth="5" /> : <polygon points={points.map((point) => point.join(",")).join(" ")} fill="#eef5e9" stroke="#46846d" strokeWidth="4" strokeLinejoin="round" />}
      {edgeLength ? points.map(([x, y], index) => <g key={`edge-${index}`}>
        {index < walked ? <line x1={x} y1={y} x2={points[(index + 1) % 4][0]} y2={points[(index + 1) % 4][1]} stroke="#d9934b" strokeWidth="8" strokeLinecap="round" /> : null}
        <text x={edgeLabels[index][0]} y={edgeLabels[index][1]} textAnchor="middle" className={styles.svgText}>{`${edgeLength}米`}</text>
      </g>) : null}
      {points.map(([x, y], index) => <g key={index}><circle cx={x} cy={y} r={marked.includes(index) ? 13 : 6} fill={marked.includes(index) ? "#d9934b" : "#46846d"} />{marked.includes(index) ? <text x={x} y={y + 5} textAnchor="middle" fill="white" fontSize="14" fontWeight="700">{index + 1}</text> : null}</g>)}
    </svg>
    {edgeLength ? <>
      <div className={styles.controls}><button className={styles.button} disabled={walked === 4} onClick={() => setWalked((value) => value + 1)}>沿下一条边走 {edgeLength} 米</button><button className={styles.button} onClick={() => setWalked(0)}>回到起点</button></div>
      <Result>{walked === 0 ? "从左上角出发，每条边都走一次，再回到起点。" : `${numbers(walked).map(() => edgeLength).join(" + ")} = ${walked * edgeLength} 米。${walked === 4 ? `完整走了一圈，周长是 ${4 * edgeLength} 米。` : `已走 ${walked} 条边，还要继续围一圈。`}`}</Result>
    </> : <>
      <div className={styles.controls}>{points.map((_, index) => <button className={styles.button} key={index} aria-pressed={marked.includes(index)} onClick={() => setMarked((previous) => previous.includes(index) ? previous : [...previous, index])}>标出{ sides === 2 ? "端点" : "顶点"} {index + 1}</button>)}</div>
      <Result>{marked.length === sides ? sides === 2 ? "线段有两个端点，在两个端点之间是直的。" : `${sides === 3 ? "三角形有 3 条边、3 个顶点" : "正方形有 4 条一样长的边、4 个顶点，4 个角都是直角"}。` : `已经标出 ${marked.length} 个${sides === 2 ? "端点" : "顶点"}，沿着图形找一找。`}</Result>
    </>}
  </>;
}

function Area({ values }: Pick<Activity, "values">) {
  const columns = bounded(values[0], 4, 6, 1);
  const rows = bounded(values[1], 3, 5, 1);
  const total = columns * rows;
  const [filled, setFilled] = useState(0);
  return <>
    <svg className={styles.svg} viewBox={`0 0 ${columns * 42 + 36} ${rows * 42 + 36}`} role="img" aria-label={`${rows}行、每行${columns}格的长方形，已铺${filled}格`}>
      <title>用一样大的小正方形铺满长方形</title>
      {numbers(total).map((index) => <g key={index}><rect x={18 + index % columns * 42} y={18 + Math.floor(index / columns) * 42} width="42" height="42" fill={index < filled ? "#b9d9be" : "#f8faf5"} stroke="#54745d" strokeWidth="1.5" />{index < filled ? <text x={39 + index % columns * 42} y={45 + Math.floor(index / columns) * 42} textAnchor="middle" className={styles.svgText}>{index + 1}</text> : null}</g>)}
    </svg>
    <div className={styles.controls}><button className={styles.button} disabled={filled === total} onClick={() => setFilled((value) => value + 1)}>铺 1 个小方格</button><button className={styles.button} disabled={filled === total} onClick={() => setFilled((value) => Math.min(total, (Math.floor(value / columns) + 1) * columns))}>铺满这一行</button><button className={styles.button} onClick={() => setFilled(0)}>重新铺</button></div>
    <Result>{filled === total ? `没有空隙，也没有重叠。${rows} 行，每行 ${columns} 格，一共 ${columns} × ${rows} = ${total} 格。每格是 1 平方厘米时，面积就是 ${total} 平方厘米。` : `已铺 ${filled} 个相同的小正方形。铺满后数一数，就知道面积有多大。`}</Result>
  </>;
}

function Volume({ values }: Pick<Activity, "values">) {
  const columns = bounded(values[0], 3, 4, 1);
  const rows = bounded(values[1], 2, 3, 1);
  const layers = bounded(values[2], 2, 3, 1);
  const [placed, setPlaced] = useState(0);
  return <>
    <svg className={styles.svg} viewBox="0 0 320 280" role="img" aria-label={`长方体已放${placed}层，每层${columns * rows}块，共${placed * columns * rows}块`}>
      <title>把相同的小正方体逐层堆起来</title>
      <path d="M 32 170 L 158 110 L 286 170 L 160 232 Z" fill="#eef3e8" />
      {numbers(placed).flatMap((layer) => numbers(rows).flatMap((row) => numbers(columns).map((column) => {
        const x = 117 + column * 29 - row * 29;
        const y = 129 + column * 15 + row * 15 - layer * 29;
        return <g key={`${layer}-${row}-${column}`} stroke="#54826b" strokeWidth="1.3" strokeLinejoin="round"><polygon points={`${x},${y} ${x + 29},${y + 15} ${x},${y + 30} ${x - 29},${y + 15}`} fill="#d9ead0" /><polygon points={`${x - 29},${y + 15} ${x},${y + 30} ${x},${y + 59} ${x - 29},${y + 44}`} fill="#a8cdae" /><polygon points={`${x},${y + 30} ${x + 29},${y + 15} ${x + 29},${y + 44} ${x},${y + 59}`} fill="#83b495" /></g>;
      })))}
      {placed === 0 ? <text x="160" y="175" textAnchor="middle" className={styles.svgText}>从第一层开始</text> : null}
    </svg>
    <div className={styles.controls}><button className={styles.button} disabled={placed === layers} onClick={() => setPlaced((value) => value + 1)}>放上一层（{columns * rows} 块）</button><button className={styles.button} onClick={() => setPlaced(0)}>重新搭</button></div>
    <Result>{placed === 0 ? `每一层有 ${rows} 排，每排 ${columns} 块。` : `每层 ${columns} × ${rows} = ${columns * rows} 块，${placed} 层共有 ${columns * rows} × ${placed} = ${columns * rows * placed} 块。里面被挡住的小方块也要算进去。`}</Result>
    <p className={styles.note}>每个小方块是 1 立方厘米时，总块数就是体积的立方厘米数。</p>
  </>;
}

function Ratio({ values, labels }: Pick<Activity, "values" | "labels">) {
  const first = bounded(values[0], 2, 6, 1);
  const second = bounded(values[1], 3, 6, 1);
  const [copies, setCopies] = useState(1);
  return <>
    <div className={styles.twoGroups}><div className={styles.basket}><span>{labels?.[0] ?? "第一种"} · {first * copies} 份</span><Dots count={first * copies} /></div><div className={styles.basket}><span>{labels?.[1] ?? "第二种"} · {second * copies} 份</span><Dots count={second * copies} color={colors[1]} /></div></div>
    <div className={styles.controls}>{[1, 2, 3].map((value) => <button className={styles.button} key={value} aria-pressed={copies === value} onClick={() => setCopies(value)}>做 {value} 组</button>)}</div>
    <Result>{first} : {second} = {first * copies} : {second * copies}。两种份数同时变成原来的 {copies} 倍，搭配关系不变。</Result>
  </>;
}

export function MathActivity({ activity }: { activity: Activity }) {
  let content: ReactNode;
  switch (activity.kind) {
    case "count": content = <Count values={activity.values} />; break;
    case "compare": content = <Compare values={activity.values} labels={activity.labels} />; break;
    case "compose": content = <Compose values={activity.values} />; break;
    case "add": case "subtract": content = <ChangeAmount kind={activity.kind} values={activity.values} />; break;
    case "groups": content = <Groups values={activity.values} />; break;
    case "share": content = <Share values={activity.values} />; break;
    case "measure": content = <Measure values={activity.values} />; break;
    case "fraction": content = <Fraction values={activity.values} />; break;
    case "decimal": content = <Fraction values={activity.values} decimal />; break;
    case "pattern": content = <Pattern values={activity.values} labels={activity.labels} />; break;
    case "data": content = <Data values={activity.values} labels={activity.labels} />; break;
    case "shape": content = <Shape values={activity.values} />; break;
    case "area": content = <Area values={activity.values} />; break;
    case "volume": content = <Volume values={activity.values} />; break;
    case "ratio": content = <Ratio values={activity.values} labels={activity.labels} />; break;
  }
  return <section className={styles.activity} aria-label="动手发现"><p className={styles.instruction}>{activity.instruction}</p>{content}</section>;
}
