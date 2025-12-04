<template>
  <div class="main-layout">
    <!-- 邮箱生成器 -->
    <div class="card">
      <div class="card-header">
        <div class="email-generator">
          <!-- 域名选择 -->
          <div class="domain-selector">
            <label>
              <svg class="label-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              选择域名
            </label>
            <div class="custom-select" ref="selectRef" @click="toggleDropdown" v-click-outside="closeDropdown">
              <div class="select-trigger">
                <span class="selected-value">{{ selectedDomain || '请选择域名' }}</span>
                <svg class="select-arrow" :class="{ open: isDropdownOpen }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
              <Teleport to="body">
                <div
                  v-if="isDropdownOpen"
                  class="select-dropdown"
                  :style="dropdownStyle"
                >
                  <div
                    v-for="domain in domains"
                    :key="domain.domain"
                    class="select-option"
                    :class="{ selected: domain.domain === selectedDomain }"
                    @click="selectDomain(domain.domain)"
                  >
                    <span>{{ domain.domain }} · {{ domain.type }}</span>
                    <svg v-if="domain.domain === selectedDomain" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  </div>
                </div>
              </Teleport>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="actions">
            <button
              class="btn btn-primary generate-btn"
              @click="createMailbox"
              :disabled="loading.create || !selectedDomain"
            >
              <svg v-if="!loading.create" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14m-7-7h14"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
              <span v-else class="loading-spinner"></span>
              <span>{{ loading.create ? '创建中...' : '🎲 生成随机邮箱' }}</span>
            </button>

            <button
              class="btn btn-secondary restore-btn"
              @click="showRestoreDialog = true"
              title="恢复已有邮箱"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
              </svg>
              <span>恢复邮箱</span>
            </button>

            <button
              v-if="mailboxList.length > 0"
              class="btn btn-ghost delete-all-btn"
              @click="deleteAllMailboxes"
              title="删除所有邮箱"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                <path d="M10 11v6m4-6v6"/>
              </svg>
              <span>删除所有邮箱</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 两列布局 -->
    <div class="two-col">
      <!-- 左侧：临时邮箱列表 -->
      <div class="left-pane">
        <div class="card email-list-card">
          <div class="card-body">
            <!-- 加载骨架屏 -->
            <SkeletonLoader
              v-if="loading.mailboxes && mailboxList.length === 0"
              type="email-list"
              :count="3"
            />

            <!-- 空状态 -->
            <FadeTransition v-else-if="!loading.mailboxes && mailboxList.length === 0" type="scale-fade">
              <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>暂无临时邮箱</p>
                <p class="text-muted">点击上方按钮创建邮箱</p>
              </div>
            </FadeTransition>

            <!-- 邮箱列表 -->
            <FadeTransition v-else type="fade" :duration="400">
              <div>
                <div class="list-header">
                  <h2>
                    <svg class="title-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    临时邮箱列表
                    <span v-if="selectedMailboxes.size > 0" class="selection-count">
                      (已选 {{ selectedMailboxes.size }})
                    </span>
                  </h2>
                  <div class="header-actions">
                    <button
                      v-if="selectedMailboxes.size > 0"
                      class="btn-icon btn-danger"
                      @click="deleteSelectedMailboxes"
                      title="删除选中"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                      </svg>
                    </button>
                    <button
                      class="btn-icon btn-secondary"
                      @click="refreshAllMailboxes"
                      title="刷新"
                      :disabled="loading.refresh"
                    >
                      <svg :class="{ spinning: loading.refresh }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10"/>
                        <polyline points="1 20 1 14 7 14"/>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                      </svg>
                    </button>
                    <button
                      v-if="mailboxList.length > 0"
                      class="btn-icon btn-danger"
                      @click="deleteAllMailboxes"
                      title="删除全部"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="email-items">
                  <div
                    v-for="mailbox in paginatedMailboxList"
                    :key="mailbox.email"
                    :class="['email-item', 'fade-in-item', { active: currentMailbox?.email === mailbox.email, selected: selectedMailboxes.has(mailbox.email) }]"
                  >
                <div class="email-item-header">
                  <label @click.stop :class="{ 'checkbox-disabled': mailbox.starred }">
                    <input
                      type="checkbox"
                      :checked="selectedMailboxes.has(mailbox.email)"
                      :disabled="mailbox.starred"
                      @change="toggleMailboxSelection(mailbox.email)"
                    />
                  </label>
                  <button
                    class="btn-star"
                    @click.stop="toggleStar(mailbox)"
                    :title="mailbox.starred ? '取消星标' : '添加星标'"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" :fill="mailbox.starred ? '#f59e0b' : 'none'" stroke="currentColor" stroke-width="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>
                  <div class="email-info" @click="selectMailbox(mailbox)">
                    <div class="email-address">{{ mailbox.email }}</div>
                    <div class="email-meta">
                      <span class="meta-item">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        </svg>
                        {{ mailbox.messageCount || 0 }} 封邮件
                      </span>
                      <span class="meta-item">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {{ formatTime(mailbox.created_at) }}
                      </span>
                    </div>
                  </div>
                  <div class="email-actions" @click.stop>
                    <button
                      class="btn-icon-small"
                      @click="copyToClipboard(mailbox.email)"
                      title="复制"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    </button>
                    <button
                      class="btn-icon-small"
                      @click="deleteMailbox(mailbox)"
                      :disabled="mailbox.starred"
                      :title="mailbox.starred ? '星标邮箱无法删除' : '删除'"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                  </div>
                </div>

                <!-- 邮箱列表分页 -->
                <div v-if="mailboxTotalPages > 1" class="pagination">
                  <button
                    class="pagination-btn"
                    @click="firstMailboxPage"
                    :disabled="mailboxCurrentPage === 1"
                    title="首页"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>
                    </svg>
                  </button>
                  
                  <button
                    class="pagination-btn"
                    @click="prevMailboxPage"
                    :disabled="mailboxCurrentPage === 1"
                    title="上一页"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                  </button>
                  
                  <div class="page-numbers">
                    <button
                      v-for="page in mailboxVisiblePages"
                      :key="page"
                      class="page-number-btn"
                      :class="{ active: page === mailboxCurrentPage }"
                      @click="goMailboxPage(page)"
                      :disabled="page === '...'"
                    >
                      {{ page }}
                    </button>
                  </div>
                  
                  <button
                    class="pagination-btn"
                    @click="nextMailboxPage"
                    :disabled="mailboxCurrentPage === mailboxTotalPages"
                    title="下一页"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </button>
                  
                  <button
                    class="pagination-btn"
                    @click="lastMailboxPage"
                    :disabled="mailboxCurrentPage === mailboxTotalPages"
                    title="末页"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m13 17 5-5-5-5M6 17l5-5-5-5"/>
                    </svg>
                  </button>
                  
                  <span class="page-info-detail">
                    共 {{ sortedMailboxList.length }} 个邮箱，第 {{ mailboxCurrentPage }} / {{ mailboxTotalPages }} 页
                  </span>
                </div>
              </div>
            </FadeTransition>
          </div>
        </div>
      </div>

      <!-- 右侧：收件箱 -->
      <div class="right-pane">
        <div class="card message-list-card">
          <div class="card-body">
            <!-- 加载骨架屏 -->
            <SkeletonLoader
              v-if="loading.messages && messages.length === 0"
              type="message-list"
              :count="3"
            />

            <!-- 未选择邮箱 -->
            <FadeTransition v-else-if="!currentMailbox" type="scale-fade">
              <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>请先创建临时邮箱</p>
              </div>
            </FadeTransition>

            <!-- 空收件箱 -->
            <FadeTransition v-else-if="!loading.messages && messages.length === 0" type="scale-fade">
              <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>收件箱为空</p>
                <p class="text-muted">向 {{ currentMailbox.email }} 发送邮件</p>
              </div>
            </FadeTransition>

            <!-- 邮件列表 -->
            <FadeTransition v-else type="fade" :duration="400">
              <div>
                <div class="list-header">
                  <h2>
                    <svg class="title-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                    </svg>
                    收件箱
                    <span v-if="messages.length > 0" class="message-count-badge">
                      {{ messages.length }}
                      <span v-if="unreadCount > 0" class="unread-count">{{ unreadCount }} 未读</span>
                    </span>
                    <span v-if="selectedMessages.size > 0" class="selection-count">
                      (已选 {{ selectedMessages.size }})
                    </span>
                  </h2>
                  <div class="header-actions">
                    <label v-if="currentMailbox" class="auto-refresh-label">
                      <input
                        type="checkbox"
                        v-model="autoRefresh"
                        @change="toggleAutoRefresh"
                      />
                      <span>自动刷新</span>
                    </label>
                    <button
                      v-if="selectedMessages.size > 0"
                      class="btn-icon btn-danger"
                      @click="deleteSelectedMessages"
                      title="删除选中"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                      </svg>
                    </button>
                    <button
                      v-if="currentMailbox"
                      class="btn-icon btn-secondary"
                      @click="refreshMessages"
                      :disabled="loading.messages"
                      title="刷新"
                    >
                      <svg :class="{ spinning: loading.messages }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10"/>
                        <polyline points="1 20 1 14 7 14"/>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                      </svg>
                    </button>
                    <button
                      v-if="currentMailbox && messages.length > 0"
                      class="btn-icon btn-danger"
                      @click="deleteAllMessages"
                      title="删除全部"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="message-items">
                  <div
                    v-for="message in paginatedMessages"
                    :key="message.hash_id"
                    :class="['message-item', 'fade-in-item', {
                      selected: selectedMessages.has(message.hash_id),
                      unread: !readMessages.has(message.hash_id)
                    }]"
                  >
                <label class="message-checkbox" @click.stop>
                  <input
                    type="checkbox"
                    :checked="selectedMessages.has(message.hash_id)"
                    @change="toggleMessageSelection(message.hash_id)"
                  />
                </label>
                <div class="message-content-wrapper" @click="viewMessage(message.hash_id)">
                  <div class="message-header-row">
                    <div class="message-from">{{ message.from }}</div>
                    <div class="message-time">{{ formatTime(message) }}</div>
                  </div>
                  <div class="message-subject">{{ message.subject }}</div>
                  <div class="message-preview">{{ getMessagePreview(message) }}</div>
                  <div class="message-meta">
                    <span v-if="message.has_attachments" class="attachment-badge">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                      </svg>
                      附件
                    </span>
                    <span v-if="message.verification_code" class="verification-badge">
                      验证码: {{ message.verification_code }}
                    </span>
                  </div>
                </div>
                <div class="message-actions" @click.stop>
                  <button
                    v-if="message.verification_code"
                    class="btn-action-badge"
                    @click="copyToClipboard(message.verification_code)"
                    title="复制验证码"
                  >
                    验证码: {{ message.verification_code }}
                  </button>
                  <button
                    class="btn-icon-small"
                    @click="deleteMessage(message.hash_id)"
                    title="删除"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                    </svg>
                  </button>
                </div>
                  </div>
                </div>

                <!-- 收件箱分页 -->
                <div v-if="messageTotalPages > 1" class="pagination">
                  <button
                    class="pagination-btn"
                    @click="firstMessagePage"
                    :disabled="messageCurrentPage === 1"
                    title="首页"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>
                    </svg>
                  </button>
                  
                  <button
                    class="pagination-btn"
                    @click="prevMessagePage"
                    :disabled="messageCurrentPage === 1"
                    title="上一页"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                  </button>
                  
                  <div class="page-numbers">
                    <button
                      v-for="page in messageVisiblePages"
                      :key="page"
                      class="page-number-btn"
                      :class="{ active: page === messageCurrentPage }"
                      @click="goMessagePage(page)"
                      :disabled="page === '...'"
                    >
                      {{ page }}
                    </button>
                  </div>
                  
                  <button
                    class="pagination-btn"
                    @click="nextMessagePage"
                    :disabled="messageCurrentPage === messageTotalPages"
                    title="下一页"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </button>
                  
                  <button
                    class="pagination-btn"
                    @click="lastMessagePage"
                    :disabled="messageCurrentPage === messageTotalPages"
                    title="末页"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m13 17 5-5-5-5M6 17l5-5-5-5"/>
                    </svg>
                  </button>
                  
                  <span class="page-info-detail">
                    共 {{ messages.length }} 封邮件，第 {{ messageCurrentPage }} / {{ messageTotalPages }} 页
                  </span>
                </div>
              </div>
            </FadeTransition>
          </div>
        </div>
      </div>
    </div>

    <!-- 邮件详情弹窗 -->
    <div v-if="selectedMessage" class="modal-overlay" @click="selectedMessage = null">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">
          <h3>📧 邮件详情</h3>
          <button @click="selectedMessage = null" class="modal-close">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="detail-row">
            <strong>发件人:</strong>
            <span>{{ selectedMessage.from }}</span>
          </div>
          <div class="detail-row">
            <strong>主题:</strong>
            <span>{{ selectedMessage.subject }}</span>
          </div>
          <div class="detail-row">
            <strong>时间:</strong>
            <span>{{ formatDate(selectedMessage) }}</span>
          </div>

          <div v-if="selectedMessage.attachments?.length > 0" class="attachments-section">
            <strong>附件:</strong>
            <div
              v-for="(att, index) in selectedMessage.attachments"
              :key="index"
              class="attachment-item"
            >
              <span>{{ att.filename }} ({{ formatSize(att.size) }})</span>
              <a :href="att.link" target="_blank" class="btn btn-sm btn-secondary">
                下载
              </a>
            </div>
          </div>

          <div class="message-content">
            <strong>内容:</strong>
            <div v-html="selectedMessage.body" class="body-html"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 恢复邮箱对话框 -->
    <Teleport to="body">
      <div v-if="showRestoreDialog" class="modal-overlay" @click="showRestoreDialog = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>恢复已有邮箱</h3>
            <button class="close-btn" @click="showRestoreDialog = false">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <p class="hint-text">请输入您之前创建的邮箱地址（如果还在30分钟有效期内）</p>
            <input
              v-model="restoreEmail"
              type="text"
              class="restore-input"
              placeholder="例如: 9tphqsje@tempmailapi.com"
              @keyup.enter="restoreMailbox"
            />
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showRestoreDialog = false">取消</button>
            <button
              class="btn btn-primary"
              @click="restoreMailbox"
              :disabled="!restoreEmail || loading.restore"
            >
              <span v-if="loading.restore" class="loading-spinner"></span>
              <span>{{ loading.restore ? '恢复中...' : '恢复邮箱' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, onUnmounted, onMounted, watch, computed } from 'vue';
import { tempMailApi } from '../services/tempMailApiService.js';
import { useNotification } from '../composables/useNotification';
import SkeletonLoader from './SkeletonLoader.vue';
import FadeTransition from './FadeTransition.vue';

const { showNotification } = useNotification();

// LocalStorage 键名
const STORAGE_KEY_MAILBOXES = 'tempmailapi_mailboxes';
const STORAGE_KEY_CURRENT = 'tempmailapi_current_mailbox';

// 从 localStorage 加载数据
const loadFromStorage = () => {
  try {
    const savedMailboxes = localStorage.getItem(STORAGE_KEY_MAILBOXES);
    const savedCurrent = localStorage.getItem(STORAGE_KEY_CURRENT);

    console.log('📥 [TempMailApi] 从 localStorage 加载数据:', {
      hasMailboxes: !!savedMailboxes,
      hasCurrent: !!savedCurrent,
      mailboxesLength: savedMailboxes ? JSON.parse(savedMailboxes).length : 0
    });

    if (savedMailboxes) {
      mailboxList.value = JSON.parse(savedMailboxes);
      console.log('✅ [TempMailApi] 成功加载邮箱列表:', mailboxList.value.length, '个邮箱');
    } else {
      console.log('⚠️ [TempMailApi] localStorage 中没有保存的邮箱数据');
    }

    if (savedCurrent) {
      currentMailbox.value = JSON.parse(savedCurrent);
      console.log('✅ [TempMailApi] 成功加载当前邮箱:', currentMailbox.value.email);
    }
  } catch (error) {
    console.error('❌ [TempMailApi] 加载本地数据失败:', error);
  }
};

// 保存到 localStorage
const saveToStorage = () => {
  try {
    const mailboxesData = JSON.stringify(mailboxList.value);
    localStorage.setItem(STORAGE_KEY_MAILBOXES, mailboxesData);
    console.log('💾 [TempMailApi] 保存邮箱列表到 localStorage:', mailboxList.value.length, '个邮箱');

    if (currentMailbox.value) {
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(currentMailbox.value));
      console.log('💾 [TempMailApi] 保存当前邮箱:', currentMailbox.value.email);
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT);
      console.log('💾 [TempMailApi] 清除当前邮箱');
    }

    // 验证保存是否成功
    const saved = localStorage.getItem(STORAGE_KEY_MAILBOXES);
    if (saved !== mailboxesData) {
      console.error('❌ [TempMailApi] localStorage 保存验证失败！');
    } else {
      console.log('✅ [TempMailApi] localStorage 保存验证成功');
    }
  } catch (error) {
    console.error('❌ [TempMailApi] 保存本地数据失败:', error);
    if (error.name === 'QuotaExceededError') {
      showNotification('存储空间不足，无法保存邮箱数据', 'error');
    }
  }
};

