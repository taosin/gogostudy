import type { Metadata } from "next";
import { KnowledgeExplorer } from "@/components/knowledge/knowledge-explorer";

export const metadata: Metadata = {
  title: "点线面体 · 小学数学知识图谱 | GoGo学堂",
  description: "从一个点出发，动手探索线、平面图形和立体图形。12个知识点，7个互动实验，循序渐进认识空间。",
};

export default function KnowledgePage() {
  return <KnowledgeExplorer />;
}
