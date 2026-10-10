"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Atom, BookOpen, Compass, FlaskConical, GitBranch, Lightbulb, Telescope } from "lucide-react";
import { universeNodes, universeRelations, universeScales, universeSources, type UniverseNodeId, type UniverseScaleId } from "@/lib/universe-content";
import { JourneyCompanion, WorldNavigation } from "@/components/world/journey-companion";
import { DiscoveryStation } from "@/components/world/discovery-recorder";
import type { UniverseExperiment } from "./universe-lab";
import { ScaleScene } from "./scale-scene";
import styles from "./universe-explorer.module.css";

const UniverseLab = dynamic(() => import("./universe-lab").then((module) => module.UniverseLab), { loading: () => <p className={styles.loading} role="status">正在准备小实验…</p> });
type View = "scale" | "relations" | "lab";
type Kind = (typeof universeRelations)[number]["kind"];
const kinds: Record<Kind, { label: string; color: string; meaning: string }> = {
  contains: { label: "包含", color: "#587d92", meaning: "它在哪里？里面有什么？" },
  gravity: { label: "引力", color: "#8f6d9f", meaning: "哪些天体彼此吸引？" },
  energy: { label: "能量", color: "#a67a31", meaning: "能量从哪里传到哪里？" },
  matter: { label: "物质", color: "#38796d", meaning: "哪些物质进入它，供它生长或活动？" },
  cycle: { label: "循环", color: "#966751", meaning: "物质怎样回到环境中？" },
};
// Desktop and narrow-screen maps use the same nodes, with matching SVG line coordinates.
const positions: Record<string, [number, number, number, number]> = {
  universe: [13,12,18,9], galaxy: [37,12,50,9], sun: [63,12,82,9], moon: [86,29,82,27],
  earth: [44,36,50,27], water: [13,42,18,45], air: [72,44,82,45], soil: [13,70,18,63],
  plant: [39,62,50,45], animal: [64,69,50,63], decomposer: [86,72,82,63],
  cell: [36,90,18,84], molecule: [61,92,50,84], atom: [85,94,82,84],
};
const nodeSymbols: Record<string, string> = { universe: "✦", galaxy: "✧", sun: "☀", earth: "◉", moon: "☾", water: "≈", air: "≋", soil: "▱", plant: "♧", animal: "♢", decomposer: "⋯", cell: "◌", molecule: "⋰", atom: "⊙" };
const nodeById = new Map(universeNodes.map((node) => [node.id, node]));
const scaleToNode: Record<UniverseScaleId, UniverseNodeId> = { universe:"universe", galaxy:"galaxy", solar:"sun", earth:"earth", ecosystem:"plant", cell:"cell", molecule:"molecule", atom:"atom" };
const views = [{ id: "scale" as const, label: "换个范围看看", icon: Telescope, number: "01" }, { id: "relations" as const, label: "发现万物相连", icon: GitBranch, number: "02" }, { id: "lab" as const, label: "动手做小实验", icon: FlaskConical, number: "03" }];