// 状态
const selectedDomain = ref('');
const domains = ref([]);
const mailboxList = ref([]); // 邮箱列表
const currentMailbox = ref(null); // 当前选中的邮箱
const messages = ref([]);
const selectedMessage = ref(null);
const autoRefresh = ref(false);
const selectedMailboxes = ref(new Set()); // 选中的邮箱
const selectedMessages = ref(new Set()); // 选中的邮件
const readMessages = ref(new Set()); // 已读邮件ID集合

// 分页状态 - 邮箱列表
const mailboxPageSize = 5;
const mailboxCurrentPage = ref(1);

// 分页状态 - 收件箱
const messagePageSize = 4;
const messageCurrentPage = ref(1);

// 下拉框状态
const isDropdownOpen = ref(false);
const selectRef = ref(null);
const dropdownStyle = ref({});

// 恢复邮箱状态
const showRestoreDialog = ref(false);
const restoreEmail = ref('');

// 加载状态
const loading = ref({
  domains: false,
  create: false,
  messages: false,
  refresh: false,
  mailboxes: false,
  restore: false
});

// 计算未读邮件数
const unreadCount = computed(() => {
  return messages.value.filter(msg => !readMessages.value.has(msg.hash_id)).length;
});

// 计算排序后的邮箱列表（星标邮箱置顶）
const sortedMailboxList = computed(() => {
  return [...mailboxList.value].sort((a, b) => {
    // 星标邮箱优先
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;

    // 同类邮箱按创建时间倒序（最新的在前）
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return dateB - dateA;
  });
});

