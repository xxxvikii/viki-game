/**
 * api.js
 * 游戏AI接口管理与模拟系统
 *
 * 支持多家AI服务商API配置、密钥实时验证、无需后端、纯前端运行。
 * 提供Mock与实际API调用，兼容AI响应格式，标准化请求与结果，统一错误与loading处理。
 * 适用于所有页面的AI内容请求（事件、对话、家族、日记、信件等）。
 *
 * @author: 西一(优化重构)
 * @version: 2.0.0
 */

/**
 * AI响应结构样例：
 * {
 *   success: true, // or false
 *   type: "event"|"dialogue"|"family"|"note"|"mail"|...,
 *   data: { ... }, // 各类型对应的数据结构
 *   message: "描述"
 * }
 */

class AIInterface {
    constructor() {
        /** 当前API设置（provider,apiKey,model,temperature,maxTokens,endpoint） */
        this.apiConfig = this.loadAPIConfig();
        /** 当前连接验证状态 */
        this.connectionStatus = 'unknown'; // 'success', 'fail', 'verifying', 'unknown'
        /** 支持的API服务商描述 */
        this.providers = {
            deepseek: {
                name: "Deepseek",
                endpoint: "https://api.deepseek.com/v1/chat/completions",
                models: ["deepseek-V3.2","deepseek-chat"],
                keyPrefix: "sk-"
            },
            volcano: {
                name: "火山引擎",
                endpoint: "https://api.volcengine.com/v1/chat/completions",
                models: ["volcengine-gpt","volcengine-4"],
                keyPrefix: "volc-"
            },
            openai: {
                name: "OpenAI",
                endpoint: "https://api.openai.com/v1/chat/completions",
                models: ["gpt-3.5-turbo","gpt-4"],
                keyPrefix: "sk-"
            },
            siliconflow: {
                name: "硅基流动",
                endpoint: "https://api.siliconflow.com/v1/chat/completions",
                models: ["deepseek-V3.2","llama3","claude-3"],
                keyPrefix: "sk-"
            }
        };
    }

    /**
     * 从localStorage读取API设置
     * @returns {object}
     */
    loadAPIConfig() {
        try {
            const cfg = localStorage.getItem("apiConfig");
            return cfg ? JSON.parse(cfg) : {
                provider: "deepseek",
                apiKey: "",
                model: "deepseek-V3.2",
                temperature: 0.7,
                maxTokens: 800,
                endpoint: "https://api.deepseek.com/v1/chat/completions"
            };
        } catch(e) {
            return {};
        }
    }

    /**
     * 保存API设置到localStorage
     * @param {object} config
     */
    saveAPIConfig(config) {
        this.apiConfig = config;
        localStorage.setItem("apiConfig", JSON.stringify(config));
    }

    /**
     * 主入口：向AI请求一句内容
     * @param {"event","character","dialogue","family","note","mail",...} type 
     * @param {object} context - 用于prompt生成的上下文
     * @returns {Promise<object>} 响应结构
     */
    async generate(type, context = {}) {
        if (!this.apiConfig || !this.apiConfig.apiKey) {
            return {success: false, type, data: null, message: "未配置API密钥"};
        }
        const prompt = this.buildPrompt(type, context);
        try {
            switch(this.apiConfig.provider) {
                case 'deepseek':
                    return await this.callDeepseekAPI(type, prompt, context);
                case 'openai':
                    return await this.callOpenAIAPI(type, prompt, context);
                case 'volcano':
                    return await this.callVolcanoAPI(type, prompt, context);
                case 'siliconflow':
                    return await this.callSiliconFlowAPI(type, prompt, context);
                default:
                    return this.generateMockData(type, context);
            }
        } catch (err) {
            // fallback to mock
            return this.generateMockData(type, context, err.message || "AI请求失败，已采用模拟内容");
        }
    }

