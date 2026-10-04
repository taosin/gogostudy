import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubjectJourney } from "@/components/knowledge/subject-journey";
import { getSubjectCurriculum } from "@/lib/curricula";
import { isSubjectId, learningSubjects } from "@/lib/learning-subjects";

export const dynamicParams = false;
export function generateStaticParams() { return learningSubjects.map(({ id }) => ({ subject: id })); }

type Props = { params: Promise<{ subject: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subject } = await params;
  if (!isSubjectId(subject)) notFound();
  const curriculum = await getSubjectCurriculum(subject);
  return { title: `${curriculum.title}成长地图 · 从基础到理解 | GoGo学堂`, description: curriculum.description };
}
export default async function SubjectPage({ params }: Props) {
  const { subject } = await params;
  if (!isSubjectId(subject)) notFound();
  return <SubjectJourney key={subject} curriculum={await getSubjectCurriculum(subject)} />;
}
