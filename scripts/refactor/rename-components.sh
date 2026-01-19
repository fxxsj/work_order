#!/bin/bash

# 前端重构辅助脚本 - 组件重命名
# 用途：批量重命名通用组件名为明确的业务组件名

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "========================================="
echo "前端重构 - 组件重命名工具"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 需要重命名的组件映射（目录/旧名 -> 新名）
declare -A RENAME_MAP=(
    # 列表页面
    ["customer/List.vue"]="customer/CustomerList.vue"
    ["product/List.vue"]="product/ProductList.vue"
    ["product-group/List.vue"]="product-group/ProductGroupList.vue"
    ["department/List.vue"]="department/DepartmentList.vue"
    ["process/List.vue"]="process/ProcessList.vue"
    ["material/List.vue"]="material/MaterialList.vue"
    ["supplier/List.vue"]="supplier/SupplierList.vue"
    ["die/List.vue"]="die/DieList.vue"
    ["artwork/List.vue"]="artwork/ArtworkList.vue"
    ["embossing-plate/List.vue"]="embossing-plate/EmbossingPlateList.vue"
    ["foiling-plate/List.vue"]="foiling-plate/FoilingPlateList.vue"
    ["purchase/List.vue"]="purchase/PurchaseList.vue"
    ["sales/List.vue"]="sales/SalesList.vue"
    ["task/List.vue"]="task/TaskList.vue"
    ["workorder/List.vue"]="workorder/WorkOrderList.vue"

    # 表单页面
    ["sales/Form.vue"]="sales/SalesForm.vue"
    ["workorder/Form.vue"]="workorder/WorkOrderForm.vue"

    # 详情页面
    ["sales/Detail.vue"]="sales/SalesDetail.vue"
    ["workorder/Detail.vue"]="workorder/WorkOrderDetail.vue"
)

# 检查是否在正确的分支
echo "检查 Git 分支..."
CURRENT_BRANCH=$(git -C "$PROJECT_ROOT" branch --show-current)
if [ "$CURRENT_BRANCH" != "refactor/frontend-v3" ]; then
    echo -e "${RED}错误：当前不在 refactor/frontend-v3 分支${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 当前在 refactor/frontend-v3 分支${NC}"
echo ""

# 显示将要执行的重命名操作
echo "将执行以下组件重命名："
echo "-----------------------------------"
count=0
for old_path in "${!RENAME_MAP[@]}"; do
    new_path="${RENAME_MAP[$old_path]}"
    full_old_path="$FRONTEND_DIR/src/views/$old_path"

    if [ -f "$full_old_path" ]; then
        ((count++))
        echo -e "$count. ${YELLOW}$old_path${NC} → ${GREEN}$new_path${NC}"
    fi
done
echo ""

if [ $count -eq 0 ]; then
    echo -e "${RED}没有找到需要重命名的文件${NC}"
    exit 1
fi

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
for old_path in "${!RENAME_MAP[@]}"; do
    new_path="${RENAME_MAP[$old_path]}"
    full_old_path="$FRONTEND_DIR/src/views/$old_path"
    full_new_path="$FRONTEND_DIR/src/views/$new_path"

    if [ -f "$full_old_path" ]; then
        echo "重命名：$old_path → $new_path"
        git -C "$PROJECT_ROOT" mv "$full_old_path" "$full_new_path"
        echo -e "${GREEN}✓ 完成${NC}"
        ((renamed_count++))
    fi
done

echo ""
echo "========================================="
echo -e "${GREEN}组件重命名完成！${NC}"
echo "已重命名 $renamed_count 个组件"
echo "========================================="
echo ""
echo "下一步："
echo "1. 运行 update-imports.sh 更新所有 import 路径"
echo "2. 运行 update-component-names.sh 更新组件 name 属性"
echo ""
