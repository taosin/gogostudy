# GoGo 学堂

清爽、适合小学生的学习网站。首期为浙江 · 人教版 · 二年级上册数学，包含 29 道原创示例题、7 个知识点，支持每日任务、自动错题收录、订正、1 / 3 / 7 天间隔复习和学习小记。

## 技术栈

- Next.js App Router + React + TypeScript
- Tailwind CSS + Radix / shadcn 组件
- Next.js Route Handlers：服务端判题、学习状态、课程设置、复盘小记
- Supabase Auth 邮箱验证码 + PostgreSQL + RLS 用户隔离
- Vercel 原生 Next.js 部署，无 Cloudflare / Sites 运行时依赖

## 本地启动

需要 Node.js 22.12+。

```sh
npm ci
cp .env.example .env.local
npm run dev
```

打开终端输出的本地网址。未配置 Supabase 时可直接使用体验模式，真实题目由服务端判分，体验记录保存在当前浏览器。清除浏览器数据会清除体验记录。登录后的云端数据与本机体验数据分开，不做隐式迁移。

```sh
npm run typecheck
npm test
npm run build
npm start
```

## 接入 Supabase

1. 创建 Supabase 项目。
2. 在 SQL Editor 执行 `supabase/migrations/202609260001_initial.sql`，只执行一次。所有表已开启 RLS，并按 `auth.uid()` 隔离。
3. 在 Supabase Authentication 开启 Email provider 和允许新用户注册。
4. 在 Authentication → Email Templates → Magic Link 模板中放入 `{{ .Token }}`，邮件须展示验证码；前端使用 `signInWithOtp` 发送和 `verifyOtp(type: 'email')` 验证。没有实现回调链接登录。
5. 配置 `.env.local`：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

6. 重启本地服务，点击“家长登录”，使用家长邮箱收取验证码。

只需 publishable key（兼容传统 anon key），**不能填 service_role / secret key**。正式面向用户发送邮件时，配置自己的 SMTP；Supabase 默认邮件服务有收件人与发送速率限制。邮箱验证及远程读写需要真实项目才能验证。

家长账户对应一份学习空间；暂不包含多孩子档案。服务端从验证后的 token 读取用户身份，不接受客户端传入用户 ID。数据库有独立 RLS 防护；练习历史采用追加写入，提交 UUID 支持安全重试。

## 部署到 Vercel

1. 将此仓库导入 Vercel，**Root Directory 为仓库根目录**，Framework 选 Next.js，Node.js 选 22.x。
2. Build Command 为 `npm run build`，Install Command 为 `npm ci`，保留默认 Next.js Output Directory。
3. 在 Preview / Production 分别设置上述两个环境变量。
4. 确保 Supabase 已执行迁移并设置邮箱模板，然后部署。修改 `NEXT_PUBLIC_*` 后需要重新构建部署。
5. 未设置变量的部署会明确进入体验模式，不会假装已经云端保存。

也可以在项目根目录运行 `npx vercel` 创建预览部署，确认后运行 `npx vercel --prod`。本项目不包含账户凭据；Vercel 项目关联保存在被忽略的 `.vercel/` 目录。

## 结构与扩展

- `lib/catalog.ts`：课程维度、默认设置、知识点和共享类型
- `lib/questions.ts`：原创题库、答案和讲解，仅由服务器路由导入
- `lib/study.ts`：错题状态、间隔复习与学习统计
- `lib/use-study.ts`：浏览器体验记录与云端 API 接入
- `app/api/`：判题和数据接口
- `supabase/migrations/`：云端数据库迁移
- `docs/PRODUCT.md`：产品边界与后续扩展方案

课程选择预留省份、教材、年级、学期、科目；未开放组合显示准备中，不会套用其他年级题目。内容按知识点组织，并未宣称逐页同步某次修订教材；精确单元映射需根据孩子课本版权页和目录核对。
