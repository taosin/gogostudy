import type { Metadata } from "next";
import { UniverseExplorer } from "@/components/universe/universe-explorer";

export const metadata: Metadata = {
  title: "宇宙与万物 · 一起发现世界的联系 | GoGo学堂",
  description: "从地球出发，认识宇宙、星系、太阳系、生命与微观物质。用互动关系图、昼夜、公转和水循环小模拟，发现万物之间的联系。",
};

export default function UniversePage() {
  return <UniverseExplorer />;
}
