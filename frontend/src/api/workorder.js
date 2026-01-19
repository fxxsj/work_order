import request from './index'

// 客户管理
export const customerAPI = {
  // 获取客户列表
  getList(params) {
    return request({
      url: '/customers/',
      method: 'get',
      params
    })
  },
  // 获取客户详情
  getDetail(id) {
    return request({
      url: `/customers/${id}/`,
      method: 'get'
    })
  },
  // 创建客户
  create(data) {
    return request({
      url: '/customers/',
      method: 'post',
      data
    })
  },
  // 更新客户
  update(id, data) {
    return request({
      url: `/customers/${id}/`,
      method: 'put',
      data
    })
  },
  // 删除客户
  delete(id) {
    return request({
      url: `/customers/${id}/`,
      method: 'delete'
    })
  }
}

// 部门管理
export const departmentAPI = {
  getList(params) {
    return request({
      url: '/departments/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/departments/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/departments/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/departments/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/departments/${id}/`,
      method: 'delete'
    })
  }
}

// 工序管理
export const processAPI = {
  getList(params) {
    return request({
      url: '/processes/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/processes/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/processes/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/processes/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/processes/${id}/`,
      method: 'delete'
    })
  }
}

// 产品管理
export const productAPI = {
  getList(params) {
    return request({
      url: '/products/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/products/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/products/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/products/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/products/${id}/`,
      method: 'delete'
    })
  }
}

// 产品物料管理
export const productMaterialAPI = {
  getList(params) {
    return request({
      url: '/product-materials/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/product-materials/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/product-materials/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/product-materials/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/product-materials/${id}/`,
      method: 'delete'
    })
  }
}

// 物料管理
export const materialAPI = {
  getList(params) {
    return request({
      url: '/materials/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/materials/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/materials/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/materials/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/materials/${id}/`,
      method: 'delete'
    })
  }
}

// 施工单管理
export const workOrderAPI = {
  // 获取施工单列表
  getList(params) {
    return request({
      url: '/workorders/',
      method: 'get',
      params
    })
  },
  // 获取施工单详情
  getDetail(id) {
    return request({
      url: `/workorders/${id}/`,
      method: 'get'
    })
  },
  // 创建施工单
  create(data) {
    return request({
      url: '/workorders/',
      method: 'post',
      data
    })
  },
  // 更新施工单
  update(id, data) {
    return request({
      url: `/workorders/${id}/`,
      method: 'put',
      data
    })
  },
  // 删除施工单
  delete(id) {
    return request({
      url: `/workorders/${id}/`,
      method: 'delete'
    })
  },
  // 添加工序
  addProcess(id, data) {
    return request({
      url: `/workorders/${id}/add_process/`,
      method: 'post',
      data
    })
  },
  // 添加物料
  addMaterial(id, data) {
    return request({
      url: `/workorders/${id}/add_material/`,
      method: 'post',
      data
    })
  },
  // 业务员审核施工单
  approve(id, data) {
    return request({
      url: `/workorders/${id}/approve/`,
      method: 'post',
      data
    })
  },
  // 重新提交审核（审核拒绝后使用）
  resubmitForApproval(id) {
    return request({
      url: `/workorders/${id}/resubmit_for_approval/`,
      method: 'post'
    })
  },
  // 请求重新审核（审核通过后发现错误需要修改）
  requestReapproval(id, data) {
    return request({
      url: `/workorders/${id}/request_reapproval/`,
      method: 'post',
      data
    })
  },
  // 更新状态
  updateStatus(id, status) {
    return request({
      url: `/workorders/${id}/update_status/`,
      method: 'post',
      data: { status }
    })
  },
  // 获取统计数据
  getStatistics(params) {
    return request({
      url: '/workorders/statistics/',
      method: 'get',
      params
    })
  },
  // 导出施工单列表
  export(params) {
    return request({
      url: '/workorders/export/',
      method: 'get',
      params,
      responseType: 'blob'
    })
  }
}

