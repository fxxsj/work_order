/**
 * User Module - 用户模块
 * 管理用户信息和认证状态
 */

import { login } from '@/api/auth'
import { permissionService } from '@/services'

// 初始状态
const state = {
  currentUser: null,
  isAuthenticated: false,
  permissions: [],
  roles: [],
  authToken: localStorage.getItem('authToken') || null  // 从 localStorage 恢复 Token
}

// Getters
const getters = {
  // 获取当前用户
  currentUser: (state) => state.currentUser,

  // 是否已登录
  isAuthenticated: (state) => state.isAuthenticated,

  // 获取权限列表
  permissions: (state) => state.permissions,

  // 获取角色列表
  roles: (state) => state.roles,

  // 获取认证令牌
  authToken: (state) => state.authToken,

  // 检查是否有指定权限
  hasPermission: (state) => (permission) => {
    if (!state.isAuthenticated) return false
    if (state.currentUser?.is_superuser) return true
    return state.permissions.includes(permission)
  },

  // 检查是否有多个权限中的任意一个（OR）
  hasAnyPermission: (state) => (permissionList) => {
    if (!state.isAuthenticated) return false
    if (state.currentUser?.is_superuser) return true
    return permissionList.some(permission => state.permissions.includes(permission))
  },

  // 检查是否有多个权限中的所有（AND）
  hasAllPermissions: (state) => (permissionList) => {
    if (!state.isAuthenticated) return false
    if (state.currentUser?.is_superuser) return true
    return permissionList.every(permission => state.permissions.includes(permission))
  },

  // 检查是否有指定角色
  hasRole: (state) => (role) => {
    if (!state.isAuthenticated) return false
    if (state.currentUser?.is_superuser) return true
    return state.roles.includes(role)
  },

  // 检查是否有多个角色中的任意一个（OR）
  hasAnyRole: (state) => (roleList) => {
    if (!state.isAuthenticated) return false
    if (state.currentUser?.is_superuser) return true
    return roleList.some(role => state.roles.includes(role))
  },

  // 是否为业务员
  isSalesperson: (state) => {
    if (!state.isAuthenticated) return false
    return state.roles.includes('业务员')
  },

  // 是否为超级用户
  isSuperuser: (state) => {
    if (!state.isAuthenticated) return false
    return state.currentUser?.is_superuser || false
  },

  // 是否为生产主管
  isProductionSupervisor: (state) => {
    if (!state.isAuthenticated) return false
    return state.roles.includes('生产主管')
  },

  // 获取用户显示名称
  userDisplayName: (state) => {
    if (!state.currentUser) return ''
    return state.currentUser.username || state.currentUser.full_name || ''
  }
}

// Mutations
const mutations = {
  // 设置当前用户
  SET_CURRENT_USER(state, user) {
    state.currentUser = user
    state.isAuthenticated = !!user
  },

  // 设置登录状态
  SET_AUTHENTICATED(state, isAuthenticated) {
    state.isAuthenticated = isAuthenticated
  },

  // 设置权限列表
  SET_PERMISSIONS(state, permissions) {
    state.permissions = permissions || []
  },

  // 设置角色列表
  SET_ROLES(state, roles) {
    state.roles = roles || []
  },

  // 设置认证令牌
  SET_AUTH_TOKEN(state, token) {
    state.authToken = token
    // 持久化到 localStorage
    if (token) {
      localStorage.setItem('authToken', token)
    }
  },

  // 清除用户信息（登出时使用）
  CLEAR_USER(state) {
    state.currentUser = null
    state.isAuthenticated = false
    state.permissions = []
    state.roles = []
    state.authToken = null
    // 清除 localStorage 中的 token
    localStorage.removeItem('authToken')
  }
}

// Actions
const actions = {
  // 登录
  async login({ commit }, { username, password }) {
    try {
      // 调用认证 API
      const response = await login({ username, password })

      if (response.id) {
        // 登录成功，提取用户信息
        // 后端返回的 groups 是字符串数组，需要转换为角色数组
        const roles = response.groups || []
        const permissions = response.permissions || []
        const token = response.token || null  // 获取认证令牌

        const user = {
          id: response.id,
          username: response.username,
          full_name: `${response.first_name || ''} ${response.last_name || ''}`.trim(),
          email: response.email,
          is_superuser: response.is_superuser,
          is_staff: response.is_staff,
          // 保持原始格式（字符串数组），以便前端使用
          groups: roles.map(roleName => ({ name: roleName })),
          permissions: permissions,
          is_salesperson: response.is_salesperson || false
        }

        commit('SET_CURRENT_USER', user)
        commit('SET_ROLES', roles)
        commit('SET_PERMISSIONS', permissions)
        commit('SET_AUTH_TOKEN', token)  // 保存认证令牌

        // 初始化 PermissionService
        permissionService.initUser(user)

        return { success: true, user }
      } else {
        return { success: false, error: response.error || '登录失败' }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // 登出
  async logout({ commit }) {
    commit('CLEAR_USER')
    permissionService.currentUser = null
    permissionService.userRoles = new Set()
    permissionService.userPermissions = new Set()
  },

  // 清除用户信息（用于 401 错误等场景）
  clearUser({ commit }) {
    commit('CLEAR_USER')
    permissionService.currentUser = null
    permissionService.userRoles = new Set()
    permissionService.userPermissions = new Set()
  },

  // 获取用户信息
  async fetchUserInfo({ state }) {
    if (!state.isAuthenticated) {
      return { success: false, error: '未登录' }
    }

    try {
      // 这里应该调用获取用户信息的 API
      // const result = await authAPI.getUserInfo()

      // 模拟获取成功
      // TODO: 实现真实的 API 调用
      const result = { success: true }
      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // 更新权限
  updatePermissions({ commit }, permissions) {
    commit('SET_PERMISSIONS', permissions)
  },

  // 初始化用户信息（从 localStorage 或其他来源）
  initUser({ commit }, user) {
    if (user) {
      // 处理两种可能的 groups 格式：
      // 1. 字符串数组（来自后端 API）: ['管理员']
      // 2. 对象数组（已经处理过）: [{ name: '管理员' }]
      let roles = []
      if (Array.isArray(user.groups)) {
        if (user.groups.length > 0 && typeof user.groups[0] === 'string') {
          // 字符串数组格式
          roles = user.groups
        } else if (user.groups.length > 0 && typeof user.groups[0] === 'object') {
          // 对象数组格式
          roles = user.groups.map(g => g.name).filter(Boolean)
        }
      }

      const permissions = user.permissions || []
      const token = user.token || null  // 获取认证令牌

      // 标准化用户对象
      const normalizedUser = {
        ...user,
        groups: roles.map(roleName => ({ name: roleName })),
        // 确保 permissions 在用户对象上
        permissions: permissions
      }

      commit('SET_CURRENT_USER', normalizedUser)
      commit('SET_ROLES', roles)
      commit('SET_PERMISSIONS', permissions)
      commit('SET_AUTH_TOKEN', token)  // 保存认证令牌

      // 初始化 PermissionService
      permissionService.initUser(normalizedUser)
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
