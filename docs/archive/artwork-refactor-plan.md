# 图稿管理模块重构计划

> 基于 BEST_PRACTICES.md v3.1 规范的系统性重构

**创建时间**: 2026-01-21
**目标版本**: v3.2
**预计工作量**: 4-6 小时

---

## 1. 现状分析

### 1.1 已读取的文件

| 文件 | 路径 | 状态 |
|------|------|------|
| 最佳实践文档 | `docs/BEST_PRACTICES.md` | ✅ |
| 前端列表页面 | `frontend/src/views/artwork/ArtworkList.vue` | ✅ |
| 前端 API 模块 | `frontend/src/api/modules/artwork.js` | ✅ |
| 后端模型 | `backend/workorder/models/assets.py` | ✅ |
| 后端序列化器 | `backend/workorder/serializers/assets.py` | ✅ |
| 后端视图 | `backend/workorder/views/assets.py` | ✅ |

### 1.2 发现的问题

#### 前端问题

| # | 问题 | 严重程度 | 位置 |
|---|------|---------|------|
| F1 | **API 模块缺少 `confirm` 和 `createVersion` 方法** | 🔴 高 | `artwork.js` |
| F2 | 未使用 `ErrorHandler` 工具类，直接使用 `console.error` | 🟡 中 | `ArtworkList.vue:493,502,511,520,573,611` |
| F3 | 缺少空状态组件 `<el-empty>` | 🟡 中 | `ArtworkList.vue` |
| F4 | 未使用 `formDialogMixin`，对话框逻辑内联 | 🟡 中 | `ArtworkList.vue` |
| F5 | 表单字段重复定义（未使用 `FORM_INITIAL` 常量） | 🟡 中 | `ArtworkList.vue:412-428,617-628` |
| F6 | 对话框宽度 700px 过大，应提取为独立组件 | 🟢 低 | `ArtworkList.vue:181` |
| F7 | 搜索栏布局缺少 `filter-group` 和 `action-group` 分组 | 🟢 低 | `ArtworkList.vue:4-23` |
| F8 | 表格操作列宽度 280px 过宽 | 🟢 低 | `ArtworkList.vue:127` |

#### 后端问题

| # | 问题 | 严重程度 | 位置 |
|---|------|---------|------|
| B1 | 模型缺少数据库索引（高频查询字段） | 🟡 中 | `assets.py:Artwork` |
| B2 | 序列化器缺少字段验证（`validate_name`, `validate_*`） | 🟡 中 | `assets.py:ArtworkSerializer` |
| B3 | ViewSet 缺少 `prefetch_related` 优化多对多关系 | 🟡 中 | `views/assets.py:112-114` |
| B4 | `confirm` action 缺少事务保护 | 🟡 中 | `views/assets.py:75-110` |
| B5 | `create_version` action 缺少事务保护 | 🟡 中 | `views/assets.py:41-73` |
| B6 | 未复制烫金版和压凸版关联到新版本 | 🔴 高 | `views/assets.py:60-61` |

---

## 2. 重构任务清单

### 2.1 前端重构（优先级：高→低）

#### 任务 F1: 修复 API 模块（🔴 高优先级）

**问题**: `artworkAPI.confirm()` 和 `artworkAPI.createVersion()` 方法不存在，导致确认和创建版本功能报错。

**修改文件**: `frontend/src/api/modules/artwork.js`

**修改内容**:
```javascript
/**
 * 图稿管理 API
 */
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class ArtworkAPI extends BaseAPI {
  constructor() {
    super('/artworks/', request)
  }

  /**
   * 确认图稿
   * @param {number} id - 图稿 ID
   * @returns {Promise} API 响应
   */
  confirm(id) {
    return this.request({
      url: `${this.baseURL}${id}/confirm/`,
      method: 'post'
    })
  }

  /**
   * 基于现有图稿创建新版本
   * @param {number} id - 源图稿 ID
   * @returns {Promise} API 响应
   */
  createVersion(id) {
    return this.request({
      url: `${this.baseURL}${id}/create_version/`,
      method: 'post'
    })
  }
}

export const artworkAPI = new ArtworkAPI()
export default artworkAPI
```

---

#### 任务 F2: 使用 ErrorHandler 替换 console.error（🟡 中优先级）

**问题**: 直接使用 `console.error` 不符合最佳实践，用户无法看到错误提示。

**修改文件**: `frontend/src/views/artwork/ArtworkList.vue`

**修改内容**:
1. 导入 ErrorHandler:
```javascript
import ErrorHandler from '@/utils/errorHandler'
```

2. 替换所有 `console.error` 为 `ErrorHandler.showMessage`:
```javascript
// 替换前
console.error('加载产品列表失败:', error)

// 替换后
ErrorHandler.showMessage(error, '加载产品列表失败')
```

3. 替换 `this.$confirm` 为 `ErrorHandler.confirm`:
```javascript
// 替换前
await this.$confirm('确认该图稿？', '提示', {...})

// 替换后
await ErrorHandler.confirm('确认该图稿？', '确认操作')
```

---

#### 任务 F3: 添加空状态组件（🟡 中优先级）

