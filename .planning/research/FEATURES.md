# Feature Research: Task Instant Dispatch System

**Domain:** 工单/任务管理系统 - 任务即时生成、分派、认领功能
**Researched:** 2026-01-30
**Confidence:** MEDIUM

---

## Executive Summary

本研究聚焦于**任务管理和分派功能**的标准功能，而非整个印刷管理系统的功能。基于现有系统（施工单已实现，任务在工序开始时生成）和新增需求（创建时生成、草稿状态、部门分派、双向认领），研究了任务草稿管理、分派机制、权限控制、状态流转等核心功能。

**关键发现：**
1. **Table Stakes**（必须有的功能）主要集中在任务可见性、基础分派机制、状态流转
2. **Differentiators**（竞争优势）主要在智能调度、工作负载均衡、实时协作
3. **Push vs Pull 模式**是分派机制的核心决策点
4. **草稿管理**和**批量操作**对提升效率至关重要

---

## Feature Landscape

### Table Stakes (Users Expect These)

用户期望的标准功能。缺少这些 = 产品感觉不完整。

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **任务草稿状态管理** | 用户需要在任务正式发布前预览和编辑任务 | LOW | 必须支持：草稿→正式→已分派→进行中→完成的状态流转 |
| **任务预览功能** | 主管和操作员都需要在任务开始前查看任务详情 | LOW | 显示：施工单号、工序、产品数量、特殊要求等 |
| **批量任务操作** | 一次性生成多个任务时，需要批量编辑和批量分派能力 | MEDIUM | 包括：批量发布、批量分派部门、批量删除草稿 |
| **部门级任务分派** | 任务必须先分派到部门，再由主管或操作员认领 | MEDIUM | 支持按工序自动分派到对应部门（已实现基础） |
| **基础权限控制** | 不同角色只能看到和操作自己相关的任务 | MEDIUM | 制表人：全部；业务员：审核；部门主管：本部门；操作员：自己的任务 |
| **任务状态历史** | 用户需要追溯任务的状态变更历史 | LOW | 记录：谁、何时、从什么状态变为什么状态 |
| **主管手动分配** | 部门主管必须能够手动将任务分配给具体操作员 | LOW | 允许主管覆盖自动分配结果 |
| **操作员自领取** | 操作员应该能够从部门任务池中主动领取任务 | LOW | Pull 模式，提升操作员自主性 |
| **任务优先级显示** | 紧急任务必须高亮显示，确保优先处理 | LOW | 基于施工单优先级（urgent/high/normal/low） |
| **基础工作量统计** | 主管需要查看部门和操作员的工作负载 | LOW | 显示：进行中任务数、待处理任务数 |
| **任务搜索和过滤** | 用户需要快速找到特定任务 | LOW | 支持按：状态、部门、操作员、施工单号、优先级过滤 |

### Differentiators (Competitive Advantage)

能区分产品的功能。不是必需的，但很有价值。

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **智能工作负载均衡** | 自动选择任务最少的操作员，避免过载 | HIGH | 策略：least_tasks（最少任务）/random（随机）/round_robin（轮询） |
| **任务分派规则引擎** | 支持灵活配置工序-部门-操作员的分派规则 | HIGH | 优先级排序、技能匹配、可用性检测 |
| **实时任务通知** | 任务分派后立即通知相关人员 | MEDIUM | 支持站内消息、邮件、移动端推送（已实现基础） |
| **任务池可视化** | 主管可以直观看到部门任务池和工作负载 | MEDIUM | 看板视图、甘特图、热力图 |
| **预测性任务调度** | 基于历史数据预测任务完成时间，优化排程 | HIGH | 需要机器学习模型，计算复杂 |
| **协作式任务认领** | 多个操作员可以协作完成一个任务（任务拆分） | MEDIUM | 支持父任务-子任务结构（已实现数据模型） |
| **任务自动重分配** | 当操作员长时间未处理任务时，自动重新分派 | MEDIUM | 超时检测、自动提醒、重新分配 |
| **技能匹配算法** | 根据操作员技能评分自动分派最合适的任务 | HIGH | 需要技能评分系统和匹配算法 |
| **动态优先级调整** | 根据截止日期、依赖关系动态调整任务优先级 | MEDIUM | 关键路径法（CPM）、紧急度计算 |
| **任务模板和快速生成** | 常见任务可以保存为模板，快速生成类似任务 | MEDIUM | 提升重复任务的创建效率 |
| **移动端任务认领** | 操作员可以通过移动端随时随地领取和处理任务 | MEDIUM | 需要 PWA 或原生 App 支持 |
| **任务协作评论** | 支持任务级别的评论和讨论，方便沟通 | LOW | 类似 Jira 的评论功能 |
| **批量任务导入导出** | 支持 Excel 导入导出任务，方便批量管理 | MEDIUM | 适用于大批量任务初始化 |

