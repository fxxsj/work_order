# SDK（规划中）

本目录用于承载 **基于 OpenAPI 自动生成的客户端类型/SDK**，供 Web / 桌面 / Android 复用。

当前阶段（Phase 0）先落地：

1) 后端 OpenAPI 可导出（见 `openapi/README.md`）  
2) SDK 工程骨架与生成脚本（本目录）

## 生成（类型定义）

前置：已导出 `openapi/openapi.json`。

```bash
cd packages/sdk
npm run generate:types
```

输出：
- `packages/sdk/src/schema.d.ts`

> `generate:types` 使用 `npx openapi-typescript`，首次执行会自动下载依赖（需要可访问 npm registry）。
