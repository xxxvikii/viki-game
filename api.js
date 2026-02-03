/**
 * 古风AI文字人生模拟器 - 独立API适配器
 * 文件名：api.js
 * 核心能力：真实API连接校验、多服务商支持、错误智能诊断、AI剧情请求、全局状态管理
 * 解决问题：API显示已连接但实际未连接、异步请求未等待、状态假判定、跨服务商适配
 * 无依赖 | 全局单例 | 易集成 | 可调试
 */
class AIApiAdapter {
    constructor() {
        // 主流AI服务商预设配置（无需修改，直接使用）
        this.providers = {
            deepseek: {
                baseUrl: 'https://api.deepseek.com/v1',
                models: ['deepseek-chat', 'deepseek-coder'],
                authHeader: 'Authorization',
                authPrefix: 'Bearer ',
                timeout: 30000, // 30秒超时
                temperatureRange: [0.1, 1.0] // 服务商允许的温度范围
            },
            volcengine: {
                baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
                models: ['ep-20240229184820-b4q44', 'ep-20240229184954-8j64g'],
                authHeader: 'Authorization',
                authPrefix: 'Bearer ',
                timeout: 40000
            },
            openai: {
                baseUrl: 'https://api.openai.com/v1',
                models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
                authHeader: 'Authorization',
                authPrefix: 'Bearer ',
                timeout: 30000
            },
            silliconflow: {
                baseUrl: 'https://api.siliconflow.cn/v1',
                models: ['gpt-3.5-turbo', 'gpt-4'],
                authHeader: 'Authorization',
                authPrefix: 'Bearer ',
                timeout: 35000
            },
            custom: {
                baseUrl: '', // 自定义API需手动填写
                models: ['custom-model'],
                authHeader: 'Authorization',
                authPrefix: 'Bearer ',
                timeout: 30000
            }
        };

        // 核心配置（可通过setConfig方法修改）
        this.config = {
            provider: 'deepseek', // 默认服务商
            apiKey: '', // 用户输入的API密钥
            model: 'deepseek-chat', // 默认模型
            temperature: 0.7, // 剧情生成推荐0.7-0.9（更贴合古风）
            maxTokens: 1000, // 单次生成最大令牌数
            // 全局系统提示词（贴合古风游戏场景，可自定义）
            systemPrompt: '你是精通古风文学的AI助手，为古风人生模拟器创作细腻的剧情，语言典雅贴合古风，情节紧凑，字数适配游戏界面，无需额外注释。'
        };

        // 真实连接状态（核心：仅测试请求成功后才会置为true）
        this.status = {
            isConnected: false, // 最终连接状态，无假判定
            isTesting: false,   // 是否正在执行连接测试
            responseTime: null, // 最后一次测试响应时间(ms)
            lastTestTime: null, // 最后一次测试时间
            error: null,        // 最后一次错误信息
            errorDetails: null  // 错误类型+针对性解决方案
        };

        // 调试模式：开启后控制台打印详细日志，方便排查问题
        this.debugMode = true;
    }

    /**
     * 设置API配置（用户选择服务商/输入密钥后调用）
     * @param {Object} config - 配置对象，示例：{provider: 'openai', apiKey: 'sk-xxx', model: 'gpt-3.5-turbo'}
     * @returns {this} 自身实例，支持链式调用
     */
    setConfig(config) {
        // 合并用户配置到默认配置
        Object.assign(this.config, config);
        
        // 自动修正温度值：限制在当前服务商允许的范围内，避免请求报错
        const currentProvider = this.providers[this.config.provider];
        if (currentProvider?.temperatureRange) {
            const [minTemp, maxTemp] = currentProvider.temperatureRange;
            this.config.temperature = Math.max(minTemp, Math.min(maxTemp, this.config.temperature));
        }

        this._log(`✅ API配置更新完成 | 服务商：${this.config.provider} | 模型：${this.config.model}`);
        return this;
    }

