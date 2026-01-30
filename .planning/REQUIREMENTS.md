# Requirements: 印刷施工单任务即时分派系统

**Defined:** 2026-01-30
**Core Value:** 创建即分派，审核即开工 - 施工单一经创建即可预览所有任务，审核通过后任务立即可用

## v1 Requirements

### 任务生成

- [ ] **TASK-01**: 施工单创建时立即为所有工序生成草稿任务
- [ ] **TASK-02**: 草稿任务可以预览、编辑、删除
- [ ] **TASK-03**: 施工单修改工序时提示是否更新已有任务
- [ ] **TASK-04**: 草稿任务可以批量操作（批量删除、批量编辑）
- [ ] **TASK-05**: 施工单审核通过后，所有草稿任务自动转为正式任务
- [ ] **TASK-06**: 施工单审核拒绝后，所有草稿任务自动删除

### 任务分派

- [ ] **DISP-01**: 系统根据部门优先级规则自动将任务分派到部门
- [ ] **DISP-02**: 支持在配置界面设置每个工序的部门优先级
- [ ] **DISP-03**: 部门主管可以将任务分配给部门内的操作员
- [ ] **DISP-04**: 操作员可以将未分配的任务认领给自己
- [ ] **DISP-05**: 一个任务同时只能分配给一个操作员
- [ ] **DISP-06**: 支持智能负载平衡（选择当前任务最少的部门）

### 任务可见性

- [ ] **VIS-01**: 所有部门可以看到所有任务
- [ ] **VIS-02**: 支持按部门过滤任务视图
- [ ] **VIS-03**: 支持按状态过滤任务（草稿、正式、已分派、进行中、已完成）
- [ ] **VIS-04**: 支持任务搜索（按任务号、施工单号、内容）
- [ ] **VIS-05**: 操作员只能看到分配给自己部门的任务

### 施工单详情页集成

- [ ] **WO-01**: 在施工单创建/编辑页面显示所有关联任务
- [ ] **WO-02**: 支持在施工单页面编辑草稿任务
- [ ] **WO-03**: 施工单页面显示任务的分派状态
- [ ] **WO-04**: 支持在施工单页面手动添加额外任务
- [ ] **WO-05**: 施工单页面显示任务数量统计

### 任务管理页面

- [ ] **PAGE-01**: 提供独立页面管理所有任务
- [ ] **PAGE-02**: 支持任务列表的分页和虚拟滚动
- [ ] **PAGE-03**: 支持批量操作（批量分配、批量删除）
- [ ] **PAGE-04**: 支持任务高级搜索和筛选
- [ ] **PAGE-05**: 支持导出任务列表

### 部门主管界面

- [ ] **SUP-01**: 部门主管可以查看本部门所有任务
- [ ] **SUP-02**: 支持部门主管将任务拖拽分配给操作员
- [ ] **SUP-03**: 显示部门内操作员的工作负载统计
- [ ] **SUP-04**: 支持部门主管批量分配任务
- [ ] **SUP-05**: 支持部门主管重新分配任务（如果未开始）

### 操作员任务中心

- [ ] **OP-01**: 操作员可以查看分配给自己的任务
- [ ] **OP-02**: 操作员可以查看本部门可认领的任务
- [ ] **OP-03**: 支持操作员一键认领任务
- [ ] **OP-04**: 显示操作员的个人工作负载统计
- [ ] **OP-05**: 支持操作员更新任务进度和完成数量

### 实时通知

- [ ] **NOTIF-01**: 任务分配时实时通知相关操作员
- [ ] **NOTIF-02**: 任务状态变更时实时通知部门主管
- [ ] **NOTIF-03**: 使用 WebSocket 实现实时推送
- [ ] **NOTIF-04**: 支持通知历史记录查看

### 优先级配置界面

- [ ] **CFG-01**: 提供界面配置工序与部门的关联关系
- [ ] **CFG-02**: 支持设置每个工序的部门优先级
- [ ] **CFG-03**: 支持启用/禁用分派规则
- [ ] **CFG-04**: 支持查看当前分派规则的效果预览

### 性能优化

- [ ] **PERF-01**: 批量任务生成使用 bulk_create()（避免 N+1 查询）
- [ ] **PERF-02**: 添加数据库组合索引优化查询
- [ ] **PERF-03**: 前端任务列表使用虚拟滚动（避免渲染卡顿）
- [ ] **PERF-04**: 使用 Redis 缓存任务统计数据
- [ ] **PERF-05**: 任务列表查询使用 select_related/prefetch_related

### 数据一致性

- [ ] **CONS-01**: 使用乐观锁防止并发任务认领冲突
- [ ] **CONS-02**: 工序修改后同步更新相关任务
- [ ] **CONS-03**: 删除施工单时级联删除所有任务
- [ ] **CONS-04**: 草稿-正式流转时验证数据完整性

