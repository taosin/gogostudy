import { mathDomains, mathLessons, mathStages } from "../math-curriculum";
import type { SubjectCurriculum, SubjectId } from "../learning-types";

const mathCurriculum: SubjectCurriculum = {
  id: "math", title: "数学", tagline: "从数清数量，走向理解和运用。",
  description: "先数清一把积木，再理解加减；先学会分一分，再认识乘除和分数。",
  domains: mathDomains, stages: mathStages, lessons: mathLessons,
};

// Called by server pages: only the selected subject's full lessons reach its page.
export async function getSubjectCurriculum(id: SubjectId): Promise<SubjectCurriculum> {
  switch (id) {
    case "math": return mathCurriculum;
    case "chinese": return (await import("./chinese")).chineseCurriculum;
    case "history": return (await import("./history")).historyCurriculum;
    case "geography": return (await import("./geography")).geographyCurriculum;
    case "english": return (await import("./english")).englishCurriculum;
  }
}
