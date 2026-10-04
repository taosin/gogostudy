"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, Compass, Flag, GitBranch, Hand, Lightbulb, RotateCcw, Shapes, Sprout } from "lucide-react";
import { mathDomains, mathLessons, mathStages, type MathLesson } from "@/lib/math-curriculum";
import { emptyLearningProgress, getLessonReadiness, getRecommendedLesson, LEARNING_STORAGE_KEY, learningSteps, parseLearningProgress, recordLearningCheck, selectLesson, setLessonStep, type LearningProgress, type LearningStep } from "@/lib/math-learning-progress";
import { MathActivity } from "./math-activity";
import styles from "./math-journey.module.css";

const lessonById = new Map(mathLessons.map((lesson) => [lesson.id, lesson]));
const stepLabels: Record<LearningStep, string> = { observe: "看一看", explore: "动手试", understand: "想明白", check: "用一用", connect: "连起来" };
const stepIcons = { observe: Compass, explore: Hand, understand: Lightbulb, check: Flag, connect: GitBranch };

function GrowingIdeas() {
  return <div className={styles.ideaTree} aria-label="知识联系示例：数一数到分与合，再到加减、乘除和分数">
    <svg viewBox="0 0 450 280" fill="none" aria-hidden="true">
      <path d="M74 209C121 208 105 133 179 139M179 139C240 139 218 67 290 67M179 139C236 139 230 209 289 209M290 67C369 67 339 139 401 139M289 209C367 209 343 139 401 139" stroke="#bccdbb" strokeWidth="2" strokeDasharray="5 6" />
      <circle cx="179" cy="139" r="64" fill="#edf1e4" />
      <circle cx="401" cy="139" r="30" fill="#eff0fa" />
      <path d="m394 144 7-18 7 18M397 138h9" stroke="#8d89b1" strokeWidth="2" />
    </svg>
    <div className={`${styles.idea} ${styles.ideaSeed}`}><span className={styles.seedDots}>● ● ●</span><strong>数一数</strong><small>一个一个认识数量</small></div>
    <div className={`${styles.idea} ${styles.ideaSplit}`}><span>5 = 2 + 3</span><strong>分与合</strong><small>看见数量的关系</small></div>
    <div className={`${styles.idea} ${styles.ideaAdd}`}><span>＋　－</span><strong>加减与乘除</strong></div>
    <div className={`${styles.idea} ${styles.ideaPart}`}><span>½</span><strong>部分与整体</strong></div>
    <span className={styles.treeCaption}>新知识，从已经理解的地方长出来</span>
  </div>;
}

