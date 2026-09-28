import type { Mistake } from "./study";

export type DailyPlanKind = "correction" | "review" | "practice";

export type DailyPlanLane = {
  kind: DailyPlanKind;
  count: number;
  total: number;
  ids: string[];
};

export type DailyPlan = {
  correction: DailyPlanLane;
  review: DailyPlanLane;
  practice: DailyPlanLane;
  recommended: DailyPlanKind | null;
};

export type DailyPlanOptions = {
  correctionLimit?: number;
  reviewLimit?: number;
  practiceCount?: number;
};

const DEFAULT_LIMIT = 5;

function nonNegativeInteger(value: number | undefined, fallback: number) {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

function timestamp(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function chinaDay(value: Date | string | number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

/**
 * Builds three independent task lanes. Corrections never hide due reviews,
 * and the oldest unresolved work is selected first in each capped lane.
 */
export function getDailyPlan(
  mistakes: readonly Mistake[],
  now: Date | string | number = new Date(),
  options: DailyPlanOptions = {},
): DailyPlan {
  const correctionLimit = nonNegativeInteger(
    options.correctionLimit,
    DEFAULT_LIMIT,
  );
  const reviewLimit = nonNegativeInteger(options.reviewLimit, DEFAULT_LIMIT);
  const practiceCount = nonNegativeInteger(
    options.practiceCount,
    DEFAULT_LIMIT,
  );
  const today = chinaDay(now);

  const corrections = mistakes
    .filter((mistake) => mistake.status === "pending")
    .sort(
      (a, b) =>
        timestamp(a.last.created_at) - timestamp(b.last.created_at) ||
        a.question.id.localeCompare(b.question.id),
    );
  const reviews = mistakes
    .filter(
      (mistake) =>
        mistake.status === "review" &&
        Boolean(mistake.dueAt) &&
        chinaDay(mistake.dueAt!) <= today,
    )
    .sort(
      (a, b) =>
        timestamp(a.dueAt) - timestamp(b.dueAt) ||
        timestamp(a.last.created_at) - timestamp(b.last.created_at) ||
        a.question.id.localeCompare(b.question.id),
    );

  const correctionIds = corrections
    .slice(0, correctionLimit)
    .map((mistake) => mistake.question.id);
  const reviewIds = reviews
    .slice(0, reviewLimit)
    .map((mistake) => mistake.question.id);
  const recommended: DailyPlanKind | null = correctionIds.length
    ? "correction"
    : reviewIds.length
      ? "review"
      : practiceCount
        ? "practice"
        : null;

  return {
    correction: {
      kind: "correction",
      count: correctionIds.length,
      total: corrections.length,
      ids: correctionIds,
    },
    review: {
      kind: "review",
      count: reviewIds.length,
      total: reviews.length,
      ids: reviewIds,
    },
    practice: {
      kind: "practice",
      count: practiceCount,
      total: practiceCount,
      ids: [],
    },
    recommended,
  };
}
