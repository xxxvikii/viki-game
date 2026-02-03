/**
 * script.js
 * 游戏核心前端主控代码
 *
 * 实现所有页面/面板切换、用户交互与AI控制、动态加载、内容渲染、响应式适配等
 * 任务分明：1.初始化游戏，2.主页面&面板监听，3.AI请求调度，4.存档管理，5.动画&错误提示，6.全局响应式
 * 
 * @version 2.0.0
 */

document.addEventListener("DOMContentLoaded", () => {
    const pageType = detectPageType();
    // 页面入口，按页面需求初始化
    switch(pageType) {
        case "index": initHomePage(); break;
        case "create-role": initCreateRolePage(); break;
        case "game": initGamePage(); break;
        case "api-config": initAPIConfigPage(); break;
        case "instructions": initInstructionsPage(); break;
    }
    enableResponsive(); // 响应式菜单等
});

/* --------------------- 工具函数区 --------------------- */

/**
 * 检测当前页面类型
 * @returns {string} 页面标识
 */
function detectPageType() {
    const path = window.location.pathname;
    if (path.endsWith("index.html")) return "index";
    if (path.endsWith("create-role.html")) return "create-role";
    if (path.endsWith("game.html")) return "game";
    if (path.endsWith("api-config.html")) return "api-config";
    if (path.endsWith("instructions.html")) return "instructions";
    return "index";
}
/**
 * 显示全局Loading遮罩，亦可用于AI请求等待动画
 * @param {string} msg 
 */
function showLoading(msg = "AI生成中...") {
    let bg = document.getElementById("global-loading");
    if (!bg) {
        bg = document.createElement("div");
        bg.id = "global-loading";
        bg.innerHTML = `
            <div style="position:fixed;z-index:99999;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
                <div style="text-align:center;padding:2em 3em;background:white;border-radius:1em;box-shadow:0 4px 16px #888;">
                    <div class="w-14 h-14 border-4 border-primary border-t-accent rounded-full animate-spin mx-auto mb-2"></div>
                    <div style="font-size:1.2em;" id="global-loading-text">${msg}</div>
                </div>
            </div>
        `;
        document.body.appendChild(bg);
    } else {
        document.getElementById("global-loading-text").textContent = msg;
        bg.style.display = "";
    }
}
function hideLoading() {
    const bg = document.getElementById("global-loading");
    if (bg) bg.style.display = "none";
}
/**
 * 全局通用消息浮框
 * @param {string} msg 
 * @param {"info"|"success"|"error"} type 
 * @param {number} duration - 显示毫秒数
 */
function showToast(msg, type="info", duration=2200) {
    let box = document.getElementById("global-toast");
    if (!box) {
        box = document.createElement("div");
        box.id = "global-toast";
        box.style.cssText = "position:fixed;z-index:12000;left:50%;top:12vh;transform:translate(-50%,0);pointer-events:none;";
        document.body.appendChild(box);
    }
    box.innerHTML = `<div class="bg-${type=='success'?'green-500':type=='error'?'red-500':'accent'} text-white px-6 py-3 rounded-lg shadow-xl" style="min-width:220px;text-align:center;font-size:1.1em;">
        ${msg}
    </div>`;
    box.style.opacity = 1;
    setTimeout(()=>{ box.style.opacity = 0; }, duration);
}
/**
 * 确认弹窗
 * @param {string} title 
 * @param {string} content 
 * @param {function} onConfirm 
 */
function showConfirm(title, content, onConfirm) {
    let c = document.getElementById("global-confirm");
    if (c) c.remove();
    c = document.createElement("div");
    c.id = "global-confirm";
    c.innerHTML = `<div style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:20000;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <div class="bg-white p-8 rounded-xl text-center shadow-xl min-w-[260px]">
            <div class="font-bold text-xl mb-4">${title}</div>
            <div class="mb-6 text-base">${content}</div>
            <button class="btn-primary px-6 py-2 mx-2" id="cf-ok">确定</button>
            <button class="btn-secondary px-6 py-2 mx-2" id="cf-cancel">取消</button>
        </div>
    </div>`;
    document.body.appendChild(c);
    c.querySelector("#cf-ok").onclick = ()=>{ c.remove(); onConfirm && onConfirm(); };
    c.querySelector("#cf-cancel").onclick = ()=>{ c.remove(); };
}

