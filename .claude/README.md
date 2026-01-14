# Claude Code 配置目录

本目录包含 Claude Code 的所有配置文件、技能、命令和代理。

## 目录结构

```
.claude/
├── settings.json              # 主配置文件（Hooks、环境变量）
├── settings.md                # 配置文档说明
├── settings.local.json        # 个人本地配置（gitignore）
├── .gitignore                 # Git 忽略规则
│
├── agents/                    # AI 代理
│   ├── code-reviewer.md       # 代码审查代理
│   └── github-workflow.md     # GitHub 工作流代理
│
├── commands/                  # 斜杠命令 (/command-name)
│   ├── pr-review.md           # PR 审查命令
│   ├── code-quality.md        # 代码质量检查命令
│   └── test.md                # 测试运行命令
│
├── hooks/                     # Hook 脚本
│   ├── skill-eval.sh          # 技能评估脚本
│   └── skill-rules.json       # 技能匹配规则
│
├── skills/                    # 领域知识技能
│   ├── vue-component-patterns/    # Vue 组件开发模式
│   ├── django-api-patterns/       # Django API 开发模式
│   └── systematic-debugging/      # 系统化调试方法
│
└── rules/                     # 模块化指令（可选）
    └── code-style.md
```

## 快速开始

### 1. 使用技能 (Skills)

Claude 会根据你的提示自动建议相关技能，或者你可以手动激活：

```bash
# 自动建议（由 skill-eval.sh hook 提供）
帮我创建一个 Vue 组件

# 手动激活
/skill vue-component-patterns
```

### 2. 使用命令 (Commands)

```bash
/pr-review          # 审查 PR 代码
/code-quality       # 运行代码质量检查
/test               # 运行测试套件
```

### 3. 使用代理 (Agents)

代理会在复杂任务中自动激活，或者你可以明确指定：

```bash
# 使用代码审查代理
请使用 code-reviewer agent 审查我的代码

# 使用 GitHub 工作流代理
请使用 github-workflow agent 帮我创建 PR
```

## 技能列表

### vue-component-patterns
- **描述**: Vue.js 2.7 组件开发模式
- **何时使用**: 创建或修改 Vue 组件
- **包含内容**: Element UI 使用、状态管理、表单处理、API 调用

### django-api-patterns
- **描述**: Django REST Framework API 开发模式
- **何时使用**: 创建或修改 Django API
- **包含内容**: 序列化器、视图、路由、权限、测试

### systematic-debugging
- **描述**: 系统化调试方法
- **何时使用**: 遇到 bug 或错误
- **包含内容**: 四阶段调试流程、前端/后端调试、常见问题诊断

## 命令列表

### /pr-review
审查 Pull Request 中的代码变更

### /code-quality
运行代码质量检查工具（linting、测试、类型检查）

### /test
运行前端和后端测试套件

## 代理列表

### code-reviewer
- **描述**: 代码审查专家
- **何时使用**: PR 审查或重要代码变更后
- **检查内容**: 安全性、性能、代码质量、最佳实践

### github-workflow
- **描述**: Git 和 GitHub 工作流专家
- **何时使用**: Git 操作、分支管理、PR 创建
- **包含内容**: 分支管理、提交规范、PR 管理、冲突解决

## Hooks 说明

### UserPromptSubmit
- **技能评估**: 分析提示并建议相关技能
- **脚本**: `hooks/skill-eval.sh`
- **行为**: 匹配关键词、文件路径和模式

### PreToolUse
- **主分支保护**: 防止在 main 分支上编辑文件
- **触发器**: Edit、Write 工具
- **行为**: 如果在 main 分支，阻止编辑并建议创建功能分支

### PostToolUse
- **代码格式化**: 自动格式化 JS/Vue 和 Python 文件
- **依赖安装**: package.json 或 requirements.txt 变更时自动安装
- **Django 迁移提醒**: models.py 变更时提醒运行迁移

## 自定义配置

### 个人本地配置

创建 `settings.local.json` 覆盖默认配置（不会提交到 Git）：

```json
{
  "env": {
    "CUSTOM_VAR": "value"
  },
  "hooks": {
    // 你的个人 hooks
  }
}
```

### 添加新技能

1. 在 `skills/` 目录创建新文件夹
2. 创建 `SKILL.md` 文件（注意文件名必须是大写）
3. 在 `skill-rules.json` 中添加技能定义

### 添加新命令

1. 在 `commands/` 目录创建 `<command-name>.md` 文件
2. 添加 frontmatter 和指令内容

### 添加新代理

1. 在 `agents/` 目录创建 `<agent-name>.md` 文件
2. 添加 frontmatter 和系统提示

## 环境变量

配置以下环境变量以启用 MCP 服务器：

```bash
# GitHub（用于 PR 操作）
export GITHUB_TOKEN="your-github-token"

# PostgreSQL（用于数据库查询）
export DATABASE_URL="postgresql://user:password@localhost/dbname"

# Brave Search（用于网络搜索）
export BRAVE_API_KEY="your-brave-api-key"
```

## 常见问题

### Q: 如何禁用某个 hook？
编辑 `settings.json`，删除或注释掉相应的 hook 配置。

### Q: 技能没有自动激活怎么办？
检查 `skill-rules.json` 中的关键词配置，或手动使用 `/skill` 命令激活。

### Q: 如何修改代码格式化工具？
编辑 `settings.json` 中的 PostToolUse hooks，将 Prettier/Black 替换为你喜欢的工具。

### Q: MCP 服务器连接失败怎么办？
1. 检查环境变量是否正确配置
2. 确保已安装 npx：`npm install -g npx`
3. 查看 MCP 服务器日志了解详细错误

## 相关资源

- [Claude Code 文档](https://github.com/anthropics/claude-code)
- [项目 CLAUDE.md](../CLAUDE.md) - 项目记忆
- [.mcp.json](../.mcp.json) - MCP 服务器配置

## 维护

更新配置时：
1. 保持技能文档的简洁性（< 500 行）
2. 使用清晰的描述以便 Claude 能够正确匹配
3. 定期审查和更新技能内容
4. 保持与项目代码的同步

---

**最后更新**: 2026-01-14
**项目**: 印刷施工单跟踪系统
