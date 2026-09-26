import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoGo学堂 · 快乐学数学",
  description: "面向小学生的数学练习、错题订正与学习复盘。",
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