/**
 * 通用的安全JSON读取
 * @param {string} key localStorage键名
 * @returns {object|null}
 */
function readJSON(key) {
    try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : null;
    }catch(e){return null;}
}
/* ------------------- 响应式兼容逻辑 ------------------- */
function enableResponsive() {
    /** 菜单栏与移动端交互相关适配 */
    const btn = document.getElementById("mobile-menu-button");
    if (btn) {
        btn.addEventListener("click", function() {
            let mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.toggle('hidden');
        });
    }
    // 可按需补充 resize/自动隐藏移动菜单等逻辑
}

/* ---------------------- 首页区 ---------------------- */
function initHomePage() {
    // 已实现页面动效/导航/轮播等，无需特殊处理
    document.getElementById('start-game').onclick = ()=>window.location.href = 'create-role.html';

    // 存档读取、跳转等事件可完善
    document.getElementById('load-game').onclick = ()=>showLoadGameModal();
    document.getElementById('close-load-modal').onclick = ()=>hideLoadGameModal();
    document.getElementById('cancel-load').onclick = ()=>hideLoadGameModal();
    document.getElementById('confirm-load').onclick = ()=> {
        const sel = document.querySelector('.save-slot.ring-2');
        if (sel) {
            // 真实读取存档
            // 这里建议读取saveLoadManager.loadGame()后跳转
            showToast("存档读取中...","info");
            setTimeout(()=>{window.location.href='game.html';},1200);
        } else {
            showToast("请选择一个存档","error");
        }
    };
    document.querySelectorAll('.save-slot').forEach(slot=>{
        slot.onclick = function() {
            document.querySelectorAll('.save-slot').forEach(s=>s.classList.remove('ring-2','ring-accent'));
            this.classList.add('ring-2','ring-accent');
        };
    });
}

function showLoadGameModal() {
    document.getElementById('load-game-modal').classList.remove('hidden');
    // 可以补充真实存档遍历
}
function hideLoadGameModal() {
    document.getElementById('load-game-modal').classList.add('hidden');
}

/* ----------------- 角色创建页面区 ----------------- */
function initCreateRolePage() {
    // 角色、家族、npc重新随机功能同现有实现
    document.getElementById('randomize-family').onclick = randomizeFamily;
    document.getElementById('randomize-character').onclick = randomizeCharacters;
    document.getElementById('randomize-npc').onclick = randomizeNPCs;
    document.getElementById('randomize-all').onclick = () => {
        randomizeFamily();
        randomizeCharacters();
        randomizeNPCs();
    };
    document.getElementById('back-to-home').onclick = ()=>window.location.href='index.html';
    document.getElementById('start-game').onclick = ()=> {
        // 采集所有设定，存入localStorage
        const gameData = buildInitialGameData();
        localStorage.setItem('gameData',JSON.stringify(gameData));
        window.location.href='game.html';
    };
}

// =======角色创建页面辅助逻辑=======

function buildInitialGameData() {
    // 采集页面当前内容作为游戏初始状态
    const idx = parseInt(document.querySelector('.character-card.selected').getAttribute('data-index'));
    return {
        dynasty: document.getElementById('dynasty').textContent,
        yearName: document.getElementById('year-name').textContent,
        familyName: document.getElementById('family-name').textContent,
        familyStatus: document.getElementById('family-status').textContent,
        familyAssets: document.getElementById('family-assets').textContent,
        familyStyle: document.getElementById('family-style').textContent,
        selectedCharacter: idx,
        year: 1,
        season: 0, // 以后废弃
        age: 12+idx, // 姐妹年龄相差1岁，最小12，大姐16，五妹12
        currentYear: 1,
        currentAge: 12+idx,
        gameOver: false,
        createdAt: Date.now()
    };
}