### Anti-Features (Commonly Requested, Often Problematic)

看起来不错但实际上有问题的功能。

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **完全自动分配（无人工干预）** | 似乎能减少主管工作量 | 实际情况复杂，自动分配容易出错，操作员和主管都会不满意 | **混合模式**：自动分配+手动调整，保留人工干预能力 |
| **实时强制任务分配** | 试图确保任务立即被领取 | 会打断操作员当前工作，引发抵触情绪 | **任务池模式**：操作员自主选择何时领取任务 |
| **复杂权限矩阵（每个任务单独设置）** | 试图实现细粒度权限 | 权限管理过于复杂，维护成本高，容易出错 | **角色+部门权限**：基于角色和部门的简化权限模型 |
| **所有任务全局可见** | 试图提升透明度 | 信息过载，操作员看到无关任务会困惑 | **按部门过滤**：默认只显示本部门任务，可选查看全局 |
| **任务状态无限回退** | 试图允许纠正错误 | 状态流转混乱，难以追踪任务历史 | **限制状态回退**：只允许从错误状态回退到前一个状态 |
| **频繁优先级变更** | 试图动态调整任务优先级 | 优先级不断变化，操作员无所适从 | **稳定优先级**：优先级基于施工单，原则上不轻易变更 |
| **过度细化的任务拆分** | 试图更精细地管理任务 | 任务数量爆炸，管理成本大于收益 | **适度拆分**：只在必要时拆分任务（如多人协作） |

---

## Feature Dependencies

```
[任务草稿管理]
    ├──requires──> [任务状态流转]
    │                  └──requires──> [任务权限控制]
    │
    └──enhances──> [批量任务操作]

[部门级任务分派]
    ├──requires──> [任务-工序-部门关联]
    │                  └──requires──> [任务权限控制]
    │
    └──enhances──> [主管手动分配]
                     └──conflicts──> [操作员自领取] (可同时存在，但需设计交互)

[工作负载均衡]
    ├──requires──> [基础工作量统计]
    │                  └──requires──> [任务-操作员关联]
    │
    └──enhances──> [智能工作负载均衡]
                     └──requires──> [任务分派规则引擎]

[实时任务通知]
    └──enhances──> [操作员自领取]
```

### Dependency Notes

- **任务草稿管理 requires 任务状态流转**：草稿是状态流转的起点，必须先定义完整的状态机
- **部门级任务分派 requires 任务-工序-部门关联**：自动分派依赖工序和部门的关联关系（已实现）
- **主管手动分配 conflicts 操作员自领取**：两种分派模式可以共存，但需要明确交互规则（如主管分配后操作员不可更改）
- **工作负载均衡 requires 基础工作量统计**：必须先能统计工作量，才能实现均衡分配
- **实时任务通知 enhances 操作员自领取**：通知可以提升 Pull 模式的响应速度

---

## Task Assignment Patterns: Push vs Pull

### Push 模式（主管分配）

**优势：**
- 确保任务被及时分配
- 主管可以根据技能、工作量优化分配
- 适合紧急任务和复杂任务

**劣势：**
- 主管工作量大
- 操作员缺乏自主性
- 可能出现分配不合理的情况

**适用场景：**
- 紧急任务
- 需要特定技能的任务
- 新操作员较多的团队

### Pull 模式（操作员自领）

**优势：**
- 操作员自主性强，满意度高
- 主管工作量小
- 操作员更了解自己的能力和时间

**劣势：**
- 可能出现任务无人领取的情况
- 难以实现全局最优分配
- 需要配套的激励和监督机制

**适用场景：**
- 常规任务
- 操作员经验丰富的团队
- 强调自主性的文化

### Hybrid 模式（推荐）

**设计原则：**
1. **默认自动分配到部门**：任务生成时自动分派到对应部门（Push）
2. **支持操作员自领取**：部门任务池中的任务，操作员可以主动领取（Pull）
3. **主管可以手动干预**：主管可以手动将任务分配给具体操作员（Push）
4. **智能工作负载均衡**：自动分配时考虑当前工作量（算法优化 Push）

**交互规则：**
- 任务状态为 `pending` 且 `assigned_department` 已设置但 `assigned_operator` 为空 → 可被领取
- 操作员领取任务后，`assigned_operator` 自动设置为当前用户，状态变为 `in_progress`
- 主管可以随时手动分配或重新分配任务
- 自动分配仅在任务生成时执行一次

