/**
 * api.js - AI接口交互模块
 * 负责与AI接口进行交互，生成游戏事件、人物信息和交互内容
 */

class AIInterface {
    constructor() {
        // 从localStorage获取API配置
        this.apiConfig = this.loadAPIConfig();
        this.isGenerating = false;
    }

    /**
     * 加载API配置
     * @returns {Object} API配置对象
     */
    loadAPIConfig() {
        const saved = localStorage.getItem('apiConfig');
        if (saved) {
            return JSON.parse(saved);
        }
        // 默认配置
        return {
            provider: 'mock', // mock, deepseek, huoshan, openai, siliconflow
            apiKey: '',
            endpoint: '',
            model: ''
        };
    }

    /**
     * 保存API配置
     * @param {Object} config 新的配置对象
     */
    saveAPIConfig(config) {
        this.apiConfig = config;
        localStorage.setItem('apiConfig', JSON.stringify(config));
    }

    /**
     * 生成AI提示词
     * @param {string} type 生成类型
     * @param {Object} context 上下文信息
     * @returns {string} 提示词
     */
    generatePrompt(type, context) {
        const prompts = {
            event: `你是一个古风文字游戏的剧情生成器。请为《吾家有女初长成》游戏生成一个随机事件。

游戏背景：明朝永乐年间，玩家扮演李家五姐妹中的一员，从12岁开始体验人生。

当前信息：
- 角色：${context.characterName}（${context.age}岁，${context.personality}）
- 家族：${context.familyName}
- 时间：${context.dynasty} ${context.yearName} ${context.year}年 ${context.season}
- 技能：${Object.entries(context.skills).map(([k, v]) => `${k}:${v}`).join(', ')}

请生成一个符合以下要求的随机事件：
1. 事件类型：${context.eventType || '日常/社交/学习/情感'}
2. 事件描述：详细描述事件的起因、经过和可能的发展
3. 选择项：提供2-3个不同的选择，每个选择会导致不同的结果
4. 结果影响：每个选择可能对角色的属性（容貌、健康、情感、技能等）产生影响

输出格式：
{
  "title": "事件标题",
  "description": "详细的事件描述...",
  "choices": [
    {
      "text": "选择1",
      "consequence": "选择后的结果描述...",
      "effects": {
        "attribute1": changeValue,
        "attribute2": changeValue
      }
    },
    {
      "text": "选择2",
      "consequence": "选择后的结果描述...",
      "effects": {
        "attribute1": changeValue,
        "attribute2": changeValue
      }
    }
  ]
}`,

            character: `你是一个古风文字游戏的人物生成器。请为《吾家有女初长成》游戏生成一个NPC人物信息。

游戏背景：明朝永乐年间，玩家扮演李家五姐妹中的一员。

请生成一个符合以下要求的NPC：
1. 人物类型：${context.characterType || '家人/朋友/陌生人/追求者'}
2. 人物身份：详细描述人物的身份、背景和与主角的关系
3. 性格特点：描述人物的性格、喜好和行为方式
4. 外貌特征：简要描述人物的外貌
5. 对话风格：提供1-2句符合人物性格的对话示例

输出格式：
{
  "name": "NPC姓名",
  "age": "年龄",
  "identity": "身份背景",
  "personality": "性格特点",
  "appearance": "外貌特征",
  "dialogue": ["对话示例1", "对话示例2"],
  "relationship": "与主角的关系"
}`,

            dialogue: `你是一个古风文字游戏的对话生成器。请为《吾家有女初长成》游戏生成一段对话。

游戏背景：明朝永乐年间，玩家扮演李家五姐妹中的一员。

当前对话场景：
- 说话者：${context.speaker}（${context.speakerPersonality}）
- 对话对象：${context.addressee}
- 场景：${context.scene}
- 对话目的：${context.purpose || '交流/询问/建议/表达情感'}

请生成一段符合以下要求的对话：
1. 对话内容：符合人物性格和场景的自然对话
2. 对话风格：符合古风背景，语言典雅但不晦涩
3. 对话长度：简短精炼，符合日常交流

输出格式：
{
  "dialogue": "生成的对话内容"
}`,

            family: `你是一个古风文字游戏的家族生成器。请为《吾家有女初长成》游戏生成一个家族信息。

游戏背景：明朝永乐年间。

请生成一个符合以下要求的家族：
1. 家族姓氏：${context.surname || '李/王/张/刘/陈'}
2. 家族地位：描述家族的社会地位、财富状况
3. 家族成员：详细介绍家族主要成员（父母、姐妹等）
4. 家族背景：家族的历史、声望和特点
5. 家族关系：成员之间的关系和互动模式

输出格式：
{
  "surname": "家族姓氏",
  "status": "家族地位",
  "wealth": "财富状况",
  "background": "家族背景",
  "members": [
    {
      "name": "成员姓名",
      "role": "角色（父亲/母亲/姐妹）",
      "age": "年龄",
      "personality": "性格特点",
      "relationship": "与主角的关系"
    }
  ]
}`
        };

        return prompts[type] || '';
    }

