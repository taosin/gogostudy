"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, RotateCcw } from "lucide-react";
import { ReadAloud } from "@/components/media/read-aloud";
import type { DiscoveryActivity, LearningLesson } from "@/lib/learning-types";
import styles from "./subject-activity.module.css";

const MathActivity = dynamic(() => import("./math-activity").then((module) => module.MathActivity), {
  loading: () => <p role="status">正在准备小教具…</p>,
});
type ActivityOf<K extends DiscoveryActivity["kind"]> = Extract<DiscoveryActivity, { kind: K }>;

function Feedback({ text }: { text: string }) {
  return <p className={styles.feedback} role="status" aria-live="polite">{text}</p>;
}

function Sequence({ activity }: { activity: ActivityOf<"sequence"> }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("点下面的卡片，按你认为合适的顺序排起来。");
  const [checked, setChecked] = useState(false);
  const correct = chosen.length === activity.order.length && chosen.every((id, i) => id === activity.order[i]);
  return <>
    <ol className={styles.ordered} aria-label="我排的顺序">{activity.order.map((_, index) => {
      const item = activity.items.find((value) => value.id === chosen[index]);
      return <li key={index}><span>{index + 1}</span>{item ? <div><strong>{item.text}</strong>{checked && correct && item.note ? <small>{item.note}</small> : null}</div> : <em>放一张卡片</em>}</li>;
    })}</ol>
    <div className={styles.choices} aria-label="待排列的卡片">{activity.items.map((item) => <button key={item.id} disabled={chosen.includes(item.id) || checked && correct} onClick={() => { setChosen([...chosen, item.id]); setChecked(false); setFeedback("卡片已放好。排完后，检查一下你的理由。"); }}>{item.text}</button>)}</div>
    <div className={styles.actions}>
      <button className={styles.primary} disabled={chosen.length !== activity.order.length} onClick={() => { setChecked(true); setFeedback(correct ? activity.success : "有些卡片的顺序需要再想一想。可以撤回最后一张，或重新排一遍。"); }}>检查顺序<Check size={16} /></button>
      <button disabled={!chosen.length} onClick={() => { setChosen(chosen.slice(0, -1)); setChecked(false); setFeedback("撤回了一张。想想前后有什么联系。"); }}>撤回一张</button>
      <button onClick={() => { setChosen([]); setChecked(false); setFeedback("新的尝试开始了。"); }}><RotateCcw size={16} />重新排列</button>
    </div><Feedback text={feedback} />
  </>;
}