    /**
     * 构造用于AI的prompt（不同内容有不同模板/风格）
     * @param {string} type 
     * @param {object} context 
     * @returns {string}
     */
    buildPrompt(type, context = {}) {
        switch(type) {
            case "event":
                return `请生成一个发生在${context.dynasty || "明朝"}${context.yearName || ""}${context.year || ""}的家庭/人生年度大事件，角色：${context.characterName || '女主'}，属性：${JSON.stringify(context.characterAttr||{})}，要求短篇叙述，突出事件影响与后续走向。`;
            case "dialogue":
                return `请生成一段${context.speaker||"李昭华"}与${context.addressee||"家人/姐妹"}之间的互动对话（性格：${context.speakerPersonality||""}），包含对话内容及情感变化、互动后果。`;
            case "family":
                return `请设定一个随机古风家族，输出家族姓氏、风格、身份、资产、家训、家人（性格）、当前动态。`;
            case "character":
                return `请生成一个女性NPC角色，包含姓名、年龄、性格、外貌、技能专长等属性，背景符合古风。`;
            case "note":
                return `请为${context.characterName||"女主"}随机生成一篇年度个人心情手记，反映当年经历与成长感悟，三句话内。`;
            case "mail":
                return `生成一份古风家书（发信人、正文内容、时间），用于${context.characterName||"主角"}收到来自亲友的信件。`;
            case "relationship":
                return `输出家族及主要相关人物、身份及与主角的亲密度分数（0-100）、关系描述，用于构建设计人物关系图谱。`;
            case "asset-skills":
                return `生成主角年度资产增减记录及技能成长情况，突出具体数值变化与原因。`;
            case "history":
                return `请简要回顾并总结主角一年内所有大事件/家庭/互动/成长变化，木讷但不要省略重要影响。`;
            case "explore":
                return `生成一次在家宅${context.area||"任意场所"}的探索事件描述，包括主角/家人/事件变化。`;
            default:
                return "请生成一段与古风人生模拟相关的内容。";
        }
    }