// 施工单工序管理
export const workOrderProcessAPI = {
  getList(params) {
    return request({
      url: '/workorder-processes/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/workorder-processes/${id}/`,
      method: 'get'
    })
  },
  update(id, data) {
    return request({
      url: `/workorder-processes/${id}/`,
      method: 'patch',
      data
    })
  },
  delete(id) {
    return request({
      url: `/workorder-processes/${id}/`,
      method: 'delete'
    })
  },
  // 开始工序（生成任务）
  start(id, data = {}) {
    return request({
      url: `/workorder-processes/${id}/start/`,
      method: 'post',
      data
    })
  },
  // 完成工序
  complete(id, data) {
    return request({
      url: `/workorder-processes/${id}/complete/`,
      method: 'post',
      data
    })
  },
  // 添加日志
  addLog(id, content) {
    return request({
      url: `/workorder-processes/${id}/add_log/`,
      method: 'post',
      data: { content }
    })
  },
  // 批量重新分派工序的所有任务
  reassign_tasks(id, data) {
    return request({
      url: `/workorder-processes/${id}/reassign_tasks/`,
      method: 'post',
      data
    })
  }
}

// 施工单物料管理
// 施工单任务管理
// 产品组管理
export const product-groupAPI = {
  getList(params) {
    return request({
      url: '/product-groups/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/product-groups/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/product-groups/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/product-groups/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/product-groups/${id}/`,
      method: 'delete'
    })
  }
}

// 产品组子项管理
export const product-groupItemAPI = {
  getList(params) {
    return request({
      url: '/product-group-items/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/product-group-items/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/product-group-items/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/product-group-items/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/product-group-items/${id}/`,
      method: 'delete'
    })
  }
}

// 施工单产品管理
export const workOrderProductAPI = {
  getList(params) {
    return request({
      url: '/workorder-products/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/workorder-products/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/workorder-products/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/workorder-products/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/workorder-products/${id}/`,
      method: 'delete'
    })
  }
}

// 通知管理
export const notificationAPI = {
  // 获取通知列表
  getList(params) {
    return request({
      url: '/notifications/',
      method: 'get',
      params
    })
  },
  // 获取未读通知数量
  getUnreadCount() {
    return request({
      url: '/notifications/unread_count/',
      method: 'get'
    })
  },
  // 标记通知为已读
  markRead(id) {
    return request({
      url: `/notifications/${id}/mark_read/`,
      method: 'post'
    })
  },
  // 标记所有通知为已读
  markAllRead() {
    return request({
      url: '/notifications/mark_all_read/',
      method: 'post'
    })
  }
}

export const workOrderTaskAPI = {
  getList(params) {
    return request({
      url: '/workorder-tasks/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/workorder-tasks/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/workorder-tasks/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/workorder-tasks/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/workorder-tasks/${id}/`,
      method: 'delete'
    })
  },
  // 完成任务（支持设计图稿任务时选择图稿）
  complete(id, data) {
    return request({
      url: `/workorder-tasks/${id}/complete/`,
      method: 'post',
      data
    })
  },
  update_quantity(id, data) {
    return request({
      url: `/workorder-tasks/${id}/update_quantity/`,
      method: 'post',
      data
    })
  },
  // 分派任务（调整分派）
  assign(id, data) {
    return request({
      url: `/workorder-tasks/${id}/assign/`,
      method: 'post',
      data
    })
  },
  // 拆分任务（多人协作）
  split(id, data) {
    return request({
      url: `/workorder-tasks/${id}/split/`,
      method: 'post',
      data
    })
  },
  // 协作统计
  getCollaborationStats(params) {
    return request({
      url: '/workorder-tasks/collaboration_stats/',
      method: 'get',
      params
    })
  },
  // 分派历史查询
  getAssignmentHistory(params) {
    return request({
      url: '/workorder-tasks/assignment_history/',
      method: 'get',
      params
    })
  },
  // 导出任务列表
  export(params) {
    return request({
      url: '/workorder-tasks/export/',
      method: 'get',
      params,
      responseType: 'blob'
    })
  }
}

