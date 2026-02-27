# V2 总计划里程碑与验收清单

> 文档级别: L1
> 范围: V2 全平台客户端
> 最后更新: 2026-02-27 08:05
> 维护人: fxxsj

---

## Phase 1 - 基础设施与强基工程

**目标**：Monorepo 基建、规范、CI、测试框架就绪。

**里程碑**
1. Monorepo + Turborepo 可构建并命中缓存。
2. TS/ESLint 规范基类可继承。
3. CI 可执行 lint/type/test/build。
4. Vitest 与 Playwright 至少 1 个示例通过。

**验收清单**
- `pnpm -w build` 可执行且 Turbo 有缓存命中。
- `infra/ts-config`、`infra/eslint-config` 被至少一个包继承。
- `.github/workflows/v2-ci.yml` 含 typecheck 并可通过。
- `pnpm -w test:unit` 与 `pnpm -w test:e2e` 至少 1 个示例通过。

---

## Phase 2 - 领域模型下沉（登录/鉴权优先）

**目标**：核心领域逻辑从 apps 抽离到 packages 并跨端复用。

**里程碑**
1. `core-api` 定义认证契约并支持真实后端对接。
2. `core-store` 提供可注入持久化的认证状态。
3. `shared-utils` 具备可复用工具函数与单测骨架。
4. 至少一个客户端（web）接入核心包并完成登录链路。

**验收清单**
- `packages/core-api`、`packages/core-store`、`packages/shared-utils` 存在且 typecheck 通过。
- `apps/web` 实现登录/登出/获取当前用户。
- 认证请求不写 `localStorage`，使用可注入存储或内存。
- `shared-utils` 有单测入口（至少 1 个用例）。

---

## Phase 3 - 桌面端 MVP 与系统级集成

**目标**：可安装的桌面端验证核心流程。

**里程碑**
1. `apps/desktop` 初始化 Tauri 2.0。
2. Rust IPC 层提供至少 1 个系统能力调用。
3. 安全凭证写入系统密钥链。
4. CI 可打包并产出安装包。

**验收清单**
- `apps/desktop` 可本地启动并展示登录页。
- IPC 调用通过 `invoke` 并带参数校验。
- 凭证不落地到明文存储。
- CI 产出至少 1 个可安装包。

---

## Phase 4 - 多端 UI 适配与业务对齐

**目标**：多端功能对齐并逐步退役旧前端。

**里程碑**
1. `apps/web`/`apps/desktop`/`apps/mobile` 形成统一功能集。
2. `ui-desktop`、`ui-mobile` 组件库具备基础组件集。
3. 灰度发布策略可执行。
4. 旧 `frontend` 退役。

**验收清单**
- 三端功能清单对齐并通过回归测试。
- 具备灰度/回滚文档。
- 线上稳定性达到指标后下线旧前端。
