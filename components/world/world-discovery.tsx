"use client";

import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, RotateCcw, Sparkles } from "lucide-react";
import { ReadAloud } from "@/components/media/read-aloud";
import { LearningVideo } from "@/components/media/learning-video";
import styles from "./world-home.module.css";

type PlaceId = "math" | "chinese" | "history" | "geography" | "english" | "universe";

function Finding({ children }: { children: React.ReactNode }) {
  return <div className={styles.finding} role="status"><Sparkles size={18} /><div>{children}</div></div>;
}

function CountDiscovery() {
  const [seen, setSeen] = useState<number[]>([]);
  return <>
    <h3>草丛里，有几只萤火虫？</h3>
    <p>我来一个一个找。点过的小光点会留个记号。</p>
    <ReadAloud text="草丛里有几只萤火虫？我来一个一个找。每找到一只，就点一下它。点过的小光点会留个记号，数过的不用再数。" label="听听怎么找" compact />
    <div className={styles.fireflies} role="group" aria-label="数一数五只萤火虫">
      {[0, 1, 2, 3, 4].map((id) => <button key={id} aria-label={`萤火虫 ${id + 1}${seen.includes(id) ? "，已经数过" : ""}`} aria-pressed={seen.includes(id)} onClick={() => setSeen((value) => value.includes(id) ? value : [...value, id])}>
        <span className={styles.fireflyWings} aria-hidden="true" /><span>{seen.includes(id) ? seen.indexOf(id) + 1 : "✦"}</span>
      </button>)}
    </div>
    <div className={styles.discoveryReadout}>我找到了 <strong>{seen.length}</strong> 只<button onClick={() => setSeen([])} aria-label="重新数萤火虫"><RotateCcw size={15} />再数一次</button></div>
    {seen.length === 5 ? <Finding><strong>原来一共有 5 只！</strong><p>每只只数一次，最后的“5”就是总数。</p></Finding> : <p className={styles.smallHint}>数过的再点一次，不会多算一只。</p>}
    <LearningVideo id="count" />
  </>;
}

