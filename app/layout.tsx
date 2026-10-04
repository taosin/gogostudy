import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoGo学堂 · 从好奇开始，认识世界",
  description: "面向小学生的数学、语文、历史、地理、英语知识成长地图，以及数学教材练习、错题订正与学习复盘。",
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
