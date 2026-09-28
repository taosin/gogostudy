"use client";

import { BookOpen, NotebookPen, RotateCcw, Sparkles } from "lucide-react";
import type { DailyPlan, DailyPlanKind } from "@/lib/daily-plan";

export type TaskCenterProps = {
  plan: DailyPlan;
  disabled?: boolean;
  onStartCorrection: (questionIds: string[]) => void;
  onStartReview: (questionIds: string[]) => void;
  onStartPractice: () => void;
};

const taskStyles: Record<
  DailyPlanKind,
  { icon: typeof BookOpen; iconClass: string; cardClass: string }
> = {
  correction: {
    icon: NotebookPen,
    iconClass: "bg-amber-100 text-amber-700",
    cardClass: "border-amber-200 bg-amber-50/70",
  },
  review: {
    icon: RotateCcw,
    iconClass: "bg-violet-100 text-violet-700",
    cardClass: "border-violet-200 bg-violet-50/70",
  },
  practice: {
    icon: BookOpen,
    iconClass: "bg-blue-100 text-blue-700",
    cardClass: "border-blue-200 bg-blue-50/70",
  },
};

export function TaskCenter({
  plan,
  disabled = false,
  onStartCorrection,
  onStartReview,
  onStartPractice,
}: TaskCenterProps) {
  const tasks = [
    {
      lane: plan.correction,
      title: "待订正",
      description: plan.correction.total
        ? `共有 ${plan.correction.total} 道，先把这 ${plan.correction.count} 道想明白。`
        : "今天没有等着订正的题。",
      action: "开始订正",
      onStart: () => onStartCorrection(plan.correction.ids),
    },
    {
      lane: plan.review,
      title: "到期复习",
      description: plan.review.total
        ? `有 ${plan.review.total} 道到了回忆时间，本轮安排 ${plan.review.count} 道。`
        : "今天的间隔复习已经完成。",
      action: "开始复习",
      onStart: () => onStartReview(plan.review.ids),
    },
    {
      lane: plan.practice,
      title: "新练习",
      description: plan.practice.count
        ? `探索 ${plan.practice.count} 道新题，按自己的节奏来。`
        : "今天的新练习目标已经完成。",
      action: "开始练习",
      onStart: onStartPractice,
    },
  ] as const;

  return (
    <section
      className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      aria-labelledby="task-center-title"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-[0.12em] text-blue-700">
            <Sparkles aria-hidden="true" size={15} /> 今天做什么
          </p>
          <h2 id="task-center-title" className="text-xl font-bold text-slate-800">
            三件小事，都能找到
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
          每轮最多 5 题
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {tasks.map(({ lane, title, description, action, onStart }) => {
          const style = taskStyles[lane.kind];
          const Icon = style.icon;
          const available = lane.count > 0;
          return (
            <article
              className={`flex min-h-56 flex-col rounded-2xl border p-4 ${style.cardClass}`}
              key={lane.kind}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span
                  className={`grid size-10 place-items-center rounded-xl ${style.iconClass}`}
                >
                  <Icon aria-hidden="true" size={21} />
                </span>
                {plan.recommended === lane.kind ? (
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    建议先做
                  </span>
                ) : null}
              </div>
              <h3 className="text-base font-bold text-slate-800">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                {description}
              </p>
              <button
                className="mt-4 min-h-11 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:shadow-none"
                type="button"
                disabled={disabled || !available}
                onClick={onStart}
              >
                {available
                  ? `${action} · ${lane.count} 道`
                  : lane.total
                    ? "稍后安排"
                    : "今天已完成"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
