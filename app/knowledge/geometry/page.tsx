import type { Metadata } from "next";
import { KnowledgeExplorer } from "@/components/knowledge/knowledge-explorer";

export const metadata: Metadata = {
  title: "空间小实验 · 点线面体 | GoGo学堂",
  description: "小学数学成长地图的空间专题：点、线、面、体的12个知识点和7种动手实验。",
};

export default function GeometryPage() {
  return <KnowledgeExplorer />;
}