---

## MVP Definition

### Launch With (v1)

最小可行产品 - 验证核心概念所需的功能。

- [x] **任务草稿状态** - 支持草稿→正式的状态流转
- [x] **任务创建时生成** - 施工单审核通过后立即生成任务（而非工序开始时）
- [x] **部门级自动分派** - 根据工序-部门关联自动分派任务到部门
- [ ] **主管手动分配** - 部门主管可以将部门任务分配给具体操作员
- [ ] **操作员自领取** - 操作员可以从部门任务池中主动领取任务
- [ ] **基础权限控制** - 不同角色只能看到和操作自己相关的任务
- [ ] **任务优先级显示** - 在任务列表中显示优先级标识
- [ ] **基础工作量统计** - 显示部门和操作员的进行中/待处理任务数

### Add After Validation (v1.x)

核心功能验证通过后添加的功能。

- [ ] **批量任务操作** - 批量发布、批量分派、批量删除
- [ ] **实时任务通知** - 任务分派后立即通知相关人员
- [ ] **任务搜索和过滤** - 支持多条件过滤任务
- [ ] **任务状态历史** - 记录和查看任务状态变更历史
- [ ] **智能工作负载均衡** - 自动选择任务最少的操作员（least_tasks 策略）

### Future Consideration (v2+)

产品市场匹配度确立后再考虑的功能。

- [ ] **任务分派规则引擎** - 支持灵活配置分派规则（优先级、技能匹配等）
- [ ] **任务池可视化** - 看板视图、甘特图
- [ ] **预测性任务调度** - 基于历史数据预测完成时间
- [ ] **协作式任务认领** - 支持任务拆分和多人协作
- [ ] **移动端任务认领** - PWA 或原生 App 支持
- [ ] **技能匹配算法** - 基于技能评分的智能分配
- [ ] **动态优先级调整** - 基于截止日期和依赖关系调整优先级

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| 任务草稿状态管理 | HIGH | LOW | P1 |
| 任务创建时生成 | HIGH | MEDIUM | P1 |
| 部门级自动分派 | HIGH | MEDIUM | P1 |
| 主管手动分配 | HIGH | LOW | P1 |
| 操作员自领取 | HIGH | MEDIUM | P1 |
| 基础权限控制 | HIGH | MEDIUM | P1 |
| 任务优先级显示 | MEDIUM | LOW | P1 |
| 基础工作量统计 | MEDIUM | LOW | P1 |
| 批量任务操作 | MEDIUM | MEDIUM | P2 |
| 实时任务通知 | MEDIUM | MEDIUM | P2 |
| 任务搜索和过滤 | MEDIUM | LOW | P2 |
| 任务状态历史 | LOW | LOW | P2 |
| 智能工作负载均衡 | MEDIUM | HIGH | P2 |
| 任务分派规则引擎 | MEDIUM | HIGH | P3 |
| 任务池可视化 | MEDIUM | MEDIUM | P3 |
| 预测性任务调度 | LOW | HIGH | P3 |
| 协作式任务认领 | MEDIUM | MEDIUM | P3 |
| 移动端任务认领 | MEDIUM | HIGH | P3 |
| 技能匹配算法 | LOW | HIGH | P3 |
| 动态优先级调整 | LOW | HIGH | P3 |

**Priority key:**
- **P1**: Must have for launch (MVP)
- **P2**: Should have, add when possible (v1.x)
- **P3**: Nice to have, future consideration (v2+)

---

## Competitor Feature Analysis

基于印刷行业工单管理系统和通用任务管理系统的功能对比：

| Feature | 传统印刷软件 | 现代任务管理软件 | Our Approach |
|---------|-------------|-----------------|--------------|
| **任务生成时机** | 工序开始时生成 | 任务创建时生成 | **创建时生成**（提升效率） |
| **分派模式** | 仅主管分配 | 支持自领取 | **混合模式**（Push + Pull） |
| **草稿管理** | ❌ 通常不支持 | ✅ 支持 | ✅ **支持**（提升灵活性） |
| **工作负载均衡** | ❌ 手动统计 | ✅ 自动均衡 | ✅ **智能均衡**（least_tasks 策略） |
| **权限控制** | 基于角色 | 基于角色+项目 | **基于角色+部门** |
| **实时通知** | ❌ 通常不支持 | ✅ 支持 | ✅ **支持**（已实现基础） |
| **移动端支持** | ❌ 桌面为主 | ✅ 移动优先 | **桌面优先，后续扩展移动端** |

---

## Existing System Analysis

### Current Implementation

根据代码分析，现有系统已实现以下功能：

