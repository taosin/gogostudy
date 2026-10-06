"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Film, RotateCcw } from "lucide-react";
import { getLearningVideo, type LearningVideoId } from "@/lib/learning-media";
import { claimLearningPlayback, LEARNING_PLAYBACK_EVENT } from "@/lib/learning-playback";
import { ReadAloud } from "./read-aloud";
import styles from "./learning-video.module.css";

export function LearningVideo({ id }: { id: LearningVideoId }) {
  return <VideoCard key={id} id={id} />;
}

function VideoCard({ id }: { id: LearningVideoId }) {
  const media = getLearningVideo(id);
  const ownerId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !open) return;
    const pause = (reason: string) => {
      if (!video.paused) { video.pause(); setStatus(reason); }
    };
    const onHidden = () => { if (document.hidden) pause("离开了这个页面，短片已暂停。"); };
    const onOtherPlayback = (event: Event) => {
      if ((event as CustomEvent<{ id: string }>).detail?.id !== ownerId) pause("先听听或看看新的内容，短片已暂停。");
    };
    const onPageHide = () => pause("短片已暂停。");
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && !document.fullscreenElement && !(video as HTMLVideoElement & { webkitDisplayingFullscreen?: boolean }).webkitDisplayingFullscreen) pause("画面移出了视野，短片已暂停。");
    }, { threshold: 0.05 });
    observer.observe(video);
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener(LEARNING_PLAYBACK_EVENT, onOtherPlayback);
    return () => {
      video.pause();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener(LEARNING_PLAYBACK_EVENT, onOtherPlayback);
    };
  }, [open, ownerId]);

  if (!media) return null;
  return <details className={styles.card} open={open} onToggle={(event) => { setOpen(event.currentTarget.open); if (!event.currentTarget.open) setTranscriptOpen(false); }}>
    <summary><Film size={19} /><span>看一段小动画<small>{media.title} · {media.durationSeconds} 秒</small></span><ChevronDown className={styles.chevron} size={17} /></summary>
    {open ? <div className={styles.content}>
      <p className={styles.description}>{media.description}</p>
      <video
        ref={videoRef}
        aria-label={media.title + "，带中文字幕的静音动画"}
        aria-describedby={ownerId + "-note"}
        controls playsInline preload="none" width="960" height="540"
        poster={media.poster} src={media.src}
        onPlay={() => { claimLearningPlayback(ownerId); setStatus("正在播放。可以随时暂停，仔细看看。"); }}
        onPause={() => { if (!videoRef.current?.ended) setStatus("短片已暂停。点播放按钮，可以接着看。"); }}
        onEnded={() => setStatus("看完了。带着这个发现，回到教具试一试吧。")} 
        onWaiting={() => setStatus("短片正在加载。也可以先看下面的文字讲解。")} 
        onPlaying={() => setStatus("正在播放。可以随时暂停，仔细看看。")} 
        onError={() => { setError(true); setStatus("这次短片没有加载好。可以重试，也可以看下面的文字讲解。"); }}
      >
        <track kind="captions" src={media.captions} srcLang="zh" label="中文字幕" />
        这个浏览器暂时无法播放短片，请阅读下面的完整讲解。
      </video>
      <p className={styles.meta}>静音动画 · 画面内有中文字幕 · 看不清时可以全屏，或展开文字讲解</p>
      {status ? <p className={styles.status} role="status">{status}</p> : null}
      {error ? <button className={styles.retry} type="button" onClick={() => { setError(false); setStatus("再试一次，请点播放按钮。"); videoRef.current?.load(); }}><RotateCcw size={16} />重新加载短片</button> : null}
      <details className={styles.transcript} open={transcriptOpen} onToggle={(event) => setTranscriptOpen(event.currentTarget.open)}><summary>我想慢慢看文字讲解</summary>{transcriptOpen ? <><ol>{media.transcript.map((line) => <li key={line}>{line}</li>)}</ol><ReadAloud text={media.transcript.join("\n")} label="听听这段讲解" compact /></> : null}</details>
      <p className={styles.note} id={ownerId + "-note"}>{media.note}</p>
    </div> : null}
  </details>;
}
