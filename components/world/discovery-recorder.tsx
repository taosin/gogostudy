"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { ArrowRight, BookOpen, ChevronDown, PencilLine, Save } from "lucide-react";
import { getWorldDestination, getWorldPlace, getWorldTrail, type WorldPlaceId } from "@/lib/world-content";
import { useWorldNotebook } from "@/lib/use-world-notebook";
import { useWorldProgress } from "@/lib/use-world-progress";
import type { NotebookDraft } from "@/lib/world-notebook";
import { getWorldChallenge } from "@/lib/world-challenges";
import { FieldChallenge } from "./field-challenge";
import styles from "./discovery-recorder.module.css";

const kinds = [
  { id: "discovery", title: "我的发现", prompt: "我看见……我试了……结果……" },
  { id: "question", title: "还想问", prompt: "为什么……？如果……会怎样？" },
  { id: "retry", title: "想再试", prompt: "下次，我想换……试试。" },
] as const;

type RecorderProps = { destinationId: string; defaultOpen?: boolean; expanded?: boolean; onExpandedChange?: (open: boolean) => void; onSaved?: (warning?: string) => void; onDiscarded?: () => void };

export function DiscoveryRecorder({ destinationId, defaultOpen = false, expanded, onExpandedChange, onSaved, onDiscarded }: RecorderProps) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = expanded ?? localOpen;
  if (!getWorldDestination(destinationId)) return null;
  return <details className={styles.recorder} open={open} onToggle={(event) => {
    setLocalOpen(event.currentTarget.open);
    onExpandedChange?.(event.currentTarget.open);
  }}>
    <summary><PencilLine size={19} /><span>留下我的想法<small>一句发现，也可以是一个新问题</small></span><ChevronDown size={17} /></summary>
    {open ? <RecorderForm key={destinationId} destinationId={destinationId} onSaved={onSaved} onDiscarded={onDiscarded} /> : null}
  </details>;
}

