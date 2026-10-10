"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Backpack, Bookmark, Check, Compass, Footprints, Map, Route, Sparkles, Sprout, Tent, X } from "lucide-react";
import { getWorldDestination, getWorldDestinationHref, getWorldPlace, getWorldTrail, worldPlaces, worldQuestions, worldStopHref, worldTrails, type WorldPlaceId } from "@/lib/world-content";
import { readWorldLearningEvidence, type WorldLearningEvidence } from "@/lib/world-progress";
import { useWorldProgress } from "@/lib/use-world-progress";
import { WorldMap } from "./world-map";
import { WorldDiscovery } from "./world-discovery";
import { DiscoveryStation } from "./discovery-recorder";
import { NotebookPreview } from "./notebook-preview";
import styles from "./world-home.module.css";

const activityIntros: Record<WorldPlaceId, string> = {
  math: "草丛里闪着几个小光点。停下来，和数量打个招呼。",
  chinese: "小鹿托风送来一句话。我来读一读，听清朋友想请我做什么。",
  history: "打开抽屉，几张旅行记录散落出来。时间该怎样排队？",
  geography: "山谷里的小屋等着我。先约定从哪里看，再把走过的路讲清楚。",
  english: "港口来了一个新朋友。我想先和对方说声你好。",
  universe: "望远镜旁有一颗小地球。转一转，看看我这里怎样天黑。",
};

