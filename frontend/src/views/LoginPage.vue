<template>
  <div class="login-page">
    <!-- 背景渐变装饰 - 呼吸效果 -->
    <div class="gradient-blob gradient-blob-1"></div>
    <div class="gradient-blob gradient-blob-2"></div>
    <div class="gradient-blob gradient-blob-3"></div>
    
    <div class="login-container">
      <!-- Logo 和标题 -->
      <div class="brand-section">
        <div class="logo">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <div class="brand-info">
          <h1 class="brand-name">Mail2</h1>
          <p class="brand-subtitle">临时邮箱系统</p>
        </div>
      </div>

      <!-- 主标题 -->
      <div class="welcome-section">
        <h2 class="welcome-title">欢迎使用临时邮箱系统</h2>
        <p class="welcome-subtitle">安全、快速、可靠的临时邮箱服务</p>
      </div>

      <!-- 登录卡片 -->
      <div class="login-card">
        <h3 class="login-title">请输入访问密码：</h3>
        
        <!-- 密码登录 -->
        <div class="password-section">
          <div class="password-input-wrapper">
            <input 
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              class="password-input"
              @keyup.enter="handleLogin"
              autofocus
            />
            <button 
              class="toggle-password-btn"
              @click="showPassword = !showPassword"
              type="button"
            >
              <svg v-if="!showPassword" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
          <button 
            class="login-submit-btn"
            @click="handleLogin"
            :disabled="!password || loading"
          >
            <span v-if="!loading">登录</span>
            <span v-else class="loading-spinner"></span>
          </button>
        </div>
        
        <!-- 第三方登录选项（装饰性展示） -->
        <div class="divider">
          <span>其他登录方式（即将开放）</span>
        </div>
        <div class="oauth-grid">
          <!-- 第一行 -->
          <button class="oauth-btn" @click="handleOAuthLogin('qq')">
            <div class="oauth-icon qq-icon">
              <svg viewBox="0 0 1024 1024" width="28" height="28" fill="white">
                <path d="M824.8 613.2c-16-51.4-34.4-94.6-62.7-165.3C766.5 262.2 689.3 112 511.5 112 331.7 112 256.2 265.2 261 447.9c-28.4 70.8-46.7 113.7-62.7 165.3-34 109.5-23 154.8-14.6 155.8 18 2.2 70.1-82.4 70.1-82.4 0 49 25.2 112.9 79.8 159-26.4 8.1-85.7 29.9-71.6 53.8 11.4 19.3 196.2 12.3 249.5 6.3 53.3 6 238.1 13 249.5-6.3 14.1-23.8-45.3-45.7-71.6-53.8 54.6-46.2 79.8-110.1 79.8-159 0 0 52.1 84.6 70.1 82.4 8.5-1.1 19.5-46.4-14.5-155.8z"/>
              </svg>
            </div>
            <span class="oauth-label">QQ</span>
          </button>
          
          <button class="oauth-btn" @click="handleOAuthLogin('wechat')">
            <div class="oauth-icon wechat-icon">
              <svg viewBox="0 0 1024 1024" width="26" height="26" fill="white">
                <path d="M664.26 377.89c14.02 0 27.77 1.17 41.2 3.17-36.87-171.52-226.99-298.85-443.24-298.85C121.54 82.21 0 203.75 0 364.43c0 92.62 50.54 168.84 134.76 227.84l-33.69 101.31 118.09-59.04c42.18 8.43 75.87 16.86 118.09 16.86 8.37 0 16.68-0.37 24.93-1.01-5.21-17.87-8.21-36.54-8.21-55.91 0-123.07 101.06-222.59 247.29-222.59z m-156.96-78.92c25.35 0 42.18 16.86 42.18 42.21s-16.83 42.21-42.18 42.21c-25.35 0-50.54-16.86-50.54-42.21s25.19-42.21 50.54-42.21z m-253.74 84.42c-25.35 0-50.69-16.86-50.69-42.21s25.34-42.21 50.69-42.21c25.19 0 42.02 16.86 42.02 42.21s-16.83 42.21-42.02 42.21z"/>
                <path d="M1024 599.88c0-135.36-134.76-244.61-285.95-244.61-159.96 0-286.11 109.25-286.11 244.61 0 135.52 126.15 244.61 286.11 244.61 33.53 0 67.22-8.43 100.75-16.86l92.62 50.54-25.35-84.42c67.38-50.54 117.93-118.09 117.93-193.87z m-378.49-42.21c-16.83 0-33.53-16.86-33.53-33.72s16.7-33.72 33.53-33.72c25.19 0 42.02 16.86 42.02 33.72s-16.83 33.72-42.02 33.72z m193.96 0c-16.83 0-33.69-16.86-33.69-33.72s16.86-33.72 33.69-33.72c25.19 0 41.86 16.86 41.86 33.72s-16.67 33.72-41.86 33.72z"/>
              </svg>
            </div>
            <span class="oauth-label">微信</span>
          </button>
          
          <button class="oauth-btn" @click="handleOAuthLogin('alipay')">
            <div class="oauth-icon alipay-icon">
              <svg viewBox="0 0 24 24" width="28" height="28">
                <path fill="#0284c7" d="M19.695 15.07c3.426 1.158 4.203 1.22 4.203 1.22V3.846c0-2.124-1.705-3.845-3.81-3.845H3.914C1.808.001.102 1.722.102 3.846v16.31c0 2.123 1.706 3.845 3.813 3.845h16.173c2.105 0 3.81-1.722 3.81-3.845v-.157s-6.19-2.602-9.315-4.119c-2.096 2.602-4.8 4.181-7.607 4.181c-4.75 0-6.361-4.19-4.112-6.949c.49-.602 1.324-1.175 2.617-1.497c2.025-.502 5.247.313 8.266 1.317a16.8 16.8 0 0 0 1.341-3.302H5.781v-.952h4.799V6.975H4.77v-.953h5.81V3.591s0-.409.411-.409h2.347v2.84h5.744v.951h-5.744v1.704h4.69a19.5 19.5 0 0 1-1.986 5.06c1.424.52 2.702 1.011 3.654 1.333m-13.81-2.032c-.596.06-1.71.325-2.321.869c-1.83 1.608-.735 4.55 2.968 4.55c2.151 0 4.301-1.388 5.99-3.61c-2.403-1.182-4.438-2.028-6.637-1.809"/>
              </svg>
            </div>
            <span class="oauth-label">支付宝</span>
          </button>

          <button class="oauth-btn" @click="handleOAuthLogin('weibo')">
            <div class="oauth-icon weibo-icon">
              <svg viewBox="-108.70995 -146.78075 942.1529 880.6845" width="28" height="28">
                <path d="M53.3 403.723c0 84.4 109.9 152.8 245.4 152.8s245.4-68.4 245.4-152.8-109.9-152.8-245.4-152.8-245.4 68.4-245.4 152.8" fill="#FFF"/>
                <path d="M304.5 544.123c-120 11.9-223.6-42.4-231.4-121.1-7.8-78.8 83.2-152.2 203.1-164.1 120-11.9 223.6 42.4 231.3 121.1 7.9 78.8-83.1 152.3-203 164.1m239.9-261.5c-10.2-3.1-17.2-5.1-11.9-18.5 11.6-29.1 12.8-54.2.2-72.2-23.5-33.6-87.9-31.8-161.7-.9 0 0-23.2 10.1-17.2-8.2 11.3-36.5 9.6-67-8-84.7-40-40.1-146.5 1.5-237.8 92.8-68.3 68.3-108 140.8-108 203.5 0 119.8 153.7 192.7 304 192.7 197.1 0 328.2-114.5 328.2-205.4.1-55-46.2-86.2-87.8-99.1" fill="#E6162D"/>
                <path d="M675.3 63.323c-47.6-52.8-117.8-72.9-182.6-59.1-15 3.2-24.5 18-21.3 32.9 3.2 15 17.9 24.5 32.9 21.3 46.1-9.8 96 4.5 129.8 42 33.8 37.5 43 88.6 28.5 133.4-4.7 14.6 3.3 30.2 17.9 34.9 14.6 4.7 30.2-3.3 34.9-17.8v-.1c20.4-62.9 7.5-134.8-40.1-187.5" fill="#F93"/>
                <path d="M602.2 129.323c-23.2-25.7-57.4-35.5-88.9-28.7-12.9 2.7-21.1 15.5-18.4 28.4 2.8 12.9 15.5 21.1 28.3 18.3 15.4-3.3 32.2 1.5 43.5 14 11.3 12.6 14.4 29.7 9.5 44.7-4 12.5 2.8 26 15.4 30.1 12.6 4 26-2.8 30.1-15.4 9.9-30.7 3.7-65.7-19.5-91.4" fill="#F93"/>
                <path d="M311.1 401.523c-4.2 7.2-13.5 10.6-20.7 7.6-7.2-2.9-9.4-11-5.3-18 4.2-7 13.1-10.4 20.2-7.6 7.2 2.6 9.8 10.7 5.8 18m-38.3 49c-11.6 18.5-36.5 26.6-55.2 18.1-18.4-8.4-23.9-29.9-12.3-48 11.5-18 35.5-26 54.1-18.2 18.8 8.1 24.8 29.4 13.4 48.1m43.6-131c-57.1-14.9-121.6 13.6-146.4 63.9-25.3 51.3-.8 108.3 56.8 126.9 59.8 19.3 130.2-10.3 154.7-65.6 24.2-54.2-6-109.9-65.1-125.2"/>
              </svg>
            </div>
            <span class="oauth-label">微博</span>
          </button>
          
          <button class="oauth-btn" @click="showAccountModal = true">
            <div class="oauth-icon account-icon">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="white">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span class="oauth-label">账号登录</span>
          </button>

          <!-- 第二行 -->
          <button class="oauth-btn" @click="handleOAuthLogin('douyin')">
            <div class="oauth-icon douyin-icon">
              <svg viewBox="0 0 1024 1024" width="24" height="24" fill="white">
                <path d="M512 128c-212.1 0-384 171.9-384 384s171.9 384 384 384 384-171.9 384-384-171.9-384-384-384z m190.5 374.4c-32.5 0-63.1-10.4-87.8-28v124.9c0 119.5-96.8 216.3-216.3 216.3S182.1 718.8 182.1 599.3s96.8-216.3 216.3-216.3c4 0 7.9 0.1 11.8 0.4v108.2c-3.9-0.5-7.8-0.8-11.8-0.8-59.3 0-107.4 48.1-107.4 107.4s48.1 107.4 107.4 107.4 107.4-48.1 107.4-107.4V273.5h105.2c0 4 0.2 8 0.5 11.9 5 57.3 52.1 102.1 109.7 102.1v114.9z"/>
              </svg>
            </div>
            <span class="oauth-label">抖音</span>
          </button>
          
          <button class="oauth-btn" @click="handleOAuthLogin('huawei')">
            <div class="oauth-icon huawei-icon">
              <svg viewBox="0 0 24 24" width="28" height="28">
                <path d="M10.341 17.042s.062-.061 0-.061C7.516 10.902 3.646 6.22 3.646 6.22S1.557 8.168 1.68 10.174c.061 1.52 1.228 2.37 1.228 2.37 1.843 1.763 6.266 4.012 7.31 4.499h.123zm-.737 1.52c0-.061-.123-.061-.123-.061l-7.371.243c.798 1.398 2.15 2.492 3.563 2.188.983-.243 3.194-1.763 3.87-2.25.123-.12.061-.12.061-.12zm.123-.67c.062-.06 0-.12 0-.12C6.471 15.581.206 12.3.206 12.3c-.553 1.763.184 3.161.184 3.161.798 1.702 2.334 2.189 2.334 2.189.676.303 1.413.303 1.413.303h5.529c.061 0 .061-.06.061-.06zm.492-14.831c-.308 0-1.168.243-1.168.243-1.965.486-2.395 2.249-2.395 2.249-.369 1.094 0 2.31 0 2.31.675 2.857 3.87 7.598 4.545 8.57l.062.062c.061 0 .061-.061.061-.061C12.43 5.796 10.22 3.06 10.22 3.06zm2.457 13.373c.061 0 .123-.061.123-.061.737-1.033 3.87-5.714 4.545-8.57 0 0 .369-1.399 0-2.31 0 0-.491-1.764-2.457-2.25 0 0-.553-.121-1.167-.243 0 0-2.211 2.796-1.106 13.312 0 .122.062.122.062.122zm1.72 2.067s-.062 0-.062.06v.122c.738.486 2.826 2.006 3.87 2.249 0 0 1.905.669 3.563-2.188l-7.371-.243zm9.398-6.261s-6.265 3.343-9.521 5.531c0 0-.062.06-.062.122 0 0 0 .06.062.06h5.651s.553 0 1.29-.303c0 0 1.536-.487 2.396-2.25 0-.06.737-1.458.184-3.16zM13.66 17.042s.061.06.122 0c1.045-.547 5.468-2.736 7.31-4.499 0 0 1.168-.911 1.23-2.37.122-2.067-1.967-3.951-1.967-3.951s-3.87 4.559-6.695 10.698c0 0-.062.06 0 .122z" fill="#C7000B"/>
              </svg>
            </div>
            <span class="oauth-label">华为</span>
          </button>

          <button class="oauth-btn" @click="handleOAuthLogin('xiaomi')">
            <div class="oauth-icon xiaomi-icon">
              <svg viewBox="-7.93728 -13.2296 68.78976 79.3776" width="32" height="32">
                <defs><clipPath id="a"><path d="M0 595.28h841.89V0H0z"/></clipPath></defs>
                <g clip-path="url(#a)" transform="matrix(.35278 0 0 -.35278 -196.111 155.4552)">
                  <path fill-rule="evenodd" fill="#ff6700" d="M700.2027 290.6537H561.5962c-3.145 0-5.6943 2.5495-5.6943 5.6946v138.6162c0 3.1452 2.5493 5.6932 5.6943 5.6932h138.6065c3.145 0 5.6942-2.548 5.6942-5.6932V296.3483c0-3.1451-2.5493-5.6946-5.6942-5.6946"/>
                  <g fill="#fff">
                    <path d="M673.5186 393.4786h-11.8004c-.5053 0-.9144-.402-.9144-.8972v-53.8442c0-.491.4091-.8929.9144-.8929h11.8004c.501 0 .9158.402.9158.893v53.8441c0 .4952-.4148.8972-.9158.8972m-40.2916 0h-44.9496c-.5053 0-.9115-.402-.9115-.8972v-53.8442c0-.491.4062-.8929.9115-.8929h11.8033c.5024 0 .9186.402.9186.893v42.2596c0 .488.4062.8929.9115.8929h25.4252c7.1498 0 9.1794-5.4764 9.1794-9.0092v-34.1434c0-.491.4105-.8929.9158-.8929h11.7961c.5024 0 .9144.402.9144.893v38.1971c0 3.151-.379 7.6814-4.444 11.6692-4.2531 4.163-8.133 4.875-12.4708 4.875"/>
                    <path d="M624.959 372.0322h-12.3918c-.5053 0-.92-.402-.92-.8943v-32.405c0-.4895.4147-.8914.92-.8914h12.3918c.501 0 .9115.402.9115.8914v32.405c0 .4924-.4105.8943-.9115.8943"/>
                  </g>
                </g>
              </svg>
            </div>
            <span class="oauth-label">小米</span>
          </button>
          
          <button class="oauth-btn" @click="handleOAuthLogin('google')">
            <div class="oauth-icon google-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <span class="oauth-label">谷歌</span>
          </button>
          
          <button class="oauth-btn" @click="handleOAuthLogin('microsoft')">
            <div class="oauth-icon microsoft-icon">
              <svg viewBox="0 0 23 23" width="24" height="24">
                <path fill="#F25022" d="M0 0h11v11H0z"/>
                <path fill="#7FBA00" d="M12 0h11v11H12z"/>
                <path fill="#00A4EF" d="M0 12h11v11H0z"/>
                <path fill="#FFB900" d="M12 12h11v11H12z"/>
              </svg>
            </div>
            <span class="oauth-label">微软</span>
          </button>

          <!-- 第三行 -->
          <button class="oauth-btn oauth-btn-wide" @click="handleOAuthLogin('gitee')">
            <div class="oauth-icon gitee-icon">
              <svg viewBox="0 0 1024 1024" width="24" height="24" fill="white">
                <path d="M512 42.7C252.9 42.7 42.7 252.9 42.7 512c0 207.1 134.2 382.8 320.5 444.6 23.4 4.3 32-10.1 32-22.6 0-11.1-0.4-40.6-0.6-79.7-130.5 28.4-158.1-62.9-158.1-62.9-21.3-54.1-52-68.5-52-68.5-42.5-29.1 3.2-28.5 3.2-28.5 47 3.3 71.7 48.3 71.7 48.3 41.8 71.6 109.7 50.9 136.4 38.9 4.2-30.3 16.3-50.9 29.7-62.6-104-11.8-213.3-52-213.3-231.5 0-51.1 18.3-92.9 48.3-125.6-4.8-11.8-20.9-59.5 4.6-124 0 0 39.4-12.6 129 48 37.4-10.4 77.5-15.6 117.4-15.8 39.8 0.2 80 5.4 117.4 15.8 89.5-60.6 129-48 129-48 25.5 64.5 9.4 112.2 4.6 124 30 32.7 48.3 74.5 48.3 125.6 0 179.9-109.5 219.6-213.7 231.2 16.8 14.5 31.8 43.1 31.8 86.8 0 62.6-0.6 113.1-0.6 128.5 0 12.5 8.4 27.1 32.1 22.5C847 894.5 981.3 719 981.3 512c0-259.1-210.2-469.3-469.3-469.3z"/>
              </svg>
            </div>
            <span class="oauth-label">Gitee</span>
          </button>
          
          <button class="oauth-btn oauth-btn-wide" @click="handleOAuthLogin('github')">
            <div class="oauth-icon github-icon">
              <svg viewBox="0 0 1024 1024" width="22" height="22" fill="white">
                <path d="M512 42.7C252.9 42.7 42.7 252.9 42.7 512c0 207.1 134.2 382.8 320.5 444.6 23.4 4.3 32-10.1 32-22.6 0-11.1-0.4-40.6-0.6-79.7-130.5 28.4-158.1-62.9-158.1-62.9-21.3-54.1-52-68.5-52-68.5-42.5-29.1 3.2-28.5 3.2-28.5 47 3.3 71.7 48.3 71.7 48.3 41.8 71.6 109.7 50.9 136.4 38.9 4.2-30.3 16.3-50.9 29.7-62.6-104-11.8-213.3-52-213.3-231.5 0-51.1 18.3-92.9 48.3-125.6-4.8-11.8-20.9-59.5 4.6-124 0 0 39.4-12.6 129 48 37.4-10.4 77.5-15.6 117.4-15.8 39.8 0.2 80 5.4 117.4 15.8 89.5-60.6 129-48 129-48 25.5 64.5 9.4 112.2 4.6 124 30 32.7 48.3 74.5 48.3 125.6 0 179.9-109.5 219.6-213.7 231.2 16.8 14.5 31.8 43.1 31.8 86.8 0 62.6-0.6 113.1-0.6 128.5 0 12.5 8.4 27.1 32.1 22.5C847 894.5 981.3 719 981.3 512c0-259.1-210.2-469.3-469.3-469.3z"/>
              </svg>
            </div>
            <span class="oauth-label">GitHub</span>
          </button>
        </div>

        <!-- 底部提示 -->
        <div class="login-footer">
          <p class="footer-text">登录即表示您同意我们的</p>
          <div class="footer-links">
            <a href="#" class="footer-link">服务条款</a>
            <span class="divider">和</span>
            <a href="#" class="footer-link">隐私政策</a>
          </div>
        </div>
      </div>

      <!-- 特性介绍 -->
      <div class="features">
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div class="feature-content">
            <h4 class="feature-title">隐私保护</h4>
            <p class="feature-desc">无需注册，保护您的隐私</p>
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div class="feature-content">
            <h4 class="feature-title">即时接收</h4>
            <p class="feature-desc">实时接收邮件，无需等待</p>
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="feature-content">
            <h4 class="feature-title">自动清理</h4>
            <p class="feature-desc">邮箱自动过期，无需手动管理</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 账号登录弹窗 -->
    <AccountLoginModal 
      :visible="showAccountModal" 
      @close="showAccountModal = false"
      @success="handleAccountLoginSuccess"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useNotification } from '@/composables/useNotification'