function RecorderForm({ destinationId, onSaved, onDiscarded }: Pick<RecorderProps, "destinationId" | "onSaved" | "onDiscarded">) {
  const notebook = useWorldNotebook();
  const { progress } = useWorldProgress();
  const [message, setMessage] = useState("");
  const [discarding, setDiscarding] = useState(false);
  const fieldId = useId();
  const destination = getWorldDestination(destinationId)!;
  const entry = notebook.entries.find((item) => item.destinationId === destinationId);
  const trail = getWorldTrail(progress.activeTrailId);
  const currentTrailId = trail?.stops.some((stop) => stop.destinationId === destinationId) ? trail.id : null;
  const draft: NotebookDraft = notebook.drafts[destinationId] ?? {
    kind: entry?.kind ?? "discovery", text: entry?.text ?? "", baseRevision: entry?.revision ?? null,
    trailId: entry?.trailId ?? currentTrailId,
  };
  const dirty = !!notebook.drafts[destinationId];
  const conflict = dirty && draft.baseRevision !== (entry?.revision ?? null);
  const selected = kinds.find((kind) => kind.id === draft.kind) ?? kinds[0];
  function change(patch: Partial<NotebookDraft>) {
    const result = notebook.saveDraft(destinationId, { ...draft, ...patch });
    setMessage(result.ok ? "" : result.error ?? "草稿暂时只留在这里，离开前可以复制文字。");
    setDiscarding(false);
  }
  function save() {
    const result = notebook.save(destinationId, draft);
    setMessage(result.error ?? (result.ok && result.persisted ? "想法收进手册了。以后可以回来补充。" : "这次没有保存好，文字还在这里，可以再试一次。"));
    if (result.ok && result.persisted) onSaved?.(result.error);
  }
  if (!notebook.ready) return <p className={styles.loading} role="status">正在打开我的想法卡…</p>;
  return <div className={styles.form}>
    <p className={styles.location}>{getWorldPlace(destination.placeId)?.name} · {destination.title}</p>
    <p className={styles.intro}>也可以先说给家人听，想记时再写。</p>
    {entry ? <p className={styles.note}>这里已有一张想法卡，保存会更新它。</p> : null}
    <fieldset className={styles.kinds}><legend>这次，我想留下</legend>{kinds.map((kind) => <label key={kind.id}>
      <input type="radio" name={fieldId + "-kind"} checked={draft.kind === kind.id} onChange={() => change({ kind: kind.id })} />{kind.title}
    </label>)}</fieldset>
    <label className={styles.label} htmlFor={fieldId}>用自己的话记一句</label>
    <textarea id={fieldId} value={draft.text} maxLength={300} rows={4} placeholder={selected.prompt} aria-describedby={fieldId + "-hint"} onChange={(event) => change({ text: event.target.value })} />
    <div className={styles.inputMeta} id={fieldId + "-hint"}><span>{dirty ? notebook.storageError ? "文字还在这里，离开前请确认已经保存。" : "草稿留在当前标签页，稍后可接着写。" : "每个知识点保留一张当前想法卡。"}</span><span>{draft.text.length} / 300</span></div>
    <details className={styles.help}><summary>不知道怎么开头？</summary><p>我看见了什么？我改变了什么？还有哪一点没想明白？写自己的观察就好。</p></details>
    {conflict ? <div className={styles.warning} role="status"><strong>这张卡在别处更新过了。</strong><p>你的草稿还在。先看看已保存的想法，再决定怎样补充。</p>{entry ? <blockquote>{entry.text}</blockquote> : <p>原卡片已被移走。</p>}<button type="button" onClick={() => change({ baseRevision: entry?.revision ?? null })}>我已看过，用这份草稿更新</button></div> : null}
    {notebook.storageError ? <p className={styles.warning} role="status">浏览器暂时无法保存部分内容。先保留或复制文字，恢复后再试。</p> : null}
    <div className={styles.actions}><button type="button" className={styles.save} disabled={!draft.text.trim() || conflict || (!dirty && !!entry)} onClick={save}><Save size={17} />{entry ? "更新我的想法" : "收进发现手册"}</button><Link href="/notebook" prefetch={false}><BookOpen size={16} />翻开我的手册</Link></div>
    {dirty ? <div className={styles.discard}>{discarding ? <><span>放下这份草稿？已保存的卡片会保留。</span><button type="button" onClick={() => { const result = notebook.discardDraft(destinationId); setDiscarding(false); if (result.ok) onDiscarded?.(); setMessage(result.ok ? "草稿已放下。" : result.error ?? "暂时无法放下草稿。"); }}>确认放下草稿</button><button type="button" onClick={() => setDiscarding(false)}>继续写</button></> : <button type="button" onClick={() => setDiscarding(true)}>放下这份草稿</button>}</div> : null}
    {message ? <p className={styles.feedback} role="status">{message}</p> : null}
    <p className={styles.note}>这是我的观察和想法，不会变成练习分数。手册保存在当前浏览器。</p>
  </div>;
}

/** Connect a small real-world activity with the child's own words, without grading either. */
export function DiscoveryStation({ destinationId, placeId }: { destinationId: string; placeId?: WorldPlaceId }) {
  const [expanded, setExpanded] = useState(false);
  const recorderRef = useRef<HTMLDivElement>(null);
  const recorderDestinationId = placeId ? getWorldChallenge({ placeId })?.destinationId ?? destinationId : destinationId;
  function reflect() {
    setExpanded(true);
    requestAnimationFrame(() => {
      recorderRef.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
      recorderRef.current?.querySelector("summary")?.focus();
    });
  }
  return <div className={styles.station}>
    <FieldChallenge {...(placeId ? { placeId } : { destinationId })} onReflect={reflect} />
    <div ref={recorderRef}><DiscoveryRecorder destinationId={recorderDestinationId} expanded={expanded} onExpandedChange={setExpanded} /></div>
    <Link className={styles.handbookLink} href="/notebook" prefetch={false}>回看我留下的想法<ArrowRight size={15} /></Link>
  </div>;
}
