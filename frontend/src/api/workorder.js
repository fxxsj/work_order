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

// 工序分类管理
export const processCategoryAPI = {
  getList(params) {
    return request({
      url: '/process-categories/',
      method: 'get',
      params
    })
  },
  getDetail(id) {
    return request({
      url: `/process-categories/${id}/`,
      method: 'get'
    })
  },
  create(data) {
    return request({
      url: '/process-categories/',
      method: 'post',
      data
    })
  },
  update(id, data) {
    return request({
      url: `/process-categories/${id}/`,
      method: 'put',
      data
    })
  },
  delete(id) {
    return request({
      url: `/process-categories/${id}/`,
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
  // 开始工序
  start(id) {
    return request({
      url: `/workorder-processes/${id}/start/`,
      method: 'post'
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
  }
}

// 施工单物料管理
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

