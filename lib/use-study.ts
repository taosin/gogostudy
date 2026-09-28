"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  emptyState,
  type StudyState,
  type Attempt,
  type Reflection,
  type Course,
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
            const parsed = JSON.parse(saved);
            if (
              Array.isArray(parsed.attempts) &&
              Array.isArray(parsed.reflections) &&
              parsed.course
            )
              next = parsed;
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
      let next = result.state;
      if (result.storage === "demo") {
        const saved = localStorage.getItem(DEMO_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (
              Array.isArray(parsed.attempts) &&
              Array.isArray(parsed.reflections) &&
              parsed.course
            )
              next = parsed;
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
  const saveAttempt = async (input: {
    id: string;
    questionId: string;
    answer: string;
    mode: Attempt["mode"];
    reason: string;
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
      commit(
        (s) => ({
          ...s,
          attempts: [
            ...s.attempts.filter((a) => a.id !== r.attempt.id),
            r.attempt,
          ],
        }),
        r.storage,
      );
      return r.attempt;
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
      commit((s) => ({ ...s, course: r.course }), r.storage);
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
      commit(
        (s) => ({
          ...s,
          reflections: [
            r.reflection,
            ...s.reflections.filter((f) => f.id !== r.reflection.id),
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
    saveAttempt,
    saveCourse,
    saveReflection,
  };
}
