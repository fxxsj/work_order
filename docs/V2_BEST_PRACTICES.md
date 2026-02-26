# V2 全平台客户端 - 世界级工程规范与最佳实践

> 文档级别: L1
> 适用范围: V2 全端代码与基础设施
> 维护人: 待指定
> 最后更新: 2026-02-26
> 变更记录: 2026-02-26 调整可落地规范、补充豁免流程与质量门禁要求

> 💡 **架构师箴言**：规范不是建议，是团队协作的铁律。任何违反以下红线的代码，均无法通过 CI 管道并将在 Code Review 中被无条件驳回。

---

## 零、 绝对红线 (The Absolute Red Lines)

1. **类型安全**：TypeScript `"strict": true`。禁止使用隐式 `any`。遇到类型难题必须定义准确的 `interface` 或 `type`，滥用 `@ts-ignore` 或 `any` 将被视为代码缺陷。
2. **零容忍控制台**：生产环境代码绝不允许出现任何形式的 `console.log` / `console.warn`。
   - **落地要求**：在 ESLint 中启用 `no-console`，并在 CI 的 lint 阶段强制执行。
   - **替代方案**：统一使用项目的 Logger 服务（需在工程内提供标准封装与用法示例）。
3. **圈复杂度与文件体积**：
   - 任何单文件组件 (.vue) **严格禁止超过 300 行**。超过即必须拆分业务 Hooks (逻辑层) 或子组件 (UI 层)。
   - 函数的圈复杂度 (Cyclomatic Complexity) 必须 ≤ 10。过多的 `if/else` 必须通过策略模式或卫语句重构。
4. **测试覆盖率**：
   - `packages/shared-utils` 下的纯函数必须保持 **100%** 的单元测试覆盖率。
   - 其余包默认最低覆盖率 **80%**，如需例外必须在对应包的文档中说明并获技术负责人批准。

### 豁免流程 (Exception Process)
- 仅在业务紧急或技术限制的情况下申请豁免。
- 申请必须包含: 问题描述、影响范围、临时方案、最终修复日期。
- 通过后需在 PR 中标注，并在迭代复盘时清理。

---

## 一、 架构与依赖约束 (Monorepo Conventions)

### 1. 边界防御与单向依赖
- **禁止反向依赖**：`packages/` 下的领域包绝对不知道 `apps/` 的存在。
- **禁止跨应用耦合**：`apps/web` 与 `apps/mobile` 之间物理隔离，严禁相互 import。
- **禁止私自引入库**：业务开发人员不得在单包中随意 `pnpm install` 第三方库。所有核心基础库必须在工作区根目录统一规划版本，避免依赖地狱和版本冲突。

### 2. 命名契约 (Naming Conventions)
- **目录/文件**：`kebab-case` (如 `work-order-detail.vue`)。唯一例外：暴露为类的纯 TS 文件可使用 `PascalCase`。
- **组件**：严格使用多词大驼峰 `PascalCase` (如 `GlobalHeader.vue`)。
- **组合式函数**：`use` 前缀的小驼峰 (如 `useWorkOrderList.ts`)。
- **类型/接口**：大驼峰。禁止使用 `I` 前缀 (如 `WorkOrder`，而非 `IWorkOrder`)。

---

## 二、 现代 Vue 3 范式 (Vue 3 Paradigm)

### 1. 响应式与状态声明
- **强制 `<script setup lang="ts">`**：禁止回退到 Options API。
- **Ref vs Reactive**：
  - 基础类型 (string, boolean, number) 强制使用 `ref`。
  - 复杂表单对象、字典树，推荐使用 `reactive` 聚合状态。
- **禁止直接解构 props**：解构会丢失响应式。
  - 若项目 Vue 版本 < 3.5，必须使用 `toRefs`。
  - 仅当项目升级到 3.5+，才允许使用响应式解构语法。

### 2. 状态隔离与突变 (Mutation) 控制
- **单向数据流铁律**：子组件绝对**禁止**直接修改传入的 `props`。
- **双向绑定标准**：涉及跨组件状态修改，统一使用 `defineModel` 宏（Vue 3.4+）或严格的 `emit('update:xxx')` 模式。
- **组件内聚**：组件自己能计算出来的值，坚决不要通过 `props` 传进去。充分利用 `computed`。

---

## 三、 API 契约与异步流 (API & Async Operations)

### 1. 强类型的网络层
在 `packages/core-api` 中，每一个接口都必须是纯函数，且拥有精确的入参与出参类型。
```typescript
// 规范示例
export interface GetOrderParams { status?: number; keyword?: string; }
export interface OrderDTO { id: string; title: string; createdAt: string; }

export const fetchOrders = (params: GetOrderParams): Promise<OrderDTO[]> => {
  return httpClient.get<OrderDTO[]>('/v1/orders', { params })
}
```
*前端绝不在组件里拼接 URL 或处理底层的 Axios 错误，所有网络逻辑全部内聚在 API 模块。*

### 2. 竞态与内存泄漏处理
- 发起新的请求前，如有未完成的同类请求，必须通过 `AbortController` 取消前一个请求。
- 组件销毁 (`onUnmounted`) 时，必须清理定时器、WebSocket 连接和原生的事件监听器。

---

## 四、 安全防御与原生交互 (Security & IPC)

本项目涉及 Tauri 桌面端与原生系统交互，前端不再是单纯的沙盒。

### 1. Tauri IPC 隔离与审查
- **最小权限原则**：Tauri `tauri.conf.json` 的 `allowlist` 必须只开启极其必要的接口。禁止开启通用的 `shell:execute` 或全盘 `fs:read_dir`。
- **前端无信任**：即便在 Tauri 中，Rust 后端接收到的任何来自前端的 `invoke` 参数都必须被视为“可能已被注入恶意代码”，必须在 Rust 层进行二次校验。

### 2. 本地敏感数据存储
- **禁止 localStorage 明文**：Token、密码等敏感信息，**绝对不允许**存储在 Web 的 `localStorage` 中。
- **规范方案**：使用 Tauri/Capacitor 的 Secure Storage 插件，并由项目封装统一接口，避免业务层直连。

---

## 五、 DevOps 与防腐烂管道 (CI/CD Pipeline)

在代码合并到 `main` 分支前，必须经过无情的自动化审查：

1. **Pre-commit 钩子 (Husky)**：
   - 触发 `lint-staged`。
   - 触发 `Commitlint`，严格校验 `feat/fix/chore/refactor` 格式。不符合规范的 Commit Message 直接拒绝。
2. **CI 拦截器**：
   - **类型检查**：运行类型检查脚本，发现任何 TS 类型错误则 Pipeline 失败。
   - **自动化测试**：运行单元测试。核心工具包覆盖率低于 100% 则 Pipeline 失败。
3. **童子军原则 (Boy Scout Rule)**：
   - 如果你修改了一个历史文件，必须随手将其中的不规范写法（如魔术字符串、冗长嵌套）重构。离开代码库时，让它比你来的时候更干净。
