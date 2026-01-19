# 重构辅助脚本

这个目录包含前端重构过程中使用的自动化脚本。

## 📂 脚本列表

### 1. rename-directories.sh
**用途**: 批量重命名不规范的目录名

**重命名规则**:
- `productGroup/` → `product-group/`
- `foilingplate/` → `foiling-plate/`
- `embossingplate/` → `embossing-plate/`

**使用方法**:
```bash
cd scripts/refactor
./rename-directories.sh
```

---

### 2. rename-components.sh
**用途**: 批量重命名通用组件名为明确的业务组件名

**重命名规则**:
- `List.vue` → `XxxList.vue` (15个)
- `Form.vue` → `XxxForm.vue` (2个)
- `Detail.vue` → `XxxDetail.vue` (2个)

**使用方法**:
```bash
cd scripts/refactor
./rename-components.sh
```

---

### 3. update-imports.sh
**用途**: 批量更新所有文件中的 import 路径

**更新内容**:
- 目录路径更新（productGroup → product-group）
- 组件路径更新（List → CustomerList）
- 自动扫描所有 .vue 和 .js 文件

**使用方法**:
```bash
cd scripts/refactor
./update-imports.sh
```

---

### 4. check-progress.sh
**用途**: 检查重构进度和规范符合度

**检查项目**:
1. 目录命名规范检查
2. 组件文件命名检查
3. Mixin 使用情况统计
4. 组件 name 属性检查
5. ESLint 错误统计

**使用方法**:
```bash
cd scripts/refactor
./check-progress.sh
```

---

## 🚀 推荐使用顺序

### Phase 1: 命名统一

```bash
# 1. 重命名目录
./rename-directories.sh

# 2. 重命名组件
./rename-components.sh

# 3. 更新所有 import 路径
./update-imports.sh

# 4. 检查进度
./check-progress.sh
```

---

## ⚠️ 注意事项

1. **Git 分支**: 所有脚本会检查是否在 `refactor/frontend-v3` 分支
2. **备份**: 脚本使用 `git mv` 命令，可以通过 Git 回退
3. **确认**: 执行前会显示预览并要求确认
4. **顺序**: 必须按推荐顺序执行，否则可能导致路径错误

---

## 🐛 故障排除

### 问题：脚本执行权限不足
```bash
chmod +x *.sh
```

### 问题：不在正确的分支
```bash
git checkout refactor/frontend-v3
```

### 问题：路径更新不完整
手动检查并修复：
```bash
grep -r "productGroup" frontend/src/
grep -r "/List.vue" frontend/src/
```

---

**最后更新**: 2026-01-19
