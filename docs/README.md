# docs/ 文档索引

> 最后更新：2026-02-23  
> 目标：只保留“与当前代码一致”的核心文档；历史分析/阶段总结统一放入 `docs/archive/`。

## 推荐阅读顺序（核心）

1. [QUICKSTART.md](QUICKSTART.md) - 本地启动（后端 + Web + 桌面 + Android）
2. [ARCHITECTURE_IMPROVEMENT.md](ARCHITECTURE_IMPROVEMENT.md) - 现行架构/目录约定/演进计划（以 `apps/web` 为主）
3. [PLATFORM_ANALYSIS.md](PLATFORM_ANALYSIS.md) - 现状盘点与已落地优化项（以代码为准）
4. [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API 约定与主要端点说明
5. [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - 开发规范与本地开发/部署注意事项

## 交付与发布

- [MULTI_PLATFORM_CLIENT_PLAN.md](MULTI_PLATFORM_CLIENT_PLAN.md) - 多端路线（Web / Desktop / Android）
- [PHASE1_BOOTSTRAP.md](PHASE1_BOOTSTRAP.md) - Phase1 壳化启动（Tauri/Capacitor）
- [CLIENT_RELEASE.md](CLIENT_RELEASE.md) - 多端发布命令与注意事项
- [RELEASE_DRY_RUN.md](RELEASE_DRY_RUN.md) - 发布演练清单

## 运维与治理

- [DEPLOYMENT.md](DEPLOYMENT.md) - 部署/反代/静态资源
- [TESTING.md](TESTING.md) - 测试与验证
- [PERMISSIONS.md](PERMISSIONS.md) / [PERMISSIONS_BEST_PRACTICES.md](PERMISSIONS_BEST_PRACTICES.md) - 权限与最佳实践
- [DATA_INITIALIZATION_ANALYSIS.md](DATA_INITIALIZATION_ANALYSIS.md) - 初始化数据与迁移说明

## 项目规划（GSD）

- [.planning/PROJECT.md](../.planning/PROJECT.md)
- [.planning/ROADMAP.md](../.planning/ROADMAP.md)
- [.planning/STATE.md](../.planning/STATE.md)
- [.planning/research/SUMMARY.md](../.planning/research/SUMMARY.md)

## 历史归档

- [archive/](archive/) - 历史分析/阶段总结（以目录内容为准）

注意：`docs/archive/` 内大量文档对应旧版 `frontend/`（Vue2/webpack）目录结构，仅供追溯，不应作为当前实现依据。

详细更新历史请查看：[DOCUMENTATION_UPDATE_LOG.md](DOCUMENTATION_UPDATE_LOG.md)
