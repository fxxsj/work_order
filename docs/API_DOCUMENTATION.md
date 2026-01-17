# API 文档 - 印刷施工单跟踪系统

> 版本：v2.0.0  
> 更新时间：2026-01-17  
> 基础URL：`http://localhost:8000/api/v1/`

## 📋 目录

- [认证系统](#认证系统)
- [施工单管理](#施工单管理)
- [任务管理](#任务管理)
- [客户管理](#客户管理)
- [产品管理](#产品管理)
- [物料管理](#物料管理)
- [部门管理](#部门管理)
- [用户管理](#用户管理)
- [错误码说明](#错误码说明)

## 🔐 认证系统

### JWT Token 认证

所有API请求（除登录外）都需要在请求头中包含JWT Token：

```
Authorization: Bearer <your-jwt-token>
```

### 登录

**POST** `/auth/login/`

**请求参数：**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "first_name": "管理员",
      "last_name": "",
      "is_staff": true,
      "departments": [
        {
          "id": 1,
          "name": "生产部",
          "code": "PROD"
        }
      ],
      "permissions": [
        "workorder.add_workorder",
        "workorder.change_workorder"
      ]
    }
  }
}
```

### 刷新Token

**POST** `/auth/refresh/`

**请求头：**
```
Authorization: Bearer <refresh-token>
```

**响应示例：**
```json
{
  "code": 200,
  "message": "Token刷新成功",
  "data": {
    "token": "new-jwt-token"
  }
}
```

### 登出

**POST** `/auth/logout/`

**请求头：**
```
Authorization: Bearer <jwt-token>
```

**响应示例：**
```json
{
  "code": 200,
  "message": "登出成功"
}
```

## 📋 施工单管理

### 获取施工单列表

**GET** `/workorders/`

**查询参数：**
- `page` (int): 页码，默认1
- `page_size` (int): 每页数量，默认20
- `status` (string): 状态筛选
- `customer` (int): 客户ID筛选
- `department` (int): 部门ID筛选
- `search` (string): 搜索关键词
- `ordering` (string): 排序字段
- `start_date` (string): 开始日期 (YYYY-MM-DD)
- `end_date` (string): 结束日期 (YYYY-MM-DD)

**响应示例：**
```json
{
  "count": 150,
  "next": "http://localhost:8000/api/v1/workorders/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "order_number": "WO20260117001",
      "customer": {
        "id": 1,
        "name": "ABC印刷公司",
        "contact_person": "张三"
      },
      "status": "pending",
      "priority": "normal",
      "order_date": "2026-01-17",
      "delivery_date": "2026-01-25",
      "created_by": {
        "id": 1,
        "username": "admin",
        "first_name": "管理员"
      },
      "created_at": "2026-01-17T10:30:00Z",
      "updated_at": "2026-01-17T10:30:00Z",
      "total_quantity": 1000,
      "completed_quantity": 200,
      "progress_percentage": 20.0,
      "is_approved": false,
      "approval_notes": ""
    }
  ]
}
```

### 创建施工单

**POST** `/workorders/`

**请求参数：**
```json
{
  "order_number": "WO20260117002",
  "customer": 1,
  "status": "pending",
  "priority": "normal",
  "order_date": "2026-01-17",
  "delivery_date": "2026-01-25",
  "notes": "特殊要求：使用环保油墨",
  "products": [
    {
      "product": 1,
      "quantity": 500,
      "unit_price": 10.50,
      "notes": "封面印刷"
    }
  ],
  "processes": [
    {
      "process": 1,
      "assigned_to": 2,
      "planned_start_date": "2026-01-18",
      "planned_end_date": "2026-01-20"
    }
  ]
}
```

**响应示例：**
```json
{
  "id": 2,
  "order_number": "WO20260117002",
  "customer": {
    "id": 1,
    "name": "ABC印刷公司"
  },
  "status": "pending",
  "priority": "normal",
  "created_at": "2026-01-17T10:35:00Z"
}
```

### 获取施工单详情

**GET** `/workorders/{id}/`

**响应示例：**
```json
{
  "id": 1,
  "order_number": "WO20260117001",
  "customer": {
    "id": 1,
    "name": "ABC印刷公司",
    "contact_person": "张三",
    "phone": "13800138000",
    "email": "contact@abc.com"
  },
  "status": "in_progress",
  "priority": "normal",
  "order_date": "2026-01-17",
  "delivery_date": "2026-01-25",
  "notes": "特殊要求：使用环保油墨",
  "created_by": {
    "id": 1,
    "username": "admin",
    "first_name": "管理员"
  },
  "products": [
    {
      "id": 1,
      "product": {
        "id": 1,
        "name": "宣传册",
        "specification": "A4，铜版纸",
        "unit": "本"
      },
      "quantity": 1000,
      "unit_price": 15.80,
      "total_price": 15800.00,
      "completed_quantity": 200,
      "defective_quantity": 5,
      "notes": "封面烫金"
    }
  ],
  "processes": [
    {
      "id": 1,
      "process": {
        "id": 1,
        "name": "设计",
        "code": "DESIGN",
        "department": {
          "id": 1,
          "name": "设计部"
        }
      },
      "assigned_to": {
        "id": 3,
        "username": "designer01",
        "first_name": "设计师"
      },
      "status": "completed",
      "planned_start_date": "2026-01-17",
      "planned_end_date": "2026-01-18",
      "actual_start_date": "2026-01-17T09:00:00Z",
      "actual_end_date": "2026-01-17T17:00:00Z",
      "notes": "已完成设计稿"
    }
  ],
  "attachments": [
    {
      "id": 1,
      "filename": "design_draft.pdf",
      "file_path": "/media/workorders/1/design_draft.pdf",
      "file_size": 2048576,
      "uploaded_by": {
        "id": 3,
        "username": "designer01"
      },
      "uploaded_at": "2026-01-17T16:30:00Z"
    }
  ],
  "created_at": "2026-01-17T10:30:00Z",
  "updated_at": "2026-01-17T16:30:00Z"
}
```

### 更新施工单

**PUT** `/workorders/{id}/`

**PATCH** `/workorders/{id}/`

**请求参数：**
```json
{
  "status": "in_progress",
  "notes": "已开始生产",
  "delivery_date": "2026-01-26"
}
```

### 删除施工单

**DELETE** `/workorders/{id}/`

**响应：**
```
HTTP 204 No Content
```

### 审批施工单

**POST** `/workorders/{id}/approve/`

**请求参数：**
```json
{
  "approved": true,
  "approval_notes": "审批通过，可以开始生产"
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "施工单审批成功",
  "data": {
    "id": 1,
    "is_approved": true,
    "approved_by": {
      "id": 1,
      "username": "admin",
      "first_name": "管理员"
    },
    "approved_at": "2026-01-17T11:00:00Z",
    "approval_notes": "审批通过，可以开始生产"
  }
}
```

## 📝 任务管理

### 获取任务列表

**GET** `/tasks/`

**查询参数：**
- `workorder` (int): 施工单ID
- `assigned_to` (int): 分配给用户ID
- `status` (string): 任务状态
- `process` (int): 工序ID
- `department` (int): 部门ID
- `start_date` (string): 开始日期
- `end_date` (string): 结束日期

**响应示例：**
```json
{
  "count": 85,
  "results": [
    {
      "id": 1,
      "workorder": {
        "id": 1,
        "order_number": "WO20260117001"
      },
      "process": {
        "id": 1,
        "name": "设计",
        "code": "DESIGN"
      },
      "assigned_to": {
        "id": 3,
        "username": "designer01",
        "first_name": "设计师"
      },
      "status": "completed",
      "priority": "normal",
      "planned_start_date": "2026-01-17",
      "planned_end_date": "2026-01-18",
      "actual_start_date": "2026-01-17T09:00:00Z",
      "actual_end_date": "2026-01-17T17:00:00Z",
      "planned_quantity": 1000,
      "completed_quantity": 1000,
      "defective_quantity": 0,
      "progress_percentage": 100.0,
      "notes": "设计稿已完成"
    }
  ]
}
```

### 创建任务

**POST** `/tasks/`

**请求参数：**
```json
{
  "workorder": 1,
  "process": 2,
  "assigned_to": 4,
  "planned_start_date": "2026-01-19",
  "planned_end_date": "2026-01-21",
  "planned_quantity": 1000,
  "notes": "印刷工序"
}
```

### 更新任务状态

**POST** `/tasks/{id}/update_status/`

**请求参数：**
```json
{
  "status": "in_progress",
  "actual_start_date": "2026-01-19T08:30:00Z",
  "notes": "开始印刷"
}
```

### 完成任务

**POST** `/tasks/{id}/complete/`

**请求参数：**
```json
{
  "completed_quantity": 950,
  "defective_quantity": 50,
  "actual_end_date": "2026-01-20T17:00:00Z",
  "notes": "印刷完成，有50张次品"
}
```

### 分配任务

**POST** `/tasks/{id}/assign/`

**请求参数：**
```json
{
  "assigned_to": 5,
  "notes": "重新分配给操作员B"
}
```

## 👥 客户管理

### 获取客户列表

**GET** `/customers/`

**查询参数：**
- `search` (string): 搜索关键词（客户名称、联系人）
- `is_active` (bool): 是否激活

**响应示例：**
```json
{
  "count": 45,
  "results": [
    {
      "id": 1,
      "name": "ABC印刷公司",
      "contact_person": "张三",
      "phone": "13800138000",
      "email": "contact@abc.com",
      "address": "北京市朝阳区xxx街道xxx号",
      "is_active": true,
      "total_orders": 15,
      "total_amount": 150000.00,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### 创建客户

**POST** `/customers/`

**请求参数：**
```json
{
  "name": "XYZ印刷厂",
  "contact_person": "李四",
  "phone": "13900139000",
  "email": "contact@xyz.com",
  "address": "上海市浦东新区xxx路xxx号",
  "notes": "长期合作伙伴"
}
```

## 📦 产品管理

### 获取产品列表

**GET** `/products/`

**查询参数：**
- `category` (int): 产品分类ID
- `is_active` (bool): 是否激活
- `search` (string): 搜索关键词

**响应示例：**
```json
{
  "count": 120,
  "results": [
    {
      "id": 1,
      "name": "宣传册",
      "code": "BROCHURE",
      "specification": "A4，铜版纸，封面157g，内页128g",
      "unit": "本",
      "category": {
        "id": 1,
        "name": "印刷品"
      },
      "base_price": 15.80,
      "is_active": true,
      "stock_quantity": 500,
      "low_stock_threshold": 100,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### 创建产品

**POST** `/products/`

**请求参数：**
```json
{
  "name": "名片",
  "code": "BUSINESS_CARD",
  "specification": "90mm×54mm，300g铜版纸",
  "unit": "盒",
  "category": 1,
  "base_price": 2.50,
  "stock_quantity": 1000,
  "low_stock_threshold": 200
}
```

## 🏭 物料管理

### 获取物料列表

**GET** `/materials/`

**查询参数：**
- `category` (int): 物料分类ID
- `is_active` (bool): 是否激活
- `low_stock` (bool): 仅显示库存不足

**响应示例：**
```json
{
  "count": 68,
  "results": [
    {
      "id": 1,
      "name": "铜版纸",
      "code": "COATED_PAPER_128G",
      "specification": "128g/m²",
      "unit": "张",
      "category": {
        "id": 1,
        "name": "纸张"
      },
      "current_stock": 5000,
      "low_stock_threshold": 1000,
      "unit_price": 0.80,
      "supplier": {
        "id": 1,
        "name": "纸张供应商A"
      },
      "is_active": true,
      "last_updated": "2026-01-17T09:00:00Z"
    }
  ]
}
```

### 更新库存

**POST** `/materials/{id}/update_stock/`

**请求参数：**
```json
{
  "quantity": 1000,
  "operation": "add",
  "notes": "新采购入库"
}
```

## 🏢 部门管理

### 获取部门列表

**GET** `/departments/`

**响应示例：**
```json
{
  "count": 11,
  "results": [
    {
      "id": 1,
      "name": "生产部",
      "code": "PROD",
      "parent": null,
      "manager": {
        "id": 2,
        "username": "prod_manager",
        "first_name": "生产经理"
      },
      "description": "负责生产计划执行",
      "is_active": true,
      "processes": [
        {
          "id": 1,
          "name": "印刷",
          "code": "PRINTING"
        },
        {
          "id": 2,
          "name": "装订",
          "code": "BINDING"
        }
      ],
      "member_count": 15
    }
  ]
}
```

## 👤 用户管理

### 获取用户列表

**GET** `/users/`

**查询参数：**
- `department` (int): 部门ID
- `is_active` (bool): 是否激活
- `is_staff` (bool): 是否员工

**响应示例：**
```json
{
  "count": 25,
  "results": [
    {
      "id": 1,
      "username": "admin",
      "first_name": "系统",
      "last_name": "管理员",
      "email": "admin@example.com",
      "is_staff": true,
      "is_active": true,
      "departments": [
        {
          "id": 1,
          "name": "管理部"
        }
      ],
      "user_permissions": [
        "workorder.add_workorder",
        "workorder.change_workorder"
      ],
      "last_login": "2026-01-17T08:30:00Z"
    }
  ]
}
```

## 📊 统计数据

### 获取仪表板数据

**GET** `/dashboard/stats/`

**响应示例：**
```json
{
  "workorder_stats": {
    "total": 150,
    "pending": 15,
    "in_progress": 85,
    "completed": 45,
    "overdue": 5
  },
  "task_stats": {
    "total": 520,
    "pending": 80,
    "in_progress": 200,
    "completed": 240
  },
  "production_stats": {
    "total_quantity": 150000,
    "completed_quantity": 85000,
    "defective_quantity": 1500,
    "completion_rate": 56.7
  },
  "recent_activities": [
    {
      "type": "workorder_created",
      "workorder_number": "WO20260117003",
      "user": "admin",
      "timestamp": "2026-01-17T10:00:00Z"
    }
  ]
}
```

## ❌ 错误码说明

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 204 | 删除成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 业务错误码

| 错误码 | 说明 | 示例 |
|--------|------|------|
| 1001 | 参数验证失败 | `"field": "This field is required."` |
| 1002 | 资源不存在 | `"detail": "Not found."` |
| 1003 | 权限不足 | `"detail": "You do not have permission to perform this action."` |
| 1004 | 业务规则错误 | `"detail": "施工单状态不允许此操作"` |
| 1005 | 库存不足 | `"detail": "物料库存不足"` |
| 1006 | 重复操作 | `"detail": "该操作已完成"` |

### 错误响应格式

```json
{
  "code": 400,
  "message": "请求参数错误",
  "errors": {
    "order_number": [
      "施工单号已存在"
    ],
    "customer": [
      "客户不能为空"
    ]
  },
  "timestamp": "2026-01-17T10:30:00Z"
}
```

## 🔧 API使用指南

### 请求格式

- Content-Type: `application/json`
- 认证: `Authorization: Bearer <token>`
- 字符编码: UTF-8

### 分页格式

```json
{
  "count": 150,
  "next": "http://localhost:8000/api/v1/workorders/?page=2",
  "previous": null,
  "results": [...]
}
```

### 日期时间格式

- 日期: `YYYY-MM-DD`
- 日期时间: `YYYY-MM-DDTHH:MM:SSZ` (ISO 8601)

### 搜索功能

大部分列表接口支持搜索功能，使用`search`参数：
```
GET /api/v1/workorders/?search=ABC
```

### 排序功能

使用`ordering`参数进行排序：
```
GET /api/v1/workorders/?ordering=-created_at
```

前缀`-`表示降序排列。

### 批量操作

部分接口支持批量操作：
```
POST /api/v1/tasks/bulk_complete/
{
  "task_ids": [1, 2, 3],
  "notes": "批量完成"
}
```

## 📝 开发工具

### Postman集合

提供了完整的Postman集合文件，包含所有API接口的示例请求。

### API文档

在线API文档地址：`http://localhost:8000/api/docs/`

### OpenAPI规范

完整的OpenAPI 3.0规范文件：`http://localhost:8000/api/openapi.json`

---

**文档版本：** v2.0.0  
**更新时间：** 2026-01-17  
**维护团队：** 开发团队  
**联系方式：** dev-team@company.com