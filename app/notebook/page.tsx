import type { Metadata } from "next";
import { DiscoveryNotebook } from "@/components/world/discovery-notebook";

export const metadata: Metadata = {
  title: "我的发现手册 · GoGo学堂",
  description: "留下自己的发现、新问题和下次想试的事，再回到知识世界继续探索。",
};

export default function NotebookPage() {
  return <DiscoveryNotebook />;
}
