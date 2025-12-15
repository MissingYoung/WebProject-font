# 教务管理系统 - 前端项目

> 教务管理系统的前端应用，采用 Vue 3 + TypeScript + Vite 技术栈

## 技术栈

- **框架**: Vue 3.5 + TypeScript
- **构建工具**: Vite 7
- **状态管理**: Pinia (带持久化插件)
- **路由**: Vue Router 4
- **样式**: Tailwind CSS 4
- **UI 组件库**: shadcn-vue (基于 reka-ui)
- **HTTP 客户端**: Axios
- **图标**: Lucide Vue
- **表格**: TanStack Vue Table
- **工具库**: @vueuse/core, dayjs
- **包管理器**: pnpm

## 项目结构

```
src/
├── assets/          # 静态资源
├── components/      # 组件
│   ├── ui/          # shadcn-vue UI 组件
│   └── ...          # 业务组件
├── composables/     # 可组合函数 (hooks)
├── lib/             # 工具库
│   ├── api.ts       # API 请求封装
│   ├── date.ts      # 日期处理工具
│   └── utils.ts     # 通用工具函数
├── router/          # 路由配置
├── stores/          # Pinia 状态管理
├── types/           # TypeScript 类型定义
├── utils/           # 工具函数
└── views/           # 页面视图
```

## 开发命令

```bash
pnpm dev        # 启动开发服务器
pnpm build      # 构建生产版本 (含类型检查)
pnpm preview    # 预览构建结果
pnpm lint       # ESLint 检查并自动修复
pnpm format     # Prettier 格式化代码
```

## API 规范

### 后端接口

- **地址**: `https://webapi.foofish.work` (生产) / `http://localhost:8081` (本地开发)
- **文档**: `docs/api.openapi.json` (OpenAPI 格式)
- **认证**: Sa-Token，Token 通过 `satoken` Header 传递

### 响应格式

```typescript
interface ApiResponse<T> {
  code: number;      // 200 成功，其他失败
  message: string;   // 响应消息
  data: T;           // 响应数据
}
```

### 分页响应

```typescript
interface PageResult<T> {
  records: T[];      // 数据列表
  total: number;     // 总记录数
  pageNum: number;   // 当前页码
  pageSize: number;  // 每页数量
  pages: number;     // 总页数
}
```

## 开发规范

### 代码风格

- 使用 TypeScript 编写所有代码
- 组件使用 `<script setup lang="ts">` 语法
- 使用组合式 API (Composition API)

### 组件规范

- UI 组件放置于 `src/components/ui/`，由 shadcn-vue CLI 管理
- 业务组件放置于 `src/components/`
- 页面组件放置于 `src/views/`

### API 请求

- 所有 API 请求通过 `src/lib/api.ts` 统一管理
- 使用 axios 实例，已配置请求/响应拦截器
- Token 自动从 userStore 获取并注入请求头

### 类型定义

- 所有类型定义放置于 `src/types/index.ts`
- 根据 `docs/api.openapi.json` 定义接口类型
- `OffsetTimeZone`/`ZoneOffset` 类型实际为 ISO 时间字符串

### 日期时间

- 使用 dayjs 处理日期时间
- 日期格式: `YYYY-MM-DD`
- 日期时间格式: `YYYY-MM-DDTHH:mm:ss+08:00` (ISO 8601)

## UI 组件

使用 shadcn-vue 添加组件:

```bash
npx shadcn-vue@latest add <component-name>
```

配置文件: `components.json`

## 注意事项

1. **接口文档**: 所有接口实现必须参考 `docs/api.openapi.json`，不要臆想接口
2. **依赖管理**: 增删依赖使用命令 (`pnpm add`/`pnpm remove`)，不要直接修改 package.json
3. **测试**: 每个功能完成后需进行测试验证
4. **Git 工作流**: 使用 Git Flow 工作流进行版本管理
5. **中文**: 代码注释和提交信息使用中文

---

## 代码规范 (禁止事项)

以下是项目中发现的不规范做法，**严禁在新代码中重复**：

### 1. 代码质量工具

