# Vue 2 → Vue 3 前端布局迁移对照与改进清单

> 版本: 1.0  
> 更新日期: 2026-02-25  
> 状态: 进行中（以 `apps/web/` 现状为准；Vue2 为历史对照）  
> 适用范围: Web（Vue 3 / Vite / TS / Pinia / Element Plus），并考虑 Desktop(Tauri) / Android(Capacitor) 壳场景

---

## 进度总览（持续更新）

> 本文档聚焦“布局/导航/响应式/长列表性能/页面缓存”等跨页面能力。业务功能覆盖不在本文档展开（参考 `docs/PLATFORM_ANALYSIS.md`）。

### 已落地 ✅

- [x] 认证布局（Header + 桌面侧边栏 + 移动端抽屉）：`apps/web/src/layouts/AuthedLayout.vue`
- [x] 导航从路由元信息生成（`meta.title/group/order/nav`）：`apps/web/src/router/index.ts`
- [x] 页面级统一头部（返回/标题/操作区）：`apps/web/src/components/PageLayout.vue`
- [x] 断点能力（mobile/tablet/desktop + current）：`apps/web/src/composables/useBreakpoints.ts`
- [x] 核心列表页移动端降级（卡片化）：`apps/web/src/views/WorkOrderListView.vue`、`apps/web/src/views/TaskListView.vue`
- [x] 安全区域基础支持：`apps/web/index.html`（`viewport-fit=cover`）+ 全局 CSS（`env(safe-area-inset-*)`）
- [x] 面包屑导航（桌面端）：`apps/web/src/components/BreadcrumbNav.vue`
- [x] 移动端底部 TabBar（核心入口；扫码页隐藏）：`apps/web/src/components/MobileTabBar.vue`
- [x] 列表页模板进一步收敛：`apps/web/src/views/base/ResourceList.vue` 内部对齐 `PageLayout`
- [x] 页面缓存（keep-alive）：`apps/web/src/layouts/AuthedLayout.vue` + `apps/web/src/router/index.ts`（`meta.keepAlive`）
- [x] 全局错误兜底（基础 errorHandler）：`apps/web/src/main.ts`
- [x] 组件级错误边界（路由视图兜底）：`apps/web/src/components/ErrorBoundary.vue`
- [x] 通知中心移动端体验：`apps/web/src/views/NotificationView.vue`（移动端卡片化）

### 待补（优先级从高到低） ⏳

- [ ] 列表页模板化增强（可选）：补齐移动端卡片列表的通用组件/slot 规范
- [ ] 长列表性能（虚拟滚动：Table V2 / useVirtualList 等）
- [ ] 全局体验（骨架屏/错误边界/图标系统/主题与暗色）

---

## 背景与代码来源

### Vue 2 删除历史

仓库曾存在 `frontend/`（Vue 2.7 + Element UI + Webpack），后在以下提交中移除：

`2b3d474 chore: remove vue2 frontend; standardize on vue3 apps/web`

### 对照材料

- 当前实现：`apps/web/src/`（以代码为准）
- 历史参考：`docs/archive/TECHNICAL_ARCHITECTURE_DEPRECATED_2026-02-23.md`（仅用于追溯）

---

## 架构对照（Vue2 vs Vue3）

### 1) 全局布局（Layout）

**Vue 2（历史典型）**
- 单一 `Layout.vue` 负责 Sidebar/Header/Breadcrumb/Tabs/内容区
- 页面内部再按列表/表单/详情做局部布局（常见为 mixin + 模板）

**Vue 3（当前）**
- `AuthedLayout`：统一认证态布局（Header + Sidebar/Drawer + Main）
- `PageLayout`：统一页面级标题栏与 actions 区
- `SideNav`：主导航组件（按分组展示）

现状文件：
- `apps/web/src/layouts/AuthedLayout.vue`
- `apps/web/src/components/PageLayout.vue`
- `apps/web/src/components/SideNav.vue`
- `apps/web/src/router/index.ts`

### 2) 导航与信息架构（IA）

**Vue 2（常见做法）**
- 维护一份菜单配置 + 路由配置；两者容易漂移

