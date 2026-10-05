"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Backpack, Bookmark, ChevronDown, Compass, Map, Route, Sprout } from "lucide-react";
import { getWorldDestination, getWorldDestinationHref, getWorldPlace, getWorldQuestion, getWorldTrail, worldTrails, type WorldPlaceId } from "@/lib/world-content";
import { useWorldProgress } from "@/lib/use-world-progress";
import styles from "./journey-companion.module.css";

export function WorldNavigation({ placeId, label }: { placeId?: WorldPlaceId; label?: string }) {
  const place = getWorldPlace(placeId);
  return <header className={styles.header}>
    <Link href="/" className={styles.brand}><span><Sprout size={23} /></span>GoGo 学堂</Link>
    <span className={styles.placeName}>{label ?? place?.name}</span>
    <nav aria-label="知识世界导航"><Link href="/"><Map size={16} />回到世界</Link><Link href="/#backpack"><Backpack size={16} />我的背包</Link><Link href="/practice">练习营地</Link></nav>
  </header>;
}

// Native same-page links let the browser deliver hash changes and restore deep-linked views.
// Cross-page routes retain Next navigation. Every target comes from the closed destination registry.
function TrailLink({ destinationId, currentDestinationId, trailId, onBegin, className, current, children }: {
  destinationId: string; currentDestinationId: string; trailId: string; onBegin: (id: string) => void;
  className?: string; current?: boolean; children: ReactNode;
}) {
  const href = getWorldDestinationHref(destinationId, trailId);
  const source = getWorldDestination(currentDestinationId)?.href.split("#")[0];
  const target = getWorldDestination(destinationId)?.href.split("#")[0];
  const props = { href, className, "aria-current": current ? "step" as const : undefined, onClick: () => onBegin(trailId) };
  return source === target ? <a {...props}>{children}</a> : <Link {...props} prefetch={false}>{children}</Link>;
}

