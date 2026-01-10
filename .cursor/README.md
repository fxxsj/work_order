# Agent Skills 配置目录

本目录包含用于 Cursor AI 编码助手的 Agent Skills 配置文件。

## Skills 说明

### git-commit.md
**用途**: 帮助用户创建规范的 git 提交

**功能**:
- 自动分析代码变更
- 生成符合项目规范的中文提交消息
- 执行 git 提交操作

**使用方式**:
当你在编辑器中完成代码修改后,可以直接对 Cursor 说:
- "帮我提交这些修改"
- "创建一个 git 提交"
- "生成提交消息并提交"

Cursor 会根据这个 skill 的配置:
1. 自动检查 git 状态
2. 分析代码变更
3. 生成符合项目风格的中文提交消息
4. 执行 git commit 命令

**提交消息规范**:
- 格式: `英文类型: 中文描述`
- 冒号前使用英文类型标识(如 `feat:`、`fix:`、`docs:`)
- 冒号后使用中文描述变更内容
- 详细说明全部使用中文
- 简洁明了,突出业务价值
- 示例: `feat: 添加登录功能`、`fix: 修复用户登录错误`

## 扩展说明

你可以在此目录下添加更多的 agent skills,例如:

- `code-review.md` - 代码审查规范
- `testing.md` - 测试编写规范
- `documentation.md` - 文档编写规范
- `api-design.md` - API 设计规范

每个 skill 文件都是一个 Markdown 格式的配置文件,Cursor AI 会自动识别和应用这些技能。

---

**注意**: 这些 skills 是项目特定的配置,会被 Cursor AI 用于辅助开发工作。
