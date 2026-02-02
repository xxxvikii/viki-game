// 全局变量
let window.gameData = null;
let window.apiConfig = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化API配置
    window.apiConfig = loadApiConfig();
    
    // 如果是主页，初始化轮播图
    if (document.getElementById('home-carousel')) {
        initializeCarousel();
    }
});

// 显示加载动画
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.remove('hidden');
    }
}

// 隐藏加载动画
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
    }
}

// 显示提示弹窗
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const toastContent = toast.querySelector('.toast-content');
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    
    // 设置消息内容
    toastMessage.textContent = message;
    
    // 设置图标类型
    toastIcon.className = 'fas toast-icon';
    switch (type) {
        case 'success':
            toastIcon.classList.add('fa-check-circle', 'success');
            break;
        case 'error':
            toastIcon.classList.add('fa-times-circle', 'error');
            break;
        case 'warning':
            toastIcon.classList.add('fa-exclamation-triangle', 'warning');
            break;
        case 'info':
            toastIcon.classList.add('fa-info-circle', 'info');
            break;
    }
    
    // 显示弹窗
    toast.classList.remove('hidden');
    
    // 3秒后自动隐藏
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

// 显示模态框
function showModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// 关闭模态框
function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// 初始化轮播图
function initializeCarousel() {
    const carousel = document.getElementById('home-carousel');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const indicators = carousel.querySelectorAll('.indicator');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    
    let currentSlide = 0;
    const slideCount = slides.length;
    
    // 显示当前幻灯片
    function showSlide(index) {
        // 隐藏所有幻灯片
        slides.forEach(slide => slide.classList.remove('active'));
        // 移除所有指示器的active类
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        // 显示当前幻灯片
        slides[index].classList.add('active');
        // 添加当前指示器的active类
        indicators[index].classList.add('active');
        
        // 更新当前幻灯片索引
        currentSlide = index;
    }
    
    // 下一张幻灯片
    function nextSlide() {
        let next = currentSlide + 1;
        if (next >= slideCount) {
            next = 0;
        }
        showSlide(next);
    }
    
    // 上一张幻灯片
    function prevSlide() {
        let prev = currentSlide - 1;
        if (prev < 0) {
            prev = slideCount - 1;
        }
        showSlide(prev);
    }
    
    // 点击指示器切换幻灯片
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            showSlide(index);
        });
    });
    
    // 点击上一张按钮
    if (prevBtn) {
        prevBtn.addEventListener('click', prevSlide);
    }
    
    // 点击下一张按钮
    if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
    }
    
    // 自动轮播
    let slideInterval = setInterval(nextSlide, 5000);
    
    // 鼠标悬停时暂停轮播
    carousel.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });
    
    // 鼠标离开时恢复轮播
    carousel.addEventListener('mouseleave', () => {
        slideInterval = setInterval(nextSlide, 5000);
    });
    
    // 显示第一张幻灯片
    showSlide(0);
}

// 随机生成整数
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 随机生成浮点数
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// 随机选择数组元素
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// 随机生成家族信息
function generateFamilyInfo() {
    // 朝代列表
    const dynasties = ['唐', '宋', '元', '明', '清', '民国初期'];
    
    // 年号列表
    const reignYears = {
        '唐': ['贞观', '开元', '天宝', '元和', '大中'],
        '宋': ['建隆', '太平兴国', '景德', '熙宁', '绍兴'],
        '元': ['中统', '至元', '大德', '至正'],
        '明': ['洪武', '永乐', '弘治', '嘉靖', '万历'],
        '清': ['顺治', '康熙', '雍正', '乾隆', '嘉庆', '道光', '咸丰', '同治', '光绪'],
        '民国初期': ['民国元年', '民国二年', '民国三年', '民国四年', '民国五年']
    };
    
    // 姓氏列表
    const surnames = ['张', '王', '李', '赵', '陈', '刘', '杨', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];
    
    // 身份列表
    const familyStatuses = ['书香门第', '官宦之家', '商贾巨富', '武林世家', '普通农户', '医道世家', '工匠之家'];
    
    // 资产列表
    const assets = ['贫穷', '小康', '中等', '富裕', '巨富'];
    
    // 家风列表
    const familyStyles = ['诗书传家', '忠君爱国', '重商轻文', '尚武精神', '医者仁心', '精益求精', '勤俭节约'];
    
    // 随机选择朝代
    const dynasty = randomChoice(dynasties);
    
    // 根据朝代选择年号
    const reignYear = randomChoice(reignYears[dynasty]);
    
    // 随机选择姓氏
    const surname = randomChoice(surnames);
    
    // 随机选择身份
    const familyStatus = randomChoice(familyStatuses);
    
    // 随机选择资产
    const asset = randomChoice(assets);
    
    // 随机选择家风
    const familyStyle = randomChoice(familyStyles);
    
    return {
        dynasty,
        reignYear,
        surname,
        familyStatus,
        asset,
        familyStyle
    };
}