**问题**: 当没有数据时，用户看到空白表格，体验不佳。

**修改文件**: `frontend/src/views/artwork/ArtworkList.vue`

**修改内容**: 在 `</el-table>` 和 `<Pagination>` 之间添加：
```vue
<!-- 空状态 -->
<el-empty
  v-if="!loading && tableData.length === 0"
  description="暂无图稿数据"
  :image-size="200"
>
  <el-button v-if="canCreate()" type="primary" @click="showDialog()">
    创建第一个图稿
  </el-button>
</el-empty>
```

---

#### 任务 F4: 使用 FORM_INITIAL 常量模式（🟡 中优先级）

**问题**: 表单字段在 `data()` 和 `showDialog()` 中重复定义。

**修改文件**: `frontend/src/views/artwork/ArtworkList.vue`

**修改内容**:
```javascript
// 在 export default 之前定义常量
const FORM_INITIAL = {
  base_code: '',
  version: 1,
  name: '',
  cmyk_colors: [],
  other_colors: [],
  imposition_size: '',
  dies: [],
  foiling_plates: [],
  embossing_plates: [],
  notes: ''
}

export default {
  data() {
    return {
      // ...
      form: { ...FORM_INITIAL }
    }
  },
  methods: {
    resetForm() {
      this.form = { ...FORM_INITIAL }
      this.productItems = []
    },
    showDialog(row = null) {
      if (row) {
        // 编辑模式
      } else {
        this.resetForm()
      }
      this.dialogVisible = true
    }
  }
}
```

---

#### 任务 F5: 优化搜索栏布局（🟢 低优先级）

**问题**: 搜索栏布局不符合 `header-section` + `filter-group` + `action-group` 规范。

**修改文件**: `frontend/src/views/artwork/ArtworkList.vue`

**修改内容**:
```vue
<div class="header-section">
  <div class="filter-group">
    <el-input
      v-model="searchText"
      placeholder="搜索图稿编码、名称、拼版尺寸"
      style="width: 300px;"
      clearable
      @input="handleSearchDebounced"
      @clear="handleSearch"
    >
      <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
    </el-input>
  </div>
  <div class="action-group">
    <el-button icon="el-icon-refresh" @click="loadData">刷新</el-button>
    <el-button
      v-if="canCreate()"
      type="primary"
      icon="el-icon-plus"
      @click="showDialog()"
    >
      新建图稿
    </el-button>
  </div>
</div>
```

添加样式:
```css
.filter-group,
.action-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
```

---

#### 任务 F6: 提取对话框为独立组件（🟢 低优先级 - 可选）

**问题**: 对话框代码超过 200 行，应提取为 `ArtworkFormDialog.vue`。

**新建文件**: `frontend/src/views/artwork/components/ArtworkFormDialog.vue`

**结构参考**: `docs/BEST_PRACTICES.md` 对话框组件模式章节

---

### 2.2 后端重构（优先级：高→低）

#### 任务 B1: 修复 create_version 遗漏复制关联（🔴 高优先级）

**问题**: 创建新版本时没有复制烫金版和压凸版关联。

**修改文件**: `backend/workorder/views/assets.py`

**修改内容**: 在 `create_version` action 中添加：
```python
@action(detail=True, methods=['post'])
def create_version(self, request, pk=None):
    """基于现有图稿创建新版本"""
    original_artwork = self.get_object()

    with transaction.atomic():  # 添加事务保护
        # 获取下一个版本号
        next_version = Artwork.get_next_version(original_artwork.base_code)

        # 创建新版本
        new_artwork = Artwork.objects.create(
            base_code=original_artwork.base_code,
            version=next_version,
            name=original_artwork.name,
            cmyk_colors=original_artwork.cmyk_colors.copy() if original_artwork.cmyk_colors else [],
            other_colors=original_artwork.other_colors.copy() if original_artwork.other_colors else [],
            imposition_size=original_artwork.imposition_size,
            notes=original_artwork.notes
        )

        # 复制关联的刀模
        new_artwork.dies.set(original_artwork.dies.all())

        # ✅ 修复：复制关联的烫金版
        new_artwork.foiling_plates.set(original_artwork.foiling_plates.all())

        # ✅ 修复：复制关联的压凸版
        new_artwork.embossing_plates.set(original_artwork.embossing_plates.all())

        # 复制关联的产品
        for ap in original_artwork.products.all():
            ArtworkProduct.objects.create(
                artwork=new_artwork,
                product=ap.product,
                imposition_quantity=ap.imposition_quantity,
                sort_order=ap.sort_order
            )

    serializer = self.get_serializer(new_artwork)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
```

---

#### 任务 B2: 添加事务保护到 confirm action（🟡 中优先级）

**问题**: `confirm` action 修改多个对象但没有事务保护。

**修改文件**: `backend/workorder/views/assets.py`

**修改内容**:
```python
from django.db import transaction

@action(detail=True, methods=['post'])
def confirm(self, request, pk=None):
    """设计部确认图稿"""
    artwork = self.get_object()

    if artwork.confirmed:
        return Response(
            {'error': '该图稿已经确认过了'},
            status=status.HTTP_400_BAD_REQUEST
        )

    with transaction.atomic():  # 添加事务保护
        artwork.confirmed = True
        artwork.confirmed_by = request.user
        artwork.confirmed_at = timezone.now()
        artwork.save()

        # 检查相关任务...
```

