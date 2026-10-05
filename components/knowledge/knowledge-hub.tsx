"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Check, Compass, GitBranch, Orbit, Sprout } from "lucide-react";
import { createLearningEngine, learningStorageKey, type LearningProgress } from "@/lib/learning-progress";
import { learningSubjects } from "@/lib/learning-subjects";
import type { SubjectCurriculum } from "@/lib/learning-types";
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
    <header className={styles.header}><Link href="/" className={styles.brand}><span><Sprout size={24} /></span>GoGo 学堂</Link><span className={styles.headerLabel}>我的知识成长地图</span><Link href="/" className={styles.back}><ArrowLeft size={16} />学习首页</Link></header>
    <main className={styles.main}>
      <section className={styles.hero} aria-labelledby="knowledge-title">
        <div><p className={styles.eyebrow}><span />每一个发现，都是新的起点</p><h1 id="knowledge-title">从小小的好奇，<br />认识大大的世界<span>。</span></h1><p className={styles.description}>数一数、读一读、问一句为什么。<br />从熟悉的小事出发，把新的知识一点点连起来。</p><a href="#subject-library" className={styles.primary}>选一科，开始探索<ArrowRight size={18} /></a><p className={styles.heroNote}>5 个学科 · {total} 节核心概念课 · 按自己的节奏学</p></div>
        <div className={styles.constellation} aria-label="数学、语文、历史、地理、英语共同帮助我们认识世界">
          <svg viewBox="0 0 460 330" aria-hidden="true"><path d="M224 169 110 68M224 169 351 65M224 169 392 210M224 169 270 283M224 169 75 249" fill="none" stroke="#bdcbb5" strokeWidth="2" strokeDasharray="5 7" /><circle cx="224" cy="169" r="64" fill="#e6eddb" /><circle cx="224" cy="169" r="47" fill="#f7faf1" /></svg>
          <div className={styles.center}><Sprout size={32} /><strong>我的好奇心</strong></div>
          {learningSubjects.map((subject) => <Link key={subject.id} href={"/knowledge/" + subject.id} prefetch={false} className={styles.orbit} data-subject={subject.id} style={{ "--subject": subject.color, "--soft": subject.soft } as CSSProperties}><span>{subject.symbol}</span><strong>{subject.title}</strong></Link>)}
        </div>
      </section>
      <Link href="/knowledge/universe" prefetch={false} className={styles.universeEntry}>
        <span className={styles.universeSymbol}><Orbit size={34} /></span><div><small>好奇心探索专题 · 动画 / 关系图 / 小模拟</small><h2>宇宙与万物，原来这样相连。</h2><p>从地球走向星河，再看看一片叶子、一滴水里面的世界。</p></div><span className={styles.universeAction}>去探索<ArrowRight size={19} /></span>
      </Link>
      <section id="subject-library" className={styles.library} aria-labelledby="library-title">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>五扇门，通向相连的世界</p><h2 id="library-title">今天，从哪里出发？</h2></div><div className={styles.total}><Check size={17} />已完成 {completed} / {total} 课</div></div>
        <div className={styles.cards}>{subjects.map((curriculum, index) => {
          const subject = learningSubjects.find((item) => item.id === curriculum.id)!;
          const state = progress?.[index];
          const count = state?.completedLessonIds.length ?? 0;
          const active = curriculum.lessons.find((lesson) => lesson.id === state?.activeLessonId);
          const touched = !!state && (count > 0 || state.reviewLessonIds.length > 0 || state.activeLessonId !== curriculum.lessons[0].id || state.lessonSteps[state.activeLessonId] !== "observe");
          const destination = "/knowledge/" + curriculum.id + (touched && active ? "#" + active.id : "");
          return <article key={subject.id} className={styles.card} style={{ "--subject": subject.color, "--soft": subject.soft } as CSSProperties}>
            <div className={styles.cardHeader}><span className={styles.symbol}>{subject.symbol}</span><div><h3>{subject.title}</h3><p>{subject.caption}</p></div><span className={styles.lessonCount}>{curriculum.lessons.length} 课</span></div>
            <p className={styles.cardDescription}>{subject.description}</p>
            <div className={styles.trail}>{subject.trail.map((word, i) => <span key={word}>{i ? <ArrowRight size={14} /> : null}<strong>{word}</strong></span>)}</div>
            <p className={styles.question}><Compass size={17} />{subject.question}</p>
            <details className={styles.stages}><summary>看看这科怎样一步步学</summary><ol>{curriculum.stages.map((stage, i) => <li key={stage.id}><span>{i + 1}</span><div><strong>{stage.title}</strong><small>{stage.subtitle}</small></div></li>)}</ol></details>
            <div className={styles.cardFooter}><div className={styles.cardProgress}><span>{count} / {curriculum.lessons.length} 课已完成</span><span>{state?.reviewLessonIds.length ? state.reviewLessonIds.length + " 课再想一想" : "一次学明白一点"}</span></div><progress aria-label={subject.title + "课程完成进度"} max={curriculum.lessons.length} value={count} /><Link href={destination} prefetch={false} className={styles.start}>{touched ? "接着学" : "从基础开始"}<ArrowRight size={17} /></Link>{touched && active ? <p className={styles.resume}>上次学到：{active.title}</p> : null}</div>
          </article>;
        })}</div>
      </section>
      <section className={styles.method} aria-labelledby="method-title"><div><GitBranch size={25} /><h2 id="method-title">让知识，慢慢长成自己的本领</h2><p>每一课，都能看见它从哪里来、接下来能帮我们做什么。</p></div><ol><li><span>01</span><strong>先观察，再动手</strong><p>从生活小故事开始，用卡片、教具和地图发现道理。</p></li><li><span>02</span><strong>弄明白，再换个例子</strong><p>用两道不同情境的小题试一试，也可以回头补上基础。</p></li><li><span>03</span><strong>连起来，再说给家人听</strong><p>回顾前后的联系，把自己的发现讲清楚，留住下次要想的问题。</p></li></ol></section>
      <footer className={styles.footer}><p>{storageError ? "浏览器暂时无法读取学习记录，仍可进入课程学习。" : "五科记录分别保存在当前浏览器，换设备暂不自动同步。"}</p><p>这是按认知顺序编排的首批启蒙课程，可跨年级学习，不等同于完整教材。</p></footer>
    </main>
  </div>;
}
