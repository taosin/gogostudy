import type { Attempt } from "./catalog";

const DAY_MS = 86_400_000;
const REPORT_DAYS = 7;
const chinaDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export type WeeklySkillDefinition = {
  id: string;
  name: string;
};

export type WeeklySkillLevel =
  | "insufficient"
  | "steady"
  | "developing"
  | "needs-practice";

export type WeeklySkillReport = {
  skillId: string;
  name: string;
  practiceCount: number;
  correctCount: number;
  uniqueQuestionCount: number;
  accuracy: number | null;
  level: WeeklySkillLevel;
  recommendation: string | null;
};

export type WeeklyReason = {
  reason: string;
  count: number;
};

export type WeeklyReport = {
  startDay: string;
  endDay: string;
  learningDays: number;
  practiceCount: number;
  independentPracticeCount: number;
  independentPracticeCorrectCount: number;
  practiceAccuracy: number | null;
  correctedCount: number;
  reviewedCount: number;
  topReason: WeeklyReason | null;
  skills: WeeklySkillReport[];
};

export type WeeklyReportOptions = {
  now?: Date | string | number;
  getSkillId?: (attempt: Attempt) => string;
};

type SkillAccumulator = {
  count: number;
  correct: number;
  questionIds: Set<string>;
};

function chinaDay(value: Date | string | number) {
  return chinaDayFormatter.format(new Date(value));
}

function dayNumber(value: Date | string | number) {
  const parsed = Date.parse(`${chinaDay(value)}T00:00:00.000Z`);
  return Math.floor(parsed / DAY_MS);
}

function dayFromNumber(value: number) {
  return new Date(value * DAY_MS).toISOString().slice(0, 10);
}

function skillLevel(
  practiceCount: number,
  uniqueQuestionCount: number,
  accuracy: number | null,
): Pick<WeeklySkillReport, "level" | "recommendation"> {
  if (practiceCount < 3 || uniqueQuestionCount < 2) {
    return { level: "insufficient", recommendation: null };
  }
  if ((accuracy ?? 0) >= 80) {
    return {
      level: "steady",
      recommendation: "这个技能已经比较熟悉，保持现在的练习节奏。",
    };
  }
  if ((accuracy ?? 0) >= 60) {
    return {
      level: "developing",
      recommendation: "正在慢慢掌握，可以再练两道不同题型。",
    };
  }
  return {
    level: "needs-practice",
    recommendation: "建议一起读题、说思路，再完成一次小练习。",
  };
}

/**
 * Summarizes attempts that already belong to one course pack. The window is
 * the current China calendar day plus the six preceding China calendar days.
 */
export function getWeeklyReport(
  attempts: readonly Attempt[],
  skillDefinitions: readonly WeeklySkillDefinition[],
  options: WeeklyReportOptions = {},
): WeeklyReport {
  const now = options.now ?? new Date();
  const end = dayNumber(now);
  const start = end - (REPORT_DAYS - 1);
  const getSkillId =
    options.getSkillId ??
    ((attempt: Attempt) =>
      attempt.skill_id || attempt.question.skillId || attempt.question.topic);
  const seenAttemptIds = new Set<string>();
  const learningDayKeys = new Set<string>();
  const reasonCounts = new Map<string, number>();
  const skillMetrics = new Map<string, SkillAccumulator>();
  let practiceCount = 0;
  let independentPracticeCount = 0;
  let independentPracticeCorrectCount = 0;
  let correctedCount = 0;
  let reviewedCount = 0;

  for (const attempt of attempts) {
    if (seenAttemptIds.has(attempt.id)) continue;
    seenAttemptIds.add(attempt.id);

    const createdAt = Date.parse(attempt.created_at);
    if (!Number.isFinite(createdAt)) continue;
    const attemptDay = dayNumber(createdAt);
    if (attemptDay < start || attemptDay > end) continue;

    learningDayKeys.add(chinaDay(createdAt));
    const reason = attempt.reason.trim();
    if (reason) reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
    const independentlyAnswered =
      attempt.support_level === undefined ||
      attempt.support_level === "independent";

    if (attempt.mode === "correction") {
      if (attempt.correct && independentlyAnswered) correctedCount += 1;
      continue;
    }
    if (attempt.mode === "review") {
      if (attempt.correct && independentlyAnswered) reviewedCount += 1;
      continue;
    }

    practiceCount += 1;
    if (!independentlyAnswered) continue;

    independentPracticeCount += 1;
    if (attempt.correct) independentPracticeCorrectCount += 1;
    const skillId = getSkillId(attempt);
    const metric = skillMetrics.get(skillId) ?? {
      count: 0,
      correct: 0,
      questionIds: new Set<string>(),
    };
    metric.count += 1;
    if (attempt.correct) metric.correct += 1;
    metric.questionIds.add(attempt.question_id);
    skillMetrics.set(skillId, metric);
  }

  const topReason = [...reasonCounts.entries()]
    .sort(
      ([reasonA, countA], [reasonB, countB]) =>
        countB - countA || reasonA.localeCompare(reasonB, "zh-CN"),
    )
    .map(([reason, count]) => ({ reason, count }))[0] ?? null;

  const skills = skillDefinitions.map(({ id, name }) => {
    const metric = skillMetrics.get(id);
    const count = metric?.count ?? 0;
    const correct = metric?.correct ?? 0;
    const uniqueQuestionCount = metric?.questionIds.size ?? 0;
    const accuracy = count ? Math.round((correct / count) * 100) : null;
    return {
      skillId: id,
      name,
      practiceCount: count,
      correctCount: correct,
      uniqueQuestionCount,
      accuracy,
      ...skillLevel(count, uniqueQuestionCount, accuracy),
    } satisfies WeeklySkillReport;
  });

  return {
    startDay: dayFromNumber(start),
    endDay: dayFromNumber(end),
    learningDays: learningDayKeys.size,
    practiceCount,
    independentPracticeCount,
    independentPracticeCorrectCount,
    practiceAccuracy: independentPracticeCount
      ? Math.round(
          (independentPracticeCorrectCount / independentPracticeCount) * 100,
        )
      : null,
    correctedCount,
    reviewedCount,
    topReason,
    skills,
  };
}