// 随机生成主角信息
function generateProtagonistInfo(familyInfo, rank) {
    // 闺名列表
    const girlNames = {
        '张': ['昭华', '昭仪', '昭昭', '昭容', '昭惠', '昭宁', '昭德', '昭明'],
        '王': ['婉如', '婉仪', '婉容', '婉清', '婉华', '婉柔', '婉贞', '婉静'],
        '李': ['秀英', '秀兰', '秀琴', '秀梅', '秀华', '秀敏', '秀娟', '秀芬'],
        '赵': ['玉环', '玉英', '玉华', '玉梅', '玉琴', '玉娟', '玉芬', '玉敏'],
        '陈': ['美华', '美娟', '美芬', '美琴', '美英', '美兰', '美秀', '美芳'],
        '刘': ['丽娟', '丽芬', '丽琴', '丽英', '丽兰', '丽华', '丽秀', '丽芳'],
        '杨': ['桂兰', '桂英', '桂华', '桂芬', '桂琴', '桂娟', '桂秀', '桂芳'],
        '黄': ['素华', '素芬', '素琴', '素英', '素兰', '素娟', '素秀', '素芳'],
        '周': ['雅琴', '雅娟', '雅芬', '雅英', '雅兰', '雅华', '雅秀', '雅芳'],
        '吴': ['惠娟', '惠芬', '惠琴', '惠英', '惠兰', '惠华', '惠秀', '惠芳']
    };
    
    // 排行列表
    const ranks = ['长女', '次女', '三女', '四女', '五女'];
    
    // 性格列表
    const personalities = ['温柔体贴', '活泼开朗', '端庄大方', '聪明伶俐', '善良纯真', '坚强独立', '敏感细腻', '豪爽直率'];
    
    // 技能列表
    const skills = ['诗词', '女红', '烹饪', '书法', '绘画', '歌舞', '礼仪', '医术', '算术', '园艺'];
    
    // 根据姓氏选择闺名
    const surname = familyInfo.surname;
    const nameOptions = girlNames[surname] || girlNames['张'];
    const name = randomChoice(nameOptions);
    
    // 根据排行确定年龄（12岁为基准，上下浮动1-2岁）
    const baseAge = 12;
    const ageVariation = randomInt(-2, 2);
    const age = baseAge + ageVariation;
    
    // 随机生成容貌（0-100）
    const appearance = randomInt(50, 95);
    
    // 随机选择性格
    const personality = randomChoice(personalities);
    
    // 随机选择2-3个初始技能
    const skillCount = randomInt(2, 3);
    const initialSkills = [];
    
    for (let i = 0; i < skillCount; i++) {
        const skill = randomChoice(skills);
        if (!initialSkills.find(s => s.name === skill)) {
            initialSkills.push({
                name: skill,
                level: randomInt(10, 30)
            });
        }
    }
    
    // 生成隐性属性
    const hiddenAttributes = [
        { name: '福缘', value: randomInt(30, 70) },
        { name: '智慧', value: randomInt(30, 70) },
        { name: '勇气', value: randomInt(30, 70) },
        { name: '耐心', value: randomInt(30, 70) },
        { name: '创造力', value: randomInt(30, 70) }
    ];
    
    return {
        name,
        age,
        rank: ranks[rank],
        appearance,
        personality,
        skills: initialSkills,
        hiddenAttributes,
        health: 100,
        emotion: 100
    };
}