    /**
     * 调用AI接口生成内容
     * @param {string} type 生成类型
     * @param {Object} context 上下文信息
     * @returns {Promise<Object>} 生成结果
     */
    async generate(type, context) {
        if (this.isGenerating) {
            throw new Error('AI正在生成内容，请稍后再试');
        }

        this.isGenerating = true;
        try {
            const prompt = this.generatePrompt(type, context);
            
            // 根据不同的API提供商调用不同的接口
            switch (this.apiConfig.provider) {
                case 'deepseek':
                    return await this.callDeepSeekAPI(prompt);
                case 'huoshan':
                    return await this.callHuoshanAPI(prompt);
                case 'openai':
                    return await this.callOpenAIAPI(prompt);
                case 'siliconflow':
                    return await this.callSiliconFlowAPI(prompt);
                case 'mock':
                default:
                    return this.generateMockData(type, context);
            }
        } catch (error) {
            console.error('AI生成失败:', error);
            throw error;
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * 调用DeepSeek API
     * @param {string} prompt 提示词
     * @returns {Promise<Object>} 生成结果
     */
    async callDeepSeekAPI(prompt) {
        // 实际的API调用逻辑
        // 这里使用模拟数据
        return this.generateMockData('event', {});
    }

    /**
     * 调用火山引擎API
     * @param {string} prompt 提示词
     * @returns {Promise<Object>} 生成结果
     */
    async callHuoshanAPI(prompt) {
        // 实际的API调用逻辑
        return this.generateMockData('event', {});
    }

    /**
     * 调用OpenAI API
     * @param {string} prompt 提示词
     * @returns {Promise<Object>} 生成结果
     */
    async callOpenAIAPI(prompt) {
        // 实际的API调用逻辑
        return this.generateMockData('event', {});
    }

    /**
     * 调用硅基流动API
     * @param {string} prompt 提示词
     * @returns {Promise<Object>} 生成结果
     */
    async callSiliconFlowAPI(prompt) {
        // 实际的API调用逻辑
        return this.generateMockData('event', {});
    }

    /**
     * 生成模拟数据（当API不可用时使用）
     * @param {string} type 生成类型
     * @param {Object} context 上下文信息
     * @returns {Object} 模拟的生成结果
     */
    generateMockData(type, context) {
        // 根据事件类型生成不同的模拟数据
        if (type === 'event') {
            return this.generateMockEvent(context);
        } else if (type === 'character') {
            return this.generateMockCharacter(context);
        } else if (type === 'dialogue') {
            return this.generateMockDialogue(context);
        } else if (type === 'family') {
            return this.generateMockFamily(context);
        }
        
        return null;
    }
    
    /**
     * 生成模拟事件
     */
    generateMockEvent(context) {
        const eventType = context.eventType || '日常';
        const isYearly = context.isYearly || false;
        const isLetter = context.isLetter || false;
        
        // 年度事件
        if (isYearly) {
            const yearlyEvents = [
                {
                    title: "家族年度聚会",
                    description: `李氏家族一年一度的聚会即将举行。今年是你${context.age}岁的生日，家族长辈们都很关心你的成长和未来。聚会中，你需要向长辈们展示你的才艺和进步。`,
                    choices: [
                        {
                            text: "展示诗词才华",
                            consequence: "你精心准备了一首《岁末感怀》，在聚会中当众吟诵。你的诗词才华赢得了满堂喝彩，祖父更是当众称赞你"有谢家道韫之风"。这次展示让你的家族声望得到了提升，也让更多人认识了你的才华。",
                            effects: {
                                skills: { poetry: 15 },
                                relationships: { "祖父": 10, "父亲": 8 },
                                reputation: 10
                            }
                        },
                        {
                            text: "展示刺绣技艺",
                            consequence: "你花费数月时间绣制了一幅《百蝶穿花图》，在聚会上展示。这幅绣品工艺精湛，色彩艳丽，赢得了女性长辈们的一致好评。母亲为你感到骄傲，几位嫂嫂也对你的技艺赞不绝口。",
                            effects: {
                                skills: { embroidery: 15 },
                                relationships: { "母亲": 10, "嫂嫂": 8 },
                                reputation: 8
                            }
                        },
                        {
                            text: "展示音律才华",
                            consequence: "你在聚会上演奏了一曲《高山流水》，琴音悠扬，如泣如诉。在场的宾客都被你的琴艺所打动，一位路过的乐师甚至主动提出要收你为徒。这次展示让你的音律技艺得到了认可，也为你带来了新的学习机会。",
                            effects: {
                                skills: { music: 15 },
                                relationships: { "乐师": 15 },
                                reputation: 12
                            }
                        }
                    ]
                },
                {
                    title: "年度成长总结",
                    description: `又过了一年，你已经${context.age}岁了。这一年来，你在各方面都有所成长。现在是时候总结过去一年的收获，并为新的一年制定计划了。`,
                    choices: [
                        {
                            text: "专注于诗词书画",
                            consequence: "你决定在新的一年里专注于提升自己的诗词书画水平。你制定了详细的学习计划，每天早起读书练字，闲暇时创作诗词。一年下来，你的文化素养得到了显著提升，也创作了不少优秀的作品。",
                            effects: {
                                skills: { poetry: 20, literature: 10 },
                                attributes: { beauty: 5 }
                            }
                        },
                        {
                            text: "专注于女红厨艺",
                            consequence: "你决定在新的一年里专注于提升自己的女红和厨艺。你向母亲和嫂嫂们请教，每天练习刺绣和烹饪。一年下来，你的女红技艺更加精湛，烹饪水平也有了很大提升，家人都对你的进步感到欣慰。",
                            effects: {
                                skills: { embroidery: 20, cooking: 15, housekeeping: 10 },
                                relationships: { "母亲": 5, "嫂嫂": 5 }
                            }
                        },
                        {
                            text: "均衡发展",
                            consequence: "你决定在新的一年里均衡发展各方面的能力。你合理安排时间，既学习诗词书画，也练习女红厨艺，还注重身体锻炼。虽然进步不如专注一项那么明显，但你的整体素质得到了全面提升，也更加自信。",
                            effects: {
                                skills: { poetry: 8, embroidery: 8, music: 8, cooking: 8, housekeeping: 8 },
                                attributes: { health: 10, emotion: 10 }
                            }
                        }
                    ]
                }
            ];
            
            return yearlyEvents[Math.floor(Math.random() * yearlyEvents.length)];
        }
        
        // 书信事件
        if (isLetter) {
            const letterEvents = [
                {
                    title: "来自远方的信",
                    description: "你收到了一封来自远方的信件。信是你的表兄写来的，他现在在京城求学，信中描述了京城的繁华和他的学习生活。他还询问了你的近况，并邀请你有机会去京城游玩。",
                    choices: [
                        {
                            text: "回信详述近况",
                            consequence: "你认真地写了一封回信，详细描述了自己的生活和学习情况，还附上了几首自己创作的诗词。表兄收到信后非常高兴，很快又回了一封信，对你的诗词给予了高度评价，并表示期待有机会能与你当面交流。",
                            effects: {
                                skills: { poetry: 5 },
                                relationships: { "表兄": 10 }
                            }
                        },
                        {
                            text: "简单回信问候",
                            consequence: "你写了一封简短的回信，问候了表兄的近况，并简单介绍了自己的生活。表兄收到信后很开心，虽然没有详细交流，但你们的联系得以保持。",
                            effects: {
                                relationships: { "表兄": 5 }
                            }
                        },
                        {
                            text: "暂时不回信",
                            consequence: "你因为忙碌暂时没有回信。时间一长，你和表兄的联系就断了。后来听说他考上了进士，在京城做了官，但你们之间的关系已经不如从前了。",
                            effects: {
                                relationships: { "表兄": -5 }
                            }
                        }
                    ]
                },
                {
                    title: "神秘的情书",
                    description: "你在花园里发现了一封写给你的情书。信中表达了对你的爱慕之情，但没有署名。字迹清秀，文采斐然，看起来是出自一位有文化的男子之手。",
                    choices: [
                        {
                            text: "暗中调查写信人",
                            consequence: "你暗中调查了写信的人，发现是城中有名的才子张公子。你们开始了秘密的书信往来，感情逐渐升温。虽然还没有公开关系，但这段感情让你的生活充满了甜蜜和期待。",
                            effects: {
                                relationships: { "张公子": 15 },
                                attributes: { emotion: 10 }
                            }
                        },
                        {
                            text: "将信交给父母",
                            consequence: "你将信交给了父母。父亲看后大怒，立即派人调查此事。后来得知是一位落魄书生写的，父亲警告对方不要再骚扰你。这件事让你感到有些尴尬，但也让你更加谨慎地处理感情问题。",
                            effects: {
                                relationships: { "父亲": 5, "母亲": 3 },
                                attributes: { emotion: -5 }
                            }
                        },
                        {
                            text: "悄悄销毁信件",
                            consequence: "你选择悄悄销毁了信件，当作什么都没发生。虽然心里有些好奇和失落，但你觉得这是最安全的做法。随着时间推移，这件事逐渐被你淡忘。",
                            effects: {
                                attributes: { emotion: -3 }
                            }
                        }
                    ]
                }
            ];
            
            return letterEvents[Math.floor(Math.random() * letterEvents.length)];
        }
        
        // 根据事件类型生成不同的事件
        const events = {
            '日常': [
                {
                    title: "春日诗会",
                    description: "府城举办了一年一度的春日诗会，各家千金都将参加。这是一个展示才华、结交朋友的好机会。你听说这次诗会的主题是'春'，要求参与者即兴创作一首关于春天的诗词。",
                    choices: [
                        {
                            text: "精心准备，积极参加",
                            consequence: "你花了几天时间精心准备，创作了一首《春日偶成》。在诗会上，你的诗词受到了众人的赞赏，一位德高望重的老夫子还当众表扬了你。这次经历让你的诗词技能得到了提升，也结识了几位志同道合的朋友。",
                            effects: {
                                skills: { poetry: 10 },
                                reputation: 5,
                                relationships: { "王小姐": 3, "陈公子": 2 }
                            }
                        },
                        {
                            text: "随意参加，顺其自然",
                            consequence: "你决定以平常心参加诗会，没有特别准备。在诗会上，你即兴创作了一首简单的春日诗。虽然没有特别出彩，但也赢得了一些掌声。你在诗会上认识了一些新朋友，度过了愉快的一天。",
                            effects: {
                                skills: { poetry: 3 },
                                relationships: { "赵小姐": 2 }
                            }
                        },
                        {
                            text: "婉拒邀请，在家研读",
                            consequence: "你决定婉拒诗会邀请，在家中研读诗词典籍。虽然错过了社交机会，但你的诗词理论知识得到了提升。母亲对你的好学态度表示赞赏。",
                            effects: {
                                skills: { poetry: 5, literature: 3 },
                                relationships: { "母亲": 2 }
                            }
                        }
                    ]
                },
                {
                    title: "刺绣比赛",
                    description: "府里举办了一场刺绣比赛，姐妹们都要参加。比赛的主题是'花鸟'，要求在三天内完成一幅刺绣作品。这是展示你刺绣技艺的好机会。",
                    choices: [
                        {
                            text: "熬夜赶制精品",
                            consequence: "你为了做出最好的作品，连续三天熬夜刺绣。你的作品《百鸟朝凤》工艺精湛，色彩艳丽，最终获得了比赛的第一名。虽然因为熬夜你的健康受到了一些影响，但这次胜利让你的刺绣技艺得到了大家的认可。",
                            effects: {
                                skills: { embroidery: 15 },
                                attributes: { health: -5 },
                                relationships: { "母亲": 8, "姐妹们": 5 }
                            }
                        },
                        {
                            text: "认真准备，按时完成",
                            consequence: "你认真准备，合理安排时间，按时完成了一幅《牡丹图》。虽然没有获得第一名，但作品质量也很高，获得了评委的好评。你既展示了自己的技艺，又保持了健康。",
                            effects: {
                                skills: { embroidery: 8 },
                                relationships: { "姐妹们": 3 }
                            }
                        },
                        {
                            text: "帮助妹妹完成作品",
                            consequence: "你发现最小的妹妹在刺绣上遇到了困难，决定帮助她完成作品。虽然你自己的作品因此显得有些仓促，但妹妹的作品却因为你的帮助获得了好评。妹妹非常感激你，你们的姐妹感情更加深厚了。",
                            effects: {
                                relationships: { "妹妹": 15 },
                                attributes: { emotion: 5 }
                            }
                        }
                    ]
                }
            ],
            '社交': [
                {
                    title: "访客来访",
                    description: "一天，府上迎来了一位特殊的访客——当今翰林院大学士的女儿林小姐。她是京城有名的才女，此次是随父亲来本地游玩的。父亲希望你能好好招待她。",
                    choices: [
                        {
                            text: "展示诗词才华",
                            consequence: "你与林小姐一起讨论诗词，互相唱和。你们一见如故，相谈甚欢。林小姐对你的才华印象深刻，临走时还约定以后要保持书信往来。这次交流不仅提升了你的诗词水平，还为你结交了一位志同道合的朋友。",
                            effects: {
                                skills: { poetry: 8 },
                                relationships: { "林小姐": 15 },
                                reputation: 5
                            }
                        },
                        {
                            text: "带她游览本地风光",
                            consequence: "你带林小姐游览了本地的名胜古迹，向她介绍了当地的风土人情。林小姐对这次游览非常满意，称赞你不仅学识渊博，还很懂得待客之道。你们建立了良好的友谊。",
                            effects: {
                                relationships: { "林小姐": 10 },
                                attributes: { emotion: 5 }
                            }
                        },
                        {
                            text: "展示女红技艺",
                            consequence: "你向林小姐展示了自己的刺绣作品，并教她一些简单的刺绣技巧。林小姐对刺绣很感兴趣，学得很认真。虽然你们在诗词方面交流不多，但在女红方面却有了共同话题。",
                            effects: {
                                skills: { embroidery: 5 },
                                relationships: { "林小姐": 8 }
                            }
                        }
                    ]
                },
                {
                    title: "生日宴会",
                    description: "明天是你大姐的生日，家里要举办一场盛大的宴会。作为妹妹，你需要准备一份礼物和祝福语。",
                    choices: [
                        {
                            text: "亲手制作精美刺绣",
                            consequence: "你花费了半个月时间，为大姐绣了一幅《松鹤延年图》作为生日礼物。大姐收到礼物后非常感动，她说这是她收到的最珍贵的礼物。你们的姐妹感情因此更加深厚了。",
                            effects: {
                                relationships: { "大姐": 15 },
                                skills: { embroidery: 8 }
                            }
                        },
                        {
                            text: "创作生日诗词",
                            consequence: "你为大姐创作了一首生日诗，在宴会上当众吟诵。诗句优美动人，表达了你对大姐的祝福和感激之情。大姐听了非常开心，宾客们也对你的才华赞不绝口。",
                            effects: {
                                relationships: { "大姐": 10 },
                                skills: { poetry: 8 },
                                reputation: 5
                            }
                        },
                        {
                            text: "准备一桌美食",
                            consequence: "你向厨房师傅请教，亲手为大姐准备了一桌她最喜欢的菜肴。虽然过程很辛苦，但看到大姐开心的笑容，你觉得一切都值得。家人对你的厨艺赞不绝口。",
                            effects: {
                                relationships: { "大姐": 12, "家人": 5 },
                                skills: { cooking: 10 }
                            }
                        }
                    ]
                }
            ],
            '学习': [
                {
                    title: "求学机会",
                    description: "城中有名的才女周夫人开设了一个女学馆，教授诗词、女红、音律等课程。这是一个难得的学习机会，但学馆离家较远，需要每天早起赶去。",
                    choices: [
                        {
                            text: "坚持每天去学馆",
                            consequence: "你克服了路途的辛苦，坚持每天去学馆学习。在周夫人的悉心教导下，你的各方面能力都有了显著提升。你还结识了一些志同道合的朋友，一起学习进步。",
                            effects: {
                                skills: { poetry: 15, embroidery: 10, music: 10 },
                                relationships: { "周夫人": 10, "同学": 8 }
                            }
                        },
                        {
                            text: "只学习自己感兴趣的课程",
                            consequence: "你选择只参加诗词和音律课程，这两门是你最感兴趣的。虽然学习的内容少了一些，但你的专注让这两门技艺有了很大的提升。周夫人也很欣赏你的专注精神。",
                            effects: {
                                skills: { poetry: 20, music: 15 },
                                relationships: { "周夫人": 5 }
                            }
                        },
                        {
                            text: "请家庭教师在家学习",
                            consequence: "你说服父亲请了一位家庭教师在家中教授你。这样虽然不如去学馆那样能结交朋友，但学习环境更加舒适，也能更好地安排时间。你的学习有了一定的进步。",
                            effects: {
                                skills: { poetry: 8, embroidery: 8, music: 8 },
                                attributes: { health: 5 }
                            }
                        }
                    ]
                },
                {
                    title: "古籍发现",
                    description: "你在整理书房时，发现了一本古老的诗词集，里面收录了许多失传的佳作。这本书似乎是你祖父年轻时收藏的，书页已经有些泛黄，但内容依然清晰可读。",
                    choices: [
                        {
                            text: "认真研读并抄录",
                            consequence: "你花费了几个月的时间，认真研读了这本古籍，并将其中的佳作抄录下来。这些古老的诗词对你的诗词创作产生了很大的影响，你的诗词风格变得更加古朴典雅。父亲知道后，对你的好学精神赞不绝口。",
                            effects: {
                                skills: { poetry: 20, literature: 15 },
                                relationships: { "父亲": 10 }
                            }
                        },
                        {
                            text: "与姐妹们分享",
                            consequence: "你将这本古籍分享给姐妹们一起阅读。大家都被书中的内容深深吸引，经常在一起讨论。这本书不仅丰富了你们的学识，还增进了你们的姐妹感情。",
                            effects: {
                                skills: { poetry: 10, literature: 8 },
                                relationships: { "姐妹们": 15 }
                            }
                        },
                        {
                            text: "请教老师解读",
                            consequence: "你带着这本古籍去请教你的老师。老师对你的好学精神很赞赏，认真为你解读了书中的难点。在老师的指导下，你对这些古老诗词的理解更加深入了。",
                            effects: {
                                skills: { poetry: 15, literature: 12 },
                                relationships: { "老师": 10 }
                            }
                        }
                    ]
                }
            ],
            '情感': [
                {
                    title: "心动时刻",
                    description: "在一次春游中，你遇到了一位年轻的书生。他温文尔雅，谈吐不凡，你们聊得很投机。分别时，他对你表示了好感，并希望能有机会再次见面。",
                    choices: [
                        {
                            text: "接受邀请，继续交往",
                            consequence: "你接受了他的邀请，开始了与他的交往。你们经常一起游山玩水，讨论诗词，感情逐渐升温。他的温柔体贴让你的生活充满了甜蜜和期待。",
                            effects: {
                                relationships: { "书生": 20 },
                                attributes: { emotion: 15 }
                            }
                        },
                        {
                            text: "保持距离，观察一段时间",
                            consequence: "你决定保持一定的距离，先观察一段时间。你偶尔会与他书信往来，但不会单独见面。这种谨慎的态度让你能够更理性地看待这段感情。",
                            effects: {
                                relationships: { "书生": 8 },
                                attributes: { emotion: 5 }
                            }
                        },
                        {
                            text: "婉拒好意，专心学业",
                            consequence: "你婉拒了他的好意，表示现在想专心于学业。虽然心里有些失落，但你觉得这是目前最好的选择。你将更多的精力投入到学习中，学业有了很大的进步。",
                            effects: {
                                skills: { poetry: 10, literature: 10 },
                                attributes: { emotion: -5 }
                            }
                        }
                    ]
                },
                {
                    title: "姐妹矛盾",
                    description: "你和二姐因为一些小事发生了争执。二姐认为你最近太过骄傲，不把姐妹们放在眼里；而你觉得二姐总是干涉你的事情。现在你们已经冷战了好几天。",
                    choices: [
                        {
                            text: "主动道歉，化解矛盾",
                            consequence: "你主动向二姐道歉，承认自己最近确实有些疏忽了姐妹感情。二姐也反思了自己的行为，承认不应该过多干涉你的事情。你们互相理解，重归于好，姐妹感情反而比以前更好了。",
                            effects: {
                                relationships: { "二姐": 15 },
                                attributes: { emotion: 10 }
                            }
                        },
                        {
                            text: "请母亲帮忙调解",
                            consequence: "你请母亲帮忙调解你和二姐的矛盾。在母亲的疏导下，你们各自说出了自己的想法，误会得以消除。虽然不如主动和解那样增进感情，但至少恢复了表面的和谐。",
                            effects: {
                                relationships: { "二姐": 5, "母亲": 3 }
                            }
                        },
                        {
                            text: "写一封信表达心意",
                            consequence: "你写了一封信给二姐，详细说明了自己的想法和感受。二姐收到信后，也给你回了一封信。通过文字交流，你们更好地理解了彼此，矛盾逐渐化解。",
                            effects: {
                                relationships: { "二姐": 10 },
                                skills: { poetry: 5 }
                            }
                        }
                    ]
                }
            ],
            '家族': [
                {
                    title: "家族危机",
                    description: "家族生意遇到了一些困难，父亲为此愁眉不展。作为家中的一员，你也想为家族出一份力。",
                    choices: [
                        {
                            text: "提出商业建议",
                            consequence: "你通过观察和思考，向父亲提出了一些商业建议。虽然一开始父亲有些犹豫，但试行后效果很好，帮助家族度过了危机。父亲对你刮目相看，开始重视你的意见。",
                            effects: {
                                relationships: { "父亲": 15, "家族": 10 },
                                reputation: 15
                            }
                        },
                        {
                            text: "变卖首饰资助家族",
                            consequence: "你主动变卖了自己的一些首饰，将钱交给父亲资助家族。虽然金额不大，但你的这份心意让父亲非常感动。家族成员也对你的无私行为赞不绝口。",
                            effects: {
                                relationships: { "父亲": 20, "家族": 15 },
                                attributes: { emotion: 10 }
                            }
                        },
                        {
                            text: "做好分内之事，减少开支",
                            consequence: "你决定从自己做起，减少不必要的开支，并更加用心地管理家务。你的行为为姐妹们树立了榜样，全家都开始节约开支。虽然没有直接解决问题，但你的努力让家族更加团结。",
                            effects: {
                                relationships: { "家族": 10 },
                                skills: { housekeeping: 10 }
                            }
                        }
                    ]
                },
                {
                    title: "家族荣耀",
                    description: "你的大哥在科举考试中取得了优异的成绩，被皇帝赏识，授予了重要的官职。这是家族的荣耀，全家都为此高兴。",
                    choices: [
                        {
                            text: "创作诗词庆祝",
                            consequence: "你创作了一首《贺兄长荣升》的诗词，在家族庆祝宴会上吟诵。诗词大气磅礴，表达了对兄长的祝贺和对家族未来的期望。全家人都对你的才华赞不绝口，兄长更是将你的诗词珍藏起来。",
                            effects: {
                                skills: { poetry: 15 },
                                relationships: { "兄长": 15, "家族": 10 },
                                reputation: 10
                            }
                        },
                        {
                            text: "准备庆祝宴会",
                            consequence: "你主动承担了准备庆祝宴会的任务。你精心设计菜单，布置场地，邀请宾客，将宴会办得有声有色。全家人都对你的组织能力和厨艺赞不绝口。",
                            effects: {
                                skills: { cooking: 15, housekeeping: 15 },
                                relationships: { "家族": 15 }
                            }
                        },
                        {
                            text: "为兄长准备礼物",
                            consequence: "你花费了很多心思，为兄长准备了一份特别的礼物——一幅亲手绘制的《鹏程万里图》。兄长收到礼物后非常感动，表示会好好珍藏。你们的兄妹感情更加深厚了。",
                            effects: {
                                relationships: { "兄长": 20 },
                                attributes: { emotion: 15 }
                            }
                        }
                    ]
                }
            ],
            '意外': [
                {
                    title: "突发疾病",
                    description: "你突然生病了，发烧不退，浑身无力。医生说需要好好休息一段时间才能康复。",
                    choices: [
                        {
                            text: "安心休养，听从医嘱",
                            consequence: "你听从医生的建议，安心休养，按时服药。虽然错过了一些学习和社交活动，但你的身体很快就康复了。这次生病让你更加重视健康。",
                            effects: {
                                attributes: { health: -10, emotion: -5 }
                            }
                        },
                        {
                            text: "坚持学习，不肯休息",
                            consequence: "你不肯因为生病而耽误学习，仍然坚持看书、练字。虽然你的学习没有落下，但病情却加重了，需要更长时间才能康复。",
                            effects: {
                                skills: { poetry: 5, literature: 5 },
                                attributes: { health: -20, emotion: -10 }
                            }
                        },
                        {
                            text: "寻求偏方治疗",
                            consequence: "你听说了一个治疗类似疾病的偏方，决定尝试一下。没想到这个偏方效果很好，你的病很快就好了。这次经历让你对中医药产生了兴趣。",
                            effects: {
                                attributes: { health: -5, emotion: 5 },
                                skills: { medicine: 10 }
                            }
                        }
                    ]
                },
                {
                    title: "遗失贵重物品",
                    description: "你不小心遗失了母亲传给你的一支珍贵的玉簪。这是母亲的陪嫁之物，对你来说意义重大。",
                    choices: [
                        {
                            text: "发动全家寻找",
                            consequence: "你发动全家一起寻找玉簪。经过仔细搜索，终于在花园的花丛中找到了它。失而复得的喜悦让你更加珍惜这支玉簪，也更加感激家人的帮助。",
                            effects: {
                                relationships: { "家族": 10 },
                                attributes: { emotion: 5 }
                            }
                        },
                        {
                            text: "独自寻找，不麻烦他人",
                            consequence: "你决定独自寻找玉簪，不想麻烦家人。你仔细回忆了自己去过的地方，最终在书房的角落找到了它。虽然过程很辛苦，但成功找到玉簪的成就感让你很满足。",
                            effects: {
                                attributes: { emotion: -5 }
                            }
                        },
                        {
                            text: "向母亲坦白，请求原谅",
                            consequence: "你向母亲坦白了遗失玉簪的事情，请求她的原谅。母亲虽然有些遗憾，但理解这是意外，并没有责怪你。她告诉你，比起物品，家人的平安更重要。",
                            effects: {
                                relationships: { "母亲": 15 },
                                attributes: { emotion: 10 }
                            }
                        }
                    ]
                }
            ],
            '探索': [
                {
                    title: "闺房探索",
                    description: "你在整理自己的闺房时，发现了一个隐藏的小箱子。箱子上了锁，看起来有些年头了。",
                    choices: [
                        {
                            text: "想办法打开箱子",
                            consequence: "你找到了开锁的工具，成功打开了箱子。里面装着一些古老的信件和首饰，看起来是你祖母留下的。这些物品让你对家族历史有了更深的了解。",
                            effects: {
                                relationships: { "祖母": 10 },
                                attributes: { emotion: 10 }
                            }
                        },
                        {
                            text: "请教母亲关于箱子的事情",
                            consequence: "你拿着箱子去请教母亲。母亲告诉你，这是你祖母的陪嫁箱，里面装着她的一些私人物品。母亲帮你打开了箱子，你们一起翻看了里面的物品，度过了一个温馨的下午。",
                            effects: {
                                relationships: { "母亲": 15 },
                                attributes: { emotion: 15 }
                            }
                        },
                        {
                            text: "暂时不去管它",
                            consequence: "你决定暂时不去管这个箱子，将它放回原处。虽然有些好奇，但你觉得每个人都有自己的秘密，尊重前人的隐私也是一种美德。",
                            effects: {
                                attributes: { emotion: 5 }
                            }
                        }
                    ]
                },
                {
                    title: "花园探索",
                    description: "你在花园里玩耍时，发现了一条隐秘的小路。小路通向花园深处，你从来没有去过那里。",
                    choices: [
                        {
                            text: "沿着小路探索",
                            consequence: "你沿着小路走下去，发现了一个美丽的小亭子，周围种满了各种珍稀的花卉。这里似乎是祖父精心打造的秘密花园。你经常来这里读书、思考，这里成了你最喜欢的地方。",
                            effects: {
                                attributes: { emotion: 15 },
                                skills: { poetry: 5 }
                            }
                        },
                        {
                            text: "叫上姐妹一起探索",
                            consequence: "你叫上姐妹们一起探索这条小路。大家都被路尽头的美景惊呆了。你们约定将这里作为秘密基地，经常一起来这里玩耍、聊天。这个秘密让你们的姐妹感情更加深厚了。",
                            effects: {
                                relationships: { "姐妹们": 20 },
                                attributes: { emotion: 10 }
                            }
                        },
                        {
                            text: "先回去告诉父母",
                            consequence: "你决定先回去告诉父母关于这条小路的事情。父亲告诉你，这是他为母亲打造的花园，因为母亲喜欢安静，所以很少有人知道。父亲允许你偶尔去那里，但要保持安静，不要打扰到母亲。",
                            effects: {
                                relationships: { "父亲": 10, "母亲": 10 },
                                attributes: { emotion: 5 }
                            }
                        }
                    ]
                },
                {
                    title: "书房探索",
                    description: "你在父亲的书房里发现了一本锁着的书。书的封面很古朴，看起来有些年头了。",
                    choices: [
                        {
                            text: "偷偷阅读",
                            consequence: "你趁父亲不在的时候，偷偷打开了这本书。这是一本关于历史秘闻的书籍，记录了许多不为人知的历史事件。虽然内容很吸引人，但偷看父亲的私藏书让你有些内疚。",
                            effects: {
                                skills: { literature: 10, history: 10 },
                                attributes: { emotion: -5 }
                            }
                        },
                        {
                            text: "请求父亲允许阅读",
                            consequence: "你向父亲请求允许阅读这本书。父亲很高兴你对历史感兴趣，不仅允许你阅读，还为你讲解了书中的一些内容。这次经历让你对历史产生了更深的兴趣，也增进了你和父亲的感情。",
                            effects: {
                                skills: { literature: 15, history: 15 },
                                relationships: { "父亲": 15 }
                            }
                        },
                        {
                            text: "放回原处，不偷看",
                            consequence: "你决定尊重父亲的隐私，将书放回原处。虽然有些好奇，但你觉得尊重他人的隐私比满足自己的好奇心更重要。父亲后来知道了这件事，对你的懂事表示赞赏。",
                            effects: {
                                relationships: { "父亲": 10 },
                                attributes: { emotion: 5 }
                            }
                        }
                    ]
                },
                {
                    title: "客厅探索",
                    description: "你在打扫客厅时，发现了一个隐藏在柜子后面的小盒子。盒子里装着一些旧照片和信件。",
                    choices: [
                        {
                            text: "仔细查看盒子里的物品",
                            consequence: "你仔细查看了盒子里的物品，发现这些是父母年轻时的照片和情书。看着这些充满爱意的信件和照片，你对父母的感情有了更深的理解。你将这些物品小心地放回原处。",
                            effects: {
                                relationships: { "父母": 15 },
                                attributes: { emotion: 15 }
                            }
                        },
                        {
                            text: "与母亲分享这个发现",
                            consequence: "你拿着盒子去见母亲，与她分享这个发现。母亲看到这些旧物，回忆起了与父亲相识相爱的往事。她给你讲了很多过去的故事，你们度过了一个温馨的下午。",
                            effects: {
                                relationships: { "母亲": 20 },
                                attributes: { emotion: 20 }
                            }
                        },
                        {
                            text: "原样放回，不打扰",
                            consequence: "你决定不打扰这些美好的回忆，将盒子原样放回。每个人都有自己的过去，尊重这些回忆也是一种爱。虽然没有看到里面的内容，但你的懂事让父母感到欣慰。",
                            effects: {
                                relationships: { "父母": 10 },
                                attributes: { emotion: 5 }
                            }
                        }
                    ]
                }
            ]
        };
        
        // 根据事件类型选择事件
        const eventPool = events[eventType] || events['日常'];
        return eventPool[Math.floor(Math.random() * eventPool.length)];
    }
    
    /**
     * 生成模拟人物
     */
    generateMockCharacter(context) {
        const characterType = context.characterType || '朋友';
        
        const characters = {
            '朋友': [
                {
                    name: "林雨棠",
                    age: `${context.characterAge || 14}岁`,
                    identity: "知府千金，才貌双全的大家闺秀",
                    personality: "温柔贤淑，知书达理，善解人意",
                    appearance: "肌肤胜雪，眉如远山，目若秋水，气质如兰",
                    dialogue: [
                        "李姐姐的诗词真是清丽脱俗，小妹甚是喜欢。",
                        "今日天气甚好，不如我们一起去花园赏花如何？"
                    ],
                    relationship: "在诗会上结识的好友，志同道合，经常一起探讨诗词"
                },
                {
                    name: "苏梦璃",
                    age: `${context.characterAge || 13}岁`,
                    identity: "富商之女，活泼开朗的少女",
                    personality: "性格开朗，热情大方，喜欢新奇事物",
                    appearance: "面若桃花，眼含笑意，身姿轻盈，充满活力",
                    dialogue: [
                        "李妹妹，你知道吗？最近城里新开了一家首饰铺，里面的首饰可漂亮了！",
                        "别总是闷在房间里读书，陪我出去走走吧！"
                    ],
                    relationship: "在一次宴会上认识的朋友，带你体验了许多新鲜事物"
                }
            ],
            '追求者': [
                {
                    name: "陈墨言",
                    age: `${context.characterAge + 4 || 18}岁`,
                    identity: "翰林院编修之子，才华横溢的年轻书生",
                    personality: "温文尔雅，饱读诗书，性格沉稳，略有傲气",
                    appearance: "眉清目秀，面如冠玉，身材修长，常着青衫",
                    dialogue: [
                        "李小姐的诗词真是清丽脱俗，在下甚是欣赏。",
                        "今日得见小姐芳容，实是三生有幸。"
                    ],
                    relationship: "在诗会上偶遇的陌生公子，对主角的才华表示赞赏"
                },
                {
                    name: "张云雷",
                    age: `${context.characterAge + 5 || 19}岁`,
                    identity: "将军之子，英武不凡的少年将军",
                    personality: "豪爽大气，正直勇敢，有些鲁莽但心地善良",
                    appearance: "剑眉星目，身材魁梧，英气逼人，常穿劲装",
                    dialogue: [
                        "李姑娘，在下对您一见倾心，不知能否有机会与您结识？",
                        "我虽不懂得诗词歌赋，但我愿意用我的方式保护你。"
                    ],
                    relationship: "在一次外出时救了主角，从此对主角展开追求"
                }
            ],
            '老师': [
                {
                    name: "周夫人",
                    age: "40岁",
                    identity: "退隐官员之妻，才学出众的女学者",
                    personality: "学识渊博，循循善诱，严格但温和",
                    appearance: "气质高雅，举止端庄，虽已中年但风韵犹存",
                    dialogue: [
                        "你的诗词天赋很高，但还需要更多的练习和积累。",
                        "学无止境，不要因为一点成绩就骄傲自满。"
                    ],
                    relationship: "主角的诗词老师，对主角的学业帮助很大"
                },
                {
                    name: "王师傅",
                    age: "50岁",
                    identity: "宫中退休的绣娘，刺绣技艺精湛",
                    personality: "技艺高超，要求严格，刀子嘴豆腐心",
                    appearance: "慈眉善目，手指灵活，总是穿着朴素的衣服",
                    dialogue: [
                        "你的刺绣手法还不够熟练，要多加练习。",
                        "虽然现在做得不好，但我看你有这方面的天赋。"
                    ],
                    relationship: "主角的刺绣老师，教授主角精湛的刺绣技艺"
                }
            ],
            '竞争对手': [
                {
                    name: "薛宝钗",
                    age: `${context.characterAge || 14}岁`,
                    identity: "尚书千金，才貌双全的大家闺秀",
                    personality: "聪明伶俐，争强好胜，有些高傲",
                    appearance: "容貌出众，举止优雅，衣着华丽，气质高贵",
                    dialogue: [
                        "李妹妹的诗词虽然不错，但还需多加练习。",
                        "这次诗会，我可是准备了很久呢。"
                    ],
                    relationship: "在各种才女比赛中经常与主角竞争的对手"
                },
                {
                    name: "赵明珠",
                    age: `${context.characterAge - 1 || 13}岁`,
                    identity: "御史之女，年轻有为的才女",
                    personality: "才华横溢，心高气傲，喜欢与人比较",
                    appearance: "眉目如画，身材窈窕，衣着得体，气质出众",
                    dialogue: [
                        "听说李姐姐最近在学习刺绣？有机会我们可以交流一下。",
                        "这次的刺绣比赛，我可是志在必得。"
                    ],
                    relationship: "在刺绣和诗词方面都与主角竞争的对手"
                }
            ]
        };
        
        const characterPool = characters[characterType] || characters['朋友'];
        return characterPool[Math.floor(Math.random() * characterPool.length)];
    }
    
    /**
     * 生成模拟对话
     */
    generateMockDialogue(context) {
        const purpose = context.purpose || '交流';
        
        const dialogues = {
            '问候': [
                "妹妹今日气色甚好，可是有什么喜事？若不嫌弃，不妨说与姐姐听听。",
                "姐姐这几日都在忙些什么？我来给你送些新做的点心。",
                "妹妹，多日不见，可还安好？我甚是想念。"
            ],
            '邀请': [
                "明日花园的牡丹开得正艳，妹妹可有兴致一同赏花？",
                "后天是我的生日，我想邀请妹妹来参加我的生日宴会。",
                "城里新开了一家书斋，听说有很多珍贵的古籍，妹妹可有兴趣一同去看看？"
            ],
            '建议': [
                "妹妹，我觉得你最近太过劳累了，应该好好休息一下。",
                "以妹妹的才华，若是参加下个月的诗会，必定能取得好成绩。",
                "我觉得妹妹在刺绣方面很有天赋，不妨多花些时间练习。"
            ],
            '分享': [
                "妹妹，我最近读了一本很有趣的书，想与你分享。",
                "你看，这是我新学的刺绣花样，好看吗？",
                "昨日我在花园里发现了一个很美的地方，想带妹妹去看看。"
            ]
        };
        
        const dialoguePool = dialogues[purpose] || dialogues['交流'];
        return { dialogue: dialoguePool[Math.floor(Math.random() * dialoguePool.length)] };
    }
    
    /**
     * 生成模拟家族
     */
    generateMockFamily(context) {
        const surname = context.surname || '李';
        
        const families = [
            {
                surname: surname,
                status: "官宦世家，父亲李大人官至翰林院侍读学士",
                wealth: "家境殷实，在京城有几处宅院和商铺",
                background: "李家祖籍苏州，世代书香门第，到了父亲这一代才入仕为官",
                members: [
                    {
                        name: `${surname}正儒`,
                        role: "父亲",
                        age: "45岁",
                        personality: "严谨正直，重视礼教，对子女要求严格但关爱有加",
                        relationship: "严厉但慈爱的父亲，希望女儿们能有好的归宿"
                    },
                    {
                        name: "王氏",
                        role: "母亲",
                        age: "40岁",
                        personality: "温柔贤淑，知书达理，持家有道",
                        relationship: "疼爱女儿们的母亲，注重女儿们的教养"
                    },
                    {
                        name: `${surname}昭仪`,
                        role: "二姐",
                        age: "15岁",
                        personality: "活泼开朗，喜爱舞蹈，有点调皮",
                        relationship: "与主角关系亲密，经常一起玩耍"
                    },
                    {
                        name: `${surname}昭容`,
                        role: "三姐",
                        age: "14岁",
                        personality: "安静内向，喜爱读书，性格沉稳",
                        relationship: "与主角有共同的读书爱好"
                    },
                    {
                        name: `${surname}昭媛`,
                        role: "四姐",
                        age: "13岁",
                        personality: "心灵手巧，擅长刺绣，性格温和",
                        relationship: "经常为主角做些小手工"
                    },
                    {
                        name: `${surname}昭宁`,
                        role: "五妹",
                        age: "12岁",
                        personality: "天真可爱，好奇心强，有点任性",
                        relationship: "最喜欢粘着主角"
                    }
                ]
            },
            {
                surname: surname,
                status: "富商之家，父亲是当地有名的大商人",
                wealth: "家财万贯，经营着多家商铺和货船",
                background: "李家原本是普通农户，到了祖父这一代开始经商，逐渐发家致富",
                members: [
                    {
                        name: `${surname}福财`,
                        role: "父亲",
                        age: "48岁",
                        personality: "精明能干，善于经商，对子女比较纵容",
                        relationship: "疼爱女儿的父亲，希望女儿们能过上幸福的生活"
                    },
                    {
                        name: "陈氏",
                        role: "母亲",
                        age: "42岁",
                        personality: "温柔善良，乐善好施，信佛",
                        relationship: "慈悲为怀的母亲，经常教导女儿们要善良"
                    },
                    {
                        name: `${surname}明珠`,
                        role: "大姐",
                        age: "18岁",
                        personality: "精明能干，有经商天赋，性格强势",
                        relationship: "帮助父亲打理生意的姐姐，是父亲的得力助手"
                    },
                    {
                        name: `${surname}明玉`,
                        role: "二姐",
                        age: "16岁",
                        personality: "温柔体贴，喜欢照顾人，性格稳重",
                        relationship: "像母亲一样照顾妹妹们的姐姐"
                    },
                    {
                        name: `${surname}明霞`,
                        role: "三姐",
                        age: "14岁",
                        personality: "活泼好动，喜欢新鲜事物，有点叛逆",
                        relationship: "经常带主角尝试新事物的姐姐"
                    },
                    {
                        name: `${surname}明燕`,
                        role: "五妹",
                        age: "10岁",
                        personality: "天真烂漫，活泼可爱，被家人宠坏了",
                        relationship: "被全家宠爱的小妹妹"
                    }
                ]
            }
        ];
        
        return families[Math.floor(Math.random() * families.length)];
    }

        // 模拟延迟
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(mockData[type]);
            }, 1000 + Math.random() * 2000);
        });
    }

    /**
     * 测试API连接
     * @returns {Promise<boolean>} 连接是否成功
     */
    async testAPIConnection() {
        try {
            // 简单测试调用
            const result = await this.generate('event', {
                characterName: "测试角色",
                age: "12",
                personality: "温柔",
                dynasty: "明朝",
                yearName: "永乐",
                year: "元年",
                season: "春",
                skills: { poetry: 50 }
            });
            return result && result.title;
        } catch (error) {
            console.error('API测试失败:', error);
            return false;
        }
    }
}

// 导出单例
const aiInterface = new AIInterface();
window.aiInterface = aiInterface;