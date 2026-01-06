# 采购工序移除说明

## 业务调整

根据业务需求，**采购不属于施工单中的工序**，采购任务通过其他系统管理，不应归于施工单系统。

## 调整内容

### 1. 后端调整

#### 1.1 `WorkOrderProcess.can_start()` 方法

**文件**: `backend/workorder/models.py:720-742`

**调整内容**:
- 移除了采购工序的并行判断逻辑
- 从 `parallel_keywords` 中移除 `'采购'`
- 从非并行工序排除条件中移除采购工序的排除

**调整前**:
```python
parallel_keywords = ['制版', '刀模', '模切', '采购']
# ...
.exclude(process__name__icontains='采购')
```

**调整后**:
```python
parallel_keywords = ['制版', '刀模', '模切']
# 移除了采购工序的排除逻辑
```

#### 1.2 注释更新

**文件**: 
- `backend/workorder/models.py:762-792`
- `backend/workorder/views.py:538-540`

**调整内容**:
- 更新注释，明确说明采购不属于施工单工序
- 说明采购任务通过其他系统管理
- 说明物料采购状态在 `WorkOrderMaterial` 中记录（用于关联，但不作为工序）

### 2. 前端调整

#### 2.1 `Detail.vue` - 物料相关工序判断

**文件**: `frontend/src/views/workorder/Detail.vue:1432-1435`

**调整内容**:
- 从 `isMaterialRelatedProcess` 方法中移除采购判断
- 更新注释说明采购不属于施工单工序

**调整前**:
```javascript
isMaterialRelatedProcess(processName) {
  return processName.includes('采购') || processName.includes('开料') || processName.includes('裁切')
}
```

**调整后**:
```javascript
isMaterialRelatedProcess(processName) {
  return processName.includes('开料') || processName.includes('裁切')
}
```

#### 2.2 `Detail.vue` - 任务完成条件判断

**文件**: `frontend/src/views/workorder/Detail.vue:1465-1470, 1485-1490`

**调整内容**:
- 移除了采购任务的完成条件判断逻辑
- 移除了采购任务的阻止原因判断逻辑

**调整前**:
```javascript
// 采购任务：需要物料已回料（如果存在采购工序）
if (task.task_type === 'material' && process.process_name && process.process_name.includes('采购')) {
  if (task.material_purchase_status !== 'received') {
    return false
  }
}
```

**调整后**:
```javascript
// 注意：采购不属于施工单工序，采购任务通过其他系统管理
// 移除了采购任务的判断逻辑
```

#### 2.3 `task/List.vue` - 任务完成条件判断

**文件**: `frontend/src/views/task/List.vue:374-380`

**调整内容**:
- 移除了采购任务的完成条件判断逻辑

**调整前**:
```javascript
// 采购任务：需要物料已回料（如果存在采购工序）
if (task.task_type === 'material' && task.material_purchase_status) {
  const processName = task.work_order_process?.process_name || ''
  if (processName.includes('采购') && task.material_purchase_status !== 'received') {
    return false
  }
}
```

**调整后**:
```javascript
// 注意：采购不属于施工单工序，采购任务通过其他系统管理
// 移除了采购任务的判断逻辑
```

## 保留的内容

以下内容**保留**，因为它们不是采购工序，而是物料状态管理：

1. **`WorkOrderMaterial.purchase_status` 字段**
   - 用于记录物料的采购状态（待采购、已下单、已回料、已开料、已完成）
   - 这是物料状态管理，不是采购工序
   - 用于关联物料和施工单，但不作为施工单的工序

2. **物料采购状态更新功能**
   - 前端物料列表中的"更新状态"功能
   - 后端物料状态更新接口
   - 这些功能用于管理物料的采购状态，但不创建采购工序

3. **前端物料列表显示**
   - 物料列表中的采购状态显示
   - 采购日期、回料日期、开料日期等字段
   - 这些是物料信息的展示，不是工序管理

## 业务逻辑说明

### 采购任务的管理方式

- **采购任务通过其他系统管理**：采购任务不属于施工单工序，应由独立的采购系统或模块管理
- **物料状态记录在施工单中**：物料的采购状态（`purchase_status`）在 `WorkOrderMaterial` 中记录，用于：
  - 关联物料和施工单
  - 记录物料的采购、回料、开料状态
  - 作为开料工序的前置条件检查（物料必须已开料）

### 开料工序的处理

- **开料工序仍然属于施工单工序**：CUT工序（开料）仍然是施工单的工序
- **开料任务有前置条件**：开料任务需要物料状态为"已开料"（`purchase_status == 'cut'`）
- **物料状态管理**：物料的采购状态通过物料状态更新接口管理，不通过工序系统

## 影响范围

### 不受影响的功能

1. ✅ 物料采购状态管理（`WorkOrderMaterial.purchase_status`）
2. ✅ 物料状态更新功能
3. ✅ 开料工序和开料任务
4. ✅ 开料任务的物料状态检查

### 已移除的功能

1. ❌ 采购工序的并行判断
2. ❌ 采购任务的完成条件判断
3. ❌ 采购任务的阻止原因判断
4. ❌ 采购工序在工序列表中的处理

## 后续开发建议

如果将来需要实现采购任务系统，建议：

1. **独立的采购模块**：创建独立的采购管理模块，不依赖于施工单工序系统
2. **采购任务模型**：创建独立的采购任务模型，与施工单任务（`WorkOrderTask`）分离
3. **关联关系**：采购任务可以关联到施工单（通过 `work_order` 外键），但不作为施工单的工序
4. **状态同步**：采购任务完成时，可以同步更新 `WorkOrderMaterial.purchase_status`

## 测试建议

1. **测试开料工序**：确保开料工序和开料任务的逻辑正常
2. **测试物料状态管理**：确保物料采购状态的更新功能正常
3. **测试工序并行判断**：确保制版、刀模、模切等工序的并行逻辑正常
4. **测试工序列表**：确保工序列表中不再包含采购工序的判断逻辑