// 随机生成父母信息
function generateParentsInfo(familyInfo) {
    // 父亲官职/职业列表
    const fatherJobs = {
        '书香门第': ['进士', '举人', '秀才', '教书先生', '翰林院编修'],
        '官宦之家': ['宰相', '尚书', '侍郎', '巡抚', '知府', '知县'],
        '商贾巨富': ['盐商', '粮商', '丝绸商', '茶商', '钱庄老板'],
        '武林世家': ['镖师', '武术教头', '侠客', '将军', '士兵'],
        '普通农户': ['农夫', '佃农', '长工'],
        '医道世家': ['太医', '郎中', '药铺老板', '药师'],
        '工匠之家': ['木匠', '铁匠', '石匠', '裁缝', '鞋匠']
    };
    
    // 母亲官职/职业列表
    const motherJobs = {
        '书香门第': ['大家闺秀', '才女', '私塾先生之女'],
        '官宦之家': ['官员之女', '诰命夫人', '名门闺秀'],
        '商贾巨富': ['商贾之女', '掌柜之女', '富家小姐'],
        '武林世家': ['女侠', '镖师之女', '武师之女'],
        '普通农户': ['农妇', '佃农之女', '长工之女'],
        '医道世家': ['医女', '郎中之女', '药铺老板之女'],
        '工匠之家': ['工匠之女', '裁缝之女', '鞋匠之女']
    };
    
    // 性格列表
    const personalities = ['温柔贤惠', '严厉苛刻', '慈祥和蔼', '精明能干', '软弱可欺', '强势霸道', '通情达理', '愚昧无知'];
    
    // 父亲名字列表
    const fatherNames = ['明远', '文博', '德高', '天佑', '子轩', '浩然', '子昂', '致远', '君浩', '文昊'];
    
    // 母亲名字列表
    const motherNames = ['秀兰', '素梅', '玉莲', '宝钗', '黛玉', '湘云', '探春', '迎春', '惜春', '元春'];
    
    // 根据家族身份选择父亲职业
    const fatherJobOptions = fatherJobs[familyInfo.familyStatus] || fatherJobs['普通农户'];
    const fatherJob = randomChoice(fatherJobOptions);
    
    // 根据家族身份选择母亲职业
    const motherJobOptions = motherJobs[familyInfo.familyStatus] || motherJobs['普通农户'];
    const motherJob = randomChoice(motherJobOptions);
    
    // 生成父亲名字
    const fatherName = `${familyInfo.surname}${randomChoice(fatherNames)}`;
    
    // 生成母亲名字（古代女子通常只有姓氏，婚后随夫姓）
    const motherSurname = randomChoice(['王', '李', '赵', '陈', '刘', '杨', '黄', '周', '吴', '徐']);
    const motherName = `${motherSurname}${randomChoice(motherNames)}`;
    
    // 生成父母年龄（主角12岁，父母通常35-50岁）
    const fatherAge = randomInt(35, 50);
    const motherAge = randomInt(30, 45);
    
    // 生成父母性格
    const fatherPersonality = randomChoice(personalities);
    const motherPersonality = randomChoice(personalities);
    
    // 生成父母关系
    const relationships = ['恩爱', '相敬如宾', '貌合神离', '争吵不断', '分居'];
    const relationship = randomChoice(relationships);
    
    return [
        {
            name: fatherName,
            age: fatherAge,
            job: fatherJob,
            personality: fatherPersonality,
            relationship: '父亲'
        },
        {
            name: motherName,
            age: motherAge,
            job: motherJob,
            personality: motherPersonality,
            relationship: '母亲'
        }
    ];
}

