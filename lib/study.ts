import { type Attempt } from "./catalog";

export const REVIEW_INTERVAL_DAYS = [1, 3, 7] as const;

export type Mistake = {
  question: Attempt["question"];
  last: Attempt;
  firstWrong: Attempt;
  status: "pending" | "review" | "mastered";
  dueAt: string | null;
  reviewStep: number;
  wrongCount: number;
};

const DAY_MS = 86_400_000;
const CHINA_OFFSET_MS = 8 * 60 * 60 * 1000;
const chinaDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const chinaShortDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  month: "long",
  day: "numeric",
});

function addDays(value: string, days: number) {
  return new Date(Date.parse(value) + days * DAY_MS).toISOString();
}

// Any answer that needed support returns to pending correction. An independent
// correction starts the review cycle, and only independent due reviews advance
// 1 / 3 / 7.
export function getMistakes(attempts: Attempt[]): Mistake[] {
  const grouped = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const key = a.course_key + "|" + a.question_id;
    const list = grouped.get(key) || [];
    list.push(a);
    grouped.set(key, list);
  }
  return [...grouped.values()]
    .flatMap((list) => {
      list.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
      const firstWrong = list.find(
        (a) => !a.correct || a.support_level !== "independent",
      );
      if (!firstWrong) return [];
      let status: Mistake["status"] = "pending",
        dueAt: string | null = null,
        reviewStep = 0;
      for (const a of list.slice(list.indexOf(firstWrong))) {
        if (!a.correct || a.support_level !== "independent") {
          status = "pending";
          dueAt = null;
          reviewStep = 0;
        } else if (
          status === "pending" &&
          a.mode === "correction" &&
          a.support_level === "independent"
        ) {
          status = "review";
          reviewStep = 0;
          dueAt = addDays(a.created_at, REVIEW_INTERVAL_DAYS[0]);
        } else if (
          status === "review" &&
          a.mode === "review" &&
          a.support_level === "independent" &&
          dueAt &&
          chinaDay(a.created_at) >= chinaDay(dueAt)
        ) {
          reviewStep += 1;
          if (reviewStep >= REVIEW_INTERVAL_DAYS.length) {
            status = "mastered";
            dueAt = null;
          } else {
            dueAt = addDays(a.created_at, REVIEW_INTERVAL_DAYS[reviewStep]);
          }
        }
      }
      return [
        {
          question: firstWrong.question,
          last: list[list.length - 1],
          firstWrong,
          status,
          dueAt,
          reviewStep,
          wrongCount: list.filter((a) => !a.correct).length,
        },
      ];
    })
    .sort(
      (a, b) => Date.parse(b.last.created_at) - Date.parse(a.last.created_at),
    );
}
export function chinaDay(date: Date | string = new Date()) {
  return chinaDayFormatter.format(new Date(date));
}
export function millisecondsUntilNextChinaDay(now = Date.now()) {
  const chinaTime = now + CHINA_OFFSET_MS;
  const nextDay = (Math.floor(chinaTime / DAY_MS) + 1) * DAY_MS;
  return nextDay - chinaTime;
}
export function friendlyChinaDate(
  value: Date | string | number,
  now: Date | string | number = new Date(),
) {
  const target = new Date(value);
  const current = new Date(now);
  const targetDay = chinaDay(target);
  if (targetDay === chinaDay(current)) return "今天";
  if (targetDay === chinaDay(new Date(current.getTime() + DAY_MS))) return "明天";
  return chinaShortDateFormatter.format(target);
}
export function stats(attempts: Attempt[], now: Date | string = new Date()) {
  const current = new Date(now);
  const todayKey = chinaDay(current);
  const activeDays = new Set<string>();
  const uniquePractice = new Set<string>();
  const todayPracticeIds = new Set<string>();
  let practice = 0,
    correct = 0,
    today = 0,
    todayPractice = 0;
  for (const attempt of attempts) {
    const day = chinaDay(attempt.created_at);
    activeDays.add(day);
    if (day === todayKey) today += 1;
    if (attempt.mode !== "practice") continue;
    uniquePractice.add(attempt.question_id);
    if (day === todayKey) todayPracticeIds.add(attempt.question_id);
    if (attempt.support_level !== "independent") continue;
    practice += 1;
    if (attempt.correct) correct += 1;
  }
  todayPractice = todayPracticeIds.size;
  let streak = 0;
  const start = activeDays.has(todayKey) ? 0 : 1;
  for (let offset = start; ; offset += 1) {
    const day = chinaDay(new Date(current.getTime() - offset * DAY_MS));
    if (!activeDays.has(day)) break;
    streak += 1;
  }
  return {
    total: attempts.length,
    practice,
    uniquePractice: uniquePractice.size,
    correct,
    accuracy: practice ? Math.round((correct / practice) * 100) : 0,
    today,
    todayPractice,
    days: activeDays.size,
    streak,
  };
}

export type TodayTask = {
  kind: "correction" | "review" | "practice";
  count: number;
  ids: string[];
};

export function getTodayTask(
  mistakes: Mistake[],
  now: Date | string | number = new Date(),
  limit = 5,
): TodayTask {
  const pending = mistakes.filter((m) => m.status === "pending").slice(0, limit);
  if (pending.length)
    return {
      kind: "correction",
      count: pending.length,
      ids: pending.map((m) => m.question.id),
    };
  const todayKey = chinaDay(new Date(now));
  const due = mistakes
    .filter(
      (m) =>
        m.status === "review" &&
        Boolean(m.dueAt) &&
        chinaDay(m.dueAt!) <= todayKey,
    )
    .slice(0, limit);
  if (due.length)
    return {
      kind: "review",
      count: due.length,
      ids: due.map((m) => m.question.id),
    };
  return { kind: "practice", count: limit, ids: [] };
}

export function rotateForChinaDay<T>(values: readonly T[], date: Date | string) {
  if (!values.length) return [];
  const dayNumber = Math.floor(
    Date.parse(`${chinaDay(date)}T00:00:00.000Z`) / DAY_MS,
  );
  const start = ((dayNumber % values.length) + values.length) % values.length;
  return [...values.slice(start), ...values.slice(0, start)];
}
