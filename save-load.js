/**
 * save-load.js - 游戏存档读档与管理模块
 * 负责整个游戏状态的序列化(保存)、反序列化(读取)、多存档、删除、导出、导入及持久化。
 * 记录所有关键面板数据，保证读档后可恢复完整进度，同时适配未来功能扩展。
 * 
 * 用法：
 *   await saveLoadManager.saveGame(gameState, '自定义存档名', slotIndex)
 *   let loadResult = await saveLoadManager.loadGame(slotIndex)
 *   saveLoadManager.getSaveList()
 *   saveLoadManager.deleteSave(slotIndex)
 *   saveLoadManager.getCurrentGameState()
 *   saveLoadManager.clearCurrentGameState()
 *   await saveLoadManager.importSave(jsonString)
 *   saveLoadManager.exportSave(slotIndex)
 * 
 * 存档结构示例:
 * {
 *   id: "1677345678123",      // 唯一存档id
 *   name: "年度存档1",        // 存档名
 *   timestamp: 1677345678123, // 创建/更新时间
 *   gameState: { ... },       // 完整游戏状态/面板状态
 *   version: '2.0.0',         // 游戏版本
 *   lastLoaded: 1677345680011,// 最后读取时间
 * }
 * 
 * author: 西一(优化重构)
 * version: 2.0.0
 */

class SaveLoadManager {
    constructor() {
        /** 最大存档槽位数 */
        this.maxSaveSlots = 10;
        /** 自动保存定时器(可选) */
        this.autoSaveInterval = null;
    }

    /**
     * 保存完整游戏进度到本地
     * @param {Object} gameState - 当前游戏状态（全量）建议完整object
     * @param {string} slotName  - 存档名称，可留空
     * @param {number|null} slotIndex - 若指定为已有槽，则覆盖，否则创建新
     * @returns {Promise<Object>} {success,msg,saveData}
     */
    async saveGame(gameState, slotName, slotIndex=null) {
        try {
            // 全量深拷贝，避免后续对象被更改
            const saveData = {
                id: Date.now().toString(),
                name: slotName||`存档 - ${new Date().toLocaleString('zh-CN')}`,
                timestamp: Date.now(),
                gameState: JSON.parse(JSON.stringify(gameState)),
                version: '2.0.0'
            };
            let saveList = this.getSaveList();
            if(slotIndex!==null && slotIndex>=0 && slotIndex<saveList.length) {
                saveData.id = saveList[slotIndex].id||saveData.id;
                saveList[slotIndex] = saveData;
            } else {
                saveList.unshift(saveData);
                if(saveList.length>this.maxSaveSlots)
                    saveList = saveList.slice(0,this.maxSaveSlots);
            }
            localStorage.setItem('gameSaveList',JSON.stringify(saveList));
            // 可保存当前游玩状态，便于快速恢复
            localStorage.setItem('currentGameState',JSON.stringify(gameState));
            return {success:true, message: '游戏保存成功', saveData};
        } catch(e) {
            console.error("保存游戏失败:",e);
            return {success:false, message: "游戏保存失败：" + e.message};
        }
    }

    /**
     * 读取某存档（并恢复当前状态），自动反序列化
     * @param {number} slotIndex 存档槽
     * @returns {Promise<Object>} {success,message,gameState}
     */
    async loadGame(slotIndex) {
        try {
            let saveList = this.getSaveList();
            if(slotIndex<0 || slotIndex>=saveList.length)
                throw new Error("存档不存在");
            let saveData = saveList[slotIndex];
            if(!saveData || !saveData.gameState) throw new Error("存档数据损坏");
            saveData.lastLoaded = Date.now();
            saveList[slotIndex]=saveData;
            localStorage.setItem('gameSaveList',JSON.stringify(saveList));
            // 恢复为当前进度
            localStorage.setItem('currentGameState',JSON.stringify(saveData.gameState));
            return {success:true, message:"游戏读取成功", gameState:saveData.gameState};
        }catch(e){
            console.error(e);
            return {success:false,message:"游戏读取失败:"+e.message};
        }
    }

