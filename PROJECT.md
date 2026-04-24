# 项目约束文档

> 本文档定义项目的技术栈、编码规范和目录约定，所有编码任务必须严格遵循。

---

## 一、技术栈约定

### 核心技术栈
- **前端框架**：
  - Next.js: 14.2.x (>= 14.2.35)
  - React: 18.3.x (>= 18.3.1)
- **样式方案**：Tailwind CSS
- **类型系统**：TypeScript 5.x
- **状态管理**：Zustand（业务状态）

### 版本约束补丁（强制）
- **禁止使用** `next@14.2.5` 及以下版本（存在高危 CVE 漏洞）
- 若 `pnpm audit` 发现安全警告，必须立即升级至最新的 14.2.x 补丁版本

### 运行环境
- **Node.js**：>= 20.x (推荐 22.x LTS)

  理由：
  - 安全性：Node 18 已停止维护，20.x/22.x 提供持续安全补丁
  - 性能提升：Node 22 优化了依赖加载与 fetch 实现，显著加快安装与构建速度
  - 环境一致性：与 Vercel 生产环境完全对齐，避免运行时兼容问题

### 开发环境
- **包管理器**：pnpm（锁定使用，禁止混用 npm）
- **代码检查**：ESLint + TypeScript

---

## 二、编码规范

### 2.1 命名规范（最终版 · 无争议）

#### 1. 变量 / 函数 / 自定义 Hook
- **规则**：**驼峰命名法 camelCase**
- **示例**：`userName`、`fetchUserList`、`useAuth`、`useModal`
- **布尔值**：必须以 `is` / `has` / `can` / `should` 开头
  - 示例：`isLoading`、`hasPermission`、`canEdit`、`shouldRefresh`

#### 2. React 组件 / TypeScript 类型 / 接口 / 枚举
- **规则**：**帕斯卡命名法 PascalCase**
- **组件**：`UserProfile`、`LoginForm`、`DataTable`
- **类型/接口**：`UserProps`、`ApiResponse`、`ThemeConfig`
- **枚举**：`UserStatus`、`RequestState`

#### 3. 文件 / 目录命名
- **规则**：**短横线命名法 kebab-case**
- **示例**：`user-profile.tsx`、`user-profile.module.css`、`api-client.ts`
- **Next.js 固定文件（例外）**：`page.tsx`、`layout.tsx`、`route.ts`、`error.tsx`

#### 4. 全局常量
- **规则**：**全大写 + 下划线**
- **示例**：`API_BASE_URL`、`MAX_RETRY_COUNT`、`DEFAULT_THEME`

### 2.2 禁止项

- ❌ 拼音命名：`yonghuming`、`denglu`
- ❌ 中文命名：`用户名称`、`登录`
- ❌ 硬编码密钥：`const apiKey = 'sk_xxxxxxxxxx'`
- ❌ 全局变量：`let globalCounter = 0`
- ❌ 包管理器混用：同一项目中禁止混用 npm 和 pnpm（会导致 lock 文件冲突）

---

## 三、目录约定

### 3.1 标准项目结构

```
project/
├── public/                      # 静态资源（直接访问，无需 import）
│   ├── images/
│   ├── fonts/
│   └── icons/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/              # 路由组（不影响 URL）
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── api/                 # API 路由
│   │   │   └── users/
│   │   │       └── route.ts
│   │   ├── page.tsx             # 首页
│   │   ├── layout.tsx           # 根布局
│   │   ├── loading.tsx          # 全局加载状态
│   │   ├── error.tsx            # 全局错误边界
│   │   └── not-found.tsx        # 404 页面
│   ├── components/              # 组件目录
│   │   ├── ui/                  # 基础 UI（shadcn/ui + 自定义）
│   │   │   ├── button.tsx
│   │   │   └── input.tsx
│   │   ├── layout/              # 布局组件
│   │   │   ├── header.tsx
│   │   │   └── footer.tsx
│   │   └── features/            # 业务功能组件
│   │       ├── user-profile/
│   │       └── product-list/
│   ├── lib/                     # 工具库
│   │   ├── api.ts               # API 请求封装（SWR 配置）
│   │   ├── utils.ts             # 通用工具函数
│   │   └── constants.ts         # 全局常量
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── use-auth.ts
│   │   └── use-debounce.ts
│   ├── store/                   # 状态管理（Zustand）
│   │   └── index.ts
│   ├── types/                   # TypeScript 类型定义
│   │   ├── user.ts
│   │   ├── api.ts
│   │   └── common.ts
│   └── styles/                  # 全局样式
│       └── globals.css
├── .gitignore                   # Git 忽略文件
├── .env.local                   # 本地环境变量（不提交 Git）
├── .env.example                 # 环境变量示例（提交 Git）
├── .eslintrc.json               # ESLint 配置
├── .prettierrc.json             # Prettier 配置
├── pnpm-lock.yaml               # pnpm 锁定文件（禁止混用 npm，防止 lock 冲突）
├── next.config.ts               # Next.js 配置
├── tailwind.config.ts           # Tailwind CSS 配置
├── tsconfig.json                # TypeScript 配置
├── package.json                 # 项目依赖
└── PROJECT.md                   # 项目约束文档（本文件）
```

### 3.2 文件夹创建规则

