#!/bin/bash

# 前端重构辅助脚本 - 目录重命名
# 用途：批量重命名不规范的目录名

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "========================================="
echo "前端重构 - 目录重命名工具"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 需要重命名的目录映射（旧名 -> 新名）
declare -A RENAME_MAP=(
    ["productGroup"]="product-group"
    ["foilingplate"]="foiling-plate"
    ["embossingplate"]="embossing-plate"
)

# 检查是否在正确的分支
echo "检查 Git 分支..."
CURRENT_BRANCH=$(git -C "$PROJECT_ROOT" branch --show-current)
if [ "$CURRENT_BRANCH" != "refactor/frontend-v3" ]; then
    echo -e "${RED}错误：当前不在 refactor/frontend-v3 分支${NC}"
    echo "当前分支：$CURRENT_BRANCH"
    echo "请先切换到重构分支：git checkout refactor/frontend-v3"
    exit 1
fi
echo -e "${GREEN}✓ 当前在 refactor/frontend-v3 分支${NC}"
echo ""

# 显示将要执行的重命名操作
echo "将执行以下目录重命名："
echo "-----------------------------------"
for old_name in "${!RENAME_MAP[@]}"; do
    new_name="${RENAME_MAP[$old_name]}"
    old_path="$FRONTEND_DIR/src/views/$old_name"
    new_path="$FRONTEND_DIR/src/views/$new_name"

    if [ -d "$old_path" ]; then
        echo -e "${YELLOW}$old_name${NC} → ${GREEN}$new_name${NC}"
    else
        echo -e "${RED}⚠ $old_name 目录不存在，跳过${NC}"
    fi
done
echo ""

# 确认操作
read -p "确认执行重命名操作吗？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "操作已取消"
    exit 0
fi

echo ""
echo "开始重命名..."
echo ""

# 执行重命名
renamed_count=0
for old_name in "${!RENAME_MAP[@]}"; do
    new_name="${RENAME_MAP[$old_name]}"
    old_path="$FRONTEND_DIR/src/views/$old_name"
    new_path="$FRONTEND_DIR/src/views/$new_name"

    if [ -d "$old_path" ]; then
        echo "重命名：$old_name → $new_name"
        git -C "$PROJECT_ROOT" mv "$old_path" "$new_path"
        echo -e "${GREEN}✓ 完成${NC}"
        ((renamed_count++))
    fi
done

echo ""
echo "========================================="
echo -e "${GREEN}目录重命名完成！${NC}"
echo "已重命名 $renamed_count 个目录"
echo "========================================="
echo ""
echo "下一步："
echo "1. 运行 update-imports.sh 更新所有 import 路径"
echo "2. 运行 rename-components.sh 重命名组件文件"
echo ""
