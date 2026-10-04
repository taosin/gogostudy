import type { Metadata } from "next";
import { KnowledgeHub } from "@/components/knowledge/knowledge-hub";
import { getSubjectCurriculum } from "@/lib/curricula";
import { learningSubjects } from "@/lib/learning-subjects";

export const metadata: Metadata = {
  title: "五科知识成长地图 · 从好奇到理解 | GoGo学堂",
  description: "数学、语文、历史、地理、英语，从基础概念出发，观察、动手、理解、运用，逐步建立孩子自己的知识体系。",
};
export default async function KnowledgePage() {
  const curricula = await Promise.all(learningSubjects.map(({ id }) => getSubjectCurriculum(id)));
  const subjects = curricula.map(({ id, title, stages, lessons }) => ({
    id, title, stages,
    lessons: lessons.map(({ id, title, prerequisites, checks }) => ({ id, title, prerequisites, checks: checks.map(({ id }) => ({ id })) })),
  }));
  return <KnowledgeHub subjects={subjects} />;
}