1. **任务模型** (WorkOrderTask) ✅
   - 支持任务类型：plate_making, cutting, printing, foiling, embossing, die_cutting, packaging, general
   - 支持任务分派字段：`assigned_department`, `assigned_operator`
   - 支持任务拆分：`parent_task`, `subtasks`
   - 支持并发控制：乐观锁（`version` 字段）

2. **任务生成逻辑** (WorkOrderProcess.generate_tasks) ✅
   - 当前实现：工序开始时生成任务
   - 需要修改：施工单创建时生成任务（草稿状态）

3. **自动分派逻辑** (WorkOrderProcess._auto_assign_task) ✅
   - 已实现：根据工序-部门关联自动分派
   - 已实现：多种操作员选择策略（least_tasks, random, round_robin, first_available）
   - 已实现：任务分派通知

4. **任务日志** (TaskLog) ✅
   - 已实现：任务操作日志（数量更新、状态变更、强制完成）

### Gaps to Address

| Feature | Current State | Required State | Gap |
|---------|---------------|----------------|-----|
| **任务生成时机** | 工序开始时生成 | 施工单创建时生成（草稿状态） | **需要修改生成逻辑** |
| **任务状态流转** | pending → in_progress → completed | draft → pending → assigned → in_progress → completed | **需要增加 draft 和 assigned 状态** |
| **草稿管理功能** | ❌ 无 | ✅ 支持草稿预览、编辑、批量操作 | **需要新增功能** |
| **操作员自领取** | ❌ 无 | ✅ 操作员可以从部门任务池领取任务 | **需要新增接口** |
| **基础权限控制** | ✅ 部分实现 | ✅ 完善权限模型 | **需要优化** |
| **工作量统计** | ❌ 无 | ✅ 显示部门和操作员的任务数 | **需要新增接口** |

---

## Recommended Implementation Approach

### Phase 1: Core Task Generation & Draft Management (P1)

**目标：** 实现任务草稿状态和创建时生成

1. 修改 `WorkOrderTask` 模型，增加 `draft` 状态
2. 修改 `WorkOrderProcess.generate_tasks()` 逻辑：
   - 在施工单审核通过后立即调用（而非工序开始时）
   - 生成的任务状态为 `draft`
3. 实现草稿管理功能：
   - 草稿任务列表接口（按部门过滤）
   - 草稿任务详情接口
   - 批量发布草稿接口（draft → pending）
4. 实现基础权限控制：
   - 制表人：查看所有草稿
   - 部门主管：查看本部门草稿
   - 操作员：查看分配给自己的任务

### Phase 2: Task Assignment (P1)

**目标：** 实现主管手动分配和操作员自领取

1. 主管手动分配接口：
   - `POST /api/tasks/{id}/assign-operator/`
   - 参数：`operator_id`
   - 权限：仅部门主管可操作
2. 操作员自领取接口：
   - `POST /api/tasks/{id}/claim/`
   - 自动设置 `assigned_operator` 为当前用户
   - 状态变更为 `in_progress`
3. 优化自动分派逻辑：
   - 任务发布时（draft → pending）自动分派到部门
   - 但不自动分派到操作员（保留 Pull 模式）

### Phase 3: Workload Balancing (P1)

**目标：** 实现基础工作量统计和智能均衡

1. 工作量统计接口：
   - `GET /api/tasks/workload-statistics/`
   - 返回：各部门的待处理/进行中任务数
   - 返回：各操作员的待处理/进行中任务数
2. 优化 `_auto_assign_task()` 的操作员选择策略：
   - 默认使用 `least_tasks` 策略（已实现）
   - 在主管手动分配时，推荐任务最少的操作员

### Phase 4: Enhanced Features (P2)

**目标：** 添加批量操作、搜索过滤、实时通知

1. 批量操作接口：
   - `POST /api/tasks/batch-publish/` (批量发布草稿)
   - `POST /api/tasks/batch-assign-department/` (批量分派部门)
   - `DELETE /api/tasks/batch-delete/` (批量删除草稿)
2. 搜索和过滤：
   - 支持按状态、部门、操作员、施工单号、优先级过滤
   - 支持关键词搜索
3. 实时通知优化：
   - 任务发布时通知部门主管
   - 任务分配时通知操作员
   - 任务领取时通知主管

### Phase 5: Advanced Features (P3)

**目标：** 实现规则引擎、可视化、移动端支持

1. 任务分派规则引擎：
   - 支持配置工序-部门-操作员的分派规则
   - 支持优先级排序
   - 支持技能匹配
2. 任务池可视化：
   - 看板视图（按状态分列）
   - 部门工作量热力图
