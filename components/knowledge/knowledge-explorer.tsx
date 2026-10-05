"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Lightbulb, RotateCcw, Sparkles } from "lucide-react";
import { geometryNodes, geometryStages, type GeometryStageId } from "@/lib/geometry-graph";
import { emptyGeometryProgress, GEOMETRY_STORAGE_KEY, parseGeometryProgress, recordGeometryAnswer, selectGeometryNode, type GeometryProgress } from "@/lib/geometry-progress";
import { WorldNavigation } from "@/components/world/journey-companion";
import { GeometryPlayground } from "./geometry-playground";
import styles from "./knowledge-explorer.module.css";

function ShapeMark({ stage, className }: { stage: GeometryStageId; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      {stage === "point" ? <><circle cx="40" cy="40" r="27" stroke="currentColor" strokeDasharray="3 6" opacity=".35" /><circle cx="40" cy="40" r="9" fill="currentColor" /><path d="M40 7v9M40 64v9M7 40h9M64 40h9" stroke="currentColor" opacity=".3" /></> : null}
      {stage === "line" ? <><path d="M14 58 66 22" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /><circle cx="14" cy="58" r="6" fill="currentColor" /><circle cx="66" cy="22" r="6" fill="currentColor" /><path d="M14 69h52" stroke="currentColor" strokeDasharray="3 5" opacity=".3" /></> : null}
      {stage === "plane" ? <><rect x="17" y="17" width="46" height="46" rx="3" fill="currentColor" fillOpacity=".16" stroke="currentColor" strokeWidth="3" /><path d="M17 40h46M40 17v46" stroke="currentColor" opacity=".35" /><circle cx="17" cy="17" r="4" fill="currentColor" /></> : null}
      {stage === "solid" ? <><path d="m40 9 27 16v31L40 72 13 56V25Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="2.5" /><path d="m13 25 27 16 27-16M40 41v31" stroke="currentColor" strokeWidth="2.5" /><path d="m40 9 27 16-27 16-27-16Z" fill="currentColor" fillOpacity=".22" /></> : null}
    </svg>
  );
}

const nodeById = new Map(geometryNodes.map((node) => [node.id, node]));

export function KnowledgeExplorer() {
  const [progress, setProgress] = useState(emptyGeometryProgress);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const lessonRef = useRef<HTMLHeadingElement>(null);
  const firstAnswerRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const unsavedProgressRef = useRef(false);
  const node = nodeById.get(progress.activeNodeId) ?? geometryNodes[0];
  const stage = geometryStages.find((item) => item.id === node.stageId)!;
  const completed = progress.completedNodeIds.length;
  const nextNode = geometryNodes.find((item) => !progress.completedNodeIds.includes(item.id) && item.id !== node.id);
  const related = geometryNodes.filter((item) => item.prerequisites.includes(node.id));
  const correct = answer === node.question.answer;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      let restored = emptyGeometryProgress();
      try {
        restored = parseGeometryProgress(localStorage.getItem(GEOMETRY_STORAGE_KEY));
      } catch {
        setStorageError(true);
      }
      const hash = window.location.hash.slice(1);
      setProgress(nodeById.has(hash) ? selectGeometryNode(restored, hash) : restored);
      setReady(true);
    });
    const sync = (event: StorageEvent) => {
      if (event.key !== GEOMETRY_STORAGE_KEY && event.key !== null) return;
      if (unsavedProgressRef.current) return;
      const restored = parseGeometryProgress(event.newValue);
      setProgress((current) => selectGeometryNode(restored, current.activeNodeId));
    };
    window.addEventListener("storage", sync);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function save(update: (latest: GeometryProgress) => GeometryProgress) {
    let latest = progress;
    try {
      if (!unsavedProgressRef.current) latest = parseGeometryProgress(localStorage.getItem(GEOMETRY_STORAGE_KEY));
    } catch {
      // Keep this tab usable when the browser blocks local storage.
    }
    const next = update(latest);
    setProgress(next);
    try {
      localStorage.setItem(GEOMETRY_STORAGE_KEY, JSON.stringify(next));
      unsavedProgressRef.current = false;
      setStorageError(false);
    } catch {
      unsavedProgressRef.current = true;
      setStorageError(true);
    }
  }

  function choose(id: string, scroll = true) {
    if (!ready || !nodeById.has(id)) return;
    save((latest) => selectGeometryNode(latest, id));
    setAnswer(null);
    setChecked(false);
    window.history.replaceState(null, "", `#${id}`);
    if (scroll) requestAnimationFrame(() => {
      lessonRef.current?.focus({ preventScroll: true });
      lessonRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });
  }

  function checkAnswer() {
    if (answer === null || checked || !ready) return;
    save((latest) => recordGeometryAnswer(latest, node.id, correct));
    setChecked(true);
    requestAnimationFrame(() => feedbackRef.current?.focus({ preventScroll: true }));
  }

  return (
    <div className={styles.page}>
      <a className="skip-link" href="#knowledge-main">跳到知识图谱</a>
      <WorldNavigation placeId="math" />
      <main id="knowledge-main" className={styles.main}>
        <section className={styles.hero} aria-labelledby="knowledge-title">
          <div>
            <p className={styles.eyebrow}><span /> 数学探索 · 空间与图形</p>
            <h1 id="knowledge-title">从一个点，<br />发现整个世界<span>。</span></h1>
            <p className={styles.intro}>从一个位置，到一条路径，再到平面与立体。<br />跟着知识地图，动手发现它们的秘密。</p>
            <button className={styles.primary} disabled={!ready} onClick={() => choose(progress.activeNodeId)}>
              {completed ? "继续我的探索" : "从认识点开始"}<ArrowRight size={18} />
            </button>
            <span className={styles.heroHint}>4 站旅程 · 12 个发现 · 按自己的节奏来</span>
          </div>
          <div className={styles.heroArt} aria-hidden="true">
            <div className={styles.orbit} />
            <div className={`${styles.artShape} ${styles.artPoint}`}><ShapeMark stage="point" /><span>一个位置</span></div>
            <div className={`${styles.artShape} ${styles.artLine}`}><ShapeMark stage="line" /><span>一条路径</span></div>
            <div className={`${styles.artShape} ${styles.artPlane}`}><ShapeMark stage="plane" /><span>一个图形</span></div>
            <div className={`${styles.artShape} ${styles.artSolid}`}><ShapeMark stage="solid" /><span>一片空间</span></div>
            <span className={styles.artSpark}>✦</span>
            <span className={styles.artCaption}>身边的数学，原来这么有趣</span>
          </div>
        </section>

        <section className={styles.mapSection} aria-labelledby="map-title">
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>MY LEARNING MAP</p><h2 id="map-title">我的知识地图</h2></div>
            <button className={styles.mapToggle} aria-expanded={showMap} aria-controls="geometry-map" onClick={() => setShowMap(!showMap)}>{showMap ? "收起地图" : "展开地图"}<ChevronDown size={16} style={{ transform: showMap ? "rotate(180deg)" : undefined }} /></button>
          </div>
          <div className={styles.mapMeta}>
            <p>按箭头往前走，也可以点开感兴趣的知识点。</p>
            <span>{ready ? completed : 0} / 12 个小挑战已完成</span>
          </div>
          {showMap ? <div id="geometry-map" className={styles.graph}>
            {geometryStages.map((item, stageIndex) => {
              const nodes = geometryNodes.filter((n) => n.stageId === item.id);
              const count = nodes.filter((n) => progress.completedNodeIds.includes(n.id)).length;
              return <div key={item.id} className={styles.stageColumn} style={{ "--stage-color": item.color } as CSSProperties}>
                <div className={styles.stageTop}>
                  <ShapeMark stage={item.id} className={styles.stageIcon} />
                  <div><span className={styles.stageNumber}>第 {stageIndex + 1} 站</span><h3>{item.label}</h3><p>{item.subtitle}</p></div>
                  <span className={styles.stageCount}>{count}/3</span>
                </div>
                <ol className={styles.nodeList}>
                  {nodes.map((itemNode) => {
                    const done = progress.completedNodeIds.includes(itemNode.id);
                    const review = progress.reviewNodeIds.includes(itemNode.id);
                    const active = itemNode.id === node.id;
                    return <li key={itemNode.id}>
                      <button disabled={!ready} aria-current={active ? "step" : undefined} className={`${styles.node} ${active ? styles.activeNode : ""}`} onClick={() => choose(itemNode.id)}>
                        <span className={`${styles.nodeDot} ${done ? styles.doneDot : ""}`}>{done ? <Check size={12} /> : review ? <RotateCcw size={11} /> : null}</span>
                        <span>{itemNode.title}<small>{review ? "再想一想" : done ? "小挑战已完成" : active ? "正在探索" : "点开看一看"}</small></span>
                        {active ? <ArrowRight size={16} /> : null}
                      </button>
                    </li>;
                  })}
                </ol>
              </div>;
            })}
          </div> : null}
          <div className={styles.mapFooter}>
            <span><span className={styles.legendDot} /> 正在探索 <span className={styles.legendCheck}><Check size={11} /></span> 小挑战已完成</span>
            {progress.reviewNodeIds.length ? <button onClick={() => choose(progress.reviewNodeIds[0])}><RotateCcw size={14} />{progress.reviewNodeIds.length} 个知识点再想一想<ArrowRight size={14} /></button> : <span>慢慢探索，每一个发现都算数。</span>}
          </div>
        </section>

        <section className={styles.lesson} aria-labelledby="lesson-title" style={{ "--stage-color": stage.color } as CSSProperties}>
          <div className={styles.lessonIntro}>
            <div className={styles.lessonLabel}><span>第 {geometryStages.indexOf(stage) + 1} 站 · {stage.label}</span><span>知识点 {geometryNodes.indexOf(node) + 1} / 12</span></div>
            <h2 id="lesson-title" ref={lessonRef} tabIndex={-1}>{node.title}</h2>
            <p className={styles.summary}>{node.summary}</p>
            <div className={styles.example}><Lightbulb size={20} /><p><strong>生活里找一找</strong>{node.example}</p></div>
            <div className={styles.playground}>
              <div className={styles.smallHeading}><Sparkles size={17} /><h3>动手发现</h3><span>试一试，就知道</span></div>
              <GeometryPlayground key={node.id} stage={node.stageId} nodeId={node.id} />
            </div>
            <div className={styles.takeaway}><span>记住这一点</span><p>{node.takeaway}</p></div>
          </div>
          <div className={styles.challengeColumn}>
            <form className={styles.challenge} onSubmit={(event) => { event.preventDefault(); checkAnswer(); }}>
              <p className={styles.eyebrow}>想一想 · 选一选</p>
              <h3>来一个小挑战</h3>
              <fieldset disabled={!ready || checked}>
                <legend>{node.question.prompt}</legend>
                <div className={styles.options}>
                  {node.question.options.map((option, index) => <label key={`${node.id}-${index}`} className={`${styles.option} ${answer === index ? styles.selectedOption : ""}`}>
                    <input ref={index === 0 ? firstAnswerRef : undefined} type="radio" name={`answer-${node.id}`} value={index} checked={answer === index} onChange={() => setAnswer(index)} />
                    <span className={styles.optionLetter}>{String.fromCharCode(65 + index)}</span><span>{option}</span>
                  </label>)}
                </div>
              </fieldset>
              {!checked ? <button className={styles.primary} disabled={!ready || answer === null}>我选好了<ArrowRight size={17} /></button> : null}
              {checked ? <div ref={feedbackRef} tabIndex={-1} className={`${styles.feedback} ${correct ? styles.correctFeedback : ""}`} role="status">
                <strong>{correct ? "这个发现，你找到了！" : "先别急，我们一起再看看。"}</strong>
                <p>{node.question.explanation}</p>
                {correct ? <button type="button" className={styles.primary} onClick={() => { if (nextNode) choose(nextNode.id); else { setShowMap(true); document.getElementById("map-title")?.scrollIntoView({ block: "start" }); } }}>{nextNode ? "探索下一个知识点" : "看看我的完整地图"}<ArrowRight size={16} /></button> : <button type="button" className={styles.retry} onClick={() => { setAnswer(null); setChecked(false); requestAnimationFrame(() => firstAnswerRef.current?.focus()); }}><RotateCcw size={16} />我再想一次</button>}
              </div> : null}
            </form>
            <div className={styles.connections}>
              <h3>知识是这样连起来的</h3>
              {node.prerequisites.length ? <div><span>先认识</span>{node.prerequisites.map((id) => <button key={id} onClick={() => choose(id)}><ArrowLeft size={14} />{nodeById.get(id)?.title}</button>)}</div> : <p>这里是旅程的起点。从一个小小的位置标记开始吧。</p>}
              {related.length ? <div><span>接着发现</span>{related.map((item) => <button key={item.id} onClick={() => choose(item.id)}>{item.title}<ArrowRight size={14} /></button>)}</div> : <p>已经走到“体”了！回到身边找一找，哪些物品藏着点、线和面？</p>}
            </div>
            {completed === geometryNodes.length ? <div className={styles.celebration}><Sparkles size={23} /><strong>你的第一张空间地图，点亮啦！</strong><p>找一个纸盒，把今天的发现讲给家人听吧。</p></div> : null}
          </div>
        </section>
        <footer className={styles.footer}>
          <p>{storageError ? "当前浏览器无法保存进度。你仍然可以探索，关闭页面后记录可能丢失。" : "探索进度保存在当前浏览器，换设备后不会自动同步。"}</p>
          <p>点线面体 · 小学空间启蒙 ｜ 可在家长陪伴下跨年级探索</p>
        </footer>
      </main>
    </div>
  );
}