export const workOrderMaterialAPI = {
  getList(params) {
    return request({
      url: '/workorder-materials/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/workorder-materials/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/workorder-materials/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/workorder-materials/${id}/`,
      method: 'patch',
      data
    })
  },
  delete(id) {
    return request({
      url: `/workorder-materials/${id}/`,
      method: 'delete'
    })
  }
}

// 工序日志
export const processLogAPI = {
  getList(params) {
    return request({
      url: '/process-logs/',
      method: 'get',
      params
    })
  }
}

// 图稿管理
export const artworkAPI = {
  getList(params) {
    return request({
      url: '/artworks/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/artworks/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/artworks/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/artworks/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/artworks/${id}/`,
      method: 'delete'
    })
  },
  // 创建新版本
  createVersion(id) {
    return request({
      url: `/artworks/${id}/create_version/`,
      method: 'post'
    })
  },
  // 确认图稿
  confirm(id) {
    return request({
      url: `/artworks/${id}/confirm/`,
      method: 'post'
    })
  }
}

// 图稿产品管理
export const artworkProductAPI = {
  getList(params) {
    return request({
      url: '/artwork-products/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/artwork-products/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/artwork-products/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/artwork-products/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/artwork-products/${id}/`,
      method: 'delete'
    })
  }
}

// 刀模管理
export const dieAPI = {
  getList(params) {
    return request({
      url: '/dies/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/dies/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/dies/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/dies/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/dies/${id}/`,
      method: 'delete'
    })
  },
  // 确认刀模
  confirm(id) {
    return request({
      url: `/dies/${id}/confirm/`,
      method: 'post'
    })
  }
}

// 刀模产品管理
export const dieProductAPI = {
  getList(params) {
    return request({
      url: '/die-products/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/die-products/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/die-products/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/die-products/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/die-products/${id}/`,
      method: 'delete'
    })
  }
}

// 烫金版管理
export const foilingPlateAPI = {
  getList(params) {
    return request({
      url: '/foiling-plates/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/foiling-plates/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/foiling-plates/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/foiling-plates/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/foiling-plates/${id}/`,
      method: 'delete'
    })
  },
  // 确认烫金版
  confirm(id) {
    return request({
      url: `/foiling-plates/${id}/confirm/`,
      method: 'post'
    })
  }
}

// 烫金版产品管理
export const foilingPlateProductAPI = {
  getList(params) {
    return request({
      url: '/foiling-plate-products/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/foiling-plate-products/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/foiling-plate-products/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/foiling-plate-products/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/foiling-plate-products/${id}/`,
      method: 'delete'
    })
  }
}

// 压凸版管理
export const embossingPlateAPI = {
  getList(params) {
    return request({
      url: '/embossing-plates/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/embossing-plates/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/embossing-plates/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/embossing-plates/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/embossing-plates/${id}/`,
      method: 'delete'
    })
  },
  // 确认压凸版
  confirm(id) {
    return request({
      url: `/embossing-plates/${id}/confirm/`,
      method: 'post'
    })
  }
}

// 压凸版产品管理
// 任务分派规则管理
export const taskAssignmentRuleAPI = {
  getList(params) {
    return request({
      url: '/task-assignment-rules/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/task-assignment-rules/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/task-assignment-rules/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/task-assignment-rules/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/task-assignment-rules/${id}/`,
      method: 'delete'
    })
  }
}

export const embossingPlateProductAPI = {
  getList(params) {
    return request({
      url: '/embossing-plate-products/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/embossing-plate-products/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/embossing-plate-products/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/embossing-plate-products/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/embossing-plate-products/${id}/`,
      method: 'delete'
    })
  }
}

