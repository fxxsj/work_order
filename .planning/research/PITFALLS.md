# Pitfalls Research

**Domain:** 工单任务即时分派系统（印刷施工单管理系统）
**Researched:** 2026-01-30
**Confidence:** HIGH

基于现有系统分析（Django 4.2 + Vue 2.7 + SQLite/PostgreSQL）和领域调研。

---

## Critical Pitfalls

### Pitfall 1: 批量任务生成的 N+1 查询问题

**What goes wrong:**
在工单创建时批量生成任务（如一个工单有 21 个工序，每个工序生成多个任务），如果在循环中使用 `save()` 而非 `bulk_create()`，会导致：
- 每个 `save()` 产生一次 INSERT 语句
- 21 个工序 × 平均 5 个任务/工序 = 105 次数据库查询
- 创建单个工单耗时超过 5 秒，用户体验极差
- 数据库连接池在高并发下耗尽

**Why it happens:**
开发者沿用现有的 `generate_tasks()` 方法（在 `WorkOrderProcess` 模型中，第 737-929 行），该方法在工序**开始时**被调用（`start()` action）。将任务生成提前到工单创建时，会显著增加创建操作的响应时间。现有代码已使用 `objects.create()` 而非 `bulk_create()`，这是性能瓶颈的根本原因。

**Consequences:**
- 创建工单接口超时（HTTP 504 Gateway Timeout）
- 前端用户重复点击提交，导致重复创建
- 数据库锁等待，影响其他操作
- 并发创建工单时数据库连接池耗尽

**How to avoid:**
1. **使用 `bulk_create()` 批量插入**：将所有任务收集到列表后，一次性批量创建
2. **分批次处理**：如果单个工单任务数量超过 1000，分批次批量创建（每批 500 个）
3. **异步任务队列**（Celery/Django-Q）：将任务生成放入后台队列，立即返回工单 ID
4. **优化查询**：使用 `select_related()` 和 `prefetch_related()` 减少关联查询

**Warning signs:**
- 创建工单 API 响应时间 > 2 秒
- 数据库日志显示大量 INSERT 语句（而非单条批量 INSERT）
- 前端控制台出现 "Network Error" 或超时错误
- Django Debug Toolbar 显示 SQL 查询数量 > 50

**Phase to address:**
**Phase 1（性能优化基础）** - 在实现即时任务生成功能前，必须先优化现有 `generate_tasks()` 方法，确保批量创建的性能可接受。

---

### Pitfall 2: 草稿-正式状态流转的数据一致性

**What goes wrong:**
用户在草稿状态下创建工单，任务随之生成。但当用户修改工序、产品、物料等核心字段后，已生成的任务未同步更新：
- 删除某个工序后，该工序的任务仍存在（孤儿数据）
- 修改产品数量后，包装任务的 `production_quantity` 仍是旧值
- 添加新工序后，未为新工序生成任务
- 导致任务数量与工序数量不匹配，统计报表数据错误

**Why it happens:**
现有系统任务在工序开始时生成，此时工单已审核通过，数据不再变更。将任务生成提前到创建时，需要处理草稿状态的多次编辑。现有代码在 `WorkOrderProcess.generate_tasks()` 中（第 752-754 行）检查 `if self.tasks.exists(): return`，防止重复生成，但这阻止了编辑后重新生成。

**Consequences:**
- 任务状态与工序状态不一致（工序已删除，任务仍显示待完成）
- 生产数量错误导致包装工序多生产或少生产
- 财务报表统计数据不准（基于任务数量计算产值）
- 用户信任度下降，认为系统数据不可靠

**How to avoid:**
1. **级联删除策略**：删除工序时，软删除或硬删除关联任务（使用 `on_delete=CASCADE` 或自定义信号处理）
2. **重新生成标记**：工单添加 `tasks_dirty` 字段，编辑核心字段后标记为 True，审核时重新生成任务
3. **差异更新算法**：对比新旧工序列表，只对变更部分增删任务，而非全量重新生成
4. **事务保护**：工单编辑、任务更新在同一个 `transaction.atomic()` 中，确保原子性

**Warning signs:**
- 数据库中 `WorkOrderTask` 记录的 `work_order_process_id` 指向不存在的工序
- 工序数量（`order_processes.count()`）与任务总数（`tasks.count()`）不匹配
- 用户反馈"任务列表中还有已删除的工序"
- 统计报表出现负数或异常大数值