// 分页后的邮箱列表
const paginatedMailboxList = computed(() => {
  const start = (mailboxCurrentPage.value - 1) * mailboxPageSize;
  const end = start + mailboxPageSize;
  return sortedMailboxList.value.slice(start, end);
});

// 邮箱列表总页数
const mailboxTotalPages = computed(() => {
  return Math.ceil(sortedMailboxList.value.length / mailboxPageSize) || 1;
});

// 分页后的邮件列表
const paginatedMessages = computed(() => {
  const start = (messageCurrentPage.value - 1) * messagePageSize;
  const end = start + messagePageSize;
  return messages.value.slice(start, end);
});

// 邮件列表总页数
const messageTotalPages = computed(() => {
  return Math.ceil(messages.value.length / messagePageSize) || 1;
});

// 计算可见的邮箱页码
const mailboxVisiblePages = computed(() => {
  const pages = [];
  const total = mailboxTotalPages.value;
  const current = mailboxCurrentPage.value;
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current <= 3) {
      pages.push(2, 3, 4, '...', total);
    } else if (current >= total - 2) {
      pages.push('...', total - 3, total - 2, total - 1, total);
    } else {
      pages.push('...', current - 1, current, current + 1, '...', total);
    }
  }
  return pages;
});

// 计算可见的邮件页码
const messageVisiblePages = computed(() => {
  const pages = [];
  const total = messageTotalPages.value;
  const current = messageCurrentPage.value;
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current <= 3) {
      pages.push(2, 3, 4, '...', total);
    } else if (current >= total - 2) {
      pages.push('...', total - 3, total - 2, total - 1, total);
    } else {
      pages.push('...', current - 1, current, current + 1, '...', total);
    }
  }
  return pages;
});

// 邮箱分页方法
const goMailboxPage = (page) => {
  if (typeof page !== 'number') return;
  if (page < 1 || page > mailboxTotalPages.value) return;
  mailboxCurrentPage.value = page;
};

const prevMailboxPage = () => {
  if (mailboxCurrentPage.value > 1) {
    mailboxCurrentPage.value--;
  }
};

const nextMailboxPage = () => {
  if (mailboxCurrentPage.value < mailboxTotalPages.value) {
    mailboxCurrentPage.value++;
  }
};

const firstMailboxPage = () => {
  mailboxCurrentPage.value = 1;
};

