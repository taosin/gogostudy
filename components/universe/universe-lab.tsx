"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { getDayNightState, getOrbitState, getWaterCycleState, normalizeDegrees, ORBIT_PERIOD_DAYS, pointAlongPolyline, WATER_STAGES, WATER_STAGE_SECONDS, type OrbitPlanet } from "@/lib/universe-simulation";
import styles from "./universe-lab.module.css";

// Scientific sources and model boundaries are documented in universe-simulation.ts.
const stars = [[28, 36], [164, 27], [390, 34], [426, 119], [53, 264], [201, 281], [415, 278], [139, 203], [376, 211], [240, 49]];
const phaseLabels = { day: "白天", night: "黑夜", sunset: "黄昏交界", sunrise: "清晨交界" };

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const reducedMotionSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The active illustration alone updates at at most 12.5 Hz, with no page-level clock. */
function useLabClock(rate: number, diagramRef: RefObject<HTMLElement | null>) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pauseReason, setPauseReason] = useState("");
  const visibleRef = useRef(true);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, reducedMotionSnapshot, () => false);

  useEffect(() => {
    const pauseForVisibility = () => {
      if (document.hidden) { setPlaying(false); setPauseReason("页面暂时离开了，播放已暂停。回来看时可以继续。"); }
    };
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pauseForPreference = () => { if (media.matches) setPlaying(false); };
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      if (!entry.isIntersecting) { setPlaying(false); setPauseReason("画面移出视野，已暂停。回来看时可以继续。"); }
    }, { threshold: 0.05 });
    if (diagramRef.current) observer.observe(diagramRef.current);
    document.addEventListener("visibilitychange", pauseForVisibility);
    media.addEventListener("change", pauseForPreference);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", pauseForVisibility); media.removeEventListener("change", pauseForPreference); };
  }, [diagramRef]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous: number | null = null;
    let pending = 0;
    const tick = (now: number) => {
      if (document.hidden || !visibleRef.current) { setPlaying(false); return; }
      if (previous !== null) pending += Math.max(0, (now - previous) / 1000);
      previous = now;
      if (pending >= 0.08) {
        const step = pending;
        pending = 0;
        setElapsed((value) => value + step * rate);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, rate]);

  function seek(value: number) { setPlaying(false); setPauseReason(""); setElapsed(Math.max(0, value)); }
  function toggle() { setPauseReason(""); setPlaying((value) => !value && !document.hidden && visibleRef.current); }
  return { elapsed, playing, pauseReason, reducedMotion, seek, toggle, reset: () => seek(0) };
}

function Stars() {
  return <g aria-hidden="true">{stars.map(([x, y], index) => <circle key={index} cx={x} cy={y} r={index % 3 === 0 ? 1.5 : 1} fill="#b7cdd2" opacity="0.55" />)}</g>;
}

function Playback({ clock, extra }: { clock: ReturnType<typeof useLabClock>; extra?: ReactNode }) {
  return <>
    <div className={styles.controls}>
      <button type="button" className={styles.primaryButton} onClick={clock.toggle} aria-pressed={clock.playing}><span aria-hidden="true">{clock.playing ? "Ⅱ" : "▷"}</span>{clock.playing ? "暂停播放" : "播放看看"}</button>
      {extra}
      <button type="button" className={styles.button} onClick={clock.reset}>回到起点</button>
    </div>
    {clock.reducedMotion ? <p className={styles.motionNote}>当前使用减少动态效果的偏好。可以用按钮或滑块逐步观察，也可以主动播放。</p> : null}
    {clock.pauseReason ? <p className={styles.motionNote}>{clock.pauseReason}</p> : null}
  </>;
}