function Connections({ selected, onSelect }: { selected: UniverseNodeId; onSelect: (id: UniverseNodeId) => void }) {
  const [kind, setKind] = useState<Kind | "all">("all");
  const [relationId, setRelationId] = useState<string | null>(null);
  const uid = useId().replace(/:/g, "");
  const infoRef = useRef<HTMLHeadingElement>(null);
  const node = nodeById.get(selected) ?? universeNodes[0];
  const related = universeRelations.filter((edge) => (edge.from === selected || edge.to === selected) && (kind === "all" || edge.kind === kind));
  const relation = related.find((edge) => edge.id === relationId) ?? related[0];
  const connectedIds = new Set(related.flatMap((edge) => [edge.from, edge.to]));
  function choose(id: UniverseNodeId) { onSelect(id); setKind("all"); setRelationId(null); }
  function readNode(id: UniverseNodeId) {
    choose(id);
    requestAnimationFrame(() => infoRef.current?.focus({ preventScroll: true }));
  }
  return <div className={styles.relationships}>
    <div className={styles.sectionIntro}><div><span className={styles.eyebrow}>把“知道是什么”，变成“知道为什么”</span><h2>一件事物，连着许多新发现。</h2></div><p>点一个事物，看它和谁相连。再点一条关系，读懂箭头真正的意思。</p></div>
    <div className={styles.relationLayout}>
      <div className={styles.networkCard}>
        <div className={styles.networkHeader}><span><GitBranch size={18} />万物联系图</span><span>选中了：{node.label}</span></div>
        {relation && <p className={styles.networkSentence}><strong>{nodeById.get(relation.from)?.label} → {nodeById.get(relation.to)?.label}</strong><span>{relation.label}</span></p>}
        <div className={styles.network} role="group" aria-label="选择要观察联系的事物">
          {[false, true].map((mobile) => <svg key={String(mobile)} className={mobile ? styles.mobileLines : styles.desktopLines} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>{Object.entries(kinds).map(([key, value]) => <marker key={key} id={`${uid}-${mobile}-${key}`} markerWidth="5" markerHeight="5" refX="3" refY="2" orient="auto" markerUnits="strokeWidth"><path d="M0 0 4 2 0 4Z" fill={value.color} /></marker>)}</defs>
            {related.map((edge) => {
              const start = positions[edge.from], end = positions[edge.to], offset = mobile ? 2 : 0;
              if (!start || !end) return null;
              const x1 = start[offset], y1 = start[offset + 1], x2 = end[offset], y2 = end[offset + 1];
              // Stop each line before the destination card so the arrowhead remains visible.
              const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy), trim = Math.min(10, length * .3);
              const strong = edge.id === relation?.id;
              return <line key={edge.id} x1={x1} y1={y1} x2={x2 - dx / length * trim} y2={y2 - dy / length * trim} stroke={kinds[edge.kind].color} strokeWidth={strong ? .65 : .35} opacity={strong ? .95 : .45} strokeDasharray={edge.kind === "gravity" ? "1 1" : undefined} markerEnd={`url(#${uid}-${mobile}-${edge.kind})`} />;
            })}
          </svg>)}
          {universeNodes.map((item) => {
            const [x,y,mx,my] = positions[item.id];
            return <button key={item.id} className={styles.node} data-group={item.group} data-related={item.id === selected || connectedIds.has(item.id)} aria-pressed={selected === item.id} style={{ "--x": `${x}%`, "--y": `${y}%`, "--mx": `${mx}%`, "--my": `${my}%` } as CSSProperties} onClick={() => choose(item.id)}><span aria-hidden="true">{nodeSymbols[item.id]}</span><strong>{item.label}</strong></button>;
          })}
        </div>
        <p className={styles.graphNote}>位置只为看清联系，不表示大小、距离或高低。箭头表示下面写明的关系；引力是相互的。</p>
      </div>
      <aside className={styles.nodeInfo} aria-labelledby="selected-node-title">
        <span className={styles.eyebrow}>先认识这位朋友</span><h3 id="selected-node-title" tabIndex={-1} ref={infoRef}>{node.label}</h3><p className={styles.nodeSummary}>{node.summary}</p><p>{node.detail}</p>
        <div className={styles.wonder}><Lightbulb size={20} /><div><strong>带着一个问题继续看</strong><p>{node.question}</p></div></div>
        <p className={styles.questionHint}>试着用“因为……所以……”讲清其中一条联系。</p>
      </aside>
    </div>
    <div className={styles.relationReading}>
      <div className={styles.filterHeading}><h3>这些线，分别在说什么？</h3><span>与{node.label}有关的 {related.length} 条联系</span></div>
      <div className={styles.filters} role="group" aria-label="按关系类型查看"><button aria-pressed={kind === "all"} onClick={() => setKind("all")}>全部联系</button>{Object.entries(kinds).map(([key,value]) => <button key={key} aria-pressed={kind === key} onClick={() => setKind(key as Kind)}><span style={{background:value.color}} />{value.label}</button>)}</div>
      <p className={styles.kindMeaning}>{kind === "all" ? "同一对事物可能有不同联系。粗线对应选中的关系，读一读说明，再说出完整的一句话。" : kinds[kind].meaning}</p>
      {related.length ? <div className={styles.edgeLayout}><div className={styles.edgeList} role="group" aria-label="选择一条关系">{related.map((edge) => <button key={edge.id} aria-pressed={relation?.id === edge.id} aria-label={`${nodeById.get(edge.from)?.label}到${nodeById.get(edge.to)?.label}：${edge.label}`} onClick={() => setRelationId(edge.id)}><span>{nodeById.get(edge.from)?.label}<ArrowRight size={15} />{nodeById.get(edge.to)?.label}</span><small>{edge.label}</small></button>)}</div><div className={styles.edgeExplanation} aria-live="polite"><span className={styles.edgeKind} style={{color:kinds[relation.kind].color}}>{kinds[relation.kind].label}</span><h4>{nodeById.get(relation.from)?.label}<ArrowRight size={20} />{nodeById.get(relation.to)?.label}</h4><strong>{relation.label}</strong><p>{relation.explanation}</p><button onClick={() => readNode(relation.from === selected ? relation.to : relation.from)}>再看看{nodeById.get(relation.from === selected ? relation.to : relation.from)?.label}<ArrowRight size={16} /></button></div></div> : <div className={styles.empty}>这幅入门图还没有展示这类联系。可以选择另一种关系，或点开别的事物。<button onClick={() => setKind("all")}>查看全部联系</button></div>}
    </div>
    <div className={styles.distinction}><Atom size={23} /><div><strong>记住两种不同的旅行</strong><p>物质能在环境和生物之间流动，在不同地方被再次利用。能量沿着联系传递，也不断转化、以热的形式散到环境中，不会沿食物关系重新循环。</p></div></div>
  </div>;
}

