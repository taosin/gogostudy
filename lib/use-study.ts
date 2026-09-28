"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  emptyState,
  type StudyState,
  type Attempt,
  type Reflection,
  type Course,
  type Question,
  type QuestionDifficulty,
  type QuestionReviewStatus,
  type QuestionType,
  type QuestionVisual,
  type SupportLevel,
  LEGACY_CONTENT_VERSION,
  LEGACY_PACKAGE_ID,
  courseForPackageId,
  courseKey,
  legacyCourse,
  normalizeCourse,
  normalizeCourseKey,
} from "./catalog";
import { getSupabase, isSupabaseConfigured } from "./supabase/browser";
const DEMO_KEY = "gogostudy.demo.v1";
const REQUEST_TIMEOUT_MS = 20_000;
type AuthContext = {
  userId: string | null | undefined;
  generation: number;
};
type ApiOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  expectedUserId?: string | null;
};
class AuthChangedError extends Error {
  constructor() {
    super("登录状态已变化，请重试。");
  }
}
export function isSameAuthContext(
  started: AuthContext,
  current: AuthContext,
) {
  return (
    started.generation === current.generation &&
    started.userId === current.userId
  );
}
async function apiRequest<T>(
  path: string,
  body?: unknown,
  options: ApiOptions = {},
) {
  const client = await getSupabase();
  const session = client ? await client.auth.getSession() : null;
  if (session?.error) throw new Error("登录状态读取失败，请重试。");
  const activeSession = session?.data.session;
  const token = activeSession?.access_token;
  const userId = activeSession?.user.id || null;
  if (
    options.expectedUserId !== undefined &&
    options.expectedUserId !== userId
  )
    throw new AuthChangedError();

  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener("abort", abort, { once: true });
  const timeout = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(path, {
      method: body ? "POST" : "GET",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "请求失败，请重试。");
    return {
      data: data as T,
      auth: { userId, email: activeSession?.user.email || "" },
    };
  } catch (error) {
    if (timedOut) throw new Error("请求超时，请检查网络后重试。");
    if (controller.signal.aborted) throw new Error("请求已取消，请重试。");
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}
export async function api<T>(
  path: string,
  body?: unknown,
  options: Pick<ApiOptions, "signal" | "timeoutMs"> = {},
): Promise<T> {
  return (await apiRequest<T>(path, body, options)).data;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function oneOf<T extends string>(
  value: unknown,
  choices: readonly T[],
  fallback: T,
) {
  return typeof value === "string" && choices.includes(value as T)
    ? (value as T)
    : fallback;
}

function normalizeVisual(value: unknown): QuestionVisual | undefined {
  const visual = record(value);
  if (!visual || typeof visual.type !== "string") return undefined;
  if (
    visual.type === "groups" &&
    typeof visual.groups === "number" &&
    typeof visual.each === "number"
  )
    return { type: "groups", groups: visual.groups, each: visual.each };
  if (
    visual.type === "clock" &&
    typeof visual.hour === "number" &&
    typeof visual.minute === "number"
  )
    return { type: "clock", hour: visual.hour, minute: visual.minute };
  if (visual.type === "classification" && Array.isArray(visual.items)) {
    const items = visual.items.flatMap((item) => {
      const entry = record(item);
      return entry &&
        typeof entry.label === "string" &&
        typeof entry.category === "string"
        ? [{ label: entry.label, category: entry.category }]
        : [];
    });
    if (items.length === visual.items.length)
      return { type: "classification", items };
  }
  if (
    visual.type === "ruler" &&
    typeof visual.start === "number" &&
    typeof visual.end === "number"
  ) {
    const unit =
      visual.unit === "厘米" || visual.unit === "米" ? visual.unit : undefined;
    return {
      type: "ruler",
      start: visual.start,
      end: visual.end,
      ...(unit ? { unit } : {}),
    };
  }
  return undefined;
}

function normalizeQuestion(
  value: unknown,
  attempt: Record<string, unknown>,
): Question | null {
  const question = record(value);
  if (!question) return null;
  const id = textValue(question.id, textValue(attempt.question_id));
  const topic = textValue(question.topic);
  const prompt = textValue(question.prompt);
  const hint = textValue(question.hint);
  if (!id || !topic || !prompt) return null;
  const packageId = textValue(
    attempt.package_id,
    textValue(question.packageId, LEGACY_PACKAGE_ID),
  );
  const contentVersion = textValue(
    attempt.content_version,
    textValue(question.contentVersion, LEGACY_CONTENT_VERSION),
  );
  const unitId = textValue(
    attempt.unit_id,
    textValue(question.unitId, `legacy-unit-${topic}`),
  );
  const skillId = textValue(
    attempt.skill_id,
    textValue(question.skillId, `legacy-skill-${topic}`),
  );
  const options = Array.isArray(question.options)
    ? question.options.filter((item): item is string => typeof item === "string")
    : undefined;
  const difficulty = oneOf<QuestionDifficulty>(
    attempt.difficulty ?? question.difficulty,
    ["foundation", "application", "reasoning"],
    "foundation",
  );
  const questionType = oneOf<QuestionType>(
    attempt.question_type ?? question.questionType,
    ["numeric", "choice"],
    options?.length ? "choice" : "numeric",
  );
  const reviewStatus = oneOf<QuestionReviewStatus>(
    attempt.review_status ?? question.reviewStatus,
    ["draft", "reviewed"],
    "reviewed",
  );
  const visual = normalizeVisual(question.visual);
  return {
    id,
    topic,
    prompt,
    packageId,
    contentVersion,
    unitId,
    skillId,
    difficulty,
    questionType,
    variantGroup: textValue(
      attempt.variant_group,
      textValue(question.variantGroup, `legacy-${id}`),
    ),
    author: "original",
    reviewStatus,
    ...(hint ? { hint } : {}),
    ...(options?.length ? { options } : {}),
    ...(typeof question.unit === "string" ? { unit: question.unit } : {}),
    ...(visual ? { visual } : {}),
  };
}

function normalizeAttempt(value: unknown): Attempt | null {
  const attempt = record(value);
  if (!attempt) return null;
  const question = normalizeQuestion(attempt.question, attempt);
  if (!question) return null;
  const packageId = textValue(attempt.package_id, question.packageId);
  const packageCourse = courseForPackageId(packageId);
  const rawCourseKey = normalizeCourseKey(attempt.course_key);
  const normalizedCourseKey = packageCourse
    ? courseKey(packageCourse)
    : rawCourseKey;
  const mode = oneOf<Attempt["mode"]>(
    attempt.mode,
    ["practice", "correction", "review"],
    "practice",
  );
  const supportLevel = oneOf<SupportLevel>(
    attempt.support_level,
    ["independent", "hint", "guided"],
    "independent",
  );
  const id = textValue(attempt.id);
  const createdAt = textValue(attempt.created_at);
  if (!id || !createdAt) return null;
  return {
    id,
    question_id: textValue(attempt.question_id, question.id),
    course_key: normalizedCourseKey,
    package_id: packageId,
    content_version: textValue(
      attempt.content_version,
      question.contentVersion,
    ),
    unit_id: textValue(attempt.unit_id, question.unitId),
    skill_id: textValue(attempt.skill_id, question.skillId),
    difficulty: oneOf<QuestionDifficulty>(
      attempt.difficulty,
      ["foundation", "application", "reasoning"],
      question.difficulty,
    ),
    question_type: oneOf<QuestionType>(
      attempt.question_type,
      ["numeric", "choice"],
      question.questionType,
    ),
    variant_group: textValue(attempt.variant_group, question.variantGroup),
    review_status: oneOf<QuestionReviewStatus>(
      attempt.review_status,
      ["draft", "reviewed"],
      question.reviewStatus,
    ),
    support_level: supportLevel,
    answer: textValue(attempt.answer),
    correct: attempt.correct === true,
    mode,
    reason: textValue(attempt.reason),
    created_at: createdAt,
    question,
    expected: textValue(attempt.expected),
    explanation: textValue(attempt.explanation),
  };
}

function normalizeReflection(value: unknown): Reflection | null {
  const reflection = record(value);
  if (!reflection) return null;
  const id = textValue(reflection.id);
  const body = textValue(reflection.body);
  const createdAt = textValue(reflection.created_at);
  if (!id || !body || !createdAt) return null;
  return {
    id,
    body,
    created_at: createdAt,
    course_key: normalizeCourseKey(reflection.course_key),
  };
}

export function normalizeStudyState(value: unknown): StudyState {
  const input = record(value);
  if (!input) return emptyState();
  const attempts = Array.isArray(input.attempts)
    ? input.attempts.flatMap((item) => {
        const normalized = normalizeAttempt(item);
        return normalized ? [normalized] : [];
      })
    : [];
  const latestAttempt = attempts.at(-1);
  const attemptCourse = latestAttempt
    ? courseForPackageId(latestAttempt.package_id)
    : null;
  const inferredCourse = latestAttempt
    ? attemptCourse || { ...legacyCourse }
    : emptyState().course;
  return {
    course:
      input.course === undefined || input.course === null
        ? inferredCourse
        : normalizeCourse(input.course),
    attempts,
    reflections: Array.isArray(input.reflections)
      ? input.reflections.flatMap((item) => {
          const normalized = normalizeReflection(item);
          return normalized ? [normalized] : [];
        })
      : [],
  };
}

export function useStudy() {
  const [state, setState] = useState<StudyState>(emptyState);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(() => isSupabaseConfigured());
  const [error, setError] = useState("");
  const [storage, setStorage] = useState<"demo" | "cloud">("demo");
  const [email, setEmail] = useState("");
  const [configured, setConfigured] = useState(() => isSupabaseConfigured());
  const stateRef = useRef(state);
  const requestId = useRef(0);
  const authContext = useRef<AuthContext>({ userId: undefined, generation: 0 });
  const activeRequests = useRef(new Set<AbortController>());
  const abortActiveRequests = useCallback(() => {
    for (const controller of activeRequests.current) controller.abort();
    activeRequests.current.clear();
  }, []);
  const requestController = useCallback(() => {
    const controller = new AbortController();
    activeRequests.current.add(controller);
    return controller;
  }, []);
  const reload = useCallback(async () => {
    const id = ++requestId.current;
    const controller = requestController();
    if (isSupabaseConfigured()) setLoading(true);
    setError("");
    try {
      if (!isSupabaseConfigured()) {
        let next = emptyState();
        const saved = localStorage.getItem(DEMO_KEY);
        if (saved) {
          try {
            next = normalizeStudyState(JSON.parse(saved));
          } catch {
            throw new Error(
              "本机体验记录无法读取，请更换浏览器体验，或登录后使用云端记录。",
            );
          }
        }
        if (id !== requestId.current) return;
        stateRef.current = next;
        setState(next);
        setStorage("demo");
        setConfigured(false);
        setEmail("");
        return;
      }
      const response = await apiRequest<{
        state: StudyState;
        storage: "demo" | "cloud";
        configured: boolean;
      }>("/api/state", undefined, { signal: controller.signal });
      if (id !== requestId.current) return;
      const result = response.data;
      let next = normalizeStudyState(result.state);
      if (result.storage === "demo") {
        const saved = localStorage.getItem(DEMO_KEY);
        if (saved) {
          try {
            next = normalizeStudyState(JSON.parse(saved));
          } catch {
            throw new Error(
              "本机体验记录无法读取，请更换浏览器体验，或登录后使用云端记录。",
            );
          }
        }
      }
      stateRef.current = next;
      setState(next);
      setStorage(result.storage);
      setConfigured(result.configured);
      authContext.current = {
        userId: response.auth.userId,
        generation: authContext.current.generation,
      };
      setEmail(response.auth.email);
    } catch (e) {
      if (id === requestId.current && !controller.signal.aborted)
        setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      activeRequests.current.delete(controller);
      if (id === requestId.current) {
        setLoading(false);
        setReady(true);
      }
    }
  }, [requestController]);
  useEffect(() => {
    const generation = requestId;
    // Schedule initial hydration without synchronously updating state inside the effect.
    const timer = setTimeout(() => void reload(), 0);
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void getSupabase()
      .then((client) => {
        if (!active || !client) return;
        const subscription = client.auth.onAuthStateChange((event, session) => {
          const nextUserId = session?.user.id || null;
          if (event === "INITIAL_SESSION") {
            if (authContext.current.userId === undefined)
              authContext.current = {
                ...authContext.current,
                userId: nextUserId,
              };
            return;
          }
          if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
            const previousUserId = authContext.current.userId;
            const identityChanged = previousUserId !== nextUserId;
            if (identityChanged) {
              authContext.current = {
                userId: nextUserId,
                generation: authContext.current.generation + 1,
              };
              requestId.current++;
              abortActiveRequests();
              const cleared = emptyState();
              stateRef.current = cleared;
              setState(cleared);
              setStorage("demo");
              setEmail(session?.user.email || "");
              setError("");
              setReady(false);
              setLoading(isSupabaseConfigured());
              setTimeout(() => void reload(), 0);
            }
          }
        });
        unsubscribe = () => subscription.data.subscription.unsubscribe();
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "登录服务初始化失败，请稍后重试。",
        );
      });
    return () => {
      active = false;
      clearTimeout(timer);
      generation.current++;
      abortActiveRequests();
      unsubscribe?.();
    };
  }, [abortActiveRequests, reload]);
  const commit = useCallback(
    (change: (current: StudyState) => StudyState, target: "demo" | "cloud") => {
      const next = change(stateRef.current);
      if (target === "demo") {
        try {
          localStorage.setItem(DEMO_KEY, JSON.stringify(next));
        } catch {
          throw new Error("浏览器无法保存记录，请允许本地存储或登录后重试。");
        }
      }
      stateRef.current = next;
      setState(next);
    },
    [],
  );
  const requestHint = async (input: {
    attemptId: string;
    questionId: string;
  }) => {
    const started = { ...authContext.current };
    const controller = requestController();
    try {
      const response = await apiRequest<{
        hint: string;
        hintReceipt?: string;
        storage: "demo" | "cloud";
      }>("/api/hints", input, {
        signal: controller.signal,
        expectedUserId: started.userId ?? null,
      });
      if (!isSameAuthContext(started, authContext.current))
        throw new AuthChangedError();
      const result = response.data;
      if ((result.storage === "cloud") !== Boolean(started.userId))
        throw new AuthChangedError();
      if (!result.hint) throw new Error("提示内容没有准备好，请重试。");
      return {
        hint: result.hint,
        hintReceipt: result.hintReceipt,
      };
    } catch (error) {
      if (!isSameAuthContext(started, authContext.current))
        throw new AuthChangedError();
      throw error;
    } finally {
      activeRequests.current.delete(controller);
    }
  };
  const saveAttempt = async (input: {
    id: string;
    questionId: string;
    answer: string;
    mode: Attempt["mode"];
    reason: string;
    workflowVersion?: string | null;
    hintReceipt?: string;
  }) => {
    const started = { ...authContext.current };
    const controller = requestController();
    try {
      const response = await apiRequest<{
        attempt: Attempt;
        storage: "demo" | "cloud";
      }>("/api/attempts", input, {
        signal: controller.signal,
        expectedUserId: started.userId ?? null,
      });
      if (!isSameAuthContext(started, authContext.current))
        throw new AuthChangedError();
      const r = response.data;
      if ((r.storage === "cloud") !== Boolean(started.userId))
        throw new AuthChangedError();
      const normalizedAttempt = normalizeAttempt(r.attempt);
      if (!normalizedAttempt)
        throw new Error("学习记录格式不正确，请刷新后重试。");
      commit(
        (s) => ({
          ...s,
          attempts: [
            ...s.attempts.filter((a) => a.id !== normalizedAttempt.id),
            normalizedAttempt,
          ],
        }),
        r.storage,
      );
      return normalizedAttempt;
    } catch (error) {
      if (!isSameAuthContext(started, authContext.current))
        throw new AuthChangedError();
      throw error;
    } finally {
      activeRequests.current.delete(controller);
    }
  };
  const saveCourse = async (course: Course) => {
    const started = { ...authContext.current };
    const controller = requestController();
    try {
      const response = await apiRequest<{
        course: Course;
        storage: "demo" | "cloud";
      }>("/api/settings", course, {
        signal: controller.signal,
        expectedUserId: started.userId ?? null,
      });
      if (!isSameAuthContext(started, authContext.current))
        throw new AuthChangedError();
      const r = response.data;
      if ((r.storage === "cloud") !== Boolean(started.userId))
        throw new AuthChangedError();
      commit(
        (s) => ({ ...s, course: normalizeCourse(r.course) }),
        r.storage,
      );
    } catch (error) {
      if (!isSameAuthContext(started, authContext.current))
        throw new AuthChangedError();
      throw error;
    } finally {
      activeRequests.current.delete(controller);
    }
  };
  const saveReflection = async (input: {
    id: string;
    body: string;
    course_key: string;
  }) => {
    const started = { ...authContext.current };
    const controller = requestController();
    try {
      const response = await apiRequest<{
        reflection: Reflection;
        storage: "demo" | "cloud";
      }>("/api/reflections", input, {
        signal: controller.signal,
        expectedUserId: started.userId ?? null,
      });
      if (!isSameAuthContext(started, authContext.current))
        throw new AuthChangedError();
      const r = response.data;
      if ((r.storage === "cloud") !== Boolean(started.userId))
        throw new AuthChangedError();
      const normalizedReflection = normalizeReflection(r.reflection);
      if (!normalizedReflection)
        throw new Error("学习小记格式不正确，请刷新后重试。");
      commit(
        (s) => ({
          ...s,
          reflections: [
            normalizedReflection,
            ...s.reflections.filter((f) => f.id !== normalizedReflection.id),
          ],
        }),
        r.storage,
      );
    } catch (error) {
      if (!isSameAuthContext(started, authContext.current))
        throw new AuthChangedError();
      throw error;
    } finally {
      activeRequests.current.delete(controller);
    }
  };
  return {
    state,
    ready,
    loading,
    error,
    storage,
    email,
    configured,
    reload,
    requestHint,
    saveAttempt,
    saveCourse,
    saveReflection,
  };
}
