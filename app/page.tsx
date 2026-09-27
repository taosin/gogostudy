"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  House,
  NotebookPen,
  ChartNoAxesCombined,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Calculator,
  Ruler,
  Shapes,
  Star,
  Sun,
  Settings2,
  Check,
  Clock,
  Eye,
  Puzzle,
  RotateCcw,
  LogIn,
  LogOut,
  Cloud,
  HardDrive,
  CheckCircle2,
  Lightbulb,
  ChevronRight,
  GraduationCap,
  LoaderCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Picker } from "@/components/study/course-picker";
import { QuestionVisual } from "@/components/study/question-visual";
import { Progress } from "@/components/ui/progress";
import {
  topics,
  courseKey,
  courseLabels,
  courseOptions,
  defaultCourse,
  supportedCourse,
  type Course,
  type Question,
  type Attempt,
} from "@/lib/catalog";
import {
  getMistakes,
  stats,
  chinaDay,
  getTodayTask,
  friendlyChinaDate,
  millisecondsUntilNextChinaDay,
  rotateForChinaDay,
} from "@/lib/study";
import { useStudy } from "@/lib/use-study";
import { getSupabase } from "@/lib/supabase/browser";
import { loadQuestions, preloadQuestions } from "@/lib/question-cache";
import { NavigationButton } from "@/components/study/navigation-button";
type View = "home" | "practice" | "mistakes" | "review";
const navigation = [
  { id: "home" as const, label: "学习首页", icon: House },
  { id: "practice" as const, label: "知识点练习", icon: BookOpen },
  { id: "mistakes" as const, label: "我的错题本", icon: NotebookPen },
  { id: "review" as const, label: "学习复盘", icon: ChartNoAxesCombined },
];
const topicIcons = {
  calculator: Calculator,
  star: Star,
  ruler: Ruler,
  shapes: Shapes,
  eye: Eye,
  clock: Clock,
  puzzle: Puzzle,
};
const weekdayFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  weekday: "short",
});
export default function Home() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    let timer = 0;
    const refresh = () => {
      const current = Date.now();
      setNow(current);
      window.clearTimeout(timer);
      timer = window.setTimeout(
        refresh,
        millisecondsUntilNextChinaDay(current) + 100,
      );
    };
    timer = window.setTimeout(refresh, 0);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);
  const study = useStudy();
  const { state, ready, loading, error, storage } = study;
  const [view, setView] = useState<View>("home"),
    [settings, setSettings] = useState(false),
    [draft, setDraft] = useState<Course>(defaultCourse),
    [leaveTarget, setLeaveTarget] = useState<View | null>(null),
    [authOpen, setAuthOpen] = useState(false),
    [authEmail, setAuthEmail] = useState(""),
    [code, setCode] = useState(""),
    [codeSent, setCodeSent] = useState(false),
    [authMessage, setAuthMessage] = useState("");
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [success, setSuccess] = useState(""),
    [filter, setFilter] = useState("all"),
    [topicFilter, setTopicFilter] = useState("全部知识点");
  const [queue, setQueue] = useState<Question[]>([]),
    [index, setIndex] = useState(0),
    [answer, setAnswer] = useState(""),
    [result, setResult] = useState<Attempt | null>(null),
    [hint, setHint] = useState(false),
    [retryCount, setRetryCount] = useState(0),
    [showSolution, setShowSolution] = useState(false),
    [mode, setMode] = useState<Attempt["mode"]>("practice"),
    [reason, setReason] = useState(""),
    [done, setDone] = useState(false),
    [round, setRound] = useState<Attempt[]>([]),
    [reflection, setReflection] = useState(""),
    [sessionMistakeIds, setSessionMistakeIds] = useState<Set<string>>(
      () => new Set(),
    );
  const attemptId = useRef("");
  const reflectionId = useRef("");
  const viewHeadingRef = useRef<HTMLHeadingElement>(null);
  const questionTitleRef = useRef<HTMLHeadingElement>(null);
  const answerInputRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const key = courseKey(state.course),
    available = supportedCourse(state.course);
  useEffect(() => {
    if (!ready || loading || !available) return;
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (connection?.saveData) return;
    const timer = window.setTimeout(() => preloadQuestions(key), 250);
    return () => window.clearTimeout(timer);
  }, [available, key, loading, ready]);
  useEffect(() => {
    if (!result) return;
    const frame = window.requestAnimationFrame(() => {
      feedbackRef.current?.focus({ preventScroll: true });
      feedbackRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "nearest",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [result, showSolution]);
  const attempts = useMemo(
    () => state.attempts.filter((a) => a.course_key === key),
    [key, state.attempts],
  );
  const summary = useMemo(
    () => stats(attempts, new Date(now)),
    [attempts, now],
  );
  const mistakes = useMemo(() => getMistakes(attempts), [attempts]);
  const attemptMetrics = useMemo(() => {
    const activityDays = new Set<string>();
    const correctQuestionIds = new Set<string>();
    const topicPractice = new Map<
      string,
      { total: number; correct: number; correctIds: Set<string> }
    >();
    for (const attempt of attempts) {
      activityDays.add(chinaDay(attempt.created_at));
      if (attempt.correct) correctQuestionIds.add(attempt.question_id);
      if (attempt.mode !== "practice") continue;
      const metric = topicPractice.get(attempt.question.topic) || {
        total: 0,
        correct: 0,
        correctIds: new Set<string>(),
      };
      metric.total += 1;
      if (attempt.correct) {
        metric.correct += 1;
        metric.correctIds.add(attempt.question_id);
      }
      topicPractice.set(attempt.question.topic, metric);
    }
    return { activityDays, correctQuestionIds, topicPractice };
  }, [attempts]);
  const pending = useMemo(
      () => mistakes.filter((m) => m.status === "pending"),
      [mistakes],
    ),
    due = useMemo(
      () =>
        mistakes.filter(
          (m) =>
            m.status === "review" &&
            Boolean(m.dueAt) &&
            chinaDay(m.dueAt!) <= chinaDay(new Date(now)),
        ),
      [mistakes, now],
    ),
    todayTask = useMemo(
      () => getTodayTask(mistakes, now),
      [mistakes, now],
    );
  const filteredMistakes = useMemo(
    () =>
      mistakes.filter(
        (mistake) =>
          (filter === "all" || mistake.status === filter) &&
          (topicFilter === "全部知识点" ||
            topics.find((topic) => topic.id === mistake.question.topic)?.name ===
              topicFilter),
      ),
    [filter, mistakes, topicFilter],
  );
  const dailyGoal = 5,
    dailyProgress = Math.min(summary.todayPractice, dailyGoal);
  const current = queue[index];
  const solutionVisible = Boolean(
    result && (result.correct || retryCount > 0 || showSolution),
  );
  const completedCount = Math.min(
    queue.length,
    index + (solutionVisible ? 1 : 0),
  );
  const roundCorrect = round.filter((attempt) => attempt.correct).length;
  const firstTryCorrect = Math.max(0, round.length - sessionMistakeIds.size);
  const disabled = !ready || loading || busy || Boolean(error);
  const title = navigation.find((n) => n.id === view)!.label;
  const topbarTitle = queue.length
    ? done
      ? "本次小收获"
      : mode === "practice"
        ? "今日练习"
        : mode === "correction"
          ? "错题订正"
          : "回忆复习"
    : title;
  const feedbackTitle = !result
    ? ""
    : result.correct
      ? retryCount > 0 || hint
        ? "你顺着提示想出来了！"
        : mode === "correction"
          ? "订正完成，方法更清楚了！"
          : mode === "review"
            ? "这次回忆想起来了！"
            : "你自己找到了方法！"
      : solutionVisible
        ? mode === "review"
          ? "这道题先回到待订正，慢慢来。"
          : "先看懂方法，下次会更有把握。"
        : "再想一步，你快找到了。";
  const todayActionLabel =
      todayTask.kind === "correction"
        ? `先订正 ${todayTask.count} 道错题`
        : todayTask.kind === "review"
          ? `开始 ${todayTask.count} 道到期复习`
          : dailyProgress >= dailyGoal
            ? "看看今天的收获"
            : "开始今日练习",
    todayHeadline =
      todayTask.kind === "correction"
        ? "先把错题想明白，"
        : todayTask.kind === "review"
          ? "今天来回忆一下，"
          : dailyProgress >= dailyGoal
            ? "今天的目标完成啦！"
            : "数学小探险，",
    todayDescription =
      todayTask.kind === "correction"
        ? "订正完成后，系统会安排间隔复习。"
        : todayTask.kind === "review"
          ? "按时回忆，比连续重复更容易记牢。"
          : dailyProgress >= dailyGoal
            ? "已经完成 5 道练习，去看看今天的收获吧。"
            : `今天已练 ${dailyProgress} 道，再完成 ${dailyGoal - dailyProgress} 道就达成目标。`;
  useEffect(() => {
    if (!current || result) return;
    const frame = window.requestAnimationFrame(() => {
      (answerInputRef.current || questionTitleRef.current)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [current, result, retryCount]);
  function finishNavigation(next: View) {
    setView(next);
    setQueue([]);
    setDone(false);
    setLeaveTarget(null);
    setNotice("");
    setSuccess("");
    window.requestAnimationFrame(() => {
      viewHeadingRef.current?.focus({ preventScroll: true });
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    });
  }
  function navigate(next: View) {
    if (busy) return;
    if (queue.length && !done) {
      setLeaveTarget(next);
      return;
    }
    finishNavigation(next);
  }
  function restorePracticeFocus() {
    window.requestAnimationFrame(() => {
      const target = result
        ? feedbackRef.current
        : answerInputRef.current || questionTitleRef.current;
      target?.focus({ preventScroll: true });
    });
  }
  function resumePractice() {
    setLeaveTarget(null);
    restorePracticeFocus();
  }
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setNotice("");
    setSuccess("");
    try {
      await work();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "暂时出了点问题，请重试。");
    } finally {
      setBusy(false);
    }
  }
  async function start(
    topic?: string,
    ids?: string[],
    nextMode: Attempt["mode"] = "practice",
  ) {
    if (disabled || !available) return;
    await run(async () => {
      const questions = await loadQuestions(key);
      const unresolvedMistakeIds = new Set(
        mistakes
          .filter((m) => m.status !== "mastered")
          .map((m) => m.question.id),
      );
      let selected = ids
        ? ids
            .map((id) => questions.find((q) => q.id === id))
            .filter((q): q is Question => !!q)
        : questions.filter(
            (q) =>
              (!topic || q.topic === topic) &&
              !unresolvedMistakeIds.has(q.id),
          );
      if (!ids) {
        selected = selected.sort(
          (a, b) =>
            Number(attemptMetrics.correctQuestionIds.has(a.id)) -
            Number(attemptMetrics.correctQuestionIds.has(b.id)),
        );
        if (!topic) {
          const chosen: Question[] = [];
          for (const t of rotateForChinaDay(topics, new Date())) {
            const q = selected.find((q) => q.topic === t.id);
            if (q) chosen.push(q);
          }
          selected = chosen;
        }
        selected = selected.slice(0, 5);
      }
      if (!selected.length)
        throw new Error(
          pending.length
            ? "这些题正在错题本里等你订正，先把它们想明白吧。"
            : mistakes.some((m) => m.status === "review")
              ? "这些题正在错题本里按计划复习，先完成今日任务吧。"
              : "这里的题目还在准备中。",
        );
      setQueue(selected);
      setIndex(0);
      setAnswer("");
      setResult(null);
      setHint(false);
      setRetryCount(0);
      setShowSolution(false);
      setMode(nextMode);
      setReason("");
      setDone(false);
      setRound([]);
      setSessionMistakeIds(new Set());
      attemptId.current = crypto.randomUUID();
    });
  }
  function startTodayTask() {
    if (todayTask.kind === "correction")
      return void start(undefined, todayTask.ids, "correction");
    if (todayTask.kind === "review")
      return void start(undefined, todayTask.ids, "review");
    if (dailyProgress >= dailyGoal) return navigate("review");
    return void start();
  }
  async function submit() {
    if (!current || result || !answer.trim() || disabled) return;
    await run(async () => {
      const attempt = await study.saveAttempt({
        id: attemptId.current,
        questionId: current.id,
        answer,
        mode: retryCount > 0 ? "correction" : mode,
        reason,
      });
      if (!attempt.correct) {
        setHint(true);
        setSessionMistakeIds((ids) => new Set(ids).add(current.id));
      }
      setResult(attempt);
      setRound((items) => [
        ...items.filter((item) => item.question_id !== attempt.question_id),
        attempt,
      ]);
    });
  }
  function retryCurrent() {
    if (!result || result.correct || retryCount > 0) return;
    setRetryCount(1);
    setShowSolution(false);
    setResult(null);
    setAnswer("");
    setHint(true);
    attemptId.current = crypto.randomUUID();
  }
  function next() {
    if (index + 1 >= queue.length) {
      setDone(true);
      window.requestAnimationFrame(() => {
        viewHeadingRef.current?.focus({ preventScroll: true });
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
      });
      return;
    }
    setIndex((i) => i + 1);
    setAnswer("");
    setResult(null);
    setHint(false);
    setRetryCount(0);
    setShowSolution(false);
    setReason("");
    attemptId.current = crypto.randomUUID();
  }
  function openSettings() {
    setDraft(state.course);
    setSettings(true);
    setNotice("");
  }
  async function authSubmit() {
    setAuthMessage("");
    await run(async () => {
      const client = await getSupabase();
      if (!client)
        throw new Error("家长账户暂未开放，目前可使用本机体验模式。");
      if (!codeSent) {
        const { error } = await client.auth.signInWithOtp({
          email: authEmail.trim(),
          options: { shouldCreateUser: true },
        });
        if (error) throw new Error("验证码未能发送，请检查邮箱或稍后重试。");
        setCodeSent(true);
        setAuthMessage("验证码已发送，请查看邮箱（也看看垃圾邮件）。");
      } else {
        const { error } = await client.auth.verifyOtp({
          email: authEmail.trim(),
          token: code.trim(),
          type: "email",
        });
        if (error) throw new Error("验证码不正确或已过期，请重新获取。");
        await study.reload();
        setAuthOpen(false);
        setCode("");
        setCodeSent(false);
        setQueue([]);
      }
    });
  }
  const topicCards = (all: boolean) => (
    <div className="topic-grid">
      {(all ? topics : topics.slice(0, 4)).map((t) => {
        const Icon = topicIcons[t.icon as keyof typeof topicIcons];
        const answered =
          attemptMetrics.topicPractice.get(t.id)?.correctIds.size || 0;
        return (
          <button
            className="topic-card"
            key={t.id}
            onClick={() => void start(t.id)}
            disabled={disabled}
          >
            <span className={"topic-icon " + t.color}>
              <Icon size={27} />
            </span>
            <h3>{t.name}</h3>
            <p>{t.description}</p>
            <div className="topic-bottom">
              <span>
                {answered
                  ? `练习答对 ${answered} 道题`
                  : "开始探索"}
              </span>
              <ArrowRight size={18} />
            </div>
          </button>
        );
      })}
    </div>
  );
  return (
    <SidebarProvider>
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <Sidebar className="school-sidebar">
        <SidebarHeader>
          <button className="brand" onClick={() => navigate("home")}>
            <span className="brand-icon">
              <BookOpen size={25} />
            </span>
            <span>
              GoGo<span className="brand-light">学堂</span>
              <small>每天进步一点点</small>
            </span>
          </button>
        </SidebarHeader>
        <SidebarContent>
          <nav aria-label="学习页面">
            <p className="nav-label">我的学习空间</p>
            <SidebarMenu>
              {navigation.map((n) => (
                <SidebarMenuItem key={n.id}>
                  <NavigationButton
                    className="nav-button"
                    isActive={view === n.id}
                    aria-current={view === n.id ? "page" : undefined}
                    onClick={() => navigate(n.id)}
                  >
                    <n.icon size={21} />
                    <span>{n.label}</span>
                    {n.id === "mistakes" && pending.length > 0 && (
                      <span className="count-badge">{pending.length}</span>
                    )}
                  </NavigationButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </nav>
        </SidebarContent>
        <SidebarFooter>
          <div className="sidebar-note">
            <Sun size={25} />
            <strong>慢慢来，也很棒</strong>
            <p>每一次思考，都是成长。</p>
          </div>
          <button
            className="profile"
            disabled={!ready || busy || (!!queue.length && !done)}
            onClick={() => {
              setAuthOpen(true);
              setNotice("");
            }}
          >
            <span>学</span>
            <div>
              小小探索家
              <small>
                {state.course.grade} ·{" "}
                {storage === "cloud" ? "云端已连接" : "本机体验中"}
              </small>
            </div>
            <Settings2 size={15} />
          </button>
        </SidebarFooter>
      </Sidebar>
      <main className="workspace" id="main-content" tabIndex={-1}>
        <header className="topbar">
          <div className="topbar-title">
            <SidebarTrigger className="mobile-menu" aria-label="打开学习菜单" />
            <span className="breadcrumb-prefix">我的学习 /</span>
            <b>{topbarTitle}</b>
          </div>
          {!queue.length && <div className="topbar-actions">
            <button
              className="text-button"
              disabled={!ready || busy}
              onClick={() => setAuthOpen(true)}
              aria-label={storage === "cloud" ? "家长账户" : "家长登录"}
            >
              {storage === "cloud" ? <Cloud size={16} /> : <LogIn size={16} />}
              <span>{storage === "cloud" ? "家长账户" : "家长登录"}</span>
            </button>
            <button
              className="text-button"
              onClick={openSettings}
              aria-label="学习设置"
              disabled={!ready || loading || busy || (!!queue.length && !done)}
            >
              <Settings2 size={16} />
              <span>学习设置</span>
            </button>
          </div>}
        </header>
        <div className={`page-body${queue.length ? " focus-mode" : ""}`}>
          {error && (
            <div className="message error" role="alert">
              {error}
              <button onClick={() => void study.reload()}>重新加载</button>
            </div>
          )}
          {notice && !settings && !authOpen && (
            <div className="message error" role="alert">
              {notice}
            </div>
          )}
          {success && !settings && !authOpen && (
            <div className="message success" role="status">
              <CheckCircle2 size={19} /> {success}
            </div>
          )}
          {queue.length > 0 ? (
            <section className="practice-workspace">
              {done ? (
                <div className="completion panel">
                  <span className="completion-icon">
                    <GraduationCap size={42} />
                  </span>
                  <p className="eyebrow">本次小收获</p>
                  <h1 ref={viewHeadingRef} tabIndex={-1}>
                    {round.some((attempt) => !attempt.correct)
                      ? "完成这一轮，就是进步！"
                      : sessionMistakeIds.size
                        ? "愿意再想一次，真了不起！"
                        : "这轮思路很清楚！"}
                  </h1>
                  <div className="completion-stats" aria-label="本轮练习结果">
                    <div>
                      <strong>{round.length}</strong>
                      <span>完成题目</span>
                    </div>
                    <div>
                      <strong>{firstTryCorrect}</strong>
                      <span>一次答对</span>
                    </div>
                    <div>
                      <strong>{sessionMistakeIds.size}</strong>
                      <span>认真再想</span>
                    </div>
                  </div>
                  <div className="completion-topics">
                    {[...new Set(round.map((attempt) => attempt.question.topic))].map(
                      (topic) => (
                        <span className="pill" key={topic}>
                          {topics.find((item) => item.id === topic)?.name}
                        </span>
                      ),
                    )}
                  </div>
                  <div className="completion-note">
                    {roundCorrect < round.length
                      ? `${round.length - roundCorrect} 道题还可以再想一次，已经放进错题本。`
                      : sessionMistakeIds.size
                        ? `${sessionMistakeIds.size} 道题借助提示想明白了，明天会安排回忆。`
                      : mode === "correction"
                        ? "订正完成，明天会安排第 1 次回忆。"
                        : mode === "review"
                          ? "这次回忆完成，下一次会在合适的时间出现。"
                          : "把今天的小收获记下来吧。"}
                  </div>
                  <div className="button-row">
                    <button
                      className={
                        todayTask.kind === "practice" ? "primary" : "secondary"
                      }
                      onClick={() => finishNavigation("home")}
                    >
                      {todayTask.kind === "practice" ? "完成今天学习" : "稍后再做"}
                    </button>
                    {todayTask.kind !== "practice" ? (
                      <button
                        className="primary"
                        disabled={disabled}
                        onClick={startTodayTask}
                      >
                        {todayActionLabel} <ArrowRight size={17} />
                      </button>
                    ) : (
                      <button
                        className="secondary"
                        disabled={disabled}
                        onClick={() => void start()}
                      >
                        我还想再练
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="practice-top">
                    <button
                      className="text-button"
                      onClick={() => navigate(view)}
                    >
                      <ArrowLeft size={18} /> 退出练习
                    </button>
                    <span>
                      {mode === "practice"
                        ? "知识点练习"
                        : mode === "correction"
                          ? "错题订正"
                          : "回忆再练"}{" "}
                      · 第 {index + 1} / {queue.length} 题
                    </span>
                    <span className="muted">
                      已完成 {completedCount}/{queue.length} · 不计时
                    </span>
                  </div>
                  <Progress
                    value={(completedCount / queue.length) * 100}
                    className="practice-progress"
                    aria-label={`本轮练习已完成 ${completedCount}/${queue.length}`}
                  />
                  <div className="question-panel panel">
                    <div className="question-meta">
                      <span className="pill">
                        {topics.find((t) => t.id === current.topic)?.name}
                      </span>
                      <span>{current.options ? "选一选" : "填一填"}</span>
                    </div>
                    <h1
                      className="question-title"
                      ref={questionTitleRef}
                      tabIndex={-1}
                    >
                      {current.prompt}
                    </h1>
                    <QuestionVisual question={current} />
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void submit();
                      }}
                    >
                      {current.options ? (
                        <div className="answer-options">
                          {current.options.map((option, i) => {
                            const correctOption =
                              solutionVisible && option === result?.expected;
                            const chosenWrong =
                              Boolean(result && !result.correct) &&
                              option === result?.answer;
                            return (
                              <button
                                key={option}
                                type="button"
                                aria-pressed={answer === option}
                                className={
                                  "answer-option " +
                                  (correctOption
                                    ? "correct-answer"
                                    : chosenWrong
                                      ? "wrong-answer"
                                      : answer === option
                                        ? "selected"
                                        : "")
                                }
                                disabled={!!result || busy}
                                onClick={() => setAnswer(option)}
                              >
                                <span>{String.fromCharCode(65 + i)}</span>
                                {option}
                                {correctOption && <small>正确答案</small>}
                                {chosenWrong && !correctOption && (
                                  <small>我的选择</small>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <label className="answer-input-label">
                          <span>我的答案</span>
                          <span className="answer-input-control">
                            <input
                              ref={answerInputRef}
                              key={current.id}
                              autoComplete="off"
                              aria-label={`我的答案${current.unit ? `，单位${current.unit}` : ""}`}
                              aria-describedby={hint ? "question-hint" : undefined}
                              autoFocus
                              inputMode="numeric"
                              value={answer}
                              onChange={(e) => setAnswer(e.target.value)}
                              disabled={!!result || busy}
                              maxLength={100}
                              placeholder="想好了，写在这里"
                            />
                            {current.unit && <b>{current.unit}</b>}
                          </span>
                        </label>
                      )}
                      {mode === "correction" && !result && (
                        <Picker
                          label="上次哪里卡住了？（可选）"
                          value={reason || "先试着订正"}
                          values={[
                            "先试着订正",
                            "计算时出错",
                            "题目没读清",
                            "方法还不熟",
                            "单位或时间弄混",
                          ]}
                          onChange={(v) =>
                            setReason(v === "先试着订正" ? "" : v)
                          }
                        />
                      )}
                      <div className="question-actions">
                        {!result && (
                          <button
                            type="button"
                            className="text-button hint-button"
                            aria-expanded={hint}
                            aria-controls="question-hint"
                            onClick={() => setHint(!hint)}
                          >
                            <Lightbulb size={18} />{" "}
                            {hint ? "收起小提示" : "给我一点提示"}
                          </button>
                        )}
                        {!result && (
                          <button
                            className="primary"
                            type="submit"
                            disabled={!answer.trim() || disabled}
                          >
                            {busy ? (
                              <LoaderCircle size={18} className="spin" />
                            ) : (
                              <Check size={18} />
                            )}{" "}
                            提交答案
                          </button>
                        )}
                      </div>
                    </form>
                    {hint && (
                      <p className="hint-box" id="question-hint" role="status">
                        <Lightbulb size={17} />
                        <span>{current.hint}</span>
                      </p>
                    )}
                    {result && (
                      <div
                        ref={feedbackRef}
                        tabIndex={-1}
                        className={
                          "answer-feedback " +
                          (result.correct ? "correct" : "retry")
                        }
                        role="status"
                        aria-live="polite"
                      >
                        <h3>{feedbackTitle}</h3>
                        {!solutionVisible && (
                          <p>先顺着上面的小提示想一想，你可以再试一次。</p>
                        )}
                        {solutionVisible && !result.correct && (
                          <p>
                            正确答案：
                            <strong>
                              {result.expected}
                              {current.unit || ""}
                            </strong>{" "}
                            · 你的答案：{result.answer}
                          </p>
                        )}
                        {solutionVisible && <p>{result.explanation}</p>}
                        {!solutionVisible ? (
                          <small>使用提示不会扣分，慢慢想就好。</small>
                        ) : !result.correct ? (
                          <small>已放进错题本，之后可以再自己做一次。</small>
                        ) : retryCount > 0 ? (
                          <small>这次当场订正完成，明天会再安排一次回忆。</small>
                        ) : null}
                        {!solutionVisible ? (
                          <div className="feedback-actions">
                            <button
                              className="secondary"
                              type="button"
                              onClick={() => setShowSolution(true)}
                            >
                              看看解法
                            </button>
                            <button
                              className="primary"
                              type="button"
                              onClick={retryCurrent}
                            >
                              用提示再试一次 <RotateCcw size={17} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="primary"
                            type="button"
                            autoFocus
                            onClick={next}
                          >
                            {index + 1 === queue.length
                              ? "查看本次收获"
                              : "下一道题"}{" "}
                            <ArrowRight size={18} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          ) : (
            <>
              <div className="greeting">
                <div>
                  <p className="eyebrow">
                    {view === "home"
                      ? "你好，小小探索家"
                      : "每一步都算数"}
                  </p>
                  <h1 ref={viewHeadingRef} tabIndex={-1}>
                    {view === "home"
                      ? "今天，也向前一小步"
                      : view === "practice"
                        ? "从一个小知识开始"
                        : view === "mistakes"
                          ? "把不会，变成我会了"
                          : "看看自己的小小进步"}{" "}
                    <Sun className="sun-icon" />
                  </h1>
                  <p>
                    {view === "home"
                      ? "准备好了吗？一起发现数学的乐趣。"
                      : view === "practice"
                        ? "找到想练习的知识点，按照自己的节奏来。"
                        : view === "mistakes"
                          ? "做错没关系，愿意再想一次就很棒。"
                          : "回顾今天的思考，让每一次练习都有收获。"}
                  </p>
                </div>
                <span className="school-tag">
                  {state.course.province} · {state.course.grade}
                </span>
              </div>
              <button
                className="curriculum-strip"
                onClick={openSettings}
                disabled={!ready || loading || busy}
              >
                <span>
                  <BookOpen size={18} /> 我的课程
                </span>
                <b>{state.course.textbook}</b>
                <b>
                  {state.course.grade}
                  {state.course.semester}
                </b>
                <b>{state.course.subject}</b>
                <span className="muted">
                  切换课程 <ChevronRight size={14} />
                </span>
              </button>
              {loading ? (
                <div className="panel empty-state" role="status">
                  <LoaderCircle className="spin" />
                  <h2>正在打开学习空间…</h2>
                </div>
              ) : !available ? (
                <div className="panel empty-state">
                  <BookOpen size={44} />
                  <h2>这门课程正在准备中</h2>
                  <p>当前已开放：浙江 · 人教版 · 二年级上册数学。</p>
                  <p>语文和其他年级会逐步加入，你的课程选择已保存。</p>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await study.saveCourse(defaultCourse);
                      })
                    }
                  >
                    回到二年级数学 <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                <>
                  {view === "home" && (
                    <>
                      <div className="dashboard-grid">
                        <section className="hero-card">
                          <div className="pill">
                            <Sparkles size={15} /> 今日小目标
                          </div>
                          <h2>
                            {todayHeadline}
                            <br />
                            {todayTask.kind === "correction"
                              ? "从认真订正开始。"
                              : todayTask.kind === "review"
                                ? "让知识记得更牢。"
                                : dailyProgress >= dailyGoal
                                  ? "为坚持的你点赞。"
                                  : "从一道题开始。"}
                          </h2>
                          <p>{todayDescription}</p>
                          <button
                            className="primary"
                            disabled={disabled}
                            onClick={startTodayTask}
                          >
                            {todayActionLabel} <ArrowRight size={18} />
                          </button>
                          <div className="daily-goal">
                            <div>
                              <span>今日练习</span>
                              <b>
                                {dailyProgress}/{dailyGoal}
                              </b>
                            </div>
                            <Progress
                              value={(dailyProgress / dailyGoal) * 100}
                              aria-label={`今日练习进度 ${dailyProgress}/${dailyGoal}`}
                            />
                          </div>
                          <div className="hero-foot">
                            先订正与复习 <i /> 再探索新知识
                          </div>
                          <div className="math-art" aria-hidden="true">
                            <span>2</span>
                            <b>×</b>
                            <span>3</span>
                            <em>= 6</em>
                          </div>
                        </section>
                        <section className="daily-card">
                          <div className="section-heading">
                            <h3>我的成长</h3>
                            <Star size={19} />
                          </div>
                          <div className="growth-number">
                            {summary.uniquePractice}{" "}
                            <small>道不同题目，探索中</small>
                          </div>
                          <p>
                            {summary.streak
                              ? `连续学习 ${summary.streak} 天，已经累计学习 ${summary.days} 天`
                              : summary.total
                                ? `已经在 ${summary.days} 天里留下了努力的足迹`
                              : "你的第一份进步，从今天开始"}
                          </p>
                          <div className="week">
                            {Array.from({ length: 7 }, (_, i) => {
                              const date = new Date(now - (6 - i) * 86400000);
                              const active = attemptMetrics.activityDays.has(
                                chinaDay(date),
                              );
                              const dayLabel =
                                i === 6
                                  ? "今天"
                                  : weekdayFormatter
                                      .format(date)
                                      .replace("周", "");
                              return (
                                <div
                                  key={i}
                                  role="img"
                                  aria-label={`${dayLabel}，${active ? "已学习" : "未学习"}`}
                                >
                                  <span>{dayLabel}</span>
                                  <i className={active ? "active" : ""}>
                                    {active && <Check size={15} />}
                                  </i>
                                </div>
                              );
                            })}
                          </div>
                          <div className="encouragement">
                            <Sparkles size={17} /> 每一个小努力，都值得被看见
                          </div>
                        </section>
                      </div>
                      <div className="section-heading topic-heading">
                        <div>
                          <h2>选一个知识点，出发吧</h2>
                          <p>一步一步学，把每个小知识学扎实。</p>
                        </div>
                        <button
                          className="text-button"
                          onClick={() => setView("practice")}
                        >
                          全部知识点 <ArrowRight size={16} />
                        </button>
                      </div>
                      {topicCards(false)}
                      <button
                        className="bottom-note"
                        onClick={() => setView("mistakes")}
                      >
                        <NotebookPen size={23} />
                        <div>
                          <strong>
                            {pending.length
                              ? `有 ${pending.length} 道题，等你再想一次。`
                              : "错题不是终点，是下一次进步的起点。"}
                          </strong>
                          <p>
                            {due.length
                              ? `今天有 ${due.length} 道题可以回忆复习。`
                              : "做错的题会自动收进错题本，陪你再想一想。"}
                          </p>
                        </div>
                        <ArrowRight size={18} />
                      </button>
                    </>
                  )}
                  {view === "practice" && (
                    <>
                      <div className="section-heading topic-heading">
                        <div>
                          <h2>我的数学知识地图</h2>
                          <p>
                            原创练习按知识点整理，单元顺序请以学校课本为准。
                          </p>
                        </div>
                        <button
                          className="primary"
                          disabled={disabled}
                          onClick={() => void start()}
                        >
                          综合练习 <ArrowRight size={18} />
                        </button>
                      </div>
                      {topicCards(true)}
                      <div className="bottom-note">
                        <Lightbulb size={24} />
                        <div>
                          <strong>先读懂题目，再慢慢计算。</strong>
                          <p>每道题都有小提示和讲解，不会也可以放心尝试。</p>
                        </div>
                      </div>
                    </>
                  )}
                  {view === "mistakes" && (
                    <>
                      <div className="stats-row">
                        <div className="mini-stat">
                          <span className="orange">{pending.length}</span>
                          <p>等我订正</p>
                        </div>
                        <div className="mini-stat">
                          <span className="blue-text">
                            {
                              mistakes.filter((m) => m.status === "review")
                                .length
                            }
                          </span>
                          <p>再练记牢</p>
                        </div>
                        <div className="mini-stat">
                          <span className="green-text">
                            {
                              mistakes.filter((m) => m.status === "mastered")
                                .length
                            }
                          </span>
                          <p>已经掌握</p>
                        </div>
                      </div>
                      {(pending.length > 0 || due.length > 0) && (
                        <section className="task-callout panel">
                          <div>
                            <span className="pill">
                              <Sparkles size={14} /> 今天先做这一项
                            </span>
                            <h2>
                              {pending.length
                                ? `把 ${Math.min(pending.length, 5)} 道错题订正清楚`
                                : `${Math.min(due.length, 5)} 道题到了回忆时间`}
                            </h2>
                            <p>
                              {pending.length
                                ? "说清错在哪里，再做一次，理解会更扎实。"
                                : "按时回忆一次，比马上重复很多遍更容易记牢。"}
                            </p>
                          </div>
                          <button
                            className="primary"
                            disabled={disabled}
                            onClick={startTodayTask}
                          >
                            {todayActionLabel} <ArrowRight size={17} />
                          </button>
                        </section>
                      )}
                      <div className="list-controls">
                        <div
                          className="filter-tabs"
                          role="group"
                          aria-label="错题状态筛选"
                        >
                          {[
                            ["all", "全部"],
                            ["pending", "待订正"],
                            ["review", "待复习"],
                            ["mastered", "已掌握"],
                          ].map(([value, label]) => (
                            <button
                              type="button"
                              key={value}
                              aria-pressed={filter === value}
                              onClick={() => setFilter(value)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <Picker
                          label="知识点"
                          value={topicFilter}
                          values={["全部知识点", ...topics.map((t) => t.name)]}
                          onChange={setTopicFilter}
                        />
                      </div>
                      <div className="mistake-list">
                        {filteredMistakes.map((m) => {
                            const reviewDue =
                              m.status === "review" &&
                              Boolean(m.dueAt) &&
                              chinaDay(m.dueAt!) <= chinaDay(new Date(now));
                            return (
                              <article
                                className="mistake-card panel"
                                key={m.question.id}
                              >
                              <div className="section-heading">
                                <span className="pill">
                                  {
                                    topics.find(
                                      (t) => t.id === m.question.topic,
                                    )?.name
                                  }
                                </span>
                                <span className={"status-tag " + m.status}>
                                  {m.status === "pending"
                                    ? "待订正"
                                    : m.status === "review"
                                      ? `待复习 ${m.reviewStep + 1}/3`
                                      : "已掌握"}
                                </span>
                              </div>
                              <h3>{m.question.prompt}</h3>
                              <p className="muted">
                                上次作答：{m.last.answer} · 累计做错{" "}
                                {m.wrongCount} 次
                              </p>
                              {m.last.reason && (
                                <p className="muted">
                                  我的发现：{m.last.reason}
                                </p>
                              )}
                              {m.status !== "pending" && (
                                <div
                                  className="review-steps"
                                  aria-label={`已完成 ${m.reviewStep} 次间隔复习，共 3 次`}
                                >
                                  {[0, 1, 2].map((step) => (
                                    <i
                                      key={step}
                                      className={
                                        step < m.reviewStep ? "complete" : ""
                                      }
                                    />
                                  ))}
                                  <span>{m.reviewStep}/3 次复习完成</span>
                                </div>
                              )}
                              <div className="mistake-footer">
                                <span className="muted">
                                  {m.status === "pending"
                                    ? "再做一次，看看哪里卡住了"
                                    : m.status === "review"
                                      ? reviewDue
                                        ? `第 ${m.reviewStep + 1} 次回忆，今天可以开始`
                                        : `第 ${m.reviewStep + 1} 次复习安排在${friendlyChinaDate(m.dueAt!, now)}`
                                      : "完成了 3 次间隔复习，已经掌握"}
                                </span>
                                <button
                                  className="secondary"
                                  disabled={
                                    disabled ||
                                    (m.status === "review" && !reviewDue)
                                  }
                                  onClick={() =>
                                    void start(
                                      undefined,
                                      [m.question.id],
                                      m.status === "pending"
                                        ? "correction"
                                        : m.status === "review"
                                          ? "review"
                                          : "practice",
                                    )
                                  }
                                >
                                  {m.status === "pending"
                                    ? "我来订正"
                                    : m.status === "review"
                                      ? reviewDue
                                        ? `开始第 ${m.reviewStep + 1} 次复习`
                                        : "还没到复习时间"
                                      : "继续巩固"}{" "}
                                  <ArrowRight size={16} />
                                </button>
                              </div>
                              </article>
                            );
                          })}
                      </div>
                      {filteredMistakes.length === 0 && (
                        <div className="panel empty-state">
                          <CheckCircle2 size={42} />
                          <h2>
                            {mistakes.length
                              ? "这里还没有题目"
                              : "错题本还是空的"}
                          </h2>
                          <p>
                            {mistakes.length
                              ? "试试切换筛选条件。"
                              : "先去练一练，暂时不会的题会自动来到这里。"}
                          </p>
                          <button
                            className="primary"
                            onClick={() => void start()}
                            disabled={disabled}
                          >
                            开始练习
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {view === "review" && (
                    <>
                      <div className="stats-row">
                        <div className="mini-stat">
                          <span className="blue-text">{summary.today}</span>
                          <p>今天完成</p>
                        </div>
                        <div className="mini-stat">
                          <span className="green-text">
                            {summary.practice ? summary.accuracy + "%" : "—"}
                          </span>
                          <p>第一次作答正确率</p>
                        </div>
                        <div className="mini-stat">
                          <span className="orange">{summary.days}</span>
                          <p>累计学习天数</p>
                        </div>
                      </div>
                      <div className="review-grid">
                        <section className="panel review-panel">
                          <div className="section-heading">
                            <h2>第一次练习情况</h2>
                            <ChartNoAxesCombined size={21} />
                          </div>
                          <p className="muted">
                            只统计第一次作答，订正和复习会在错题本里继续成长。
                          </p>
                          {topics.map((t) => {
                            const metric = attemptMetrics.topicPractice.get(t.id);
                            const pct = metric?.total
                              ? Math.round((metric.correct / metric.total) * 100)
                              : 0;
                            return (
                              <div className="topic-progress" key={t.id}>
                                <div>
                                  <span>{t.name}</span>
                                  <b>
                                    {metric?.total
                                      ? `${metric.correct}/${metric.total} 题 · ${pct}%`
                                      : "还没练习"}
                                  </b>
                                </div>
                                <Progress
                                  value={pct}
                                  aria-label={`${t.name}第一次作答正确率 ${metric?.total ? `${metric.correct}/${metric.total} 题，${pct}%` : "还没练习"}`}
                                />
                              </div>
                            );
                          })}
                        </section>
                        <div className="review-right">
                          <section className="panel review-panel">
                            <div className="section-heading">
                              <h2>回忆小计划</h2>
                              <RotateCcw size={20} />
                            </div>
                            <p>
                              {pending.length
                                ? `先把 ${pending.length} 道错题想明白。`
                                : due.length
                                  ? `${due.length} 道题到了复习时间。`
                                  : "今天没有待完成的复习。"}
                            </p>
                            <p className="muted">
                              订正后按 1、3、7 天节奏回忆，完成 3 次才会标记“已掌握”。
                            </p>
                            <button
                              className="primary"
                              disabled={
                                disabled || (!pending.length && !due.length)
                              }
                              onClick={() =>
                                void start(
                                  undefined,
                                  (pending.length ? pending : due)
                                    .slice(0, 5)
                                    .map((m) => m.question.id),
                                  pending.length ? "correction" : "review",
                                )
                              }
                            >
                              {pending.length ? "开始订正" : "开始复习"}{" "}
                              <ArrowRight size={17} />
                            </button>
                          </section>
                          <section className="panel review-panel">
                            <h2>记下今天的小收获</h2>
                            <div
                              className="reflection-prompts"
                              aria-label="收获句子开头"
                            >
                              {["我学会了：", "我还想练：", "今天最难的是："].map(
                                (prompt) => (
                                  <button
                                    type="button"
                                    className="secondary"
                                    key={prompt}
                                    disabled={busy}
                                    onClick={() => {
                                      setReflection(prompt);
                                      setSuccess("");
                                    }}
                                  >
                                    {prompt}
                                  </button>
                                ),
                              )}
                            </div>
                            <label className="sr-only" htmlFor="reflection">
                              今天的小收获
                            </label>
                            <textarea
                              id="reflection"
                              value={reflection}
                              onChange={(e) => {
                                setReflection(e.target.value);
                                setSuccess("");
                              }}
                              placeholder="例如：我学会了个位满十要进一。"
                              maxLength={500}
                            />
                            <div className="section-heading">
                              <span className="muted">
                                {reflection.length}/500
                              </span>
                              <button
                                className="secondary"
                                disabled={disabled || !reflection.trim()}
                                onClick={() =>
                                  void run(async () => {
                                    reflectionId.current ||=
                                      crypto.randomUUID();
                                    await study.saveReflection({
                                      id: reflectionId.current,
                                      body: reflection,
                                      course_key: key,
                                    });
                                    reflectionId.current = "";
                                    setReflection("");
                                    setSuccess("今天的小收获已保存。");
                                  })
                                }
                              >
                                保存收获 <Check size={16} />
                              </button>
                            </div>
                          </section>
                        </div>
                      </div>
                      {state.reflections.filter((r) => r.course_key === key)
                        .length > 0 && (
                        <section className="panel reflection-history">
                          <h2>我的收获小记</h2>
                          {state.reflections
                            .filter((r) => r.course_key === key)
                            .map((r) => (
                              <article key={r.id}>
                                <time>{chinaDay(r.created_at)}</time>
                                <p>{r.body}</p>
                              </article>
                            ))}
                        </section>
                      )}
                      <section className="panel history-panel">
                        <h2>最近的学习足迹</h2>
                        {attempts.length === 0 ? (
                          <p className="muted">
                            第一道题完成后，就能在这里看见记录。
                          </p>
                        ) : (
                          attempts
                            .slice(-8)
                            .reverse()
                            .map((a) => (
                              <div className="history-item" key={a.id}>
                                <span
                                  className={
                                    "history-check " +
                                    (a.correct ? "correct" : "retry")
                                  }
                                >
                                  {a.correct ? (
                                    <Check size={17} />
                                  ) : (
                                    <RotateCcw size={16} />
                                  )}
                                </span>
                                <div>
                                  <p>{a.question.prompt}</p>
                                  <small>
                                    {a.mode === "practice"
                                      ? "练习"
                                      : a.mode === "correction"
                                        ? "订正"
                                        : "复习"}{" "}
                                    · {chinaDay(a.created_at)}
                                  </small>
                                </div>
                                <strong>
                                  {a.correct ? "答对了" : "再想想"}
                                </strong>
                              </div>
                            ))
                        )}
                      </section>
                    </>
                  )}
                </>
              )}
            </>
          )}
          {!queue.length && (
            <footer>
              <span>
                {storage === "cloud" ? (
                  <Cloud size={14} />
                ) : (
                  <HardDrive size={14} />
                )}{" "}
                {storage === "cloud"
                  ? "记录已保存到家长账户"
                  : "体验模式 · 记录仅保存在当前浏览器"}
              </span>
              <span>GoGo学堂 · 让每一次学习，都有小小收获</span>
            </footer>
          )}
        </div>
      </main>
      {!queue.length && (
        <nav className="mobile-bottom-nav" aria-label="主要学习页面">
          {navigation.map((item) => (
            <button
              type="button"
              key={item.id}
              className={view === item.id ? "active" : ""}
              aria-current={view === item.id ? "page" : undefined}
              disabled={!ready || busy}
              onClick={() => navigate(item.id)}
            >
              <span className="mobile-nav-icon">
                <item.icon size={20} />
                {item.id === "mistakes" && pending.length + due.length > 0 && (
                  <i>{Math.min(9, pending.length + due.length)}</i>
                )}
              </span>
              <span>{item.label.replace("我的", "")}</span>
            </button>
          ))}
        </nav>
      )}
      <Dialog
        open={leaveTarget !== null}
        onOpenChange={(open) => {
          if (!open) resumePractice();
        }}
      >
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restorePracticeFocus();
          }}
        >
          <DialogTitle>要先结束这次练习吗？</DialogTitle>
          <DialogDescription>
            已经提交的答案会保留，没做完的题下次还可以继续练习。
          </DialogDescription>
          <div className="button-row dialog-actions">
            <button className="secondary" onClick={resumePractice}>
              继续做题
            </button>
            <button
              className="primary"
              onClick={() => {
                if (leaveTarget) finishNavigation(leaveTarget);
              }}
            >
              结束并离开
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={settings} onOpenChange={setSettings}>
        <DialogContent className="settings-dialog">
          <DialogTitle>选择我的课程</DialogTitle>
          <DialogDescription>
            先选对教材，再按自己的节奏学习。
          </DialogDescription>
          <div className="settings-grid">
            {(Object.keys(courseOptions) as (keyof Course)[]).map((k) => (
              <Picker
                key={k}
                label={courseLabels[k]}
                value={draft[k]}
                values={courseOptions[k]}
                onChange={(v) => setDraft((d) => ({ ...d, [k]: v }))}
              />
            ))}
          </div>
          <p className="settings-note">
            {supportedCourse(draft)
              ? "已开放二年级上册数学知识点练习。教材修订版和单元顺序请以学校课本为准。"
              : "这门课程的内容还在准备中，可以先保存选择。"}
          </p>
          {notice && (
            <p className="message error" role="alert">
              {notice}
            </p>
          )}
          <button
            className="primary"
            disabled={disabled}
            onClick={() =>
              void run(async () => {
                await study.saveCourse(draft);
                setSettings(false);
                setQueue([]);
                setView("home");
                setSuccess("课程已保存。");
              })
            }
          >
            {busy ? "正在保存…" : "保存课程"} <Check size={18} />
          </button>
        </DialogContent>
      </Dialog>
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent>
          <DialogTitle>
            {storage === "cloud" ? "家长账户" : "家长来登录"}
          </DialogTitle>
          <DialogDescription>
            {storage === "cloud"
              ? "学习记录和错题会保存在此账户下。"
              : "请家长使用邮箱登录，为孩子保存学习记录。"}
          </DialogDescription>
          {storage === "cloud" ? (
            <>
              <p className="account-email">{study.email}</p>
              <p className="settings-note">
                退出后会回到本机体验。账户记录会继续保留。
              </p>
              <button
                className="secondary"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const client = await getSupabase();
                    if (!client) throw new Error("登录服务暂不可用，请稍后重试。");
                    const r = await client.auth.signOut();
                    if (r.error) throw new Error("退出失败，请重试。");
                    await study.reload();
                    setAuthOpen(false);
                    setQueue([]);
                  })
                }
              >
                <LogOut size={17} /> 退出登录
              </button>
            </>
          ) : !study.configured ? (
            <div className="empty-state compact">
              <BookOpen size={35} />
              <h3>家长账户暂未开放</h3>
              <p>
                现在可以直接体验练习、错题订正和复盘，记录保存在当前浏览器。
              </p>
              <button className="primary" onClick={() => setAuthOpen(false)}>
                继续体验
              </button>
            </div>
          ) : (
            <form
              className="auth-form"
              onSubmit={(e) => {
                e.preventDefault();
                void authSubmit();
              }}
            >
              <label className="field-label">
                家长邮箱
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  disabled={codeSent || busy}
                  placeholder="name@example.com"
                />
              </label>
              {codeSent && (
                <label className="field-label">
                  邮箱验证码
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={10}
                    placeholder="输入邮件中的验证码"
                  />
                </label>
              )}
              <p className="settings-note">
                本机体验记录与账户记录分别保存，登录后显示账户中的学习记录。
              </p>
              <button className="primary" disabled={busy}>
                {busy ? "请稍候…" : codeSent ? "验证并登录" : "发送验证码"}
              </button>
              {codeSent && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setCodeSent(false);
                    setCode("");
                    setAuthMessage("");
                  }}
                >
                  更换邮箱 / 重新发送
                </button>
              )}
            </form>
          )}
          {authMessage && (
            <p className="hint-box" role="status">
              {authMessage}
            </p>
          )}
          {notice && (
            <p className="message error" role="alert">
              {notice}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
