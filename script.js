// 吾家有女初长成 主要页面逻辑（轮播、随机生成、交互提示、人物生成框架等）
// --- 核心数据结构
const dynasties = [
    { name: "大明", yearName: "永乐", yearBase: 1402 },
    { name: "大唐", yearName: "贞观", yearBase: 627 },
    { name: "清", yearName: "道光", yearBase: 1821 },
    { name: "民国", yearName: "民国", yearBase: 1912 },
    { name: "大宋", yearName: "熙宁", yearBase: 1068 },
    { name: "大晋", yearName: "太康", yearBase: 280 },
    { name: "周", yearName: "宣王", yearBase: -827 },
];
const surnames = ["李", "赵", "陈", "江", "盛", "沈", "顾", "杨", "欧阳", "穆"];
const identArr =["世家官宦","小地主","寒门农户","手艺人家","书香门第"];
const familyStyleArr = ["温润如玉","严谨自律","仁厚淳朴","重文抑武","和乐融融"];
const assetBaseArr  = [3000, 1800, 800, 1200, 2600];
const girlNames = ["明柔","清瑶","绮彤","知芷","如雪","采薇","静姝","琇莹","雪遥","雨漪"];
const personalities = ["温婉贤淑","聪慧灵动","直率坦荡","细腻敏感","乐观豪爽","谨慎持重","倔强独立"];
const looksArr = ["国色天香","清秀可人","明眸皓齿","灵巧倩影","月貌花容","娇俏玲珑"];
const skillsArr = [
    {name:"琴艺",desc:"弹琴谱曲，陶冶性情"},
    {name:"书法",desc:"用笔如云烟，秀雅绝伦"},
    {name:"诗文",desc:"文采风流，咏叹之间显慧质"},
    {name:"礼仪",desc:"礼数周全，知进退"},
    {name:"厨艺",desc:"烹调百味，居家贤惠"},
    {name:"医术",desc:"悬壶济世，传承仁心"},
    {name:"算学",desc:"心思缜密，巧算盈亏"},
    {name:"骑射",desc:"巾帼不让须眉"},
    {name:"舞蹈",desc:"轻盈曼妙，翩若惊鸿"}
];

