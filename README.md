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

1. 在新加坡区域创建 Supabase 项目。
2. 通过 Supabase 的迁移工作流应用 `supabase/migrations/20260926000100_initial.sql`：

   ```sh
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   npx supabase migration list
   ```

   所有表已开启 RLS，并按 `auth.uid()` 隔离。应用后还要在 Supabase Advisors 中检查 Security 和 Performance；不要在 SQL Editor 中手工维护另一份结构。
3. 在 Authentication 开启 Email provider 和允许新用户注册。
4. 在 Authentication → Email Templates 中分别修改 **Confirm signup** 和 **Magic Link** 模板，两个模板都要显示 `{{ .Token }}`。新账户会使用前者，已有账户会使用后者；前端使用 `signInWithOtp` 发送、`verifyOtp(type: 'email')` 验证。
5. 在 Authentication → URL Configuration 把 Site URL 设为 `https://study.ai-builder.top`，并按需加入本地和 Vercel Preview 地址。
6. 配置 `.env.local`：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

7. 重启本地服务，点击“家长登录”，使用家长邮箱收取验证码。

只需 publishable key（兼容传统 anon key），**不能填 service_role / secret key**。Supabase 默认邮件服务只适合项目成员联调，并有很低的发送速率限制；正式开放注册前必须配置自己的 SMTP。邮箱验证及远程读写需要真实项目才能验证。

家长账户对应一份学习空间；暂不包含多孩子档案。服务端从验证后的 token 读取用户身份，不接受客户端传入用户 ID。数据库有独立 RLS 防护；练习历史采用追加写入，提交 UUID 支持安全重试。

## 部署到 Vercel

1. 将此仓库导入 Vercel，**Root Directory 为仓库根目录**，Framework 选 Next.js，Node.js 选 22.x。
2. Build Command 为 `npm run build`，Install Command 为 `npm ci`，保留默认 Next.js Output Directory。
3. 在 Production 设置上述两个环境变量。Preview 默认保留体验模式；需要云端联调时，应连接独立的 staging Supabase 项目，避免预览代码访问正式用户数据。
4. 确保 Supabase 已执行迁移，两个邮箱模板、Site URL 和正式 SMTP 均已配置，然后部署。修改 `NEXT_PUBLIC_*` 后需要重新构建部署。
5. 未设置变量的部署会明确进入体验模式，不会假装已经云端保存。

也可以在项目根目录运行 `npx vercel` 创建预览部署，确认后运行 `npx vercel --prod`。本项目不包含账户凭据；Vercel 项目关联保存在被忽略的 `.vercel/` 目录。

## 性能与缓存

- 首页由 Next.js 静态预渲染，并由 Vercel CDN 分发。
- 公开题库在浏览器缓存 5 分钟、Vercel CDN 缓存 1 天，并允许 7 天后台更新；同一次页面会话只请求一次完整题库。
- 未配置 Supabase 时直接读取浏览器体验记录，不请求云端状态，也不会加载 Supabase 客户端代码。
- 学习记录、登录状态和所有写接口均使用 `private, no-store`，不会进入浏览器或共享 CDN 缓存。
- Vercel Functions 部署在新加坡区域，减少中国方向访问公开判题接口的跨洲延迟；后续创建 Supabase 项目时也建议选择新加坡区域。

## 结构与扩展

- `lib/catalog.ts`：课程维度、默认设置、知识点和共享类型
- `lib/questions.ts`：原创题库、答案和讲解，仅由服务器路由导入
- `lib/study.ts`：错题状态、间隔复习与学习统计
- `lib/use-study.ts`：浏览器体验记录与云端 API 接入
- `app/api/`：判题和数据接口
- `supabase/migrations/`：云端数据库迁移
- `docs/PRODUCT.md`：产品边界与后续扩展方案

课程选择预留省份、教材、年级、学期、科目；未开放组合显示准备中，不会套用其他年级题目。内容按知识点组织，并未宣称逐页同步某次修订教材；精确单元映射需根据孩子课本版权页和目录核对。
