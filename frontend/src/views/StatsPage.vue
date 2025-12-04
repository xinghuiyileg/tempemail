<template>
  <div class="stats-page">
    <div class="stats-header">
      <div>
        <h2>监控统计</h2>
        <p class="subtitle">系统运行状态及数据统计</p>
      </div>
      <button class="refresh-btn" @click="refreshData" :disabled="loading" :class="{ 'success': refreshSuccess, 'transitioning': isTransitioning }">
        <transition name="icon-fade" mode="out-in">
          <svg v-if="!refreshSuccess" key="refresh" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" :class="{ 'spinning': loading }">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <svg v-else key="check" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" class="check-icon">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </transition>
        <transition name="text-fade" mode="out-in">
          <span v-if="!loading && !refreshSuccess" key="refresh-text">刷新数据</span>
          <span v-else-if="loading" key="loading-text">刷新中...</span>
          <span v-else key="success-text">刷新完成</span>
        </transition>
      </button>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="card-icon email-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <div class="card-info">
          <p class="card-label">邮件总数</p>
          <h3 class="card-value">{{ stats.totalMessages }}</h3>
          <p class="card-desc">今日：{{ stats.todayMessages }}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="card-icon unread-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <div class="card-info">
          <p class="card-label">未读邮件</p>
          <h3 class="card-value">{{ stats.unreadMessages }}</h3>
          <p class="card-desc">占比：{{ unreadPercentage }}%</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="card-icon message-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div class="card-info">
          <p class="card-label">邮件数量</p>
          <h3 class="card-value">{{ stats.activeEmails }}</h3>
          <p class="card-desc">活跃邮箱数</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="card-icon user-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="card-info">
          <p class="card-label">用户数量</p>
          <h3 class="card-value">{{ stats.totalUsers }}</h3>
          <p class="card-desc">今日新增：{{ stats.todayUsers }}</p>
        </div>
      </div>
    </div>

    <!-- 邮件服务商额度统计 -->
    <div class="quota-section">
      <h3 class="section-title">📧 邮件服务商额度</h3>
      <div class="quota-cards" v-if="!quotaLoading && emailQuota.services.length > 0">
        <div v-for="service in emailQuota.services" :key="service.service" class="quota-card" :class="{ 'quota-error': !service.success, 'quota-disabled': isServiceDisabled(service.service) }">
          <div class="quota-header">
            <div class="quota-title">
              <h4>{{ service.service }}</h4>
              <span v-if="isServiceDisabled(service.service)" class="disabled-badge">已禁用</span>
            </div>
            <div class="quota-actions">
              <button
                class="toggle-btn"
                :class="{ 'disabled': isServiceDisabled(service.service) }"
                @click="toggleService(service.service)"
                :title="isServiceDisabled(service.service) ? '点击启用' : '点击禁用'"
              >
                <svg v-if="!isServiceDisabled(service.service)" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
              <span v-if="service.success" class="quota-badge" :class="getQuotaBadgeClass(service.percentage)">
                {{ service.percentage }}%
              </span>
              <span v-else class="quota-badge error">错误</span>
            </div>
          </div>

          <div v-if="service.success" class="quota-body">
            <div class="quota-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: service.percentage + '%' }" :class="getProgressClass(service.percentage)"></div>
              </div>
            </div>

            <!-- Resend 特殊显示：每日限制 / 剩余 / 月度限制 -->
            <div v-if="service.service === 'Resend' && service.dailyLimit" class="quota-stats">
              <div class="quota-stat">
                <span class="stat-label">每日限制</span>
                <span class="stat-value">{{ service.dailyLimit.used }} / {{ service.dailyLimit.total }}</span>
              </div>
              <div class="quota-stat">
                <span class="stat-label">剩余</span>
                <span class="stat-value highlight">{{ service.remaining }}</span>
              </div>
              <div class="quota-stat">
                <span class="stat-label">月度限制</span>
                <span class="stat-value">{{ service.used }} / {{ service.total }}</span>
              </div>
            </div>

            <!-- 其他服务商：已使用 / 剩余 / 总额度 -->
            <div v-else class="quota-stats">
              <div class="quota-stat">
                <span class="stat-label">已使用</span>
                <span class="stat-value">{{ service.used }}</span>
              </div>
              <div class="quota-stat">
                <span class="stat-label">剩余</span>
                <span class="stat-value highlight">{{ service.remaining }}</span>
              </div>
              <div class="quota-stat">
                <span class="stat-label">总额度</span>
                <span class="stat-value">{{ service.total }}</span>
              </div>
            </div>

            <p class="quota-unit">{{ service.unit }}</p>
            <p v-if="service.note" class="quota-note">{{ service.note }}</p>
          </div>

          <div v-else class="quota-error-msg">
            <p>{{ service.error }}</p>
          </div>
        </div>
      </div>

      <div v-else-if="quotaLoading" class="quota-loading">
        <div class="loading-spinner"></div>
        <p>正在加载额度信息...</p>
      </div>

      <div v-else class="quota-empty">
        <p>暂无邮件服务商配置</p>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <h4>用户增长趋势</h4>
        <div class="line-chart">
          <svg viewBox="0 0 700 360">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#6366f1;stop-opacity:0.3" />
                <stop offset="100%" style="stop-color:#6366f1;stop-opacity:0" />
              </linearGradient>
            </defs>
            <!-- 背景网格 -->
            <line x1="50" y1="20" x2="680" y2="20" stroke="#cbd5e1" stroke-width="1.5"/>
            <line x1="50" y1="68" x2="680" y2="68" stroke="#cbd5e1" stroke-width="1.5"/>
            <line x1="50" y1="116" x2="680" y2="116" stroke="#cbd5e1" stroke-width="1.5"/>
            <line x1="50" y1="164" x2="680" y2="164" stroke="#cbd5e1" stroke-width="1.5"/>
            <line x1="50" y1="212" x2="680" y2="212" stroke="#cbd5e1" stroke-width="1.5"/>
            <line x1="50" y1="260" x2="680" y2="260" stroke="#cbd5e1" stroke-width="1.5"/>
            <!-- Y轴 -->
            <line x1="50" y1="20" x2="50" y2="260" stroke="#94a3b8" stroke-width="2"/>
            <!-- Y轴刻度 -->
            <text x="45" y="25" font-size="13" fill="#64748b" text-anchor="end">{{ userGrowthData.yAxisLabels[0] }}</text>
            <text x="45" y="73" font-size="13" fill="#64748b" text-anchor="end">{{ userGrowthData.yAxisLabels[1] }}</text>
            <text x="45" y="121" font-size="13" fill="#64748b" text-anchor="end">{{ userGrowthData.yAxisLabels[2] }}</text>
            <text x="45" y="169" font-size="13" fill="#64748b" text-anchor="end">{{ userGrowthData.yAxisLabels[3] }}</text>
            <text x="45" y="217" font-size="13" fill="#64748b" text-anchor="end">{{ userGrowthData.yAxisLabels[4] }}</text>
            <text x="45" y="265" font-size="13" fill="#64748b" text-anchor="end">{{ userGrowthData.yAxisLabels[5] }}</text>
            <!-- X轴 -->
            <line x1="50" y1="260" x2="680" y2="260" stroke="#cbd5e1" stroke-width="2"/>
            <text v-for="(date, i) in userGrowthData.dates" :key="i"
                  :x="50 + i * (630 / (userGrowthData.dates.length - 1 || 1))" 
                  y="285" 
                  font-size="13" 
                  fill="#64748b" 
                  text-anchor="middle">{{ date }}</text>
            <!-- 数据线 -->
            <path v-if="userGrowthData.path" :d="userGrowthData.path + ' L ' + userGrowthData.points[userGrowthData.points.length - 1]?.x + ' 260 L 50 260 Z'" 
                  fill="url(#lineGradient)" />
            <path v-if="userGrowthData.path" :d="userGrowthData.path" 
                  fill="none" stroke="#6366f1" stroke-width="3" />
            <circle v-for="(point, i) in userGrowthData.points" :key="i"
                    :cx="point.x" :cy="point.y" r="5" fill="#6366f1" />
            <!-- 轴标签 -->
            <text x="365" y="315" font-size="14" fill="#475569" font-weight="600" text-anchor="middle">日期</text>
          </svg>
        </div>
      </div>

      <div class="chart-card">
        <h4>登录方式分布</h4>
        <div class="pie-chart">
          <svg viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#6366f1" stroke-width="40" 
                    :stroke-dasharray="`${loginMethodCircle.password} ${loginMethodCircle.account}`" 
                    transform="rotate(-90 100 100)" />
            <circle cx="100" cy="100" r="80" fill="none" stroke="#10b981" stroke-width="40" 
                    :stroke-dasharray="`${loginMethodCircle.account} ${loginMethodCircle.password}`" 
                    :stroke-dashoffset="`-${loginMethodCircle.password}`" 
                    transform="rotate(-90 100 100)" />
          </svg>
          <div class="pie-legend">
            <div class="legend-item">
              <span class="dot" style="background:#6366f1"></span>
              <span>访问密码登录 {{ loginMethodPercent.password }}%</span>
            </div>
            <div class="legend-item">
              <span class="dot" style="background:#10b981"></span>
              <span>账号密码登录 {{ loginMethodPercent.account }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-header">
          <h4>邮件增长趋势</h4>
          <div class="chart-legend-inline">
            <div class="legend-item">
              <span class="dot" style="background:#6366f1"></span>
              <span>接收</span>
            </div>
            <div class="legend-item">
              <span class="dot" style="background:#f59e0b"></span>
              <span>发送</span>
            </div>
          </div>
        </div>
        <div class="bar-chart">
          <svg viewBox="0 0 700 360">
            <!-- 背景网格 -->
            <line x1="50" y1="20" x2="680" y2="20" stroke="#cbd5e1" stroke-width="1.5"/>
            <line x1="50" y1="68" x2="680" y2="68" stroke="#cbd5e1" stroke-width="1.5"/>
            <line x1="50" y1="116" x2="680" y2="116" stroke="#cbd5e1" stroke-width="1.5"/>
            <line x1="50" y1="164" x2="680" y2="164" stroke="#cbd5e1" stroke-width="1.5"/>
            <line x1="50" y1="212" x2="680" y2="212" stroke="#cbd5e1" stroke-width="1.5"/>
            <line x1="50" y1="260" x2="680" y2="260" stroke="#cbd5e1" stroke-width="1.5"/>
            <!-- Y轴 -->
            <line x1="50" y1="20" x2="50" y2="260" stroke="#94a3b8" stroke-width="2"/>
            <!-- Y轴刻度 -->
            <text x="45" y="25" font-size="13" fill="#64748b" text-anchor="end">{{ emailGrowthData.yAxisLabels[0] }}</text>
            <text x="45" y="73" font-size="13" fill="#64748b" text-anchor="end">{{ emailGrowthData.yAxisLabels[1] }}</text>
            <text x="45" y="121" font-size="13" fill="#64748b" text-anchor="end">{{ emailGrowthData.yAxisLabels[2] }}</text>
            <text x="45" y="169" font-size="13" fill="#64748b" text-anchor="end">{{ emailGrowthData.yAxisLabels[3] }}</text>
            <text x="45" y="217" font-size="13" fill="#64748b" text-anchor="end">{{ emailGrowthData.yAxisLabels[4] }}</text>
            <text x="45" y="265" font-size="13" fill="#64748b" text-anchor="end">{{ emailGrowthData.yAxisLabels[5] }}</text>
            <!-- X轴 -->
            <line x1="50" y1="260" x2="680" y2="260" stroke="#cbd5e1" stroke-width="2"/>
            <text v-for="(date, i) in emailGrowthData.dates" :key="'d' + i"
                  :x="50 + i * (630 / emailGrowthData.dates.length) + (630 / emailGrowthData.dates.length / 2)" 
                  y="285" 
                  font-size="13" 
                  fill="#64748b" 
                  text-anchor="middle">{{ date }}</text>
            <!-- 柱状图 -->
            <rect v-for="(bar, i) in emailGrowthData.bars" :key="'r' + i"
                  :x="bar.receivedX" :y="bar.receivedY" width="25" :height="bar.receivedHeight" 
                  fill="#6366f1" rx="2"/>
            <rect v-for="(bar, i) in emailGrowthData.bars" :key="'s' + i"
                  :x="bar.sentX" :y="bar.sentY" width="25" :height="bar.sentHeight" 
                  fill="#f59e0b" rx="2"/>
            <!-- 轴标签 -->
            <text x="365" y="315" font-size="14" fill="#475569" font-weight="600" text-anchor="middle">日期</text>
          </svg>
        </div>
      </div>

      <div class="chart-card">
        <h4>邮件来源分布</h4>
        <div class="pie-chart-container">
          <div class="pie-chart-left">
            <svg viewBox="0 0 200 200" class="pie-svg">
              <circle v-for="(item, index) in emailSourcesCircle" :key="index"
                      cx="100" cy="100" r="80" fill="none"
                      :stroke="item.color" stroke-width="40"
                      :stroke-dasharray="item.dasharray"
                      :stroke-dashoffset="item.dashoffset"
                      transform="rotate(-90 100 100)"
                      class="pie-segment"
                      @mouseenter="hoveredSegment = index"
                      @mouseleave="hoveredSegment = null">
                <title>{{ emailSourcesData[index].domain }}: {{ emailSourcesData[index].percent }}%</title>
              </circle>
            </svg>
          </div>
          <div class="pie-legend-right">
            <div v-for="(item, index) in emailSourcesData" :key="index"
                 class="legend-item-right"
                 :class="{ 'hovered': hoveredSegment === index }"
                 @mouseenter="hoveredSegment = index"
                 @mouseleave="hoveredSegment = null">
              <div class="legend-domain">
                <span class="dot" :style="{ background: item.color }"></span>
                <span class="domain-text">{{ item.domain }}</span>
              </div>
              <span class="percent-text">{{ item.percent }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="chart-card full-width">
      <h4>API调用趋势</h4>
      <div class="area-chart">
        <svg viewBox="0 0 1200 360">
          <defs>
            <linearGradient id="apiGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#6366f1;stop-opacity:0.4" />
              <stop offset="100%" style="stop-color:#6366f1;stop-opacity:0" />
            </linearGradient>
            <linearGradient id="apiGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#ef4444;stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:#ef4444;stop-opacity:0" />
            </linearGradient>
          </defs>
          <!-- 背景网格 -->
          <line x1="50" y1="20" x2="1160" y2="20" stroke="#cbd5e1" stroke-width="1.5"/>
          <line x1="50" y1="68" x2="1160" y2="68" stroke="#cbd5e1" stroke-width="1.5"/>
          <line x1="50" y1="116" x2="1160" y2="116" stroke="#cbd5e1" stroke-width="1.5"/>
          <line x1="50" y1="164" x2="1160" y2="164" stroke="#cbd5e1" stroke-width="1.5"/>
          <line x1="50" y1="212" x2="1160" y2="212" stroke="#cbd5e1" stroke-width="1.5"/>
          <line x1="50" y1="260" x2="1160" y2="260" stroke="#cbd5e1" stroke-width="1.5"/>
          <!-- Y轴 -->
          <line x1="50" y1="20" x2="50" y2="260" stroke="#94a3b8" stroke-width="2"/>
          <!-- Y轴刻度 -->
          <text x="45" y="25" font-size="13" fill="#64748b" text-anchor="end">{{ apiCallsData.yAxisLabels[0] }}</text>
          <text x="45" y="73" font-size="13" fill="#64748b" text-anchor="end">{{ apiCallsData.yAxisLabels[1] }}</text>
          <text x="45" y="121" font-size="13" fill="#64748b" text-anchor="end">{{ apiCallsData.yAxisLabels[2] }}</text>
          <text x="45" y="169" font-size="13" fill="#64748b" text-anchor="end">{{ apiCallsData.yAxisLabels[3] }}</text>
          <text x="45" y="217" font-size="13" fill="#64748b" text-anchor="end">{{ apiCallsData.yAxisLabels[4] }}</text>
          <text x="45" y="265" font-size="13" fill="#64748b" text-anchor="end">{{ apiCallsData.yAxisLabels[5] }}</text>
          <!-- X轴 -->
          <line x1="50" y1="260" x2="1160" y2="260" stroke="#cbd5e1" stroke-width="2"/>
          <text v-for="(date, i) in apiCallsData.dates" :key="i"
                :x="50 + i * (1110 / (apiCallsData.dates.length - 1 || 1))" 
                y="285" 
                font-size="13" 
                fill="#64748b" 
                text-anchor="middle">{{ date }}</text>
          <!-- 数据线 -->
          <path v-if="apiCallsData.areaPath" :d="apiCallsData.areaPath" 
                fill="url(#apiGradient1)" />
          <path v-if="apiCallsData.path" :d="apiCallsData.path" 
                fill="none" stroke="#6366f1" stroke-width="3" />
          <circle v-for="(point, i) in apiCallsData.points" :key="i"
                  :cx="point.x" :cy="point.y" r="5" fill="#6366f1" />
          <!-- 轴标签 -->
          <text x="605" y="315" font-size="14" fill="#475569" font-weight="600" text-anchor="middle">日期</text>
        </svg>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="line" style="background:#6366f1"></span>
            <span>成功请求</span>
          </div>
          <div class="legend-item">
            <span class="line" style="background:#ef4444"></span>
            <span>失败请求</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useStatsStore } from '@/stores/statsStore'
import { useNotification } from '@/composables/useNotification'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787/api'

const statsStore = useStatsStore()
const stats = computed(() => statsStore.stats)
const loading = computed(() => statsStore.loading)
const emailQuota = computed(() => statsStore.emailQuota)
const quotaLoading = computed(() => statsStore.quotaLoading)
const { showNotification } = useNotification()

const userTrendChart = ref(null)
const userSourceChart = ref(null)
const emailTrendChart = ref(null)
const emailSourceChart = ref(null)
const apiTrendChart = ref(null)

const unreadPercentage = computed(() => {
  if (stats.value.totalMessages === 0) return 0
  return ((stats.value.unreadMessages / stats.value.totalMessages) * 100).toFixed(1)
})

const loginMethodPercent = computed(() => {
  const methods = stats.value.loginMethods || {}
  const passwordCount = methods.password || 0
  const accountCount = methods.account || 0
  const total = passwordCount + accountCount
  
  // 如果没有数据，返回 0
  if (total === 0) {
    return {
      password: 0,
      account: 0
    }
  }
  
  return {
    password: ((passwordCount / total) * 100).toFixed(0),
    account: ((accountCount / total) * 100).toFixed(0)
  }
})

const loginMethodCircle = computed(() => {
  const methods = stats.value.loginMethods || {}
  const passwordCount = methods.password || 0
  const accountCount = methods.account || 0
  const total = passwordCount + accountCount
  const circumference = 2 * Math.PI * 80 // r=80 的圆周长
  
  // 如果没有数据，返回 0
  if (total === 0) {
    return {
      password: 0,
      account: 0
    }
  }
  
  return {
    password: ((passwordCount / total) * circumference).toFixed(1),
    account: ((accountCount / total) * circumference).toFixed(1)
  }
})

const emailSourcesData = computed(() => {
  const sources = stats.value.emailSources || {}
  const colors = ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#14b8a6', '#f97316']
  const entries = Object.entries(sources)
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1
  
  return entries.map(([domain, count], index) => ({
    domain: domain.startsWith('@') ? domain : `@${domain}`,
    count,
    percent: ((count / total) * 100).toFixed(0),
    color: colors[index % colors.length]
  }))
})

const emailSourcesCircle = computed(() => {
  const data = emailSourcesData.value
  const circumference = 2 * Math.PI * 80
  let offset = 0
  
  return data.map(item => {
    const dasharray = ((item.count / data.reduce((sum, d) => sum + d.count, 0) || 1) * circumference).toFixed(1)
    const result = {
      color: item.color,
      dasharray: `${dasharray} ${circumference - dasharray}`,
      dashoffset: offset === 0 ? 0 : `-${offset}`
    }
    offset += parseFloat(dasharray)
    return result
  })
})

const userGrowthData = computed(() => {
  const data = stats.value.userGrowth || []
  if (data.length === 0) return { path: '', points: [], dates: [], maxValue: 20, yAxisLabels: [20, 16, 12, 8, 4, 0] }
  
  const dataMax = Math.max(...data.map(d => d.count), 1)
  // 向上取整到5的倍数
  const maxValue = Math.ceil(dataMax / 5) * 5
  const scale = 240 / maxValue
  const xStep = 630 / (data.length - 1 || 1)
  
  const points = data.map((d, i) => {
    const x = 50 + i * xStep
    const y = 260 - d.count * scale
    return { x, y, count: d.count }
  })
  
  const pathData = points.map((p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  ).join(' ')
  
  const dates = data.map(d => {
    const date = new Date(d.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
  
  // 生成Y轴标签（5个刻度）
  const yAxisLabels = [
    maxValue,
    Math.round(maxValue * 0.8),
    Math.round(maxValue * 0.6),
    Math.round(maxValue * 0.4),
    Math.round(maxValue * 0.2),
    0
  ]
  
  return { path: pathData, points, dates, maxValue, yAxisLabels }
})

const emailGrowthData = computed(() => {
  const data = stats.value.emailGrowth || []
  if (data.length === 0) return { bars: [], dates: [], maxValue: 20, yAxisLabels: [20, 16, 12, 8, 4, 0] }
  
  const dataMax = Math.max(...data.map(d => Math.max(d.received, d.sent)), 1)
  // 向上取整到5的倍数
  const maxValue = Math.ceil(dataMax / 5) * 5
  const scale = 240 / maxValue
  const groupWidth = 630 / data.length
  const barWidth = groupWidth * 0.35
  
  const bars = data.map((d, i) => {
    const x = 50 + i * groupWidth + groupWidth * 0.15
    return {
      receivedX: x,
      receivedY: 260 - d.received * scale,
      receivedHeight: d.received * scale,
      sentX: x + barWidth + 5,
      sentY: 260 - d.sent * scale,
      sentHeight: d.sent * scale,
      received: d.received,
      sent: d.sent
    }
  })
  
  const dates = data.map(d => {
    const date = new Date(d.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
  
  // 生成Y轴标签（5个刻度）
  const yAxisLabels = [
    maxValue,
    Math.round(maxValue * 0.8),
    Math.round(maxValue * 0.6),
    Math.round(maxValue * 0.4),
    Math.round(maxValue * 0.2),
    0
  ]
  
  return { bars, dates, maxValue, yAxisLabels }
})

const apiCallsData = computed(() => {
  const data = stats.value.apiCalls || []
  if (data.length === 0) return { path: '', areaPath: '', points: [], dates: [], maxValue: 100, yAxisLabels: [100, 80, 60, 40, 20, 0] }
  
  const dataMax = Math.max(...data.map(d => d.count), 1)
  // 向上取整到5的倍数
  const maxValue = Math.ceil(dataMax / 5) * 5
  const scale = 240 / maxValue
  const xStep = 1110 / (data.length - 1 || 1)
  
  const points = data.map((d, i) => {
    const x = 50 + i * xStep
    const y = 260 - d.count * scale
    return { x, y, count: d.count }
  })
  
  const pathData = points.map((p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  ).join(' ')
  
  const areaPath = pathData + ` L ${points[points.length - 1].x} 260 L 50 260 Z`
  
  const dates = data.map(d => {
    const date = new Date(d.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
  
  // 生成Y轴标签（5个刻度）
  const yAxisLabels = [
    maxValue,
    Math.round(maxValue * 0.8),
    Math.round(maxValue * 0.6),
    Math.round(maxValue * 0.4),
    Math.round(maxValue * 0.2),
    0
  ]
  
  return { path: pathData, areaPath, points, dates, maxValue, yAxisLabels }
})

const refreshSuccess = ref(false)
const isTransitioning = ref(false)
const disabledServices = ref(new Set())
const hoveredSegment = ref(null)

const refreshData = async () => {
  try {
    refreshSuccess.value = false
    isTransitioning.value = false
    await Promise.all([
      statsStore.loadStats(),
      statsStore.loadEmailQuota()
    ])

    // 显示刷新完成状态
    refreshSuccess.value = true
    
    // 2秒后开始过渡
    setTimeout(() => {
      isTransitioning.value = true
    }, 2000)
    
    // 2.5秒后恢复初始状态
    setTimeout(() => {
      refreshSuccess.value = false
      isTransitioning.value = false
    }, 2500)
  } catch (error) {
    console.error('Failed to refresh stats:', error)
    showNotification('数据刷新失败', 'error')
    refreshSuccess.value = false
    isTransitioning.value = false
  }
}

// 格式化额度更新时间
const formatQuotaTime = (isoString) => {
  if (!isoString) return '未知'
  const date = new Date(isoString)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return date.toLocaleString('zh-CN')
}

// 获取额度徽章样式
const getQuotaBadgeClass = (percentage) => {
  if (percentage >= 70) return 'success'
  if (percentage >= 30) return 'warning'
  return 'danger'
}

// 获取进度条样式
const getProgressClass = (percentage) => {
  if (percentage >= 70) return 'success'
  if (percentage >= 30) return 'warning'
  return 'danger'
}

// 检查服务商是否被禁用
const isServiceDisabled = (serviceName) => {
  return disabledServices.value.has(serviceName)
}

// 切换服务商启用/禁用状态
const toggleService = async (serviceName) => {
  try {
    const isCurrentlyDisabled = disabledServices.value.has(serviceName)
    const newStatus = !isCurrentlyDisabled

    // 调用后端 API
    const response = await axios.post(`${API_BASE}/monitor/quota/toggle`, {
      service: serviceName,
      disabled: newStatus
    })

    if (response.data.success) {
      // 更新本地状态
      if (newStatus) {
        disabledServices.value.add(serviceName)
      } else {
        disabledServices.value.delete(serviceName)
      }

      showNotification(
        newStatus ? `已禁用 ${serviceName}` : `已启用 ${serviceName}`,
        'success'
      )
    }
  } catch (error) {
    console.error('Toggle service error:', error)
    showNotification('切换服务商状态失败', 'error')
  }
}

// 加载禁用的服务商列表
const loadDisabledServices = async () => {
  try {
    const response = await axios.get(`${API_BASE}/monitor/quota/disabled`)
    const disabled = response.data.data || []
    disabledServices.value = new Set(disabled)
  } catch (error) {
    console.error('Load disabled services error:', error)
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      statsStore.loadStats(),
      statsStore.loadEmailQuota(),
      loadDisabledServices()
    ])
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
})
</script>

<style scoped>
.stats-page {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.stats-header {
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-header h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
  animation: successPulse 0.6s ease-out;
}

.refresh-btn.success:hover:not(:disabled) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.refresh-btn.success:hover:not(:disabled) .check-icon {
  transform: none !important;
}

.refresh-btn.transitioning {
  animation: fadeOutToBlue 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.refresh-btn svg.spinning {
  animation: spin 1s linear infinite;
}

.check-icon {
  animation: checkIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Icon 淡入淡出动画 */
.icon-fade-enter-active, .icon-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.icon-fade-enter-from {
  opacity: 0;
  transform: scale(0.8) rotate(-90deg);
}

.icon-fade-leave-to {
  opacity: 0;
  transform: scale(0.8) rotate(90deg);
}

/* Text 淡入淡出动画 */
.text-fade-enter-active, .text-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.text-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.text-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes successPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes checkIn {
  0% {
    transform: scale(0) rotate(-45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes fadeOutToBlue {
  0% {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    opacity: 1;
  }
  100% {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    opacity: 1;
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(230, 232, 240, 0.8);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 16px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.email-icon {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.unread-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.message-icon {
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  color: white;
}

.user-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-label {
  margin: 0 0 4px 0;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.card-value {
  margin: 0 0 4px 0;
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.card-desc {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(230, 232, 240, 0.8);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-card h4 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h4 {
  margin: 0;
}

.chart-legend-inline {
  display: flex;
  gap: 16px;
}

.chart-legend-inline .legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.line-chart {
  height: 360px;
  padding: 10px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.line-chart svg {
  width: 100%;
  height: 100%;
  max-width: 700px;
}

/* 饼图容器 - 左右布局 */
.pie-chart-container {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 20px;
  min-height: 280px;
}

.pie-chart-left {
  flex-shrink: 0;
}

.pie-svg {
  width: 200px;
  height: 200px;
}

.pie-segment {
  cursor: pointer;
  transition: opacity 0.2s;
}

.pie-segment:hover {
  opacity: 0.8;
}

/* 右侧图例 */
.pie-legend-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item-right {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f8fafc;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
}

.legend-item-right:hover,
.legend-item-right.hovered {
  background: #e0e7ff;
  transform: translateX(4px);
}

.legend-domain {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.domain-text {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.percent-text {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

/* 旧的饼图样式（保留以防其他地方使用） */
.pie-chart {
  height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 20px;
}

.pie-chart svg {
  width: 200px;
  height: 200px;
}

.pie-legend {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
}

.line {
  width: 20px;
  height: 3px;
  border-radius: 2px;
}

.pie-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.pie-value {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
}

.pie-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.bar-chart {
  height: 360px;
  padding: 10px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bar-chart svg {
  width: 100%;
  height: 100%;
  max-width: 700px;
}

.bar-group {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.bar {
  width: 100%;
  max-width: 40px;
  border-radius: 6px 6px 0 0;
  position: relative;
  transition: all 0.3s;
}

.bar.received {
  background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
}

.bar.sent {
  background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
}

.bar-label {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: #64748b;
  white-space: nowrap;
}

.area-chart {
  height: 360px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%);
  border-radius: 12px;
  position: relative;
}

.area-chart svg {
  width: 100%;
  height: calc(100% - 30px);
}

.chart-legend {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-top: 10px;
}

@media (max-width: 1200px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-page {
    padding: 20px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }
}

/* 邮件额度样式 */
.quota-section {
  margin-top: 30px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
}

.quota-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.quota-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.quota-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.quota-card.quota-error {
  border-color: #fecaca;
  background: #fef2f2;
}

.quota-card.quota-disabled {
  opacity: 0.6;
  border-color: #cbd5e1;
  background: #f8fafc;
}

.quota-card.quota-summary {
  border: 2px solid #6366f1;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
}

.quota-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.quota-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quota-header h4 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.disabled-badge {
  padding: 2px 8px;
  background: #cbd5e1;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
  border-radius: 8px;
  text-transform: uppercase;
}

.quota-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-btn {
  padding: 6px;
  background: transparent;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.toggle-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #475569;
}

.toggle-btn.disabled {
  border-color: #10b981;
  color: #10b981;
}

.toggle-btn.disabled:hover {
  background: #d1fae5;
  border-color: #059669;
  color: #059669;
}

.toggle-btn svg {
  display: block;
}

.quota-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.quota-badge.success {
  background: #d1fae5;
  color: #065f46;
}

.quota-badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.quota-badge.danger {
  background: #fee2e2;
  color: #991b1b;
}

.quota-badge.error {
  background: #fecaca;
  color: #991b1b;
}

.quota-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quota-progress {
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-fill.success {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.progress-fill.warning {
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
}

.progress-fill.danger {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}

.quota-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.quota-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.stat-value.highlight {
  color: #6366f1;
}

.quota-unit {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.quota-note {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
  font-style: italic;
}

.quota-update {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
  text-align: right;
}



.quota-error-msg {
  padding: 12px;
  background: #fee2e2;
  border-radius: 8px;
  color: #991b1b;
  font-size: 14px;
}

.quota-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.quota-empty {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
  font-size: 14px;
}
</style>