/* ======== 动态家族随机（修正版） ======= */
function randomizeFamily() {
    const dynasties = ['汉朝', '唐朝', '宋朝', '元朝', '明朝', '清朝', '民国初期'];
    const yearNames = ['洪武', '永乐', '嘉靖', '万历', '崇祯', '康熙', '雍正', '乾隆'];
    const familyNames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
    const statuses = ['书香门第', '官宦之家', '商贾巨富', '武林世家'];
    const assets = ['富裕', '中等', '小康', '清贫'];
    const styles = ['诗书传家', '清正廉洁', '乐善好施', '重商轻文', '尚武精神', '耕读传家'];
    document.getElementById('dynasty').textContent = dynasties[Math.floor(Math.random()*dynasties.length)];
    document.getElementById('year-name').textContent = yearNames[Math.floor(Math.random()*yearNames.length)];
    // 保证全页面姓名同步
    const fn = familyNames[Math.floor(Math.random()*familyNames.length)];
    document.getElementById('family-name').textContent = fn;
    document.getElementById('family-status').textContent = statuses[Math.floor(Math.random()*statuses.length)];
    document.getElementById('family-assets').textContent = assets[Math.floor(Math.random()*assets.length)];
    document.getElementById('family-style').textContent = styles[Math.floor(Math.random()*styles.length)];
    // ----更新所有角色姓----
    document.querySelectorAll('.character-card h3').forEach((name,idx)=>{
        name.textContent = fn + name.textContent.substring(1);
    });
    // 更新姐妹信息
    document.querySelectorAll('.bg-light h4.font-bold').forEach((name,idx)=>{
        if(idx<2) return; // 跳父母
        name.textContent = fn + name.textContent.substring(1);
    });
    const detailsName = document.querySelector('#character-details h3.text-xl');
    if (detailsName) detailsName.textContent = fn + detailsName.textContent.substring(1);
}
function randomizeCharacters(){
    // 随机切选一个主角
    const randomIndex = Math.floor(Math.random() * 5);
    document.querySelectorAll('.character-card').forEach((card,idx)=>{
        card.classList.toggle('selected', idx==randomIndex);
        if(idx==randomIndex) updateCharacterDetails(idx);
    });
}
function randomizeNPCs(){
    // 只随机父母描述，细节略
    const fatherJobs = ['翰林院编修', '吏部侍郎', '将军', '名医', '富商', '教书先生'];
    const motherOrigins = ['出身官宦之家','出身书香门第','出身商贾之家','出身农家'];
    const fatherTraits = ['性格严谨，学识渊博', '公正廉洁，刚正不阿','豪爽大方','温文尔雅'];
    const motherTraits = ['温柔贤惠，持家有道','精明能干','知书达理','慈爱宽容'];
    document.querySelectorAll('.bg-light p.text-sm.text-muted')[0].textContent = `45岁 · ${fatherJobs[Math.floor(Math.random()*fatherJobs.length)]}`;
    document.querySelectorAll('.bg-light p.text-sm.text-muted')[1].textContent = `40岁 · ${motherOrigins[Math.floor(Math.random()*motherOrigins.length)]}`;
    document.querySelectorAll('.bg-light p.text-sm.mt-1')[0].textContent = `${fatherTraits[Math.floor(Math.random()*fatherTraits.length)]}，对子女要求严格但关爱有加。`;
    document.querySelectorAll('.bg-light p.text-sm.mt-1')[1].textContent = `${motherTraits[Math.floor(Math.random()*motherTraits.length)]}，擅长刺绣和诗词，对女儿们悉心教导。`;
}

/* --------- 游戏主页面区（game.html） --------- */
function initGamePage() {
    // 初始数据读取
    let gameState = readJSON('currentGameState') || readJSON('gameData');
    if (!gameState) {
        showToast("未检测到有效存档，将重定向至角色创建...", "error");
        setTimeout(()=>{ window.location.href='create-role.html'; },2000); return;
    }
    // ----核心面板绑定实现----
    // 年度事件面板
    bindTabSwitch();
    renderGamePanel(gameState); // 初始渲染个人信息/面板
    bindPanelEvents(gameState);
    // AI面板内容生成（如年度事件、互动、家书等）
}

/** 标签切换事件绑定 */
function bindTabSwitch() {
    document.querySelectorAll(".tab-button").forEach(btn=>{
        btn.onclick = function() {
            document.querySelectorAll(".tab-button").forEach(x=>x.classList.remove("active"));
            btn.classList.add("active");
            document.querySelectorAll(".tab-content").forEach(panel=>panel.classList.add("hidden"));
            document.getElementById(btn.dataset.tab + "-tab").classList.remove("hidden");
        };
    });
}

/** 
 * 渲染核心左侧状态栏/技能栏（gameState作为主数据源）
*/
function renderGamePanel(state){
    // 个人信息/技能栏处理 - 可后续自动填充
    // todo: 实时渲染所有状态属性
}