import AccountLoginModal from '@/components/AccountLoginModal.vue'

const emit = defineEmits(['close', 'success'])

const authStore = useAuthStore()
const { showNotification } = useNotification()

const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const showAccountModal = ref(false)

const handleLogin = async () => {
  if (!password.value) {
    showNotification('请输入密码', 'error')
    return
  }

  loading.value = true
  
  try {
    await authStore.login(password.value)
    showNotification('登录成功！', 'success')
    emit('success')
    emit('close')
  } catch (error) {
    showNotification(error.message || '登录失败，请检查密码', 'error')
  } finally {
    loading.value = false
  }
}

const handleOAuthLogin = async (provider) => {
  // 百度登录可以测试
  if (provider === 'baidu') {
    loading.value = true
    try {
      await authStore.loginWithOAuth(provider)
      showNotification('百度登录成功！', 'success')
      emit('success')
      emit('close')
    } catch (error) {
      showNotification(error.message || '百度登录失败', 'error')
    } finally {
      loading.value = false
    }
  } else {
    showNotification(`${provider} 登录功能即将开放...`, 'info')
  }
}

const handleAccountLoginSuccess = () => {
  showNotification('登录成功！', 'success')
  emit('success')
  emit('close')
}
</script>

<style scoped>
.login-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  overflow-y: auto;
  overflow-x: hidden;
  background: #f5f7fa;
}

