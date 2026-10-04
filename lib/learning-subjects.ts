import type { SubjectId } from "./learning-types";

export const learningSubjects = [
  { id: "math", title: "数学", caption: "发现数量背后的道理", description: "从数清一把积木，到理解运算、空间和数量关系。", color: "#39745b", soft: "#e8f1df", symbol: "＋", trail: ["数量", "关系", "推理"], question: "为什么 3 个 4，就是 12？" },
  { id: "chinese", title: "语文", caption: "用语言认识与表达", description: "从听清一句话，到读懂文字，把心里的想法说清楚。", color: "#a65f42", soft: "#f8ebde", symbol: "文", trail: ["声音", "字句", "表达"], question: "怎样把一件小事讲明白？" },
  { id: "history", title: "历史", caption: "沿着线索，认识过去", description: "从昨天和今天，到观察旧物、寻找证据，理解变化。", color: "#8c7040", soft: "#f5eed8", symbol: "古", trail: ["时间", "证据", "变化"], question: "一件旧东西，会告诉我们什么？" },
  { id: "geography", title: "地理", caption: "从身边出发，读懂世界", description: "从家门口的方向，到地图、天气、山河与人们的生活。", color: "#427985", soft: "#e4f0f1", symbol: "地", trail: ["位置", "自然", "联系"], question: "一张小地图，怎样带我找到路？" },
  { id: "english", title: "英语", caption: "多一种认识世界的语言", description: "从一句 Hello 开始，认识词语，读懂小故事，试着交流。", color: "#79619a", soft: "#eeebf5", symbol: "Aa", trail: ["词语", "句子", "交流"], question: "怎样用英语介绍我喜欢的东西？" },
] satisfies { id: SubjectId; title: string; caption: string; description: string; color: string; soft: string; symbol: string; trail: string[]; question: string }[];

export function isSubjectId(id: string): id is SubjectId {
  return learningSubjects.some((subject) => subject.id === id);
}