const lastMailboxPage = () => {
  mailboxCurrentPage.value = mailboxTotalPages.value;
};

// 邮件分页方法
const goMessagePage = (page) => {
  if (typeof page !== 'number') return;
  if (page < 1 || page > messageTotalPages.value) return;
  messageCurrentPage.value = page;
};

const prevMessagePage = () => {
  if (messageCurrentPage.value > 1) {
    messageCurrentPage.value--;
  }
};

const nextMessagePage = () => {
  if (messageCurrentPage.value < messageTotalPages.value) {
    messageCurrentPage.value++;
  }
};

const firstMessagePage = () => {
  messageCurrentPage.value = 1;
};

const lastMessagePage = () => {
  messageCurrentPage.value = messageTotalPages.value;
};

// 轮询控制
let stopPolling = null;
let messageCountMap = new Map(); // 存储每个邮箱的邮件数量

// 监听邮箱列表和当前邮箱的变化，自动保存
watch(mailboxList, () => {
  saveToStorage();
}, { deep: true });

watch(currentMailbox, () => {
  saveToStorage();
}, { deep: true });

// 加载域名
async function loadDomains() {
  loading.value.domains = true;
  try {
    domains.value = await tempMailApi.getDomains('free');
    if (domains.value.length > 0) {
      selectedDomain.value = domains.value[0].domain;
    }
  } catch (error) {
    showNotification('加载域名失败: ' + error.message, 'error');
  } finally {
    loading.value.domains = false;
  }
}

// 创建邮箱
async function createMailbox() {
  if (!selectedDomain.value) {
    showNotification('请选择域名', 'error');
    return;
  }

  loading.value.create = true;
  try {
    // 创建随机邮箱（指定域名）
    const mailbox = await tempMailApi.createMailbox(null, selectedDomain.value);

    // 添加到邮箱列表
    mailbox.messageCount = 0;
    mailboxList.value.unshift(mailbox);

    // 自动选中新创建的邮箱
    currentMailbox.value = mailbox;
    messages.value = [];

    showNotification(`邮箱创建成功: ${mailbox.email}`, 'success');

    // 自动开始轮询
    if (autoRefresh.value) {
      startPolling();
    }
  } catch (error) {
    showNotification('创建邮箱失败: ' + error.message, 'error');
  } finally {
    loading.value.create = false;
  }
}

// 恢复已有邮箱
async function restoreMailbox() {
  const email = restoreEmail.value.trim();
  if (!email) {
    showNotification('请输入邮箱地址', 'error');
    return;
  }

  // 验证邮箱格式
  if (!email.includes('@')) {
    showNotification('邮箱格式不正确', 'error');
    return;
  }

  // 检查是否已存在
  if (mailboxList.value.find(m => m.email === email)) {
    showNotification('该邮箱已在列表中', 'warning');
    showRestoreDialog.value = false;
    restoreEmail.value = '';
    return;
  }

  loading.value.restore = true;
  try {
    // 尝试获取该邮箱的邮件，验证邮箱是否有效
    const msgs = await tempMailApi.getMessages(email);

    // 创建邮箱对象
    const mailbox = {
      email: email,
      created_at: new Date().toISOString(),
      messageCount: msgs.length,
      starred: false
    };

    // 添加到邮箱列表
    mailboxList.value.unshift(mailbox);

    // 自动选中恢复的邮箱
    currentMailbox.value = mailbox;
    messages.value = [];

    showNotification(`邮箱恢复成功: ${email}`, 'success');
    showRestoreDialog.value = false;
    restoreEmail.value = '';

    // 刷新邮件
    await refreshMessages();

    // 自动开始轮询
    if (autoRefresh.value) {
      startPolling();
    }
  } catch (error) {
    showNotification('恢复邮箱失败: ' + error.message + '（邮箱可能已过期或不存在）', 'error');
  } finally {
    loading.value.restore = false;
  }
}

// 选择邮箱
async function selectMailbox(mailbox) {
  currentMailbox.value = mailbox;

  // 先清空邮件列表和已读状态，避免显示错误的未读状态
  messages.value = [];
  selectedMessage.value = null;
  
  // 重置邮件分页到第一页
  messageCurrentPage.value = 1;

  // 加载该邮箱的已读消息
  loadReadMessages();

  // 加载邮件
  await refreshMessages();

  // 如果开启了自动刷新，重新开始轮询
  if (autoRefresh.value) {
    stopAutoRefresh();
    startPolling();
  }
}

// 刷新所有邮箱
async function refreshAllMailboxes() {
  loading.value.refresh = true;
  try {
    // 刷新每个邮箱的邮件数量
    for (const mailbox of mailboxList.value) {
      try {
        const msgs = await tempMailApi.getMessages(mailbox.email);
        mailbox.messageCount = msgs.length;
        messageCountMap.set(mailbox.email, msgs.length);
      } catch (error) {
        console.error(`刷新邮箱 ${mailbox.email} 失败:`, error);
      }
    }
    showNotification('刷新完成', 'success');
  } catch (error) {
    showNotification('刷新失败: ' + error.message, 'error');
  } finally {
    loading.value.refresh = false;
  }
}

// 切换邮箱选中状态
function toggleMailboxSelection(email) {
  if (selectedMailboxes.value.has(email)) {
    selectedMailboxes.value.delete(email);
  } else {
    selectedMailboxes.value.add(email);
  }
  // 触发响应式更新
  selectedMailboxes.value = new Set(selectedMailboxes.value);
}

// 切换星标
function toggleStar(mailbox) {
  mailbox.starred = !mailbox.starred;

  // 如果设为星标，从选中列表中移除
  if (mailbox.starred && selectedMailboxes.value.has(mailbox.email)) {
    selectedMailboxes.value.delete(mailbox.email);
    selectedMailboxes.value = new Set(selectedMailboxes.value);
  }

  // 触发保存
  saveToStorage();
}

// 删除单个邮箱
async function deleteMailbox(mailbox) {
  if (!confirm(`确定要删除邮箱 ${mailbox.email} 吗？`)) return;

  try {
    await tempMailApi.deleteMailbox(mailbox.email);

    // 从列表中移除
    const index = mailboxList.value.findIndex(m => m.email === mailbox.email);
    if (index > -1) {
      mailboxList.value.splice(index, 1);
    }

    // 从选中列表中移除
    selectedMailboxes.value.delete(mailbox.email);
    selectedMailboxes.value = new Set(selectedMailboxes.value);

    // 如果删除的是当前邮箱，清空选择
    if (currentMailbox.value?.email === mailbox.email) {
      currentMailbox.value = null;
      messages.value = [];
      stopAutoRefresh();
    }

    showNotification('邮箱已删除', 'success');
  } catch (error) {
    showNotification('删除失败: ' + error.message, 'error');
  }
}

