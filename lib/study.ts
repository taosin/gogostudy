import { type Attempt } from "./catalog";
export type Mistake = {
  question: Attempt["question"];
  last: Attempt;
  firstWrong: Attempt;
  status: "pending" | "review" | "mastered";
  dueAt: string | null;
  wrongCount: number;
};
// Correcting immediately is different from remembering it the next day.
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
      const firstWrong = list.find((a) => !a.correct);
      if (!firstWrong) return [];
      let status: Mistake["status"] = "pending",
        dueAt: string | null = null;
      for (const a of list.slice(list.indexOf(firstWrong))) {
        if (!a.correct) {
          status = "pending";
          dueAt = null;
        } else if (status === "pending") {
          status = "review";
          dueAt = new Date(
            new Date(a.created_at).getTime() + 86400000,
          ).toISOString();
        } else if (
          status === "review" &&
          a.mode === "review" &&
          dueAt &&
          Date.parse(a.created_at) >= Date.parse(dueAt)
        ) {
          status = "mastered";
          dueAt = null;
        }
      }
      return [
        {
          question: firstWrong.question,
          last: list[list.length - 1],
          firstWrong,
          status,
          dueAt,
          wrongCount: list.filter((a) => !a.correct).length,
        },
      ];
    })
    .sort(
      (a, b) => Date.parse(b.last.created_at) - Date.parse(a.last.created_at),
    );
}
export function chinaDay(date: Date | string = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}
export function stats(attempts: Attempt[]) {
  const practices = attempts.filter((a) => a.mode === "practice");
  const correct = practices.filter((a) => a.correct).length;
  return {
    total: attempts.length,
    practice: practices.length,
    correct,
    accuracy: practices.length
      ? Math.round((correct / practices.length) * 100)
      : 0,
    today: attempts.filter((a) => chinaDay(a.created_at) === chinaDay()).length,
    days: new Set(attempts.map((a) => chinaDay(a.created_at))).size,
  };
}
