import type { Metadata } from "next";
import { KnowledgeHub } from "@/components/knowledge/knowledge-hub";
import { getSubjectCurriculum } from "@/lib/curricula";
import { learningSubjects } from "@/lib/learning-subjects";

export const metadata: Metadata = {
  title: "我的知识路线册 · GoGo学堂",
  description: "知识世界的随身路线册：查看数学、语文、历史、地理和英语的基础路线，找回学习位置，沿着知识联系继续探索。",
};
export default async function KnowledgePage() {
  const curricula = await Promise.all(learningSubjects.map(({ id }) => getSubjectCurriculum(id)));
  const subjects = curricula.map(({ id, title, stages, lessons }) => ({
    id, title, stages,
    lessons: lessons.map(({ id, title, prerequisites, checks }) => ({ id, title, prerequisites, checks: checks.map(({ id }) => ({ id })) })),
  }));
  return <KnowledgeHub subjects={subjects} />;
}
