export const practiceViews = ["home", "practice", "mistakes", "review"] as const;
export type PracticeView = (typeof practiceViews)[number];
export type PracticeTarget = PracticeView | "settings" | "parent";

export function practiceTargetFromHash(hash: string): PracticeTarget {
  const target = hash.replace(/^#/, "");
  return target === "settings" || target === "parent" || practiceViews.some((view) => view === target)
    ? target as PracticeTarget
    : "home";
}

export function practiceViewForTarget(target: PracticeTarget): PracticeView {
  return target === "settings" || target === "parent" ? "home" : target;
}

export function practiceHref(target: PracticeTarget): string {
  return target === "home" ? "/practice" : `/practice#${target}`;
}
