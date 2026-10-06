"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Pause, Play, Square, Volume2 } from "lucide-react";
import { claimLearningPlayback, createLearningSpeechPlayer, LEARNING_PLAYBACK_EVENT, type LearningSpeechLanguage, type LearningSpeechSnapshot } from "@/lib/learning-playback";
import styles from "./read-aloud.module.css";

type ReadAloudProps = {
  text: string;
  lang?: LearningSpeechLanguage;
  label?: string;
  compact?: boolean;
};

export function ReadAloud({ text, lang = "zh-CN", label = "听一听", compact = false }: ReadAloudProps) {
  return <Reader key={lang + text} text={text} lang={lang} label={label} compact={compact} />;
}

function Reader({ text, lang, label, compact }: Required<ReadAloudProps>) {
  const id = useId();
  const [snapshot, setSnapshot] = useState<LearningSpeechSnapshot>({ state: "idle", message: "" });
  const [rate, setRate] = useState(1);
  const [hasListened, setHasListened] = useState(false);
  const player = useRef<ReturnType<typeof createLearningSpeechPlayer> | null>(null);
  const active = snapshot.state !== "idle";
  const paused = snapshot.state === "paused";

  useEffect(() => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    const synthesis = window.speechSynthesis;
    const controller = createLearningSpeechPlayer({
      synthesis,
      createUtterance: (value) => new SpeechSynthesisUtterance(value),
      claim: () => claimLearningPlayback(id),
      onChange: setSnapshot,
    });
    player.current = controller;
    const onClaim = (event: Event) => {
      const otherId = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (typeof otherId === "string" && otherId !== id) controller.stop("已切换到新的内容，朗读已停止。");
    };
    const onHidden = () => { if (document.hidden) controller.stop("已停止朗读。回来后可以再听一次。"); };
    const onLeave = () => controller.stop();
    // Some browsers only populate their voice list after this first request. A later click
    // reads the current list again, so voiceschanged never starts audio without a gesture.
    const onVoices = () => { try { synthesis.getVoices(); } catch { /* The play action supplies a readable fallback. */ } };
    onVoices();
    synthesis.addEventListener("voiceschanged", onVoices);
    window.addEventListener(LEARNING_PLAYBACK_EVENT, onClaim);
    window.addEventListener("pagehide", onLeave);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      synthesis.removeEventListener("voiceschanged", onVoices);
      window.removeEventListener(LEARNING_PLAYBACK_EVENT, onClaim);
      window.removeEventListener("pagehide", onLeave);
      document.removeEventListener("visibilitychange", onHidden);
      controller.dispose();
      player.current = null;
    };
  }, [id]);

  const start = () => {
    setHasListened(true);
    if (!player.current) {
      setSnapshot({ state: "idle", message: "这个浏览器暂时不能朗读。可以继续看文字，或请家人陪读。" });
      return;
    }
    player.current.play(text, lang, rate);
  };

  return <div className={`${styles.reader} ${compact ? styles.compact : ""}`}>
    <div className={styles.controls}>
      <button type="button" className={styles.play} aria-label={active ? (paused ? "继续朗读" : "暂停朗读") + "：" + label : label} onClick={() => {
        if (paused) player.current?.resume();
        else if (active) player.current?.pause();
        else start();
      }}>
        {active ? paused ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" /> : <Volume2 size={17} aria-hidden="true" />}
        {active ? paused ? "继续听" : "暂停" : label}
      </button>
      {active ? <button type="button" aria-label={"停止朗读：" + label} onClick={() => player.current?.stop()}><Square size={14} aria-hidden="true" />停止</button> : null}
      {!compact || hasListened ? <label className={styles.speed}>
        <span>语速</span>
        <select value={rate} aria-label={"朗读语速：" + label} onChange={(event) => {
          const nextRate = Number(event.target.value);
          setRate(nextRate);
          player.current?.stop("语速换好了。点一下，从头再听。");
          if (snapshot.state === "playing") player.current?.play(text, lang, nextRate);
        }}>
          <option value={1}>正常</option>
          <option value={0.78}>慢一点</option>
        </select>
      </label> : null}
    </div>
    <p id={id + "-status"} className={styles.status} role="status" aria-live="polite">{snapshot.message}</p>
    {!compact ? <p className={styles.note}>设备声音陪你读，文字随时可以看。换语速会从头读；跟读不录音，也不评分。</p> : null}
  </div>;
}