// 删除选中的邮箱
async function deleteSelectedMailboxes() {
  // 过滤掉星标邮箱
  const emailsToDelete = Array.from(selectedMailboxes.value).filter(email => {
    const mailbox = mailboxList.value.find(m => m.email === email);
    return mailbox && !mailbox.starred;
  });

  if (emailsToDelete.length === 0) {
    showNotification('没有可删除的邮箱（星标邮箱无法删除）', 'warning');
    return;
  }

  const count = emailsToDelete.length;
  const starredCount = selectedMailboxes.value.size - emailsToDelete.length;

  let confirmMessage = `确定要删除选中的 ${count} 个邮箱吗？`;
  if (starredCount > 0) {
    confirmMessage = `确定要删除选中的 ${count} 个邮箱吗？\n（${starredCount} 个星标邮箱将被跳过）`;
  }

  if (!confirm(confirmMessage)) return;

  try {
    for (const email of emailsToDelete) {
      try {
        await tempMailApi.deleteMailbox(email);

        // 从列表中移除
        const index = mailboxList.value.findIndex(m => m.email === email);
        if (index > -1) {
          mailboxList.value.splice(index, 1);
        }

        // 如果删除的是当前邮箱，清空选择
        if (currentMailbox.value?.email === email) {
          currentMailbox.value = null;
          messages.value = [];
          stopAutoRefresh();
        }
      } catch (error) {
        console.error(`删除邮箱 ${email} 失败:`, error);
      }
    }

    // 清空选中列表
    selectedMailboxes.value.clear();
    selectedMailboxes.value = new Set();

    showNotification(`已删除 ${count} 个邮箱`, 'success');
  } catch (error) {
    showNotification('删除失败: ' + error.message, 'error');
  }
}

// 删除所有邮箱
async function deleteAllMailboxes() {
  // 过滤掉星标邮箱
  const mailboxesToDelete = mailboxList.value.filter(m => !m.starred);
  const starredCount = mailboxList.value.length - mailboxesToDelete.length;

  if (mailboxesToDelete.length === 0) {
    showNotification('没有可删除的邮箱（所有邮箱都是星标）', 'warning');
    return;
  }

  let confirmMessage = `确定要删除全部 ${mailboxesToDelete.length} 个邮箱吗？`;
  if (starredCount > 0) {
    confirmMessage = `确定要删除全部 ${mailboxesToDelete.length} 个邮箱吗？\n（${starredCount} 个星标邮箱将被保留）`;
  }

  if (!confirm(confirmMessage)) return;

  try {
    // 逐个删除
    for (const mailbox of mailboxesToDelete) {
      try {
        await tempMailApi.deleteMailbox(mailbox.email);

        // 从列表中移除
        const index = mailboxList.value.findIndex(m => m.email === mailbox.email);
        if (index > -1) {
          mailboxList.value.splice(index, 1);
        }
      } catch (error) {
        console.error(`删除邮箱 ${mailbox.email} 失败:`, error);
      }
    }

    // 如果当前邮箱被删除了，清空当前邮箱
    if (currentMailbox.value && !mailboxList.value.find(m => m.email === currentMailbox.value.email)) {
      currentMailbox.value = null;
      messages.value = [];
    }
    selectedMailboxes.value.clear();
    selectedMailboxes.value = new Set();
    stopAutoRefresh();

    showNotification('所有邮箱已删除', 'success');
  } catch (error) {
    showNotification('删除失败: ' + error.message, 'error');
  }
}

// 获取邮件预览文本
// 注意：TempMailApi 的邮件列表 API 不返回邮件内容，只有获取邮件详情时才有 body 字段
// 所以这里使用 subject 作为预览，或者如果已经加载过详情则使用 body
function getMessagePreview(message) {
  // 如果有缓存的邮件内容（从详情加载的）
  if (message.text_body) {
    const preview = message.text_body.substring(0, 100);
    return preview.length < message.text_body.length ? preview + '...' : preview;
  }
  if (message.body) {
    // 移除 HTML 标签，获取纯文本
    const text = message.body.replace(/<[^>]*>/g, '').trim();
    if (text) {
      const preview = text.substring(0, 100);
      return preview.length < text.length ? preview + '...' : preview;
    }
  }
  // TempMailApi 邮件列表不返回内容，使用主题作为预览
  if (message.subject) {
    return message.subject;
  }
  return '点击查看邮件内容';
}

// 刷新邮件
async function refreshMessages() {
  if (!currentMailbox.value) return;

  loading.value.messages = true;
  try {
    const msgs = await tempMailApi.getMessages(currentMailbox.value.email);

    // 从 localStorage 加载已保存的邮件接收时间
    const storageKey = `tempmailapi_msg_times_${currentMailbox.value.email}`;
    let savedTimes = {};
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        savedTimes = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load message times:', e);
    }

    // 为每封邮件提取验证码和处理内容
    const now = Date.now(); // 使用时间戳（毫秒数）
    msgs.forEach(msg => {
      // 获取文本内容用于提取验证码
      let textContent = msg.text_body;
      if (!textContent && msg.body) {
        textContent = msg.body.replace(/<[^>]*>/g, '');
      }

      if (textContent) {
        const codeMatch = textContent.match(/\b\d{4,8}\b/);
        if (codeMatch) {
          msg.verification_code = codeMatch[0];
        }
      }

      // 使用本地接收时间，而不是 API 返回的时间
      // 如果是新邮件（之前没有记录），使用当前时间戳
      // 如果是已有邮件，使用之前保存的时间戳
      if (!savedTimes[msg.id]) {
        savedTimes[msg.id] = now;
      }
      msg.receivedAt = savedTimes[msg.id];
    });

    // 保存邮件接收时间到 localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(savedTimes));
    } catch (e) {
      console.error('Failed to save message times:', e);
    }

    messages.value = msgs;

    // 更新邮箱的邮件数量
    if (currentMailbox.value) {
      currentMailbox.value.messageCount = msgs.length;
    }
  } catch (error) {
    showNotification('刷新失败: ' + error.message, 'error');
  } finally {
    loading.value.messages = false;
  }
}

// 查看邮件详情
async function viewMessage(messageId) {
  try {
    const message = await tempMailApi.getMessage(messageId);

    // 提取验证码
    if (message.text_body || message.body) {
      const text = message.text_body || message.body.replace(/<[^>]*>/g, '');
      const codeMatch = text.match(/\b\d{4,8}\b/);
      if (codeMatch) {
        message.verification_code = codeMatch[0];
      }
    }

    selectedMessage.value = message;

    // 标记为已读
    readMessages.value.add(messageId);
    saveReadMessages();
  } catch (error) {
    showNotification('获取邮件失败: ' + error.message, 'error');
  }
}

// 切换邮件选中状态
function toggleMessageSelection(messageId) {
  if (selectedMessages.value.has(messageId)) {
    selectedMessages.value.delete(messageId);
  } else {
    selectedMessages.value.add(messageId);
  }
  // 触发响应式更新
  selectedMessages.value = new Set(selectedMessages.value);
}

// 删除单个邮件
async function deleteMessage(messageId) {
  if (!confirm('确定要删除这封邮件吗？')) return;

  try {
    await tempMailApi.deleteMessage(messageId);

    // 从列表中移除
    const index = messages.value.findIndex(m => m.hash_id === messageId);
    if (index > -1) {
      messages.value.splice(index, 1);
    }

    // 从选中列表中移除
    selectedMessages.value.delete(messageId);
    selectedMessages.value = new Set(selectedMessages.value);

    // 更新邮箱的邮件数量
    if (currentMailbox.value) {
      currentMailbox.value.messageCount = messages.value.length;
    }

    showNotification('邮件已删除', 'success');
  } catch (error) {
    showNotification('删除失败: ' + error.message, 'error');
  }
}

