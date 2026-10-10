"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { useWorldNotebook } from "@/lib/use-world-notebook";
import { getWorldDestination } from "@/lib/world-content";
import styles from "./notebook-preview.module.css";

export function NotebookPreview() {
  const { entries, drafts, ready, storageError } = useWorldNotebook();
  const draftCount = Object.keys(drafts).length;
  return <div className={styles.preview}>
    <div className={styles.heading}><BookOpen size={21} /><div><h3>我的发现手册</h3><p>{!ready ? "正在找回我写下的话…" : draftCount ? `还有 ${draftCount} 份草稿，等我接着写。` : "用自己的话，留下探索中的发现和问题。"}</p></div><Link href="/notebook" prefetch={false}>翻开手册<ArrowRight size={16} /></Link></div>
    {entries.length ? <ul>{entries.slice(0, 2).map((entry) => <li key={entry.destinationId}><strong>{getWorldDestination(entry.destinationId)?.title}</strong><p>{entry.text}</p></li>)}</ul> : null}
    {storageError ? <p className={styles.warning}>部分记录暂时无法保存或读取，请打开手册查看。</p> : null}
  </div>;
}