/* 渐变背景装饰 - 独立呼吸动画 */
.gradient-blob {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform, opacity, filter;
}

.gradient-blob-1 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(255, 105, 180, 0.5) 0%, rgba(255, 182, 203, 0.25) 70%, transparent 100%);
  top: -150px;
  left: -100px;
  filter: blur(50px);
  animation: breathe1 6s ease-in-out infinite;
}

.gradient-blob-2 {
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(138, 92, 246, 0.4) 0%, rgba(167, 139, 250, 0.25) 70%, transparent 100%);
  bottom: -150px;
  right: -100px;
  filter: blur(45px);
  animation: breathe2 8s ease-in-out infinite 1s;
}

.gradient-blob-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(96, 165, 250, 0.25) 70%, transparent 100%);
  top: 40%;
  right: -80px;
  filter: blur(40px);
  animation: breathe3 7s ease-in-out infinite 2s;
}

@keyframes breathe1 {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0.7;
    filter: blur(50px);
  }
  25% {
    transform: translate(180px, 120px) scale(1.5);
    opacity: 0.9;
    filter: blur(65px);
  }
  50% {
    transform: translate(150px, -100px) scale(1.3);
    opacity: 0.75;
    filter: blur(58px);
  }
  75% {
    transform: translate(-120px, 80px) scale(1.4);
    opacity: 0.85;
    filter: blur(62px);
  }
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.7;
    filter: blur(50px);
  }
}