export function UniverseExplorer() {
  const [view, setView] = useState<View>("scale");
  const [scaleIndex, setScaleIndex] = useState(3);
  const [relationNode, setRelationNode] = useState<UniverseNodeId>("earth");
  const [experiment, setExperiment] = useState<UniverseExperiment>("day-night");
  const [ready, setReady] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const scale = universeScales[scaleIndex];
  const destinationId = view === "scale" ? `universe:scale:${scale.id}` : view === "relations" ? `universe:relations:${relationNode}` : `universe:lab:${experiment}`;
  useEffect(() => {
    function restoreLocation() {
      const hash = window.location.hash.slice(1);
      const scaleId = hash.startsWith("scale-") ? hash.slice(6) : "";
      const nextScale = universeScales.findIndex((item) => item.id === scaleId);
      const nextNode = hash.startsWith("relations-") ? hash.slice(10) : "";
      const nextLab = hash.startsWith("lab-") ? hash.slice(4) : "";
      if (nextScale >= 0) { setScaleIndex(nextScale); setView("scale"); }
      else if (universeNodes.some((item) => item.id === nextNode)) { setRelationNode(nextNode as UniverseNodeId); setView("relations"); }
      else if (nextLab === "day-night" || nextLab === "orbit" || nextLab === "water-cycle") { setExperiment(nextLab); setView("lab"); }
      setReady(true);
    }
    const frame = requestAnimationFrame(restoreLocation);
    window.addEventListener("hashchange", restoreLocation);
    window.addEventListener("popstate", restoreLocation);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", restoreLocation); window.removeEventListener("popstate", restoreLocation); };
  }, []);
  function setLocation(next: View, target: string) { window.history.replaceState(null, "", `#${next}-${target}`); }
  function chooseScale(index: number) { setScaleIndex(index); setLocation("scale", universeScales[index].id); }
  function chooseRelation(id: UniverseNodeId) { setRelationNode(id); setLocation("relations", id); }
  function chooseExperiment(id: UniverseExperiment) { setExperiment(id); setLocation("lab", id); }
  function openView(next: View, scroll = false, targetNode?: UniverseNodeId) {
    setView(next);
    if (targetNode) setRelationNode(targetNode);
    setLocation(next, next === "scale" ? scale.id : next === "relations" ? targetNode ?? relationNode : experiment);
    if (scroll) requestAnimationFrame(() => workspaceRef.current?.scrollIntoView({block:"start", behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"}));
  }
  return <div className={styles.page}>
    <a href="#universe-workspace" className="skip-link">跳到探索内容</a>
    <WorldNavigation placeId="universe" />
    <main className={styles.main}>
      <JourneyCompanion destinationId={destinationId} enabled={ready} />
      <div className={styles.arrivalHeading}><p className={styles.eyebrow}>我的星空观测站</p><h1>我在宇宙里，寻找身边的答案。</h1><p>放大看一片星河，走近看一滴水。选一种方法，开始我的观察。</p></div>
      <div id="universe-workspace" className={styles.workspace} ref={workspaceRef}>
        <nav className={styles.viewNav} aria-label="选择探索方式">{views.map(({id,label,icon:Icon,number})=><button key={id} aria-pressed={view===id} aria-controls="universe-panel" onClick={()=>openView(id)}><span>{number}</span><Icon size={20} /><strong>{label}</strong></button>)}</nav>
        <div id="universe-panel" className={styles.panel}>
          {view === "scale" ? <section aria-labelledby="scale-heading"><div className={styles.sectionIntro}><div><span className={styles.eyebrow}>先看熟悉的，再发现新的</span><h2 id="scale-heading">同一个世界，换个范围看看。</h2></div><p>向更大的范围望去，或走进生命和物质的内部。每一站，都有不同的观察方法。</p></div>
            <div className={styles.scaleStops} role="group" aria-label="选择观察范围">{universeScales.map((item,i)=><button key={item.id} aria-pressed={i===scaleIndex} onClick={()=>chooseScale(i)}><small>{String(i+1).padStart(2,"0")}</small>{item.id === "ecosystem" ? "生态系统" : item.label}</button>)}</div>
            <div className={styles.scaleLayout}><div className={styles.sceneCard}><div className={styles.sceneTop}><span><Compass size={16} />{scale.kicker}</span><span>{scaleIndex+1} / {universeScales.length}</span></div><div className={styles.scene} key={scale.id}><ScaleScene id={scale.id} label={scale.label} /></div>{scale.id === "solar" && <div className={styles.planetOrder}><p>离太阳由近到远，八颗行星是：</p><ol>{["水星", "金星", "地球", "火星", "木星", "土星", "天王星", "海王星"].map((name, index) => <li key={name}><span>{index + 1}</span>{name}</li>)}</ol></div>}<div className={styles.sceneControls}><button disabled={scaleIndex===0} onClick={()=>chooseScale(scaleIndex-1)}><ArrowUp size={17} />看更大的范围</button><button disabled={scaleIndex===universeScales.length-1} onClick={()=>chooseScale(scaleIndex+1)}>看更小的内部<ArrowDown size={17} /></button></div><p className={styles.scaleNote}>{scale.scaleNote}</p></div>
              <div className={styles.scaleInfo} aria-live="polite"><span className={styles.eyebrow}>这一站的小发现</span><h3>{scale.label}</h3><p className={styles.lead}>{scale.description}</p><p>{scale.detail}</p><div className={styles.wonder}><Lightbulb size={20} /><div><strong>想一想，再说给家人听</strong><p>{scale.question}</p></div></div><button className={styles.textButton} onClick={()=>openView("relations", true, scaleToNode[scale.id])}>它还和什么相连？<GitBranch size={18} /></button></div>
            </div><div className={styles.pathNote}><BookOpen size={21} /><p>这是一条帮助理解的观察路线。这里选择植物来观察细胞；水和岩石并不由细胞组成。切换视角是在看事物的组成，不是让物质变身。</p></div>
          </section> : view === "relations" ? <Connections selected={relationNode} onSelect={chooseRelation} /> : <section aria-label="动手做小实验"><div className={styles.sectionIntro}><div><span className={styles.eyebrow}>先猜一猜，再观察变化</span><h2>小小实验室，大大的为什么。</h2></div><p>自己控制时间和步骤。随时暂停，说说你看到了什么、为什么会这样。</p></div><UniverseLab experiment={experiment} onExperimentChange={chooseExperiment} /></section>}
        </div>
      </div>
      {ready ? <DiscoveryStation key={destinationId} destinationId={destinationId} /> : null}
      <JourneyCompanion destinationId={destinationId} enabled={ready} variant="next" />
      <footer className={styles.footer}><p>原创入门探索 · 图像与模拟经过简化，说明见各图下方。点击、播放和做题不会计为已经掌握。</p><details><summary>给家长的内容参考</summary><p>围绕可观察的现象建立联系。这里是一张入门地图，尚未涵盖宇宙中的所有事物。</p><ul>{universeSources.map((source)=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ArrowRight size={13} /></a></li>)}</ul></details></footer>
    </main>
  </div>;
}
