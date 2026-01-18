# Claude Code 配置说明

本文档说明项目中的 Claude Code 配置及其使用方法。

## 配置概览

参考 [claude-code-showcase](https://github.com/fxxsj/claude-code-showcase) 项目，为印刷施工单跟踪系统配置了完整的 Claude Code 支持。

## 已创建的配置文件

### 1. 项目根目录文件

- **[CLAUDE.md](../CLAUDE.md)** - 项目记忆文件
  - 项目基本信息（技术栈、目录结构）
  - 代码规范和最佳实践
  - 常用命令
  - Git 提交规范

- **[.mcp.json](../.mcp.json)** - MCP 服务器配置
  - GitHub 集成
  - PostgreSQL 数据库访问
  - 文件系统访问
  - 记忆服务
  - Brave 搜索（可选）

### 2. .claude/ 目录配置

#### 核心配置

- **[.claude/settings.json](../.claude/settings.json)** - 主配置文件
  - Hooks 配置
  - 环境变量
  - 自动格式化规则

- **[.claude/settings.md](../.claude/settings.md)** - 配置文档
  - Hooks 说明
  - 环境变量说明
  - 使用指南

- **[.claude/README.md](../.claude/README.md)** - 配置目录说明
  - 目录结构
  - 使用示例
  - 常见问题

#### 技能 (Skills)

1. **[vue-component-patterns](../.claude/skills/vue-component-patterns/SKILL.md)**
   - Vue.js 2.7 组件开发模式
   - Element UI 使用指南
   - 状态管理、表单处理、API 调用

2. **[django-api-patterns](../.claude/skills/django-api-patterns/SKILL.md)**
   - Django REST Framework API 开发
   - 序列化器、视图、路由
   - 权限管理、测试

3. **[systematic-debugging](../.claude/skills/systematic-debugging/SKILL.md)**
   - 四阶段系统化调试流程
   - 前端和后端调试方法
   - 常见问题诊断

#### 命令 (Commands)

1. **[/pr-review](../.claude/commands/pr-review.md)** - PR 代码审查
2. **[/code-quality](../.claude/commands/code-quality.md)** - 代码质量检查
3. **[/test](../.claude/commands/test.md)** - 运行测试套件

#### 代理 (Agents)

1. **[code-reviewer](../.claude/agents/code-reviewer.md)** - 代码审查专家
2. **[github-workflow](../.claude/agents/github-workflow.md)** - Git 工作流专家

#### Hooks (钩子)

- **[skill-eval.sh](../.claude/hooks/skill-eval.sh)** - 技能评估脚本
  - 分析用户提示
  - 自动建议相关技能

- **[skill-rules.json](../.claude/hooks/skill-rules.json)** - 技能匹配规则
  - 关键词定义
  - 目录映射
  - 优先级配置

## 功能特性

### 1. 自动化工作流

#### 代码格式化
- **前端**: 自动使用 Prettier 格式化 .js、.vue、.jsx 文件
- **后端**: 自动使用 Black 格式化 .py 文件

#### 依赖管理
- **前端**: package.json 变更时自动运行 `npm install`
- **后端**: requirements.txt 变更时自动运行 `pip install`

#### Django 支持
- models.py 变更时提醒运行数据库迁移

#### 分支保护
- 阻止在 main 分支上直接编辑文件
- 强制使用功能分支开发

### 2. 智能技能建议

系统会根据你的提示自动建议相关技能：

```bash
# 示例 1：创建 Vue 组件
你: 帮我创建一个施工单列表组件
Claude: 🔍 检测到相关技能: vue-component-patterns

# 示例 2：修复 API bug
你: API 返回 404 错误
Claude: 🔍 检测到相关技能: django-api-patterns, systematic-debugging

# 示例 3：提交代码
你: 提交我的代码
Claude: 🔍 检测到相关技能: git-commit
```

### 3. 斜杠命令

快速执行常用任务：

```bash
/pr-review          # 审查当前 PR
/code-quality       # 运行代码质量检查
/test               # 运行所有测试
```

### 4. MCP 服务器集成

连接外部服务和工具：

- **GitHub**: PR 管理、Issue 跟踪
- **PostgreSQL**: 数据库查询和分析
- **Filesystem**: 文件系统操作
- **Memory**: 持久化记忆
- **Brave Search**: 网络搜索（可选）

## 使用指南

### 基本使用

1. **启动 Claude Code**
   ```bash
   cd /home/chenjiaxing/文档/work_order
   claude
   ```

2. **使用技能**
   ```bash
   # 自动激活（系统会建议）
   帮我创建一个 Vue 组件

   # 手动激活
   /skill vue-component-patterns
   ```

3. **使用命令**
   ```bash
   /code-quality
   ```

4. **使用代理**
   ```bash
   使用 code-reviewer agent 审查我的代码
   ```

### 配置环境变量

创建 `.env` 文件或在 `~/.bashrc` 中添加：

```bash
# GitHub Token（用于 PR 操作）
export GITHUB_TOKEN="your-github-token"

# Database URL（可选）
export DATABASE_URL="postgresql://user:password@localhost/dbname"

# Brave API Key（可选，用于网络搜索）
export BRAVE_API_KEY="your-brave-api-key"
```

### 自定义配置

#### 个人本地配置

创建 `.claude/settings.local.json`：

```json
{
  "env": {
    "CUSTOM_VAR": "value"
  }
}
```

#### 添加新技能

1. 创建技能目录：
   ```bash
   mkdir -p .claude/skills/my-skill
   ```

2. 创建 SKILL.md：
   ```markdown
   ---
   name: my-skill
   description: 我的自定义技能
   ---

   # 我的技能

   ## 使用说明
   ...
   ```

3. 在 `skill-rules.json` 中添加技能定义

## 项目特定配置

### 前端 (Vue.js)

- **框架**: Vue 2.7 + Element UI
- **状态管理**: Vuex
- **路由**: Vue Router
- **HTTP**: Axios
- **格式化**: Prettier

### 后端 (Django)

- **框架**: Django 4.2 + DRF 3.14
- **数据库**: SQLite（开发）/ PostgreSQL（生产）
- **格式化**: Black
- **管理命令**: 自定义管理命令支持

### Git 工作流

- **分支命名**: `{type}/{description}`
  - `feat/` - 新功能
  - `fix/` - 修复 bug
  - `refactor/` - 重构
  - `docs/` - 文档更新

- **提交格式**: 中文描述
  - `feat: 新增施工单列表页面`
  - `fix: 修复任务状态更新错误`

## 最佳实践

### 1. 开发流程

```bash
# 1. 创建功能分支
git checkout -b feat/new-feature

# 2. 开发（Claude 会自动激活相关技能）
# Claude 会自动格式化代码

# 3. 提交（使用 git-commit 技能）
git add .
git commit -m "feat: 新增功能描述"

# 4. 推送并创建 PR
git push -u origin feat/new-feature
gh pr create
```

### 2. 代码审查

```bash
# 运行代码质量检查
/code-quality

# 运行测试
/test

# 创建 PR 前审查
/pr-review
```

### 3. 调试问题

```bash
# 激活调试技能
/skill systematic-debugging

# Claude 会引导你：
# 1. 观察问题
# 2. 分析原因
# 3. 提出假设
# 4. 验证修复
```

## 目录结构

```
work_order/
├── CLAUDE.md                      # 项目记忆
├── .mcp.json                      # MCP 配置
├── .claude/
│   ├── settings.json              # 主配置
│   ├── settings.md                # 配置文档
│   ├── README.md                  # 配置说明
│   ├── agents/                    # 代理
│   │   ├── code-reviewer.md
│   │   └── github-workflow.md
│   ├── commands/                  # 命令
│   │   ├── pr-review.md
│   │   ├── code-quality.md
│   │   └── test.md
│   ├── hooks/                     # 钩子
│   │   ├── skill-eval.sh
│   │   └── skill-rules.json
│   └── skills/                    # 技能
│       ├── vue-component-patterns/
│       ├── django-api-patterns/
│       └── systematic-debugging/
├── frontend/                      # 前端代码
├── backend/                       # 后端代码
└── docs/                          # 文档
```

## 常见问题

### Q: 技能没有自动激活？

**A**: 检查以下几点：
1. 确认 `skill-eval.sh` 有执行权限
2. 查看 `skill-rules.json` 中的关键词配置
3. 尝试手动激活：`/skill skill-name`

### Q: 代码格式化不工作？

**A**:
1. 确认已安装 Prettier：`cd frontend && npm install -D prettier`
2. 确认已安装 Black：`pip install black`
3. 检查 `.claude/settings.json` 中的 hook 配置

### Q: MCP 服务器连接失败？

**A**:
1. 确认已安装 npx：`npm install -g npx`
2. 检查环境变量是否正确配置
3. 查看 MCP 服务器日志

### Q: 如何禁用某个功能？

**A**: 编辑 `.claude/settings.json`，删除或注释掉相应的 hook 配置。

## 进阶使用

### 1. 自定义 Hook

在 `.claude/settings.json` 中添加自定义 hook：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "你的自定义命令",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### 2. 创建自定义命令

在 `.claude/commands/` 中创建 `.md` 文件：

```markdown
---
description: 我的自定义命令
allowed-tools: Bash, Read, Grep
---

# 我的命令

你的任务说明...
```

### 3. 创建自定义技能

按照技能模板创建新的 SKILL.md：

```markdown
---
name: my-custom-skill
description: 我的自定义技能描述
---

# 技能标题

## When to Use
- 使用场景 1
- 使用场景 2

## 核心模式
...
```

## 相关资源

- [Claude Code 官方文档](https://github.com/anthropics/claude-code)
- [参考项目: claude-code-showcase](https://github.com/fxxsj/claude-code-showcase)
- [项目 README](../README.md)
- [.claude/README.md](../.claude/README.md)

## 维护

### 更新配置

- 定期审查和更新技能内容
- 根据项目变化调整技能规则
- 保持与项目代码的同步

### 贡献

如果你创建了新的技能或改进了配置，欢迎提交 PR！

---

**最后更新**: 2026-01-14
**项目**: 印刷施工单跟踪系统
**版本**: v2.0.0
