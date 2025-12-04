<template>
  <div class="users-management">
    <div class="page-header">
      <h2>用户管理</h2>
      <p class="page-subtitle">管理所有用户</p>
    </div>

    <!-- 筛选区域 -->
    <div class="filters-section">
      <div class="filter-group">
        <label>用户</label>
        <div class="search-input-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            v-model="filters.search"
            placeholder="搜索用户名..."
            class="filter-input"
            @input="applyFilters"
          />
        </div>
      </div>

      <div class="filter-group">
        <label>日期</label>
        <div class="date-input-wrapper">
          <svg class="calendar-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <input
            type="date"
            v-model="filters.date"
            class="filter-input"
            @change="applyFilters"
          />
        </div>
      </div>

      <div class="filter-group">
        <label>角色</label>
        <select v-model="filters.role" class="filter-select" @change="applyFilters">
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="user">普通用户</option>
        </select>
      </div>

      <div class="filter-group">
        <label>状态</label>
        <select v-model="filters.status" class="filter-select" @change="applyFilters">
          <option value="">全部状态</option>
          <option value="normal">正常</option>
          <option value="banned">已封禁</option>
        </select>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-label">总用户数</div>
        <div class="stat-value">{{ total }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">管理员</div>
        <div class="stat-value">{{ adminCount }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">今日新增</div>
        <div class="stat-value">{{ todayCount }}</div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="users-table-container">
      <!-- 加载骨架屏 -->
      <SkeletonLoader
        v-if="loading && users.length === 0"
        type="user-list"
        :count="10"
      />

      <!-- 用户表格 -->
      <FadeTransition v-else-if="!loading && filteredUsers.length > 0" type="fade" :duration="400">
        <table class="users-table fade-in-table">
        <thead>
          <tr>
            <th>用户</th>
            <th>名称</th>
            <th>角色</th>
            <th>状态</th>
            <th>登录方式</th>
            <th>权限</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in paginatedUsers" :key="user.id">
            <td>
              <div class="user-cell">
                <div class="user-avatar-wrapper">
                  <div class="user-avatar">
                    {{ getUserInitial(user.username) }}
                  </div>
                  <div class="user-id">{{ user.userId || user.id }}</div>
                </div>
              </div>
            </td>
            <td>
              <div class="name-cell">
                <span class="username">{{ user.username }}</span>
                <span class="user-emoji">{{ getUserEmoji(user) }}</span>
              </div>
            </td>
            <td>
              <span class="role-badge" :class="user.role || 'user'">
                {{ getRoleLabel(user.role) }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="user.status || 'normal'">
                {{ getStatusLabel(user.status) }}
              </span>
            </td>
            <td>
              <span class="login-method-badge">账号密码</span>
            </td>
            <td>
              <span class="permission-text">{{ user.permission || '正常' }}</span>
            </td>
            <td>
              <span class="date-text">{{ formatShortDate(user.created_at) }}</span>
            </td>
            <td>
              <div class="action-buttons">
                <button class="btn-icon btn-view" @click="viewUser(user)" title="查看">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                <button
                  class="btn-icon btn-admin"
                  @click="toggleAdmin(user)"
                  :title="user.role === 'admin' ? '取消管理员' : '设为管理员'"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </button>
                <button
                  class="btn-icon btn-ban"
                  @click="toggleBan(user)"
                  :title="user.status === 'banned' ? '解除封禁' : '封禁'"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>
                </button>
                <button class="btn-icon btn-delete" @click="deleteUser(user)" title="删除">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      </FadeTransition>

      <!-- 空状态 -->
      <FadeTransition v-else-if="!loading" type="scale-fade">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p>暂无用户数据</p>
        </div>
      </FadeTransition>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="totalFilteredPages > 1">
      <button
        class="pagination-btn"
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <div class="page-numbers">
        <button
          v-for="pageNum in visiblePages"
          :key="pageNum"
          class="page-number-btn"
          :class="{ active: pageNum === currentPage, ellipsis: pageNum === '...' }"
          :disabled="pageNum === '...'"
          @click="changePage(pageNum)"
        >
          {{ pageNum }}
        </button>
      </div>

      <button
        class="pagination-btn"
        :disabled="currentPage === totalFilteredPages"
        @click="changePage(currentPage + 1)"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>

    <!-- 用户详情弹窗 -->
    <div v-if="showUserDetail" class="modal-overlay" @click="showUserDetail = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>用户详情</h3>
          <button class="btn-close" @click="showUserDetail = false">×</button>
        </div>
        <div class="modal-body" v-if="selectedUser">
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="detail-item">
              <span class="label">用户ID:</span>
              <span class="value">{{ selectedUser.id }}</span>
            </div>
            <div class="detail-item">
              <span class="label">用户名:</span>
              <span class="value">{{ selectedUser.username }}</span>
            </div>
            <div class="detail-item">
              <span class="label">系统ID:</span>
              <code class="value">{{ selectedUser.userId }}</code>
            </div>
            <div class="detail-item">
              <span class="label">注册时间:</span>
              <span class="value">{{ formatDateTime(selectedUser.created_at) }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h4>统计信息</h4>
            <div class="detail-stats">
              <div class="stat-item">
                <span class="stat-number">{{ selectedUser.email_count }}</span>
                <span class="stat-text">临时邮箱</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ selectedUser.message_count }}</span>
                <span class="stat-text">收到邮件</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ selectedUser.sent_count }}</span>
                <span class="stat-text">发送邮件</span>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="userEmails.length > 0">
            <h4>邮箱列表</h4>
            <div class="email-list">
              <div v-for="email in userEmails" :key="email.id" class="email-item">
                <span class="email-address">{{ email.email }}</span>
                <span class="email-status" :class="email.status">{{ email.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useNotification } from '@/composables/useNotification'
import { useAuthStore } from '@/stores/authStore'
import { formatTime } from '@/utils/formatTime'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import FadeTransition from '@/components/FadeTransition.vue'

const { showNotification } = useNotification()
const authStore = useAuthStore()
const API_BASE = import.meta.env.VITE_API_BASE ||
  (import.meta.env.MODE === 'production'
    ? 'https://tempemail-back.pslucieljw.workers.dev/api'
    : 'http://localhost:8787/api')

const loading = ref(false)
const users = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const showUserDetail = ref(false)
const selectedUser = ref(null)
const userEmails = ref([])

// 筛选条件
const filters = ref({
  search: '',
  date: '',
  role: '',
  status: ''
})

// 过滤后的用户列表
const filteredUsers = computed(() => {
  let result = users.value

  // 搜索过滤
  if (filters.value.search) {
    const query = filters.value.search.toLowerCase()
    result = result.filter(user =>
      user.username?.toLowerCase().includes(query) ||
      user.id?.toString().includes(query)
    )
  }

  // 日期过滤
  if (filters.value.date) {
    result = result.filter(user => {
      const userDate = new Date(user.created_at).toISOString().split('T')[0]
      return userDate === filters.value.date
    })
  }

  // 角色过滤
  if (filters.value.role) {
    result = result.filter(user => (user.role || 'user') === filters.value.role)
  }

  // 状态过滤
  if (filters.value.status) {
    result = result.filter(user => (user.status || 'normal') === filters.value.status)
  }

  return result
})

// 分页后的用户列表
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredUsers.value.slice(start, end)
})