/** Travel records describe where a child looked; only the lesson engine records learning checks. */
export function JourneyCompanion({ destinationId, enabled = true, variant = "arrival" }: { destinationId: string; enabled?: boolean; variant?: "arrival" | "next" }) {
  const { progress, ready, storageError, begin, visit, toggleSaved, leaveTrail } = useWorldProgress();
  const destination = getWorldDestination(destinationId);
  const place = getWorldPlace(destination?.placeId);
  const trail = getWorldTrail(progress.activeTrailId);
  const stopIndex = trail?.stops.findIndex((stop) => stop.destinationId === destinationId) ?? -1;
  const stop = stopIndex >= 0 ? trail?.stops[stopIndex] : undefined;
  const question = getWorldQuestion(stop && trail ? `trail:${trail.id}:${stop.id}` : `destination:${destinationId}`);
  const saved = !!question && progress.savedQuestionIds.includes(question.id);
  const nextStop = stop && trail ? trail.stops[stopIndex + 1] : undefined;
  const nextDestination = getWorldDestination(nextStop?.destinationId);
  const nextPlace = getWorldPlace(nextDestination?.placeId);
  const rejoinStop = trail?.stops.find((item) => item.destinationId === progress.lastTrailDestinationId) ?? trail?.stops[0];

  useEffect(() => {
    if (!ready || !enabled || variant !== "arrival" || !destination) return;
    // Only recognized route/stop pairs can restore a route from a shared link.
    const query = new URLSearchParams(window.location.search);
    const linkedTrail = getWorldTrail(query.get("trail"));
    const linkedStop = linkedTrail?.stops.find((item) => item.id === query.get("stop") && item.destinationId === destination.id);
    if (linkedTrail && linkedStop) begin(linkedTrail.id);
    visit(destination.id);
  }, [begin, destination, enabled, ready, variant, visit]);

  function wander() {
    leaveTrail();
    const url = new URL(window.location.href);
    url.searchParams.delete("trail"); url.searchParams.delete("stop");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }

  if (!destination || !place) return null;
  if (variant === "next") {
    const suggestedTrail = worldTrails.find((item) => item.stops.some((station) => getWorldDestination(station.destinationId)?.placeId === destination.placeId));
    const suggestion = suggestedTrail?.stops[0];
    return <section className={styles.next} aria-label="接下来去哪里">
      <span className={styles.eyebrow}><Compass size={16} />接下来，我想去看看</span>
      {nextStop && trail && nextDestination ? <>
        <h3>{nextStop.question}</h3><p>{nextStop.connection}</p>
        <TrailLink className={styles.primary} destinationId={nextStop.destinationId} currentDestinationId={destinationId} trailId={trail.id} onBegin={begin}>去{nextPlace?.name}<ArrowRight size={17} /></TrailLink>
        <p className={styles.destinationNote}>下一站：{nextDestination.title} · 可以自由探索，练习按实际作答记录。</p>
      </> : stop && trail ? <>
        <h3>走到这里，我能把发现连起来吗？</h3><p>{trail.question}</p><p>试着选两个地方，说说它们怎样联系。也可以带着新的问题，再出发。</p>
        <Link className={styles.primary} href="/">回到世界，选下一段旅程<ArrowRight size={17} /></Link>
      </> : trail && rejoinStop ? <>
        <h3>逛完这里，还可以接着找答案。</h3><p>我带着的问题：{trail.question}</p>
        <TrailLink className={styles.primary} destinationId={rejoinStop.destinationId} currentDestinationId={destinationId} trailId={trail.id} onBegin={begin}>回到「{trail.title}」<ArrowRight size={17} /></TrailLink>
      </> : suggestedTrail && suggestion ? <>
        <h3>带着好奇心，去别处找线索。</h3><p>{suggestedTrail.question}</p>
        <TrailLink className={styles.primary} destinationId={suggestion.destinationId} currentDestinationId={destinationId} trailId={suggestedTrail.id} onBegin={begin}>走走「{suggestedTrail.title}」<ArrowRight size={17} /></TrailLink>
      </> : <><h3>我的下一个问题，会藏在哪里？</h3><Link className={styles.primary} href="/">回世界，自己选一处<ArrowRight size={17} /></Link></>}
      <div className={styles.nextActions}><Link href="/" onClick={wander}><Map size={16} />我想自由逛逛</Link><Link href="/#backpack"><Backpack size={16} />看看我的背包</Link></div>
    </section>;
  }
  return <section className={styles.companion} aria-label="我在知识世界的位置">
    <div className={styles.arrivalTop}><span className={styles.location}><Compass size={17} />我在{place.name}</span><span className={styles.looking}>本次在看：{destination.title}</span></div>
    {question ? <div className={styles.questionRow}><p><span>我想弄明白</span><strong>{question.question.replace(/^我想弄明白：/, "")}</strong></p><button type="button" disabled={!ready || !enabled} aria-pressed={saved} onClick={() => toggleSaved(question.id)}><Bookmark size={17} fill={saved ? "currentColor" : "none"} />{saved ? "已放进背包" : "把问题放进背包"}</button></div> : null}
    {trail && stop ? <div className={styles.trail}>
      <div className={styles.trailHeading}><span><Route size={16} />{trail.title}</span><small>本次在看第 {stopIndex + 1} 站</small><button type="button" onClick={wander}>改成自由探索</button></div>
      <details className={styles.trailDetails}><summary>看看沿途 {trail.stops.length} 站<ChevronDown size={16} /></summary><ol>{trail.stops.map((item, index) => {
        const itemDestination = getWorldDestination(item.destinationId);
        return <li key={item.id}><TrailLink destinationId={item.destinationId} currentDestinationId={destinationId} trailId={trail.id} onBegin={begin} current={item.id === stop.id}><span>{index + 1}</span>{getWorldPlace(itemDestination?.placeId)?.name}<small>{itemDestination?.title}</small></TrailLink></li>;
      })}</ol></details>
    </div> : trail && rejoinStop ? <div className={styles.detour}><span>我正在自由看看。还带着问题：{trail.question}</span><TrailLink destinationId={rejoinStop.destinationId} currentDestinationId={destinationId} trailId={trail.id} onBegin={begin}><ArrowLeft size={14} />接着走这条路线</TrailLink><button type="button" onClick={wander}>放下路线，自由探索</button></div> : <p className={styles.freeNote}>跟着好奇心走。随时回世界，也可以把想继续想的问题放进背包。</p>}
    {storageError ? <p className={styles.storageNote} role="status">浏览器暂时无法保存这次行踪，刷新或离开页面后可能丢失。现在仍可继续探索。</p> : null}
  </section>;
}
