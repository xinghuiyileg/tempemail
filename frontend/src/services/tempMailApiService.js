/**
 * TempMailApi.com 前端服务
 * 提供与后端TempMailApi路由的交互接口
 */

import apiClient from './api'

export class TempMailApiService {
  /**
   * 获取可用域名列表
   * @param {string} type - 'all' | 'free' | 'premium'
   */
  async getDomains(type = 'all') {
    const response = await apiClient.get('/tempmail/domains', {
      params: { type }
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get domains');
    }

    return response.data.data.domains;
  }

  /**
   * 创建邮箱
   * @param {string} username - 用户名（可选，不传则随机生成）
   * @param {string} domain - 域名（可选，不传则随机选择）
   */
  async createMailbox(username = null, domain = null) {
    const data = {};
    if (username) data.username = username;
    if (domain) data.domain = domain;

    const response = await apiClient.post('/tempmail/create', data);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create mailbox');
    }

    return response.data.data;
  }

  /**
   * 重命名邮箱
   */
  async renameMailbox(currentEmail, newUsername, domain) {
    const response = await apiClient.post('/tempmail/rename', {
      currentEmail,
      newUsername,
      domain
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to rename mailbox');
    }

    return response.data.data;
  }

  /**
   * 删除邮箱
   */
  async deleteMailbox(email) {
    const response = await apiClient.post('/tempmail/delete', { email });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete mailbox');
    }

    return response.data.data;
  }

  /**
   * 获取邮件列表
   */
  async getMessages(email, sinceDays = null) {
    const params = { email };
    if (sinceDays) {
      params.since_days = sinceDays;
    }

    const response = await apiClient.get('/tempmail/messages', { params });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get messages');
    }

    return response.data.data.messages;
  }

  /**
   * 获取邮件详情
   */
  async getMessage(messageId) {
    const response = await apiClient.get(`/tempmail/message/${messageId}`);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get message');
    }

    return response.data.data.message;
  }

  /**
   * 删除邮件
   */
  async deleteMessage(messageId) {
    const response = await apiClient.delete(`/tempmail/message/${messageId}`);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete message');
    }

    return response.data.data;
  }

  /**
   * 轮询新邮件
   * @param {string} email - 邮箱地址
   * @param {Function} callback - 收到新邮件时的回调
   * @param {number} interval - 轮询间隔（毫秒）
   * @returns {Function} 停止轮询的函数
   */
  pollMessages(email, callback, interval = 5000) {
    let lastMessageIds = new Set();
    let isRunning = true;
    let timeoutId = null;

    const poll = async () => {
      if (!isRunning) return;

      try {
        const messages = await this.getMessages(email);
        const currentMessageIds = new Set(messages.map(m => m.hash_id));
        
        // 检查新邮件
        const newMessages = messages.filter(m => !lastMessageIds.has(m.hash_id));
        
        if (newMessages.length > 0) {
          callback(newMessages);
        }
        
        lastMessageIds = currentMessageIds;
      } catch (error) {
        console.error('Poll messages error:', error);
      }

      if (isRunning) {
        timeoutId = setTimeout(poll, interval);
      }
    };

    poll();

    // 返回停止函数
    return () => {
      isRunning = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }
}

// 创建单例实例
export const tempMailApi = new TempMailApiService();

