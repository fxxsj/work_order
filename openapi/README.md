# OpenAPI Schema

本目录用于存放从后端导出的 OpenAPI schema（用于生成多端 SDK / 类型定义）。

## 导出（推荐）

在后端虚拟环境已安装依赖的前提下：

```bash
bash scripts/openapi/export-backend-openapi.sh
```

默认输出：
- `openapi/openapi.json`（已在 `.gitignore` 忽略，不建议提交）

## 为什么不提交 schema 文件？

schema 属于构建产物，容易在分支/环境间产生冲突。推荐把“导出脚本 + 生成流程”纳入 CI，而不是手动维护导出文件。
