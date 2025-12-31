import request from './index'

// 用户登录
export function login(data) {
  return request({
    url: '/auth/login/',
    method: 'post',
    data
  })
}

// 用户登出
export function logout() {
  return request({
    url: '/auth/logout/',
    method: 'post'
  })
}

// 获取当前用户信息
export function getCurrentUser() {
  return request({
    url: '/auth/user/',
    method: 'get'
  })
}

// 用户注册
export function register(data) {
  return request({
    url: '/auth/register/',
    method: 'post',
    data
  })
}

// 获取业务员列表
export function getSalespersons() {
  return request({
    url: '/auth/salespersons/',
    method: 'get'
  })
}

