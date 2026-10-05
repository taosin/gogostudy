import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoGo学堂 · 我的知识世界",
  description: "带着好奇探索数学、语文、历史、地理、英语与宇宙，在故事、互动和小实验中认识知识之间的联系，再到练习营地巩固自己的收获。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