**Phase to address:**
**Phase 2（数据一致性保障）** - 在实现草稿状态编辑功能时，同步设计任务同步更新机制。

---

### Pitfall 3: 并发任务分派的竞态条件

**What goes wrong:**
多人同时查看任务列表并认领任务时，可能出现：
- 用户 A 和用户 B 同时看到同一个任务（状态 `pending`，`assigned_operator=None`）
- 两人同时点击"认领"按钮
- 两个请求同时通过 `if task.assigned_operator is None:` 检查
- 最终两人都被分派到同一任务（后提交的覆盖先提交的）
- 或者乐观锁抛出 `BusinessLogicError` 异常，用户体验差

**Why it happens:**
现有代码在 `WorkOrderTask.save()` 方法中实现了乐观锁（第 1232-1270 行），使用 `version` 字段检测并发更新。但任务认领操作可能未正确使用此机制，或者在读取任务和更新任务之间存在时间窗口（check-then-act 竞态）。

**Consequences:**
- 同一任务被多人分派，产生责任纠纷
- 任务重复计费（如果按任务数量计算工作量）
- 乐观锁异常导致操作失败，用户需要重新操作
- 生产部门任务分配不均，影响进度

**How to avoid:**
1. **数据库行锁**：使用 `select_for_update()` 锁定任务记录，确保独占更新
2. **唯一约束**：在 `WorkOrderTask` 表添加 `(work_order_process, assigned_operator)` 的部分唯一索引，防止重复认领
3. **原子更新操作**：使用 `update()` 而非 `save()`，在数据库层面完成"检查并更新"（如 `WorkOrderTask.objects.filter(id=task_id, assigned_operator__isnull=True).update(assigned_operator=user)`）
4. **队列化认领请求**：使用 Redis 队列串行化认领操作

**Warning signs:**
- 日志中出现同一任务的多次"认领成功"记录
- 用户投诉"我认领的任务不见了"或"别人认领了我已认领的任务"
- 数据库中 `assigned_operator` 频繁变更（短时间内在不同用户间切换）
- 乐观锁版本号异常增长

**Phase to address:**
**Phase 3（并发控制）** - 在实现任务认领功能时，必须设计并发安全的分派机制。

---

### Pitfall 4: 大量任务列表的前端渲染性能

**What goes wrong:**
单个工单有 21 个工序，每个工序平均 5 个任务，总计 100+ 任务。在任务列表页面：
- Vue 2.7 使用 `v-for` 渲染 100+ 行数据
- 每行包含多个字段（任务名称、状态、分派对象、进度、操作按钮）
- 同时还显示工序信息、工单信息等嵌套数据
- DOM 节点数量超过 500 个，页面滚动卡顿
- 搜索和筛选操作响应时间超过 1 秒

**Why it happens:**
现有前端使用 Vue 2.7（老版本），未使用虚拟滚动或分页加载。根据搜索结果（2024-2025），虚拟滚动技术可以将 DOM 节点从 1000+ 减少到 20-30 个（只渲染可见区域）。但虚拟滚动在 Vue 2.7 中实现较复杂，需要使用第三方库如 `vue-virtual-scroller`。

**Consequences:**
- 页面初始加载时间 > 3 秒
- 滚动时出现明显卡顿（掉帧）
- 浏览器内存占用高（> 500MB）
- 移动端用户体验极差（可能直接崩溃）
- 用户拒绝使用新功能，要求保留旧系统

**How to avoid:**
1. **分页加载**：每页显示 20-50 个任务，使用 Element UI 的 `el-pagination` 组件
2. **虚拟滚动**：集成 `vue-virtual-scroller` 库（兼容 Vue 2.7），只渲染可见行
3. **懒加载图片**：任务相关的图片（如产品图、物料图）使用占位符，滚动到可见区域时才加载
4. **压缩数据**：API 返回的字段精简到最小必要集合，关联数据使用 ID 而非完整对象

**Warning signs:**
- Chrome DevTools Performance 录制显示 FPS < 30（帧率低）
- 页面滚动时 CPU 使用率飙升到 100%
- 网络请求显示响应数据大小 > 1MB（单个任务列表接口）
- 移动端测试时页面白屏或浏览器崩溃

**Phase to address:**
**Phase 4（前端性能优化）** - 在实现任务列表 UI 时，同步优化渲染性能。

---