3. 移动端支持：
   - PWA 应用
   - 离线任务列表
   - 移动端任务认领

---

## Sources

### Field Service Management & Dispatch Systems
- [Field Service Management Trends in 2026 | Fieldwork](https://fieldworkhq.com/2025/12/26/field-service-management-trends-in-2026/)
- [7 Essential Features for Your Delivery Management App | DispatchTrack](https://www.dispatchtrack.com/blog/delivery-management-app/)
- [Global Field Service Management Trends 2026: AI, IoT & ... | Brocoders](https://brocoders.com/blog/global-field-service-management-trends-2026/)
- [Guide to Field Service Dispatching: Smarter Jobs, Less ... | BuildOps](https://buildops.com/resources/field-service-dispatching-guide/)

### Task Assignment & Workload Balancing
- [Best Practices: Automatic Task Assignment | Jamy.ai](https://www.jamy.ai/blog/best-practices-automatic-assignment-of-tasks/)
- [Smart Task Assignment: What to Automate in Field Service | Serfy](https://serfy.io/blog/efficient-task-assignment-what-should-be-automated)
- [Smart workload distribution: 6 tools and techniques for ... | Meistertask](https://www.meistertask.com/blog/smart-workload-distribution-6-tools-and-techniques-for-managers)
- [Strategies For Effective Workload Distribution | Desklog](https://desklog.io/blog/workload-distribution/)
- [Workload Calculation Algorithm | ActivityTimeline](https://help.activitytimeline.com/at/workload-calculation-algorithm)

### Push vs Pull Systems
- [Scrum: Is it "PULL" or "PUSH" System? | Scrum.org](https://www.scrum.org/forum/scrum-forum/31919/scrum-forum-31919-scrum-its-pull-or-push-system)
- [Push vs Pull in Software Development | Matt Law](https://mattlaw.dev/blog/push-vs-pull-in-software-development)
- [Push vs. Pull | Playbookteam](https://playbookteam.com/resources/blog/push-vs-pull)
- [3 paradigms of managing testing tasks: push, pull, and full ... | Qase](https://qase.io/blog/managing-tests-push-pull-and-full-autonomy/)
- [Push System vs Pull System in Manufacturing | MRPEasy](https://www.mrpeasy.com/blog/push-system-vs-pull-system-in-manufacturing/)

### Manufacturing Work Order Scheduling
- [Work Order Scheduling | Rootstock](https://rootstock.my.site.com/Trailblazer/s/article/Work-Order-Scheduling)
- [Dispatching Rule - an overview | ScienceDirect](https://www.sciencedirect.com/topics/computer-science/dispatching-rule)
- [Scheduling and Dispatching in Production Activity Control (PAC) | LinkedIn](https://www.linkedin.com/pulse/scheduling-dispatching-production-activity-control-pac-abdelnabby-2hnvf)
- [What is a Work Order: Process & Examples | SafetyCulture](https://safetyculture.com/topics/work-order)
- [Priority Dispatching Rules in Scheduling | Scribd](https://www.scribd.com/document/415735676/12-chapter-2-pdf)

### Task Management Software
- [7 Benefits of Task Management Software You Need to ... | Akiflow](https://akiflow.com/blog/benefits-task-management-software)
- [Enterprise Task Management Software Guide | Wrike](https://www.wrike.com/blog/enterprise-task-management-software/)
- [Best Task Management Software and Tools | Aproove](https://www.aproove.com/task-management-software)
- [Task Management Software: Digital Task Assignment | TimeTrack](https://www.timetrackapp.com/en/task-management-software/)

---

**Confidence Assessment:**

| Area | Confidence | Reason |
|------|------------|--------|
| Table Stakes Features | HIGH | 基于多个行业资源的一致发现 |
| Differentiators | MEDIUM | 部分功能基于 2026 趋势预测，需验证 |
| Anti-Features | MEDIUM | 基于通用系统设计原则，但印刷行业特性需验证 |
| Push vs Pull Patterns | HIGH | 有丰富的敏捷和制造业文献支持 |
| Implementation Complexity | MEDIUM | 基于现有代码分析，但部分功能（如规则引擎）复杂度高 |

**Open Questions:**

1. 印刷行业的任务分派是否有特殊约束（如设备占用、材料准备时间）？
2. 操作员的技能模型如何定义（是按工序、设备还是产品）？
3. 任务优先级除了基于施工单优先级，是否需要考虑其他因素（如截止日期、客户重要性）？
4. 是否需要支持跨部门协作（一个任务需要多个部门协作完成）？

---

*Feature research for: 工单/任务管理系统 - 任务即时生成、分派、认领功能*
*Researched: 2026-01-30*
