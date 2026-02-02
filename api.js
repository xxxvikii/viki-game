// API交互模块

// API服务商配置
const API_PROVIDERS = {
    deepseek: {
        name: 'Deepseek',
        baseUrl: 'https://api.deepseek.com/v1/chat/completions',
        models: ['deepseek-vl', 'deepseek-llm', 'deepseek-v3.2'],
        defaultModel: 'deepseek-v3.2',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {{apiKey}}'
        },
        formatMessage: function(messages, model) {
            return {
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 500,
                top_p: 0.9,
                frequency_penalty: 0,
                presence_penalty: 0
            };
        }
    },
    huoshan: {
        name: '火山',
        baseUrl: 'https://api.huoshan.com/v1/chat/completions',
        models: ['huoshan-llm', 'huoshan-chat'],
        defaultModel: 'huoshan-llm',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {{apiKey}}'
        },
        formatMessage: function(messages, model) {
            return {
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 500,
                top_p: 0.9
            };
        }
    },
    openai: {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1/chat/completions',
        models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
        defaultModel: 'gpt-3.5-turbo',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {{apiKey}}'
        },
        formatMessage: function(messages, model) {
            return {
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 500,
                top_p: 0.9,
                frequency_penalty: 0,
                presence_penalty: 0
            };
        }
    },
    guiji: {
        name: '硅基流动',
        baseUrl: 'https://api.guiji.com/v1/chat/completions',
        models: ['guiji-llm', 'deepseek-v3.2', 'gpt-3.5-turbo'],
        defaultModel: 'deepseek-v3.2',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {{apiKey}}'
        },
        formatMessage: function(messages, model) {
            return {
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 500,
                top_p: 0.9
            };
        }
    },
    custom: {
        name: '自定义模型',
        baseUrl: '{{apiUrl}}',
        models: ['custom-model'],
        defaultModel: 'custom-model',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {{apiKey}}'
        },
        formatMessage: function(messages, model) {
            return {
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 500
            };
        }
    }
};

// API请求缓存
let apiCache = {};

// 初始化API配置
function initApi() {
    // 从本地存储加载配置
    const config = loadApiConfig();
    if (config) {
        window.apiConfig = config;
        
        // 初始化缓存
        if (config.enableCache) {
            const cachedData = localStorage.getItem('api_cache');
            if (cachedData) {
                try {
                    apiCache = JSON.parse(cachedData);
                } catch (e) {
                    console.error('加载API缓存失败:', e);
                    apiCache = {};
                }
            }
        }
    }
}

// 生成缓存键
function generateCacheKey(prompt, model) {
    return `${model}:${prompt}`;
}

// 保存缓存
function saveCache() {
    if (window.apiConfig && window.apiConfig.enableCache) {
        try {
            // 限制缓存大小
            const cacheEntries = Object.entries(apiCache);
            if (cacheEntries.length > 100) {
                // 保留最近使用的100个缓存
                const sortedEntries = cacheEntries.sort((a, b) => b[1].timestamp - a[1].timestamp);
                apiCache = Object.fromEntries(sortedEntries.slice(0, 100));
            }
            
            localStorage.setItem('api_cache', JSON.stringify(apiCache));
        } catch (e) {
            console.error('保存API缓存失败:', e);
        }
    }
}

// 清除缓存
function clearCache() {
    apiCache = {};
    localStorage.removeItem('api_cache');
}

