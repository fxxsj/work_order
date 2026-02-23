# 贡献指南

欢迎提交 Issue 和 Pull Request。

## 开发环境

- Node.js >= 18（本仓库使用 npm workspaces）
- Python（后端依赖见 `backend/requirements.txt`）

## 常用命令

```bash
# Web（apps/web）
npm run web:dev

# Desktop（apps/desktop）
npm run desktop:dev

# Android（apps/mobile）
npm run android:init
npm run android:build
```

后端命令请参考 `docs/QUICKSTART.md` 和 `backend/SERVER_STARTUP.md`。

## 提交内容建议

- 变更包含必要的说明（问题背景、方案、影响范围）
- 如涉及接口变更，同步更新 OpenAPI / SDK（如适用）
- 如涉及文档变更，更新 `docs/README.md` 中的索引（如适用）