// 删除选中的邮件
async function deleteSelectedMessages() {
  const count = selectedMessages.value.size;
  if (!confirm(`确定要删除选中的 ${count} 封邮件吗？`)) return;

  try {
    const messageIds = Array.from(selectedMessages.value);

    for (const messageId of messageIds) {
      try {
        await tempMailApi.deleteMessage(messageId);

        // 从列表中移除
        const index = messages.value.findIndex(m => m.hash_id === messageId);
        if (index > -1) {
          messages.value.splice(index, 1);
        }
      } catch (error) {
        console.error(`删除邮件 ${messageId} 失败:`, error);
      }
    }

    // 清空选中列表
    selectedMessages.value.clear();
    selectedMessages.value = new Set();

    // 更新邮箱的邮件数量
    if (currentMailbox.value) {
      currentMailbox.value.messageCount = messages.value.length;
    }

    showNotification(`已删除 ${count} 封邮件`, 'success');
  } catch (error) {
    showNotification('删除失败: ' + error.message, 'error');
  }
}

// 删除所有邮件
async function deleteAllMessages() {
  if (!confirm(`确定要清空收件箱（${messages.value.length} 封邮件）吗？`)) return;

  try {
    // 逐个删除
    for (const message of messages.value) {
      try {
        await tempMailApi.deleteMessage(message.hash_id);
      } catch (error) {
        console.error(`删除邮件 ${message.hash_id} 失败:`, error);
      }
    }

    messages.value = [];
    selectedMessages.value.clear();
    selectedMessages.value = new Set();

    // 更新邮箱的邮件数量
    if (currentMailbox.value) {
      currentMailbox.value.messageCount = 0;
    }

    showNotification('收件箱已清空', 'success');
  } catch (error) {
    showNotification('清空失败: ' + error.message, 'error');
  }
}

// 切换自动刷新
function toggleAutoRefresh() {
  if (autoRefresh.value) {
    startPolling();
  } else {
    stopAutoRefresh();
  }
}

// 开始轮询
function startPolling() {
  if (!currentMailbox.value || stopPolling) return;

  stopPolling = tempMailApi.pollMessages(
    currentMailbox.value.email,
    (newMessages) => {
      if (newMessages.length > 0) {
        // 为新邮件提取验证码和处理内容
        newMessages.forEach(msg => {
          // 获取文本内容用于提取验证码
          let textContent = msg.text_body;
          if (!textContent && msg.body) {
            textContent = msg.body.replace(/<[^>]*>/g, '');
          }

          if (textContent) {
            const codeMatch = textContent.match(/\b\d{4,8}\b/);
            if (codeMatch) {
              msg.verification_code = codeMatch[0];
            }
          }
        });

        // 去重：只添加不存在的邮件
        const existingIds = new Set(messages.value.map(m => m.hash_id));
        const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.hash_id));

        if (uniqueNewMessages.length > 0) {
          messages.value = [...uniqueNewMessages, ...messages.value];

          // 更新邮箱的邮件数量
          if (currentMailbox.value) {
            currentMailbox.value.messageCount = messages.value.length;
          }

          showNotification(`收到 ${uniqueNewMessages.length} 封新邮件!`, 'success');
        }
      }
    },
    5000
  );
}

// 停止轮询
function stopAutoRefresh() {
  if (stopPolling) {
    stopPolling();
    stopPolling = null;
  }
}

// 工具函数
function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  showNotification('已复制到剪贴板', 'success');
}

function formatDate(messageOrDateString) {
  // 如果传入的是邮件对象，优先使用 receivedAt（本地接收时间戳）
  let timestamp = messageOrDateString;
  if (typeof messageOrDateString === 'object' && messageOrDateString.receivedAt) {
    timestamp = messageOrDateString.receivedAt;
  } else if (typeof messageOrDateString === 'object' && messageOrDateString.created_at) {
    timestamp = messageOrDateString.created_at;
  }

  if (!timestamp) return '';

  // 如果是时间戳（数字），直接使用；否则解析为 Date
  const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// 检查邮箱是否过期
function isMailboxExpired(mailbox) {
  if (!mailbox.expire_at) return false;
  return new Date(mailbox.expire_at) < new Date();
}

// 下拉框相关函数
const toggleDropdown = () => {
  if (!isDropdownOpen.value && selectRef.value) {
    // 计算下拉框位置
    const rect = selectRef.value.getBoundingClientRect();
    dropdownStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: 1000
    };
  }
  isDropdownOpen.value = !isDropdownOpen.value;
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
};

const selectDomain = (domain) => {
  selectedDomain.value = domain;
  closeDropdown();
};

const updateDropdownPosition = () => {
  if (isDropdownOpen.value && selectRef.value) {
    const rect = selectRef.value.getBoundingClientRect();
    dropdownStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: 1000
    };
  }
};

// 点击外部关闭下拉框指令
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (event) => {
      if (!el.contains(event.target)) {
        binding.value();
      }
    };
    document.addEventListener('click', el._clickOutside);
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside);
  }
};

// 保存已读消息到 localStorage
function saveReadMessages() {
  if (!currentMailbox.value) return;
  const key = `tempmailapi_read_${currentMailbox.value.email}`;
  localStorage.setItem(key, JSON.stringify(Array.from(readMessages.value)));
}

