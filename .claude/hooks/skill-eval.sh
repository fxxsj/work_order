#!/bin/bash

# Claude Code Skill Evaluation Hook
# 分析用户提示并建议相关技能

CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_RULES="$SCRIPT_DIR/skill-rules.json"

# 如果没有 skill-rules.json，使用默认规则
if [ ! -f "$SKILL_RULES" ]; then
  exit 0
fi

# 读取提示（从标准输入）
PROMPT=""
if [ -n "$1" ]; then
  PROMPT="$1"
else
  # 尝试从环境变量或文件读取
  if [ -n "$CLAUDE_USER_PROMPT" ]; then
    PROMPT="$CLAUDE_USER_PROMPT"
  else
    exit 0
  fi
fi

# 将 PROMPT 转换为小写用于匹配
PROMPT_LOWER=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')

# 技能匹配函数
match_skill() {
  local skill_name="$1"
  local keywords="$2"
  local priority="$3"

  # 检查关键词
  for keyword in $keywords; do
    if echo "$PROMPT_LOWER" | grep -q "$keyword"; then
      echo "$skill_name:$priority"
      return 0
    fi
  done

  return 1
}

# 定义项目特定的技能和关键词
echo "检测提示中的技能..." >&2

# Vue 组件开发
if match_skill "vue-component-patterns" "vue,component,el-,element,created,mounted" "9"; then
  VUE_MATCH=true
fi

# Django API
if match_skill "django-api-patterns" "django,api,serializer,viewset,model,queryset" "9"; then
  DJANGO_MATCH=true
fi

# 系统调试
if match_skill "systematic-debugging" "debug,error,bug,fix,broken,not working,issue" "8"; then
  DEBUG_MATCH=true
fi

# Git 提交
if match_skill "git-commit" "commit,push,git,branch" "7"; then
  GIT_MATCH=true
fi

# 收集匹配的技能
MATCHED_SKILLS=""

if [ "$VUE_MATCH" = true ]; then
  MATCHED_SKILLS="$MATCHED_SKILLS vue-component-patterns"
fi

if [ "$DJANGO_MATCH" = true ]; then
  MATCHED_SKILLS="$MATCHED_SKILLS django-api-patterns"
fi

if [ "$DEBUG_MATCH" = true ]; then
  MATCHED_SKILLS="$MATCHED_SKILLS systematic-debugging"
fi

if [ "$GIT_MATCH" = true ]; then
  MATCHED_SKILLS="$MATCHED_SKILLS git-commit"
fi

# 输出建议
if [ -n "$MATCHED_SKILLS" ]; then
  echo "" >&2
  echo "🔍 检测到相关技能:" >&2
  for skill in $MATCHED_SKILLS; do
    echo "  - $skill" >&2
  done
  echo "" >&2
  echo "💡 提示: 使用 /skill <skill-name> 激活相关技能" >&2
  echo "" >&2
fi

exit 0
