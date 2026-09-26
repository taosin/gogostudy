"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  emptyState,
  type StudyState,
  type Attempt,
  type Reflection,
  type Course,
} from "./catalog";
import { getSupabase } from "./supabase/browser";
const DEMO_KEY = "gogostudy.demo.v1";
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const client = getSupabase();
  const session = client ? await client.auth.getSession() : null;
  if (session?.error) throw new Error("登录状态读取失败，请重试。");
  const token = session?.data.session?.access_token;
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "请求失败，请重试。");
  return data;
}
export function useStudy() {
  const [state, setState] = useState<StudyState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [storage, setStorage] = useState<"demo" | "cloud">("demo");
  const [email, setEmail] = useState("");
  const [configured, setConfigured] = useState(false);
  const stateRef = useRef(state);
  const requestId = useRef(0);
  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const result = await api<{
        state: StudyState;
        storage: "demo" | "cloud";
        configured: boolean;
      }>("/api/state");
      if (id !== requestId.current) return;
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
      const session = await getSupabase()?.auth.getSession();
      if (id === requestId.current)
        setEmail(session?.data.session?.user.email || "");
    } catch (e) {
      if (id === requestId.current)
        setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const generation = requestId;
    // Schedule initial hydration without synchronously updating state inside the effect.
    const timer = setTimeout(() => void reload(), 0);
    const client = getSupabase();
    const subscription = client?.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT")
        setTimeout(() => void reload(), 0);
    });
    return () => {
      clearTimeout(timer);
      generation.current++;
      subscription?.data.subscription.unsubscribe();
    };
  }, [reload]);
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
    const r = await api<{ attempt: Attempt; storage: "demo" | "cloud" }>(
      "/api/attempts",
      input,
    );
    if (r.storage !== storage)
      throw new Error("登录状态已变化，请刷新页面后重试。");
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
  };
  const saveCourse = async (course: Course) => {
    const r = await api<{ course: Course; storage: "demo" | "cloud" }>(
      "/api/settings",
      course,
    );
    if (r.storage !== storage)
      throw new Error("登录状态已变化，请刷新后重试。");
    commit((s) => ({ ...s, course: r.course }), r.storage);
  };
  const saveReflection = async (input: {
    id: string;
    body: string;
    course_key: string;
  }) => {
    const r = await api<{ reflection: Reflection; storage: "demo" | "cloud" }>(
      "/api/reflections",
      input,
    );
    if (r.storage !== storage)
      throw new Error("登录状态已变化，请刷新后重试。");
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
  };
  return {
    state,
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
