/**
 * save-load.js - 游戏存档读档模块
 * 负责游戏进度的保存、读取和管理
 */

class SaveLoadManager {
    constructor() {
        this.maxSaveSlots = 10; // 最大存档槽位
        this.autoSaveInterval = null; // 自动保存定时器
    }

    /**
     * 保存游戏进度
     * @param {Object} gameState 当前游戏状态
     * @param {string} slotName 存档名称
     * @param {number} slotIndex 存档槽位索引（可选）
     * @returns {Promise<Object>} 保存结果
     */
    async saveGame(gameState, slotName, slotIndex = null) {
        try {
            // 创建存档数据
            const saveData = {
                id: Date.now().toString(),
                name: slotName || `存档 - ${new Date().toLocaleString('zh-CN')}`,
                timestamp: Date.now(),
                gameState: {
                    ...gameState,
                    savedAt: new Date().toISOString()
                },
                version: '1.0.0'
            };

            // 获取现有存档列表
            let saveList = this.getSaveList();

            if (slotIndex !== null && slotIndex >= 0 && slotIndex < saveList.length) {
                // 覆盖指定槽位
                saveList[slotIndex] = saveData;
            } else {
                // 添加新存档
                saveList.unshift(saveData);
                
                // 限制存档数量
                if (saveList.length > this.maxSaveSlots) {
                    saveList = saveList.slice(0, this.maxSaveSlots);
                }
            }

            // 保存到localStorage
            localStorage.setItem('gameSaveList', JSON.stringify(saveList));

            // 保存当前游戏状态（用于快速恢复）
            localStorage.setItem('currentGameState', JSON.stringify(gameState));

            return {
                success: true,
                message: '游戏保存成功',
                saveData: saveData
            };
        } catch (error) {
            console.error('保存游戏失败:', error);
            return {
                success: false,
                message: '游戏保存失败: ' + error.message
            };
        }
    }

    /**
     * 读取游戏进度
     * @param {number} slotIndex 存档槽位索引
     * @returns {Promise<Object>} 读取结果
     */
    async loadGame(slotIndex) {
        try {
            const saveList = this.getSaveList();
            
            if (slotIndex < 0 || slotIndex >= saveList.length) {
                throw new Error('存档不存在');
            }

            const saveData = saveList[slotIndex];
            
            if (!saveData || !saveData.gameState) {
                throw new Error('存档数据损坏');
            }

            // 更新最后读取时间
            saveData.lastLoaded = Date.now();
            saveList[slotIndex] = saveData;
            localStorage.setItem('gameSaveList', JSON.stringify(saveList));

            // 更新当前游戏状态
            localStorage.setItem('currentGameState', JSON.stringify(saveData.gameState));

            return {
                success: true,
                message: '游戏读取成功',
                gameState: saveData.gameState
            };
        } catch (error) {
            console.error('读取游戏失败:', error);
            return {
                success: false,
                message: '游戏读取失败: ' + error.message
            };
        }
    }

    /**
     * 删除存档
     * @param {number} slotIndex 存档槽位索引
     * @returns {Promise<Object>} 删除结果
     */
    async deleteSave(slotIndex) {
        try {
            let saveList = this.getSaveList();
            
            if (slotIndex < 0 || slotIndex >= saveList.length) {
                throw new Error('存档不存在');
            }

            // 删除指定存档
            saveList.splice(slotIndex, 1);
            
            // 保存更新后的列表
            localStorage.setItem('gameSaveList', JSON.stringify(saveList));

            return {
                success: true,
                message: '存档删除成功'
            };
        } catch (error) {
            console.error('删除存档失败:', error);
            return {
                success: false,
                message: '存档删除失败: ' + error.message
            };
        }
    }

    /**
     * 获取存档列表
     * @returns {Array} 存档列表
     */
    getSaveList() {
        try {
            const saved = localStorage.getItem('gameSaveList');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('获取存档列表失败:', error);
            return [];
        }
    }

    /**
     * 获取当前游戏状态
     * @returns {Object|null} 当前游戏状态
     */
    getCurrentGameState() {
        try {
            const saved = localStorage.getItem('currentGameState');
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error('获取当前游戏状态失败:', error);
            return null;
        }
    }