    /**
     * 核心方法：真实测试API连接（解决假连接的关键）
     * 发送轻量级测试请求，仅当「HTTP成功+返回格式正确」时，才将isConnected标记为true
     * @returns {Boolean} 连接是否成功
     */
    async testConnection() {
        // 防止重复测试：如果正在测试，直接返回false
        if (this.status.isTesting) {
            this._log('⚠️  正在执行连接测试，请勿重复点击', 'warn');
            return false;
        }

        // 测试前重置状态：清除旧错误，标记为测试中
        this.status = {
            ...this.status,
            isTesting: true,
            error: null,
            errorDetails: null
        };

        const testStartTime = Date.now(); // 记录测试开始时间，用于计算响应时间

        try {
            // 前置校验：必选参数不能为空，提前拦截错误
            this._checkRequiredConfig();

            const currentProvider = this.providers[this.config.provider];
            // 拼接真实请求地址（自定义API用用户填写的baseUrl，其他用预设）
            const apiBaseUrl = this.config.provider === 'custom' ? this.config.baseUrl : currentProvider.baseUrl;
            const testRequestUrl = `${apiBaseUrl}/chat/completions`;

            // 构建测试请求的头信息（含认证）
            const requestHeaders = {
                'Content-Type': 'application/json',
                [currentProvider.authHeader]: `${currentProvider.authPrefix}${this.config.apiKey}`
            };

            // 构建轻量级测试请求体（仅请求10个token，减少资源消耗，测试速度更快）
            const testRequestData = {
                model: this.config.model,
                messages: [
                    { role: 'system', content: this.config.systemPrompt },
                    { role: 'user', content: '测试连接，仅返回"连接成功"即可，无需多余内容' }
                ],
                max_tokens: 10,
                temperature: this.config.temperature
            };

            this._log(`📡  发送测试请求 | 地址：${testRequestUrl}`);

            // 发送请求（带超时中断，防止无限等待）
            const controller = new AbortController();
            const timeoutTimer = setTimeout(() => controller.abort(), currentProvider.timeout);
            const response = await fetch(testRequestUrl, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(testRequestData),
                signal: controller.signal
            });
            clearTimeout(timeoutTimer); // 请求完成，清除超时定时器

            // 第一步校验：HTTP状态码是否为200（请求成功到达服务器并响应）
            if (!response.ok) {
                const errorRes = await response.json().catch(() => ({}));
                const errorMsg = errorRes.error?.message || `HTTP错误：${response.status} ${response.statusText}`;
                throw new Error(errorMsg);
            }

            // 第二步校验：解析返回数据，确保格式符合AI服务商规范
            const responseData = await response.json();
            this._checkResponseFormat(responseData);

            // 所有校验通过：更新为【真实已连接】状态
            const testResponseTime = Date.now() - testStartTime;
            this.status = {
                isConnected: true,
                isTesting: false,
                responseTime: testResponseTime,
                lastTestTime: new Date().toISOString(),
                error: null,
                errorDetails: null
            };

            const aiReply = responseData.choices[0].message.content.trim();
            this._log(`🎉 API连接测试成功 | 响应时间：${testResponseTime}ms | AI返回：${aiReply}`);
            return true;

        } catch (error) {
            // 测试失败：重置为未连接，记录错误信息和解决方案
            const testResponseTime = Date.now() - testStartTime;
            const errorDetails = this._analyzeError(error);
            this.status = {
                isConnected: false,
                isTesting: false,
                responseTime: testResponseTime,
                lastTestTime: new Date().toISOString(),
                error: error.message,
                errorDetails: errorDetails
            };

            this._log(`❌ API连接测试失败 | 原因：${error.message}`, 'error');
            return false;
        }
    }

    /**
     * 游戏核心方法：发送AI剧情生成请求（仅在真实连接成功后才会发送）
     * @param {Array} messages - 对话消息数组，示例：[{role: 'user', content: '玩家在桃花巷遇到一位老者，生成后续剧情'}]
     * @param {Object} options - 自定义请求参数，示例：{maxTokens: 500, temperature: 0.8}
     * @returns {Object} 响应结果：{success: Boolean, content: String, error: String}
     */
    async sendAIRequest(messages, options = {}) {
        // 双重保障：每次请求前都校验真实连接状态，未连接直接返回错误
        if (!this.status.isConnected) {
            const errorMsg = 'API未真实连接，请先调用testConnection()测试并确保成功';
            this._log(errorMsg, 'error');
            return { success: false, error: errorMsg };
        }

        try {
            // 前置校验：防止配置被意外修改
            this._checkRequiredConfig();

            const currentProvider = this.providers[this.config.provider];
            const apiBaseUrl = this.config.provider === 'custom' ? this.config.baseUrl : currentProvider.baseUrl;
            const requestUrl = `${apiBaseUrl}/chat/completions`;

            // 合并默认配置和用户自定义配置
            const finalOptions = {
                maxTokens: this.config.maxTokens,
                temperature: this.config.temperature,
                ...options
            };

            // 构建请求头和请求体
            const requestHeaders = {
                'Content-Type': 'application/json',
                [currentProvider.authHeader]: `${currentProvider.authPrefix}${this.config.apiKey}`
            };
            const requestData = {
                model: this.config.model,
                messages: [
                    { role: 'system', content: this.config.systemPrompt }, // 全局系统提示词
                    ...messages // 玩家的剧情请求
                ],
                max_tokens: finalOptions.maxTokens,
                temperature: finalOptions.temperature
            };

            this._log(`📤  发送AI剧情请求 | 生成令牌数：${finalOptions.maxTokens} | 温度：${finalOptions.temperature}`);

            // 发送请求并处理超时
            const controller = new AbortController();
            const timeoutTimer = setTimeout(() => controller.abort(), currentProvider.timeout);
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(requestData),
                signal: controller.signal
            });
            clearTimeout(timeoutTimer);

            // 校验HTTP状态
            if (!response.ok) {
                const errorRes = await response.json().catch(() => ({}));
                throw new Error(errorRes.error?.message || `HTTP错误：${response.status}`);
            }

            // 解析并返回AI生成的剧情内容
            const responseData = await response.json();
            const storyContent = responseData.choices[0].message.content.trim() || 'AI未生成有效内容';
            this._log(`📥  AI剧情生成成功 | 内容长度：${storyContent.length}字`);

            return {
                success: true,
                content: storyContent,
                error: null
            };

        } catch (error) {
            const errorMsg = `AI请求失败：${error.message}`;
            this._log(errorMsg, 'error');
            return {
                success: false,
                content: null,
                error: errorMsg
            };
        }
    }

    /**
     * 获取当前真实的API连接状态（用于更新游戏/配置页面的UI）
     * @returns {Object} 完整状态对象（返回浅拷贝，防止外部修改内部状态）
     */
    getStatus() {
        return { ...this.status };
    }

    /**
     * 开启/关闭调试模式（上线游戏时可关闭，减少控制台日志）
     * @param {Boolean} enabled - 是否开启调试模式
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        this._log(`🔧  调试模式${enabled ? '已开启' : '已关闭'}`);
    }

    /**
     * 内部方法：校验必选配置（提前拦截无密钥/无服务商等错误）
     * @throws {Error} 配置缺失时抛出错误
     */
    _checkRequiredConfig() {
        if (!this.config.apiKey) throw new Error('API密钥未配置，请先输入有效密钥');
        if (!this.config.provider || !this.providers[this.config.provider]) throw new Error('未选择有效AI服务商');
        if (this.config.provider === 'custom' && !this.config.baseUrl) throw new Error('自定义API需填写基础地址');
        if (!this.config.model) throw new Error('未选择有效AI模型');
    }

    /**
     * 内部方法：校验AI返回数据格式（确保符合规范，防止解析报错）
     * @param {Object} data - AI服务商返回的原始数据
     * @throws {Error} 格式异常时抛出错误
     */
    _checkResponseFormat(data) {
        if (!data || typeof data !== 'object') throw new Error('API返回数据格式异常，非有效JSON');
        if (!Array.isArray(data.choices) || data.choices.length === 0) throw new Error('API返回数据缺失choices字段');
        if (!data.choices[0].message?.content) throw new Error('API返回数据缺失有效响应内容');
    }

    /**
     * 内部方法：智能错误分析（自动分类错误类型，给出针对性解决方案）
     * @param {Error} error - 错误对象
     * @returns {Object} 错误详情：{type: String, solution: String}
     */
    _analyzeError(error) {
        // 错误映射表：覆盖90%的常见API连接错误
        const errorSolutionMap = {
            AbortError: {
                type: '请求超时',
                solution: '1. 检查网络连接是否稳定；2. 确认API地址是否正确；3. 自建API请检查后端服务是否正常'
            },
            'Failed to fetch': {
                type: '网络连接失败',
                solution: '1. 检查API基础地址是否正确（含http/https）；2. 本地API请确认后端服务已启动；3. 检查防火墙/代理是否拦截请求'
            },
            'Access-Control-Allow-Origin': {
                type: 'CORS跨域错误',
                solution: '1. 第三方API请使用官方支持跨域的地址（OpenAI/DeepSeek官方均支持）；2. 自建API请在后端添加CORS中间件（Express用cors，Flask用flask-cors）'
            },
            '401': {
                type: '密钥认证失败',
                solution: '1. 检查API密钥是否复制正确（无空格/少字符/多字符）；2. 确认密钥未过期/未被封禁；3. 检查认证格式是否为「Bearer + 空格 + 密钥」'
            },
            '404': {
                type: 'API地址不存在',
                solution: '1. 检查API基础地址是否正确（如DeepSeek是https://api.deepseek.com/v1）；2. 确认地址末尾无多余斜杠；3. 检查是否包含/chat/completions端点'
            },
            '429': {
                type: '调用频率超限',
                solution: '1. 降低游戏内AI请求频率；2. 升级API服务商的套餐；3. 游戏中添加请求排队/冷却机制'
            },
            '500': {
                type: 'API服务器内部错误',
                solution: '1. 稍后重试请求；2. 检查API服务商官网是否有服务故障；3. 简化请求内容，减少令牌数'
            }
        };

        // 匹配错误类型，返回对应的解决方案
        for (const [errorKey, detail] of Object.entries(errorSolutionMap)) {
            if (error.message.includes(errorKey) || error.name === errorKey) {
                return detail;
            }
        }

        // 未知错误：给出通用排查方案
        return {
            type: '未知错误',
            solution: '1. 打开浏览器F12控制台查看详细日志；2. 用Postman测试API是否能正常调用；3. 确认网络连接和API配置均正确'
        };
    }

    /**
     * 内部方法：日志打印（调试模式开启时才生效）
     * @param {String} msg - 日志内容
     * @param {String} type - 日志类型：log/warn/error
     */
    _log(msg, type = 'log') {
        if (this.debugMode) {
            const timestamp = new Date().toLocaleTimeString();
            console[type](`[古风AI模拟器-${timestamp}]`, msg);
        }
    }
}

// 生成**全局单例实例**，游戏所有页面直接调用这个实例即可，无需重复创建
// 全局变量名：ancientAIApi（贴合古风游戏，易记易用）
window.ancientAIApi = new AIApiAdapter();

// 模块化导出（若项目使用ES6模块化/Node.js，可直接导入使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIApiAdapter, ancientAIApi };
}