export function WorldHome() {
  const world = useWorldProgress();
  const { progress, ready, selectPlace, begin, toggleSaved, leaveTrail } = world;
  const [bagOpen, setBagOpen] = useState(false);
  const [evidence, setEvidence] = useState<WorldLearningEvidence | null>(null);
  const discoveryRef = useRef<HTMLElement>(null);
  const discoveryHeading = useRef<HTMLHeadingElement>(null);
  const place = getWorldPlace(progress.selectedPlaceId) ?? worldPlaces[5];
  const last = getWorldDestination(progress.lastDestinationId);
  const activeTrail = getWorldTrail(progress.activeTrailId);
  const saved = worldQuestions.filter((question) => progress.savedQuestionIds.includes(question.id));
  const savedHere = progress.savedQuestionIds.includes("place:" + place.id);

  useEffect(() => {
    function syncLocation() {
      const hash = window.location.hash.slice(1);
      if (hash === "backpack") setBagOpen(true);
      if (hash.startsWith("place-") && getWorldPlace(hash.slice(6))) selectPlace(hash.slice(6));
    }
    const frame = requestAnimationFrame(syncLocation);
    window.addEventListener("hashchange", syncLocation);
    window.addEventListener("popstate", syncLocation);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", syncLocation); window.removeEventListener("popstate", syncLocation); };
  }, [selectPlace]);

  useEffect(() => {
    const restore = () => setEvidence(readWorldLearningEvidence((key) => localStorage.getItem(key)));
    const frame = requestAnimationFrame(restore);
    window.addEventListener("storage", restore);
    window.addEventListener("focus", restore);
    window.addEventListener("pageshow", restore);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("storage", restore); window.removeEventListener("focus", restore); window.removeEventListener("pageshow", restore); };
  }, []);

  function choose(id: WorldPlaceId) {
    selectPlace(id);
    window.history.replaceState(null, "", "#place-" + id);
    requestAnimationFrame(() => {
      discoveryHeading.current?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width: 900px)").matches) discoveryRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });
  }

  return <div className={styles.page}>
    <a href="#world-map" className="skip-link">走进我的知识世界</a>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}><span><Sprout size={23} /></span><strong>GoGo 学堂<small>我的知识世界</small></strong></Link>
      <nav aria-label="我的探索工具"><a href="#world-map" aria-label="我的地图"><Map size={17} /><span>我的地图</span></a><a href="#backpack" aria-label="我的背包" onClick={() => setBagOpen(true)}><Backpack size={17} /><span>我的背包</span>{saved.length ? <i>{saved.length}</i> : null}</a><Link href="/practice#review" prefetch={false} className={styles.parentLink}>家长陪伴</Link></nav>
    </header>
    <main className={styles.main}>
      <section className={styles.welcome} aria-labelledby="world-title">
        <div><p className={styles.eyebrow}><span />我的好奇心，准备出发</p><h1 id="world-title">今天，世界会告诉我什么？</h1><p className={styles.welcomeText}>走进一片森林，转一转小地球，和一个新朋友说声你好。<br className={styles.desktopBreak} /> 知识就藏在我经过的地方。</p></div>
        <div className={styles.explorerCard}><span><Footprints size={27} /></span><div><small>我正在探索</small><strong>{place.name}</strong><p>可以随时换条小路</p></div></div>
      </section>
      {ready && last ? <div className={styles.resume}><div><Compass size={21} /><span><small>{activeTrail ? "我正在追着这个问题 · " + activeTrail.title : "上次的好奇心还在这里"}</small><strong>{last.title}</strong></span></div><Link href={getWorldDestinationHref(last.id, progress.activeTrailId)} prefetch={false}>接着刚才的探索<ArrowRight size={17} /></Link></div> : null}
      <div id="world-map" className={styles.worldHeading}><h2><Map size={19} />我的世界，我来选路</h2><a href="#curiosity-trails">想让一个问题带路？<ArrowRight size={15} /></a></div>
      <div className={styles.exploreLayout}>
        <WorldMap selected={place.id} onSelect={choose} />
        <section id="world-discovery" className={styles.discovery} ref={discoveryRef} aria-labelledby="place-title" style={{ "--place-color": place.color, "--place-soft": place.soft } as CSSProperties}>
          <div className={styles.placeHeading}><span>{place.symbol}</span><div><p>我的脚步来到这里</p><h2 id="place-title" ref={discoveryHeading} tabIndex={-1}>{place.name}</h2></div></div>
          <p className={styles.arrivalStory}>{activityIntros[place.id]}</p>
          <div className={styles.discoveryActivity} key={place.id}><WorldDiscovery placeId={place.id} /></div>
          <Link className={styles.primary} href={getWorldDestinationHref(place.id === "universe" ? "universe:lab:day-night" : place.destinationId)} onClick={leaveTrail} prefetch={false}>沿着发现，继续走一走<ArrowRight size={17} /></Link>
          <div className={styles.pocketQuestion}><p><small>我还想知道</small>{place.question}</p><button disabled={!ready} aria-pressed={savedHere} aria-label={(savedHere ? "从背包取出问题：" : "把问题放进背包：") + place.question} onClick={() => toggleSaved("place:" + place.id)}><Bookmark size={17} fill={savedHere ? "currentColor" : "none"} /><span>{savedHere ? "已放进背包" : "先放进背包"}</span></button></div>
          <DiscoveryStation key={`station:${place.id}`} placeId={place.id} destinationId={place.destinationId} />
          <a className={styles.backToMap} href="#world-map"><Map size={15} />我想再看看地图</a>
        </section>
      </div>
      <section id="curiosity-trails" className={styles.trails} aria-labelledby="trails-title">
        <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>让一个问题，带我去更远的地方</p><h2 id="trails-title">原来，不同的知识是相连的。</h2></div><p>每到一站，观察、试一试。<br />也可以随时自由探索。</p></div>
        <div className={styles.trailGrid}>{worldTrails.map((trail, index) => {
          const isActive = trail.id === progress.activeTrailId;
          const currentStop = isActive ? trail.stops.find((stop) => stop.destinationId === progress.lastTrailDestinationId) : undefined;
          const start = currentStop ?? trail.stops[0];
          const visited = trail.stops.filter((stop) => progress.visitedDestinationIds.includes(stop.destinationId)).length;
          return <article className={styles.trailCard} key={trail.id} data-active={isActive}>
            <div className={styles.trailTop}><span>小旅行 0{index + 1}</span><Route size={22} /></div><h3>{trail.title}</h3><p className={styles.trailQuestion}>{trail.question}</p>
            <div className={styles.trailPlaces}>{[...new Set(trail.stops.map((stop) => getWorldDestination(stop.destinationId)?.placeId))].map((id, i) => <span key={id}>{i ? <ArrowRight size={12} /> : null}{getWorldPlace(id)?.name}</span>)}</div>
            <details className={styles.trailDetails}><summary>看看沿途会发现什么<span> {trail.stops.length} 站</span></summary><ol>{trail.stops.map((stop, i) => <li key={stop.id}><span>{i + 1}</span><Link href={worldStopHref(trail.id, stop.id)} prefetch={false} onClick={() => begin(trail.id)}>{stop.question}</Link></li>)}</ol><p>{trail.description}</p></details>
            <div className={styles.trailFooter}>{isActive ? <small><Footprints size={13} />这条路已到访 {visited} / {trail.stops.length} 站</small> : <small>带着好奇心就能出发</small>}<Link href={worldStopHref(trail.id, start.id)} prefetch={false} onClick={() => begin(trail.id)}>{isActive ? "接着我的小旅行" : "我想跟着这个问题走"}<ArrowRight size={16} /></Link></div>
          </article>;
        })}</div>
      </section>
      <section id="backpack" className={styles.backpack} aria-labelledby="backpack-title">
        <div className={styles.bagHeader}><span><Backpack size={29} /></span><div><p className={styles.eyebrow}>把好奇心带在身边</p><h2 id="backpack-title">我的探索背包</h2><p>留住想问的问题，也回头看看自己的发现。</p></div><button aria-expanded={bagOpen} aria-controls="backpack-content" onClick={() => setBagOpen(!bagOpen)}>{bagOpen ? "收起背包" : "打开背包"}{bagOpen ? <X size={16} /> : <ArrowRight size={16} />}</button></div>
        {bagOpen ? <div id="backpack-content" className={styles.bagContent}>
          <div className={styles.bagColumn}><h3><Bookmark size={18} />我还想弄明白</h3>{saved.length ? <ul>{saved.map((question) => <li key={question.id}><Link href={getWorldDestinationHref(question.destinationId)} onClick={leaveTrail} prefetch={false}>{question.question}<ArrowRight size={15} /></Link><button onClick={() => toggleSaved(question.id)} aria-label={"从背包取出问题：" + question.question}><X size={15} /></button></li>)}</ul> : <p className={styles.emptyBag}>地图里遇到感兴趣的问题，点“先放进背包”。下次，我还可以带着它出发。</p>}</div>
          <div className={styles.bagColumn}><h3><Sprout size={18} />我试着用过的知识</h3>{evidence === null ? <p className={styles.emptyBag}>正在找回我的发现…</p> : evidence.completedLessons.length ? <><p className={styles.evidenceNote}>{evidence.completedLessons.length} 课做过两道理解练习。回到生活里，还能继续试。</p><ul>{evidence.completedLessons.slice(-5).map((lesson) => <li key={lesson.destinationId}><Link href={getWorldDestinationHref(lesson.destinationId)} prefetch={false}><Check size={15} />{lesson.title}<ArrowRight size={15} /></Link></li>)}</ul></> : <p className={styles.emptyBag}>在探索中做完理解练习，就能在这里找回。走过一个地方，也可以只留下一个新问题。</p>}
            {evidence?.reviewLessons.length ? <details className={styles.revisit}><summary>有 {evidence.reviewLessons.length} 个发现，我想再试试</summary>{evidence.reviewLessons.map((lesson) => <Link key={lesson.destinationId} href={getWorldDestinationHref(lesson.destinationId)} prefetch={false}>{lesson.title}<ArrowRight size={14} /></Link>)}</details> : null}
          </div>
        </div> : null}
        {bagOpen ? <NotebookPreview /> : <div className={styles.notebookEntry}><Link href="/notebook" prefetch={false}>翻开我的发现手册<ArrowRight size={16} /></Link></div>}
        <div className={styles.bagTools}><Link href="/practice" prefetch={false}><Tent size={18} /><span>练习营地<small>把发现再用一用</small></span><ArrowRight size={15} /></Link><Link href="/practice#mistakes" prefetch={false}><Sparkles size={18} /><span>再想一想<small>回到我的错题</small></span><ArrowRight size={15} /></Link><Link href="/practice#review" prefetch={false}><Footprints size={18} /><span>我的学习小记<small>回顾练习与收获</small></span><ArrowRight size={15} /></Link><Link href="/knowledge" prefetch={false}><Route size={18} /><span>知识路线册<small>沿学科一步步走</small></span><ArrowRight size={15} /></Link></div>
      </section>
      <footer className={styles.footer}><Sprout size={18} /><p>今天不用走遍整个世界。能把一个发现说清楚，就带着它回家。</p><small>{world.storageError || evidence?.storageError ? "这个浏览器暂时无法保存或读取部分记录，本次仍可以继续探索。" : "我的位置、问题和学习记录留在当前浏览器，换设备暂不自动同步。"} 到访记录与理解练习分别保存。</small></footer>
    </main>
  </div>;
}