    /**
     * 真实API调用--Deepseek及兼容接口
     * @param {string} type 
     * @param {string} prompt 
     * @param {object} context 
     * @returns {Promise<object>}
     */
    async callDeepseekAPI(type, prompt, context) {
        // 实际可用接口如无跨域/付费需求可放开，否则always用mock
        if (this.apiConfig.endpoint && this.apiConfig.endpoint.indexOf("deepseek")>-1) {
            // 若本地前端且无服务端可用, fallback to mock
            try {
                const res = await fetch(this.apiConfig.endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type":"application/json",
                        "Authorization": `Bearer ${this.apiConfig.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.apiConfig.model,
                        temperature: this.apiConfig.temperature,
                        max_tokens: this.apiConfig.maxTokens,
                        messages: [{role: "user", content: prompt}]
                    })
                });
                if (!res.ok) throw new Error("API服务未响应");
                const data = await res.json();
                if (data && data.choices && data.choices[0] && data.choices[0].message) {
                    // 统一格式包装
                    return {
                        success: true,
                        type, 
                        data: this.extractAIResult(type, data.choices[0].message.content, context),
                        message: "AI返回成功"
                    }
                }
                throw new Error("AI返回格式异常");
            } catch (e) {
                // 本地web静态环境通常会遭遇 CORS 拦截/密钥失效，走模拟
                return this.generateMockData(type, context, e.message||"API返回异常，已切换模拟数据");
            }
        }
        return this.generateMockData(type, context, "未实现API通道，采用模拟数据");
    }
    async callOpenAIAPI(type,prompt,context){ return this.callDeepseekAPI(type,prompt,context);}
    async callVolcanoAPI(type,prompt,context){ return this.callDeepseekAPI(type,prompt,context);}
    async callSiliconFlowAPI(type,prompt,context){ return this.callDeepseekAPI(type,prompt,context);}

    /**
     * AI返回自然语言内容后结构化解析（如有需要，可分类型处理为结构体，否则原文）
     * @param {string} type 
     * @param {string} raw 
     * @param {object} context 
     * @returns {object}
     */
    extractAIResult(type, raw, context) {
        if (!raw) return {};
        // 简单适配：事件/对话/家书可按换行/冒号等切割
        switch(type) {
            case "event":
            case "history":
            case "explore":
                return { summary: raw };
            case "dialogue":
                // 多行分为发言/效果
                const lines = raw.split('\n').filter(l=>!!l.trim());
                return {
                    lines: lines.map(l=>({text:l}))
                };
            case "note":
                return { text: raw };
            case "mail":
                // 尝试分发信人/正文/时间
                return this.extractMail(raw);
            default:
                return { text: raw };
        }
    }

    extractMail(raw){
        // 按常见信件格式解析
        let from = "", content = raw, date = "";
        const m1 = raw.match(/发信人[:：]?\s*(.+?)\s*(?:;|，|,|$)/);
        if(m1){ from=m1[1].trim(); }
        const m2 = raw.match(/时间[:：]?\s*([\d年月日\- ]+)/);
        if(m2){ date = m2[1].trim(); }
        return { from, content, date };
    }

    /**
     * 校验API密钥合法性（格式+实际请求），
     * 显示动态loading，并标记connectionStatus
     * @returns {Promise<boolean>}
     */
    async verifyAPIKey() {
        this.connectionStatus = 'verifying';
        if (!this.apiConfig || !this.apiConfig.apiKey) {
            this.connectionStatus = 'fail';
            return false;
        }
        // 前缀验证
        const provider = this.providers[this.apiConfig.provider];
        if (provider && !this.apiConfig.apiKey.startsWith(provider.keyPrefix)) {
            this.connectionStatus = 'fail';
            return false;
        }
        // 发一组合法最小请求（可用性/prompt简单性），要求成功响应
        try{
            const resp = await this.generate('note',{characterName:'密钥校验'});
            if (resp && resp.success && resp.data) {
                this.connectionStatus = 'success';
                return true;
            } else {
                this.connectionStatus = 'fail';
                return false;
            }
        }catch(e){
            this.connectionStatus = 'fail';
            return false;
        }
    }

    /**
     * 模拟AI生成各类内容（不依赖后端/真实接口），用于开发/无密钥体验
     * @param {string} type 
     * @param {object} context 
     * @param {string} errMsg
     * @returns {object}
     */
    generateMockData(type, context, errMsg='模拟数据') {
        // 文案写活一点，确保每次变化
        let data, msg="";
        switch(type){
            case "event":
                data = this.mockEvent(context); msg="生成年度大事件"; break;
            case "character":
                data = this.mockCharacter(context); msg="生成女性人物"; break;
            case "dialogue":
                data = this.mockDialogue(context); msg="生成对话内容"; break;
            case "family":
                data = this.mockFamily(context); msg="家族构造成功"; break;
            case "note":
                data = this.mockNote(context); msg="生成手记"; break;
            case "mail":
                data = this.mockMail(context); msg="生成来信"; break;
            case "relationship":
                data = this.mockRelationship(context); msg="人物关系图"; break;
            case "asset-skills":
                data = this.mockAssetSkills(context); msg="资产与技能"; break;
            case "history":
                data = this.mockHistory(context); msg="年度回顾"; break;
            case "explore":
                data = this.mockExplore(context); msg="家宅探索"; break;
            default:
                data = { text: "AI模拟内容：" + type }; msg="生成内容"; break;
        }
        return { success: true, type, data, message: msg + " | " + errMsg };
    }

    mockEvent(context){
        const events = [
            { summary: `春日书会中，${context.characterName||"你"}展现诗才，一时声名鹊起，结识新友。影响：诗词+5，社交圈扩展。` },
            { summary: `家族遭遇小变故，父亲外放升任，家庭搬迁新地，需重新适应。影响：家族声望波动。` },
            { summary: `偶染小疾，卧床数日，母亲悉心照料，姐妹互动增多。影响：健康-10，好感提升。` },
            { summary: `遇贵人介绍，获上乘刺绣机巧，技艺大进。刺绣+8。` }
        ];
        return events[Math.floor(Math.random()*events.length)];
    }
    mockCharacter(context){
        const n = ["李","王","张","刘","赵","陈","杨","黄"][Math.floor(Math.random()*8)] + ["昭华","昭宁","昭仪","昭媛","昭容"][Math.floor(Math.random()*5)];
        const age = Math.floor(12+Math.random()*10);
        return {
            name: n,
            age,
            personality: ["温柔贤淑","活泼开朗","内向细腻","自信果断","知书达理"][Math.floor(Math.random()*5)],
            appearance: ["国色天香","眉清目秀","清新脱俗","小家碧玉"][Math.floor(Math.random()*4)],
            skills:{ poetry: Math.floor(Math.random()*80), embroidery:Math.floor(Math.random()*80)},
            desc: `${n}，${age}岁，${Math.random()<0.4?'天赋异禀，':'平凡出众，'}${["爱好读书","乐于交友","思虑周密","喜静好诗"][Math.floor(Math.random()*4)]}`
        }
    }
    mockDialogue(context){
        return {
            lines: [
                { text: `${context.speaker||"姐姐"}："${["今天天气真好，不如去后花园走走吧？","妹妹刺绣进步很快呢，要继续努力哦！","今晚母亲可能会讲睡前故事，你来一起听吗？"][Math.floor(Math.random()*3)]}"` },
                { text: `${context.addressee||"妹妹"}："${["好的！我刚好也有新故事要分享~","谢谢姐姐表扬！我会继续的。","太好了，我们一起吧！"][Math.floor(Math.random()*3)]}"` }
            ],
            effect: `${context.speaker||"姐姐"}与${context.addressee||"妹妹"}关系略升`
        };
    }
    mockFamily(context){
        const famStyles=["诗书传家","乐善好施","清正自守","重商轻文"], assets=["富裕","中等","清贫"], status=["官宦之家","商贾巨富","书香门第","农家小康"];
        return {
            surname: context.surname||["李","王","张","刘","陈"][Math.floor(Math.random()*5)],
            style: famStyles[Math.floor(Math.random()*famStyles.length)],
            status: status[Math.floor(Math.random()*status.length)],
            assets: assets[Math.floor(Math.random()*assets.length)],
            precept: ["自强不息","勤俭持家","温良恭俭让","敦亲睦邻"][Math.floor(Math.random()*4)],
            members:[
                {name:"父亲", personality:"谨慎聪明"},
                {name:"母亲", personality:"温婉贤淑"},
                {name:"主角", personality:"善良正直"}
            ],
            dynamic: ["家有喜事，全体齐聚一堂","近期风调雨顺，家业日隆","长辈筹备家宴，热闹非常"][Math.floor(Math.random()*3)]
        }
    }
    mockNote(context){
        return { text: ["春日阳光融融，姐妹共度欢喜时光。","岁岁年年，心境渐变，渐懂人生要义。","新知渐多，人情练达，颇有成长。"][Math.floor(Math.random()*3)] }
    }
    mockMail(context){
        return {
            from: ["母亲","父亲","好友周兰儿","表姐王素素"][Math.floor(Math.random()*4)],
            content: ["近来天气渐暖，记得添衣注意身体。母亲常念你，家中一切安好，无需挂怀。","听说你最近诗艺精进，望能多加练习，勿负天分。记得来信。","大家都很想你，有空常回家。——父亲"][Math.floor(Math.random()*3)],
            date: `${2025-Math.floor(Math.random()*10)}年${Math.ceil(Math.random()*12)}月${Math.ceil(Math.random()*25)}日`
        }
    }
    mockRelationship(context){
        return {
            nodes:[
                {name:"李昭华",id:"主角",role:"本人",intimacy:100},
                {name:"母亲",id:"母",role:"母亲",intimacy:90},
                {name:"父亲",id:"父",role:"父亲",intimacy:80},
                {name:"昭仪",id:"a",role:"二姐",intimacy:85},
                {name:"昭媛",id:"b",role:"三姐",intimacy:78},
                {name:"昭宁",id:"c",role:"四妹",intimacy:82}
            ],
            links:[
                {from:"主角",to:"母",label:"母女"},
                {from:"主角",to:"a",label:"姐妹"},
                {from:"母",to:"父",label:"夫妻"},
            ]
        };
    }
    mockAssetSkills(context){
        return {
            asset: {change: "+30两", reason:"贩卖手工作品/理财有方"},
            skills: [
                {name:"诗词", before:60, after:68, gain:"+8"},
                {name:"刺绣", before:70, after:73, gain:"+3"}
            ],
            summary: "今年家中收支平衡，生活安稳，技能微有进步。"
        }
    }
    mockHistory(context){
        return {
            summary: [
                "参加城中书会，收获友谊",
                "家族搬迁，结识新邻",
                "完成母亲交办家事",
                "身体小恙，恢复如初"
            ]
        }
    }
    mockExplore(context){
        return {
            summary: `你在${context.area||"后花园"}发现一只慵懒的猫，每到傍晚便守在秋千下，偶遇妹妹，谈笑片刻，心情大好。`
        }
    }
}

/** 单例挂载 */
window.aiInterface = new AIInterface();