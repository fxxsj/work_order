#!/bin/bash

# 前端重构辅助脚本 - 更新 import 路径
# 用途：批量更新所有文件中的 import 路径

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "========================================="
echo "前端重构 - 更新 Import 路径工具"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 目录名替换映射
declare -A DIR_MAP=(
    ["productGroup"]="product-group"
    ["foilingplate"]="foiling-plate"
    ["embossingplate"]="embossing-plate"
)

# 组件名替换映射
declare -A COMPONENT_MAP=(
    ["customer/List"]="customer/CustomerList"
    ["product/List"]="product/ProductList"
    ["product-group/List"]="product-group/ProductGroupList"
    ["department/List"]="department/DepartmentList"
    ["process/List"]="process/ProcessList"
    ["material/List"]="material/MaterialList"
    ["supplier/List"]="supplier/SupplierList"
    ["die/List"]="die/DieList"
    ["artwork/List"]="artwork/ArtworkList"
    ["embossing-plate/List"]="embossing-plate/EmbossingPlateList"
    ["foiling-plate/List"]="foiling-plate/FoilingPlateList"
    ["purchase/List"]="purchase/PurchaseList"
    ["sales/List"]="sales/SalesList"
    ["task/List"]="task/TaskList"
    ["workorder/List"]="workorder/WorkOrderList"
    ["sales/Form"]="sales/SalesForm"
    ["workorder/Form"]="workorder/WorkOrderForm"
    ["sales/Detail"]="sales/SalesDetail"
    ["workorder/Detail"]="workorder/WorkOrderDetail"
)

echo "正在搜索需要更新的文件..."
echo ""

# 查找所有需要更新的 .vue 和 .js 文件
FILES=$(find "$FRONTEND_DIR/src" -type f \( -name "*.vue" -o -name "*.js" \))

total_files=0
updated_files=0

for file in $FILES; do
    ((total_files++))
    file_updated=false

    # 备份原文件
    cp "$file" "$file.bak"

    # 替换目录名
    for old_dir in "${!DIR_MAP[@]}"; do
        new_dir="${DIR_MAP[$old_dir]}"
        if grep -q "$old_dir" "$file"; then
            sed -i "s|views/$old_dir/|views/$new_dir/|g" "$file"
            sed -i "s|@/views/$old_dir/|@/views/$new_dir/|g" "$file"
            file_updated=true
        fi
    done

    # 替换组件名
    for old_comp in "${!COMPONENT_MAP[@]}"; do
        new_comp="${COMPONENT_MAP[$old_comp]}"
        if grep -q "$old_comp" "$file"; then
            sed -i "s|$old_comp|$new_comp|g" "$file"
            file_updated=true
        fi
    done

    # 如果文件有更新，显示
    if [ "$file_updated" = true ]; then
        ((updated_files++))
        relative_path="${file#$FRONTEND_DIR/}"
        echo -e "${GREEN}✓${NC} 更新：$relative_path"
    fi

    # 删除备份
    rm "$file.bak"
done

echo ""
echo "========================================="
echo -e "${GREEN}Import 路径更新完成！${NC}"
echo "扫描文件数：$total_files"
echo "更新文件数：$updated_files"
echo "========================================="
echo ""
echo "下一步："
echo "1. 运行 update-router.sh 更新路由配置"
echo "2. 运行 check-progress.sh 检查进度"
echo ""