### Pitfall 5: 修改工序对已有任务的级联影响

**What goes wrong:**
工单审核通过后，发现需要添加或删除工序：
- 添加新工序后，是否为新工序生成任务？如果生成，任务状态如何设置？
- 删除工序后，该工序的进行中任务如何处理？强制完成还是取消？
- 修改工序顺序后，任务的依赖关系是否需要重新计算？
- 任务的 `assigned_department` 和 `assigned_operator` 是否需要重新分派？

**Why it happens:**
现有系统允许审核通过后请求重新审核（`request_reapproval` action，第 374-457 行），修改后重新提交审核。但代码只重置了审核状态，未处理已生成的任务。根据业务规则，已完成的任务不应被删除，但未开始的任务可能需要调整。

**Consequences:**
- 工序删除后，进行中的任务继续显示，造成混乱
- 新添加的工序无任务，无法执行
- 任务分派错误（如外协工序的任务分派给内部部门）
- 审核流程混乱（需要多次请求重新审核）

**How to avoid:**
1. **任务状态检查**：删除工序前，检查关联任务状态，只有 `pending` 状态的任务才能删除
2. **任务保留策略**：已开始的任务保留，但标记为"已取消"，保留历史记录
3. **重新分派机制**：工序变更后，提供"重新分派任务"功能，自动匹配部门和操作员
4. **审核状态锁定**：已完成的工序禁止删除，必须请求重新审核后才能修改

**Warning signs:**
- 数据库中出现 `status=cancelled` 但 `work_order_process` 已删除的任务
- 用户反馈"添加的工序看不到任务"
- 任务分派规则与新工序配置不匹配
- 审核日志中出现频繁的"请求重新审核"记录

**Phase to address:**
**Phase 5（变更管理）** - 在实现工单编辑功能时，同步设计任务级联更新机制。

---

### Pitfall 6: 跨部门任务的可见性和权限控制

**What goes wrong:**
印刷行业多工序协作，一个工单可能跨越多个部门（制版部、印刷部、模切部、包装部等）：
- 制版部用户只能看到制版相关任务，不应看到包装部任务
- 部门主管可以看到本部门所有任务，但只能分派本部门用户
- 外协任务不应显示给内部部门用户
- 现有权限系统（`WorkOrderTaskPermission`）可能过于简单，无法支持细粒度控制

**Why it happens:**
现有代码在 `WorkOrderViewSet.get_queryset()` 中（第 84-125 行）实现了基于用户组和部门的权限过滤。但任务权限可能未同步设计，导致用户可以看到不应见的任务。根据项目规范，权限管理基于用户组（`groups`）和用户资料中的部门关联（`profile.departments`）。

**Consequences:**
- 数据泄露（用户看到其他部门的敏感信息，如成本、价格）
- 越权操作（用户误操作其他部门的任务）
- 审计风险（无法追溯谁查看了哪些数据）
- 业务流程混乱（部门间互相干扰）

**How to avoid:**
1. **行级权限（Row-Level Security）**：在 `WorkOrderTask` queryset 中自动过滤，只返回用户有权访问的任务
2. **基于角色的访问控制（RBAC）**：定义角色（如制版员、印刷工、部门主管、生产经理），每个角色有不同的权限
3. **数据脱敏**：对于跨部门可见但敏感的字段（如成本），使用脱敏策略（如显示 `***`）
4. **审计日志**：记录所有任务查看和操作日志，支持事后追溯

**Warning signs:**
- 用户反馈"我看到别的部门的任务了"
- 日志中出现用户查询或修改不属于其部门的任务
- 测试中发现可以通过 API 直接访问其他用户的任务
- 权限测试用例失败

**Phase to address:**
**Phase 6（权限与安全）** - 在实现任务分派和查看功能时，同步设计细粒度权限控制。

---

### Pitfall 7: 现有数据迁移的向后兼容性

**What goes wrong:**
系统已有历史工单和任务数据，将任务生成时机从"工序开始时"改为"工单创建时"后：
- 旧工单（审核通过且进行中）缺少草稿状态下的任务
- 已完成的工序无任务记录，影响统计报表
- 任务生成逻辑变更后，旧任务与新任务的字段结构可能不一致
- 数据库迁移脚本需要处理大量历史数据

**Why it happens:**
现有系统已上线运行，有生产数据。修改核心业务逻辑（任务生成时机）会影响所有新工单，但旧工单仍按旧逻辑运行。需要在代码中同时支持新旧两种模式，增加维护复杂度。