// 随机生成姐妹信息
function generateSistersInfo(familyInfo, protagonistRank) {
    const sisters = [];
    const ranks = ['长女', '次女', '三女', '四女', '五女'];
    
    // 闺名列表
    const girlNames = {
        '张': ['昭华', '昭仪', '昭昭', '昭容', '昭惠', '昭宁', '昭德', '昭明'],
        '王': ['婉如', '婉仪', '婉容', '婉清', '婉华', '婉柔', '婉贞', '婉静'],
        '李': ['秀英', '秀兰', '秀琴', '秀梅', '秀华', '秀敏', '秀娟', '秀芬'],
        '赵': ['玉环', '玉英', '玉华', '玉梅', '玉琴', '玉娟', '玉芬', '玉敏'],
        '陈': ['美华', '美娟', '美芬', '美琴', '美英', '美兰', '美秀', '美芳'],
        '刘': ['丽娟', '丽芬', '丽琴', '丽英', '丽兰', '丽华', '丽秀', '丽芳'],
        '杨': ['桂兰', '桂英', '桂华', '桂芬', '桂琴', '桂娟', '桂秀', '桂芳'],
        '黄': ['素华', '素芬', '素琴', '素英', '素兰', '素娟', '素秀', '素芳'],
        '周': ['雅琴', '雅娟', '雅芬', '雅英', '雅兰', '雅华', '雅秀', '雅芳'],
        '吴': ['惠娟', '惠芬', '惠琴', '惠英', '惠兰', '惠华', '惠秀', '惠芳']
    };
    
    // 性格列表
    const personalities = ['温柔体贴', '活泼开朗', '端庄大方', '聪明伶俐', '善良纯真', '坚强独立', '敏感细腻', '豪爽直率'];
    
    // 技能列表
    const skills = ['诗词', '女红', '烹饪', '书法', '绘画', '歌舞', '礼仪', '医术', '算术', '园艺'];
    
    // 生成其他姐妹
    for (let i = 0; i < 5; i++) {
        // 跳过主角
        if (i === protagonistRank) continue;
        
        // 根据姓氏选择闺名
        const surname = familyInfo.surname;
        const nameOptions = girlNames[surname] || girlNames['张'];
        let name = randomChoice(nameOptions);
        
        // 确保名字不重复
        while (sisters.find(s => s.name === name)) {
            name = randomChoice(nameOptions);
        }
        
        // 根据排行确定年龄（主角12岁，姐妹年龄差异1-5岁）
        const ageDiff = Math.abs(i - protagonistRank) + randomInt(1, 3);
        const age = i < protagonistRank ? 12 + ageDiff : 12 - ageDiff;
        
        // 随机生成容貌（0-100）
        const appearance = randomInt(40, 90);
        
        // 随机选择性格
        const personality = randomChoice(personalities);
        
        // 随机选择1-3个初始技能
        const skillCount = randomInt(1, 3);
        const sisterSkills = [];
        
        for (let j = 0; j < skillCount; j++) {
            const skill = randomChoice(skills);
            if (!sisterSkills.find(s => s.name === skill)) {
                sisterSkills.push({
                    name: skill,
                    level: randomInt(5, 40)
                });
            }
        }
        
        // 生成姐妹关系
        const relationships = ['亲密', '友好', '一般', '冷淡', '敌对'];
        const relationship = randomChoice(relationships);
        
        sisters.push({
            name,
            age,
            rank: ranks[i],
            appearance,
            personality,
            skills: sisterSkills,
            relationship
        });
    }
    
    return sisters;
}