function Prediction({ prompt, options, answer, explanation }: { prompt: string; options: string[]; answer: number; explanation: string }) {
  const id = useId();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  return <form className={styles.prediction} onSubmit={(event) => { event.preventDefault(); if (choice !== null) setChecked(true); }}>
    <fieldset><legend><span>先猜一猜</span>{prompt}</legend>
      <div className={styles.options}>{options.map((option, index) => <label key={option} className={styles.option}>
        <input type="radio" name={id} checked={choice === index} onChange={() => { setChoice(index); setChecked(false); }} />
        <span>{option}</span>
      </label>)}</div>
    </fieldset>
    <button className={styles.button} disabled={choice === null}>看看这个想法</button>
    {checked ? <p className={styles.feedback} role="status"><strong>{choice === answer ? "这个预测有依据。" : "一起回到画面找找原因。"}</strong>{explanation}<span>这是一次探索，可以换个想法继续试。</span></p> : null}
  </form>;
}

function DayNightLab() {
  const diagramRef = useRef<HTMLElement>(null);
  const clock = useLabClock(24, diagramRef);
  const id = useId();
  const angle = normalizeDegrees(clock.elapsed);
  const sliderAngle = !clock.playing && clock.elapsed > 0 && angle === 0 ? 360 : angle;
  const state = getDayNightState(angle);
  const cx = 316, cy = 149, radius = 88;
  const markerX = cx + state.x * radius;
  const markerY = cy + state.y * radius;
  return <>
    <div className={styles.panelHeading}><span className={styles.kicker}>一个地方，怎样从白天走进黑夜？</span><h3>地球在转，阳光照着一侧</h3><p>拖动滑块，盯住同一个金色小点。太阳光一直从左边照来。</p></div>
    <figure ref={diagramRef} className={styles.figure}>
      <svg className={styles.spaceScene} viewBox="0 0 460 300" role="img" aria-labelledby={`${id}-day-title ${id}-day-desc`}>
        <title id={`${id}-day-title`}>地球自转与昼夜</title><desc id={`${id}-day-desc`}>{`从北极上空俯看。太阳光从左方照来，左半边是白天、右半边是黑夜。地表观察点目前在${phaseLabels[state.phase]}，当地示意时刻${state.clock}。`}</desc>
        <defs><clipPath id={`${id}-earth-clip`}><circle cx={cx} cy={cy} r={radius} /></clipPath><radialGradient id={`${id}-sun-glow`}><stop offset="0" stopColor="#ffe9a8" /><stop offset="1" stopColor="#f0bb61" /></radialGradient><marker id={`${id}-light-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#ecc575" /></marker></defs>
        <Stars /><circle cx="63" cy="149" r="43" fill="#f4cc7620" /><circle cx="63" cy="149" r="32" fill={`url(#${id}-sun-glow)`} />
        <text x="63" y="205" textAnchor="middle" className={styles.spaceText}>太阳</text>
        {[108, 149, 190].map((y) => <path key={y} d={`M 111 ${y} H 210`} stroke="#ecc575" strokeWidth="2" markerEnd={`url(#${id}-light-arrow)`} />)}
        <g clipPath={`url(#${id}-earth-clip)`}>
          <circle cx={cx} cy={cy} r={radius} fill="#1e4151" /><rect x={cx - radius} y={cy - radius} width={radius} height={radius * 2} fill="#94c7b3" />
          <g transform={`rotate(${-angle} ${cx} ${cy})`} stroke="#719d98" strokeWidth="1.1" opacity="0.68"><circle cx={cx} cy={cy} r="55" fill="none" /><circle cx={cx} cy={cy} r="27" fill="none" /><path d={`M${cx - radius} ${cy}H${cx + radius}M${cx} ${cy - radius}V${cy + radius}`} /></g>
        </g>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#b5d8ce" strokeWidth="2" />
        <text x="272" y="154" textAnchor="middle" className={styles.dayText}>白天</text><text x="359" y="154" textAnchor="middle" className={styles.spaceText}>黑夜</text>
        <circle cx={markerX} cy={markerY} r="13" fill="#f9d77930" /><circle cx={markerX} cy={markerY} r="7" fill="#ffdc7c" stroke="#263f4c" strokeWidth="2.5" />
        <text x="230" y="270" textAnchor="middle" className={styles.spaceSmall}>金色小点：同一个地表观察点</text>
      </svg>
      <figcaption>从北极上空俯看，边缘上的点代表赤道附近一个地方。这里用圆面表示地球，没有画真实陆地轮廓。</figcaption>
    </figure>
    <div className={styles.readout} aria-live="off"><div><span>观察点现在是</span><strong>{phaseLabels[state.phase]}</strong></div><div><span>当地示意时刻</span><strong>{state.clock}</strong></div><div><span>自转示意角度</span><strong>{Math.round(sliderAngle)}°</strong></div></div>
    <label className={styles.sliderLabel} htmlFor={`${id}-angle`}>转一转地球<span>从正午出发，转到另一个时刻</span></label>
    <input id={`${id}-angle`} className={styles.slider} type="range" min="0" max="360" step="15" value={sliderAngle} aria-valuetext={`${Math.round(sliderAngle)}度，${phaseLabels[state.phase]}，${state.clock}`} onChange={(event) => clock.seek(Number(event.target.value))} />
    <Playback clock={clock} extra={<button type="button" className={styles.button} onClick={() => clock.seek(angle + 90)}>再转四分之一圈</button>} />
    <p className={styles.explanation}>当地转到朝向太阳的一侧，就能受到阳光照射；转到背向太阳的一侧，就进入黑夜。<strong>昼夜交替主要来自地球自转，太阳没有每天熄灭。</strong></p>
    <p className={styles.modelNote}>本图忽略公转、地轴倾斜及纬度差别，用约 24 小时表示一次昼夜变化。真实昼夜时长受纬度和季节影响，并不总是各 12 小时。示意时刻不是城市实时时间，也不用于解释四季。</p>
    <Prediction prompt="小点从朝向太阳的一侧转到背向太阳的一侧，会怎样？" options={["太阳会熄灭", "这个地方会进入黑夜", "整个地球会同时变黑"]} answer={1} explanation="小点所在的地方背向太阳时，阳光照不到这里；与此同时，地球另一侧仍在白天。" />
  </>;
}

function OrbitLab() {
  const [planet, setPlanet] = useState<OrbitPlanet>("earth");
  const [speed, setSpeed] = useState(30);
  const diagramRef = useRef<HTMLElement>(null);
  const clock = useLabClock(speed, diagramRef);
  const id = useId();
  const state = getOrbitState(clock.elapsed, planet);
  const planetName = planet === "earth" ? "地球" : "火星";
  const radius = planet === "earth" ? 77 : 118;
  const cx = 230, cy = 157;
  const x = cx + state.x * radius, y = cy + state.y * radius;
  return <>
    <div className={styles.panelHeading}><span className={styles.kicker}>同样一段时间，谁先绕完一圈？</span><h3>沿着轨道，比一比公转的时间</h3><p>选择地球或火星，用同一把“地球日”的尺子比较。换行星时，经过的时间保持不变。</p></div>
    <div className={styles.planetChoices} role="group" aria-label="选择重点观察的行星">{(["earth", "mars"] as const).map((value) => <button type="button" key={value} className={styles.button} aria-pressed={planet === value} onClick={() => setPlanet(value)}>{value === "earth" ? "地球 · 约365.25天一圈" : "火星 · 约687天一圈"}</button>)}</div>
    <figure ref={diagramRef} className={styles.figure}>
      <svg className={styles.spaceScene} viewBox="0 0 460 320" role="img" aria-labelledby={`${id}-orbit-title ${id}-orbit-desc`}>
        <title id={`${id}-orbit-title`}>地球与火星公转周期比较</title><desc id={`${id}-orbit-desc`}>{`两个压缩距离的圆形轨道以太阳为中心。经过${state.days.toFixed(1)}个地球日，${planetName}完成${state.completedOrbits}圈，目前这一圈走了约${Math.round(state.fraction * 100)}%。橙箭头表示始终朝向太阳的引力。`}</desc>
        <defs><marker id={`${id}-gravity`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#efb976" /></marker><marker id={`${id}-motion`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#e4f3ef" /></marker></defs>
        <Stars />{[77, 118].map((r) => <circle key={r} cx={cx} cy={cy} r={r} stroke="#90afa7" strokeOpacity="0.5" strokeWidth="1.4" strokeDasharray="4 6" fill="none" />)}
        <circle cx={cx} cy={cy} r="36" fill="#f5c97120" /><circle cx={cx} cy={cy} r="23" fill="#f4c46f" /><text x={cx} y={cy + 5} textAnchor="middle" className={styles.sunText}>太阳</text>
        <line x1={x - state.x * 14} y1={y - state.y * 14} x2={cx + state.x * 38} y2={cy + state.y * 38} stroke="#efb976" strokeWidth="2" markerEnd={`url(#${id}-gravity)`} />
        <line x1={x} y1={y} x2={x + state.y * 27} y2={y - state.x * 27} stroke="#e4f3ef" strokeWidth="2" markerEnd={`url(#${id}-motion)`} />
        {(["earth", "mars"] as const).map((value) => {
          const position = getOrbitState(clock.elapsed, value);
          const r = value === "earth" ? 77 : 118;
          const px = cx + position.x * r, py = cy + position.y * r;
          return <g key={value} opacity={value === planet ? 1 : 0.65}><circle cx={px} cy={py} r={value === planet ? 18 : 12} fill={value === "earth" ? "#76baa225" : "#d6976c25"} /><circle cx={px} cy={py} r={value === planet ? 10 : 7} fill={value === "earth" ? "#98d3ba" : "#e9a67e"} /><text x={px} y={py < cy ? py - 23 : py + 31} textAnchor="middle" className={styles.spaceSmall}>{value === "earth" ? "地球" : "火星"}</text></g>;
        })}
      </svg>
      <figcaption>圆形、匀速的轨道示意，尺寸与距离都压缩过。两颗行星从统一位置开始比较，不表示今天的真实位置。橙箭头指向太阳，浅色箭头表示向前运动。</figcaption>
    </figure>
    <div className={styles.readout} aria-live="off"><div><span>经过的地球日</span><strong>{Number(state.days.toFixed(2))} 天</strong></div><div><span>{planetName}完成整圈</span><strong>{state.completedOrbits} 圈</strong></div><div><span>这一圈走过</span><strong>{Math.round(state.fraction * 100)}%</strong></div></div>
    <label htmlFor={`${id}-speed`} className={styles.sliderLabel}>播放速度<span>屏幕 1 秒 = {speed} 个地球日</span></label><input id={`${id}-speed`} className={styles.slider} type="range" min="15" max="90" step="15" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
    <Playback clock={clock} extra={<button type="button" className={styles.button} onClick={() => clock.seek(clock.elapsed + 30)}>往后看 30 天</button>} />
    <div className={styles.jumpControls}><button type="button" className={styles.button} onClick={() => clock.seek(ORBIT_PERIOD_DAYS.earth)}>直接看 365.25 天</button><button type="button" className={styles.button} onClick={() => clock.seek(ORBIT_PERIOD_DAYS.mars)}>直接看 687 天</button></div>
    <p className={styles.explanation}>行星一边向前运动，一边<strong>持续受到太阳的引力</strong>，路线不断弯曲。地球绕太阳一圈约 {ORBIT_PERIOD_DAYS.earth} 个地球日，火星约 {ORBIT_PERIOD_DAYS.mars} 个地球日。</p>
    <p className={styles.modelNote}>真实轨道近似椭圆。本图用圆来比较周期，没有计算真实引力大小；调速只改变播放快慢，不是在给行星加速，也不表示引力消失。</p>
    <Prediction prompt="同样经过 365.25 个地球日，哪个预测更合理？" options={["火星已经比地球多绕了一圈", "两颗行星一定都刚好绕完一圈", "地球约绕完一圈，火星还没绕完一圈"]} answer={2} explanation="火星完成一圈约需687个地球日，比365.25天更久。用同一段时间比较，能看清公转周期的不同。" />
  </>;
}

function WaterCycleLab() {
  const diagramRef = useRef<HTMLElement>(null);
  const clock = useLabClock(1, diagramRef);
  const id = useId();
  const { stage, fraction } = getWaterCycleState(clock.elapsed);
  const current = WATER_STAGES[stage];
  const runoff = pointAlongPolyline([[339, 208], [308, 230], [263, 232], [224, 255], [154, 257]], fraction);
  return <>
    <div className={styles.panelHeading}><span className={styles.kicker}>水怎样连接天空与大地？</span><h3>跟着太阳与重力，追一条水的可能路线</h3><p>先逐步观察，再播放连起来看。图中只选取水循环的一条简化路径。</p></div>
    <div className={styles.waterSteps} role="group" aria-label="选择水循环过程">{WATER_STAGES.map((item, index) => <button type="button" key={item.title} className={styles.stepButton} aria-pressed={stage === index} onClick={() => clock.seek(index * WATER_STAGE_SECONDS)}><span>{index + 1}</span>{item.title}</button>)}</div>
    <figure ref={diagramRef} className={styles.figure}>
      <svg className={styles.waterScene} viewBox="0 0 460 300" role="img" aria-labelledby={`${id}-water-title ${id}-water-desc`}>
        <title id={`${id}-water-title`}>太阳能量与重力推动水循环</title><desc id={`${id}-water-desc`}>{`目前观察第${stage + 1}步：${current.title}。${current.description}`}</desc>
        <defs><linearGradient id={`${id}-sky`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#dcecf0" /><stop offset="1" stopColor="#f4f7e9" /></linearGradient><marker id={`${id}-water-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#497b81" /></marker></defs>
        <rect width="460" height="300" fill={`url(#${id}-sky)`} /><circle cx="60" cy="62" r="32" fill="#f5d991" /><circle cx="60" cy="62" r="23" fill="#edbd62" /><text x="60" y="108" textAnchor="middle" className={styles.waterText}>太阳能量</text>
        <path d="M129 245L287 136L362 226L409 193L460 235V300H129Z" fill="#a7bd99" /><path d="M237 171L287 136L326 183L287 165L269 180Z" fill="#dce7d5" /><path d="M0 238Q90 225 174 244L190 300H0Z" fill="#70adb8" /><path d="M0 258Q80 246 150 264M14 281Q78 270 151 283" fill="none" stroke="#d3e9e7" strokeWidth="2" />
        <path d="M339 208L308 230L263 232L224 255L154 257" fill="none" stroke="#669eaa" strokeWidth="8" strokeLinejoin="round" />
        <path d="M105 218C102 158 153 115 226 88" fill="none" stroke={stage === 0 ? "#427984" : "#749392"} strokeOpacity={stage === 0 ? 1 : 0.35} strokeWidth={stage === 0 ? 3 : 2} strokeDasharray="5 6" strokeDashoffset={stage === 0 ? -fraction * 44 : 0} markerEnd={`url(#${id}-water-arrow)`} />
        <g opacity={stage === 1 ? 0.55 + fraction * 0.45 : 0.86} fill="#fffef5" stroke={stage === 1 ? "#699a9b" : "#c1d4cb"} strokeWidth={stage === 1 ? 2.5 : 1.2}><path d="M250 104C226 101 228 77 248 73C246 51 278 40 292 58C308 29 349 43 353 67C383 62 396 101 371 108Z" /></g>
        {[260, 283, 307, 330, 354].map((x, index) => <g key={x}>
          {stage === 1 ? <circle cx={x} cy={84 + (index % 2) * 9} r={2.5 + fraction * 1.5} fill="#80afb4" /> : null}
          <path d={`M${x} ${120 + (stage === 2 ? (fraction * 40 + index * 7) % 40 : 4)}l-6 14`} stroke="#43879c" strokeOpacity={stage === 2 ? 0.9 : 0.14} strokeWidth="2.5" strokeLinecap="round" />
        </g>)}
        {stage === 3 ? <><polyline points="339,208 308,230 263,232 224,255 154,257" stroke="#f6e29c" strokeWidth="3" fill="none" strokeLinejoin="round" /><circle cx={runoff.x} cy={runoff.y} r="6" fill="#fff5c5" stroke="#487784" strokeWidth="2" /></> : null}
        <text x="73" y="216" textAnchor="middle" className={styles.waterText}>蒸发 ↑</text><text x="319" y="27" textAnchor="middle" className={styles.waterText}>小水滴 / 冰晶</text><text x="400" y="150" textAnchor="middle" className={styles.waterText}>降水 ↓</text><text x="315" y="276" textAnchor="middle" className={styles.waterText}>汇流 → 低处</text>
      </svg>
      <figcaption>虚线表示看不见的水蒸气的运动方向。亮点仅用于指示汇流位置；过程被放慢或加快展示，不表示真实耗时。</figcaption>
    </figure>
    <Playback clock={clock} extra={<button type="button" className={styles.button} onClick={() => clock.seek(((stage + 1) % WATER_STAGES.length) * WATER_STAGE_SECONDS)}>{stage === 3 ? "回到蒸发，再连起来" : "看下一步"}</button>} />
    <div className={styles.waterExplanation} aria-live="polite" aria-atomic="true"><span>第 {stage + 1} 步 · {current.short}</span><h4>{current.title}</h4><p>{current.description}</p><strong>{current.connection}</strong></div>
    <p className={styles.modelNote}>四步是一条学习路线，真实水循环包含地下水、植物蒸腾、冰雪等许多路径，也不是所有水都按同一速度完成一圈。</p>
    <Prediction prompt="水蒸气遇冷后形成看得见的云，云里主要是什么？" options={["许多微小水滴或冰晶", "能直接看见的气态水蒸气", "只有从海里带来的大水珠"]} answer={0} explanation="水蒸气是看不见的气体；可见的云来自空气中的微小水滴或冰晶。云滴还需要长大等条件，才可能形成降水。" />
  </>;
}

export type UniverseExperiment = "day-night" | "orbit" | "water-cycle";
const labs = [{ id: "day-night", title: "看昼夜", symbol: "◐" }, { id: "orbit", title: "比公转", symbol: "◎" }, { id: "water-cycle", title: "追水滴", symbol: "≈" }] as const;

export function UniverseLab({ experiment, onExperimentChange }: { experiment: UniverseExperiment; onExperimentChange: (id: UniverseExperiment) => void }) {
  const active = Math.max(0, labs.findIndex((lab) => lab.id === experiment));
  function setActive(index: number) { onExperimentChange(labs[index].id); }
  const id = useId();
  function navigate(event: KeyboardEvent<HTMLButtonElement>, current: number) {
    const next = event.key === "ArrowRight" ? (current + 1) % labs.length : event.key === "ArrowLeft" ? (current + labs.length - 1) % labs.length : event.key === "Home" ? 0 : event.key === "End" ? labs.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); setActive(next); document.getElementById(`${id}-tab-${next}`)?.focus();
  }
  return <section className={styles.lab} aria-label="宇宙与地球互动实验室">
    <div className={styles.tabs} role="tablist" aria-label="选择一个小模拟">{labs.map((lab, index) => <button key={lab.title} id={`${id}-tab-${index}`} type="button" role="tab" aria-selected={active === index} aria-controls={`${id}-panel`} tabIndex={active === index ? 0 : -1} onKeyDown={(event) => navigate(event, index)} onClick={() => setActive(index)}><span aria-hidden="true">{lab.symbol}</span>{lab.title}</button>)}</div>
    <div className={styles.panel} id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`}>{active === 0 ? <DayNightLab /> : active === 1 ? <OrbitLab /> : <WaterCycleLab />}</div>
  </section>;
}
