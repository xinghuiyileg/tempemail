/**
 * TempMailApi.com 临时邮箱服务提供商
 * API文档: https://tempmailapi.com/page/api-documentation
 */

export class TempMailApiProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://tempmailapi.com/api';
  }

  /**
   * 生成随机用户名（8-12位字符）
   * @returns {string} 随机用户名
   */
  generateRandomUsername() {
    const length = Math.floor(Math.random() * 5) + 8; // 8-12位
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let username = '';
    for (let i = 0; i < length; i++) {
      username += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return username;
  }

  /**
   * 获取可用域名列表
   * @param {string} type - 'all' | 'free' | 'premium'
   * @returns {Promise<Array>} 域名列表
   */
  async getDomains(type = 'all') {
    const url = `${this.baseUrl}/domains/${this.apiKey}/${type}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    const result = await response.json();
    if (!result.status) {
      throw new Error(result.message || 'Failed to get domains');
    }
    
    return result.data.domains;
  }

  /**
   * 创建随机邮箱
   * @param {string} domain - 可选，指定域名（注意：TempMailApi不支持直接指定域名，会先创建随机邮箱再重命名）
   * @returns {Promise<Object>} 邮箱信息
   */
  async createRandomMailbox(domain = null) {
    // TempMailApi.com 不支持通过 URL 指定域名
    // 只能创建完全随机的邮箱
    const url = `${this.baseUrl}/emails/${this.apiKey}`;

    console.log('🌐 Calling TempMailApi:', url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });

      console.log('📡 Response status:', response.status);

      const responseText = await response.text();
      console.log('📄 Response body:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ Failed to parse JSON response:', e);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
      }

      if (!result.status) {
        console.error('❌ API returned error:', result.message);
        throw new Error(result.message || 'Failed to create mailbox');
      }

      const mailbox = result.data;
      console.log('✅ Mailbox created:', mailbox.email);

      // 如果指定了域名且与创建的邮箱域名不同，则重命名
      if (domain && mailbox.domain !== domain) {
        console.log(`🔄 Renaming mailbox to use domain: ${domain}`);
        const username = this.generateRandomUsername(); // 使用更长的随机用户名
        return await this.renameMailbox(mailbox.email, username, domain);
      }

      return mailbox;
    } catch (error) {
      console.error('❌ createRandomMailbox error:', error);
      throw error;
    }
  }

  /**
   * 创建自定义邮箱（先创建随机邮箱，再重命名）
   * @param {string} username - 用户名
   * @param {string} domain - 域名
   * @returns {Promise<Object>} 邮箱信息
   */
  async createMailbox(username, domain) {
    // 第一步：创建随机邮箱（指定域名）
    const randomMailbox = await this.createRandomMailbox(domain);

    // 第二步：重命名为自定义用户名
    const renamedMailbox = await this.renameMailbox(randomMailbox.email, username, domain);

    return renamedMailbox;
  }

  /**
   * 重命名/旋转邮箱
   * @param {string} currentEmail - 当前邮箱地址
   * @param {string} newUsername - 新用户名
   * @param {string} domain - 域名
   * @returns {Promise<Object>} 新邮箱信息
   */
  async renameMailbox(currentEmail, newUsername, domain) {
    const encodedEmail = encodeURIComponent(currentEmail);
    const url = `${this.baseUrl}/emails/${this.apiKey}/${encodedEmail}/${newUsername}/${domain}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Accept': 'application/json' }
    });
    
    const result = await response.json();
    if (!result.status) {
      throw new Error(result.message || 'Failed to rename mailbox');
    }
    
    return result.data;
  }

  /**
   * 删除邮箱
   * @param {string} email - 邮箱地址
   * @returns {Promise<Object>} 删除结果
   */
  async deleteMailbox(email) {
    const encodedEmail = encodeURIComponent(email);
    const url = `${this.baseUrl}/emails/${this.apiKey}/${encodedEmail}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Accept': 'application/json' }
    });
    
    const result = await response.json();
    if (!result.status) {
      throw new Error(result.message || 'Failed to delete mailbox');
    }
    
    return result;
  }

  /**
   * 获取邮件列表
   * @param {string} email - 邮箱地址
   * @param {number} sinceDays - 可选，获取最近N天的邮件
   * @returns {Promise<Array>} 邮件列表
   */
  async getMessages(email, sinceDays = null) {
    const encodedEmail = encodeURIComponent(email);
    let url = `${this.baseUrl}/messages/${this.apiKey}/${encodedEmail}`;
    
    if (sinceDays) {
      url += `?since_days=${sinceDays}`;
    }
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    const result = await response.json();
    if (!result.status) {
      throw new Error(result.message || 'Failed to get messages');
    }
    
    return result.data.messages || [];
  }

  /**
   * 获取单个邮件详情（包含完整内容和附件）
   * @param {string} messageId - 邮件hash_id
   * @returns {Promise<Object>} 邮件详情
   */
  async getMessage(messageId) {
    const url = `${this.baseUrl}/messages/${this.apiKey}/message/${messageId}`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    const result = await response.json();
    if (!result.status) {
      throw new Error(result.message || 'Failed to get message');
    }
    
    return result.data.message;
  }

  /**
   * 删除邮件
   * @param {string} messageId - 邮件hash_id
   * @returns {Promise<Object>} 删除结果
   */
  async deleteMessage(messageId) {
    const url = `${this.baseUrl}/messages/${this.apiKey}/message/${messageId}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Accept': 'application/json' }
    });
    
    const result = await response.json();
    if (!result.status) {
      throw new Error(result.message || 'Failed to delete message');
    }
    
    return result;
  }

  /**
   * 获取附件下载链接
   * @param {string} hashId - 邮件hash_id
   * @param {string} filename - 文件名
   * @returns {string} 下载链接
   */
  getAttachmentUrl(hashId, filename) {
    return `${this.baseUrl}/d/${hashId}/${filename}`;
  }

  /**
   * 轮询检查新邮件
   * @param {string} email - 邮箱地址
   * @param {Function} callback - 收到新邮件时的回调函数
   * @param {number} interval - 轮询间隔（毫秒），默认5秒
   * @returns {Function} 停止轮询的函数
   */
  pollMessages(email, callback, interval = 5000) {
    let lastMessageIds = new Set();
    let isRunning = true;

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
        setTimeout(poll, interval);
      }
    };

    poll();

    // 返回停止函数
    return () => {
      isRunning = false;
    };
  }
}

/**
 * 使用示例：
 * 
 * const provider = new TempMailApiProvider('YOUR_API_KEY');
 * 
 * // 1. 获取可用域名
 * const domains = await provider.getDomains('free');
 * console.log('可用域名:', domains);
 * 
 * // 2. 创建随机邮箱
 * const mailbox = await provider.createRandomMailbox();
 * console.log('新邮箱:', mailbox.email);
 * 
 * // 3. 获取邮件列表
 * const messages = await provider.getMessages(mailbox.email);
 * console.log('收到邮件:', messages.length);
 * 
 * // 4. 获取邮件详情
 * if (messages.length > 0) {
 *   const detail = await provider.getMessage(messages[0].hash_id);
 *   console.log('邮件内容:', detail.body);
 * }
 * 
 * // 5. 轮询新邮件
 * const stopPolling = provider.pollMessages(mailbox.email, (newMessages) => {
 *   console.log('收到新邮件:', newMessages);
 * });
 * 
 * // 停止轮询
 * // stopPolling();
 */