/**
 * 主面板各事件监听+AI内容生成/渲染
 * @param {*} state 当前游戏状态
 */
function bindPanelEvents(state) {
    // 年度事件生成
    document.getElementById('events-tab').addEventListener("click",async function(e){
        if (e.target.classList.contains("event-card")) {
            showLoading("生成年度事件...");
            const res = await aiInterface.generate('event',{characterName:state.character?.name||"女主", dynasty:state.dynasty, year:state.year, characterAttr:state.character});
            hideLoading();
            if (res.success) {
                showPanelModal("年度大事件", `<div>${res.data.summary||res.data.text||'---'}</div>`);
            } else {
                showToast(res.message, "error",3000);
            }
        }
    });
    // 人物互动
    document.getElementById('interactions-tab').addEventListener("click",async function(e){
        if (e.target.classList.contains("event-card")) {
            showLoading("AI生成互动...");
            const res = await aiInterface.generate('dialogue',{speaker:"主角", addressee:"姐妹", speakerPersonality:"活泼", ...state});
            hideLoading();
            if (res.success) {
                let html = "<div>";
                (res.data.lines||[]).forEach(line=>{
                    html += `<div>${line.text}</div>`;
                });
                html += res.data.effect?`<div class="mt-2 text-info">互动结果：${res.data.effect}</div>`:'';
                html += "</div>";
                showPanelModal("互动详情",html);
            } else {
                showToast(res.message,"error");
            }
        }
    });
    // 家庭动态
    document.getElementById('family-tab').addEventListener("click",async function(e){
        if (e.target.classList.contains("event-card")) {
            showLoading("AI生成家庭事件...");
            const res = await aiInterface.generate('family',state);
            hideLoading();
            if(res.success)showPanelModal("家庭动态",`<pre>${JSON.stringify(res.data,null,2)}</pre>`);
            else showToast(res.message,"error");
        }
    });
    // 我的手记：增删改
    document.getElementById('notes-tab').addEventListener("click", function(e){
        // 可渲染modal编辑内容
    });
    // 书信箱
    document.getElementById('mailbox-btn')?.addEventListener("click",async function(){
        showLoading("生成家书...");
        const mail = await aiInterface.generate('mail',{characterName:state.character?.name});
        hideLoading();
        if(mail.success){
            showPanelModal("收到来信",`<b>发信人：</b>${mail.data.from}<br><b>内容：</b>${mail.data.content}<br><b>时间：</b>${mail.data.date}`);
        }else{
            showToast(mail.message,"error");
        }
    });
    // 家宅地图点击
    document.querySelectorAll('.map-area').forEach(btn=>{
        btn.onclick = async ()=>{
            showLoading("探索...");
            const res = await aiInterface.generate('explore',{area:btn.dataset.name||"后院"}); hideLoading();
            if(res.success)showPanelModal(`${btn.dataset.name}探索`,res.data.summary);
            else showToast(res.message,"error");
        }
    });
    // 人物关系
    document.getElementById('relationship-btn')?.onclick = async ()=>{
        showLoading("生成关系图...");
        const res = await aiInterface.generate('relationship',state);
        hideLoading();
        if(res.success) showPanelModal("人物关系",`<pre>${JSON.stringify(res.data,null,2)}</pre>`);
        else showToast(res.message,"error");
    }
    // 资产与技能
    document.getElementById('assetskills-btn')?.onclick = async ()=>{
        showLoading("生成年度资产技能...");
        const res = await aiInterface.generate('asset-skills',state);
        hideLoading();
        if(res.success) showPanelModal("资产/技能变化",`<pre>${JSON.stringify(res.data,null,2)}</pre>`);
        else showToast(res.message,"error");
    };
    // 回顾事件
    document.getElementById('history-btn')?.onclick = async ()=>{
        showLoading("回顾生成...");
        const res = await aiInterface.generate('history',state); hideLoading();
        if(res.success)showPanelModal("年度回顾",`<ul>${(res.data.summary||[]).map(e=>`<li>${e}</li>`).join('')}</ul>`);
        else showToast(res.message,"error");
    };
    // 重开新人生
    document.getElementById("restart-btn")?.onclick = ()=>{
        showConfirm("重新开始人生","此操作将重置全部进度，确定新开一局吗？",()=>{
            localStorage.clear(); window.location.href = 'create-role.html';
        });
    };
}

/**
 * 公用大弹窗(html内容展示)
 */
