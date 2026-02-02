// 多AI API配置&调用管理。需结合后端代理或可CORS直通的接口
// 配置保存(localStorage)，AI对话与剧情生成可基于此配置

const API_CONFIG_KEY = "wjyn_ai_api_config";

function getApiConfig(){
  const raw = localStorage.getItem(API_CONFIG_KEY);
  if(!raw) return null;
  try{return JSON.parse(raw);}catch{ return null;}
}

function saveApiConfig(config){
  localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
}

function validateConfig(config){
  if(!config || !config.provider) return false;
  // 简易判定，真实生产建议API KEY长度/Endpoint等详细校验
  switch(config.provider){
    case "openai": return !!config["openai-key"];
    case "deepseek": return !!config["deepseek-key"];
    case "byte": return !!config["byte-key"];
    case "silicon": return !!config["silicon-key"];
    case "custom": return !!config["custom-endpoint"];
  }
  return false;
}

// 配置页提交与本地保存
if(document.getElementById('api-form')){
  const form = document.getElementById('api-form');
  const status = document.getElementById('api-config-status');
  form.onsubmit = function(e){
    e.preventDefault();
    // 读取表单配置
    const fd = new FormData(form);
    let provider=fd.get("provider");
    let config = { provider };
    ["openai","deepseek","byte","silicon"].forEach(v=>{
        config[v+"-key"]=fd.get(v+"-key"),config[v+"-model"]=fd.get(v+"-model");
    });
    if(provider==="custom"){
      config["custom-key"]=fd.get("custom-key");
      config["custom-endpoint"]=fd.get("custom-endpoint");
      config["custom-model"]=fd.get("custom-model");
    }
    if(!validateConfig(config)){
      status.textContent="请完整填写所需配置";
      status.className="hint";
      return false;
    }
    saveApiConfig(config);
    status.textContent="保存成功，正在测试可用性...";
    status.className="hint";
    // 检查接口有效性
    testApiConnection(config).then(ok=>{
      if(ok){
        status.textContent = "✅ 验证成功，可接入AI生成剧情";
        status.className = "hint";
      }else{
        status.textContent = "❌ 验证失败，请检查Key/模型";
        status.className = "hint";
      }
    });
    return false;
  };
}

// 简化演示用连通性验证，实际应在后端代理专门实现
async function testApiConnection(config){
  // 可按需要自行接入后端，以下为演示逻辑
  if(config.provider==="openai"){
    return config["openai-key"] && config["openai-model"];
  }
  if(config.provider==="deepseek"){
    return config["deepseek-key"] && config["deepseek-model"];
  }
  if(config.provider==="silicon"){
    return config["silicon-key"] && config["silicon-model"];
  }
  if(config.provider==="byte"){
    return config["byte-key"] && config["byte-model"];
  }
  if(config.provider==="custom"){
    return config["custom-endpoint"] && config["custom-model"];
  }
  return false;
}

// 示例AI剧情请求接口
// 输入 prompt，返回大段剧情文本（演示用假数据，实际须接API）
async function fetchGameAIText(promptText){
  let config = getApiConfig();
  if(!config){ showTip("请先配置AI接口",false); return "【无AI配置】"; }
  // 跨域生产建议用后端代理转发；此处以openai为例:
  if(config.provider==="openai"){
    // 此处建议用自己后端转发openai，不建议直接前端请求
    // const resp = await fetch("自定义API转发地址", {method:"POST",body:JSON.stringify({...})});
    // return await resp.text();
    return "【AI自动生成剧情演示段落：主角在家与姐妹共度温馨时光......（请接入OpenAI实际API）】";
  }
  return "【未实现的API服务商或测试模式】";
}