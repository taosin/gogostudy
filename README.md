# GoGo 学堂

面向小学生的清爽学习网站，首期聚焦浙江省、人教版、二年级上册数学。正式访问地址：[study.ai-builder.top](https://study.ai-builder.top)。

当前线上运行浏览器体验模式：练习、错题订正、间隔复习和家长周报可以直接使用，记录保存在当前浏览器。Supabase 项目尚未创建和连接，因此登录、注册、云端保存与多设备同步还没有正式上线。

## 已实现

- 默认使用 `2025课程包`：56 道原创题、6 个单元、14 个技能，每个技能 4 题；包含 24 道程序绘制的分组、分类卡片或刻度尺视觉题。
- 保留原有 29 道题作为 `旧版课程包`。课程设置、练习记录、错题和统计均按课程包隔离，旧记录不会混入新版进度。
- 首页同时展示今日练习、待订正和到期复习三个入口。订正与复习各批最多 5 题，并优先处理更早遗留或更早到期的任务。
- 错题按 1 / 3 / 7 天安排三次间隔复习。提示或重试后的答对会标记为辅助完成，不计入独立正确率，也不会开始或推进复习周期。
- 家长复盘包含最近 7 个中国日历日的学习天数、独立练习正确率、完成订正、完成复习、常见错因和技能建议。
- 课程选择已预留省份、教材、年级、学期、科目和课程版本；未开放组合会明确显示准备中。
- 页面覆盖手机、平板和桌面布局，触控按钮、字号、卡片和侧栏会随宽度调整。

课程包依据与内容审校边界见 [docs/CURRICULUM.md](docs/CURRICULUM.md)，产品范围见 [docs/PRODUCT.md](docs/PRODUCT.md)。

## 技术栈

- Next.js App Router、React、TypeScript
- Tailwind CSS 与 Radix / shadcn 组件
- Next.js Route Handlers：服务端判题、课程设置、学习状态与复盘小记
- Supabase Auth、PostgreSQL、RLS 接入代码与迁移脚本（尚未连接真实项目）
- Vercel 原生 Next.js 部署

## 本地启动

需要 Node.js 22.12 或更高版本。

```sh
npm ci
cp .env.example .env.local
npm run dev
```

打开终端输出的本地网址。保持 `.env.local` 中三个 Supabase 变量为空即可进入体验模式。真实题目由服务端判分，体验记录保存在浏览器；清除浏览器数据会同时清除这些记录。以后登录产生的云端数据与本机体验数据分开，不会自动合并。

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

当前自动测试共 58 项，覆盖题库公开边界、服务端判分、课程包隔离、辅助完成口径、错题与间隔复习、三类每日任务、7 天周报、缓存、旧数据兼容和可信云端写入。

## 课程包与数据兼容

- `pep-math-g2s1-2025` / `2025.1`：默认课程包，56 道题，覆盖分类与整理、1～6 的表内乘除法、厘米和米、7～9 的表内乘除法、复习与关联。
- `pep-math-g2s1-legacy` / `legacy.1`：兼容原有 29 道题及历史学习记录。
- 没有课程版本字段的旧浏览器或云端记录会归入旧版课程包，不会被静默改算为新版成绩。
- 每次答题保存课程包、内容版本、单元、技能、难度、题型和辅助程度等快照，后续升级内容时仍能解释历史记录。

题目均为本项目原创练习，按公开知识框架组织，不复制教材原题，也不宣称获得出版社授权或逐页同步某次教材印次。

## Supabase 接入状态与步骤

仓库已经准备好客户端按需加载、邮箱验证码流程、可信服务端写入、RLS 数据结构和四份迁移，但还没有创建 Supabase 项目，也没有配置生产环境变量。当前不能把登录、注册、云端保存或多设备同步视为已上线能力。

创建真实项目后，应按顺序应用：

1. `supabase/migrations/20260926000100_initial.sql`
2. `supabase/migrations/20260928000100_course_packages.sql`
3. `supabase/migrations/20260928152645_trusted_writes.sql`
4. `supabase/migrations/20260928154656_atomic_attempt_writes.sql`

第二份迁移增加课程包、内容版本、技能、题型与 `support_level` 等字段，把无版本历史映射到旧版课程包，并为新版用户设置默认课程包。第三份迁移撤销浏览器直接写学习表的权限，保留本人只读 RLS，并增加服务端状态校验所需索引。第四份迁移记录每次答题的服务端提示会话，并通过两个仅 `service_role` 可执行的事务函数管理提示限额，以及原子完成答题幂等校验、学习状态版本校验、加锁与写入。

```sh
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase migration list
```

随后还需要完成：

1. 在 Authentication 开启 Email provider 和新用户注册。
2. 在 **Confirm signup** 与 **Magic Link** 两个邮件模板中显示 `{{ .Token }}`，并配置正式 SMTP。Supabase 默认邮件服务只适合项目成员联调。
3. 将 Site URL 设为 `https://study.ai-builder.top`，按需加入本地与 Vercel Preview 地址。
4. 在本地或 Vercel Production 设置：

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   SUPABASE_SECRET_KEY=your-server-only-secret-key
   ```

5. 运行 Supabase Security 与 Performance Advisors，并完成两个账号隔离、匿名与直接写入拒绝、API 写入、验证码过期、重复提交、刷新恢复和多设备同步测试。

云端写入已经收口到服务端：浏览器 JWT 只用于验证身份和按 RLS 读取本人数据，服务端使用 `SUPABASE_SECRET_KEY` 调用事务函数。公开题包不返回答案、解析或提示；孩子查看提示时，服务端按用户与本次答题 ID 记录短期提示会话，答题函数据此派生 `support_level`。提示函数会清理过期记录，并把每个用户的活跃提示会话限制在 50 个，多个标签页不会互相覆盖。同一幂等 ID 携带不同负载会返回 409；不同 ID 的并发订正或复习会经过状态版本校验和同题加锁。第三份迁移会撤销 `authenticated` 对学习表的直接写权限。任何 `service_role` 或 secret key 都不能使用 `NEXT_PUBLIC_` 前缀，也不能进入浏览器或仓库。

## 部署到 Vercel

1. 将仓库导入 Vercel，Root Directory 使用仓库根目录，Framework 选 Next.js，Node.js 选 22.x。
2. Build Command 使用 `npm run build`，Install Command 使用 `npm ci`，保留默认 Next.js Output Directory。
3. 项目已通过 `vercel.json` 将 Functions 放在新加坡 `sin1`。Production 使用自定义域名 `study.ai-builder.top`。
4. 未设置 Supabase 变量的部署会明确进入体验模式。Preview 默认也应保持体验模式；若要联调云端能力，连接独立的 staging 项目，避免预览代码访问正式用户数据。
5. 修改任何 `NEXT_PUBLIC_*` 变量后需要重新构建部署。

也可以在项目根目录运行 `npx vercel` 创建预览部署，验收后运行 `npx vercel --prod`。Vercel 项目关联信息位于被忽略的 `.vercel/` 目录，仓库不保存账户凭据。

## 性能、缓存与国内访问

- 首页静态预渲染并通过 Vercel CDN 分发。
- 公开题库不包含答案：浏览器缓存 5 分钟并可后台更新 1 小时；Vercel CDN 缓存 1 天并可后台更新 7 天。同一页面会话会复用同一课程包请求。
- 学习记录、登录状态、判题结果和所有写接口使用 `private, no-store`；无效或不支持的题库请求也不会进入公共缓存。
- 未配置 Supabase 时直接读取本地体验记录，并避免加载 Supabase 客户端代码。
- 动态接口部署在新加坡，页面按中国时区划分学习日与复习日。中国大陆用户通常可以访问，但 Vercel 和 Supabase 均不是中国大陆境内托管服务，网络质量会因地区、运营商、DNS 和邮件供应商而变化，也没有境内 CDN 可用性保证。
- 若产品需要面向国内用户稳定商用，后续应评估备案、境内部署或 CDN、国内邮件/短信送达、隐私合规和真实运营商网络监测，不能只以开发机测速作为上线依据。

## 主要目录

- `content/math/pep-2a-2025.ts`：2025 课程包原创题库
- `lib/catalog.ts`：课程包、单元、技能与共享类型
- `lib/questions.ts`：课程包注册、服务端答案与判分
- `lib/study.ts`：错题状态、辅助程度与间隔复习
- `lib/daily-plan.ts`：首页三类每日任务
- `lib/weekly-report.ts`：7 天家长周报
- `lib/use-study.ts`：浏览器体验记录与云端 API 接入
- `app/api/`：题库、判题和学习数据接口
- `supabase/migrations/`：云端数据库迁移
- `docs/VERIFICATION.md`：发布验收记录与剩余阻塞项
