// 存档读档模块

// 存档槽数量
const SAVE_SLOTS = 3;

// 存档数据结构
const SAVE_DATA_STRUCTURE = {
    version: '1.0.0',
    timestamp: Date.now(),
    gameData: null,
    screenshot: null
};

// 初始化存档系统
function initSaveLoadSystem() {
    // 检查本地存储是否可用
    if (!isLocalStorageSupported()) {
        console.error('浏览器不支持本地存储，存档功能不可用');
        return false;
    }
    
    return true;
}

// 保存游戏
function saveGame(slotIndex, gameData, screenshot = null) {
    if (!initSaveLoadSystem()) {
        return { success: false, message: '浏览器不支持本地存储' };
    }
    
    // 验证存档槽索引
    if (slotIndex < 0 || slotIndex >= SAVE_SLOTS) {
        return { success: false, message: '无效的存档槽' };
    }
    
    // 验证游戏数据
    if (!gameData || !gameData.family || !gameData.protagonist) {
        return { success: false, message: '游戏数据不完整' };
    }
    
    try {
        // 创建存档数据
        const saveData = {
            ...SAVE_DATA_STRUCTURE,
            timestamp: Date.now(),
            gameData: deepClone(gameData),
            screenshot: screenshot
        };
        
        // 保存到本地存储
        const saveKey = `game_save_${slotIndex}`;
        localStorage.setItem(saveKey, JSON.stringify(saveData));
        
        // 更新存档列表
        updateSaveList();
        
        return { 
            success: true, 
            message: '游戏保存成功',
            slotIndex: slotIndex,
            timestamp: saveData.timestamp
        };
    } catch (error) {
        console.error('保存游戏失败:', error);
        return { success: false, message: '保存游戏失败: ' + error.message };
    }
}

// 加载游戏
function loadGame(slotIndex) {
    if (!initSaveLoadSystem()) {
        return { success: false, message: '浏览器不支持本地存储' };
    }
    
    // 验证存档槽索引
    if (slotIndex < 0 || slotIndex >= SAVE_SLOTS) {
        return { success: false, message: '无效的存档槽' };
    }
    
    try {
        // 从本地存储读取
        const saveKey = `game_save_${slotIndex}`;
        const saveDataString = localStorage.getItem(saveKey);
        
        if (!saveDataString) {
            return { success: false, message: '该存档槽为空' };
        }
        
        const saveData = JSON.parse(saveDataString);
        
        // 验证存档数据结构
        if (!validateSaveData(saveData)) {
            return { success: false, message: '存档数据损坏' };
        }
        
        return { 
            success: true, 
            message: '游戏加载成功',
            gameData: saveData.gameData,
            timestamp: saveData.timestamp
        };
    } catch (error) {
        console.error('加载游戏失败:', error);
        return { success: false, message: '加载游戏失败: ' + error.message };
    }
}

// 删除存档
function deleteSave(slotIndex) {
    if (!initSaveLoadSystem()) {
        return { success: false, message: '浏览器不支持本地存储' };
    }
    
    // 验证存档槽索引
    if (slotIndex < 0 || slotIndex >= SAVE_SLOTS) {
        return { success: false, message: '无效的存档槽' };
    }
    
    try {
        // 从本地存储删除
        const saveKey = `game_save_${slotIndex}`;
        localStorage.removeItem(saveKey);
        
        // 更新存档列表
        updateSaveList();
        
        return { success: true, message: '存档删除成功' };
    } catch (error) {
        console.error('删除存档失败:', error);
        return { success: false, message: '删除存档失败: ' + error.message };
    }
}

// 获取存档列表
function getSaveList() {
    if (!initSaveLoadSystem()) {
        return [];
    }
    
    const saveList = [];
    
    for (let i = 0; i < SAVE_SLOTS; i++) {
        try {
            const saveKey = `game_save_${i}`;
            const saveDataString = localStorage.getItem(saveKey);
            
            if (saveDataString) {
                const saveData = JSON.parse(saveDataString);
                
                if (validateSaveData(saveData)) {
                    saveList.push({
                        slotIndex: i,
                        timestamp: saveData.timestamp,
                        gameData: saveData.gameData,
                        screenshot: saveData.screenshot
                    });
                }
            } else {
                saveList.push({
                    slotIndex: i,
                    timestamp: null,
                    gameData: null,
                    screenshot: null
                });
            }
        } catch (error) {
            console.error(`读取存档槽 ${i} 失败:`, error);
            saveList.push({
                slotIndex: i,
                timestamp: null,
                gameData: null,
                screenshot: null
            });
        }
    }
    
    return saveList;
}

// 更新存档列表显示
function updateSaveList() {
    const saveList = getSaveList();
    
    // 保存到本地存储，供其他页面使用
    localStorage.setItem('save_list', JSON.stringify(saveList));
    
    return saveList;
}

// 验证存档数据
function validateSaveData(saveData) {
    // 检查必要字段
    if (!saveData.version || !saveData.timestamp || !saveData.gameData) {
        return false;
    }
    
    // 检查游戏数据结构
    const gameData = saveData.gameData;
    if (!gameData.family || !gameData.protagonist || !gameData.time) {
        return false;
    }
    
    // 检查版本兼容性
    const currentVersion = SAVE_DATA_STRUCTURE.version;
    if (saveData.version !== currentVersion) {
        console.warn('存档版本不匹配，可能导致兼容性问题');
        // 这里可以添加版本迁移逻辑
    }
    
    return true;
}

