# V2 全平台客户端 - 核心演进与架构蓝图

> 文档级别: L0 (最高约束力)
> 架构定位: 工业级、零妥协的多端 Monorepo 架构
> 目标愿景: 基于 Vue 3 (组合式 API) + Tauri 2.0 + Turborepo 构建兼具极致性能与绝对安全的全平台客户端。
> 版本基准日期: 2026-02-26
> 维护人: 待指定

---

## 一、 顶层架构设计 (The Architecture)

系统采用 **Turborepo / pnpm workspace** 驱动的 Strict Monorepo 架构。
严禁应用层（Apps）之间产生水平依赖，强制实行“逻辑下沉、UI 表现分离”的垂直单向数据流。

> 说明: 下方目录树为目标态结构，需与当前仓库逐步对齐。

```text
work_order/
├── package.json               # 锁定依赖版本 (Strict Versioning)
├── pnpm-workspace.yaml        # 定义工作区边界
├── turbo.json                 # 定义构建管道、缓存与任务编排
├── apps/                      # 📺 表现层 (Presentation Layer)
│   ├── web/                   # 纯 Web 客户端 (Vite + Vue 3)
│   ├── desktop/               # 桌面端原生壳 (Tauri 2.0 + Rust)
│   └── mobile/                # 移动端原生壳 (Capacitor/Tauri Mobile)
│
├── packages/                  # ⚙️ 领域逻辑层 (Domain & Infrastructure Layer)
│   ├── core-api/              # 100% 强类型的 API 客户端与 DTO 定义
│   ├── core-store/            # 全局状态机 (Pinia) 与跨端持久化策略
│   ├── shared-utils/          # 纯函数工具集 (要求 100% 单元测试覆盖率)
│   ├── ui-desktop/            # 桌面端定制化 UI 组件 (Element-Plus 封装)
│   └── ui-mobile/             # 移动端定制化 UI 组件 (Vant 封装)
│
└── infra/                     # 🛠️ 基础设施 (DevOps & Tooling)
    ├── eslint-config/         # 全局一致的严格 ESLint/Prettier 规则集
    ├── ts-config/             # 严格模式的 tsconfig 基类
    └── github-actions/        # CI/CD 管道定义 (Lint, Test, Build, Release)
```

---

## 二、 技术栈与工具链 (Tech Stack)

团队不接受过时技术与妥协性技术选型。所有的选型均基于当前（2026）的业界最优解。

- **核心语言**: TypeScript 5.x (`"strict": true`，不允许隐式 `any`)
- **UI 框架**: Vue 3.4+ (仅允许 `<script setup>` 与 Composition API)
- **构建引擎**: Vite 5 (搭配 ESBuild 与 SWC，追求毫秒级冷启动)
- **桌面/系统集成**: Tauri 2.0 (Rust) - 绝不使用 Electron，追求微型包体积与极低内存占用
- **样式引擎**: Tailwind CSS 3.x / UnoCSS (原子化 CSS，零运行时负担)
- **包与任务管理**: pnpm 9.x + Turborepo (实现构建缓存与并发执行)
- **质量门禁**: Husky + lint-staged + Commitlint

> 版本策略: 版本基准以“版本基准日期”为准，未来升级需在单独的版本矩阵文档中记录并评审。

---

## 三、 零妥协的演进路线 (Roadmap)

### Phase 1: 基础设施与强基工程 (Infrastructure Bootstrapping)
*本阶段不产生业务价值，但决定了系统的寿命上限。*
1. **Monorepo 初始化**：部署 `pnpm workspace` 与 `Turborepo`。
2. **制定基类规范**：在 `infra/` 中建立全局统一的 `tsconfig.json`（开启 `noImplicitAny` 与 `strictNullChecks`）、`eslint-config`。
3. **CI 管道搭建**：配置 GitHub Actions，实现 PR 提交时的自动 Lint、类型检查与包依赖审计。
4. **测试框架就绪**：集成 Vitest（单元测试）与 Playwright（端到端测试）。

**退出标准**：
- 可在 CI 中完成 lint、类型检查、单测与构建。
- 项目结构与目录树目标态对齐到 70% 以上。

### Phase 2: 核心领域模型下沉 (Domain Logic Migration)
*将旧系统业务逻辑剥离，使用纯 TypeScript 重构并封装到 `packages/`。*
1. **API 强类型化 (`core-api`)**：使用 OpenAPI 规范自动生成或手动定义所有后端的 DTO (Data Transfer Objects)。封装统一的拦截器，接管鉴权与重试机制。
2. **状态抽象 (`core-store`)**：使用 Pinia 构建核心状态，必须剥离任何与 DOM 或特定 UI 库相关的逻辑。
3. **工具函数提纯 (`shared-utils`)**：将日期处理、权限计算等工具函数抽离。**红线要求**：该包必须达到 100% 的单元测试覆盖率。

**退出标准**：
- API 与核心状态机可在多端复用。
- `shared-utils` 覆盖率达标，且核心逻辑不依赖 UI 层。

### Phase 3: 桌面端 MVP 与系统级集成 (Desktop Engineering)
*以 Tauri 介入系统底层，验证原生体验。*
1. **Tauri 容器初始化**：在 `apps/desktop` 构建 Tauri 项目。
2. **Rust IPC 层开发**：用 Rust 编写安全的系统调用接口（如文件读取、本地通知），通过 `invoke` 暴露给前端。
3. **安全凭证管理**：集成 Tauri Secure Storage 插件，将用户 Token 安全写入系统级密钥链 (macOS Keychain / Windows Credential Manager)。
4. **自动化打包部署**：配置 CI 自动构建 Mac(dmg/app), Windows(msi/exe), Linux(AppImage) 并发布至 Releases。

**退出标准**：
- 桌面端登录与核心流程可用。
- 产出至少一个可安装的桌面端包体。

### Phase 4: 多端 UI 适配与业务对齐 (Multi-End UI Implementation)
*在强健的地基上快速生长表现层。*
1. **响应式架构**：引入全局断点管理，遵循 Mobile-First 设计理念。
2. **桌面端实现**：利用 `ui-desktop` 组装大屏交互（快捷键、多窗口、拖拽）。
3. **移动端实现**：在 `apps/mobile` 中针对触摸交互、下拉刷新、扫码（调用原生摄像头）进行定制化开发。
4. **遗留系统退役**：流量灰度切换，确保新版双端崩溃率 < 0.01% 后，彻底废弃原 `frontend`。

**退出标准**：
- Web/桌面/移动三端功能对齐并通过回归测试。
- 具备灰度发布与回滚策略。

---

> **架构师批注**：对于顶尖团队而言，快不是通过省略步骤得来的，而是通过绝对的规范、优秀的类型提示和自动化工具链带来的。守住这套基建，我们能以十倍速迭代。