// 初始化游戏数据
function initializeGameData(familyInfo, protagonistInfo, parentsInfo, sistersInfo) {
    return {
        family: {
            dynasty: familyInfo.dynasty,
            reignYear: familyInfo.reignYear,
            surname: familyInfo.surname,
            familyStatus: familyInfo.familyStatus,
            asset: familyInfo.asset,
            familyStyle: familyInfo.familyStyle
        },
        protagonist: protagonistInfo,
        parents: parentsInfo,
        sisters: sistersInfo,
        time: {
            year: 1,
            season: '春季'
        },
        assets: {
            money: getInitialMoney(familyInfo.asset),
            properties: [],
            jewelry: [],
            clothes: []
        },
        relationships: {
            family: [],
            friends: [],
            enemies: []
        },
        events: [],
        yearlyEvents: [],
        familyNews: [],
        letters: [],
        homeMap: {
            rooms: [
                { id: 'main_hall', name: '正厅', description: '家族聚会和接待客人的地方' },
                { id: 'bedroom', name: '闺房', description: '你的私人空间，可以休息和学习' },
                { id: 'garden', name: '花园', description: '种植花草树木的地方，空气清新' },
                { id: 'study', name: '书房', description: '存放书籍和学习的地方' },
                { id: 'kitchen', name: '厨房', description: '做饭和准备食物的地方' },
                { id: 'ancestral_hall', name: '祠堂', description: '供奉祖先牌位的地方' }
            ]
        },
        hasMatchmaker: false,
        hasMultipleMatchmakers: false,
        hasSocialPressure: false,
        married: false,
        marriageAge: 0,
        ending: null,
        saveTime: Date.now()
    };
}

// 根据家族资产获取初始银两
function getInitialMoney(asset) {
    switch (asset) {
        case '贫穷':
            return randomInt(10, 50);
        case '小康':
            return randomInt(50, 200);
        case '中等':
            return randomInt(200, 500);
        case '富裕':
            return randomInt(500, 1000);
        case '巨富':
            return randomInt(1000, 5000);
        default:
            return 100;
    }
}

// 验证表单
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });
    
    return isValid;
}

// 平滑滚动到元素
function scrollToElement(element, offset = 0) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

// 格式化日期
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 计算相对时间
function getRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    // 小于1分钟
    if (diff < 60000) {
        return '刚刚';
    }
    // 小于1小时
    else if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`;
    }
    // 小于1天
    else if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}小时前`;
    }
    // 小于30天
    else if (diff < 2592000000) {
        return `${Math.floor(diff / 86400000)}天前`;
    }
    // 大于30天
    else {
        return formatDate(new Date(timestamp));
    }
}

// 复制到剪贴板
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('复制成功！', 'success');
}

// 检查是否为移动设备
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 检查是否支持本地存储
function isLocalStorageSupported() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

// 加载API配置
function loadApiConfig() {
    if (!isLocalStorageSupported()) return null;
    
    try {
        const config = localStorage.getItem('api_config');
        return config ? JSON.parse(config) : null;
    } catch (e) {
        console.error('加载API配置失败:', e);
        return null;
    }
}

// 保存API配置
function saveApiConfig(config) {
    if (!isLocalStorageSupported()) {
        showToast('浏览器不支持本地存储！', 'error');
        return false;
    }
    
    try {
        localStorage.setItem('api_config', JSON.stringify(config));
        return true;
    } catch (e) {
        console.error('保存API配置失败:', e);
        showToast('保存API配置失败！', 'error');
        return false;
    }
}

// 测试API连接
async function testApi(config, prompt) {
    // 模拟API响应
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                text: `春日的阳光洒在花园里，桃花、杏花竞相开放，空气中弥漫着淡淡的花香。我漫步在小径上，看着蝴蝶在花丛中飞舞，听着鸟儿在枝头歌唱。微风轻拂，花瓣纷纷扬扬地飘落，如同一场粉色的雨。我伸手接住一片花瓣，感受着春天的气息。这样的时光，真是美好啊！`,
                tokens: 150
            });
        }, 1000);
    });
}

// 生成随机ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const context = this;
        const args = arguments;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

