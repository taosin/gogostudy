"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowRight, BookOpen, Check, Compass, Orbit } from "lucide-react";
import { createLearningEngine, learningStorageKey, type LearningProgress } from "@/lib/learning-progress";
import { learningSubjects } from "@/lib/learning-subjects";
import type { SubjectCurriculum } from "@/lib/learning-types";
import { WorldNavigation } from "@/components/world/journey-companion";
import { getWorldPlace } from "@/lib/world-content";
import styles from "./knowledge-hub.module.css";

export type SubjectOverview = Pick<SubjectCurriculum, "id" | "title" | "stages"> & {
  lessons: { id: string; title: string; prerequisites: string[]; checks: { id: string }[] }[];
};

export function KnowledgeHub({ subjects }: { subjects: SubjectOverview[] }) {
  const router = useRouter();
  const engines = useMemo(() => subjects.map((subject) => createLearningEngine(subject.lessons)), [subjects]);
  const [progress, setProgress] = useState<LearningProgress[] | null>(null);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    function restore() {
      try { setProgress(subjects.map((subject, index) => engines[index].parseLearningProgress(localStorage.getItem(learningStorageKey(subject.id))))); setStorageError(false); }
      catch { setStorageError(true); }
    }
    function openLegacyLesson() {
      // Existing /knowledge#count links still lead to the original math concept.
      const id = window.location.hash.slice(1);
      if (subjects.find((subject) => subject.id === "math")?.lessons.some((lesson) => lesson.id === id)) {
        router.replace("/knowledge/math#" + id);
        return true;
      }
      return false;
    }
    function refresh() { if (!openLegacyLesson()) restore(); }
    const frame = requestAnimationFrame(refresh);
    function onStorage(event: StorageEvent) {
      if (event.key === null || subjects.some((subject) => learningStorageKey(subject.id) === event.key)) restore();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("hashchange", openLegacyLesson);
    window.addEventListener("popstate", openLegacyLesson);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      cancelAnimationFrame(frame); window.removeEventListener("storage", onStorage);
      window.removeEventListener("hashchange", openLegacyLesson);
      window.removeEventListener("popstate", openLegacyLesson);
      window.removeEventListener("pageshow", refresh); window.removeEventListener("focus", refresh);
    };
  }, [engines, router, subjects]);
  const total = subjects.reduce((sum, subject) => sum + subject.lessons.length, 0);
  const completed = progress?.reduce((sum, value) => sum + value.completedLessonIds.length, 0) ?? 0;
  return <div className={styles.page}>
    <a href="#subject-library" className="skip-link">跳到学科选择</a>
    <WorldNavigation label="知识路线册" />
    <main className={styles.main}>
      <section className={styles.guideIntro} aria-labelledby="knowledge-title">
        <div><p className={styles.eyebrow}><BookOpen size={17} />放在我的背包里，随时翻一翻</p><h1 id="knowledge-title">我的知识路线册</h1><p>想把一个领域弄得更明白，就沿着这里的基础一步步走。<br />也可以随时回到世界，跟着一个问题去旅行。</p></div>
        <Link href="/" className={styles.guideReturn}><Compass size={20} /><span>回到知识世界<small>去地图上自由探索</small></span><ArrowRight size={17} /></Link>
      </section>
      <section id="subject-library" className={styles.library} aria-labelledby="library-title">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>把沿途的发现，整理成自己的本领</p><h2 id="library-title">我想细看哪一条路线？</h2></div><div className={styles.total}><Check size={17} />已完成 {completed} / {total} 课</div></div>
        <div className={styles.cards}>{subjects.map((curriculum, index) => {
          const subject = learningSubjects.find((item) => item.id === curriculum.id)!;
          const state = progress?.[index];
          const count = state?.completedLessonIds.length ?? 0;
          const active = curriculum.lessons.find((lesson) => lesson.id === state?.activeLessonId);
          const touched = !!state && (count > 0 || state.reviewLessonIds.length > 0 || state.activeLessonId !== curriculum.lessons[0].id || state.lessonSteps[state.activeLessonId] !== "observe");
          const destination = "/knowledge/" + curriculum.id + (touched && active ? "#" + active.id : "");
          return <article key={subject.id} className={styles.card} style={{ "--subject": subject.color, "--soft": subject.soft } as CSSProperties}>
            <div className={styles.cardHeader}><span className={styles.symbol}>{subject.symbol}</span><div><h3>{subject.title}</h3><p>{getWorldPlace(subject.id)?.name} · {subject.caption}</p></div><span className={styles.lessonCount}>{curriculum.lessons.length} 课</span></div>
            <p className={styles.cardDescription}>{subject.description}</p>
            <div className={styles.trail}>{subject.trail.map((word, i) => <span key={word}>{i ? <ArrowRight size={14} /> : null}<strong>{word}</strong></span>)}</div>
            <p className={styles.question}><Compass size={17} />{subject.question}</p>
            <details className={styles.stages}><summary>看看这科怎样一步步学</summary><ol>{curriculum.stages.map((stage, i) => <li key={stage.id}><span>{i + 1}</span><div><strong>{stage.title}</strong><small>{stage.subtitle}</small></div></li>)}</ol></details>
            <div className={styles.cardFooter}><div className={styles.cardProgress}><span>{count} / {curriculum.lessons.length} 课已完成</span><span>{state?.reviewLessonIds.length ? state.reviewLessonIds.length + " 课再想一想" : "一次学明白一点"}</span></div><progress aria-label={subject.title + "课程完成进度"} max={curriculum.lessons.length} value={count} /><Link href={destination} prefetch={false} className={styles.start}>{touched ? "接着学" : "从基础开始"}<ArrowRight size={17} /></Link>{touched && active ? <p className={styles.resume}>上次学到：{active.title}</p> : null}</div>
          </article>;
        })}</div>
      </section>
      <Link href="/knowledge/universe" prefetch={false} className={styles.referenceLink}><Orbit size={26} /><div><h2>星空观测站 · 宇宙与万物</h2><p>还可以用范围图、关系图和小模拟，观察万物怎样相连。</p></div><ArrowRight size={18} /></Link>
      <footer className={styles.footer}><p>{storageError ? "浏览器暂时无法读取学习记录，仍可进入课程学习。" : "五科记录分别保存在当前浏览器，换设备暂不自动同步。"}</p><p>这是按认知顺序编排的首批启蒙课程，可跨年级学习，不等同于完整教材。</p></footer>
    </main>
  </div>;
}
