"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import { ArrowRight, BookOpen, Compass, Pencil, Sprout, Trash2, X } from "lucide-react";
import { getWorldDestination, getWorldDestinationHref, getWorldPlace, worldPlaces } from "@/lib/world-content";
import { NOTEBOOK_KIND_LABELS, type NotebookDraft, type NotebookEntry } from "@/lib/world-notebook";
import { useWorldNotebook } from "@/lib/use-world-notebook";
import { DiscoveryRecorder } from "./discovery-recorder";
import { WorldNavigation } from "./journey-companion";
import styles from "./discovery-notebook.module.css";

type RemoveEntry = ReturnType<typeof useWorldNotebook>["remove"];

function notebookDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Shanghai" }).format(new Date(value));
}

function NotebookCard({ destinationId, entry, draft, remove, onRemoved, onSaved, onDiscarded }: {
  destinationId: string;
  entry?: NotebookEntry;
  draft?: NotebookDraft;
  remove: RemoveEntry;
  onRemoved: () => void;
  onSaved: (warning?: string) => void;
  onDiscarded: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [deleteRevision, setDeleteRevision] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const editButton = useRef<HTMLButtonElement>(null);
  const deleteButton = useRef<HTMLButtonElement>(null);
  const destination = getWorldDestination(destinationId);
  const place = getWorldPlace(destination?.placeId);
  if (!destination || !place) return null;
  const kind = entry?.kind ?? draft?.kind ?? "discovery";

  function removeCard() {
    if (deleteRevision === null) return;
    const result = remove(destinationId, deleteRevision);
    if (!result.ok) {
      setDeleteError(result.error || "这次没有删掉，想法卡还在。请再试一次。");
      return;
    }
    setDeleteRevision(null);
    setDeleteError("");
    onRemoved();
  }

  return <article className={styles.card} style={{ "--note-color": place.color, "--note-soft": place.soft } as CSSProperties}>
    <div className={styles.cardTop}><span className={styles.place}><span aria-hidden="true">{place.symbol}</span>{place.name}</span><span className={styles.kind}>{NOTEBOOK_KIND_LABELS[kind]}</span></div>
    <h3>{destination.title}</h3>
    {entry ? <p className={styles.noteText}>{entry.text}</p> : <p className={styles.draftText}>{draft?.text || "还没写完也没关系，下次可以接着想。"}</p>}
    {entry ? <p className={styles.dates}><span>记于 <time dateTime={entry.createdAt}>{notebookDate(entry.createdAt)}</time></span>{entry.updatedAt !== entry.createdAt ? <span>后来又补充了 · <time dateTime={entry.updatedAt}>{notebookDate(entry.updatedAt)}</time></span> : null}</p> : null}
    {draft ? <p className={styles.draftNotice}><Pencil size={14} />{entry ? "这里还有没保存的几句话，可以接着写。" : "这是一份还没保存的草稿。"}</p> : null}
    <div className={styles.cardActions}>
      <Link href={getWorldDestinationHref(destinationId, entry?.trailId ?? draft?.trailId)} prefetch={false}>回到这里继续试<ArrowRight size={15} /></Link>
      <button ref={editButton} type="button" aria-expanded={editing} aria-controls={`notebook-editor-${destinationId}`} onClick={() => { setEditing(!editing); setDeleteRevision(null); setDeleteError(""); }}><Pencil size={15} />{editing ? "收起这张卡" : draft ? "接着写" : "改一改"}</button>
      {entry ? <button ref={deleteButton} type="button" className={styles.deleteButton} aria-expanded={deleteRevision !== null} aria-controls={`notebook-delete-${destinationId}`} aria-label={`删除想法卡：${destination.title}`} onClick={() => { setDeleteRevision(entry.revision); setDeleteError(""); }}><Trash2 size={15} /><span>删除</span></button> : null}
    </div>
    {deleteRevision !== null ? <div id={`notebook-delete-${destinationId}`} className={styles.confirmDelete} role="group" aria-label={`确认删除：${destination.title}`}>
      <p>要删掉这张想法卡吗？删掉后，不能找回这段已保存的文字。</p>
      {draft ? <p>没写完的草稿仍会留着，可以接着写。</p> : null}
      <div><button type="button" onClick={() => { setDeleteRevision(null); setDeleteError(""); deleteButton.current?.focus(); }}>留着这张卡</button><button type="button" className={styles.confirmButton} onClick={removeCard}>确认删除</button></div>
      {deleteError ? <p role="alert">{deleteError}</p> : null}
    </div> : null}
    {editing ? <div id={`notebook-editor-${destinationId}`} className={styles.editor}>
      <DiscoveryRecorder destinationId={destinationId} defaultOpen onSaved={onSaved} onDiscarded={onDiscarded} />
      <button className={styles.closeEditor} type="button" onClick={() => { setEditing(false); editButton.current?.focus(); }}><X size={15} />收起，待会儿再写</button>
    </div> : null}
  </article>;
}

export function DiscoveryNotebook() {
  const notebook = useWorldNotebook();
  const [placeFilter, setPlaceFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [status, setStatus] = useState("");
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const hasFilter = placeFilter !== "all" || kindFilter !== "all";
  const entries = notebook.entries.filter((entry) => {
    const destination = getWorldDestination(entry.destinationId);
    return destination && (placeFilter === "all" || destination.placeId === placeFilter) && (kindFilter === "all" || entry.kind === kindFilter);
  });
  const entryIds = new Set(notebook.entries.map((entry) => entry.destinationId));
  const drafts = Object.entries(notebook.drafts).filter(([id]) => {
    const destination = getWorldDestination(id);
    return !entryIds.has(id) && destination && (placeFilter === "all" || destination.placeId === placeFilter);
  });

  function resetFilters() { setPlaceFilter("all"); setKindFilter("all"); setStatus(""); }
  function onRemoved() {
    setStatus("这张想法卡已经删除。");
    requestAnimationFrame(() => resultsHeading.current?.focus({ preventScroll: true }));
  }
  function onDiscarded() { setStatus("草稿已放下，已保存的想法卡仍会保留。"); requestAnimationFrame(() => resultsHeading.current?.focus({ preventScroll: true })); }
  function onSaved(warning?: string) { setStatus(warning ?? (hasFilter ? "想法收进手册了。也可以点“看看全部”找回它。" : "想法收进手册了。以后可以回来补充。")); requestAnimationFrame(() => resultsHeading.current?.focus({ preventScroll: true })); }

  return <div className={styles.page}>
    <a className="skip-link" href="#notebook-content">翻开我的发现手册</a>
    <WorldNavigation label="我的发现手册" />
    <main className={styles.main}>
      <section className={styles.welcome} aria-labelledby="notebook-title">
        <div className={styles.bookMark} aria-hidden="true"><BookOpen size={35} /><Sprout size={18} /></div>
        <div><p className={styles.eyebrow}>我的话，也值得留下来</p><h1 id="notebook-title">我的发现手册</h1><p>记下一个发现，带上一个新问题。<br />想法变了，也可以回来改一改。</p></div>
        <Link className={styles.exploreLink} href="/"><Compass size={17} />去世界里找灵感<ArrowRight size={16} /></Link>
      </section>
      <p className={styles.introduction}>不用写很多。一句话也可以，先说给家人听也可以。这里收藏的是我的想法，课堂练习会另外记录。</p>
      <section id="notebook-content" className={styles.content} aria-labelledby="notebook-results-title">
        <div className={styles.resultsHeader}><div><p className={styles.eyebrow}>慢慢翻一翻，再出发</p><h2 id="notebook-results-title" ref={resultsHeading} tabIndex={-1}>我留下的想法</h2></div><span aria-live="polite">{notebook.ready ? `${entries.length} 张想法卡` : "正在翻开手册…"}</span></div>
        <div className={styles.filters}>
          <label><span>在哪个地方</span><select value={placeFilter} disabled={!notebook.ready} onChange={(event) => { setPlaceFilter(event.target.value); setStatus(""); }}><option value="all">全部地方</option>{worldPlaces.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select></label>
          <label><span>想法卡的类型</span><select value={kindFilter} disabled={!notebook.ready} onChange={(event) => { setKindFilter(event.target.value); setStatus(""); }}><option value="all">全部想法</option>{Object.entries(NOTEBOOK_KIND_LABELS).map(([kind, label]) => <option key={kind} value={kind}>{label}</option>)}</select></label>
          {hasFilter ? <button type="button" className={styles.resetFilters} onClick={resetFilters}><X size={15} />看看全部</button> : null}
        </div>
        {notebook.storageError ? <p className={styles.storageError} role="status">这个浏览器暂时不能保存或读取部分记录。还没保存的文字，请先留在页面上或复制到别处。</p> : null}
        {status ? <p className={styles.status} role="status">{status}</p> : null}
        {!notebook.ready ? <p className={styles.loading} role="status">正在找回自己的发现和没写完的几句话…</p> : <>
          {drafts.length ? <section className={styles.drafts} aria-labelledby="notebook-drafts-title"><h3 id="notebook-drafts-title"><Pencil size={18} />还有几句话，等我接着写</h3><p className={styles.introduction}>这个地方没写完的草稿，都留在这里。写好后再按想法分类。</p><div className={styles.cards}>{drafts.map(([id, draft]) => <NotebookCard key={id} destinationId={id} draft={draft} remove={notebook.remove} onRemoved={onRemoved} onSaved={onSaved} onDiscarded={onDiscarded} />)}</div></section> : null}
          {entries.length ? <div className={styles.cards}>{entries.map((entry) => <NotebookCard key={entry.destinationId} destinationId={entry.destinationId} entry={entry} draft={notebook.drafts[entry.destinationId]} remove={notebook.remove} onRemoved={onRemoved} onSaved={onSaved} onDiscarded={onDiscarded} />)}</div> : <div className={styles.empty}>
            <BookOpen size={35} aria-hidden="true" /><h3>{hasFilter ? "这一页暂时没有想法卡" : drafts.length ? "等写好了，再把想法留下" : "第一张想法卡，会写下什么呢？"}</h3>
            <p>{hasFilter ? "可以看看其他地方，或换一种想法。" : "去课堂里动手试一试，或做一个生活小挑战。想记录时，点“留下我的想法”。"}</p>
            {hasFilter ? <button type="button" onClick={resetFilters}>看看全部想法<ArrowRight size={16} /></button> : <Link href="/">带着好奇心出发<ArrowRight size={16} /></Link>}
          </div>}
        </>}
      </section>
      <footer className={styles.footer}><Sprout size={19} /><p>不着急写出正确答案。发现和问题，都能带我走向下一步。</p><small>想法卡保存在当前浏览器，草稿只留在当前标签页。换设备暂不自动同步。</small></footer>
    </main>
  </div>;
}
