import type { Metadata } from "next";
import { WorldHome } from "@/components/world/world-home";

export const metadata: Metadata = {
  title: "我的知识世界 · 带着好奇心出发 | GoGo学堂",
  description: "走进数字工坊、故事森林、时光博物馆、大地山谷、英语港湾和星空观测站。在观察、操作与跨学科的小旅行中，建立自己的知识联系。",
};

export default function HomePage() {
  return <WorldHome />;
}