@keyframes breathe2 {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0.65;
    filter: blur(45px);
  }
  25% {
    transform: translate(-150px, -130px) scale(1.45);
    opacity: 0.85;
    filter: blur(60px);
  }
  50% {
    transform: translate(120px, -90px) scale(1.25);
    opacity: 0.7;
    filter: blur(52px);
  }
  75% {
    transform: translate(-100px, 110px) scale(1.35);
    opacity: 0.8;
    filter: blur(56px);
  }
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.65;
    filter: blur(45px);
  }
}

@keyframes breathe3 {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0.6;
    filter: blur(40px);
  }
  25% {
    transform: translate(-130px, 150px) scale(1.4);
    opacity: 0.8;
    filter: blur(55px);
  }
  50% {
    transform: translate(140px, 100px) scale(1.2);
    opacity: 0.65;
    filter: blur(48px);
  }
  75% {
    transform: translate(-160px, -120px) scale(1.35);
    opacity: 0.75;
    filter: blur(52px);
  }
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.6;
    filter: blur(40px);
  }
}

.login-container {
  position: relative;
  z-index: 1;
  max-width: 520px;
  width: 100%;
  animation: fadeInUp 0.6s ease;
  margin: auto 0;
  flex-shrink: 0;
}

/* Logo 和品牌 */
.brand-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 28px;
}

.logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.logo:hover {
  animation: logoBreathe 2s ease-in-out infinite;
}

@keyframes logoBreathe {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.5);
  }
}

.logo svg {
  color: white;
}

.brand-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.brand-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.3px;
}

.brand-subtitle {
  font-size: 0.8125rem;
  color: #a0aec0;
  margin: 0;
  font-weight: 400;
  line-height: 1.2;
}

/* 欢迎区域 */
.welcome-section {
  text-align: center;
  margin-bottom: 32px;
}

.welcome-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 8px 0;
  letter-spacing: 0;
}

.welcome-subtitle {
  font-size: 0.9rem;
  color: #a0aec0;
  margin: 0;
  font-weight: 400;
}

/* 登录卡片 */
.login-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px 36px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.login-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
  margin: 0 0 20px 0;
}

/* 密码登录区域 */
.password-section {
  margin-bottom: 28px;
}

.password-input-wrapper {
  position: relative;
  margin-bottom: 16px;
}

.password-input {
  width: 100%;
  padding: 14px 48px 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  color: #2c3e50;
  background: white;
  transition: all 0.3s ease;
  outline: none;
}

.password-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.password-input::placeholder {
  color: #94a3b8;
}

.toggle-password-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.toggle-password-btn:hover {
  color: #6366f1;
}