---

#### 任务 B3: 添加数据库索引（🟡 中优先级）

**问题**: 高频查询字段缺少索引。

**修改文件**: `backend/workorder/models/assets.py`

**修改内容**: 在 `Artwork` 模型的 `Meta` 类中添加：
```python
class Meta:
    verbose_name = '图稿'
    verbose_name_plural = '图稿管理'
    ordering = ['-base_code', '-version']
    unique_together = [['base_code', 'version']]

    # ✅ 添加索引
    indexes = [
        models.Index(fields=['name'], name='artwork_name_idx'),
        models.Index(fields=['confirmed'], name='artwork_confirmed_idx'),
        models.Index(fields=['created_at'], name='artwork_created_at_idx'),
    ]
```

---

#### 任务 B4: 优化 ViewSet 查询性能（🟡 中优先级）

**问题**: 缺少对多对多关系的预加载。

**修改文件**: `backend/workorder/views/assets.py`

**修改内容**:
```python
def get_queryset(self):
    queryset = super().get_queryset()
    return queryset.prefetch_related(
        'products__product',
        'dies',              # ✅ 添加
        'foiling_plates',    # ✅ 添加
        'embossing_plates',  # ✅ 添加
        'confirmed_by'       # ✅ 添加（如果需要显示确认人信息）
    ).select_related('confirmed_by')  # ✅ 外键用 select_related
```

---

#### 任务 B5: 添加序列化器验证（🟡 中优先级）

**问题**: 缺少字段验证，可能导致无效数据进入数据库。

**修改文件**: `backend/workorder/serializers/assets.py`

**修改内容**:
```python
class ArtworkSerializer(serializers.ModelSerializer):
    # ... 现有字段 ...

    def validate_name(self, value):
        """验证图稿名称"""
        if not value or not value.strip():
            raise serializers.ValidationError("图稿名称不能为空")
        if len(value) > 200:
            raise serializers.ValidationError("图稿名称不能超过200个字符")
        return value.strip()

    def validate_imposition_size(self, value):
        """验证拼版尺寸格式"""
        if value and not re.match(r'^\d+x\d+mm$', value):
            # 允许灵活格式，只是提示
            pass
        return value

    def validate_cmyk_colors(self, value):
        """验证CMYK颜色"""
        valid_colors = {'C', 'M', 'Y', 'K'}
        if value:
            for color in value:
                if color not in valid_colors:
                    raise serializers.ValidationError(
                        f"无效的CMYK颜色: {color}，允许的值: C, M, Y, K"
                    )
        return value
```

---

## 3. 执行顺序

### 阶段 1: 修复关键问题（必须）
1. ✅ F1: 修复 API 模块缺少方法
2. ✅ B1: 修复 create_version 遗漏复制关联
3. ✅ B2: 添加事务保护

### 阶段 2: 改进代码质量（推荐）
4. F2: 使用 ErrorHandler
5. F3: 添加空状态组件
6. F4: 使用 FORM_INITIAL 常量
7. B3: 添加数据库索引
8. B4: 优化查询性能
9. B5: 添加序列化器验证

### 阶段 3: UI 优化（可选）
10. F5: 优化搜索栏布局
11. F6: 提取对话框组件

---

## 4. 测试计划

### 4.1 功能测试

| 测试项 | 预期结果 |
|-------|---------|
| 新建图稿 | 成功创建，自动生成编码 |
| 编辑图稿 | 成功保存所有字段 |
| 确认图稿 | 状态变更，显示确认人和时间 |
| 创建新版本 | 复制所有信息（包括刀模、烫金版、压凸版） |
| 删除图稿 | 成功删除，关联数据级联删除 |
| 搜索功能 | 按编码、名称、尺寸搜索 |
| 空状态 | 无数据时显示空状态组件 |

### 4.2 后端测试命令

```bash
cd backend
python manage.py test workorder.tests.test_artwork -v 2
```

### 4.3 前端测试命令

```bash
cd frontend
npm run lint
npm run serve  # 手动测试
```

---

## 5. 回滚计划

如果重构出现问题，可以通过 Git 回滚：

```bash
git checkout HEAD~1 -- frontend/src/views/artwork/ArtworkList.vue
git checkout HEAD~1 -- frontend/src/api/modules/artwork.js
git checkout HEAD~1 -- backend/workorder/views/assets.py
git checkout HEAD~1 -- backend/workorder/serializers/assets.py
git checkout HEAD~1 -- backend/workorder/models/assets.py
```

---

## 6. 预期收益

| 方面 | 改进 |
|-----|------|
| **功能完整性** | 修复确认和创建版本功能 |
| **代码质量** | 符合 BEST_PRACTICES v3.1 规范 |
| **用户体验** | 添加空状态、改进错误提示 |
| **性能** | 添加索引、优化查询 |
| **可维护性** | 减少代码重复、提取组件 |

---

**审批**: 请确认此计划后开始执行