**Vue 3（当前做法）**
- 菜单直接从路由 children 的 `meta` 生成：
  - `meta.title`: 显示名称
  - `meta.group`: 分组
  - `meta.order`: 排序
  - `meta.nav`: 是否出现在主导航

收益：
- 避免“菜单/路由重复维护”
- 让导航扩展变成“补 meta + 调 nav 覆盖范围”

### 3) 响应式策略

**Vue 2（历史）**
- 通常只做 `768px` 的 `isMobile` 判定，移动端多为“隐藏侧边栏”

**Vue 3（当前）**
- `useBreakpoints()` + `AuthedLayout` 内的 Sidebar/Drawer 切换
- 移动端核心列表页卡片化（避免小屏表格横向滚动）

当前仍缺：
- 平板（tablet）策略（更细颗粒断点与布局决策）

---

## “迁移中丢失/弱化”的能力清单（对照）

> 下表只列“跨页面/可复用能力”，不直接等价于“必须恢复”。恢复前应先验证真实痛点与数据规模。

| 能力 | Vue2 可能实现形态（历史参考） | Vue3 当前状态 | 风险/影响 | 建议 |
|---|---|---|---|---|
| 虚拟滚动（表格/列表） | `VirtualTable/VirtuaList` 等 | ❌ 未落地 | 数据量大时卡顿 | 先选 1 个高频列表验证收益（任务/通知/施工单） |
| 页面缓存（keep-alive） | `keep-alive + tabs` | ✅ 已落地（基础版） | 返回列表体验改善（核心页） | 按页面补齐 `meta.keepAlive`，避免详情页缓存导致数据错乱 |
| 面包屑导航 | `Breadcrumb` | ❌ 未落地 | 深层页面定位难 | 基于 `route.matched` + `meta.title` 实现 |
| 多标签页（Tabs） | `TabsBar` | ❌ 未落地 | 多任务切换成本高 | 先别做，等面包屑/缓存稳定后再评估 |
| 骨架屏 | `SkeletonLoader` | ❌ 未系统化 | 感知慢 | 先在核心列表页落地 |
| 错误边界 | `ComponentError` | ✅ 已落地（基础版） | 路由视图级兜底 + 全局 errorHandler | 后续按需细化“局部错误边界”与更友好恢复动作 |
| 图标体系 | ElementUI 内置 | ❌ 未引入 | 可读性/可扫读性弱 | 引入 `@element-plus/icons-vue`，关键按钮优先 |
| 主题/暗色模式 | 自定义或依赖框架 | ❌ 未落地 | 夜间/工位屏体验一般 | 若需要再做，先用 CSS variables 打底 |

---

## 代码改进方案（按“小步可回滚”拆分）

### P0：继续减少重复（高收益、低风险）

1. 新增 `ListPageLayout.vue`
   - 组合 `PageLayout + Search + Content(slot) + Pager + Empty`
   - 目标：迁移 3-5 个列表页后明显减少重复样式/结构
2. 新增 `useListPage()` composable
   - 标准化：`page/pageSize/search/loading/reload/errorToast`
3. 把“列表页移动端卡片化”抽成可复用组件（可选）
   - 例如 `MobileListCards` / `MobileTableCard`（先服务 1 个页面再推广）

### P1：导航体验补齐

1. 面包屑 `BreadcrumbNav.vue`
   - 数据源：`route.matched` + `meta.title`
   - 集成位置：`AuthedLayout` 的 main 顶部（不侵入各页面）
2. 移动端底部 TabBar（只覆盖核心入口）
   - 工作台/施工单/任务/通知/扫码
   - 与 Drawer 并存（Drawer 放长尾入口）

### P2：性能与切换体验

1. `keep-alive`
   - `meta.keepAlive = true` 标记核心页面
   - include/keys 设计：避免“详情页缓存导致数据错乱”
2. 虚拟滚动（先做 1 个页面验证）
   - 表格场景：优先调研 Element Plus Table V2
   - 卡片列表：可用 `@vueuse/core` 的 `useVirtualList`

---

## 与现行分析文档的关系

- 当前前端现状与整体路线：`docs/FRONTEND_ANALYSIS.md`
- 平台整体完成度与优化方向：`docs/PLATFORM_ANALYSIS.md`