.login-submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
}

.login-submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.login-submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 分隔线 */
.divider {
  position: relative;
  text-align: center;
  margin: 28px 0 24px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, #e2e8f0 20%, #e2e8f0 80%, transparent);
}

.divider span {
  position: relative;
  display: inline-block;
  padding: 0 16px;
  background: white;
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 500;
}

/* OAuth 登录网格 - 卡片效果 */
.oauth-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 28px;
  justify-content: center;
}

.oauth-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  padding: 16px 14px;
  border-radius: 12px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  width: calc(20% - 11.2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.oauth-btn:hover {
  transform: translateY(-4px);
  background: #fafbfc;
  border-color: #cbd5e0;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.oauth-btn:active {
  transform: translateY(-2px);
}

.oauth-btn-wide {
  width: calc(40% - 7px);
}

.oauth-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.25s ease;
}

.oauth-btn:hover .oauth-icon {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: iconBreathe 1.5s ease-in-out infinite;
}

@keyframes iconBreathe {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

/* 各平台图标样式 */
.qq-icon { background: linear-gradient(135deg, #12B7F5 0%, #0E9FE0 100%); box-shadow: 0 4px 12px rgba(18, 183, 245, 0.3); }
.wechat-icon { background: linear-gradient(135deg, #09BB07 0%, #07A002 100%); box-shadow: 0 4px 12px rgba(9, 187, 7, 0.3); }
.alipay-icon { background: white; border: 1px solid #dadce0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
.weibo-icon { background: white; border: 1px solid #dadce0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
.account-icon { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
.douyin-icon { background: linear-gradient(135deg, #000 0%, #2B2B2B 100%); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4); }
.huawei-icon { background: white; border: 1px solid #dadce0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
.xiaomi-icon { background: linear-gradient(135deg, #FF6900 0%, #F34F00 100%); box-shadow: 0 4px 12px rgba(255, 105, 0, 0.3); }
.google-icon { background: white; border: 1px solid #dadce0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
.microsoft-icon { background: white; border: 1px solid #dadce0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
.gitee-icon { background: linear-gradient(135deg, #C71D23 0%, #A01519 100%); box-shadow: 0 4px 12px rgba(199, 29, 35, 0.3); }
.github-icon { background: linear-gradient(135deg, #24292e 0%, #1a1e22 100%); box-shadow: 0 4px 12px rgba(36, 41, 46, 0.3); }

.icon-text {
  font-size: 13px;
  font-weight: 500;
  color: white;
}

.oauth-label {
  font-size: 0.8125rem;
  color: #4a5568;
  font-weight: 400;
}

/* 登录页脚 */
.login-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.footer-text {
  font-size: 0.8125rem;
  color: #a0aec0;
  margin: 0 0 6px 0;
}

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.8125rem;
}

.footer-link {
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: #4f46e5;
  text-decoration: underline;
}

.divider {
  color: #a0aec0;
}

/* 特性卡片 */
.features {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 20px 20px;
  text-align: left;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.feature-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e0;
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 10px;
  flex-shrink: 0;
  color: white;
}

.feature-content {
  flex: 1;
}

.feature-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 4px 0;
}

.feature-desc {
  font-size: 0.8125rem;
  color: #a0aec0;
  margin: 0;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-page {
    padding: 20px;
    align-items: flex-start;
    padding-top: 40px;
  }

  .login-container {
    margin-top: 0;
  }

  .login-card {
    padding: 28px 20px;
  }

  .oauth-btn {
    width: calc(33.333% - 9.33px);
  }

  .oauth-btn-wide {
    width: calc(33.333% - 9.33px);
  }

  .welcome-title {
    font-size: 1.5rem;
  }

  .brand-section {
    flex-direction: column;
    gap: 8px;
  }

  .brand-info {
    align-items: center;
  }

  .brand-name {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .login-page {
    padding: 20px 12px;
  }

  .oauth-btn {
    width: calc(50% - 7px);
  }

  .oauth-btn-wide {
    width: calc(50% - 7px);
  }

  .login-title {
    font-size: 1rem;
  }

  .oauth-icon {
    width: 48px;
    height: 48px;
  }

  .oauth-label {
    font-size: 0.8rem;
  }

  .welcome-title {
    font-size: 1.5rem;
  }

  .features {
    gap: 10px;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
