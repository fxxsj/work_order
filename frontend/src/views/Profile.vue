<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <div slot="header" class="card-header">
        <span class="title">个人信息</span>
      </div>

      <el-tabs v-model="activeTab" type="border-card">
        <!-- 基本信息标签页 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form
            ref="profileForm"
            :model="profileForm"
            :rules="profileRules"
            label-width="100px"
            class="profile-form"
          >
            <el-form-item label="用户名">
              <el-input v-model="currentUser.username" disabled />
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
              <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
            </el-form-item>

            <el-form-item label="姓" prop="last_name">
              <el-input v-model="profileForm.last_name" placeholder="请输入姓" />
            </el-form-item>

            <el-form-item label="名" prop="first_name">
              <el-input v-model="profileForm.first_name" placeholder="请输入名" />
            </el-form-item>

            <el-form-item label="用户角色">
              <el-tag
                v-for="role in currentUser.groups"
                :key="role"
                type="success"
                style="margin-right: 10px;"
              >
                {{ role }}
              </el-tag>
              <el-tag v-if="currentUser.is_superuser" type="danger">
                超级管理员
              </el-tag>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :loading="updateLoading"
                @click="handleUpdateProfile"
              >
                保存修改
              </el-button>
              <el-button @click="resetProfileForm">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 修改密码标签页 -->
        <el-tab-pane label="修改密码" name="password">
          <el-form
            ref="passwordForm"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
            class="password-form"
          >
            <el-form-item label="旧密码" prop="old_password">
              <el-input
                v-model="passwordForm.old_password"
                type="password"
                placeholder="请输入旧密码"
                show-password
              />
            </el-form-item>

            <el-form-item label="新密码" prop="new_password">
              <el-input
                v-model="passwordForm.new_password"
                type="password"
                placeholder="请输入新密码（至少6位）"
                show-password
              />
            </el-form-item>

            <el-form-item label="确认密码" prop="confirm_password">
              <el-input
                v-model="passwordForm.confirm_password"
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </el-form-item>

            <el-alert
              title="密码安全提示"
              type="info"
              :closable="false"
              style="margin-bottom: 20px;"
            >
              <ul style="margin: 5px 0; padding-left: 20px;">
                <li>密码长度至少为6位</li>
                <li>建议使用字母、数字和特殊字符的组合</li>
                <li>不要使用过于简单的密码</li>
              </ul>
            </el-alert>

            <el-form-item>
              <el-button
                type="primary"
                :loading="passwordLoading"
                @click="handleChangePassword"
              >
                修改密码
              </el-button>
              <el-button @click="resetPasswordForm">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { authAPI } from '@/api/modules'

export default {
  name: 'Profile',
  data() {
    // 验证确认密码
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.passwordForm.new_password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }

    return {
      activeTab: 'basic',
      updateLoading: false,
      passwordLoading: false,
      profileForm: {
        email: '',
        first_name: '',
        last_name: ''
      },
      passwordForm: {
        old_password: '',
        new_password: '',
        confirm_password: ''
      },
      profileRules: {
        email: [
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ]
      },
      passwordRules: {
        old_password: [
          { required: true, message: '请输入旧密码', trigger: 'blur' }
        ],
        new_password: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
        ],
        confirm_password: [
          { required: true, message: '请再次输入新密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    currentUser() {
      return this.$store.getters['user/currentUser'] || {}
    }
  },
  mounted() {
    this.initProfileForm()
  },
  methods: {
    initProfileForm() {
      if (this.currentUser) {
        this.profileForm = {
          email: this.currentUser.email || '',
          first_name: this.currentUser.first_name || '',
          last_name: this.currentUser.last_name || ''
        }
      }
    },

    resetProfileForm() {
      this.initProfileForm()
      this.$message.info('已重置为原始信息')
    },

    async handleUpdateProfile() {
      const valid = await this.$refs.profileForm.validate().catch(() => false)
      if (!valid) {
        return false
      }

      this.updateLoading = true
      try {
        const result = await authAPI.updateProfile(this.profileForm)

        // 更新 store 中的用户信息
        this.$store.dispatch('user/initUser', result)

        this.$message({
          message: result.message || '个人信息更新成功',
          type: 'success',
          duration: 2000
        })
      } catch (error) {
        console.error('更新个人信息失败:', error)
        this.$message.error(error.response?.data?.error || '个人信息更新失败')
      } finally {
        this.updateLoading = false
      }
    },

    resetPasswordForm() {
      this.passwordForm = {
        old_password: '',
        new_password: '',
        confirm_password: ''
      }
      this.$refs.passwordForm?.clearValidate()
      this.$message.info('已清空密码表单')
    },

    async handleChangePassword() {
      const valid = await this.$refs.passwordForm.validate().catch(() => false)
      if (!valid) {
        return false
      }

      this.passwordLoading = true
      try {
        await authAPI.changePassword(this.passwordForm)

        this.$message({
          message: '密码修改成功，请重新登录',
          type: 'success',
          duration: 2000
        })

        // 清空表单
        this.resetPasswordForm()

        // 延迟后退出登录
        setTimeout(() => {
          this.$store.dispatch('user/logout')
          this.$router.push('/login')
        }, 2000)
      } catch (error) {
        console.error('修改密码失败:', error)
        this.$message.error(error.response?.data?.error || '密码修改失败')
      } finally {
        this.passwordLoading = false
      }
    }
  }
}
</script>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.profile-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.profile-form,
.password-form {
  max-width: 600px;
  padding: 20px;
}

.el-form-item {
  margin-bottom: 22px;
}
</style>
