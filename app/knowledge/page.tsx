import type { Metadata } from "next";
import { MathJourney } from "@/components/knowledge/math-journey";

export const metadata: Metadata = {
  title: "数学成长地图 · 从基础到理解 | GoGo学堂",
  description: "从数一数到加减乘除、分数与综合应用。沿着知识的联系，观察、动手、理解、运用，一步步建立小学数学知识体系。",
};

export default function KnowledgePage() {
  return <MathJourney />;
}
