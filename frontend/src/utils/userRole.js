/**
 * 用户角色工具函数
 * 提供便捷的用户角色判断方法
 */

/**
 * 判断当前用户是否为业务员
 * @param {Object} store - Vuex store 实例
 * @returns {Boolean}
 */
export function isSalesperson(store) {
  return store.getters.isSalesperson
}

/**
 * 判断当前用户是否属于指定角色
 * @param {Object} store - Vuex store 实例
 * @param {String} roleName - 角色名称
 * @returns {Boolean}
 */
export function hasRole(store, roleName) {
  const groups = store.getters.userGroups || []
  return groups.includes(roleName)
}

/**
 * 判断当前用户是否属于任意一个指定角色
 * @param {Object} store - Vuex store 实例
 * @param {Array<String>} roleNames - 角色名称数组
 * @returns {Boolean}
 */
export function hasAnyRole(store, roleNames) {
  const groups = store.getters.userGroups || []
  return roleNames.some(role => groups.includes(role))
}

/**
 * 判断当前用户是否属于所有指定角色
 * @param {Object} store - Vuex store 实例
 * @param {Array<String>} roleNames - 角色名称数组
 * @returns {Boolean}
 */
export function hasAllRoles(store, roleNames) {
  const groups = store.getters.userGroups || []
  return roleNames.every(role => groups.includes(role))
}