// 发送API请求
async function sendApiRequest(prompt, options = {}) {
    // 检查是否有API配置
    if (!window.apiConfig) {
        throw new Error('API配置未初始化');
    }
    
    // 合并选项
    const defaultOptions = {
        model: window.apiConfig.model || API_PROVIDERS[window.apiConfig.provider].defaultModel,
        temperature: window.apiConfig.temperature !== undefined ? window.apiConfig.temperature : 0.7,
        maxTokens: window.apiConfig.maxTokens || 500,
        systemPrompt: getSystemPrompt(),
        useCache: window.apiConfig.enableCache !== false
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // 检查缓存
    if (mergedOptions.useCache) {
        const cacheKey = generateCacheKey(prompt, mergedOptions.model);
        const cachedResponse = apiCache[cacheKey];
        
        if (cachedResponse && (Date.now() - cachedResponse.timestamp < 7 * 24 * 60 * 60 * 1000)) { // 缓存7天
            return cachedResponse.data;
        }
    }
    
    // 获取API配置
    const provider = API_PROVIDERS[window.apiConfig.provider];
    if (!provider) {
        throw new Error('不支持的API服务商');
    }
    
    // 构建请求URL
    let apiUrl = provider.baseUrl;
    if (window.apiConfig.provider === 'custom' && window.apiConfig.apiUrl) {
        apiUrl = window.apiConfig.apiUrl;
    }
    
    // 构建请求头
    const headers = {};
    for (const [key, value] of Object.entries(provider.headers)) {
        headers[key] = value.replace('{{apiKey}}', window.apiConfig.apiKey);
    }
    
    // 构建请求消息
    const messages = [
        {
            role: 'system',
            content: mergedOptions.systemPrompt
        },
        {
            role: 'user',
            content: prompt
        }
    ];
    
    // 构建请求体
    const requestBody = provider.formatMessage(messages, mergedOptions.model);
    requestBody.temperature = mergedOptions.temperature;
    requestBody.max_tokens = mergedOptions.maxTokens;
    
    // 设置超时
    const timeout = window.apiConfig.timeout || 30000;
    
    try {
        // 发送请求
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // 处理响应
        if (data.choices && data.choices.length > 0) {
            const result = {
                text: data.choices[0].message.content,
                tokens: {
                    prompt: data.usage?.prompt_tokens || 0,
                    completion: data.usage?.completion_tokens || 0,
                    total: data.usage?.total_tokens || 0
                }
            };
            
            // 保存到缓存
            if (mergedOptions.useCache) {
                const cacheKey = generateCacheKey(prompt, mergedOptions.model);
                apiCache[cacheKey] = {
                    data: result,
                    timestamp: Date.now()
                };
                saveCache();
            }
            
            // 记录日志
            if (window.apiConfig.enableLogging) {
                logApiRequest(prompt, result);
            }
            
            return result;
        } else {
            throw new Error('API响应格式错误');
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('API请求超时');
        }
        throw error;
    }
}

// 获取系统提示词
function getSystemPrompt() {
    return `你是一名专业的古风文字游戏剧情生成器，擅长创作古代/民国初期背景的女性视角故事。请根据用户提供的信息，生成符合时代背景、人物性格和情节逻辑的高质量文本。

要求：
1. 语言风格：使用符合古代/民国初期的语言，避免现代用语，保持典雅流畅
2. 视角：严格按照第一人称视角写作，代入感强
3. 内容：情节合理，人物性格一致，符合时代背景和社会规范
4. 长度：生成内容不少于200字，详细描述场景、人物心理和情感变化
5. 原创性：确保内容原创，不重复之前的情节
6. 主题：以温馨喜剧为主，兼顾人生真实起伏

请严格按照用户的要求生成内容，不要添加任何额外的解释或说明。`;
}

// 生成剧情事件
async function generateEvent(gameData, eventType) {
    const { family, protagonist, time } = gameData;
    
    let prompt = '';
    
    switch (eventType) {
        case 'yearly':
            prompt = `请为以下设定生成一个年度核心事件：

朝代：${family.dynasty}（${family.reignYear}）
家族背景：${family.familyStatus}，${family.familyStyle}
主角信息：${protagonist.name}（${protagonist.age}岁，${protagonist.personality}）
当前季节：${time.season}

事件要求：
1. 符合家族背景和时代背景
2. 考虑主角的性格特点
3. 提供3-5个不同的选择，每个选择会影响主角的属性、技能或人际关系
4. 事件描述详细生动，不少于200字
5. 语言风格符合古代/民国初期特色

请以第一人称视角描述这个事件。`;
            break;
            
        case 'interaction':
            prompt = `请为以下设定生成一个人物互动事件：

朝代：${family.dynasty}（${family.reignYear}）
家族背景：${family.familyStatus}，${family.familyStyle}
主角信息：${protagonist.name}（${protagonist.age}岁，${protagonist.personality}）
当前季节：${time.season}

互动对象：随机选择一位家人（父母或姐妹）

事件要求：
1. 符合家族背景和时代背景
2. 考虑主角和互动对象的性格特点
3. 提供2-4个不同的互动方式，每个选择会影响双方的好感度
4. 互动描述温馨自然，不少于200字
5. 语言风格符合古代/民国初期特色

请以第一人称视角描述这个互动事件。`;
            break;
            
        case 'family':
            prompt = `请为以下设定生成一条家庭动态新闻：

朝代：${family.dynasty}（${family.reignYear}）
家族背景：${family.familyStatus}，${family.familyStyle}
家庭成员：父母和五位姐妹
当前季节：${time.season}

新闻要求：
1. 符合家族背景和时代背景
2. 内容可以是家族成员的近况、家族事务、重要通知等
3. 语言简洁明了，符合古代小报风格
4. 每条新闻50-100字

请以第三人称描述这条家庭动态。`;
            break;
            
        case 'diary':
            prompt = `请为以下设定生成一篇日记内容：

朝代：${family.dynasty}（${family.reignYear}）
主角信息：${protagonist.name}（${protagonist.age}岁，${protagonist.personality}）
当前季节：${time.season}

日记要求：
1. 记录近期的生活点滴、心情变化或重要事件
2. 体现主角的性格特点和内心想法
3. 语言真实自然，符合古代女子的表达方式
4. 内容温馨细腻，不少于200字

请以第一人称视角撰写这篇日记。`;
            break;
            
        case 'ending':
            prompt = `请为以下设定生成一篇人生自传：

主角：${protagonist.name}，享年${randomInt(50, 90)}岁
生平概要：从12岁到寿终正寝的完整人生，经历了家族生活、姐妹互动、技能养成、婚恋选择等

自传要求：
1. 以第一人称视角回顾整个人生
2. 重点描述重要的人生节点和选择
3. 评价自己的一生，表达感悟和遗憾
4. 提及家族成员的后世情况和家族兴衰
5. 语言真挚感人，800-1200字

请以第一人称视角撰写这篇人生自传。`;
            break;
            
        default:
            throw new Error('未知的事件类型');
    }
    
    try {
        const result = await sendApiRequest(prompt);
        return result.text;
    } catch (error) {
        console.error('生成事件失败:', error);
        return getFallbackEvent(eventType);
    }
}

// 获取备用事件（当API不可用时）
function getFallbackEvent(eventType) {
    const fallbackEvents = {
        yearly: `春日的阳光洒在院子里，我正在闺房中练习女红。突然，丫鬟来报说有客人来访。原来是父亲的旧友，一位学识渊博的老先生。他此次前来，是受父亲之托，要教导我们姐妹几个诗词书画。

父亲希望我们能习得一些才艺，将来能有个好归宿。母亲也在一旁鼓励我们要认真学习。我看着姐妹们，有的面露喜色，有的则显得有些不情愿。

选择：
1. 积极响应，主动向老先生请教（智慧+5，诗词+10）
2. 认真学习但保持低调（女红+5，礼仪+5）
3. 心不在焉，偷偷观察姐妹们的反应（观察+5，社交+3）
4. 找借口推脱，说身体不适（健康-5，父母好感-10）`,
        
        interaction: `今日天气晴朗，我在花园里遇到了二姐。她正在赏花，看起来心情不错。二姐比我大两岁，性格活泼开朗，我们平时关系还算融洽。

"妹妹也来赏花吗？"二姐笑着问道。"这株牡丹开得真好，我正想剪几枝插在花瓶里。"

选择：
1. 主动帮忙剪花，一起布置房间（二姐好感+10，园艺+5）
2. 赞美二姐的眼光，讨教赏花之道（二姐好感+5，园艺+3）
3. 聊起最近看的话本，分享心得（二姐好感+8，文学+3）
4. 询问二姐最近的近况，表达关心（二姐好感+12，社交+2）`,
        
        family: `【家族动态】昨日，父亲从京城归来，带来了好消息。因政绩卓著，皇上特旨升任父亲为知府，不日将赴任新职。全家上下一片欢腾，母亲已开始着手准备搬家事宜。`,
        
        diary: `今日是三月初三，上巳节。按照习俗，女子可以出门踏青。我和姐妹们一起去了城郊的青石桥，那里的风景真美啊！

河边的柳树已经发芽，桃花也开了，粉粉的一片，像云霞一样。我们在河边放了纸船，许了心愿。二姐还折了柳枝，给我们每人编了一个柳环戴在头上。

晚上回来的时候，虽然有些累，但心里很高兴。这样的日子，真希望能多一些。`,
        
        ending: `我叫${randomChoice(['昭华', '婉如', '秀英', '玉环', '美娟'])}，享年${randomInt(50, 90)}岁。回顾我的一生，从十二岁那年开始，仿佛就在昨天。

我出生在一个${randomChoice(['书香门第', '官宦之家', '商贾巨富'])}，是家中的${randomChoice(['长女', '次女', '三女', '四女', '五女'])}。父亲${randomChoice(['学识渊博', '为官清廉', '经商有道'])}，母亲${randomChoice(['温柔贤惠', '精明能干', '慈祥和蔼'])}，姐妹们各有各的性格和命运。

我的一生，经历了许多风风雨雨。在${randomInt(16, 22)}岁那年，我嫁给了${randomChoice(['一位官员', '一位商人', '一位文人'])}，${randomChoice(['他待我很好', '我们相敬如宾', '虽有争吵但也算和睦'])}。我们育有${randomInt(1, 5)}个子女，他们都已长大成人，各自有了自己的家庭和事业。

回顾我的一生，虽没有什么轰轰烈烈的事迹，但也算平安顺遂。我学会了${randomChoice(['诗词书画', '女红烹饪', '经营持家'])}，结交了一些好友，抚养了子女成人，看着孙辈们长大。

最让我欣慰的是，我们家族一直保持着${randomChoice(['诗书传家', '忠君爱国', '重商轻文'])}的家风，子孙后代都能${randomChoice(['学有所成', '事业有成', '家庭和睦'])}。

人生如梦，转眼百年。我虽有一些遗憾，但更多的是满足和感恩。愿我的子孙后代，都能平安幸福，活出自己的精彩人生。`
    };
    
    return fallbackEvents[eventType] || '暂无事件内容';
}

// 记录API请求日志
function logApiRequest(prompt, result) {
    try {
        const log = {
            timestamp: Date.now(),
            prompt: prompt.substring(0, 100) + '...',
            response: result.text.substring(0, 100) + '...',
            tokens: result.tokens,
            model: window.apiConfig.model
        };
        
        let logs = [];
        const existingLogs = localStorage.getItem('api_logs');
        if (existingLogs) {
            logs = JSON.parse(existingLogs);
        }
        
        logs.push(log);
        
        // 限制日志数量
        if (logs.length > 50) {
            logs = logs.slice(-50);
        }
        
        localStorage.setItem('api_logs', JSON.stringify(logs));
    } catch (e) {
        console.error('记录API日志失败:', e);
    }
}

// 测试API连接
async function testApiConnection(config, prompt) {
    // 临时保存当前配置
    const originalConfig = window.apiConfig;
    
    // 使用测试配置
    window.apiConfig = config;
    
    try {
        const result = await sendApiRequest(prompt, { useCache: false });
        return result;
    } finally {
        // 恢复原配置
        window.apiConfig = originalConfig;
    }
}

// 导出函数
window.api = {
    init: initApi,
    sendRequest: sendApiRequest,
    generateEvent: generateEvent,
    testConnection: testApiConnection,
    clearCache: clearCache
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initApi();
});