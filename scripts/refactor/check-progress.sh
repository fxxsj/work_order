#!/bin/bash

# 前端重构辅助脚本 - 进度检查
# 用途：检查重构进度和规范符合度

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "========================================="
echo "前端重构 - 进度检查工具"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. 检查目录命名
echo -e "${BLUE}1. 检查目录命名规范${NC}"
echo "-----------------------------------"

bad_dirs=0
good_dirs=0

for dir in "$FRONTEND_DIR/src/views"/*; do
    if [ -d "$dir" ]; then
        dirname=$(basename "$dir")

        # 检查是否包含大写字母（排除特殊目录）
        if [[ "$dirname" =~ [A-Z] ]] && [[ "$dirname" != "Dashboard" ]] && [[ "$dirname" != "Login" ]]; then
            echo -e "${RED}✗${NC} 不规范：$dirname (包含大写字母)"
            ((bad_dirs++))
        elif [[ "$dirname" =~ _ ]]; then
            echo -e "${RED}✗${NC} 不规范：$dirname (包含下划线)"
            ((bad_dirs++))
        else
            ((good_dirs++))
        fi
    fi
done

echo ""
echo -e "规范目录：${GREEN}$good_dirs${NC}"
echo -e "不规范目录：${RED}$bad_dirs${NC}"
echo ""

# 2. 检查组件命名
echo -e "${BLUE}2. 检查组件文件命名${NC}"
echo "-----------------------------------"

generic_names=0
good_names=0

# 查找所有 List.vue、Form.vue、Detail.vue
for pattern in "List.vue" "Form.vue" "Detail.vue"; do
    files=$(find "$FRONTEND_DIR/src/views" -name "$pattern" 2>/dev/null)
    for file in $files; do
        relative="${file#$FRONTEND_DIR/src/views/}"
        echo -e "${RED}✗${NC} 通用命名：$relative"
        ((generic_names++))
    done
done

# 统计明确命名的组件
explicit_files=$(find "$FRONTEND_DIR/src/views" -type f -name "*List.vue" -o -name "*Form.vue" -o -name "*Detail.vue" | wc -l)
good_names=$((explicit_files - generic_names))

echo ""
echo -e "明确命名：${GREEN}$good_names${NC}"
echo -e "通用命名：${RED}$generic_names${NC}"
echo ""

# 3. 检查 Mixin 使用情况
echo -e "${BLUE}3. 检查 Mixin 使用情况${NC}"
echo "-----------------------------------"

total_list_pages=$(find "$FRONTEND_DIR/src/views" -type f \( -name "*List.vue" \) | wc -l)
pages_with_mixin=$(grep -r "listPageMixin" "$FRONTEND_DIR/src/views" --include="*.vue" | wc -l)

mixin_rate=$((pages_with_mixin * 100 / total_list_pages))

echo "列表页面总数：$total_list_pages"
echo "使用 Mixin：$pages_with_mixin"
echo -e "Mixin 采用率：${YELLOW}${mixin_rate}%${NC}"

if [ $mixin_rate -ge 90 ]; then
    echo -e "状态：${GREEN}✓ 优秀${NC}"
elif [ $mixin_rate -ge 50 ]; then
    echo -e "状态：${YELLOW}⚠ 中等${NC}"
else
    echo -e "状态：${RED}✗ 需改进${NC}"
fi
echo ""

# 4. 检查组件 name 属性
echo -e "${BLUE}4. 检查组件 name 属性${NC}"
echo "-----------------------------------"

vue_files=$(find "$FRONTEND_DIR/src/views" -type f -name "*.vue" | wc -l)
files_with_name=$(grep -r "name:" "$FRONTEND_DIR/src/views" --include="*.vue" | wc -l)

echo "Vue 组件总数：$vue_files"
echo "定义 name 属性：$files_with_name"

if [ $files_with_name -eq $vue_files ]; then
    echo -e "状态：${GREEN}✓ 全部定义${NC}"
else
    missing=$((vue_files - files_with_name))
    echo -e "状态：${YELLOW}⚠ 缺失 $missing 个${NC}"
fi
echo ""

# 5. ESLint 错误检查
echo -e "${BLUE}5. ESLint 错误检查${NC}"
echo "-----------------------------------"
echo "运行 ESLint 检查..."
cd "$FRONTEND_DIR"

if npm run lint -- --quiet 2>&1 | grep -q "error"; then
    errors=$(npm run lint -- --format json 2>/dev/null | grep -o '"errorCount":[0-9]*' | cut -d':' -f2 | awk '{s+=$1} END {print s}')
    echo -e "ESLint 错误数：${RED}$errors${NC}"
else
    echo -e "ESLint 错误数：${GREEN}0${NC}"
fi
echo ""

# 总结
echo "========================================="
echo -e "${BLUE}重构进度总结${NC}"
echo "========================================="
echo ""

# 计算总体进度
phase1_progress=$((good_dirs * 100 / (good_dirs + bad_dirs)))
phase2_progress=$mixin_rate

total_progress=$(((phase1_progress + phase2_progress) / 2))

echo "Phase 1 (命名统一)：${phase1_progress}%"
echo "Phase 2 (Mixin 迁移)：${phase2_progress}%"
echo ""
echo -e "总体进度：${YELLOW}${total_progress}%${NC}"
echo ""

if [ $total_progress -ge 90 ]; then
    echo -e "${GREEN}🎉 重构接近完成！${NC}"
elif [ $total_progress -ge 50 ]; then
    echo -e "${YELLOW}⚡ 重构进行中...${NC}"
else
    echo -e "${BLUE}🚀 重构刚开始${NC}"
fi

echo ""
echo "详细进度请查看：docs/REFACTOR_PROGRESS.md"
echo ""