// utils
function random(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function randInt(a,b){ return a+Math.floor(Math.random()*(b+1-a)); }

// --- 1. 主页轮播封面
if(document.querySelector('.carousel')){
    let currIndex=0,max=4,timer=null;
    const carouselTrack=document.querySelector('.carousel-track');
    const dots=document.querySelector('.carousel-dots');
    function setCarousel(idx){
        carouselTrack.style.transform=`translateX(-${320*idx}px)`;
        Array.from(dots.children).forEach((el,i)=>el.className=(i===idx?'active':''));
        currIndex=idx;
    }
    // 创建小圆点
    for(let i=0;i<=max;i++){
        let span=document.createElement('span');
        span.onclick=()=>setCarousel(i);
        dots.appendChild(span);
    }
    document.getElementById('prev-btn').onclick=()=>setCarousel((currIndex-1+max+1)%(max+1));
    document.getElementById('next-btn').onclick=()=>setCarousel((currIndex+1)%(max+1));
    setCarousel(0);
    timer=setInterval(()=>setCarousel((currIndex+1)%(max+1)),4200);
    Array.from(dots.children).forEach((el,i)=>el.onclick=()=>setCarousel(i));
    document.querySelector('.carousel').onmouseenter=()=>clearInterval(timer);
    document.querySelector('.carousel').onmouseleave=()=>timer=setInterval(()=>setCarousel((currIndex+1)%(max+1)),4200);
}
// --- 2. 角色创建页，家族与人物/核心NPC随机生成
let roleState={};
function genFamily(){
    let idx=randInt(0, dynasties.length-1), sidx=randInt(0, surnames.length-1), fid=randInt(0,4);
    const fam={id: Date.now(), dynasty:dynasties[idx].name, yearName:dynasties[idx].yearName, yearBase: dynasties[idx].yearBase, surname:surnames[sidx], ident:identArr[fid], asset:assetBaseArr[fid]+randInt(0, 400), style:random(familyStyleArr), curYear:1 };
    fam.desc=`${fam.dynasty}${fam.yearName}年，${fam.surname}氏，${fam.ident}，风格${fam.style}，家产${fam.asset}两银。`;
    return fam;
}
function genRole(surname,rank){
    return {
        rank:rank,
        name:random(girlNames),
        styleName:random(["","若水","之瑶","绾清"]),
        looks:random(looksArr),
        personality:random(personalities),
        age:12,
        skills: skillsArr.map(s=>({name:s.name,score:randInt(32,58)})),
        health:randInt(75,90),
        emotion:random(["单纯","好奇","期待","归属"]),
        secretAttr:random(["天赋异秉","隐藏疾病","姻缘命格","过敏体质","诗书世家血脉","情绪易感"]),
    };
}
function genNPC(surname, idx,nameList){
    // 父母与其余姐妹
    const npcList=[];
    npcList.push({
        relation:"父亲",
        name:""+surname+"远山",
        looks:random(["温和儒雅","严厉庄重"]),
        personality:random(["仁厚","正直","好学"]),
        skill:random(["书法","诗词","仕途"]),
        age:randInt(40,58),
        desc:"家中顶梁柱，为人" + random(["宽厚", "勤俭", "略有威严"]),
    });
    npcList.push({
        relation:"母亲",
        name:"林氏（"+surname+"夫人）",
        looks:random(["温婉贤淑","端庄大气"]),
        personality:random(["亲和","能干","细致"]),
        skill:random(["针线","礼仪","药理"]),
        age:randInt(36,47),
        desc:"操持家务、细致慈爱",
    });
    for(let i=1;i<=5;i++){
        if(i===idx)continue; // 排行
        npcList.push({
            relation:"姐妹"+i,
            name:surname+random(nameList),
            looks:random(looksArr),
            personality:random(personalities),
            skill:random(skillsArr).name,
            age:12,
            desc:"性格"+random(personalities)
        });
    }
    return npcList;
}
function fillFamilyInfo(fam){
    const list=document.getElementById('family-info-list');
    list.innerHTML=`
      <li>朝代：<b>${fam.dynasty}</b></li>
      <li>年号：<b>${fam.yearName}</b></li>
      <li>姓氏：<b>${fam.surname}氏</b></li>
      <li>家族身份：${fam.ident}</li>
      <li>初始资产：${fam.asset}两银</li>
      <li>家风：${fam.style}</li>
      <li>当前年代：${fam.yearBase+fam.curYear}年</li>
    `;
}
function fillRoleInfo(role){
    const list=document.getElementById('role-info-list');
    list.innerHTML=`
      <li>排行：第${role.rank}女</li>
      <li>姓名/闺名：${role.name}</li>
      <li>容貌：${role.looks}</li>
      <li>性格：${role.personality}</li>
      <li>初始技能：${role.skills.map(s=>`${s.name}${s.score}`).join('，')}</li>
      <li>隐性属性：${role.secretAttr}</li>
      <li>情感状态：${role.emotion}</li>
    `;
}
function fillNPCInfo(npcs){
    const area=document.getElementById('npc-list');
    area.innerHTML='';
    npcs.forEach((npc,i)=>{
        const card=document.createElement('div');
        card.className='npc-card';
        card.innerHTML=`<span class="npc-basic">${npc.relation} ${npc.name}</span>
        <div class="npc-desc">容貌：${npc.looks || '—'}<br>性格：${npc.personality}<br>技能:${npc.skill}<br>年龄:${npc.age}</div>
        <button class='npc-toggle'>详情</button>
        <div class='npc-detail' style='display:none'>${npc.desc}</div>
        `;
        let isOpen=false;
        card.querySelector('.npc-toggle').onclick=()=>{
            isOpen=!isOpen;
            card.classList.toggle("expanded",isOpen);
            card.querySelector('.npc-detail').style.display=isOpen?'block':'none';
        };
        area.appendChild(card);
    });
}
function genAll(){
    // 初始五女排名1-5
    let fam=genFamily();
    let myIdx=randInt(1,5);
    let role=genRole(fam.surname,myIdx);
    let npcs=genNPC(fam.surname,myIdx,girlNames);
    fillFamilyInfo(fam); fillRoleInfo(role); fillNPCInfo(npcs);
    // 保存本次信息以备进入游戏
    window.roleState={fam,role,npcs};
}
if(document.getElementById('family-info-list')) genAll();
// 重新随机
let rebtn=document.getElementById('btn-re-random');
if(rebtn) rebtn.onclick=genAll;
// 确认进入游戏
if(document.getElementById('btn-confirm')){
    document.getElementById('btn-confirm').onclick=()=>{
        // 保存到本地：为演示临时采用localStorage
        localStorage.setItem('wjynPlayerInfo',JSON.stringify(window.roleState));
        showTip('角色数据已保存，进入游戏...',true);
        setTimeout(()=>window.location.href="game.html",600);
    };
}
// --- 3. 游戏主界面展示&初始化
if(document.getElementById('main-game')){
    let info=localStorage.getItem('wjynPlayerInfo');
    if(!info){
        showTip("未检测到角色，请先创建角色！",false);
        setTimeout(()=>window.location.href="create-role.html",1400);
    }else{
        const state=JSON.parse(info);
        // 顶部时间面板
        document.getElementById('year-info').textContent=`年号: ${state.fam.dynasty}${state.fam.yearName}`;
        document.getElementById('year-age').textContent=`公元${state.fam.yearBase+state.fam.curYear}年(年龄${state.role.age})`;
        document.getElementById('season-info').textContent=`季节: 春`;
        // 左侧信息栏
        const uls=document.getElementById('player-info-list');
        uls.innerHTML=`
          <li>姓名: <b>${state.role.name}</b></li>
          <li>排行: 第${state.role.rank}女</li>
          <li>容貌: ${state.role.looks}</li>
          <li>性格: ${state.role.personality}</li>
          <li>资产: ${state.fam.asset}两</li>
          <li>健康: ${state.role.health}</li>
          <li>情感: ${state.role.emotion}</li>
        `;
        // 技能面板
        const skp = document.getElementById('skill-panel');
        skp.innerHTML='';
        state.role.skills.forEach(s=>{
            const el=document.createElement('div');
            el.className='skill-item';
            el.innerHTML=`${s.name}: <b>${s.score}</b>`;
            skp.appendChild(el);
        });
        // 家庭新闻与事件/互动等可由JS随机生成或调用AI扩展
        let mainEvents = document.getElementById('main-events-list');
        mainEvents.innerHTML = `<div class='family-news-type-neutral'>✨ 今年天气顺和，家中喜无大事。</div>`;
        let interactionEvents=document.getElementById('interaction-events-list');
        interactionEvents.innerHTML = `<div>点击“推进一年”体验更多事件～</div>`;
        // 新人物登场演示
        let npcArea = document.getElementById('new-npc-list');
        npcArea.innerHTML = `<div>暂无新人物</div>`;
    }
    // 事件&推进交互等交由后续JS接管
}

// --- 4. 交互反馈与全局提示层
function showTip(txt, isOk){
    let box=document.createElement('div');
    box.className="feedback-tip"+(isOk?" positive":" negative");
    box.textContent=txt;
    document.getElementById('global-interactions').appendChild(box);
    setTimeout(()=>box.remove(),1800);
}