// 自动保存
function autoSave(gameData) {
    // 使用最后一个存档槽作为自动存档
    const autoSaveSlot = SAVE_SLOTS - 1;
    return saveGame(autoSaveSlot, gameData);
}

// 导出存档
function exportSave(slotIndex) {
    if (!initSaveLoadSystem()) {
        return { success: false, message: '浏览器不支持本地存储' };
    }
    
    try {
        const saveKey = `game_save_${slotIndex}`;
        const saveDataString = localStorage.getItem(saveKey);
        
        if (!saveDataString) {
            return { success: false, message: '该存档槽为空' };
        }
        
        // 创建下载链接
        const blob = new Blob([saveDataString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ancient_life_save_${slotIndex}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return { success: true, message: '存档导出成功' };
    } catch (error) {
        console.error('导出存档失败:', error);
        return { success: false, message: '导出存档失败: ' + error.message };
    }
}

// 导入存档
function importSave(file, slotIndex) {
    return new Promise((resolve) => {
        if (!initSaveLoadSystem()) {
            resolve({ success: false, message: '浏览器不支持本地存储' });
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const saveData = JSON.parse(e.target.result);
                
                // 验证存档数据
                if (!validateSaveData(saveData)) {
                    resolve({ success: false, message: '存档文件格式不正确' });
                    return;
                }
                
                // 保存到指定存档槽
                const saveKey = `game_save_${slotIndex}`;
                localStorage.setItem(saveKey, JSON.stringify(saveData));
                
                // 更新存档列表
                updateSaveList();
                
                resolve({ success: true, message: '存档导入成功' });
            } catch (error) {
                console.error('导入存档失败:', error);
                resolve({ success: false, message: '导入存档失败: ' + error.message });
            }
        };
        
        reader.onerror = function() {
            resolve({ success: false, message: '读取文件失败' });
        };
        
        reader.readAsText(file);
    });
}

// 清除所有存档
function clearAllSaves() {
    if (!initSaveLoadSystem()) {
        return { success: false, message: '浏览器不支持本地存储' };
    }
    
    try {
        for (let i = 0; i < SAVE_SLOTS; i++) {
            const saveKey = `game_save_${i}`;
            localStorage.removeItem(saveKey);
        }
        
        // 清除存档列表
        localStorage.removeItem('save_list');
        
        return { success: true, message: '所有存档已清除' };
    } catch (error) {
        console.error('清除存档失败:', error);
        return { success: false, message: '清除存档失败: ' + error.message };
    }
}

// 获取存档统计信息
function getSaveStats() {
    if (!initSaveLoadSystem()) {
        return null;
    }
    
    const saveList = getSaveList();
    const usedSlots = saveList.filter(save => save.timestamp !== null).length;
    const totalSlots = SAVE_SLOTS;
    
    // 计算总游戏时间（基于存档时间戳）
    let totalPlayTime = 0;
    let earliestSaveTime = null;
    let latestSaveTime = null;
    
    saveList.forEach(save => {
        if (save.timestamp) {
            if (!earliestSaveTime || save.timestamp < earliestSaveTime) {
                earliestSaveTime = save.timestamp;
            }
            if (!latestSaveTime || save.timestamp > latestSaveTime) {
                latestSaveTime = save.timestamp;
            }
        }
    });
    
    if (earliestSaveTime && latestSaveTime) {
        totalPlayTime = latestSaveTime - earliestSaveTime;
    }
    
    return {
        usedSlots,
        totalSlots,
        totalPlayTime,
        earliestSaveTime,
        latestSaveTime
    };
}

// 格式化游戏时间
function formatGameTime(timestamp) {
    if (!timestamp) return '未知';
    
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 格式化游戏时长
function formatPlayTime(milliseconds) {
    if (!milliseconds || milliseconds < 0) return '未知';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days}天 ${hours % 24}小时`;
    } else if (hours > 0) {
        return `${hours}小时 ${minutes % 60}分钟`;
    } else if (minutes > 0) {
        return `${minutes}分钟 ${seconds % 60}秒`;
    } else {
        return `${seconds}秒`;
    }
}

// 创建游戏截图
function createScreenshot() {
    // 这里可以使用html2canvas等库来实现截图功能
    // 由于我们没有实际的游戏界面，这里返回null
    return null;
}

// 导出函数
window.saveLoad = {
    init: initSaveLoadSystem,
    saveGame: saveGame,
    loadGame: loadGame,
    deleteSave: deleteSave,
    getSaveList: getSaveList,
    updateSaveList: updateSaveList,
    autoSave: autoSave,
    exportSave: exportSave,
    importSave: importSave,
    clearAllSaves: clearAllSaves,
    getSaveStats: getSaveStats,
    formatGameTime: formatGameTime,
    formatPlayTime: formatPlayTime,
    createScreenshot: createScreenshot
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initSaveLoadSystem();
});