**Consequences:**
- 旧工单无法查看任务列表（数据缺失）
- 统计报表数据不准确（新旧工单统计口径不一致）
- 数据库迁移失败或耗时过长（锁表影响生产）
- 用户反馈"以前的工单数据乱了"

**How to avoid:**
1. **数据迁移脚本**：编写迁移脚本，为旧工单补充缺失的任务（基于工序和产品信息回填）
2. **版本标记**：在 `WorkOrder` 表添加 `task_generation_mode` 字段，标记使用新旧哪种模式
3. **渐进式迁移**：分批次迁移历史数据，优先迁移近 3 个月的数据，旧数据按需迁移
4. **双模式兼容**：代码同时支持新旧两种模式，通过配置开关切换，确保平滑过渡

**Warning signs:**
- 生产环境出现 "DoesNotExist" 异常（查询旧工单任务时）
- 统计报表出现断崖式数据波动（新旧数据不一致）
- 数据库迁移日志显示大量错误或警告
- 用户反馈"以前能看的工单现在看不到了"

**Phase to address:**
**Phase 0（数据迁移准备）** - 在开发新功能前，先评估现有数据规模，设计数据迁移方案，编写并测试迁移脚本。

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| 在工单创建时同步生成任务（而非异步队列） | 实现简单，无需额外依赖 | 创建工单响应时间长，用户体验差 | 仅在 MVP 阶段，单个工单任务数 < 50 时可接受 |
| 不实现任务差异更新，编辑时全量重新生成 | 代码简单，逻辑清晰 | 数据丢失（已完成的任务被删除），性能差 | 不可接受，必须实现差异更新 |
| 使用前端分页而非虚拟滚动 | 实现快速，无需第三方库 | 数据量大时页面卡顿 | 可接受，但需设置合理的页大小（如 20-50 条/页） |
| 权限控制简化（只检查用户组，不检查部门） | 开发快速，权限逻辑简单 | 可能导致越权访问 | 仅在内部信任环境可接受，生产环境必须严格 |
| 延迟数据迁移（不迁移历史数据） | 节省迁移时间和风险 | 旧数据无法查看，用户投诉 | 仅在系统刚上线不久（< 1 个月）可接受 |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Django ORM 批量创建** | 在循环中调用 `save()` | 使用 `bulk_create()` 一次性插入，并在 `transaction.atomic()` 中执行 |
| **任务自动分派** | 分派逻辑硬编码在模型中 | 使用配置表（`TaskAssignmentRule`）定义分派规则，支持动态调整 |
| **乐观锁并发控制** | 只检查版本号，不处理更新失败 | 捕获 `BusinessLogicError` 异常，向用户提示"数据已被修改，请刷新" |
| **前端状态管理** | 任务列表散落在多个组件中 | 使用 Vuex store 集中管理任务状态，组件通过 getter 获取数据 |
| **通知系统** | 任务分派后不通知操作员 | 使用 `Notification.create_notification()` 创建任务分派通知 |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **批量创建 N+1 查询** | 创建工单耗时 > 5 秒，数据库日志大量 INSERT | 使用 `bulk_create()`，设置 `batch_size` 参数 | 单个工单任务数 > 100 时 |
| **未索引的外键查询** | 任务列表加载慢，EXPLAIN 显示全表扫描 | 为 `(assigned_department, status)` 等常用过滤字段添加组合索引 | 任务记录数 > 10,000 时 |
| **前端大量 DOM 渲染** | 页面滚动卡顿，FPS < 30 | 使用分页（每页 20-50 条）或虚拟滚动 | 任务列表 > 100 条时 |
| **统计报表实时计算** | 统计接口响应时间 > 10 秒 | 使用缓存（Redis）或定时任务预计算统计数据 | 工单数 > 1,000 时 |
| **任务分派策略低效** | 分派耗时过长，操作员负载不均衡 | 使用缓存预计算部门用户数和任务数，选择最少任务的用户 | 部门用户数 > 50 或任务数 > 500 时 |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| **任务列表未过滤用户权限** | 用户可以看到其他部门的敏感任务（如成本、价格） | 在 queryset 中应用 `WorkOrderTaskPermission`，自动过滤无权访问的任务 |
| **任务认领未验证用户身份** | 恶意用户可以认领他人任务 | 检查用户是否属于任务的 `assigned_department`，只有部门成员才能认领 |
| **删除任务未记录审计日志** | 无法追溯谁删除了任务，数据丢失风险高 | 重写 `delete()` 方法，记录操作日志（用户、时间、原因） |
| **API 接口未限流** | 恶意用户批量创建任务，导致系统瘫痪 | 使用 DRF 的 `@throttle_classes` 装饰器，限制每个用户的请求频率 |
| **前端传递用户 ID 进行分派** | 伪造请求可以分派任务给任意用户 | 后端只接收用户 ID，但验证用户是否属于允许的部门，拒绝非法分派 |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **任务创建时无反馈** | 用户不知道任务是否生成成功，重复点击 | 显示加载动画，生成完成后显示"已生成 X 个任务"提示，并跳转到任务列表 |
| **任务列表加载慢但无提示** | 用户以为系统卡死，刷新页面导致重复请求 | 显示骨架屏（Skeleton Screen）或进度条，告知用户正在加载 |
| **任务状态变更后列表不更新** | 用户需要手动刷新才能看到最新状态 | 使用 WebSocket 或轮询自动刷新任务状态，或提供"下拉刷新"按钮 |
| **批量操作无确认** | 用户误操作导致多个任务状态变更 | 显示确认对话框，告知用户将影响哪些任务，提供"取消"选项 |
| **任务分派后无通知** | 操作员不知道自己有新任务，任务延误 | 分派后发送站内通知（`Notification`），可选发送邮件或短信通知 |