    /**
     * 删除某存档
     * @param {number} slotIndex 
     * @returns {Promise<Object>} {success,message}
     */
    async deleteSave(slotIndex) {
        try {
            let saveList = this.getSaveList();
            if(slotIndex<0 || slotIndex>=saveList.length)
                throw new Error("存档不存在");
            saveList.splice(slotIndex,1);
            localStorage.setItem('gameSaveList',JSON.stringify(saveList));
            return {success:true, message:"存档删除成功"};
        } catch(e) {
            console.error(e);
            return {success:false, message:"存档删除失败:"+e.message}
        }
    }

    /**
     * 获取现有全部存档列表(从新到旧)
     * @returns {Array<Object>}
     */
    getSaveList() {
        try {
            const s = localStorage.getItem('gameSaveList');
            return s ? JSON.parse(s) : [];
        } catch(e) { return []; }
    }

    /**
     * 读取当前进度(通常为最后一次saveGame)
     * @returns {Object|null}
     */
    getCurrentGameState() {
        try {
            let cs = localStorage.getItem('currentGameState');
            return cs ? JSON.parse(cs) : null;
        }catch(e) { return null; }
    }

    /**
     * 清除当前状态，不影响历史存档
     */
    clearCurrentGameState() {
        localStorage.removeItem('currentGameState');
    }

    /**
     * 导出存档json
     * @param {number} slotIndex 存档索引
     * @returns {string} json字符串
     */
    exportSave(slotIndex) {
        let list = this.getSaveList();
        if(slotIndex<0||slotIndex>=list.length)
            throw new Error('存档不存在');
        return JSON.stringify(list[slotIndex],null,2);
    }

    /**
     * 导入存档json
     * @param {string} saveDataString
     * @returns {Promise<Object>} {success,message,saveData}
     */
    async importSave(saveDataString) {
        try {
            let saveData = JSON.parse(saveDataString);
            // 合规性校验
            if(!saveData.id || !saveData.gameState || !saveData.timestamp)
                throw new Error("存档格式非法");
            saveData.id = Date.now().toString();
            saveData.importedAt = Date.now();
            let saveList = this.getSaveList();
            saveList.unshift(saveData);
            if(saveList.length>this.maxSaveSlots)
                saveList = saveList.slice(0, this.maxSaveSlots);
            localStorage.setItem('gameSaveList',JSON.stringify(saveList));
            return {success:true,message:"导入成功",saveData};
        }catch(e){
            console.error(e);
            return {success:false,message:"导入失败:"+e.message}
        }
    }

    /**
     * 启动自动保存(周期定时备份当前进度)
     * @param {Function} getGameState 外部getter
     * @param {number} interval 毫秒
     */
    startAutoSave(getGameState,interval=3e5){
        this.stopAutoSave();
        this.autoSaveInterval = setInterval(async ()=>{
            const gs = getGameState();
            if(gs) await this.saveGame(gs,"自动保存",0);
        },interval);
    }

    stopAutoSave() {
        if(this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * 格式化存档信息(面向UI显示)
     * @param {Object} saveData 
     * @returns {Object}
     */
    formatSaveInfo(saveData) {
        const gameState = saveData.gameState||{};
        const date = new Date(saveData.timestamp);
        return {
            id: saveData.id,
            name: saveData.name,
            date: date.toLocaleString('zh-CN'),
            character: gameState.character?`${gameState.character.name||''} (${gameState.character.age||""}岁)`:'未知',
            family: (gameState.family?.surname?gameState.family.surname+'家':gameState.familyName+'家') || "－",
            time: gameState.gameTime ? `${gameState.gameTime.dynasty||""} ${gameState.gameTime.yearName||""} ${gameState.gameTime.year||""}` : "未知时间",
            playTime: this.calculatePlayTime(gameState),
            lastLoaded: saveData.lastLoaded ? new Date(saveData.lastLoaded).toLocaleString('zh-CN'):'从未读取'
        };
    }

    /**
     * 计算游戏时长
     * @param {Object} gameState 
     * @returns {string}
     */
    calculatePlayTime(gameState) {
        if(!gameState.startTime || !gameState.savedAt)
            return "未知";
        const st = new Date(gameState.startTime).getTime();
        const ed = new Date(gameState.savedAt).getTime();
        const d = ed-st;
        const h = Math.floor(d/3.6e6), m = Math.floor((d%3.6e6)/6e4);
        return `${h}小时${m}分钟`;
    } 
}

// 单例外暴
const saveLoadManager = new SaveLoadManager();
window.saveLoadManager = saveLoadManager;