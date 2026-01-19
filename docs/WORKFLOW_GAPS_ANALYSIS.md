# 印刷施工单跟踪系统 - 业务流程缺失分析报告

> 从客户下单到财务统计的完整流程分析

**文档版本**: v1.0.0
**分析日期**: 2026-01-18
**系统版本**: v2.0.0
**分析范围**: 客户下单 → 施工生产 → 分工协作 → 完成生产 → 产品交付 → 财务统计

---

## 目录

1. [执行摘要](#执行摘要)
2. [分析范围与方法](#分析范围与方法)
3. [已实现功能全景](#已实现功能全景)
4. [流程缺失详细分析](#流程缺失详细分析)
5. [关键问题汇总](#关键问题汇总)
6. [改进建议路线图](#改进建议路线图)
7. [附录](#附录)

---

## 执行摘要

### 核心发现

经过对系统代码库的全面分析,本系统在**施工生产管理**方面功能完善,但在**客户下单**和**财务统计**两个端点上存在明显缺失:

| 流程阶段 | 完成度 | 关键缺失 |
|---------|--------|---------|
| 客户下单 | **30%** | 缺少报价管理、合同管理、订单审批流程 |
| 施工生产 | **95%** | 功能完善,包含21道工序、任务分派、进度跟踪 |
| 分工协作 | **90%** | 任务管理、部门协作、通知机制健全 |
| 完成生产 | **70%** | 缺少质量检验、成品入库、生产成本核算 |
| 产品交付 | **40%** | 缺少发货管理、物流跟踪、签收回执 |
| 财务统计 | **20%** | 缺少成本核算、发票管理、对账结算、财务报表 |

### 业务影响

1. **收入管理风险**: 无法追踪销售订单的完整收款周期
2. **成本核算缺失**: 无法计算实际生产成本,盈利分析困难
3. **库存管理薄弱**: 缺少成品库存管理和出库记录
4. **合规性风险**: 缺少发票管理和对账机制

---

## 分析范围与方法

### 分析方法

本次分析采用以下方法:

1. **代码静态分析**: 审查后端模型(models)、序列化器(serializers)、视图集(views)
2. **前端路由分析**: 分析前端路由配置和页面组件
3. **API接口分析**: 审查API端点和数据流
4. **文档对比**: 与现有技术文档和需求文档对比

### 分析范围

#### 后端代码
- `backend/workorder/models/` - 30+ 数据模型
- `backend/workorder/serializers/` - 序列化器
- `backend/workorder/views/` - API视图集
- `backend/workorder/admin.py` - Django Admin配置

#### 前端代码
- `frontend/src/views/` - 30+ 页面组件
- `frontend/src/api/` - API接口封装
- `frontend/src/router/` - 路由配置

#### 已有文档
- `docs/TECHNICAL_ARCHITECTURE.md`
- `docs/WORKFLOW_ANALYSIS_REPORT.md`
- `docs/PERMISSIONS.md`

---

## 已实现功能全景

### 1. 客户下单相关功能 (完成度: 30%)

#### ✅ 已实现

**数据模型**:
- [`Customer`](backend/workorder/models/base.py:14) - 客户信息管理
  - 客户基本信息(名称、编码、联系人)
  - 客户分组(普通客户、VIP客户)
  - 业务员关联
  - 信用额度(字段存在,未使用)

**销售订单** ([`SalesOrder`](backend/workorder/models/sales.py:14)):
- 销售订单基本信息(订单号、客户、日期)
- 订单状态管理(草稿、已提交、已审核、生产中、已完成、已取消)
- 付款状态(未付款、部分付款、已付款)
- 金额计算(小计、税额、折扣、总额)
- 审核流程(提交、审核、拒绝)
- 与施工单关联(ManyToMany)

**前端页面**:
- [`/sales-orders`](frontend/src/router/index.js:141) - 销售订单列表
- [`/sales-orders/create`](frontend/src/router/index.js:148) - 创建销售订单
- [`/sales-orders/:id`](frontend/src/router/index.js:153) - 销售订单详情

**API接口**:
- 销售订单CRUD操作
- 提交/审核/拒绝流程
- 付款信息更新

#### ❌ 缺失功能

1. **报价管理**
   - 缺少 `Quotation` 模型
   - 无法生成正式报价单
   - 报价审批流程缺失
   - 报价转订单流程缺失

2. **合同管理**
   - 缺少 `Contract` 模型
   - 无电子合同功能
   - 合同签署流程缺失
   - 合同归档管理缺失

3. **订单审批增强**
   - 缺少多级审批配置(当前只有简单审核)
   - 缺少审批条件规则(金额阈值)
   - 缺少审批超时提醒

4. **客户信用管理**
   - 信用额度字段存在但未使用
   - 无欠款统计
   - 无信用预警机制

5. **价格管理**
   - 产品价格只存在于Product模型
   - 缺少客户专属价格
   - 缺少批量折扣配置
   - 缺少价格历史记录

### 2. 施工生产流程 (完成度: 95%)

#### ✅ 已实现

**施工单管理** ([`WorkOrder`](backend/workorder/models/core.py:56)):
- 施工单基本信息(单号、客户、产品)
- 审核流程(待审核、已通过、已拒绝)
- 状态跟踪(待开始、进行中、已暂停、已完成、已取消)
- 优先级管理(低、普通、高、紧急)
- 数量管理(生产数量、预损数量)

**工序管理** ([`WorkOrderProcess`](backend/workorder/models/core.py:L438)):
- 21个预设工序(CTP制版、CUT开料、PRT印刷、DIE模切、FOIL烫金、EMBOSS压凸等)
- 工序状态跟踪
- 工序操作日志([`ProcessLog`](backend/workorder/models/core.py:L730))
- 工序间依赖关系

**任务管理** ([`WorkOrderTask`](backend/workorder/models/core.py:L548)):
- 自动任务生成(基于工序)
- 任务类型(制版、开料、印刷、通用任务)
- 任务分派(部门分派、操作员分派)
- 任务状态(待开始、进行中、已完成、已暂停、已取消)
- 任务数量记录(计划数量、完成数量、不良品数量)
- 任务操作日志([`TaskLog`](backend/workorder/models/core.py:L757))
- 任务拆分功能
- 子任务支持

**资产管理**:
- [`Artwork`](backend/workorder/models/assets.py:20) - 图稿管理(版本控制、确认状态)
- [`Die`](backend/workorder/models/assets.py:115) - 刀模管理
- [`FoilingPlate`](backend/workorder/models/assets.py:205) - 烫金版管理
- [`EmbossingPlate`](backend/workorder/models/assets.py:283) - 压凸版管理

**智能分派**:
- 基于工序-部门关联自动分派
- 多种分派策略([`TaskAssignmentRule`](backend/workorder/models/system.py:L213))
  - least_tasks: 最少任务优先
  - random: 随机分派
  - round_robin: 轮询分派
  - first_available: 首个可用

**前端功能**:
- 施工单创建/编辑/详情页面
- 工序管理界面
- 任务看板([`/tasks/board`](frontend/src/router/index.js:173))
- 任务列表([`/tasks`](frontend/src/router/index.js:167))
- 协作统计([`/tasks/stats`](frontend/src/router/index.js:179))

#### ❌ 缺失功能

1. **生产排期**
   - 缺少生产日历视图
   - 缺少产能规划
   - 缺少冲突检测(同一资源多任务)

2. **异常处理**
   - 缺少异常上报机制
   - 缺少返工流程
   - 缺少报废处理

3. **设备管理**
   - 缺少设备档案
   - 缺少设备保养计划
   - 缺少设备故障记录

### 3. 分工协作功能 (完成度: 90%)

#### ✅ 已实现

**部门组织** ([`Department`](backend/workorder/models/base.py:L43)):
- 树形部门结构
- 部门-工序关联
- 部门层级关系

**用户权限**:
- Django用户组权限
- UserProfile扩展([`UserProfile`](backend/workorder/models/system.py:14))
- 基于角色的权限控制

**通知系统** ([`Notification`](backend/workorder/models/system.py:L63)):
- 通知类型(任务通知、工序通知、系统通知)
- 通知优先级
- 已读/未读状态
- 通知接收人

**协作统计**:
- 任务完成统计
- 部门工作量统计
- 操作员绩效统计
- 分派历史记录

#### ❌ 缺失功能

1. **即时通讯**
   - 缺少站内消息功能
   - 缺少任务评论功能
   - 缺少@提醒功能

2. **协作增强**
   - 缺少任务指派协商
   - 缺少任务协助请求
   - 缺少任务交接记录

### 4. 完成生产相关功能 (完成度: 70%)

#### ✅ 已实现

**完工状态跟踪**:
- 工序完成状态
- 任务完成状态
- 施工单完成状态
- 完成数量记录

**不良品管理**:
- 不良品数量记录
- 任务日志中的不良品原因

#### ❌ 缺失功能

1. **质量检验**
   - 缺少 `QualityInspection` 模型
   - 缺少质检标准配置
   - 缺少质检报告生成
   - 缺少不合格品处理流程

2. **成品入库**
   - 缺少 `ProductStock` 模型(成品库存)
   - 缺少入库单功能
   - 缺少库位管理
   - 缺少盘点功能

3. **生产成本核算**
   - 缺少 `ProductionCost` 模型
   - 缺少材料成本统计
   - 缺少人工成本统计
   - 缺少设备折旧计算
   - 缺少能耗统计

4. **工时管理**
   - 缺少工时记录
   - 缺少工时统计
   - 缺少计件工资计算

### 5. 产品交付功能 (完成度: 40%)

#### ✅ 已实现

**交货日期管理**:
- SalesOrder.delivery_date - 预计交货日期
- SalesOrder.actual_delivery_date - 实际交货日期
- WorkOrder.delivery_date - 施工单交货日期
- WorkOrder.actual_delivery_date - 施工单实际交货日期

**客户信息**:
- Customer.address - 送货地址
- Customer.contact_person - 联系人
- Customer.phone - 联系电话

#### ❌ 缺失功能

1. **发货管理**
   - 缺少 `DeliveryOrder` 模型(发货单)
   - 缺少发货单号生成
   - 缺少发货明细
   - 缺少发货状态跟踪

2. **物流管理**
   - 缺少物流公司信息
   - 缺少物流单号
   - 缺少物流状态跟踪
   - 缺少物流费用记录

3. **签收回执**
   - 缺少签收记录
   - 缺少签收照片上传
   - 缺少签收异常处理
   - 缺少电子签收

4. **交付确认**
   - 缺少客户确认流程
   - 缺少验收标准
   - 缺少验收报告

### 6. 财务统计功能 (完成度: 20%)

#### ✅ 已实现

**基础金额字段**:
- SalesOrder.total_amount - 销售订单总额
- SalesOrder.paid_amount - 已付金额
- SalesOrder.payment_status - 付款状态
- WorkOrder.total_amount - 施工单金额
- Product.unit_price - 产品单价
- Material.unit_price - 物料单价

**付款信息**:
- SalesOrder.deposit_amount - 定金
- SalesOrder.payment_date - 付款日期

**采购金额**:
- PurchaseOrder.total_amount - 采购单总额
- PurchaseOrderItem - 采购明细金额

#### ❌ 缺失功能

1. **成本核算体系**
   - 缺少 `CostCenter` 模型(成本中心)
   - 缺少 `CostItem` 模型(成本项目)
   - 缺少 `ProductionCost` 模型(生产成本)
   - 缺少成本分摊规则
   - 缺少成本核算周期
   - 缺少标准成本与实际成本对比

2. **发票管理**
   - 缺少 `Invoice` 模型(发票)
   - 缺少开票流程
   - 缺少发票类型(增值税专用发票、普通发票)
   - 缺少发票状态管理
   - 缺少发票与订单关联
   - 缺少开票记录

3. **收款管理**
   - 缺少 `Payment` 模型(收款记录)
   - 缺少收款方式(现金、转账、支票)
   - 缺少收款计划
   - 缺少催款提醒
   - 缺少收款核销
   - 缺少账期管理

4. **应付账款**
   - 缺少供应商付款管理
   - 缺少付款申请流程
   - 缺少付款审批
   - 缺少付款记录

5. **对账结算**
   - 缺少客户对账单生成
   - 缺少供应商对账单
   - 缺少对账周期配置
   - 缺少对账差异处理
   - 缺少月度结账流程

6. **财务报表**
   - 缺少收入报表(按客户、按产品、按时间)
   - 缺少成本报表
   - 缺少利润分析表
   - 缺少应收账款账龄分析
   - 缺少应付账款账龄分析
   - 缺少现金流量表
   - 缺少成本对比分析

7. **财务分析**
   - 缺少毛利率分析
   - 缺少产品盈利能力分析
   - 缺少客户贡献分析
   - 缺少成本趋势分析
   - 缺少预算管理
   - 缺少财务KPI看板

---

## 流程缺失详细分析

### 阶段1: 客户下单流程缺失

#### 当前流程

```
客户询价 → 业务员手动报价 → 确认订单 → 创建销售订单 → 提交审核 → 生产
```

#### 流程断裂点

1. **报价环节缺失**
   - 无法系统化生成报价单
   - 报价历史无法追溯
   - 报价与实际订单无关联

2. **合同环节缺失**
   - 无正式合同管理
   - 无电子签章
   - 无合同归档

3. **信用控制缺失**
   - 超信用额度订单无法拦截
   - 无欠款提醒
   - 无账期控制

#### 业务影响

- **风险**: 客户纠纷风险增加(无正式合同)
- **效率**: 报价流程完全手工操作,效率低
- **合规**: 缺少法律保障(合同)
- **风控**: 无法控制客户信用风险

### 阶段2: 施工生产流程缺失

#### 当前流程

```
施工单创建 → 审核通过 → 工序执行 → 任务完成 → 施工单完成
```

#### 流程断裂点

1. **生产排期缺失**
   - 无法可视化查看生产计划
   - 资源冲突无法提前发现
   - 交货期评估不准确

2. **质量控制缺失**
   - 质检流程不标准
   - 质检数据不完整
   - 质量问题追溯困难

3. **成本数据缺失**
   - 生产成本无法核算
   - 盈利分析不准确
   - 成本控制困难

#### 业务影响

- **效率**: 生产计划不合理,资源浪费
- **质量**: 质量问题频发,客户投诉
- **成本**: 成本失控,利润下降

### 阶段3: 分工协作流程缺失

#### 当前流程

```
任务自动生成 → 自动分派 → 任务执行 → 完成上报
```

#### 流程断裂点

1. **沟通协作缺失**
   - 任务协商功能缺失
   - 问题反馈不及时
   - 协作效率低

2. **绩效管理缺失**
   - 无绩效评分系统
   - 无激励措施
   - 团队活力不足

#### 业务影响

- **效率**: 沟通成本高,协作效率低
- **士气**: 团队积极性不高

### 阶段4: 完成生产流程缺失

#### 当前流程

```
工序完成 → 施工单完成 → (结束)
```

#### 流程断裂点

1. **质检环节缺失**
   - 无强制质检流程
   - 质量标准不统一
   - 质检报告缺失

2. **入库环节缺失**
   - 无成品入库记录
   - 库存数量不准确
   - 库存管理困难

3. **成本核算缺失**
   - 实际成本无法计算
   - 标准成本对比缺失
   - 成本优化无依据

#### 业务影响

- **质量**: 质量风险高
- **库存**: 库存数据不准确
- **成本**: 成本失控

### 阶段5: 产品交付流程缺失

#### 当前流程

```
施工单完成 → (手动发货) → 客户收货
```

#### 流程断裂点

1. **发货管理缺失**
   - 无发货单据
   - 无发货明细
   - 无发货记录

2. **物流跟踪缺失**
   - 无法跟踪物流状态
   - 客户无法查询物流
   - 物流问题处理不及时

3. **签收确认缺失**
   - 无签收记录
   - 交接责任不清
   - 纠纷风险高

#### 业务影响

- **服务**: 客户体验差
- **风险**: 货物丢失责任不清
- **效率**: 物流问题处理不及时

### 阶段6: 财务统计流程缺失

#### 当前流程

```
订单创建 → 记录金额 → (部分收款) → (结束)
```

#### 流程断裂点

1. **成本核算缺失**
   - 无法计算实际成本
   - 无法分析利润
   - 无法优化成本

2. **发票管理缺失**
   - 无开票流程
   - 无发票记录
   - 税务风险高

3. **收款管理缺失**
   - 无收款计划
   - 无催款机制
   - 回款率低

4. **对账结算缺失**
   - 无法生成对账单
   - 对账工作量大
   - 账务混乱

5. **财务分析缺失**
   - 无财务报表
   - 无经营分析
   - 决策无依据

#### 业务影响

- **盈利**: 无法准确计算利润
- **现金流**: 回款不及时,现金流紧张
- **合规**: 税务风险高
- **决策**: 缺少数据支撑

---

## 关键问题汇总

### 按严重程度分类

#### 🔴 严重问题(P0 - 必须立即解决)

1. **成本核算完全缺失**
   - 影响: 无法计算产品实际成本,无法分析盈利能力
   - 风险: 订单可能亏损而不自知
   - 建议: 优先实施成本核算模块

2. **发票管理缺失**
   - 影响: 无法合规开票,存在税务风险
   - 风险: 税务合规问题
   - 建议: 优先实施发票管理模块

3. **成品库存缺失**
   - 影响: 无法追踪成品库存,发货依据不足
   - 风险: 库存数据混乱,可能导致超卖
   - 建议: 优先实施成品库存管理

4. **发货管理缺失**
   - 影响: 发货流程无记录,责任不清
   - 风险: 货物丢失纠纷
   - 建议: 优先实施发货单管理

#### 🟡 重要问题(P1 - 近期需要解决)

5. **报价管理缺失**
   - 影响: 报价流程效率低,历史数据无法追溯
   - 建议: 实施报价管理模块

6. **收款管理缺失**
   - 影响: 回款跟踪困难,催款不及时
   - 建议: 实施收款计划和催款功能

7. **对账结算缺失**
   - 影响: 对账工作量大,效率低
   - 建议: 实施对账单自动生成

8. **质量检验缺失**
   - 影响: 质量控制不标准,质量问题频发
   - 建议: 实施质检管理模块

#### 🟢 优化问题(P2 - 中长期优化)

9. **生产排期缺失**
   - 影响: 生产计划可视化程度低
   - 建议: 实施生产日历和产能规划

10. **物流跟踪缺失**
    - 影响: 客户无法查询物流,体验差
    - 建议: 集成物流跟踪接口

11. **财务分析缺失**
    - 影响: 经营分析困难
    - 建议: 实施财务报表和BI看板

12. **合同管理缺失**
    - 影响: 合同管理不数字化
    - 建议: 实施电子合同管理

### 按业务领域分类

#### 销售领域
- 报价管理
- 合同管理
- 信用管理
- 价格管理

#### 生产领域
- 生产排期
- 质量检验
- 设备管理
- 工时管理

#### 库存领域
- 成品入库
- 库位管理
- 盘点管理
- 库存预警

#### 交付领域
- 发货管理
- 物流跟踪
- 签收回执
- 验收确认

#### 财务领域
- 成本核算
- 发票管理
- 收款管理
- 应付管理
- 对账结算
- 财务报表

---

## 改进建议路线图

### 第一阶段: 基础完善 (1-2个月)

#### 目标
补齐最核心的缺失功能,确保业务流程完整

#### 实施内容

**1. 成本核算模块**
```
数据模型:
- CostCenter (成本中心)
- CostItem (成本项目)
- ProductionCost (生产成本)
  - material_cost (材料成本)
  - labor_cost (人工成本)
  - equipment_cost (设备成本)
  - overhead_cost (制造费用)

功能:
- 材料成本自动统计(基于物料消耗)
- 人工成本统计(基于工时 × 时薪)
- 设备成本分摊(基于设备使用时间)
- 制造费用分摊(基于分摊规则)
```

**2. 成品库存模块**
```
数据模型:
- ProductStock (成品库存)
  - product (产品)
  - quantity (库存数量)
  - location (库位)
  - batch_no (批次号)
  - work_order (来源施工单)
- StockIn (入库单)
- StockOut (出库单)

功能:
- 施工单完成自动入库
- 发货自动扣减库存
- 库存查询和预警
- 库存盘点
```

**3. 发货管理模块**
```
数据模型:
- DeliveryOrder (发货单)
  - order_number (发货单号)
  - sales_order (销售订单)
  - customer (客户)
  - delivery_date (发货日期)
  - status (状态)
  - logistics_company (物流公司)
  - tracking_number (物流单号)
  - freight (运费)
- DeliveryItem (发货明细)

功能:
- 发货单创建
- 发货单打印
- 物流信息录入
- 发货状态跟踪
```

**4. 发票管理模块**
```
数据模型:
- Invoice (发票)
  - invoice_number (发票号码)
  - invoice_type (发票类型)
  - sales_order (销售订单)
  - customer (客户)
  - amount (金额)
  - tax_amount (税额)
  - issue_date (开票日期)
  - status (状态)

功能:
- 开票申请
- 发票开具
- 发票与订单关联
- 发票记录查询
```

#### 优先级
- P0: 成本核算、成品库存
- P0: 发货管理、发票管理

### 第二阶段: 流程优化 (2-3个月)

#### 目标
优化业务流程,提升效率和控制

#### 实施内容

**1. 报价管理模块**
```
数据模型:
- Quotation (报价单)
  - quotation_number (报价单号)
  - customer (客户)
  - valid_until (有效期)
  - total_amount (报价总额)
  - status (状态)
  - converted_to_order (是否转订单)
- QuotationItem (报价明细)

功能:
- 报价单生成
- 报价审批流程
- 报价转订单
- 报价历史查询
```

**2. 收款管理模块**
```
数据模型:
- Payment (收款记录)
  - payment_number (收款单号)
  - sales_order (销售订单)
  - customer (客户)
  - amount (收款金额)
  - payment_method (收款方式)
  - payment_date (收款日期)
- PaymentPlan (收款计划)

功能:
- 收款记录
- 收款计划
- 催款提醒
- 回款分析
```

**3. 质量检验模块**
```
数据模型:
- QualityInspection (质检单)
  - inspection_number (质检单号)
  - work_order (施工单)
  - inspection_type (质检类型)
  - inspector (质检员)
  - result (检验结果)
  - defects (缺陷记录)
- InspectionItem (检验明细)
- InspectionStandard (检验标准)

功能:
- 质检单创建
- 质检结果录入
- 不合格品处理
- 质检报告生成
```

**4. 对账结算模块**
```
数据模型:
- Statement (对账单)
  - statement_number (对账单号)
  - customer (客户)
  - period (对账周期)
  - total_amount (对账金额)
  - confirmed (是否确认)
- StatementItem (对账明细)

功能:
- 对账单自动生成
- 对账单发送
- 对账确认
- 差异处理
```

#### 优先级
- P1: 报价管理、收款管理
- P1: 质量检验、对账结算

### 第三阶段: 智能化提升 (3-4个月)

#### 目标
引入智能化功能,提升管理水平和决策能力

#### 实施内容

**1. 财务报表模块**
```
报表类型:
- 收入报表(按客户、按产品、按时间)
- 成本报表(按成本项目、按产品)
- 利润分析表(按产品、按客户、按时间)
- 应收账款账龄分析
- 现金流量表
- 成本对比分析

功能:
- 报表自动生成
- 报表导出(Excel、PDF)
- 报表可视化
- 自定义报表
```

**2. 生产排期模块**
```
功能:
- 生产日历视图
- 产能规划
- 资源冲突检测
- 交货期评估
- 排期优化建议
```

**3. 物流跟踪模块**
```
功能:
- 物流公司对接
- 物流状态实时查询
- 物流异常提醒
- 客户物流查询入口
```

**4. 财务分析看板**
```
功能:
- 经营KPI展示
- 收入趋势分析
- 成本趋势分析
- 利润趋势分析
- 客户贡献分析
- 产品盈利能力分析
```

#### 优先级
- P2: 财务报表、生产排期
- P2: 物流跟踪、财务分析

### 第四阶段: 高级功能 (4-6个月)

#### 目标
完善高级功能,实现全面的数字化管理

#### 实施内容

**1. 合同管理模块**
```
功能:
- 合同模板管理
- 合同生成
- 电子签章
- 合同归档
- 合同到期提醒
```

**2. 供应商付款管理**
```
数据模型:
- SupplierPayment (供应商付款)
- PaymentApplication (付款申请)
- PaymentApproval (付款审批)

功能:
- 付款申请
- 付款审批
- 付款记录
- 应付账款分析
```

**3. 设备管理模块**
```
功能:
- 设备档案
- 设备保养计划
- 设备故障记录
- 设备利用率统计
```

**4. 工时管理模块**
```
功能:
- 工时记录
- 工时统计
- 计件工资计算
- 绩效分析
```

---

## 数据模型设计建议

### 成本核算相关模型

```python
# 成本中心
class CostCenter(models.Model):
    """成本中心"""
    name = models.CharField('成本中心名称', max_length=100)
    code = models.CharField('成本中心编码', max_length=50, unique=True)
    type = models.CharField('类型', max_length=20,
                           choices=[('production', '生产'), ('auxiliary', '辅助')])
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

# 成本项目
class CostItem(models.Model):
    """成本项目"""
    name = models.CharField('成本项目名称', max_length=100)
    code = models.CharField('成本项目编码', max_length=50, unique=True)
    type = models.CharField('类型', max_length=20,
                           choices=[('material', '直接材料'), ('labor', '直接人工'),
                                   ('equipment', '设备折旧'), ('overhead', '制造费用')])
    allocation_method = models.CharField('分摊方法', max_length=50)

# 生产成本
class ProductionCost(models.Model):
    """生产成本"""
    work_order = models.OneToOneField(WorkOrder, on_delete=models.CASCADE)
    period = models.CharField('成本核算期', max_length=20)  # 2024-01

    # 成本明细
    material_cost = models.DecimalField('材料成本', max_digits=12, decimal_places=2)
    labor_cost = models.DecimalField('人工成本', max_digits=12, decimal_places=2)
    equipment_cost = models.DecimalField('设备成本', max_digits=12, decimal_places=2)
    overhead_cost = models.DecimalField('制造费用', max_digits=12, decimal_places=2)

    total_cost = models.DecimalField('总成本', max_digits=12, decimal_places=2)

    # 对比分析
    standard_cost = models.DecimalField('标准成本', max_digits=12, decimal_places=2)
    variance = models.DecimalField('成本差异', max_digits=12, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 成品库存相关模型

```python
# 成品库存
class ProductStock(models.Model):
    """成品库存"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.DecimalField('库存数量', max_digits=10, decimal_places=2)
    location = models.CharField('库位', max_length=50, blank=True)
    batch_no = models.CharField('批次号', max_length=50, unique=True)
    work_order = models.ForeignKey(WorkOrder, on_delete=models.SET_NULL, null=True)
    production_date = models.DateField('生产日期')
    expiry_date = models.DateField('有效期', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

# 入库单
class StockIn(models.Model):
    """入库单"""
    order_number = models.CharField('入库单号', max_length=50, unique=True)
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE)
    stock_in_date = models.DateField('入库日期')
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    notes = models.TextField('备注', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

# 出库单
class StockOut(models.Model):
    """出库单"""
    order_number = models.CharField('出库单号', max_length=50, unique=True)
    delivery_order = models.ForeignKey('DeliveryOrder', on_delete=models.CASCADE)
    stock_out_date = models.DateField('出库日期')
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    notes = models.TextField('备注', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 发货管理相关模型

```python
# 发货单
class DeliveryOrder(models.Model):
    """发货单"""
    STATUS_CHOICES = [
        ('pending', '待发货'),
        ('shipped', '已发货'),
        ('received', '已签收'),
        ('rejected', '拒收'),
        ('returned', '已退货'),
    ]

    order_number = models.CharField('发货单号', max_length=50, unique=True)
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT)
    delivery_date = models.DateField('发货日期')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')

    # 收货信息
    receiver_name = models.CharField('收货人', max_length=100)
    receiver_phone = models.CharField('联系电话', max_length=50)
    delivery_address = models.TextField('送货地址')

    # 物流信息
    logistics_company = models.CharField('物流公司', max_length=100, blank=True)
    tracking_number = models.CharField('物流单号', max_length=100, blank=True)
    freight = models.DecimalField('运费', max_digits=10, decimal_places=2, default=0)

    # 签收信息
    received_date = models.DateTimeField('签收时间', null=True, blank=True)
    receiver_signature = models.ImageField('签收照片', upload_to='signatures/', null=True, blank=True)
    received_notes = models.TextField('签收备注', blank=True)

    notes = models.TextField('备注', blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 发票管理相关模型

```python
# 发票
class Invoice(models.Model):
    """发票"""
    TYPE_CHOICES = [
        ('vat_special', '增值税专用发票'),
        ('vat_normal', '增值税普通发票'),
        ('electronic', '电子发票'),
    ]

    STATUS_CHOICES = [
        ('draft', '待开具'),
        ('issued', '已开具'),
        ('sent', '已发送'),
        ('received', '已收到'),
        ('cancelled', '已作废'),
        ('refunded', '已红冲'),
    ]

    invoice_number = models.CharField('发票号码', max_length=50, unique=True)
    invoice_code = models.CharField('发票代码', max_length=50, blank=True)
    invoice_type = models.CharField('发票类型', max_length=20, choices=TYPE_CHOICES)

    # 关联信息
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.SET_NULL, null=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT)

    # 金额信息
    amount = models.DecimalField('金额', max_digits=12, decimal_places=2)
    tax_rate = models.DecimalField('税率', max_digits=5, decimal_places=2)
    tax_amount = models.DecimalField('税额', max_digits=12, decimal_places=2)
    total_amount = models.DecimalField('价税合计', max_digits=12, decimal_places=2)

    # 开票信息
    issue_date = models.DateField('开票日期')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='draft')

    # 客户开票信息
    customer_tax_number = models.CharField('客户税号', max_length=50)
    customer_address = models.TextField('客户地址')
    customer_phone = models.CharField('客户电话', max_length=50)
    customer_bank = models.CharField('开户行', max_length=100)
    customer_account = models.CharField('账号', max_length=50)

    notes = models.TextField('备注', blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 收款管理相关模型

```python
# 收款记录
class Payment(models.Model):
    """收款记录"""
    METHOD_CHOICES = [
        ('cash', '现金'),
        ('transfer', '转账'),
        ('check', '支票'),
        ('acceptance', '承兑汇票'),
    ]

    payment_number = models.CharField('收款单号', max_length=50, unique=True)
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.SET_NULL, null=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT)

    amount = models.DecimalField('收款金额', max_digits=12, decimal_places=2)
    payment_method = models.CharField('收款方式', max_length=20, choices=METHOD_CHOICES)
    payment_date = models.DateField('收款日期')

    # 银行信息
    bank_account = models.CharField('收款账户', max_length=50, blank=True)
    transaction_number = models.CharField('交易流水号', max_length=100, blank=True)

    # 核销信息
    applied_amount = models.DecimalField('核销金额', max_digits=12, decimal_places=2)
    remaining_amount = models.DecimalField('剩余金额', max_digits=12, decimal_places=2)

    notes = models.TextField('备注', blank=True)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

# 收款计划
class PaymentPlan(models.Model):
    """收款计划"""
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name='payment_plans')
    plan_amount = models.DecimalField('计划金额', max_digits=12, decimal_places=2)
    plan_date = models.DateField('计划收款日期')
    status = models.CharField('状态', max_length=20,
                             choices=[('pending', '待收款'), ('partial', '部分收款'), ('completed', '已完成')],
                             default='pending')
    paid_amount = models.DecimalField('已收金额', max_digits=12, decimal_places=2, default=0)
    notes = models.TextField('备注', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## 技术实现建议

### 后端实现要点

1. **数据库迁移**
   - 新增模型创建迁移文件
   - 数据迁移脚本(初始化成本中心、成本项目等基础数据)
   - 索引优化(财务相关字段添加索引)

2. **API设计**
   - 遵循RESTful规范
   - 使用合适的序列化器
   - 添加权限控制
   - 添加操作日志

3. **业务逻辑**
   - 成本自动核算(施工单完成时)
   - 发货单创建时自动扣减库存
   - 收款时自动更新订单付款状态
   - 发票开具时自动关联订单

### 前端实现要点

1. **页面组件**
   - 财务管理菜单(成本、发票、收款、对账)
   - 发货管理菜单(发货单、物流跟踪)
   - 库存管理菜单(成品入库、库存查询、盘点)
   - 质量管理菜单(质检单、质检报告)

2. **报表功能**
   - 使用ECharts实现数据可视化
   - 支持报表导出(Excel、PDF)
   - 支持自定义报表查询条件

3. **用户体验**
   - 表单验证(金额、日期等)
   - 数据自动计算
   - 提示和引导
   - 移动端适配

### 系统集成

1. **财务软件集成**
   - 预留财务软件对接接口
   - 数据格式标准化

2. **物流API集成**
   - 对接主流物流公司API
   - 实现物流状态自动更新

3. **电子发票集成**
   - 对接税务局电子发票平台
   - 实现发票自动开具

---

## 附录

### A. 完整业务流程图(理想状态)

```
客户询价
  ↓
[报价管理] 生成报价单 → 报价审批 → 发送给客户
  ↓
客户确认
  ↓
[合同管理] 生成合同 → 电子签章 → 合同归档
  ↓
[销售订单] 创建订单 → 信用检查 → 订单审批 → 确认订单
  ↓
[施工单] 创建施工单 → 配置工序 → 关联资产 → 审核通过
  ↓
[生产计划] 生产排期 → 产能规划 → 物料准备
  ↓
[生产执行]
  ├─ CTP制版
  ├─ CUT开料
  ├─ PRT印刷
  ├─ 后加工
  └─ PACK包装
  ↓
[质量检验] 质检单 → 检验 → 质检报告 → 不合格品处理
  ↓
[成品入库] 入库单 → 库位分配 → 库存更新
  ↓
[发货管理] 发货单 → 物流安排 → 物流跟踪 → 客户签收
  ↓
[财务结算]
  ├─ 成本核算 → 材料成本 + 人工成本 + 制造费用
  ├─ 开票申请 → 发票开具 → 发票发送
  ├─ 收款管理 → 收款记录 → 回款跟踪
  └─ 对账结算 → 对账单 → 对账确认 → 账期管理
  ↓
[财务报表] 收入分析、成本分析、利润分析
```

### B. 数据模型关系图(新增部分)

```
SalesOrder (销售订单)
  ├── Quotation (报价单) [新增]
  ├── Contract (合同) [新增]
  ├── PaymentPlan (收款计划) [新增]
  ├── Payment (收款记录) [新增]
  ├── Invoice (发票) [新增]
  ├── DeliveryOrder (发货单) [新增]
  └── WorkOrder (施工单) [已有]
        ├── ProductionCost (生产成本) [新增]
        ├── QualityInspection (质检单) [新增]
        └── ProductStock (成品库存) [新增]
              ├── StockIn (入库单) [新增]
              └── StockOut (出库单) [新增]
```

### C. 菜单结构建议(新增部分)

```
销售管理
  ├─ 报价管理 [新增]
  ├─ 合同管理 [新增]
  ├─ 销售订单 [已有]
  └─ 客户管理 [已有]

生产管理
  ├─ 施工单管理 [已有]
  ├─ 任务管理 [已有]
  ├─ 质量检验 [新增]
  └─ 生产排期 [新增]

库存管理
  ├─ 物料管理 [已有]
  ├─ 成品库存 [新增]
  ├─ 入库管理 [新增]
  └─ 出库管理 [新增]

发货管理
  ├─ 发货单 [新增]
  └─ 物流跟踪 [新增]

财务管理
  ├─ 成本核算 [新增]
  ├─ 发票管理 [新增]
  ├─ 收款管理 [新增]
  ├─ 付款管理 [新增]
  ├─ 对账结算 [新增]
  └─ 财务报表 [新增]
```

### D. 关键指标(KPI)建议

**销售指标**
- 报价转化率
- 订单增长率
- 客户ARPU值
- 回款率

**生产指标**
- 生产完成率
- 一次合格率
- 生产周期
- 设备利用率

**库存指标**
- 库存周转率
- 库存准确率
- 呆滞库存占比

**财务指标**
- 毛利率
- 净利率
- 应收账款周转天数
- 现金流

---

## 结论

本系统在**施工生产管理**方面功能完善,但在**客户下单**和**财务统计**两端存在明显缺失。建议按照四个阶段逐步完善:

1. **第一阶段(1-2个月)**: 补齐成本核算、成品库存、发货管理、发票管理
2. **第二阶段(2-3个月)**: 完善报价、收款、质检、对账功能
3. **第三阶段(3-4个月)**: 实施财务报表、生产排期、物流跟踪、财务分析
4. **第四阶段(4-6个月)**: 完善合同管理、供应商付款、设备管理、工时管理

通过以上改进,系统将实现从客户下单到财务统计的全流程闭环管理,大幅提升企业数字化管理水平。

---

**文档结束**

**版权声明**: 本文档为印刷施工单跟踪系统内部文档,未经授权不得外传