function ChoiceDiscovery({ title, text, prompt, choices, answer, explanation, spoken, lang = "zh-CN", audioLabel = "听听小鹿说的话" }: {
  title: string; text: string; prompt: string; choices: string[]; answer: number; explanation: string; spoken?: string; lang?: "zh-CN" | "en-GB"; audioLabel?: string;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  return <>
    <h3>{title}</h3><blockquote className={styles.sceneQuote}>{text}</blockquote><ReadAloud text={spoken ?? text} lang={lang} label={audioLabel} compact /><p>{prompt}</p>
    <div className={styles.quickChoices} role="group" aria-label={prompt}>{choices.map((label, index) => <button key={label} aria-pressed={choice === index} onClick={() => setChoice(index)}>{label}{choice === index ? <Check size={16} /> : null}</button>)}</div>
    {choice !== null ? <Finding><strong>{choice === answer ? "我找到线索了。" : "我再回到场景里看看。"}</strong><p>{explanation}</p></Finding> : null}
  </>;
}

function TimeDiscovery() {
  const events = ["傍晚回家", "早上出发", "中午野餐"];
  const [order, setOrder] = useState<number[]>([]);
  const correct = order.join(",") === "1,2,0";
  return <>
    <h3>把我的旅行放回时间里</h3><p>三张记录散开了。我想按从早到晚的顺序摆好。</p><ReadAloud text="三张旅行记录散开了。它们写着，傍晚回家，早上出发，中午野餐。我想按从早到晚的顺序摆好。先找到最早发生的那件事。" label="听听旅行记录" compact />
    <div className={styles.timeSlots} aria-label="我排出的旅行顺序">{[0, 1, 2].map((i) => <div key={i}><small>{i + 1}</small><span>{order[i] === undefined ? "等一张记录" : events[order[i]]}</span></div>)}</div>
    <div className={styles.quickChoices} role="group" aria-label="选择下一张旅行记录">{events.map((event, i) => <button key={event} disabled={order.includes(i)} onClick={() => setOrder((value) => [...value, i])}>{event}</button>)}</div>
    <button className={styles.resetDiscovery} onClick={() => setOrder([])}><RotateCcw size={15} />重新摆一摆</button>
    {order.length === 3 ? <Finding><strong>{correct ? "这就是我的一天。" : "时间线索能帮我再排一次。"}</strong><p>早上出发，在中午野餐，傍晚再回家。认识过去的事，也要先找清楚谁先发生、谁后发生。</p></Finding> : null}
  </>;
}

function MapDiscovery() {
  const [position, setPosition] = useState(6);
  const [moves, setMoves] = useState<string[]>([]);
  const row = Math.floor(position / 3), col = position % 3;
  const actions = [{ label: "向上", delta: -3, disabled: row === 0, icon: ArrowUp }, { label: "向左", delta: -1, disabled: col === 0, icon: ArrowLeft }, { label: "向下", delta: 3, disabled: row === 2, icon: ArrowDown }, { label: "向右", delta: 1, disabled: col === 2, icon: ArrowRight }];
  return <>
    <h3>我能找到山谷里的小屋吗？</h3><p>我在左下角，小屋在右上角。每次走一格，边走边说出方向。</p><ReadAloud text="我在地图的左下角，小屋在右上角。点方向按钮，每次走一格，边走边说出方向。想一想，我准备怎么走？" label="听听怎么走" compact />
    <div className={styles.miniMap} role="img" aria-label={`三行三列地图，我在第${row + 1}行第${col + 1}列，小屋在第一行第三列`}>{Array.from({ length: 9 }, (_, i) => <div key={i} data-current={position === i}>{i === position ? <span className={styles.miniMe}>我</span> : i === 2 ? "⌂" : i === 4 ? "♧" : "·"}</div>)}</div>
    <div className={styles.directionButtons} role="group" aria-label="我在山谷里的行走方向">{actions.map(({ label, delta, disabled, icon: Icon }) => <button key={label} disabled={disabled} aria-label={label + "走一格"} onClick={() => { setPosition(position + delta); setMoves((value) => [...value.slice(-7), label]); }}><Icon size={20} /><span>{label}</span></button>)}</div>
    <p className={styles.walkRecord} aria-live="polite">{moves.length ? "刚才的脚步：" + moves.join(" → ") : "先想一想，我准备怎么走？"}</p>
    {position === 2 ? <Finding><strong>我到小屋了！</strong><p>不同的路线，也能到同一个地方。用方向和格数，我能把走过的路讲给别人听。</p></Finding> : null}
    <button className={styles.resetDiscovery} onClick={() => { setPosition(6); setMoves([]); }}><RotateCcw size={15} />回到出发点</button>
  </>;
}

function SunDiscovery() {
  const [night, setNight] = useState(false);
  return <>
    <h3>同一个地方，为什么会天黑？</h3><p>金色小点就是我观察的地方。我来把地球转半圈。</p><ReadAloud text="金色小点，就是我观察的地方。太阳光从左边照过来。我来把地球转半圈，看看小点会发生什么变化。" label="听听观察方法" compact />
    <div className={styles.sunExperiment}>
      <svg viewBox="0 0 300 130" role="img" aria-label={night ? "太阳在左边，小点转到地球右侧的黑夜一边" : "太阳在左边，小点在地球左侧的白天一边"}>
        <circle cx="43" cy="64" r="23" fill="#f0c86c" /><path d="M77 45h49m-49 19h49m-49 19h49" stroke="#e8be69" strokeWidth="2" />
        <circle cx="210" cy="64" r="48" fill="#254957" /><path d="M210 16a48 48 0 0 0 0 96Z" fill="#91be9e" />
        <circle cx={night ? 251 : 169} cy="64" r="7" fill="#ffe493" stroke="#fff8de" strokeWidth="2" />
        <text x="43" y="112" textAnchor="middle" fill="#e7ecda" fontSize="14">太阳</text><text x="210" y="125" textAnchor="middle" fill="#e7ecda" fontSize="12">地球 · 大小与距离为示意</text>
      </svg>
    </div>
    <button className={styles.turnEarth} onClick={() => setNight(!night)}><RotateCcw size={17} />我把地球再转半圈</button>
    <Finding><strong>我观察的地方现在是{night ? "黑夜" : "白天"}。</strong><p>{night ? "它转到了背向太阳的一侧，阳光照不到这里。太阳还在照亮地球另一侧。" : "它朝向太阳，能受到阳光照射。昼夜交替和地球的自转有关。"}</p></Finding>
    <LearningVideo id="day-night" />
  </>;
}

export function WorldDiscovery({ placeId }: { placeId: PlaceId }) {
  switch (placeId) {
    case "math": return <CountDiscovery />;
    case "chinese": return <ChoiceDiscovery title="小鹿请我帮一个小忙" text="小鹿说：请先拿来一个杯子，再给杯子倒半杯水。" prompt="我听清了，要先做什么，再做什么？" choices={["先倒水，再拿杯子", "先拿杯子，再倒水", "只拿杯子就可以"]} answer={1} explanation="朋友的话里有两个小任务：先拿杯子，再倒水。我把谁要做什么、事情的先后听清楚，就能把忙帮好。也可以请家人读一遍，我再用自己的话说出来。" />;
    case "history": return <TimeDiscovery />;
    case "geography": return <MapDiscovery />;
    case "english": return <ChoiceDiscovery title="港口来了一个新朋友" text="Hello! 我想先和新朋友打个招呼。" spoken="Hello!" lang="en-GB" audioLabel="听听 Hello 怎么说" prompt="我会选哪句话开始聊天？" choices={["Hello!", "Goodbye!", "Thank you!"]} answer={0} explanation="Hello! 是“你好”，适合见面打招呼。Goodbye! 是告别，Thank you! 是感谢。" />;
    case "universe": return <SunDiscovery />;
  }
}