    /**
     * 清除当前游戏状态
     */
    clearCurrentGameState() {
        localStorage.removeItem('currentGameState');
    }

    /**
     * 导出存档
     * @param {number} slotIndex 存档槽位索引
     * @returns {string} 导出的存档数据（JSON字符串）
     */
    exportSave(slotIndex) {
        const saveList = this.getSaveList();
        
        if (slotIndex < 0 || slotIndex >= saveList.length) {
            throw new Error('存档不存在');
        }

        const saveData = saveList[slotIndex];
        return JSON.stringify(saveData, null, 2);
    }

    /**
     * 导入存档
     * @param {string} saveDataString 导入的存档数据（JSON字符串）
     * @returns {Promise<Object>} 导入结果
     */
    async importSave(saveDataString) {
        try {
            const saveData = JSON.parse(saveDataString);
            
            // 验证存档数据格式
            if (!saveData.id || !saveData.gameState || !saveData.timestamp) {
                throw new Error('无效的存档数据格式');
            }

            // 生成新的ID避免冲突
            saveData.id = Date.now().toString();
            saveData.importedAt = Date.now();

            // 获取现有存档列表
            let saveList = this.getSaveList();
            
            // 添加导入的存档
            saveList.unshift(saveData);
            
            // 限制存档数量
            if (saveList.length > this.maxSaveSlots) {
                saveList = saveList.slice(0, this.maxSaveSlots);
            }

            // 保存到localStorage
            localStorage.setItem('gameSaveList', JSON.stringify(saveList));

            return {
                success: true,
                message: '存档导入成功',
                saveData: saveData
            };
        } catch (error) {
            console.error('导入存档失败:', error);
            return {
                success: false,
                message: '存档导入失败: ' + error.message
            };
        }
    }

    /**
     * 开始自动保存
     * @param {Function} getGameState 获取游戏状态的函数
     * @param {number} interval 自动保存间隔（毫秒）
     */
    startAutoSave(getGameState, interval = 300000) { // 默认5分钟
        this.stopAutoSave();
        
        this.autoSaveInterval = setInterval(async () => {
            try {
                const gameState = getGameState();
                if (gameState) {
                    await this.saveGame(gameState, '自动保存', 0); // 自动保存到第一个槽位
                    console.log('自动保存完成:', new Date().toLocaleString('zh-CN'));
                }
            } catch (error) {
                console.error('自动保存失败:', error);
            }
        }, interval);
    }

    /**
     * 停止自动保存
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * 格式化存档信息用于显示
     * @param {Object} saveData 存档数据
     * @returns {Object} 格式化后的信息
     */
    formatSaveInfo(saveData) {
        const gameState = saveData.gameState;
        const date = new Date(saveData.timestamp);
        
        return {
            id: saveData.id,
            name: saveData.name,
            date: date.toLocaleString('zh-CN'),
            character: gameState.character ? `${gameState.character.name} (${gameState.character.age}岁)` : '未知角色',
            family: gameState.family ? gameState.family.surname + '家' : '未知家族',
            time: gameState.gameTime ? `${gameState.gameTime.dynasty} ${gameState.gameTime.yearName} ${gameState.gameTime.year}年 ${gameState.gameTime.season}` : '未知时间',
            playTime: this.calculatePlayTime(gameState),
            lastLoaded: saveData.lastLoaded ? new Date(saveData.lastLoaded).toLocaleString('zh-CN') : '从未读取'
        };
    }

    /**
     * 计算游戏时长
     * @param {Object} gameState 游戏状态
     * @returns {string} 格式化的游戏时长
     */
    calculatePlayTime(gameState) {
        if (!gameState.startTime || !gameState.savedAt) {
            return '未知';
        }

        const startTime = new Date(gameState.startTime).getTime();
        const savedAt = new Date(gameState.savedAt).getTime();
        const playTimeMs = savedAt - startTime;
        
        const hours = Math.floor(playTimeMs / (1000 * 60 * 60));
        const minutes = Math.floor((playTimeMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}小时${minutes}分钟`;
    }
}

// 导出单例
const saveLoadManager = new SaveLoadManager();
window.saveLoadManager = saveLoadManager;