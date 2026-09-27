"use client";

import type { Question } from "./catalog";

const questionRequests = new Map<string, Promise<Question[]>>();

export function loadQuestions(course: string) {
  const cached = questionRequests.get(course);
  if (cached) return cached;

  const path = `/api/questions?course=${encodeURIComponent(course)}`;
  const request = fetch(path, {
    cache: "default",
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      const data = (await response.json()) as {
        questions?: Question[];
        error?: string;
      };
      if (!response.ok)
        throw new Error(data.error || "题目加载失败，请稍后重试。");
      return data.questions || [];
    })
    .catch((error) => {
      questionRequests.delete(course);
      throw error;
    });

  questionRequests.set(course, request);
  return request;
}

export function preloadQuestions(course: string) {
  void loadQuestions(course).catch(() => {
    // A later user action retries because failed requests are removed above.
  });
}