### 权限控制

- [ ] **AUTH-01**: 基于现有 Django 权限系统控制任务访问
- [ ] **AUTH-02**: 操作员只能编辑分配给自己的任务
- [ ] **AUTH-03**: 部门主管可以编辑本部门所有任务
- [ ] **AUTH-04**: 制表人和业务员可以编辑草稿任务

## v2 Requirements

### 高级功能

- **ADV-01**: 技能匹配分配（根据操作员技能自动匹配）
- **ADV-02**: 任务拆分支持（将一个任务拆分给多个操作员）
- **ADV-03**: 任务依赖管理（任务之间的前置依赖）
- **ADV-04**: 自动任务重新分配（超时未领取自动重新分配）
- **ADV-05**: 移动端支持（PWA 实现移动任务认领）

### 分析和报表

- **ANAL-01**: 任务完成时间统计和分析
- **ANAL-02**: 操作员绩效分析
- **ANAL-03**: 部门工作负载分析
- **ANAL-04**: 任务瓶颈分析

## Out of Scope

| Feature | Reason |
|---------|--------|
| 复杂调度算法 | v1使用简单负载平衡，复杂调度需要更多业务规则和数据分析 |
| 任务重新分配 | 已开始的任务不允许更换操作员，避免混乱和责任不清 |
| 移动原生应用 | v1仅支持Web，移动端需求待验证后再考虑 |
| 历史数据迁移 | v1仅对新创建的施工单生效，历史数据保持原状 |
| 多租户支持 | 系统目前服务于单一公司，无需多租户复杂度 |
| 离线支持 | 任务分派需要实时数据同步，离线模式优先级低 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TASK-01 | Phase 1 | Complete |
| TASK-02 | Phase 1 | Complete |
| TASK-03 | Phase 2 | Pending |
| TASK-04 | Phase 2 | Pending |
| TASK-05 | Phase 1 | Complete |
| TASK-06 | Phase 1 | Complete |
| DISP-01 | Phase 3 | Pending |
| DISP-02 | Phase 3 | Pending |
| DISP-03 | Phase 4 | Pending |
| DISP-04 | Phase 4 | Pending |
| DISP-05 | Phase 4 | Pending |
| DISP-06 | Phase 3 | Pending |
| VIS-01 | Phase 5 | Pending |
| VIS-02 | Phase 5 | Pending |
| VIS-03 | Phase 5 | Pending |
| VIS-04 | Phase 5 | Pending |
| VIS-05 | Phase 5 | Pending |
| WO-01 | Phase 6 | Pending |
| WO-02 | Phase 6 | Pending |
| WO-03 | Phase 6 | Pending |
| WO-04 | Phase 6 | Pending |
| WO-05 | Phase 6 | Pending |
| PAGE-01 | Phase 5 | Pending |
| PAGE-02 | Phase 5 | Pending |
| PAGE-03 | Phase 5 | Pending |
| PAGE-04 | Phase 5 | Pending |
| PAGE-05 | Phase 5 | Pending |
| SUP-01 | Phase 7 | Pending |
| SUP-02 | Phase 7 | Pending |
| SUP-03 | Phase 7 | Pending |
| SUP-04 | Phase 7 | Pending |
| SUP-05 | Phase 7 | Pending |
| OP-01 | Phase 7 | Pending |
| OP-02 | Phase 7 | Pending |
| OP-03 | Phase 7 | Pending |
| OP-04 | Phase 7 | Pending |
| OP-05 | Phase 7 | Pending |
| NOTIF-01 | Phase 8 | Pending |
| NOTIF-02 | Phase 8 | Pending |
| NOTIF-03 | Phase 8 | Pending |
| NOTIF-04 | Phase 8 | Pending |
| CFG-01 | Phase 3 | Pending |
| CFG-02 | Phase 3 | Pending |
| CFG-03 | Phase 3 | Pending |
| CFG-04 | Phase 3 | Pending |
| PERF-01 | Phase 1 | Complete |
| PERF-02 | Phase 9 | Pending |
| PERF-03 | Phase 5 | Pending |
| PERF-04 | Phase 9 | Pending |
| PERF-05 | Phase 5 | Pending |
| CONS-01 | Phase 4 | Pending |
| CONS-02 | Phase 2 | Pending |
| CONS-03 | Phase 1 | Complete |
| CONS-04 | Phase 1 | Complete |
| AUTH-01 | Phase 5 | Pending |
| AUTH-02 | Phase 7 | Pending |
| AUTH-03 | Phase 7 | Pending |
| AUTH-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 49 total
- Mapped to phases: 49
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-30*
*Last updated: 2026-01-30 after roadmap creation*
