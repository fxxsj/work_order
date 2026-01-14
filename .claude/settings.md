# Claude Code Settings 文档

## 环境变量

- `INSIDE_CLAUDE_CODE`: "1" - 表示代码在 Claude Code 中运行
- `BASH_DEFAULT_TIMEOUT_MS`: Bash 命令的默认超时时间（7 分钟）
- `BASH_MAX_TIMEOUT_MS`: Bash 命令的最大超时时间

## Hooks (钩子)

### UserPromptSubmit (用户提交提示时)

- **技能评估**: 分析提示并建议相关技能
- **脚本**: `.claude/hooks/skill-eval.sh`
- **行为**: 匹配关键词、文件路径和模式来建议技能

### PreToolUse (工具使用前)

- **主分支保护**: 防止在 main 分支上编辑文件（5 秒超时）
- **触发器**: 在使用 Edit、Write 工具编辑文件前
- **行为**: 如果在 main 分支上，阻止文件编辑，建议创建功能分支

### PostToolUse (工具使用后)

#### 1. **JS/Vue 代码格式化** (30 秒超时)
- **触发器**: 编辑 `.js`、`.vue`、`.jsx` 文件后
- **命令**: `npx prettier --write`
- **行为**: 格式化代码，如果发现错误显示反馈

#### 2. **Python 代码格式化** (30 秒超时)
- **触发器**: 编辑 `.py` 文件后
- **命令**: `npx black`
- **行为**: 格式化 Python 代码，如果发现错误显示反馈

#### 3. **NPM 安装** (120 秒超时)
- **触发器**: 编辑 `package.json` 文件后
- **命令**: `npm install`
- **行为**: 安装前端依赖，如果安装失败则失败编辑操作

#### 4. **Pip 安装** (120 秒超时)
- **触发器**: 编辑 `requirements.txt` 文件后
- **命令**: `pip install -r requirements.txt`
- **行为**: 安装后端依赖，如果安装失败则失败编辑操作

#### 5. **Django 迁移提醒** (5 秒超时)
- **触发器**: 编辑 `models.py` 文件后
- **行为**: 提醒用户运行数据库迁移命令

## Hook 响应格式

```json
{
  "feedback": "显示给用户的消息",
  "suppressOutput": true,
  "block": true,
  "continue": false
}
```

## Hooks 中的环境变量

- `$CLAUDE_TOOL_INPUT_FILE_PATH`: 正在编辑的文件路径
- `$CLAUDE_TOOL_NAME`: 正在使用的工具名称
- `$CLAUDE_PROJECT_DIR`: 项目根目录

## 退出码

- `0`: 成功
- `1`: 非阻塞错误（显示反馈）
- `2`: 阻塞错误（仅 PreToolUse - 阻止操作）

## 项目特定配置

### 前端格式化
- 使用 Prettier 格式化 JavaScript、Vue、JSX 文件
- 运行在 `frontend/` 目录下

### 后端格式化
- 使用 Black 格式化 Python 文件
- 运行在 `backend/` 目录下

### 依赖管理
- 前端依赖自动安装（package.json 变更时）
- 后端依赖自动安装（requirements.txt 变更时）

### Django 模型变更
- 检测到 `models.py` 变更时提醒运行迁移
- 不自动运行迁移，仅提示用户

## Git 工作流保护

- 阻止在 main 分支上的文件编辑
- 强制使用功能分支进行开发
- 确保代码审查流程

## 自定义配置

如需自定义 hooks，请修改 `.claude/settings.json` 文件：

1. 调整超时时间
2. 添加新的 hook 规则
3. 修改格式化命令
4. 添加自定义验证逻辑

**注意**: 修改配置后无需重启，Claude Code 会自动加载新配置。