// 总页数
const totalFilteredPages = computed(() => Math.ceil(filteredUsers.value.length / pageSize.value))

// 可见页码
const visiblePages = computed(() => {
  const pages = []
  const total = totalFilteredPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current <= 3) {
      pages.push(2, 3, 4, '...', total)
    } else if (current >= total - 2) {
      pages.push('...', total - 3, total - 2, total - 1, total)
    } else {
      pages.push('...', current - 1, current, current + 1, '...', total)
    }
  }
  return pages
})

// 统计
const adminCount = computed(() => users.value.filter(u => u.role === 'admin').length)
const todayCount = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return users.value.filter(u => {
    const userDate = new Date(u.created_at).toISOString().split('T')[0]
    return userDate === today
  }).length
})

// 格式化日期（简短格式）
const formatShortDate = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化日期时间（年月日 + 时间）
const formatDateTime = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 获取用户首字母
const getUserInitial = (username) => {
  if (!username) return '?'
  return username.charAt(0).toUpperCase()
}

// 获取用户 emoji（根据用户名生成）
const getUserEmoji = (user) => {
  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙']
  const index = (user.id || 0) % emojis.length
  return emojis[index]
}

// 获取角色标签
const getRoleLabel = (role) => {
  if (role === 'admin') return 'admin(主)'
  return 'user(普通)'
}