---

## "Looks Done But Isn't" Checklist

- [ ] **任务批量创建**: 往往只测试单个工单（5-10 个任务），未测试大规模场景（100+ 任务）—— 验证：创建包含 21 个工序的工单，检查 API 响应时间 < 2 秒
- [ ] **并发任务认领**: 往往只测试单用户认领，未测试多用户同时认领同一任务 —— 验证：使用 JMeter 或类似工具模拟 10 个并发用户认领同一任务，确保只有一个成功
- [ ] **编辑工序后的任务同步**: 往往只测试添加工序，未测试删除和修改工序 —— 验证：创建工单后，删除一个进行中的工序，检查关联任务是否正确处理
- [ ] **跨部门权限控制**: 往往只测试管理员和部门成员，未测试跨部门用户 —— 验证：使用部门 A 的用户登录，检查是否无法看到部门 B 的任务
- [ ] **数据迁移脚本**: 往往只在测试环境验证，未在生产环境小范围试运行 —— 验证：在生产环境选择 10 个旧工单，运行迁移脚本，检查任务是否正确生成
- [ ] **前端列表渲染**: 往往只在桌面端测试，未测试移动端和低性能设备 —— 验证：使用 Chrome DevTools 模拟移动设备，检查任务列表是否流畅滚动
- [ ] **错误处理和回滚**: 往往只测试正常流程，未测试异常情况（如数据库连接失败） —— 验证：在任务生成过程中模拟数据库错误，检查是否正确回滚和提示用户

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **批量创建性能问题** | MEDIUM | 1. 分析慢查询日志，定位耗时操作 <br> 2. 重构 `generate_tasks()` 使用 `bulk_create()` <br> 3. 添加数据库索引优化查询 <br> 4. 如果仍慢，引入异步任务队列（Celery） |
| **数据一致性错误** | HIGH | 1. 停止工单创建功能，防止新数据产生 <br> 2. 编写数据修复脚本，对比工序和任务数量，修复不一致数据 <br> 3. 添加数据库约束（如外键 `on_delete=CASCADE`）防止再次发生 <br> 4. 实现差异更新逻辑，避免全量重新生成 |
| **并发竞态条件** | MEDIUM | 1. 紧急修复：在任务认领接口添加 `select_for_update()` 行锁 <br> 2. 回滚异常数据：检查同一任务的多次分派记录，保留第一次分派 <br> 3. 长期优化：实现数据库唯一约束 + 原子更新操作 |
| **前端性能崩溃** | LOW | 1. 紧急修复：添加分页，每页显示 20 条数据 <br> 2. 性能优化：使用 `vue-virtual-scroller` 实现虚拟滚动 <br> 3. 代码优化：减少不必要的数据绑定和计算属性 |
| **权限漏洞** | HIGH | 1. 立即修复：在所有任务相关接口添加权限检查 <br> 2. 审计日志：导出访问日志，检查是否有越权访问 <br> 3. 加固安全：添加行级权限过滤，确保用户只能看到自己的任务 |
| **数据迁移失败** | HIGH | 1. 停止迁移，评估失败原因和影响范围 <br> 2. 回滚数据库到迁移前状态（如果有备份） <br> 3. 修复迁移脚本错误，在测试环境验证 <br> 4. 小批次试运行：每次迁移 100 条数据，确认无误后继续 |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 批量任务生成的 N+1 查询问题 | Phase 1（性能优化基础） | 性能测试：创建 100 个任务的工单，响应时间 < 2 秒 |
| 草稿-正式状态流转的数据一致性 | Phase 2（数据一致性保障） | 集成测试：编辑工单核心字段后，检查任务是否正确同步更新 |
| 并发任务分派的竞态条件 | Phase 3（并发控制） | 并发测试：10 个用户同时认领同一任务，确保只有一个成功 |
| 大量任务列表的前端渲染性能 | Phase 4（前端性能优化） | 性能测试：任务列表 100+ 条，滚动流畅（FPS > 50） |
| 修改工序对已有任务的级联影响 | Phase 5（变更管理） | 集成测试：删除进行中的工序，检查任务是否正确处理 |
| 跨部门任务的可见性和权限控制 | Phase 6（权限与安全） | 安全测试：部门 A 用户无法访问部门 B 的任务 |
| 现有数据迁移的向后兼容性 | Phase 0（数据迁移准备） | 迁移测试：在生产环境小范围试运行，检查旧工单任务是否正确生成 |

