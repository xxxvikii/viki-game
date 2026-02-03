(() => {
  const notification = document.getElementById('notification');
  function showNotification(message, type = 'info', duration = 3000) {
    if (!notification) return;
    notification.textContent = message;
    notification.className = `notification ${type}`;
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => (notification.textContent = ''), 300);
    }, duration);
  }
  const mobileBtn = document.getElementById('mobile-menu-button');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      const mobileMenu = document.getElementById('mobile-menu');
      if (mobileMenu) mobileMenu.classList.toggle('hidden');
    });
  }
  const apiProviderSelect = document.getElementById('api-provider');
  const apiConfigSections = document.querySelectorAll('.api-config-section');
  if (apiProviderSelect) {
    apiProviderSelect.addEventListener('change', function () {
      const selectedProvider = this.value;
      apiConfigSections.forEach((section) => section.classList.add('hidden'));
      const section = document.getElementById(`${selectedProvider}-config`);
      if (section) section.classList.remove('hidden');
      updateCurrentProviderStatus(selectedProvider);
      loadSavedConfig(selectedProvider);
    });
  }
  const modelSelects = document.querySelectorAll('select[id$="-model"]');
  modelSelects.forEach((select) => {
    select.addEventListener('change', function () {
      const isCustom = this.value === 'custom';
      const providerId = this.id.split('-model')[0];
      const customModelContainer = document.getElementById(`${providerId}-custom-model-container`);
      if (customModelContainer) customModelContainer.classList.toggle('hidden', !isCustom);
    });
  });
  const customRequestFormatSelect = document.getElementById('custom-request-format');
  const customFormatTemplateContainer = document.getElementById('custom-format-template-container');
  if (customRequestFormatSelect && customFormatTemplateContainer) {
    customRequestFormatSelect.addEventListener('change', function () {
      customFormatTemplateContainer.classList.toggle('hidden', this.value !== 'custom');
    });
  }
  const temperatureSlider = document.getElementById('temperature');
  const temperatureValue = document.getElementById('temperature-value');
  const topPSlider = document.getElementById('top-p');
  const topPValue = document.getElementById('top-p-value');
  const frequencyPenaltySlider = document.getElementById('frequency-penalty');
  const frequencyPenaltyValue = document.getElementById('frequency-penalty-value');
  const presencePenaltySlider = document.getElementById('presence-penalty');
  const presencePenaltyValue = document.getElementById('presence-penalty-value');
  if (temperatureSlider && temperatureValue) {
    temperatureSlider.addEventListener('input', function () {
      temperatureValue.textContent = this.value;
    });
  }
  if (topPSlider && topPValue) {
    topPSlider.addEventListener('input', function () {
      topPValue.textContent = this.value;
    });
  }
  if (frequencyPenaltySlider && frequencyPenaltyValue) {
    frequencyPenaltySlider.addEventListener('input', function () {
      frequencyPenaltyValue.textContent = this.value;
    });
  }
  if (presencePenaltySlider && presencePenaltyValue) {
    presencePenaltySlider.addEventListener('input', function () {
      presencePenaltyValue.textContent = this.value;
    });
  }
  const testBtn = document.getElementById('test-gen-btn');
  const testSpinner = document.getElementById('test-api-spinner');
  const apiStatusResp = document.getElementById('api-response-time');
  const lastApiCallEl = document.getElementById('last-api-call');
  const todayApiCallsEl = document.getElementById('today-api-calls');
  async function deriveKey(pass, salt) {
    const enc = new TextEncoder().encode(pass);
    const baseKey = await crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  async function encryptWithPass(pass, text) {
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    const key = await deriveKey(pass, salt);
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);
    const enc = new TextEncoder().encode(text);
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc);
    return {
      s: btoa(String.fromCharCode(...salt)),
      i: btoa(String.fromCharCode(...iv)),
      c: btoa(String.fromCharCode(...new Uint8Array(cipher))),
    };
  }
  async function decryptWithPass(pass, payload) {
    if (!payload) return '';
    const salt = Uint8Array.from(atob(payload.s || ''), (c) => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(payload.i || ''), (c) => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(payload.c || ''), (c) => c.charCodeAt(0));
    const key = await deriveKey(pass, salt);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return new TextDecoder().decode(plain);
  }
  async function readApiKey(provider) {
    const stored = JSON.parse(localStorage.getItem('apiConfig') || '{}');
    const fieldEl = document.getElementById(`${provider}-api-key`);
    const fieldVal = fieldEl ? fieldEl.value || '' : '';
    if (stored.provider === provider && stored.apiKeyEnc) {
      const passInput = document.getElementById('api-passphrase');
      const pass = (passInput && passInput.value) || sessionStorage.getItem('apiPassphraseSession') || '';
      if (!pass) return fieldVal;
      try {
        return await decryptWithPass(pass, stored.apiKeyEnc);
      } catch {
        return fieldVal;
      }
    }
    return fieldVal;
  }
  function getModelValue(provider) {
    const selEl = document.getElementById(`${provider}-model`);
    const sel = selEl ? selEl.value : '';
    if (sel === 'custom') {
      const custom = document.getElementById(`${provider}-custom-model`);
      return custom ? custom.value : '';
    }
    return sel;
  }
  function buildChatRequest(provider, apiBase, model, apiKey, content) {
    const base = apiBase.replace(/\/$/, '');
    const url = `${base}/chat/completions`;
    const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    const body = {
      model,
      messages: [
        { role: 'system', content: '仅返回JSON对象：{"ok":true}' },
        { role: 'user', content },
      ],
      temperature: 0,
      max_tokens: 64,
      top_p: 1,
    };
    if (['openai', 'deepseek', 'siliconflow', 'custom'].includes(provider)) {
      body.response_format = { type: 'json_object' };
    }
    return { url, headers, body };
  }
  if (testBtn) {
    testBtn.addEventListener('click', async function () {
      const provider = apiProviderSelect.value;
      const apiBase = document.getElementById(`${provider}-api-base`).value;
      const model = getModelValue(provider);
      if (!apiBase) {
        showNotification('请输入API基础URL', 'warning');
        return;
      }
      if (['huoshan', 'custom', 'openai', 'deepseek', 'siliconflow'].includes(provider) && !model) {
        showNotification('请选择或填写模型名称', 'warning');
        return;
      }
      if (testSpinner) testSpinner.classList.remove('hidden');
      testBtn.disabled = true;
      updateApiStatus('testing', '测试中...');
      try {
        const apiKey = await readApiKey(provider);
        if (!apiKey) throw new Error('缺少API密钥');
        if (window.ancientAIApi) {
          window.ancientAIApi.setConfig({
            provider,
            baseUrl: apiBase,
            apiKey,
            model,
            temperature: parseFloat(temperatureSlider.value),
            maxTokens: parseInt(document.getElementById('max-tokens').value),
          });
          const ok = await window.ancientAIApi.testConnection();
          if (!ok) throw new Error(window.ancientAIApi.getStatus().error || '连接失败');
          updateApiStatus('connected', '已连接');
          const elapsed = window.ancientAIApi.getStatus().responseTime || '-';
          apiStatusResp.textContent = `${elapsed} ms`;
          const now = new Date();
          lastApiCallEl.textContent = now.toLocaleString();
          const todayCalls = parseInt(todayApiCallsEl.textContent) + 1;
          todayApiCallsEl.textContent = todayCalls;
          showNotification('API连接测试成功', 'success');
          saveApiStatus({
            provider,
            status: 'connected',
            responseTime: elapsed,
            lastCall: now.toISOString(),
            todayCalls,
          });
        } else {
          const result = await testProviderConnection({ provider, apiBase, model });
          updateApiStatus('connected', '已连接');
          apiStatusResp.textContent = `${result.elapsed} ms`;
          const now = new Date();
          lastApiCallEl.textContent = now.toLocaleString();
          const todayCalls = parseInt(todayApiCallsEl.textContent) + 1;
          todayApiCallsEl.textContent = todayCalls;
          showNotification('API连接测试成功', 'success');
          saveApiStatus({
            provider,
            status: 'connected',
            responseTime: result.elapsed,
            lastCall: now.toISOString(),
            todayCalls,
          });
        }
      } catch (err) {
        updateApiStatus('disconnected', '连接失败');
        if (apiStatusResp) apiStatusResp.textContent = `${err.elapsed || '-' } ms`;
        showNotification(`API连接测试失败：${err.message}`, 'error');
      } finally {
        if (testSpinner) testSpinner.classList.add('hidden');
        testBtn.disabled = false;
      }
    });
  }
  async function testProviderConnection({ provider, apiBase, model }) {
    const apiKey = await readApiKey(provider);
    if (!apiKey) throw new Error('缺少API密钥');
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const started = performance.now();
    try {
      let url = '';
      let init = { method: 'GET', headers, signal: controller.signal };
      switch (provider) {
        case 'openai':
        case 'deepseek':
        case 'siliconflow':
          url = `${apiBase.replace(/\/$/, '')}/models`;
          break;
        case 'huoshan': {
          url = `${apiBase.replace(/\/$/, '')}/chat/completions`;
          init = {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: 'ping' }],
              max_tokens: 1,
              temperature: 0,
            }),
            signal: controller.signal,
          };
          break;
        }
        case 'custom': {
          url = `${apiBase.replace(/\/$/, '')}/models`;
          break;
        }
        default:
          throw new Error('未知提供商');
      }
      const res = await fetch(url, init);
      const elapsed = Math.round(performance.now() - started);
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const text = await res.text();
          msg += ` - ${text.slice(0, 200)}`;
        } catch {}
        const err = new Error(`连接失败：${msg}`);
        err.elapsed = elapsed;
        throw err;
      }
      try {
        await res.clone().json();
      } catch {}
      clearTimeout(timeout);
      return { ok: true, elapsed };
    } catch (e) {
      clearTimeout(timeout);
      const isCors = e instanceof TypeError && /fetch/i.test(e.message);
      const message = isCors ? '可能被浏览器的CORS策略拦截，请改用后端代理或允许跨域' : e.message || '连接失败';
      const err = new Error(message);
      err.elapsed = Math.round(performance.now() - started);
      throw err;
    }
  }
  if (testApiBtn) {
    testApiBtn.addEventListener('click', async function () {
      const provider = apiProviderSelect.value;
      const apiBase = document.getElementById(`${provider}-api-base`).value;
      const model = getModelValue(provider);
      if (!apiBase) {
        showNotification('请输入API基础URL', 'warning');
        return;
      }
      if (['huoshan', 'custom', 'openai', 'deepseek', 'siliconflow'].includes(provider) && !model) {
        showNotification('请选择或填写模型名称', 'warning');
        return;
      }
      testApiSpinner.classList.remove('hidden');
      testApiBtn.disabled = true;
      updateApiStatus('testing', '测试中...');
      try {
        const apiKey = await readApiKey(provider);
        if (!apiKey) throw new Error('缺少API密钥');
        if (window.ancientAIApi) {
          window.ancientAIApi.setConfig({
            provider,
            baseUrl: apiBase,
            apiKey,
            model,
            temperature: parseFloat(temperatureSlider.value),
            maxTokens: parseInt(document.getElementById('max-tokens').value),
          });
          const ok = await window.ancientAIApi.testConnection();
          if (!ok) throw new Error(window.ancientAIApi.getStatus().error || '连接失败');
          updateApiStatus('connected', '已连接');
          const elapsed = window.ancientAIApi.getStatus().responseTime || '-';
          apiStatusResp.textContent = `${elapsed} ms`;
          const now = new Date();
          lastApiCallEl.textContent = now.toLocaleString();
          const todayCalls = parseInt(todayApiCallsEl.textContent) + 1;
          todayApiCallsEl.textContent = todayCalls;
          showNotification('API连接测试成功', 'success');
          saveApiStatus({
            provider,
            status: 'connected',
            responseTime: elapsed,
            lastCall: now.toISOString(),
            todayCalls,
          });
        } else {
          const result = await testProviderConnection({ provider, apiBase, model });
          updateApiStatus('connected', '已连接');
          apiStatusResp.textContent = `${result.elapsed} ms`;
          const now = new Date();
          lastApiCallEl.textContent = now.toLocaleString();
          const todayCalls = parseInt(todayApiCallsEl.textContent) + 1;
          todayApiCallsEl.textContent = todayCalls;
          showNotification('API连接测试成功', 'success');
          saveApiStatus({
            provider,
            status: 'connected',
            responseTime: result.elapsed,
            lastCall: now.toISOString(),
            todayCalls,
          });
        }
      } catch (err) {
        updateApiStatus('disconnected', '连接失败');
        apiStatusResp.textContent = `${err.elapsed || '-'} ms`;
        showNotification(`API连接测试失败：${err.message}`, 'error');
      } finally {
        testApiSpinner.classList.add('hidden');
        testApiBtn.disabled = false;
      }
    });
  }
  const saveConfigBtn = document.getElementById('save-config-btn');
  if (saveConfigBtn) {
    saveConfigBtn.addEventListener('click', async function () {
      const selectedProvider = apiProviderSelect.value;
      const apiKeyPlain = document.getElementById(`${selectedProvider}-api-key`).value;
      const passphrase = document.getElementById('api-passphrase').value;
      const keepSession = document.getElementById('api-passphrase-keep-session').checked;
      if (!apiKeyPlain) {
        showNotification('请输入API密钥', 'warning');
        return;
      }
      if (!passphrase) {
        showNotification('请输入本地密钥保护口令', 'warning');
        return;
      }
      const config = {
        provider: selectedProvider,
        apiKeyEnc: await encryptWithPass(passphrase, apiKeyPlain),
        model: document.getElementById(`${selectedProvider}-model`).value,
        apiBase: document.getElementById(`${selectedProvider}-api-base`).value,
        temperature: parseFloat(temperatureSlider.value),
        maxTokens: parseInt(document.getElementById('max-tokens').value),
        topP: parseFloat(topPSlider.value),
        frequencyPenalty: parseFloat(frequencyPenaltySlider.value),
        presencePenalty: parseFloat(presencePenaltySlider.value),
      };
      switch (selectedProvider) {
        case 'deepseek':
        case 'huoshan':
        case 'openai':
        case 'siliconflow':
          if (config.model === 'custom') {
            config.customModel = document.getElementById(`${selectedProvider}-custom-model`).value;
          }
          if (document.getElementById(`${selectedProvider}-organization-id`)) {
            config.organizationId = document.getElementById(`${selectedProvider}-organization-id`).value;
          }
          break;
        case 'custom':
          config.apiName = document.getElementById('custom-api-name').value;
          config.requestFormat = document.getElementById('custom-request-format').value;
          if (config.requestFormat === 'custom') {
            config.formatTemplate = document.getElementById('custom-format-template').value;
          }
          break;
      }
      try {
        localStorage.setItem('apiConfig', JSON.stringify(config));
        if (keepSession) sessionStorage.setItem('apiPassphraseSession', passphrase);
        showNotification('配置保存成功', 'success');
        if (window.ancientAIApi) {
          window.ancientAIApi.setConfig({
            provider: config.provider,
            baseUrl: config.apiBase,
            apiKey: apiKeyPlain,
            model: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
          });
        }
      } catch (error) {
        showNotification('配置保存失败', 'error');
        console.error('保存配置失败:', error);
      }
    });
  }
  function updateApiStatus(status, text) {
    const statusElement = document.getElementById('current-provider-status');
    if (!statusElement) return;
    const statusDot = statusElement.querySelector('.api-status');
    if (!statusDot) return;
    statusDot.className = `api-status ${status}`;
    statusDot.nextElementSibling.textContent = text;
  }
  function saveApiStatus(status) {
    try {
      localStorage.setItem('apiStatus', JSON.stringify(status));
    } catch (error) {}
  }
  function loadApiStatus() {
    try {
      const status = JSON.parse(localStorage.getItem('apiStatus'));
      if (status) {
        updateApiStatus(status.status, status.status === 'connected' ? '已连接' : '未连接');
        const respEl = document.getElementById('api-response-time');
        if (respEl) respEl.textContent = `${status.responseTime} ms`;
        if (status.lastCall) {
          const lastCallDate = new Date(status.lastCall);
          const lastEl = document.getElementById('last-api-call');
          if (lastEl) lastEl.textContent = lastCallDate.toLocaleString();
        }
        if (status.todayCalls) {
          const todayEl = document.getElementById('today-api-calls');
          if (todayEl) todayEl.textContent = status.todayCalls;
        }
      }
    } catch (error) {}
  }
  function updateCurrentProviderStatus(provider) {
    try {
      const config = JSON.parse(localStorage.getItem('apiConfig'));
      if (config && config.provider === provider) {
        updateApiStatus('connected', '已连接');
      } else {
        updateApiStatus('disconnected', '未连接');
      }
    } catch (error) {
      updateApiStatus('disconnected', '未连接');
    }
  }
  function loadSavedConfig(provider) {
    try {
      const config = JSON.parse(localStorage.getItem('apiConfig'));
      if (config && config.provider === provider) {
        const pass = sessionStorage.getItem('apiPassphraseSession') || '';
        if (pass && config.apiKeyEnc) {
          (async () => {
            const keyEl = document.getElementById(`${provider}-api-key`);
            if (keyEl) keyEl.value = await decryptWithPass(pass, config.apiKeyEnc);
          })();
        } else {
          const keyEl = document.getElementById(`${provider}-api-key`);
          if (keyEl) keyEl.value = '';
        }
        const modelEl = document.getElementById(`${provider}-model`);
        if (modelEl) modelEl.value = config.model || 'default';
        const baseEl = document.getElementById(`${provider}-api-base`);
        if (baseEl) baseEl.value = config.apiBase || '';
        if (temperatureSlider && temperatureValue) {
          temperatureSlider.value = config.temperature || 0.7;
          temperatureValue.textContent = config.temperature || 0.7;
        }
        const maxTokensEl = document.getElementById('max-tokens');
        if (maxTokensEl) maxTokensEl.value = config.maxTokens || 1000;
        if (topPSlider && topPValue) {
          topPSlider.value = config.topP || 1;
          topPValue.textContent = config.topP || 1;
        }
        if (frequencyPenaltySlider && frequencyPenaltyValue) {
          frequencyPenaltySlider.value = config.frequencyPenalty || 0;
          frequencyPenaltyValue.textContent = config.frequencyPenalty || 0;
        }
        if (presencePenaltySlider && presencePenaltyValue) {
          presencePenaltySlider.value = config.presencePenalty || 0;
          presencePenaltyValue.textContent = config.presencePenalty || 0;
        }
        switch (provider) {
          case 'deepseek':
          case 'huoshan':
          case 'openai':
          case 'siliconflow':
            if (config.model === 'custom') {
              const customModelEl = document.getElementById(`${provider}-custom-model`);
              if (customModelEl) customModelEl.value = config.customModel || '';
              const customContainer = document.getElementById(`${provider}-custom-model-container`);
              if (customContainer) customContainer.classList.remove('hidden');
            }
            if (config.organizationId && document.getElementById(`${provider}-organization-id`)) {
              const orgEl = document.getElementById(`${provider}-organization-id`);
              if (orgEl) orgEl.value = config.organizationId;
            }
            break;
          case 'custom':
            const apiNameEl = document.getElementById('custom-api-name');
            if (apiNameEl) apiNameEl.value = config.apiName || '';
            const reqFmtEl = document.getElementById('custom-request-format');
            if (reqFmtEl) reqFmtEl.value = config.requestFormat || 'openai';
            const customModelEl2 = document.getElementById('custom-model');
            if (customModelEl2) customModelEl2.value = config.model || '';
            if (config.requestFormat === 'custom') {
              const tplEl = document.getElementById('custom-format-template');
              if (tplEl) tplEl.value = config.formatTemplate || '';
              const tplContainer = document.getElementById('custom-format-template-container');
              if (tplContainer) tplContainer.classList.remove('hidden');
            }
            break;
        }
      }
    } catch (error) {}
  }
  window.addEventListener('load', function () {
    if (!apiProviderSelect) return;
    const selectedProvider = apiProviderSelect.value;
    const section = document.getElementById(`${selectedProvider}-config`);
    if (section) section.classList.remove('hidden');
    loadSavedConfig(selectedProvider);
    loadApiStatus();
  });
})();
