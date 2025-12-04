/**
 * TempMailApi.com 集成路由
 * 提供与 TempMailApi.com 服务的集成接口
 */

import { TempMailApiProvider } from '../services/tempMailApiProvider.js';
import { successResponse, errorResponse } from '../utils/cors.js';
import ConfigManager, { CONFIG_KEYS } from '../utils/configManager.js';

/**
 * 处理所有TempMail相关的路由
 */
export default async function tempMailRoutes(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  console.log('🔍 TempMail Route - Path:', path, 'Method:', method);

  // 从配置管理器获取API密钥（统一配置管理）
  const apiKey = await ConfigManager.get(CONFIG_KEYS.TEMPMAILAPI_KEY, env);
  console.log('🔑 Using API Key:', apiKey ? apiKey.substring(0, 10) + '...' : 'NONE');

  if (!apiKey) {
    return errorResponse('TempMailApi API Key not configured', 503);
  }

  const provider = new TempMailApiProvider(apiKey);

  try {
    // 获取可用域名
    if (path === '/domains' && method === 'GET') {
      console.log('📋 Getting domains...');
      return await getDomains(provider, url);
    }

    // 创建邮箱
    if (path === '/create' && method === 'POST') {
      console.log('📧 Creating mailbox...');
      return await createMailbox(provider, request);
    }

    // 重命名邮箱
    if (path === '/rename' && method === 'POST') {
      console.log('✏️ Renaming mailbox...');
      return await renameMailbox(provider, request);
    }

    // 删除邮箱
    if (path === '/delete' && method === 'POST') {
      console.log('🗑️ Deleting mailbox...');
      return await deleteMailbox(provider, request);
    }

    // 获取邮件列表
    if (path === '/messages' && method === 'GET') {
      console.log('📬 Getting messages...');
      return await getMessages(provider, url);
    }

    // 获取邮件详情
    if (path.startsWith('/message/') && method === 'GET') {
      const messageId = path.split('/').pop();
      console.log('📨 Getting message:', messageId);
      return await getMessage(provider, messageId);
    }

    // 删除邮件
    if (path.startsWith('/message/') && method === 'DELETE') {
      const messageId = path.split('/').pop();
      console.log('🗑️ Deleting message:', messageId);
      return await deleteMessage(provider, messageId);
    }

    console.log('❌ No matching route for:', path);
    return errorResponse('Not found', 404);

  } catch (error) {
    console.error('❌ TempMail route error:', error);
    console.error('Error stack:', error.stack);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

/**
 * 获取可用域名列表
 */
async function getDomains(provider, url) {
  const type = url.searchParams.get('type') || 'all';
  const domains = await provider.getDomains(type);

  return successResponse({
    domains: domains
  });
}

/**
 * 创建邮箱（支持自定义前缀和域名）
 */
async function createMailbox(provider, request) {
  let username = null;
  let domain = null;

  // 尝试解析请求体
  try {
    const contentType = request.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const body = await request.json();
      username = body.username || null;
      domain = body.domain || null;
    }
  } catch (error) {
    console.log('No request body or parse error:', error.message);
    // 如果没有请求体或解析失败，使用默认值（随机）
  }

  console.log('Creating mailbox with username:', username, 'domain:', domain);

  let mailbox;
  if (username && domain) {
    // 自定义用户名和域名
    console.log('Creating custom mailbox');
    mailbox = await provider.createMailbox(username, domain);
  } else if (domain) {
    // 只指定域名，用户名随机
    console.log('Creating random mailbox with domain');
    mailbox = await provider.createRandomMailbox(domain);
  } else {
    // 完全随机
    console.log('Creating fully random mailbox');
    mailbox = await provider.createRandomMailbox();
  }

  return successResponse({
    email: mailbox.email,
    domain: mailbox.domain,
    id: mailbox.id,
    expire_at: mailbox.expire_at,
    created_at: mailbox.created_at,
    email_token: mailbox.email_token
  });
}

/**
 * 重命名邮箱
 */
async function renameMailbox(provider, request) {
  const body = await request.json();
  const { currentEmail, newUsername, domain } = body;

  if (!currentEmail || !newUsername || !domain) {
    return errorResponse('Missing required fields: currentEmail, newUsername, domain', 400);
  }

  const result = await provider.renameMailbox(currentEmail, newUsername, domain);

  return successResponse(result);
}

/**
 * 删除邮箱
 */
async function deleteMailbox(provider, request) {
  const body = await request.json();
  const { email } = body;

  if (!email) {
    return errorResponse('Missing required field: email', 400);
  }

  const result = await provider.deleteMailbox(email);

  return successResponse({
    message: result.message
  });
}

/**
 * 获取邮件列表
 */
async function getMessages(provider, url) {
  const email = url.searchParams.get('email');
  const sinceDays = url.searchParams.get('since_days');

  if (!email) {
    return errorResponse('Missing required parameter: email', 400);
  }

  const messages = await provider.getMessages(
    email,
    sinceDays ? parseInt(sinceDays) : null
  );

  return successResponse({
    messages: messages
  });
}

/**
 * 获取邮件详情
 */
async function getMessage(provider, messageId) {
  if (!messageId) {
    return errorResponse('Missing message ID', 400);
  }

  const message = await provider.getMessage(messageId);

  return successResponse({
    message: message
  });
}

/**
 * 删除邮件
 */
async function deleteMessage(provider, messageId) {
  if (!messageId) {
    return errorResponse('Missing message ID', 400);
  }

  const result = await provider.deleteMessage(messageId);

  return successResponse({
    message: result.message,
    mailbox: result.mailbox
  });
}

