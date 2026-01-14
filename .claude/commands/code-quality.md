---
description: 运行代码质量检查，包括 linting、类型检查和测试
allowed-tools: Bash(npm:*,python:*), Read
---

# Code Quality 命令

你的任务是运行项目的代码质量检查工具，并修复发现的问题。

## 步骤

1. **前端代码检查**
   ```bash
   cd frontend && npm run lint
   ```

2. **后端代码检查**
   ```bash
   cd backend && python manage.py check
   ```

3. **运行测试**
   ```bash
   # 前端测试
   cd frontend && npm test

   # 后端测试
   cd backend && python manage.py test
   ```

4. **类型检查**
   ```bash
   # 如果使用 TypeScript
   cd frontend && npx tsc --noEmit
   ```

5. **修复问题**
   - 自动修复：`npm run lint -- --fix`
   - 手动修复：根据报告逐一解决

6. **生成报告**
   - 总结发现的问题
   - 列出已修复的问题
   - 标注需要手动修复的问题

## 质量标准

### 前端
- ESLint 无错误
- Prettier 格式正确
- 单元测试通过

### 后端
- Django check 通过
- 无未使用的导入
- 符合 PEP 8 规范
- 测试覆盖率 > 80%

## 输出格式

```markdown
## 代码质量报告

### 检查结果
- ✅ ESLint: 通过
- ✅ Django Check: 通过
- ✅ Tests: 42/42 通过

### 发现的问题
- [ ] 严重: X
- [ ] 警告: Y

### 已修复
- 修复了 5 个 linting 错误
- 优化了 3 个查询

### 需要手动修复
- [ ] 文件: frontend/src/views/WorkOrder/List.vue:123
  - 问题: XXX
  - 建议: YYY
```

## 使用示例

```bash
/code-quality
```