// 深拷贝对象
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Object) {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

// 检查对象是否为空
function isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

// 限制数字范围
function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

// 计算百分比
function percentage(value, total) {
    return total === 0 ? 0 : Math.round((value / total) * 100);
}

// 格式化数字（添加千位分隔符）
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 截断文本
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// 检查是否为有效的URL
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

// 获取URL参数
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// 平滑滚动到顶部
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 添加事件监听器（支持多个元素）
function addEventListeners(elements, event, handler) {
    if (!Array.isArray(elements)) {
        elements = [elements];
    }
    elements.forEach(element => {
        if (element) {
            element.addEventListener(event, handler);
        }
    });
}

// 移除事件监听器（支持多个元素）
function removeEventListeners(elements, event, handler) {
    if (!Array.isArray(elements)) {
        elements = [elements];
    }
    elements.forEach(element => {
        if (element) {
            element.removeEventListener(event, handler);
        }
    });
}

// 创建元素
function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // 设置属性
    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else {
            element.setAttribute(key, value);
        }
    }
    
    // 添加子元素
    if (!Array.isArray(children)) {
        children = [children];
    }
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child) {
            element.appendChild(child);
        }
    });
    
    return element;
}

// 获取元素
function getElement(selector) {
    return document.querySelector(selector);
}

// 获取多个元素
function getElements(selector) {
    return document.querySelectorAll(selector);
}

// 切换类名
function toggleClass(element, className) {
    if (element) {
        element.classList.toggle(className);
    }
}

// 添加类名
function addClass(element, className) {
    if (element) {
        element.classList.add(className);
    }
}

// 移除类名
function removeClass(element, className) {
    if (element) {
        element.classList.remove(className);
    }
}

// 检查是否包含类名
function hasClass(element, className) {
    return element ? element.classList.contains(className) : false;
}

// 设置元素样式
function setStyle(element, styles) {
    if (!element) return;
    
    for (const [property, value] of Object.entries(styles)) {
        element.style[property] = value;
    }
}

// 获取元素样式
function getStyle(element, property) {
    return element ? window.getComputedStyle(element).getPropertyValue(property) : null;
}

// 显示元素
function showElement(element) {
    if (element) {
        element.style.display = '';
    }
}

// 隐藏元素
function hideElement(element) {
    if (element) {
        element.style.display = 'none';
    }
}

// 淡入元素
function fadeIn(element, duration = 300) {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease`;
    showElement(element);
    
    setTimeout(() => {
        element.style.opacity = '1';
    }, 10);
}

// 淡出元素
function fadeOut(element, duration = 300) {
    if (!element) return;
    
    element.style.opacity = '1';
    element.style.transition = `opacity ${duration}ms ease`;
    
    setTimeout(() => {
        element.style.opacity = '0';
        
        setTimeout(() => {
            hideElement(element);
        }, duration);
    }, 10);
}

// 滑动进入元素
function slideIn(element, direction = 'left', duration = 300) {
    if (!element) return;
    
    const styles = {
        transition: `transform ${duration}ms ease`,
        transform: ''
    };
    
    switch (direction) {
        case 'left':
            styles.transform = 'translateX(-100%)';
            break;
        case 'right':
            styles.transform = 'translateX(100%)';
            break;
        case 'top':
            styles.transform = 'translateY(-100%)';
            break;
        case 'bottom':
            styles.transform = 'translateY(100%)';
            break;
    }
    
    setStyle(element, styles);
    showElement(element);
    
    setTimeout(() => {
        element.style.transform = 'translate(0)';
    }, 10);
}

// 滑动离开元素
function slideOut(element, direction = 'left', duration = 300) {
    if (!element) return;
    
    const styles = {
        transition: `transform ${duration}ms ease`
    };
    
    switch (direction) {
        case 'left':
            styles.transform = 'translateX(-100%)';
            break;
        case 'right':
            styles.transform = 'translateX(100%)';
            break;
        case 'top':
            styles.transform = 'translateY(-100%)';
            break;
        case 'bottom':
            styles.transform = 'translateY(100%)';
            break;
    }
    
    setStyle(element, styles);
    
    setTimeout(() => {
        hideElement(element);
    }, duration);
}