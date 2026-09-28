import { CalendarDays, CheckCircle2, Heart, RotateCcw } from "lucide-react";
import type {
  WeeklyReport as WeeklyReportData,
  WeeklySkillLevel,
} from "@/lib/weekly-report";

export type WeeklyReportProps = {
  report: WeeklyReportData;
};

const skillLabels: Record<
  WeeklySkillLevel,
  { label: string; className: string }
> = {
  insufficient: {
    label: "继续积累",
    className: "bg-slate-100 text-slate-600",
  },
  steady: {
    label: "状态不错",
    className: "bg-emerald-100 text-emerald-700",
  },
  developing: {
    label: "正在进步",
    className: "bg-blue-100 text-blue-700",
  },
  "needs-practice": {
    label: "适合再练",
    className: "bg-amber-100 text-amber-800",
  },
};

function shortDate(value: string) {
  const [, month, day] = value.split("-");
  return `${Number(month)}月${Number(day)}日`;
}

export function WeeklyReport({ report }: WeeklyReportProps) {
  const metrics = [
    { label: "学习天数", value: `${report.learningDays} 天` },
    { label: "普通练习", value: `${report.practiceCount} 题` },
    {
      label: "独立作答正确率",
      value:
        report.practiceAccuracy === null ? "还没有" : `${report.practiceAccuracy}%`,
    },
    { label: "正确订正", value: `${report.correctedCount} 题` },
    { label: "完成复习", value: `${report.reviewedCount} 题` },
  ];

  return (
    <section
      className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      aria-labelledby="weekly-report-title"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-[0.12em] text-blue-700">
            <CalendarDays aria-hidden="true" size={15} /> 家长周报
          </p>
          <h2 id="weekly-report-title" className="text-xl font-bold text-slate-800">
            这一周的学习小结
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
          {shortDate(report.startDay)}—{shortDate(report.endDay)}
        </span>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((metric) => (
          <div className="rounded-2xl bg-slate-50 p-4" key={metric.label}>
            <dt className="text-xs text-slate-500">{metric.label}</dt>
            <dd className="mt-1 text-xl font-bold text-slate-800">
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        看过提示或跟着引导完成的题会计入普通练习题数，不进入独立作答正确率和技能建议。
      </p>

      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-slate-700">
        <Heart
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-rose-500"
          size={19}
        />
        <div>
          <h3 className="font-bold text-slate-800">这一周常见的小卡点</h3>
          <p className="mt-1 leading-6">
            {report.topReason
              ? `“${report.topReason.reason}”记录了 ${report.topReason.count} 次。知道卡在哪里，就更容易找到下一步。`
              : "还没有记录错因。下次订正时，可以和孩子一起说说哪里卡住了。"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <RotateCcw aria-hidden="true" className="text-blue-600" size={19} />
          <h3 className="font-bold text-slate-800">技能学习状态</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {report.skills.map((skill) => {
            const status = skillLabels[skill.level];
            return (
              <article
                className="rounded-2xl border border-slate-200 p-4"
                key={skill.skillId}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-800">{skill.name}</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      独立练习 {skill.practiceCount} 次 · {skill.uniqueQuestionCount} 道不同题
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>
                {skill.level === "insufficient" ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    完成至少 3 次练习、覆盖 2 道不同题后，再给出学习建议。
                  </p>
                ) : (
                  <>
                    <div className="mt-3 flex items-center gap-3">
                      <div
                        className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-label={`${skill.name}独立练习正确率`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={skill.accuracy ?? 0}
                      >
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${skill.accuracy ?? 0}%` }}
                        />
                      </div>
                      <strong className="text-sm text-slate-700">
                        {skill.correctCount}/{skill.practiceCount}
                      </strong>
                    </div>
                    <p className="mt-3 flex items-start gap-1.5 text-sm leading-6 text-slate-600">
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-emerald-600"
                        size={16}
                      />
                      {skill.recommendation}
                    </p>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