// 获取状态标签
const getStatusLabel = (status) => {
  if (status === 'banned') return '已封禁'
  return '正常'
}

// 应用筛选
const applyFilters = () => {
  currentPage.value = 1
}

const loadUsers = async () => {
  // 检查是否已登录，避免退出登录时触发 401 错误
  if (!authStore.isAuthenticated) {
    return
  }
  
  loading.value = true
  try {
    const response = await axios.get(`${API_BASE}/users/list`, {
      params: { page: 1, limit: 1000 }, // 加载所有用户，前端分页
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })

    if (response.data.success) {
      users.value = response.data.data.users
      total.value = response.data.data.total
    }
  } catch (error) {
    console.error('Load users error:', error)
    showNotification('加载用户列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const changePage = (pageNum) => {
  if (pageNum === '...' || pageNum < 1 || pageNum > totalFilteredPages.value) return
  currentPage.value = pageNum
}

const viewUser = async (user) => {
  try {
    const response = await axios.get(`${API_BASE}/users/${user.id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })

    if (response.data.success) {
      selectedUser.value = response.data.data.user
      userEmails.value = response.data.data.emails
      showUserDetail.value = true
    }
  } catch (error) {
    console.error('Load user detail error:', error)
    showNotification('加载用户详情失败', 'error')
  }
}

// 切换管理员权限
const toggleAdmin = async (user) => {
  const isAdmin = user.role === 'admin'
  const action = isAdmin ? '取消管理员权限' : '设为管理员'

  if (!confirm(`确认${action}用户 "${user.username}"？`)) {
    return
  }

  try {
    const response = await axios.put(`${API_BASE}/users/${user.id}/role`,
      { role: isAdmin ? 'user' : 'admin' },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      }
    )

    if (response.data.success) {
      user.role = isAdmin ? 'user' : 'admin'
      showNotification(`已${action}`, 'success')
    }
  } catch (error) {
    console.error('Toggle admin error:', error)
    showNotification(`${action}失败`, 'error')
  }
}

// 切换封禁状态
const toggleBan = async (user) => {
  const isBanned = user.status === 'banned'
  const action = isBanned ? '解除封禁' : '封禁'

  if (!confirm(`确认${action}用户 "${user.username}"？`)) {
    return
  }

  try {
    const response = await axios.put(`${API_BASE}/users/${user.id}/status`,
      { status: isBanned ? 'normal' : 'banned' },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      }
    )

    if (response.data.success) {
      user.status = isBanned ? 'normal' : 'banned'
      showNotification(`已${action}用户`, 'success')
    }
  } catch (error) {
    console.error('Toggle ban error:', error)
    showNotification(`${action}失败`, 'error')
  }
}

const deleteUser = async (user) => {
  if (!confirm(`确认删除用户 "${user.username}"？\n\n这将同时删除该用户的所有临时邮箱、邮件和发送记录！\n\n此操作不可恢复！`)) {
    return
  }

  try {
    const response = await axios.delete(`${API_BASE}/users/${user.id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })

    if (response.data.success) {
      showNotification(`用户 "${user.username}" 已删除`, 'success')
      loadUsers()
    }
  } catch (error) {
    console.error('Delete user error:', error)
    showNotification('删除用户失败', 'error')
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-management {
  padding: 32px;
  max-width: 1600px;
  margin: 0 auto;
  background: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* 筛选区域 */
.filters-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

.search-input-wrapper,
.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon,
.calendar-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  pointer-events: none;
}

.filter-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #1e293b;
  background: white;
  transition: all 0.2s;
}

.filter-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.filter-input::placeholder {
  color: #cbd5e1;
}

.filter-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #1e293b;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

/* 表格 */
.users-table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  min-height: 500px;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table thead {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.users-table th {
  padding: 14px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.users-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  color: #1e293b;
}

.users-table tbody tr {
  transition: background 0.2s;
}

.users-table tbody tr:hover {
  background: #f8fafc;
}

/* 用户单元格 */
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-id {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

/* 名称单元格 */
.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-weight: 500;
  color: #1e293b;
}

.user-emoji {
  font-size: 18px;
}

/* 角色标签 */
.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.role-badge.admin {
  background: #fef3c7;
  color: #92400e;
}

.role-badge.user {
  background: #e0e7ff;
  color: #3730a3;
}

/* 状态标签 */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.normal {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.banned {
  background: #fee2e2;
  color: #991b1b;
}

/* 登录方式标签 */
.login-method-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: #f1f5f9;
  color: #475569;
}

/* 权限文本 */
.permission-text {
  color: #64748b;
  font-size: 13px;
}

/* 日期文本 */
.date-text {
  color: #64748b;
  font-size: 13px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-view {
  background: #dbeafe;
  color: #1e40af;
}

.btn-view:hover {
  background: #bfdbfe;
  transform: scale(1.1);
}

.btn-admin {
  background: #fef3c7;
  color: #92400e;
}

.btn-admin:hover {
  background: #fde68a;
  transform: scale(1.1);
}

.btn-ban {
  background: #fed7aa;
  color: #9a3412;
}

.btn-ban:hover {
  background: #fdba74;
  transform: scale(1.1);
}

.btn-delete {
  background: #fee2e2;
  color: #991b1b;
}

.btn-delete:hover {
  background: #fecaca;
  transform: scale(1.1);
}

/* 空状态 */
.empty-state, .loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #9ca3af;
}

.empty-state svg {
  opacity: 0.3;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  padding: 20px 0;
}

.pagination-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748b;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #6366f1;
  color: #6366f1;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-number-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
}

.page-number-btn:hover:not(:disabled):not(.active) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.page-number-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}

.page-number-btn.ellipsis {
  border: none;
  background: transparent;
  cursor: default;
}

.page-number-btn:disabled {
  cursor: not-allowed;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #9ca3af;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

/* 自定义滚动条样式 */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .label {
  font-size: 14px;
  color: #6b7280;
}

.detail-item .value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

.detail-item code {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #6366f1;
  margin-bottom: 4px;
}

.stat-text {
  display: block;
  font-size: 12px;
  color: #6b7280;
}

.email-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.email-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 13px;
}

.email-address {
  font-family: monospace;
  color: #374151;
}

.email-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.email-status.active {
  background: #d1fae5;
  color: #065f46;
}

.email-status.expired {
  background: #fee2e2;
  color: #991b1b;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 表格淡入动画 */
.fade-in-table {
  animation: fadeInTable 0.5s ease-out;
}

.fade-in-table tbody tr {
  animation: fadeInRow 0.4s ease-out backwards;
}

.fade-in-table tbody tr:nth-child(1) { animation-delay: 0.05s; }
.fade-in-table tbody tr:nth-child(2) { animation-delay: 0.1s; }
.fade-in-table tbody tr:nth-child(3) { animation-delay: 0.15s; }
.fade-in-table tbody tr:nth-child(4) { animation-delay: 0.2s; }
.fade-in-table tbody tr:nth-child(5) { animation-delay: 0.25s; }
.fade-in-table tbody tr:nth-child(6) { animation-delay: 0.3s; }
.fade-in-table tbody tr:nth-child(7) { animation-delay: 0.35s; }
.fade-in-table tbody tr:nth-child(8) { animation-delay: 0.4s; }
.fade-in-table tbody tr:nth-child(9) { animation-delay: 0.45s; }
.fade-in-table tbody tr:nth-child(10) { animation-delay: 0.5s; }

@keyframes fadeInTable {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInRow {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>