项目已配置以下工具，提交代码时会自动执行：
- **ESLint** - 代码检查 (`eslint.config.js`)
- **Prettier** - 代码格式化 (`.prettierrc`)
- **husky + lint-staged** - Git pre-commit 钩子，自动检查暂存文件
- **commitlint** - 提交信息规范 (`commitlint.config.js`)

提交信息格式: `<type>: <subject>`
```
feat: 新功能
fix: 修复 bug
docs: 文档变更
style: 代码格式
refactor: 重构
perf: 性能优化
test: 测试
build: 构建相关
ci: CI 配置
chore: 其他变更
```

### 2. TypeScript 规范

**禁止:**
- 使用 `any` 类型 - 必须明确类型，实在不行用 `unknown`
  ```typescript
  // 错误
  catch (err: any) { ... }
  function formatDate(date: any) { ... }

  // 正确
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : '未知错误'
  }
  ```

- 空接口 - 如无字段直接删除或使用 `Record<string, never>`
  ```typescript
  // 错误
  interface LogoutPayload { }

  // 正确: 直接不传参数，或使用 void
  ```

- 重复类型定义 - 使用继承或 Pick/Omit 复用
  ```typescript
  // 错误: 两个几乎相同的接口
  interface CreateCoursePayload { code: string; name: string; ... }
  interface UpdateCoursePayload { code: string; name: string; ... }

  // 正确: 复用
  interface CoursePayload { code: string; name: string; ... }
  type CreateCoursePayload = CoursePayload
  type UpdateCoursePayload = Partial<CoursePayload>
  ```

### 3. 代码风格

**禁止:**
- 注释代码残留 - 删除不需要的代码，不要注释保留
  ```typescript
  // 错误
  // localStorage.setItem('token', data.token);

  // 正确: 直接删除
  ```

### 4. UI/UX 规范

**禁止:**
- 使用原生 `alert()`/`confirm()` - 使用 UI 组件库的对话框
  ```typescript
  // 错误
  alert('课程启用成功')
  if (!confirm('确认删除吗？')) return

  // 正确: 使用 AlertDialog 或 Toast 组件
  ```

### 5. 导入规范

**禁止:**
- 路径风格混用 - 统一使用 `@/` 别名
  ```typescript
  // 错误: 混用
  component: () => import('src/views/DashboardView.vue')
  component: () => import('@/views/Department/DepartmentList.vue')

  // 正确: 统一使用 @/
  component: () => import('@/views/DashboardView.vue')
  ```

- 未使用的导入 - 删除无用 import
  ```typescript
  // 错误
  import { useRouter } from 'vue-router'  // 导入了但未使用
  ```

### 6. 函数命名

**禁止:**
- 函数名与实际功能不符
  ```typescript
  // 错误: 名字说是检查纯字符串，实际检查的是纯数字
  function isPureString(str: string): boolean { ... }

  // 正确
  function isNumericString(str: string): boolean { ... }
  ```

### 7. 项目结构

**禁止:**
- `src/utils/` 和 `src/lib/` 职责不清
  - `src/lib/` - 项目核心库：API、工具函数、shadcn 工具
  - `src/utils/` - 应合并到 `src/lib/` 或按功能拆分

### 8. 错误处理

**禁止:**
- 只 `console.error` 不处理用户反馈
  ```typescript
  // 错误
  catch (error) {
    console.error('获取课程列表失败', error)
  }

  // 正确: 给用户反馈
  catch (error) {
    console.error('获取课程列表失败', error)
    toast.error('获取数据失败，请重试')
  }
  ```

---

## 历史遗留问题 (待清理)

以下是项目中已存在的问题，应在后续迭代中逐步修复：

1. `src/types/index.ts` - `LogoutPayload` 空接口应删除
2. `src/stores/user.ts` - 移除未使用的 `useRouter` 导入
3. `src/stores/user.ts` - 移除被注释的 localStorage 代码
4. `src/lib/api.ts` - 多处类型别名冗余，应简化
5. `src/lib/date.ts` - `formatDate` 参数类型应明确，不用 `any`
6. `src/router/index.ts` - 懒加载路径不统一 (`src/` vs `@/`)
7. `src/utils/validate.ts` - `isPureString` 函数名与功能不符
8. `src/example.html` - 无用文件，应删除
9. 多个组件使用 `alert()`/`confirm()` - 应替换为 UI 组件