---

## Sources

### Web Research (2024-2025)

- **[Top 20 Problems with Batch Processing (2025)](https://www.kai-waehner.de/blog/2025/04/01/the-top-20-problems-with-batch-processing-and-how-to-fix-them-with-data-streaming/)** - Kai Waehner's Blog (April 2025)
  - 批量处理的常见问题：延迟、错误处理、资源争用

- **[Efficient Bulk Create with Django Rest Framework](https://medium.com/swlh/efficient-bulk-create-with-django-rest-framework-f73da6af7ddc)** - Medium
  - Django REST Framework 批量创建的最佳实践

- **[Django REST efficient bulk create](https://medium.com/@amirayat20/django-rest-efficient-bulk-create-d2fea0ad3e54)** - Medium
  - 高效的 POST 请求和查询优化

- **[Boosting Upsert Performance in Django ORM](https://medium.com/@remidenoyer/django-orm-bulk-operations-optimization-notes-1fd9b3c8cf58)** - Medium
  - Django ORM 批量操作性能优化，避免使用慢速的 `update_or_create()`

- **[Optimizing Large Lists in React: Virtualization vs. Pagination](https://www.ignek.com/blog/optimizing-large-lists-in-react-virtualization-vs-pagination)** - October 18, 2024
  - 大列表渲染优化：虚拟化 vs 分页

- **[Rendering Massive Tables at Lightning Speed](https://dev.to/lalitkhu/rendering-massive-tables-at-lightning-speed-virtualization-with-virtual-scrolling-2dpp)** - October 13, 2025
  - 使用虚拟化技术构建高性能表格数据查看器

- **[Decentralized adaptive task allocation for dynamic multi-agent systems](https://www.nature.com/articles/s41598-025-21709-9)** - Nature, 2025
  - 多智能体系统中的动态任务分配

### Codebase Analysis

- **`backend/workorder/models/core.py`** (第 737-929 行) - 现有 `generate_tasks()` 方法
- **`backend/workorder/models/core.py`** (第 1232-1270 行) - 乐观锁实现
- **`backend/workorder/views/work_orders.py`** (第 84-125 行) - 权限过滤逻辑
- **`backend/workorder/views/work_order_processes.py`** (第 92、112、290 行) - 任务生成调用时机
- **`backend/workorder/services/business_logic.py`** (第 413-430 行) - 业务逻辑服务层的任务生成

### Domain Knowledge

- **印刷行业工艺特点**：21 个工序、多部门协作、外协加工、物料依赖
- **Django 4.2 特性**：`bulk_create()`、`select_for_update()`、`transaction.atomic()`
- **Vue 2.7 限制**：不支持虚拟滚动原生组件，需要第三方库

---

*Pitfalls research for: 工单任务即时分派系统（印刷施工单管理系统）*
*Researched: 2026-01-30*