function Pairs({ activity }: { activity: ActivityOf<"pairs"> }) {
  const [left, setLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [feedback, setFeedback] = useState("先选左边的一张，再找右边和它对应的一张。");
  const rightOrder = activity.pairs.map((_, i) => (i + 1) % activity.pairs.length);
  function pair(right: number) {
    if (left === null) { setFeedback("先选左边的一张卡片吧。"); return; }
    if (right !== left) { setFeedback("这两张还没有对应上。再读一读左边的意思，找找它的伙伴。"); return; }
    const next = [...matched, right];
    setMatched(next); setLeft(null);
    setFeedback(activity.pairs[right].explanation + (next.length === activity.pairs.length ? " 全部配好了！再说说每一对的关系。" : ""));
  }
  return <>
    <div className={styles.pairs}>
      <div aria-label="左边卡片">{activity.pairs.map((item, i) => <button key={item.left} disabled={matched.includes(i)} aria-pressed={left === i} onClick={() => { setLeft(i); setFeedback("已选“" + item.left + "”，找一找右边的伙伴。"); }}>{item.left}{matched.includes(i) ? <Check size={16} aria-label="已配对" /> : null}</button>)}</div>
      <div aria-label="右边卡片">{rightOrder.map((i) => <button key={activity.pairs[i].right} disabled={matched.includes(i)} onClick={() => pair(i)}>{activity.pairs[i].right}{matched.includes(i) ? <Check size={16} aria-label="已配对" /> : null}</button>)}</div>
    </div>
    <Feedback text={feedback} />
    <div className={styles.actions}><span>已配对 {matched.length} / {activity.pairs.length}</span><button onClick={() => { setLeft(null); setMatched([]); setFeedback("先选左边，再选右边。"); }}><RotateCcw size={16} />重新配对</button></div>
  </>;
}

function Sort({ activity }: { activity: ActivityOf<"sort"> }) {
  const [placed, setPlaced] = useState(0);
  const [feedback, setFeedback] = useState("先读卡片，再按同一个规则找类别。");
  const item = activity.items[placed];
  return <>
    <div className={styles.sortCard}><small>{item ? "这一张，应该放在哪里？" : "所有卡片都找到了自己的位置"}</small><strong>{item?.text ?? "整理完成"}</strong></div>
    <div className={styles.categories}>{activity.categories.map((category, index) => <div key={category}>
      <button className={styles.primary} disabled={!item} onClick={() => {
        if (item.category !== index) { setFeedback("再想一想：“" + item.text + "”有什么特点？看看其他类别。"); return; }
        setPlaced(placed + 1); setFeedback(item.explanation + (placed + 1 === activity.items.length ? " " + activity.success : ""));
      }}>{category}</button>
      <ul>{activity.items.slice(0, placed).filter((value) => value.category === index).map((value) => <li key={value.text}>{value.text}</li>)}</ul>
    </div>)}</div>
    <Feedback text={feedback} />
    <div className={styles.actions}><span>已整理 {placed} / {activity.items.length}</span><button onClick={() => { setPlaced(0); setFeedback("重新观察，再按规则分类。"); }}><RotateCcw size={16} />重新整理</button></div>
  </>;
}

function Evidence({ activity }: { activity: ActivityOf<"evidence"> }) {
  const [found, setFound] = useState<number[]>([]);
  const [feedback, setFeedback] = useState("从材料出发，找出有依据的说法。可以找到不止一条。");
  const total = activity.clues.filter((item) => item.correct).length;
  return <>
    <div className={styles.passage}><span>观察材料</span><p>{activity.passage}</p></div>
    <div className={styles.evidenceChoices}>{activity.clues.map((clue, index) => <button key={clue.text} aria-pressed={found.includes(index)} onClick={() => {
      if (!clue.correct) { setFeedback(clue.explanation); return; }
      const next = found.includes(index) ? found : [...found, index];
      setFound(next); setFeedback(clue.explanation + (next.length === total ? " " + activity.conclusion : ""));
    }}><span>{found.includes(index) ? <Check size={17} /> : "?"}</span>{clue.text}</button>)}</div>
    <Feedback text={feedback} />
    <div className={styles.actions}><span>有依据的发现 {found.length} / {total}</span><button onClick={() => { setFound([]); setFeedback("再读一次材料，找出能支持结论的线索。"); }}><RotateCcw size={16} />重新找线索</button></div>
  </>;
}

const directions = [
  { name: "向北走一格", delta: -3, icon: ArrowUp },
  { name: "向西走一格", delta: -1, icon: ArrowLeft },
  { name: "向东走一格", delta: 1, icon: ArrowRight },
  { name: "向南走一格", delta: 3, icon: ArrowDown },
];
function MapActivity({ activity }: { activity: ActivityOf<"map"> }) {
  const [position, setPosition] = useState(activity.start);
  const [route, setRoute] = useState<number[]>([activity.start]);
  const [feedback, setFeedback] = useState("先看方向标，再选择要走的方向。");
  function canMove(delta: number) {
    return !(delta === -1 && position % 3 === 0 || delta === 1 && position % 3 === 2 || position + delta < 0 || position + delta > 8);
  }
  return <>
    <div className={styles.mapCaption}><span>↑ 北</span><p>这张示意图上方是北；地点不按真实距离绘制。</p></div>
    <div className={styles.mapBoard} aria-label="九宫格位置示意图">{activity.cells.map((cell, index) => <div key={index} data-current={position === index} data-target={activity.target === index}><span>{position === index ? "● 我在这里" : index === activity.target ? "◎ 目的地" : "·"}</span><strong>{cell}</strong></div>)}</div>
    <div className={styles.directions}>{directions.map(({ name, delta, icon: Icon }) => <button key={name} disabled={!canMove(delta)} onClick={() => {
      const next = position + delta; setPosition(next); setRoute([...route, next]); setFeedback(next === activity.target ? activity.success : "到达" + activity.cells[next] + "，再看看目的地在哪个方向。");
    }}><Icon size={18} />{name}</button>)}</div>
    <Feedback text={feedback} />
    <p className={styles.route}>我走过：{route.map((index) => activity.cells[index]).join(" → ")}</p>
    <div className={styles.actions}><button onClick={() => { setPosition(activity.start); setRoute([activity.start]); setFeedback("回到起点，试试另一条路线。"); }}><RotateCcw size={16} />回到起点</button></div>
  </>;
}

function Listen({ activity }: { activity: ActivityOf<"listen"> }) {
  const [flipped, setFlipped] = useState<number[]>([]);
  return <>
    <div className={styles.wordCards}>{activity.items.map((item, index) => <div key={item.text}><strong lang={activity.lang}>{item.text}</strong>
      {flipped.includes(index) ? <p>{item.meaning}</p> : <p className={styles.hiddenMeaning}>猜猜它表达什么意思？</p>}
      <div><button onClick={() => setFlipped(flipped.includes(index) ? flipped.filter((i) => i !== index) : [...flipped, index])}>{flipped.includes(index) ? "合上意思" : "翻开看看"}<RotateCcw size={14} /></button><ReadAloud text={item.spoken ?? item.text} lang={activity.lang} label={"听一听 " + item.text} compact /></div>
    </div>)}</div>
    <Feedback text="先看词句，猜猜意思，再翻开卡片。也可以听一听、跟着读。" />
    <p className={styles.note}>声音由设备提供，不能播放时可看文字学习。跟读不录音，也不评判发音；换语速后会从头读。</p>
  </>;
}

export function SubjectActivity({ activity }: { activity: LearningLesson["activity"] }) {
  let content;
  switch (activity.kind) {
    case "sequence": content = <Sequence activity={activity} />; break;
    case "pairs": content = <Pairs activity={activity} />; break;
    case "sort": content = <Sort activity={activity} />; break;
    case "evidence": content = <Evidence activity={activity} />; break;
    case "map": content = <MapActivity activity={activity} />; break;
    case "listen": content = <Listen activity={activity} />; break;
    default: return <MathActivity activity={activity} />;
  }
  return <section className={styles.activity} aria-label="动手发现"><p className={styles.instruction}>{activity.instruction}</p>{content}</section>;
}