- **静态资源**：放在 `public/` 目录（images/fonts/icons），直接通过 URL 访问
- **组件**：
  - 基础 UI 组件放在 `components/ui/`（如 button、input、card）
  - 布局组件放在 `components/layout/`（如 header、footer）
  - 业务功能组件放在 `components/features/`（如 user-profile、product-list）
- **工具库**：
  - API 请求封装放在 `lib/api.ts`（SWR 配置）
  - 通用工具函数放在 `lib/utils.ts`
  - 全局常量放在 `lib/constants.ts`
- **自定义 Hooks**：放在 `hooks/` 目录（文件名 kebab-case，如 `use-auth.ts`、`use-debounce.ts`）
- **状态管理**：放在 `store/` 目录（Zustand store）
- **类型定义**：放在 `types/` 目录（按模块分类，如 `user.ts`、`api.ts`、`common.ts`）
- **全局样式**：放在 `styles/globals.css`
- **组件样式**：放在组件同级（`.module.css`，如 `user-profile.module.css`）

### 3.3 文件命名注意事项

- **Hooks 文件**：必须使用 kebab-case（`use-auth.ts`、`use-debounce.ts`）
- **Next.js 固定文件**：`page.tsx`、`layout.tsx`、`loading.tsx`、`error.tsx`、`not-found.tsx`、`route.ts`
- **路由组目录**：用括号包裹，不影响 URL（如 `(auth)`、`(dashboard)`）

---

## 四、代码检查与格式化

### 4.1 ESLint 检查

```bash
# 检查语法错误
pnpm run lint

# 自动修复
pnpm run lint -- --fix
```

### 4.2 TypeScript 类型检查

```bash
# 检查类型错误
pnpm run type-check
```

### 4.3 格式化代码

```bash
# 格式化代码
pnpm run format
```

---

## 五、Git 提交规范

### 5.1 提交信息格式

```
格式：<type>(<scope>): <subject>

类型（type）：
  feat:     新功能
  fix:      Bug 修复
  docs:     文档更新
  style:    代码格式
  refactor:  重构
  perf:     性能优化
  test:     测试
  chore:    构建过程或辅助工具的变动
  ci:       CI/CD 配置文件和脚本变更
  revert:   回退上一个 commit

作用域（scope，可选）：
  login:    登录模块
  api:      API 相关
  ui:       UI 组件
  db:       数据库

主题（subject）：
  - 不超过 50 个字符
  - 使用祈使句，动词开头
  - 句尾不加标点符号
```

### 5.2 提交示例

```bash
# ✅ 正确示例
git commit -m "feat(login): 添加验证码登录功能"
git commit -m "fix(api): 修复用户列表分页错误"
git commit -m "docs(readme): 更新安装说明"
git commit -m "perf(image): 优化图片懒加载性能"

# ❌ 错误示例
git commit -m "添加登录功能"  # 缺少 type 和 scope
git commit -m "Fix bug"  # 使用了首字母大写
git commit -m "feat(login): 添加了验证码登录功能。"  # 句尾有标点
```

---

## 六、编码流程

### 标准流程

```
1. 看设计稿
2. 直接制作网页
3. 编码后 pnpm run lint
4. 测试能否打开
```

### 注意事项

- 先让代码跑起来，再优化
- 命名用驼峰，不用拼音
- 有问题直接修改，不要纠结规范

---

## 七、Next.js App Router 关键规则

| 技术/库 | 服务端组件（RSC） | 客户端组件（CC） |
|---------|------------------|------------------|
| `useState/useEffect` | ❌ | ✅ |
| `Context API` | ❌ | ✅ |
| `Zustand` | ❌ | ✅ |
| `数据库（Prisma）` | ✅ | ❌ |
| `文件系统（fs）` | ✅ | ❌ |
| `window/document` | ❌ | ✅ |

**组件拆分原则**：
- **数据获取** → 服务端组件
- **交互逻辑** → 客户端组件（加 `'use client'`）

---

## 八、常见错误与解决方案

### 8.1 TypeScript 类型错误

**问题**：`Type 'X' is not assignable to type 'Y'`

**解决**：
1. 检查类型定义是否正确
2. 使用类型断言（as）或类型守卫
3. 联合类型添加缺失的分支

### 8.2 ESLint 错误

**问题**：`'xxx' is assigned a value but never used`

**解决**：
1. 删除未使用的变量
2. 变量名前加下划线 `_xxx`（明确表示未使用）

### 8.3 React Hooks 警告

**问题**：`React Hook useEffect has missing dependencies`

**解决**：
1. 补全依赖项数组
2. 使用 `eslint-disable-next-line` 注释（确保合理）

---

**总结**：技术栈正确 → 命名规范 → lint 通过 → 功能可用 ✅

---

---

## 九、预览与部署规范

### 9.1 本地实时预览

开发过程中必须保持 `pnpm run dev` 开启。

核心预览地址：http://localhost:3000。

### 9.2 提交前强制自检

Push 到 GitHub 前必须运行：

```bash
pnpm run lint  # 检查命名与规范
pnpm run build  # 模拟生产构建，排查打包错误
```

### 9.3 自动化预览 (CI/CD)

关联 GitHub 与 Vercel，利用 Preview Deployments 进行移动端及多设备环境测试。

生产环境 (Production) 仅在预览环境验证无误后，合并至 main 分支触发。

---