function showPanelModal(title, content) {
    let box = document.getElementById("big-modal");
    if(!box){
        box = document.createElement("div");
        box.id="big-modal";
        box.innerHTML = `<div style="position:fixed;z-index:9000;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.22);display:flex;align-items:center;justify-content:center;">
            <div class="bg-white p-8 rounded-xl max-w-lg w-full shadow-2xl relative">
                <button id="close-big-modal" class="absolute right-4 top-2 fa fa-times text-xl text-gray-500 hover:text-accent"></button>
                <div class="font-bold text-xl mb-3">${title}</div>
                <div>${content}</div>
            </div>
        </div>`;
        document.body.appendChild(box);
    }
    else {
        box.querySelector('.font-bold').textContent=title;
        box.querySelector('div:nth-child(3)').innerHTML = content;
        box.style.display="";
    }
    document.getElementById("close-big-modal").onclick = ()=>{box.style.display="none";}
}

/* ------------- API配置页面区 ------------- */
function initAPIConfigPage() {
    // 服务商卡片点击：切换模型、接口、UI等
    document.querySelectorAll('.provider-card').forEach(card=>{
        card.onclick = function(){
            document.querySelectorAll('.provider-card').forEach(c=>c.classList.remove('selected'));
            this.classList.add('selected');
            // 更新模型下拉内容
            const prov = this.getAttribute('data-provider');
            updateProviderUI(prov);
        }
    });
    // 模型选择
    document.getElementById('api-model').onchange = function(){
        if(this.value === "custom"){
            document.getElementById('custom-model-field').classList.remove('hidden');
        } else {
            document.getElementById('custom-model-field').classList.add('hidden');
        }
    };
    document.getElementById('api-temperature').oninput = function(){
        document.getElementById('temperature-value').textContent = this.value;
    };
    // 测试API连接
    document.getElementById('test-api').onclick = async function(){
        this.innerHTML = "<i class='fa fa-spinner fa-spin mr-2'></i>测试中...";
        this.disabled = true;
        showLoading("密钥验证...");
        const cfg = collectAPIConfigFromForm();
        aiInterface.saveAPIConfig(cfg);
        const ok = await aiInterface.verifyAPIKey();
        hideLoading();
        if (ok){
            showToast("API连接成功","success",2200);
        } else {
            showToast("API连接失败，请检查密钥与接口","error",3200);
        }
        this.innerHTML = "<i class='fa fa-check-circle mr-2'></i>测试连接";
        this.disabled = false;
    };
    // 保存配置
    document.getElementById('api-config-form').onsubmit = e => {
        e.preventDefault();
        const cfg = collectAPIConfigFromForm();
        if(!cfg.apiKey) return showToast("请输入API密钥","error");
        if(cfg.model=="custom" && !cfg.customModel) return showToast("请填写自定义模型","error");
        aiInterface.saveAPIConfig(cfg);
        showToast("API配置已保存!","success");
    };
    // 页面加载自动同步配置
    window.addEventListener("DOMContentLoaded", ()=>{
        // 自动回填配置表单
    });
}

function updateProviderUI(prov){
    // 设置模型下拉/接口
    const ms = aiInterface.providers[prov]?.models||[];
    const sel = document.getElementById('api-model');
    sel.innerHTML = ms.map(m=>`<option value="${m}">${m}</option>`).join('')+'<option value="custom">自定义模型...</option>';
    document.getElementById('api-endpoint').value = aiInterface.providers[prov]?.endpoint||"";
    document.getElementById('custom-model-field').classList.add('hidden');
}

// 收集API配置表单
function collectAPIConfigFromForm(){
    const prov = document.querySelector('.provider-card.selected').getAttribute('data-provider');
    const apiKey = document.getElementById('api-key').value;
    const apiModel = document.getElementById('api-model').value;
    const customModel = document.getElementById('custom-model').value;
    const temperature = parseFloat(document.getElementById('api-temperature').value);
    const maxTokens = parseInt(document.getElementById('api-max-tokens').value);
    const endpoint = document.getElementById('api-endpoint').value;
    return {
        provider: prov,
        apiKey,
        model: apiModel === "custom" ? customModel : apiModel,
        temperature,
        maxTokens,
        endpoint
    };
}

/* ------------- 游戏说明页面区 ------------- */
function initInstructionsPage() {
    // 仅演示型页面，无复��交互
}