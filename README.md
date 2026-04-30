# 何慧敏书法网站

何慧敏书法与楚简书法展示网站，包含首页作品展示与「楚简查字」检索体验。

## 版本信息

- 当前版本：`v1.0.0`
- 最近更新：`2026-04-30`
- 维护方式：每次重大变更后，同步更新本文件的「版本信息」与「重大变动记录」

## 功能概览

- 首页作品集展示（问道经典 / 书法创作）
- 作品灯箱预览与放大查看
- 楚简查字（按字检索多系列字形结果）
- 移动端友好布局
- 图片 `alt` 统一模板：`{作品名}｜何慧敏书法｜楚简书法`

## 技术栈

- Next.js 14（App Router）
- React 18
- TypeScript
- Tailwind CSS

## 本地开发

```bash
pnpm install
pnpm dev
```

默认本地地址：`http://localhost:3000`

## 常用脚本

- `pnpm dev`：启动开发环境
- `pnpm build`：构建生产包（会先执行索引构建脚本）
- `pnpm start`：启动生产环境
- `pnpm lint`：执行代码检查
- `pnpm type-check`：执行 TypeScript 类型检查
- `pnpm format`：执行 Prettier 格式化

## 项目结构（核心）

```text
src/
  app/
    page.tsx                # 首页入口
    home-inner.tsx          # 首页与作品灯箱逻辑
    search/page.tsx         # 查字页 UI
  hooks/
    use-search-chat.ts      # 查字页状态与交互逻辑
  components/
    features/home/work-card.tsx
    layout/site-nav.tsx
scripts/
  build-index.mjs           # 构建搜索索引相关脚本
public/
  shufacards/               # 作品与索引静态数据
```

## 内容维护说明

### 1) 作品数据

- 首页作品依赖 `public/shufacards/.../works.json` 等静态数据源
- 每条作品建议至少包含：
  - `title`（作品名）
  - `original`（释文，可选）
  - `source`（出处，可选）
  - `description`（解读，可选）

### 2) 图片 ALT 规则

- 全站图片统一按模板生成：
  - `{作品名}｜何慧敏书法｜楚简书法`
- 当作品名为空时，使用兜底文案（如：`楚简字形`）
- 新上传作品只要数据字段正常，会自动应用该规则

## 发布前检查建议

```bash
pnpm lint
pnpm type-check
pnpm build
```

## 重大变动记录

> 说明：每次上线前后，遇到「结构变化、数据结构调整、SEO策略调整、核心交互修改」时，请在此追加记录。

### 2026-04-30

- 新增全站右下角聊天组件，接入腾讯云函数（豆包）并支持流式响应。
- 聊天分流升级为「本地意图优先」：命中查字直接走本地字库与图片展示，不调用 AI。
- 查字规则调整为单字查询；当用户输入“多字 + 怎么写 + 楚简/楚文字”时，固定提示一次仅支持单字查询。
- 聊天体验优化：显示灰色 thinking 流，正文开始输出后自动隐藏 thinking，避免用户误判卡顿。

### 2026-04-27

- 统一全站图片 ALT 策略为：`{作品名}｜何慧敏书法｜楚简书法`
- ALT 空值场景增加兜底文案，避免出现空替代文本

---

## 变更记录模板（复制后追加）

```md
### YYYY-MM-DD

- 变更类型：功能 / 样式 / SEO / 数据结构 / 构建部署 / 其他
- 变更内容：
  - ...
- 影响范围：
  - 页面：
  - 数据：
  - SEO：
- 回滚说明（可选）：
  - ...
```