// 加载已读消息从 localStorage
function loadReadMessages() {
  if (!currentMailbox.value) return;
  const key = `tempmailapi_read_${currentMailbox.value.email}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      readMessages.value = new Set(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load read messages:', e);
      readMessages.value = new Set();
    }
  } else {
    readMessages.value = new Set();
  }
}

function formatTime(messageOrDateString) {
  // 如果传入的是邮件对象，优先使用 receivedAt（本地接收时间戳）
  let timestamp = messageOrDateString;
  if (typeof messageOrDateString === 'object' && messageOrDateString.receivedAt) {
    timestamp = messageOrDateString.receivedAt;
  } else if (typeof messageOrDateString === 'object' && messageOrDateString.created_at) {
    timestamp = messageOrDateString.created_at;
  }

  if (!timestamp) return '';

  // 如果是时间戳（数字），直接使用；否则解析为 Date
  const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);

  const now = new Date();
  const diff = now - date;

  // 相对时间显示
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';

  // 超过24小时，显示完整日期时间
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const currentYear = now.getFullYear();

  // 如果是今年，不显示年份
  if (year === currentYear) {
    return `${month}-${day} ${hours}:${minutes}`;
  }

  // 不是今年，显示完整日期
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// 初始化
onMounted(() => {
  // 先加载本地数据
  loadFromStorage();
  // 再加载域名
  loadDomains();
  // 如果有当前邮箱，加载已读状态并刷新邮件
  if (currentMailbox.value) {
    loadReadMessages(); // 先加载已读状态
    refreshMessages();
  }

  // 监听窗口滚动和resize，重新计算下拉框位置
  window.addEventListener('scroll', updateDropdownPosition);
  window.addEventListener('resize', updateDropdownPosition);
});

// 清理
onUnmounted(() => {
  stopAutoRefresh();
  window.removeEventListener('scroll', updateDropdownPosition);
  window.removeEventListener('resize', updateDropdownPosition);
});
</script>

<style scoped>
/* 邮箱生成器样式 */
.email-generator {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.domain-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.domain-selector label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(55, 53, 47, 0.85);
  white-space: nowrap;
}

.domain-selector .label-icon {
  color: rgba(55, 53, 47, 0.45);
}

/* 自定义下拉框 */
.custom-select {
  flex: 1;
  max-width: 400px;
  position: relative;
  user-select: none;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 2px solid rgba(55, 53, 47, 0.16);
  border-radius: 12px;
  font-size: 0.95rem;
  color: rgba(55, 53, 47, 0.85);
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  gap: 8px;
}

.select-trigger:hover {
  border-color: var(--brand, #6c7bff);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108, 123, 255, 0.15);
}

.selected-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-arrow {
  flex-shrink: 0;
  transition: transform 0.3s ease;
  color: var(--brand, #6c7bff);
}

.select-arrow.open {
  transform: rotate(180deg);
}

.select-dropdown {
  /* 位置通过内联样式动态设置 */
  background: #ffffff;
  border: 2px solid var(--brand, #6c7bff);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  overflow-y: auto;
  animation: dropdownSlide 0.2s ease;
  max-height: 300px;
}

/* 下拉框滚动条样式 */
.select-dropdown::-webkit-scrollbar {
  width: 6px;
}

.select-dropdown::-webkit-scrollbar-track {
  background: rgba(55, 53, 47, 0.06);
  border-radius: 0 10px 10px 0;
}

.select-dropdown::-webkit-scrollbar-thumb {
  background: rgba(55, 53, 47, 0.16);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.select-dropdown::-webkit-scrollbar-thumb:hover {
  background: var(--brand, #6c7bff);
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  color: rgba(55, 53, 47, 0.85);
  position: relative;
}

.select-option:not(.selected):hover {
  background: rgba(108, 123, 255, 0.1);
  color: var(--brand, #6c7bff);
}

.select-option.selected {
  background: linear-gradient(135deg, var(--brand, #6c7bff) 0%, #8a5fc2 100%);
  color: #fff;
}

.select-option.selected:hover {
  background: linear-gradient(135deg, #7a8fff 0%, #8a5fc2 100%);
  color: #fff;
}

.select-option span {
  flex: 1;
}

.select-option svg {
  flex-shrink: 0;
  opacity: 0.9;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

/* 邮箱列表项样式 */
.email-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--bg-primary, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.email-item:hover {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.email-item.active {
  background: var(--primary-bg, #eff6ff);
  border-color: var(--primary-color, #3b82f6);
}

.email-item.selected {
  background: var(--primary-bg, #eff6ff);
  border-color: var(--primary-color, #3b82f6);
}

.email-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.email-address {
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
}

.email-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* 邮件项样式 */
.message-content-wrapper {
  flex: 1;
  cursor: pointer;
}

.message-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-item:hover .message-actions {
  opacity: 1;
}

.btn-action-badge {
  padding: 0.25rem 0.75rem;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action-badge:hover {
  background: var(--primary-dark, #2563eb);
  transform: scale(1.05);
}

.verification-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  background: var(--primary-bg, #eff6ff);
  border: 1px solid var(--primary-color, #3b82f6);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary-color, #3b82f6);
}

/* 域名标签样式 */
.domain-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.domain-header h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 0.75rem;
}

.domain-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.domain-tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--bg-secondary, #f3f4f6);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 1rem;
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
  transition: all 0.2s;
}

.domain-tag.free {
  background: var(--success-bg, #d1fae5);
  border-color: var(--success-border, #6ee7b7);
  color: var(--success-text, #047857);
}

.domain-tag.more {
  background: transparent;
  border-style: dashed;
}

/* 自动刷新标签 */
.auto-refresh-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  user-select: none;
}

.auto-refresh-label input[type="checkbox"] {
  cursor: pointer;
}

/* 邮件列表样式 */
.message-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.message-item {
  padding: 1rem;
  background: var(--bg-primary, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.message-item:hover {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.message-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.message-from {
  font-weight: 600;
  color: var(--text-primary, #111827);
  font-size: 0.875rem;
}

.message-time {
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
}

.message-subject {
  font-weight: 500;
  color: var(--text-primary, #111827);
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.message-preview {
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 0.5rem;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.attachment-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  background: var(--info-bg, #dbeafe);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: var(--info-text, #1e40af);
}

/* 模态框样式 */
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
  padding: 1rem;
}

.modal-dialog {
  background: var(--bg-primary, #ffffff);
  border-radius: 0.75rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-dialog.small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.modal-close {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #111827);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.detail-row {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
}

.detail-row strong {
  min-width: 4rem;
  color: var(--text-secondary, #6b7280);
  font-size: 0.875rem;
}

.detail-row span {
  color: var(--text-primary, #111827);
  font-size: 0.875rem;
}

.attachments-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 0.375rem;
  margin-top: 0.5rem;
}

.message-content {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.body-html {
  margin-top: 0.5rem;
  padding: 1rem;
  background: var(--bg-secondary, #f9fafb);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.6;
  max-height: 400px;
  overflow-y: auto;
}

/* 表单样式 */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #111827);
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.form-actions .btn {
  flex: 1;
}

/* 旋转动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

/* 列表头部样式 */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.list-header h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: rgba(55, 53, 47, 0.95);
  margin: 0;
  flex: 1;
}

.list-header h2 .title-icon {
  color: rgba(55, 53, 47, 0.45);
  flex-shrink: 0;
}

/* 头部操作按钮 */
.header-actions {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-shrink: 0;
}

.header-actions .btn-icon {
  min-width: 28px;
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all 0.12s ease;
  border: none;
  background: rgba(55, 53, 47, 0.06);
  color: rgba(55, 53, 47, 0.65);
  cursor: pointer;
}

.header-actions .btn-icon:hover {
  background: rgba(55, 53, 47, 0.1);
}

.header-actions .btn-icon.btn-danger {
  background: rgba(235, 87, 87, 0.1);
  color: #eb5757;
}

.header-actions .btn-icon.btn-danger:hover {
  background: rgba(235, 87, 87, 0.15);
}

.header-actions .btn-icon.btn-secondary {
  background: rgba(35, 131, 226, 0.1);
  color: #2383e2;
}

.header-actions .btn-icon.btn-secondary:hover {
  background: rgba(35, 131, 226, 0.15);
}

.header-actions .btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header-actions .btn-icon svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

/* 自动刷新标签 */
.auto-refresh-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  font-size: 13px;
  color: rgba(55, 53, 47, 0.65);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.auto-refresh-label input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #2383e2;
}

.auto-refresh-label:hover {
  color: rgba(55, 53, 47, 0.95);
}

/* 选中计数 */
.selection-count {
  margin-left: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #2383e2;
}

/* 邮件数量徽章 */
.message-count-badge {
  margin-left: 8px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(55, 53, 47, 0.65);
}

.message-count-badge .unread-count {
  margin-left: 8px;
  padding: 2px 8px;
  background: #2383e2;
  color: white;
  border-radius: 10px;
  font-size: 12px;
}

/* 邮箱列表项 */
.email-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.email-item {
  background: white;
  border: 1px solid rgba(55, 53, 47, 0.09);
  border-radius: 3px;
  transition: all 0.12s ease;
}

.email-item:hover {
  background: rgba(55, 53, 47, 0.03);
}

.email-item.active {
  background: rgba(35, 131, 226, 0.08);
  border-color: rgba(35, 131, 226, 0.24);
}

.email-item.selected {
  background: rgba(35, 131, 226, 0.08);
  border-color: rgba(35, 131, 226, 0.24);
}

.email-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  width: 100%;
}

.email-item-header label {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin: 0;
  flex-shrink: 0;
}

.email-item-header input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
  margin: 0;
  border-radius: 3px;
  border: 1.5px solid rgba(55, 53, 47, 0.3);
  appearance: none;
  background: white;
  position: relative;
  transition: all 0.12s ease;
}

.email-item-header input[type="checkbox"]:checked {
  background: #2383e2;
  border-color: #2383e2;
}

.email-item-header input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* 星标按钮 */
.btn-star {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 3px;
  color: rgba(55, 53, 47, 0.35);
  cursor: pointer;
  transition: all 0.12s ease;
  flex-shrink: 0;
}

.btn-star:hover {
  background: rgba(55, 53, 47, 0.06);
  color: rgba(55, 53, 47, 0.65);
}

.btn-star svg {
  width: 16px;
  height: 16px;
}

.email-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  overflow: hidden;
}

.email-actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.12s ease;
  flex-shrink: 0;
}

.email-item:hover .email-actions {
  opacity: 1;
}

.btn-icon-small {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 3px;
  color: rgba(55, 53, 47, 0.45);
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-icon-small:hover {
  background: rgba(55, 53, 47, 0.08);
  color: rgba(55, 53, 47, 0.95);
}

.btn-icon-small svg {
  width: 16px;
  height: 16px;
}

/* 邮件列表项 */
.message-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.message-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: white;
  border: 1px solid rgba(55, 53, 47, 0.09);
  border-radius: 3px;
  transition: all 0.12s ease;
}

.message-item:hover {
  background: rgba(55, 53, 47, 0.03);
}

.message-item.selected {
  background: rgba(35, 131, 226, 0.08);
  border-color: rgba(35, 131, 226, 0.24);
}

.message-item.unread {
  background: rgba(59, 130, 246, 0.05);
  border-left: 3px solid #3b82f6;
}

.message-item.unread .message-from,
.message-item.unread .message-subject {
  font-weight: 600;
}

.message-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin: 0;
  flex-shrink: 0;
}

.message-checkbox input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
  margin: 0;
  border-radius: 3px;
  border: 1.5px solid rgba(55, 53, 47, 0.3);
  appearance: none;
  background: white;
  position: relative;
  transition: all 0.12s ease;
}

.message-checkbox input[type="checkbox"]:checked {
  background: #2383e2;
  border-color: #2383e2;
}

.message-checkbox input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.message-content-wrapper {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.message-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.12s ease;
  flex-shrink: 0;
  align-items: center;
}

.message-item:hover .message-actions {
  opacity: 1;
}

.btn-action-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 4px;
  color: #f59e0b;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s ease;
  white-space: nowrap;
}

.btn-action-badge:hover {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.3);
}

/* 禁用的复选框样式 */
.checkbox-disabled {
  opacity: 0.5;
  cursor: not-allowed !important;
}

.checkbox-disabled input[type="checkbox"] {
  cursor: not-allowed !important;
}

/* 淡入动画 */
.fade-in-item {
  animation: fadeInUp 0.4s ease-out backwards;
}

.fade-in-item:nth-child(1) { animation-delay: 0.05s; }
.fade-in-item:nth-child(2) { animation-delay: 0.1s; }
.fade-in-item:nth-child(3) { animation-delay: 0.15s; }
.fade-in-item:nth-child(4) { animation-delay: 0.2s; }
.fade-in-item:nth-child(5) { animation-delay: 0.25s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 分页样式（Notion 风格） */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(99, 102, 241, 0.1);
  flex-wrap: wrap;
}

.pagination-btn {
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 3px;
  color: rgba(55, 53, 47, 0.65);
  cursor: pointer;
  transition: all 0.12s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(55, 53, 47, 0.08);
}

.pagination-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-btn svg {
  margin: 0 !important;
}

.page-numbers {
  display: flex;
  gap: 4px;
  align-items: center;
}

.page-number-btn {
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 3px;
  color: rgba(55, 53, 47, 0.65);
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.12s ease;
}

.page-number-btn:hover:not(:disabled):not(.active) {
  background: rgba(55, 53, 47, 0.08);
}

.page-number-btn.active {
  background: rgba(35, 131, 226, 0.1);
  color: #2383e2;
  font-weight: 500;
}

.page-number-btn:disabled {
  cursor: default;
  opacity: 0.5;
  pointer-events: none;
}

.page-info-detail {
  font-size: 0.85rem;
  color: var(--text-sub);
  margin-left: 8px;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .pagination {
    gap: 6px;
  }

  .page-numbers {
    gap: 4px;
  }

  .page-number-btn {
    min-width: 32px;
    height: 32px;
    padding: 0 8px;
    font-size: 0.85rem;
  }

  .pagination-btn {
    min-width: 32px !important;
    height: 32px;
  }

  .page-info-detail {
    width: 100%;
    text-align: center;
    margin: 4px 0 0 0;
    font-size: 0.8rem;
  }
}

/* 恢复邮箱对话框样式 */
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
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(55, 53, 47, 0.09);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(55, 53, 47, 0.95);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  color: rgba(55, 53, 47, 0.6);
}

.close-btn:hover {
  background: rgba(55, 53, 47, 0.08);
  color: rgba(55, 53, 47, 0.9);
}

.modal-body {
  padding: 1.5rem;
}

.hint-text {
  margin: 0 0 1rem 0;
  color: rgba(55, 53, 47, 0.65);
  font-size: 0.9rem;
  line-height: 1.5;
}

.restore-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid rgba(55, 53, 47, 0.16);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  font-family: 'Consolas', 'Monaco', monospace;
}

.restore-input:focus {
  outline: none;
  border-color: var(--brand, #6c7bff);
  box-shadow: 0 0 0 3px rgba(108, 123, 255, 0.1);
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(55, 53, 47, 0.09);
}

.btn-secondary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
}

.btn-secondary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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

/* 卡片背景板样式 - 固定高度避免分页时高度变化 */
.email-list-card {
  min-height: 600px;
}

.message-list-card {
  min-height: 600px;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(55, 53, 47, 0.45);
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.3;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0;
  line-height: 1.6;
}

.empty-state .text-muted {
  font-size: 0.9rem;
  margin-top: 8px;
}
</style>

