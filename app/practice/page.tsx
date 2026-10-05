import type { Metadata } from "next";
import StudyDashboard from "@/components/study/study-dashboard";

export const metadata: Metadata = {
  title: "我的练习营地 · GoGo学堂",
  description: "把探索中学到的知识再想一想：做数学练习、订正错题、回顾自己的收获。",
};

export default function PracticePage() {
  return <StudyDashboard />;
}
