---
description: 拉取请求代码审查工作流，使用 Code Review Agent 审查变更
allowed-tools: Bash(git:*), Read, Grep, Glob
---

# PR Review 命令

你的任务是审查 Pull Request 中的代码变更，使用 `.claude/agents/code-reviewer.md` 中定义的审查标准。

## 步骤

1. **获取 PR 变更**
   ```bash
   git diff origin/main...HEAD
   ```

2. **运行代码审查 Agent**
   - 激活 `code-reviewer` agent
   - 应用完整的审查清单
   - 检查代码质量、安全性、性能

3. **提供反馈**
   - 列出发现的问题
   - 按严重程度分类（严重/中等/轻微）
   - 提供改进建议

4. **生成报告**
   - 总结审查结果
   - 标注必须修复的问题
   - 记录优秀实践

## 审查重点

- **安全性**: SQL 注入、XSS、认证问题
- **性能**: N+1 查询、不必要的计算
- **可维护性**: 代码重复、命名规范
- **测试覆盖**: 是否有足够的测试
- **文档**: API 文档、注释

## 输出格式

```markdown
## 代码审查报告

### 严重问题 (必须修复)
- [ ] 问题描述
  - 位置: file.py:123
  - 建议: 修复方案

### 中等问题 (建议修复)
- [ ] 问题描述

### 轻微问题 (可选修复)
- [ ] 问题描述

### 优秀实践 ✨
- 记录良好的代码实践
```

## 使用示例

```bash
/pr-review
```