function LessonCheck({ lesson, progress, onAnswer, onFinish, onRevisit }: {
  lesson: MathLesson;
  progress: LearningProgress;
  onAnswer: (checkId: string, correct: boolean) => void;
  onFinish: () => void;
  onRevisit: () => void;
}) {
  const [index, setIndex] = useState(() => Math.max(0, lesson.checks.findIndex((item) => !progress.passedCheckIds[lesson.id]?.includes(item.id))));
  const [answer, setAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const firstOptionRef = useRef<HTMLInputElement>(null);
  const questionRef = useRef<HTMLLegendElement>(null);
  const question = lesson.checks[index];
  const correct = answer === question.answer;
  const passed = progress.passedCheckIds[lesson.id] ?? [];
  const remainingIndex = lesson.checks.findIndex((item) => !passed.includes(item.id));

  function submit() {
    if (answer === null || submitted) return;
    onAnswer(question.id, correct);
    setSubmitted(true);
    requestAnimationFrame(() => feedbackRef.current?.focus({ preventScroll: true }));
  }

  function next() {
    if (remainingIndex === -1) { onFinish(); return; }
    setIndex(remainingIndex);
    setAnswer(null);
    setSubmitted(false);
    requestAnimationFrame(() => questionRef.current?.focus());
  }

  return <form className={styles.checkForm} onSubmit={(event) => { event.preventDefault(); submit(); }}>
    <div className={styles.checkProgress}><span>{index === 0 ? "检查理解" : "换个情境试试"}</span><span>已通过 {passed.length} / {lesson.checks.length} 题</span></div>
    <fieldset disabled={submitted}>
      <legend ref={questionRef} tabIndex={-1}>{question.prompt}</legend>
      <div className={styles.answers}>{question.options.map((option, optionIndex) => <label key={`${question.id}-${optionIndex}`} className={`${styles.answer} ${answer === optionIndex ? styles.selectedAnswer : ""}`}>
        <input ref={optionIndex === 0 ? firstOptionRef : undefined} type="radio" name={question.id} checked={answer === optionIndex} onChange={() => setAnswer(optionIndex)} />
        <span className={styles.optionLetter}>{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>
      </label>)}</div>
    </fieldset>
    {!submitted ? <button className={styles.primary} disabled={answer === null}>说说我的发现<ArrowRight size={17} /></button> : <div ref={feedbackRef} tabIndex={-1} role="status" className={`${styles.feedback} ${correct ? styles.correct : ""}`}>
      <strong>{correct ? "你把这个道理用上了！" : "我们再找一找原因。"}</strong>
      <p>{question.explanation}</p>
      <div className={styles.feedbackActions}>{correct ? <button type="button" className={styles.primary} onClick={next}>{remainingIndex === -1 ? "看看这课连着什么" : "换个情境试试"}<ArrowRight size={17} /></button> : <>
        <button type="button" className={styles.secondary} onClick={onRevisit}><Hand size={17} />回到教具再试试</button>
        <button type="button" className={styles.primary} onClick={() => { setAnswer(null); setSubmitted(false); requestAnimationFrame(() => firstOptionRef.current?.focus()); }}>我再想一次</button>
      </>}</div>
    </div>}
  </form>;
}

export function MathJourney() {
  const [progress, setProgress] = useState(emptyLearningProgress);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [domainFilter, setDomainFilter] = useState("all");
  const unsavedRef = useRef(false);
  const progressRef = useRef(progress);
  const lessonHeadingRef = useRef<HTMLHeadingElement>(null);
  const mapHeadingRef = useRef<HTMLHeadingElement>(null);
  const lesson = lessonById.get(progress.activeLessonId) ?? mathLessons[0];
  const step = progress.lessonSteps[lesson.id] ?? "observe";
  const domain = mathDomains.find((item) => item.id === lesson.domainId)!;
  const stage = mathStages.find((item) => item.id === lesson.stageId)!;
  const recommended = getRecommendedLesson(progress);
  const readiness = getLessonReadiness(progress, lesson.id);
  const completed = progress.completedLessonIds.includes(lesson.id);
  const descendants = mathLessons.filter((item) => item.prerequisites.includes(lesson.id));
  const stepIndex = learningSteps.indexOf(step);
  const StepIcon = stepIcons[step];

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      let restored = emptyLearningProgress();
      try { restored = parseLearningProgress(localStorage.getItem(LEARNING_STORAGE_KEY)); }
      catch { setStorageError(true); }
      const id = window.location.hash.slice(1);
      const next = lessonById.has(id) ? selectLesson(restored, id) : restored;
      progressRef.current = next;
      setProgress(next);
      setReady(true);
    });
    const sync = (event: StorageEvent) => {
      if ((event.key !== LEARNING_STORAGE_KEY && event.key !== null) || unsavedRef.current) return;
      const current = progressRef.current;
      const restored = parseLearningProgress(event.newValue);
      const next = setLessonStep(restored, current.activeLessonId, current.lessonSteps[current.activeLessonId] ?? "observe");
      progressRef.current = next;
      setProgress(next);
    };
    window.addEventListener("storage", sync);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("storage", sync); };
  }, []);

  function save(update: (latest: LearningProgress) => LearningProgress) {
    let latest = progressRef.current;
    try { if (!unsavedRef.current) latest = parseLearningProgress(localStorage.getItem(LEARNING_STORAGE_KEY)); }
    catch { /* Continue with in-memory progress when storage is blocked. */ }
    const next = update(latest);
    progressRef.current = next;
    setProgress(next);
    try { localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(next)); unsavedRef.current = false; setStorageError(false); }
    catch { unsavedRef.current = true; setStorageError(true); }
  }

  function focusLesson() {
    requestAnimationFrame(() => {
      lessonHeadingRef.current?.focus({ preventScroll: true });
      lessonHeadingRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });
  }

  function choose(id: string) {
    if (!ready || !lessonById.has(id)) return;
    save((latest) => selectLesson(latest, id));
    window.history.replaceState(null, "", `#${id}`);
    focusLesson();
  }

  function goToStep(nextStep: LearningStep) {
    if (!ready) return;
    save((latest) => setLessonStep(latest, lesson.id, nextStep));
    focusLesson();
  }

  function openMap() {
    setShowMap(true);
    requestAnimationFrame(() => { mapHeadingRef.current?.focus({ preventScroll: true }); mapHeadingRef.current?.scrollIntoView({ block: "start" }); });
  }

  return <div className={styles.page}>
    <a className="skip-link" href="#learning-lesson">跳到本课学习</a>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}><span><Sprout size={24} /></span>GoGo 学堂</Link>
      <span className={styles.headerTitle}>我的数学成长地图</span>
      <Link className={styles.backHome} href="/"><ArrowLeft size={16} />学习首页</Link>
    </header>
    <main className={styles.main}>
      <section className={styles.hero} aria-labelledby="journey-title">
        <div><p className={styles.eyebrow}><span />从认识，到理解，再到运用</p><h1 id="journey-title">小小的发现，<br />连成大大的本领<span>。</span></h1>
          <p className={styles.heroDescription}>先数清一把积木，再理解加减；<br />先学会分一分，再认识乘除和分数。</p>
          <div className={styles.heroButtons}><button className={styles.primary} disabled={!ready} onClick={() => choose(recommended?.id ?? lesson.id)}>{progress.completedLessonIds.length ? "接着学下一小步" : "从最基础开始"}<ArrowRight size={18} /></button><button className={styles.textButton} onClick={openMap}>看完整知识地图<GitBranch size={17} /></button></div>
          <p className={styles.heroNote}>{mathStages.length} 个成长阶段 · {mathLessons.length} 个核心概念 · 一次学明白一点</p>
        </div><GrowingIdeas />
      </section>

      <section className={styles.routeSection} aria-label="从基础到综合的学习路线">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>一步一步，建立自己的知识体系</p><h2>我的数学路线</h2></div><span className={styles.totalProgress}>{progress.completedLessonIds.length} / {mathLessons.length} 课已完成</span></div>
        <ol className={styles.stageRoute}>{mathStages.map((item, index) => {
          const lessons = mathLessons.filter((n) => n.stageId === item.id);
          const count = lessons.filter((n) => progress.completedLessonIds.includes(n.id)).length;
          return <li key={item.id} className={item.id === lesson.stageId ? styles.currentStage : ""}>
            <button disabled={!ready} onClick={() => choose(lessons.find((n) => !progress.completedLessonIds.includes(n.id))?.id ?? lessons[0].id)} aria-current={item.id === lesson.stageId ? "step" : undefined}>
              <span className={styles.stageNumber}>{count === lessons.length ? <Check size={17} /> : `0${index + 1}`}</span><strong>{item.title}</strong><small>{item.subtitle}</small><span className={styles.stageCount}>{count} / {lessons.length} 课</span>
            </button></li>;
        })}</ol>
        <p className={styles.routeNote}><Sprout size={16} />从你已经理解的地方出发，不用和别人比快慢。</p>
      </section>

      <section className={styles.mapSection} aria-labelledby="system-map-title">
        <div className={styles.mapHeader}><div><h2 id="system-map-title" ref={mapHeadingRef} tabIndex={-1}>知识之间，有一条条小路</h2><p>新知识会用到旧知识。点开一课，看看它从哪里来、又通向哪里。</p></div><button className={styles.secondary} aria-expanded={showMap} aria-controls="system-map" onClick={() => setShowMap(!showMap)}>{showMap ? "收起全图" : "展开全图"}<ChevronDown size={16} style={{ transform: showMap ? "rotate(180deg)" : undefined }} /></button></div>
        {showMap ? <div id="system-map">
          <div className={styles.domainFilters} role="group" aria-label="按知识领域查看"><button aria-pressed={domainFilter === "all"} onClick={() => setDomainFilter("all")}>全部知识</button>{mathDomains.map((item) => <button key={item.id} aria-pressed={domainFilter === item.id} onClick={() => setDomainFilter(item.id)} style={{ "--domain-color": item.color } as CSSProperties}><span />{item.title}</button>)}</div>
          <div className={styles.systemMap}>{mathStages.map((item, index) => {
            const lessons = mathLessons.filter((n) => n.stageId === item.id && (domainFilter === "all" || n.domainId === domainFilter));
            if (!lessons.length) return null;
            return <div key={item.id} className={styles.mapStage}><div className={styles.mapStageTitle}><span>{index + 1}</span><div><h3>{item.title}</h3><p>{item.subtitle}</p></div></div><div className={styles.mapNodes}>{lessons.map((n) => {
              const done = progress.completedLessonIds.includes(n.id);
              const review = progress.reviewLessonIds.includes(n.id);
              const canStart = getLessonReadiness(progress, n.id).ready;
              const nodeDomain = mathDomains.find((d) => d.id === n.domainId)!;
              return <button key={n.id} className={`${styles.mapNode} ${n.id === lesson.id ? styles.selectedNode : ""}`} disabled={!ready} onClick={() => choose(n.id)} aria-current={n.id === lesson.id ? "step" : undefined} style={{ "--domain-color": nodeDomain.color } as CSSProperties}>
                <span className={styles.nodeDomain}>{nodeDomain.title}{done ? <Check size={15} /> : review ? <RotateCcw size={14} /> : <span className={styles.nodeDot} />}</span><strong>{n.title}</strong><small>{review ? "再想一想" : done ? "本课已完成" : canStart ? "可以从这里学" : "先了解基础，也可预览"}</small>
              </button>;
            })}</div></div>;
          })}</div>
          <p className={styles.mapScope}>这是小学数学主干的首批 {mathLessons.length} 个核心概念，按知识联系编排，可跨年级学习；不等同于完整教材目录。</p>
        </div> : null}
      </section>

      <section id="learning-lesson" className={styles.learningWorkspace} aria-labelledby="current-lesson-title" style={{ "--domain-color": domain.color } as CSSProperties}>
        <aside className={styles.learningAside}>
          <div className={styles.asideTitle}><BookOpen size={19} /><h2>这一小步</h2></div><p className={styles.domainLabel}>{domain.title} · 第 {mathStages.indexOf(stage) + 1} 阶段</p><h3>{lesson.title}</h3><p className={styles.goal}>{lesson.goal}</p>
          <div className={styles.why}><span><Lightbulb size={16} />为什么学它</span><p>{lesson.why}</p></div>
          <div className={styles.connections}><h4>它用到了哪些基础？</h4>{lesson.prerequisites.length ? lesson.prerequisites.map((id) => <button key={id} disabled={!ready} onClick={() => choose(id)}><span className={progress.completedLessonIds.includes(id) ? styles.connectionDone : ""}>{progress.completedLessonIds.includes(id) ? <Check size={14} /> : <Sprout size={14} />}</span>{lessonById.get(id)?.title}<ArrowRight size={14} /></button>) : <p>这里就是起点。带上好奇心就可以开始。</p>}</div>
          <div className={styles.connections}><h4>以后会用它做什么？</h4>{descendants.length ? descendants.slice(0, 4).map((n) => <button key={n.id} disabled={!ready} onClick={() => choose(n.id)}><GitBranch size={14} />{n.title}<ArrowRight size={14} /></button>) : <p>把学过的方法放在一起，解决生活中的新问题。</p>}</div>
          <Link href="/knowledge/geometry" className={styles.geometryLink}><Shapes size={18} /><span>空间小实验<small>点、线、面、体专题</small></span><ArrowRight size={16} /></Link>
        </aside>
        <div className={styles.lessonCard}>
          <div className={styles.lessonTopline}><span>一课五小步，边发现边理解</span><span>{completed ? <><Check size={14} />本课已完成</> : progress.reviewLessonIds.includes(lesson.id) ? "有个问题再想一想" : "按自己的节奏来"}</span></div>
          <nav aria-label="本课学习步骤" className={styles.stepNavigation}>{learningSteps.map((item, index) => <button key={item} disabled={!ready} aria-current={step === item ? "step" : undefined} onClick={() => goToStep(item)}><span>{index + 1}</span>{stepLabels[item]}</button>)}</nav>
          <div className={styles.lessonHeading}><span className={styles.stepBadge}><StepIcon size={18} />{stepLabels[step]}</span><h2 id="current-lesson-title" tabIndex={-1} ref={lessonHeadingRef}>{lesson.title}</h2></div>
          {!readiness.ready ? <div className={styles.foundationNotice}><Sprout size={20} /><div><strong>先把地基搭好，会更容易懂</strong><p>你可以先看看这课。建议先认识：{readiness.missingPrerequisiteIds.slice(0, 3).map((id) => lessonById.get(id)?.title).join("、")}{readiness.missingPrerequisiteIds.length > 3 ? `等 ${readiness.missingPrerequisiteIds.length} 个基础概念` : ""}。</p><button disabled={!ready} onClick={() => choose(readiness.missingPrerequisiteIds[0])}>先学这个基础<ArrowRight size={15} /></button></div></div> : null}
          {!ready ? <p className={styles.loading} role="status">正在准备你的小课堂…</p> : <div key={`${lesson.id}-${step}`} className={styles.stepContent}>
            {step === "observe" ? <div className={styles.observation}><span className={styles.storyLabel}>从生活里发现</span><h3>{lesson.story.title}</h3><p>{lesson.story.text}</p><div className={styles.observationGoal}><Compass size={22} /><div><strong>今天，我们一起来弄明白</strong><p>{lesson.goal}</p></div></div><p className={styles.gentlePrompt}>先想一想，不着急说答案。下一步，用小教具把它变出来。</p></div> : null}
            {step === "explore" ? <><p className={styles.stepIntro}>点一点、摆一摆。看看你的操作带来了什么变化。</p><MathActivity activity={lesson.activity} /></> : null}
            {step === "understand" ? <div className={styles.understanding}><p className={styles.stepIntro}>刚才的发现，藏着这样的道理。</p><ol>{lesson.explanation.map((text, index) => <li key={text}><span>{index + 1}</span><p>{text}</p></li>)}</ol><div className={styles.takeaway}><Lightbulb size={24} /><div><span>用自己的话说一说</span><strong>{lesson.takeaway}</strong></div></div><button className={styles.textButton} onClick={() => goToStep("explore")}><RotateCcw size={16} />带着这个发现，再动手试试</button></div> : null}
            {step === "check" ? <LessonCheck lesson={lesson} progress={progress} onAnswer={(id, correct) => save((latest) => recordLearningCheck(setLessonStep(latest, lesson.id, "check"), lesson.id, id, correct))} onFinish={() => goToStep("connect")} onRevisit={() => goToStep("explore")} /> : null}
            {step === "connect" ? <div className={styles.connected}><span className={styles.finishIcon}>{completed ? <Check size={28} /> : <GitBranch size={28} />}</span><h3>{completed ? "又一块知识，连起来了。" : "看看这课在地图里的位置"}</h3><p>{lesson.takeaway}</p><div className={styles.knowledgeChain}>
              <div><small>用到的基础</small>{lesson.prerequisites.length ? lesson.prerequisites.map((id) => <button key={id} onClick={() => choose(id)}>{lessonById.get(id)?.title}<ArrowRight size={14} /></button>) : <span>生活里的观察</span>}</div><ArrowRight className={styles.chainArrow} size={20} /><div className={styles.chainCurrent}><small>这次的新发现</small><strong>{lesson.title}</strong></div><ArrowRight className={styles.chainArrow} size={20} /><div><small>可以帮助我学</small>{descendants.length ? descendants.slice(0, 2).map((n) => <button key={n.id} onClick={() => choose(n.id)}>{n.title}<ArrowRight size={14} /></button>) : <span>解决新的生活问题</span>}</div>
            </div><div className={styles.shareIdea}><Lightbulb size={19} /><p>找一件身边的东西，把今天的发现讲给家人听。换个例子也能说清楚，理解就更牢啦。</p></div>
              {!completed ? <><p className={styles.incompleteNote}>看过不等于会用了。还有 {lesson.checks.length - (progress.passedCheckIds[lesson.id]?.length ?? 0)} 道小题等你试试。</p><button className={styles.primary} onClick={() => goToStep("check")}>去试着用一用<ArrowRight size={17} /></button></> : recommended ? <div className={styles.nextLesson}><span>建议下一步 · 基础已经准备好</span><strong>{recommended.title}</strong><p>{recommended.goal}</p><button className={styles.primary} onClick={() => choose(recommended.id)}>{progress.reviewLessonIds.includes(recommended.id) ? "把这个问题再想明白" : "走向下一小步"}<ArrowRight size={17} /></button></div> : <div className={styles.nextLesson}><strong>这张成长地图，你已经走过一遍！</strong><p>回到生活里用一用，也可以挑一课重新观察。我们还会继续补充更多知识。</p><button className={styles.secondary} onClick={openMap}>回到完整地图</button></div>}
            </div> : null}
          </div>}
          <div className={styles.lessonFooter}><button className={styles.textButton} disabled={!ready || stepIndex === 0} onClick={() => goToStep(learningSteps[stepIndex - 1])}><ArrowLeft size={16} />上一步</button><span>{stepIndex + 1} / 5</span>{stepIndex < 3 ? <button className={styles.primary} disabled={!ready} onClick={() => goToStep(learningSteps[stepIndex + 1])}>{stepIndex === 0 ? "一起动手试试" : stepIndex === 1 ? "说说其中的道理" : "我来用一用"}<ArrowRight size={16} /></button> : step === "check" && completed ? <button className={styles.secondary} onClick={() => goToStep("connect")}>回顾知识联系<ArrowRight size={16} /></button> : <button className={styles.textButton} disabled={!ready} onClick={openMap}>看看地图</button>}</div>
        </div>
      </section>
      {progress.reviewLessonIds.length ? <section className={styles.reviewSection} aria-labelledby="review-title"><div><RotateCcw size={20} /><h2 id="review-title">留给下一次的小问题</h2><span>{progress.reviewLessonIds.length} 课</span></div><p>想不明白时，回到教具和基础课，再试一遍。</p><div className={styles.reviewLessons}>{progress.reviewLessonIds.map((id) => <button key={id} onClick={() => choose(id)}>{lessonById.get(id)?.title}<ArrowRight size={15} /></button>)}</div></section> : null}
      <footer className={styles.footer}><p>{storageError ? "浏览器暂时无法保存记录，本页仍可继续学习。关闭页面后进度可能丢失。" : "学习步骤与纠错记录保存在当前浏览器，换设备暂不自动同步。"}</p><p>本课完成表示做过理解练习，持续复习和生活运用同样重要。</p></footer>
    </main>
  </div>;
}
