/**
 * script.js - 游戏核心逻辑模块
 * 负责游戏的主要交互逻辑、面板点击响应、AI生成内容的渲染与展示
 */

class AncientLifeSimulator {
    constructor() {
        this.gameState = null; // 当前游戏状态
        this.currentView = 'home'; // 当前视图
        this.loading = false; // 加载状态
        this.selectedSaveIndex = -1; // 当前选中的存档索引

        // 初始化游戏
        this.init();
    }

    /**
     * 初始化游戏
     */
    async init() {
        // 绑定事件监听器
        this.bindEvents();
        
        // 检查是否有未完成的游戏
        const currentState = saveLoadManager.getCurrentGameState();
        if (currentState) {
            this.gameState = currentState;
        }

        // 根据当前页面初始化
        this.initCurrentPage();
    }

    /**
     * 绑定全局事件监听器
     */
    bindEvents() {
        // 移动端菜单切换
        document.addEventListener('click', (e) => {
            if (e.target.closest('#mobile-menu-button')) {
                this.toggleMobileMenu();
            } else if (!e.target.closest('#mobile-menu') && !e.target.closest('#mobile-menu-button')) {
                this.hideMobileMenu();
            }
        });

        // 游戏菜单
        document.addEventListener('click', (e) => {
            if (e.target.closest('#menu-button')) {
                this.toggleGameMenu();
            } else if (!e.target.closest('#game-menu') && !e.target.closest('#menu-button')) {
                this.hideGameMenu();
            }
        });

        // 页面导航
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.getAttribute('href') === '#') {
                e.preventDefault();
            }
        });
    }

    /**
     * 根据当前页面初始化
     */
    initCurrentPage() {
        const path = window.location.pathname;
        
        if (path.endsWith('index.html') || path === '/') {
            this.initHomePage();
        } else if (path.endsWith('create-role.html')) {
            this.initCreateRolePage();
        } else if (path.endsWith('game.html')) {
            this.initGamePage();
        } else if (path.endsWith('api-config.html')) {
            this.initAPIConfigPage();
        } else if (path.endsWith('instructions.html')) {
            this.initInstructionsPage();
        }
    }

    /**
     * 初始化首页
     */
    initHomePage() {
        // 轮播图功能
        this.initCarousel();
        
        // 开始游戏按钮
        document.getElementById('start-game')?.addEventListener('click', () => {
            window.location.href = 'create-role.html';
        });
        
        // 读取存档按钮
        document.getElementById('load-game')?.addEventListener('click', () => {
            this.showLoadGameModal();
        });
        
        // 关闭模态框
        document.getElementById('close-load-modal')?.addEventListener('click', () => {
            this.hideLoadGameModal();
        });
        
        document.getElementById('cancel-load')?.addEventListener('click', () => {
            this.hideLoadGameModal();
        });
        
        // 确认读取
        document.getElementById('confirm-load')?.addEventListener('click', () => {
            this.confirmLoadGame();
        });

        // 加载存档列表
        this.loadSaveList();
    }

    /**
     * 初始化角色创建页面
     */
    initCreateRolePage() {
        // 随机生成家族
        document.getElementById('random-family')?.addEventListener('click', async () => {
            await this.generateRandomFamily();
        });
        
        // 随机生成角色
        document.getElementById('random-character')?.addEventListener('click', async () => {
            await this.generateRandomCharacter();
        });
        
        // 选择姐妹
        document.querySelectorAll('.sister-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.selectSister(index);
            });
        });
        
        // 开始游戏
        document.getElementById('start-game-btn')?.addEventListener('click', () => {
            this.startGame();
        });
        
        // 返回首页
        document.getElementById('back-to-home')?.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // 初始生成家族和角色
        this.generateRandomFamily();
    }

    /**
     * 初始化游戏主页面
     */
    initGamePage() {
        // 选项卡切换
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // 季节切换
        document.querySelectorAll('.season-icon').forEach((icon, index) => {
            icon.addEventListener('click', () => {
                this.switchSeason(index);
            });
        });
        
        // 游戏菜单
        document.getElementById('save-game')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSaveGameModal();
        });
        
        document.getElementById('load-game')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoadGameModal();
        });
        
        document.getElementById('settings')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSettingsModal();
        });

        // 事件卡片点击
        document.querySelectorAll('.event-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    this.expandEventCard(card);
                }
            });
        });

        // 事件选择按钮
        document.querySelectorAll('.event-card button').forEach(button => {
            button.addEventListener('click', async (e) => {
                await this.handleEventChoice(e.target);
            });
        });

        // 地图区域点击
        document.querySelectorAll('.map-area').forEach(area => {
            area.addEventListener('click', async () => {
                await this.exploreMapArea(area.dataset.area);
            });
        });

        // 绑定面板点击事件
        this.bindPanelEvents();

        // 开始自动保存
        saveLoadManager.startAutoSave(() => this.gameState);

        // 如果没有游戏状态，创建默认状态
        if (!this.gameState) {
            this.createDefaultGameState();
        }

        // 更新UI显示
        this.updateGameUI();
        
        // 生成年度事件
        this.generateYearlyEvents();
    }

    /**
     * 初始化API配置页面
     */
    initAPIConfigPage() {
        // 加载现有配置
        this.loadAPIConfig();
        
        // 保存配置
        document.getElementById('save-config')?.addEventListener('click', () => {
            this.saveAPIConfig();
        });
        
        // 测试连接
        document.getElementById('test-connection')?.addEventListener('click', async () => {
            await this.testAPIConnection();
        });
        
        // 重置配置
        document.getElementById('reset-config')?.addEventListener('click', () => {
            this.resetAPIConfig();
        });
    }

    /**
     * 初始化游戏说明页面
     */
    initInstructionsPage() {
        // 这里可以添加说明页面的特定逻辑
    }

    /**
     * 初始化轮播图
     */
    initCarousel() {
        let currentSlide = 0;
        const slides = document.querySelectorAll('.carousel-item');
        const indicators = document.querySelectorAll('.carousel-indicator');
        const totalSlides = slides.length;
        
        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove('active'));
            indicators.forEach(indicator => indicator.classList.remove('active'));
            slides[index].classList.add('active');
            indicators[index].classList.add('active');
            currentSlide = index;
        }
        
        function nextSlide() {
            showSlide((currentSlide + 1) % totalSlides);
        }
        
        // 设置自动轮播
        let slideInterval = setInterval(nextSlide, 5000);
        
        // 控制按钮
        document.getElementById('next-slide')?.addEventListener('click', () => {
            clearInterval(slideInterval);
            nextSlide();
            slideInterval = setInterval(nextSlide, 5000);
        });
        
        document.getElementById('prev-slide')?.addEventListener('click', () => {
            clearInterval(slideInterval);
            showSlide((currentSlide - 1 + totalSlides) % totalSlides);
            slideInterval = setInterval(nextSlide, 5000);
        });
        
        // 指示器点击
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                clearInterval(slideInterval);
                showSlide(index);
                slideInterval = setInterval(nextSlide, 5000);
            });
        });
    }

    /**
     * 切换移动端菜单
     */
    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
        }
    }

    /**
     * 隐藏移动端菜单
     */
    hideMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }
    }

    /**
     * 切换游戏菜单
     */
    toggleGameMenu() {
        const gameMenu = document.getElementById('game-menu');
        if (gameMenu) {
            gameMenu.classList.toggle('hidden');
        }
    }

    /**
     * 隐藏游戏菜单
     */
    hideGameMenu() {
        const gameMenu = document.getElementById('game-menu');
        if (gameMenu && !gameMenu.classList.contains('hidden')) {
            gameMenu.classList.add('hidden');
        }
    }

    /**
     * 显示加载状态
     * @param {string} message 加载消息
     */
    showLoading(message = '正在生成内容...') {
        this.loading = true;
        
        // 创建加载指示器
        let loader = document.getElementById('loading-indicator');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loading-indicator';
            loader.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
            document.body.appendChild(loader);
        }
        
        loader.innerHTML = `
            <div class="bg-light rounded-xl p-6 shadow-2xl text-center">
                <div class="w-16 h-16 border-4 border-primary border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-xl font-bold text-dark">${message}</p>
                <p class="text-sm text-muted mt-2">这可能需要几秒钟时间...</p>
            </div>
        `;
        
        loader.classList.remove('hidden');
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        this.loading = false;
        const loader = document.getElementById('loading-indicator');
        if (loader) {
            loader.classList.add('hidden');
        }
    }

    /**
     * 显示消息提示
     * @param {string} message 消息内容
     * @param {string} type 消息类型 (success, error, warning, info)
     * @param {number} duration 显示时长（毫秒）
     */
    showMessage(message, type = 'info', duration = 3000) {
        const colors = {
            success: 'bg-success',
            error: 'bg-danger',
            warning: 'bg-warning',
            info: 'bg-info'
        };
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full`;
        messageEl.innerHTML = `
            <div class="flex items-center">
                <i class="fa ${icons[type]} mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(messageEl);
        
        // 显示动画
        setTimeout(() => {
            messageEl.classList.remove('translate-x-full');
            messageEl.classList.add('translate-x-0');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            messageEl.classList.remove('translate-x-0');
            messageEl.classList.add('translate-x-full');
            
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, duration);
    }

    /**
     * 加载存档列表
     */
    loadSaveList() {
        const saveList = saveLoadManager.getSaveList();
        const saveListContainer = document.querySelector('.save-slots');
        
        if (!saveListContainer) return;
        
        if (saveList.length === 0) {
            saveListContainer.innerHTML = `
                <div class="text-center py-8 text-muted">
                    <i class="fa fa-folder-open text-4xl mb-4"></i>
                    <p>暂无存档</p>
                </div>
            `;
            return;
        }
        
        saveListContainer.innerHTML = saveList.map((save, index) => {
            const info = saveLoadManager.formatSaveInfo(save);
            return `
                <div class="save-slot bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer" data-index="${index}">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-bold text-dark">${info.name}</h4>
                        <span class="text-sm text-muted">${info.date}</span>
                    </div>
                    <p class="text-sm mb-1">${info.character}</p>
                    <p class="text-sm mb-1">${info.family}</p>
                    <p class="text-sm mb-1">${info.time}</p>
                    <p class="text-xs text-muted">游戏时长: ${info.playTime}</p>
                </div>
            `;
        }).join('');
        
        // 绑定点击事件
        document.querySelectorAll('.save-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                document.querySelectorAll('.save-slot').forEach(s => {
                    s.classList.remove('ring-2', 'ring-accent');
                });
                slot.classList.add('ring-2', 'ring-accent');
                this.selectedSaveIndex = parseInt(slot.dataset.index);
            });
        });
    }

    /**
     * 显示读取存档模态框
     */
    showLoadGameModal() {
        const modal = document.getElementById('load-game-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.loadSaveList();
        }
    }

    /**
     * 隐藏读取存档模态框
     */
    hideLoadGameModal() {
        const modal = document.getElementById('load-game-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.selectedSaveIndex = -1;
    }

    /**
     * 确认读取存档
     */
    async confirmLoadGame() {
        if (this.selectedSaveIndex === -1) {
            this.showMessage('请选择一个存档', 'warning');
            return;
        }
        
        this.showLoading('正在读取存档...');
        
        try {
            const result = await saveLoadManager.loadGame(this.selectedSaveIndex);
            
            if (result.success) {
                this.gameState = result.gameState;
                this.hideLoadGameModal();
                this.showMessage('存档读取成功', 'success');
                
                // 跳转到游戏页面
                setTimeout(() => {
                    window.location.href = 'game.html';
                }, 1000);
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            this.showMessage('读取存档失败: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 显示保存游戏模态框
     */
    showSaveGameModal() {
        const modal = document.getElementById('save-game-modal');
        
        if (!modal) {
            // 创建模态框
            const modalHTML = `
                <div id="save-game-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div class="bg-light rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-2xl font-bold text-dark">保存游戏</h3>
                            <button id="close-save-modal" class="text-dark hover:text-accent text-2xl">
                                <i class="fa fa-times"></i>
                            </button>
                        </div>
                        
                        <div class="mb-4">
                            <label for="save-name" class="block text-sm font-bold mb-2">存档名称</label>
                            <input type="text" id="save-name" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" placeholder="请输入存档名称">
                        </div>
                        
                        <div class="mb-6">
                            <label class="block text-sm font-bold mb-2">存档位置</label>
                            <div class="save-slots grid grid-cols-2 gap-3">
                                <!-- 存档槽位将在这里动态生成 -->
                            </div>
                        </div>
                        
                        <div class="flex justify-end">
                            <button id="cancel-save" class="px-4 py-2 bg-gray-300 text-dark rounded-lg hover:bg-gray-400 transition-colors mr-2">
                                取消
                            </button>
                            <button id="confirm-save" class="px-4 py-2 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-colors">
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // 绑定事件
            document.getElementById('close-save-modal').addEventListener('click', () => {
                this.hideSaveGameModal();
            });
            
            document.getElementById('cancel-save').addEventListener('click', () => {
                this.hideSaveGameModal();
            });
            
            document.getElementById('confirm-save').addEventListener('click', () => {
                this.confirmSaveGame();
            });
        }
        
        // 显示模态框
        document.getElementById('save-game-modal').classList.remove('hidden');
        
        // 加载存档槽位
        this.loadSaveSlots();
    }

    /**
     * 隐藏保存游戏模态框
     */
    hideSaveGameModal() {
        const modal = document.getElementById('save-game-modal');
        if (modal) {
            modal.remove();
        }
        this.selectedSaveIndex = -1;
    }

    /**
     * 加载存档槽位
     */
    loadSaveSlots() {
        const saveList = saveLoadManager.getSaveList();
        const slotsContainer = document.querySelector('#save-game-modal .save-slots');
        
        if (!slotsContainer) return;
        
        // 生成槽位
        const slots = [];
        for (let i = 0; i < saveLoadManager.maxSaveSlots; i++) {
            const save = saveList[i];
            const isEmpty = !save;
            
            slots.push(`
                <div class="save-slot ${isEmpty ? 'bg-gray-100' : 'bg-white'} rounded-lg p-3 shadow cursor-pointer transition-all duration-300 hover:shadow-lg ${this.selectedSaveIndex === i ? 'ring-2 ring-accent' : ''}" data-index="${i}">
                    ${isEmpty ? 
                        `<div class="text-center text-muted">
                            <i class="fa fa-plus-circle text-2xl mb-1"></i>
                            <p class="text-sm">空槽位</p>
                        </div>` : 
                        `<div>
                            <h4 class="font-bold text-dark text-sm mb-1">${save.name}</h4>
                            <p class="text-xs text-muted">${new Date(save.timestamp).toLocaleDateString()}</p>
                        </div>`
                    }
                </div>
            `);
        }
        
        slotsContainer.innerHTML = slots.join('');
        
        // 绑定点击事件
        document.querySelectorAll('#save-game-modal .save-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                document.querySelectorAll('#save-game-modal .save-slot').forEach(s => {
                    s.classList.remove('ring-2', 'ring-accent');
                });
                slot.classList.add('ring-2', 'ring-accent');
                this.selectedSaveIndex = parseInt(slot.dataset.index);
            });
        });
    }

    /**
     * 确认保存游戏
     */
    async confirmSaveGame() {
        if (this.selectedSaveIndex === -1) {
            this.showMessage('请选择一个存档位置', 'warning');
            return;
        }
        
        const saveName = document.getElementById('save-name').value.trim() || `存档 - ${new Date().toLocaleString('zh-CN')}`;
        
        this.showLoading('正在保存游戏...');
        
        try {
            const result = await saveLoadManager.saveGame(this.gameState, saveName, this.selectedSaveIndex);
            
            if (result.success) {
                this.hideSaveGameModal();
                this.showMessage('游戏保存成功', 'success');
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            this.showMessage('保存游戏失败: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 显示设置模态框
     */
    showSettingsModal() {
        // 这里可以添加设置模态框的逻辑
        this.showMessage('设置功能正在开发中...', 'info');
    }

    /**
     * 生成随机家族
     */
    async generateRandomFamily() {
        this.showLoading('正在生成家族信息...');
        
        try {
            const familyData = await aiInterface.generate('family', {
                surname: this.getRandomSurname()
            });
            
            this.gameState = this.gameState || {};
            this.gameState.family = familyData;
            
            // 更新UI
            this.updateFamilyDisplay(familyData);
            this.showMessage('家族信息生成成功', 'success');
        } catch (error) {
            this.showMessage('生成家族信息失败: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 生成随机角色
     */
    async generateRandomCharacter() {
        if (!this.gameState || !this.gameState.family) {
            this.showMessage('请先生成家族信息', 'warning');
            return;
        }
        
        this.showLoading('正在生成角色信息...');
        
        try {
            const characterData = await aiInterface.generate('character', {
                characterType: '主角',
                familyName: this.gameState.family.surname
            });
            
            this.gameState.character = {
                name: characterData.name,
                age: 12,
                personality: characterData.personality,
                appearance: characterData.appearance,
                skills: {
                    poetry: Math.floor(Math.random() * 30) + 10,
                    embroidery: Math.floor(Math.random() * 30) + 10,
                    music: Math.floor(Math.random() * 30) + 10,
                    cooking: Math.floor(Math.random() * 30) + 10,
                    housekeeping: Math.floor(Math.random() * 30) + 10
                },
                attributes: {
                    beauty: Math.floor(Math.random() * 50) + 30,
                    health: Math.floor(Math.random() * 30) + 60,
                    emotion: Math.floor(Math.random() * 40) + 20
                }
            };
            
            // 更新UI
            this.updateCharacterDisplay(this.gameState.character);
            this.showMessage('角色信息生成成功', 'success');
        } catch (error) {
            this.showMessage('生成角色信息失败: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 获取随机姓氏
     */
    getRandomSurname() {
        const surnames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
        return surnames[Math.floor(Math.random() * surnames.length)];
    }

    /**
     * 更新家族信息显示
     * @param {Object} familyData 家族数据
     */
    updateFamilyDisplay(familyData) {
        const familyInfo = document.getElementById('family-info');
        if (familyInfo) {
            familyInfo.innerHTML = `
                <h3 class="text-2xl font-bold mb-4 text-center">${familyData.surname}家</h3>
                <div class="space-y-3">
                    <p><span class="font-bold">家族地位：</span>${familyData.status}</p>
                    <p><span class="font-bold">财富状况：</span>${familyData.wealth}</p>
                    <p><span class="font-bold">家族背景：</span>${familyData.background}</p>
                </div>
                
                <h4 class="text-xl font-bold mt-6 mb-3">家族成员</h4>
                <div class="space-y-2">
                    ${familyData.members.map(member => `
                        <div class="flex items-center p-2 bg-light rounded-lg">
                            <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold mr-3">
                                ${member.name.charAt(0)}
                            </div>
                            <div>
                                <p class="font-bold">${member.name}</p>
                                <p class="text-xs text-muted">${member.role} · ${member.age}岁 · ${member.personality}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    /**
     * 更新角色信息显示
     * @param {Object} characterData 角色数据
     */
    updateCharacterDisplay(characterData) {
        const characterInfo = document.getElementById('character-info');
        if (characterInfo) {
            characterInfo.innerHTML = `
                <div class="text-center mb-4">
                    <div class="w-24 h-24 rounded-full overflow-hidden mx-auto mb-2 border-4 border-primary">
                        <img src="https://p3-flow-imagex-sign.byteimg.com/tos-cn-i-a9rns2rl98/rc/pc/super_tool/25f6d868340543d188f2d150151b7263~tplv-a9rns2rl98-image.image?lk3s=8e244e95&rcl=20260203171430D707EE8A458D6B00288E&rrcfp=f06b921b&x-expires=1772702164&x-signature=I7ihkLdA5cCdRuJwTvTMoroFWhk%3D" alt="${characterData.name}" class="w-full h-full object-cover">
                    </div>
                    <h3 class="text-xl font-bold">${characterData.name}</h3>
                    <p class="text-muted">${characterData.age}岁 · ${characterData.personality}</p>
                </div>
                
                <div class="space-y-3">
                    <div>
                        <div class="flex justify-between mb-1">
                            <span class="text-sm">容貌</span>
                            <span class="text-sm font-bold">${this.getAttributeLevel(characterData.attributes.beauty)}</span>
                        </div>
                        <div class="attribute-bar">
                            <div class="attribute-fill bg-primary" style="width: ${characterData.attributes.beauty}%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between mb-1">
                            <span class="text-sm">健康</span>
                            <span class="text-sm font-bold">${this.getAttributeLevel(characterData.attributes.health)}</span>
                        </div>
                        <div class="attribute-bar">
                            <div class="attribute-fill bg-success" style="width: ${characterData.attributes.health}%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between mb-1">
                            <span class="text-sm">情感</span>
                            <span class="text-sm font-bold">${this.getAttributeLevel(characterData.attributes.emotion)}</span>
                        </div>
                        <div class="attribute-bar">
                            <div class="attribute-fill bg-love" style="width: ${characterData.attributes.emotion}%"></div>
                        </div>
                    </div>
                </div>
                
                <h4 class="text-lg font-bold mt-6 mb-3">技能</h4>
                <div class="space-y-3">
                    ${Object.entries(characterData.skills).map(([skill, level]) => `
                        <div>
                            <div class="flex justify-between mb-1">
                                <span class="text-sm">${this.getSkillName(skill)}</span>
                                <span class="text-sm font-bold">${this.getSkillLevel(level)}</span>
                            </div>
                            <div class="attribute-bar">
                                <div class="attribute-fill bg-info" style="width: ${level}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    /**
     * 选择姐妹
     * @param {number} index 姐妹索引
     */
    selectSister(index) {
        // 这里可以添加选择姐妹的逻辑
        document.querySelectorAll('.sister-card').forEach((card, i) => {
            if (i === index) {
                card.classList.add('ring-2', 'ring-accent');
            } else {
                card.classList.remove('ring-2', 'ring-accent');
            }
        });
    }

    /**
     * 开始游戏
     */
    startGame() {
        if (!this.gameState || !this.gameState.family || !this.gameState.character) {
            this.showMessage('请先生成家族和角色信息', 'warning');
            return;
        }
        
        // 初始化游戏时间
        this.gameState.gameTime = {
            dynasty: '明朝',
            yearName: '永乐',
            year: '元年',
            season: '春',
            seasonIndex: 0,
            month: 1
        };
        
        // 初始化游戏进度
        this.gameState.progress = {
            currentYear: 1,
            eventsCompleted: 0,
            totalEvents: 0
        };
        
        // 初始化关系网
        this.gameState.relationships = {};
        
        // 初始化游戏日志
        this.gameState.logs = [];
        
        // 设置开始时间
        this.gameState.startTime = new Date().toISOString();
        
        // 保存当前状态
        saveLoadManager.saveGame(this.gameState, '新游戏', 0);
        
        // 跳转到游戏页面
        window.location.href = 'game.html';
    }

    /**
     * 创建默认游戏状态
     */
    createDefaultGameState() {
        this.gameState = {
            character: {
                name: '李昭华',
                age: 12,
                personality: '温柔贤淑',
                appearance: '眉清目秀，气质出众',
                skills: {
                    poetry: 30,
                    embroidery: 25,
                    music: 20,
                    cooking: 15,
                    housekeeping: 20
                },
                attributes: {
                    beauty: 70,
                    health: 85,
                    emotion: 50
                }
            },
            family: {
                surname: '李',
                status: '官宦世家',
                wealth: '家境殷实',
                background: '世代书香门第',
                members: [
                    { name: '李正儒', role: '父亲', age: 45, personality: '严谨正直' },
                    { name: '王氏', role: '母亲', age: 40, personality: '温柔贤淑' },
                    { name: '李昭仪', role: '二姐', age: 15, personality: '活泼开朗' },
                    { name: '李昭容', role: '三姐', age: 14, personality: '安静内向' },
                    { name: '李昭媛', role: '四姐', age: 13, personality: '心灵手巧' },
                    { name: '李昭宁', role: '五妹', age: 12, personality: '天真可爱' }
                ]
            },
            gameTime: {
                dynasty: '明朝',
                yearName: '永乐',
                year: '元年',
                season: '春',
                seasonIndex: 0,
                month: 1
            },
            progress: {
                currentYear: 1,
                eventsCompleted: 0,
                totalEvents: 0
            },
            relationships: {},
            logs: [],
            startTime: new Date().toISOString()
        };
    }

    /**
     * 更新游戏UI
     */
    updateGameUI() {
        if (!this.gameState) return;
        
        // 更新时间信息
        if (document.getElementById('dynasty')) document.getElementById('dynasty').textContent = this.gameState.gameTime.dynasty;
        if (document.getElementById('year-name')) document.getElementById('year-name').textContent = this.gameState.gameTime.yearName;
        if (document.getElementById('year')) document.getElementById('year').textContent = this.gameState.gameTime.year;
        if (document.getElementById('age')) document.getElementById('age').textContent = `${this.gameState.character.age}岁`;
        
        // 更新季节图标
        const seasons = ['spring', 'summer', 'autumn', 'winter'];
        seasons.forEach((season, index) => {
            const icon = document.getElementById(season);
            if (icon) {
                if (index === this.gameState.gameTime.seasonIndex) {
                    icon.classList.add('active');
                } else {
                    icon.classList.remove('active');
                }
            }
        });
        
        // 更新角色信息
        document.getElementById('character-name')?.textContent(this.gameState.character.name);
        
        // 这里可以添加更多UI更新逻辑
    }

    /**
     * 切换选项卡
     * @param {string} tabName 选项卡名称
     */
    switchTab(tabName) {
        // 隐藏所有选项卡内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        // 显示选中的选项卡内容
        const selectedContent = document.getElementById(`${tabName}-tab`);
        if (selectedContent) {
            selectedContent.classList.remove('hidden');
        }
        
        // 更新选项卡按钮状态
        document.querySelectorAll('.tab-button').forEach(button => {
            if (button.dataset.tab === tabName) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    /**
     * 切换季节
     * @param {number} seasonIndex 季节索引
     */
    switchSeason(seasonIndex) {
        this.gameState.gameTime.seasonIndex = seasonIndex;
        
        const seasons = ['春', '夏', '秋', '冬'];
        this.gameState.gameTime.season = seasons[seasonIndex];
        
        // 更新UI
        this.updateGameUI();
    }

    /**
     * 生成季节事件
     */
    async generateSeasonEvents() {
        this.showLoading('正在生成季节事件...');
        
        try {
            const events = [];
            const eventTypes = ['日常', '社交', '学习', '情感'];
            
            for (let i = 0; i < 3; i++) {
                const event = await aiInterface.generate('event', {
                    characterName: this.gameState.character.name,
                    age: this.gameState.character.age,
                    personality: this.gameState.character.personality,
                    familyName: this.gameState.family.surname,
                    dynasty: this.gameState.gameTime.dynasty,
                    yearName: this.gameState.gameTime.yearName,
                    year: this.gameState.gameTime.year,
                    season: this.gameState.gameTime.season,
                    skills: this.gameState.character.skills,
                    eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)]
                });
                
                events.push(event);
            }
            
            this.gameState.currentEvents = events;
            this.renderEvents(events);
            
            this.showMessage(`${this.gameState.gameTime.season}季事件生成成功`, 'success');
        } catch (error) {
            this.showMessage('生成事件失败: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 渲染事件列表
     * @param {Array} events 事件列表
     */
    renderEvents(events) {
        const eventsTab = document.getElementById('events-tab');
        if (!eventsTab) return;
        
        eventsTab.innerHTML = events.map((event, index) => {
            const colors = ['info', 'warning', 'success', 'love', 'danger'];
            const color = colors[index % colors.length];
            
            return `
                <div class="event-card border-l-4 border-${color}" data-event-index="${index}">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold text-${color}">${event.title}</h3>
                        <span class="text-xs text-muted">${this.gameState.gameTime.yearName} ${this.gameState.gameTime.year}年 ${this.gameState.gameTime.season}</span>
                    </div>
                    <p class="text-sm mb-3">${event.description}</p>
                    <div class="flex justify-end space-x-2">
                        ${event.choices.map((choice, choiceIndex) => `
                            <button class="btn-secondary py-1 px-3 text-sm event-choice" data-event-index="${index}" data-choice-index="${choiceIndex}">
                                <i class="fa fa-check mr-1"></i>${choice.text}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
        
        // 绑定事件选择按钮
        document.querySelectorAll('.event-choice').forEach(button => {
            button.addEventListener('click', async (e) => {
                await this.handleEventChoice(e.target);
            });
        });
    }

    /**
     * 处理事件选择
     * @param {HTMLElement} button 选择按钮
     */
    async handleEventChoice(button) {
        const eventIndex = parseInt(button.dataset.eventIndex);
        const choiceIndex = parseInt(button.dataset.choiceIndex);
        
        const event = this.gameState.currentEvents[eventIndex];
        const choice = event.choices[choiceIndex];
        
        this.showLoading('正在处理选择...');
        
        try {
            // 应用选择效果
            if (choice.effects) {
                this.applyEffects(choice.effects);
            }
            
            // 记录日志
            this.gameState.logs.push({
                timestamp: Date.now(),
                event: event.title,
                choice: choice.text,
                consequence: choice.consequence
            });
            
            // 显示结果
            this.showEventResult(event.title, choice.consequence);
            
            // 从当前事件列表中移除
            this.gameState.currentEvents.splice(eventIndex, 1);
            
            // 更新事件显示
            this.renderEvents(this.gameState.currentEvents);
            
            // 检查是否所有事件都已处理
            if (this.gameState.currentEvents.length === 0) {
                setTimeout(() => {
                    this.advanceTime();
                }, 2000);
            }
        } catch (error) {
            this.showMessage('处理选择失败: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 应用选择效果
     * @param {Object} effects 效果对象
     */
    applyEffects(effects) {
        // 应用技能变化
        if (effects.skills) {
            Object.entries(effects.skills).forEach(([skill, change]) => {
                if (this.gameState.character.skills[skill] !== undefined) {
                    this.gameState.character.skills[skill] = Math.max(0, Math.min(100, this.gameState.character.skills[skill] + change));
                }
            });
        }
        
        // 应用属性变化
        if (effects.attributes) {
            Object.entries(effects.attributes).forEach(([attr, change]) => {
                if (this.gameState.character.attributes[attr] !== undefined) {
                    this.gameState.character.attributes[attr] = Math.max(0, Math.min(100, this.gameState.character.attributes[attr] + change));
                }
            });
        }
        
        // 应用关系变化
        if (effects.relationships) {
            Object.entries(effects.relationships).forEach(([person, change]) => {
                if (!this.gameState.relationships[person]) {
                    this.gameState.relationships[person] = 0;
                }
                this.gameState.relationships[person] = Math.max(0, Math.min(100, this.gameState.relationships[person] + change));
            });
        }
    }

    /**
     * 显示事件结果
     * @param {string} title 事件标题
     * @param {string} consequence 结果描述
     */
    showEventResult(title, consequence) {
        const resultModal = document.createElement('div');
        resultModal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        resultModal.innerHTML = `
            <div class="bg-light rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4">
                <h3 class="text-2xl font-bold mb-4 text-center text-accent">${title}</h3>
                <p class="text-lg mb-6">${consequence}</p>
                <div class="text-center">
                    <button id="close-result" class="btn-primary">
                        <i class="fa fa-check mr-2"></i>我知道了
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(resultModal);
        
        document.getElementById('close-result').addEventListener('click', () => {
            resultModal.remove();
        });
    }

    /**
     * 推进时间
     */
    advanceTime() {
        // 直接增加一岁
        this.gameState.character.age++;
        this.gameState.gameTime.year = (parseInt(this.gameState.gameTime.year) + 1).toString();
        this.gameState.gameTime.month = 1;
        
        // 重置为春季
        this.switchSeason(0);
        
        // 年度结算
        this.yearlySettlement();
        
        // 生成新的年度事件
        this.generateYearlyEvents();
        
        // 更新UI
        this.updateGameUI();
    }

    /**
     * 年度结算
     */
    yearlySettlement() {
        // 显示年度结算信息
        this.showMessage(`恭喜！你已经度过了${this.gameState.character.age - 12}年，现在${this.gameState.character.age}岁了！`, 'success');
        
        // 随机生成新人物
        this.generateNewCharacters();
        
        // 更新技能和属性
        this.updateYearlySkills();
    }

    /**
     * 展开事件卡片
     * @param {HTMLElement} card 事件卡片
     */
    expandEventCard(card) {
        card.classList.toggle('bg-light');
        card.classList.toggle('p-6');
    }

    /**
     * 探索地图区域
     * @param {string} area 区域名称
     */
    async exploreMapArea(area) {
        this.showLoading(`正在探索${area}...`);
        
        try {
            const event = await aiInterface.generate('event', {
                characterName: this.gameState.character.name,
                age: this.gameState.character.age,
                personality: this.gameState.character.personality,
                familyName: this.gameState.family.surname,
                dynasty: this.gameState.gameTime.dynasty,
                yearName: this.gameState.gameTime.yearName,
                year: this.gameState.gameTime.year,
                season: this.gameState.gameTime.season,
                skills: this.gameState.character.skills,
                eventType: '探索',
                location: area
            });
            
            // 显示探索事件
            this.showExplorationEvent(event);
        } catch (error) {
            this.showMessage('探索失败: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 显示探索事件
     * @param {Object} event 事件数据
     */
    showExplorationEvent(event) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="bg-light rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4">
                <h3 class="text-2xl font-bold mb-4 text-center text-info">${event.title}</h3>
                <p class="text-lg mb-6">${event.description}</p>
                <div class="flex justify-center space-x-3">
                    ${event.choices.map((choice, index) => `
                        <button class="btn-secondary exploration-choice" data-choice-index="${index}">
                            ${choice.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定选择按钮
        document.querySelectorAll('.exploration-choice').forEach(button => {
            button.addEventListener('click', async () => {
                const choiceIndex = parseInt(button.dataset.choiceIndex);
                const choice = event.choices[choiceIndex];
                
                // 应用效果
                if (choice.effects) {
                    this.applyEffects(choice.effects);
                }
                
                // 显示结果
                modal.innerHTML = `
                    <div class="bg-light rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4">
                        <h3 class="text-2xl font-bold mb-4 text-center text-success">探索结果</h3>
                        <p class="text-lg mb-6">${choice.consequence}</p>
                        <div class="text-center">
                            <button class="btn-primary" id="close-exploration">
                                <i class="fa fa-check mr-2"></i>确定
                            </button>
                        </div>
                    </div>
                `;
                
                document.getElementById('close-exploration').addEventListener('click', () => {
                    modal.remove();
                });
            });
        });
    }

    /**
     * 加载API配置
     */
    loadAPIConfig() {
        const config = aiInterface.loadAPIConfig();
        
        document.getElementById('provider')?.value = config.provider;
        document.getElementById('api-key')?.value = config.apiKey;
        document.getElementById('endpoint')?.value = config.endpoint;
        document.getElementById('model')?.value = config.model;
        
        // 更新UI
        this.updateProviderUI(config.provider);
    }

    /**
     * 保存API配置
     */
    saveAPIConfig() {
        const provider = document.getElementById('provider')?.value;
        const apiKey = document.getElementById('api-key')?.value;
        const endpoint = document.getElementById('endpoint')?.value;
        const model = document.getElementById('model')?.value;
        
        const config = {
            provider,
            apiKey,
            endpoint,
            model
        };
        
        aiInterface.saveAPIConfig(config);
        this.showMessage('API配置保存成功', 'success');
    }

    /**
     * 测试API连接
     */
    async testAPIConnection() {
        this.showLoading('正在测试API连接...');
        
        try {
            const success = await aiInterface.testAPIConnection();
            
            if (success) {
                this.showMessage('API连接成功！', 'success');
            } else {
                this.showMessage('API连接失败，请检查配置', 'error');
            }
        } catch (error) {
            this.showMessage('测试失败: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 重置API配置
     */
    resetAPIConfig() {
        const defaultConfig = {
            provider: 'mock',
            apiKey: '',
            endpoint: '',
            model: ''
        };
        
        aiInterface.saveAPIConfig(defaultConfig);
        this.loadAPIConfig();
        this.showMessage('API配置已重置', 'info');
    }

    /**
     * 更新提供商UI
     * @param {string} provider 提供商名称
     */
    updateProviderUI(provider) {
        const fields = document.querySelectorAll('.api-field');
        fields.forEach(field => {
            field.classList.add('hidden');
        });
        
        if (provider !== 'mock') {
            document.getElementById('api-key-field')?.classList.remove('hidden');
            document.getElementById('endpoint-field')?.classList.remove('hidden');
            document.getElementById('model-field')?.classList.remove('hidden');
        }
    }

    /**
     * 获取属性等级描述
     * @param {number} value 属性值
     * @returns {string} 等级描述
     */
    getAttributeLevel(value) {
        if (value >= 90) return '国色天香';
        if (value >= 80) return '花容月貌';
        if (value >= 70) return '容貌出众';
        if (value >= 60) return '清秀可人';
        if (value >= 50) return '眉清目秀';
        if (value >= 40) return '五官端正';
        if (value >= 30) return '平平无奇';
        return '其貌不扬';
    }

    /**
     * 获取技能等级描述
     * @param {number} level 技能等级
     * @returns {string} 等级描述
     */
    getSkillLevel(level) {
        if (level >= 90) return '大师 (90+)';
        if (level >= 80) return '精通 (80-89)';
        if (level >= 70) return '熟练 (70-79)';
        if (level >= 60) return '擅长 (60-69)';
        if (level >= 50) return '良好 (50-59)';
        if (level >= 40) return '入门 (40-49)';
        if (level >= 30) return '初学 (30-39)';
        if (level >= 20) return '略知 (20-29)';
        return '生疏 (0-19)';
    }

    /**
     * 绑定面板点击事件
     */
    bindPanelEvents() {
        // 年度事件面板
        document.getElementById('yearly-events')?.addEventListener('click', async () => {
            await this.showYearlyEventsPanel();
        });
        
        // 人物互动面板
        document.getElementById('character-interactions')?.addEventListener('click', async () => {
            await this.showCharacterInteractionsPanel();
        });
        
        // 家庭动态面板
        document.getElementById('family-dynamics')?.addEventListener('click', async () => {
            await this.showFamilyDynamicsPanel();
        });
        
        // 我的手记面板
        document.getElementById('personal-journal')?.addEventListener('click', () => {
            this.showPersonalJournalPanel();
        });
        
        // 书信箱面板
        document.getElementById('letter-box')?.addEventListener('click', async () => {
            await this.showLetterBoxPanel();
        });
        
        // 家宅地图面板
        document.getElementById('house-map')?.addEventListener('click', () => {
            this.showHouseMapPanel();
        });
        
        // 人物关系面板
        document.getElementById('relationships')?.addEventListener('click', () => {
            this.showRelationshipsPanel();
        });
        
        // 资产技能面板
        document.getElementById('assets-skills')?.addEventListener('click', () => {
            this.showAssetsSkillsPanel();
        });
        
        // 回顾事件面板
        document.getElementById('event-history')?.addEventListener('click', () => {
            this.showEventHistoryPanel();
        });
        
        // 重开新人生按钮
        document.getElementById('new-game')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showNewGameConfirm();
        });
        
        // 设置面板
        document.getElementById('settings')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSettingsPanel();
        });
        
        // 推进时间按钮
        document.getElementById('advance-time')?.addEventListener('click', () => {
            this.showAdvanceTimeConfirm();
        });
    }

    /**
     * 生成年度事件
     */
    async generateYearlyEvents() {
        this.showLoading('正在生成年度事件...');
        
        try {
            const events = [];
            const eventTypes = ['日常', '社交', '学习', '情感', '家族', '意外'];
            
            // 根据年龄生成不同类型的事件
            const age = this.gameState.character.age;
            let eventCount = 3;
            
            if (age >= 16) {
                eventCount = 4; // 年龄增长，事件增多
            }
            
            for (let i = 0; i < eventCount; i++) {
                const event = await aiInterface.generate('event', {
                    characterName: this.gameState.character.name,
                    age: age,
                    personality: this.gameState.character.personality,
                    familyName: this.gameState.family.surname,
                    dynasty: this.gameState.gameTime.dynasty,
                    yearName: this.gameState.gameTime.yearName,
                    year: this.gameState.gameTime.year,
                    season: this.gameState.gameTime.season,
                    skills: this.gameState.character.skills,
                    eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
                    ageGroup: age < 15 ? '少女' : (age < 18 ? '花季' : '成年')
                });
                
                events.push(event);
            }
            
            this.gameState.currentEvents = events;
            this.renderEvents(events);
            
            this.showMessage(`第${age - 11}年事件生成成功`, 'success');
        } catch (error) {
            this.showMessage('生成事件失败: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 生成新人物
     */
    async generateNewCharacters() {
        try {
            // 每两年生成一个新人物
            if (this.gameState.character.age % 2 === 0) {
                const character = await aiInterface.generate('character', {
                    characterType: ['朋友', '追求者', '老师', '竞争对手'][Math.floor(Math.random() * 4)],
                    familyName: this.gameState.family.surname,
                    characterAge: this.gameState.character.age + (Math.floor(Math.random() * 5) - 2), // 年龄接近主角
                    dynasty: this.gameState.gameTime.dynasty
                });
                
                // 添加到关系网
                this.gameState.relationships[character.name] = {
                    type: character.relationship,
                    intimacy: Math.floor(Math.random() * 30) + 10, // 初始亲密度
                    interactions: 0,
                    lastInteraction: Date.now()
                };
                
                // 记录新人物
                if (!this.gameState.characters) {
                    this.gameState.characters = [];
                }
                this.gameState.characters.push(character);
                
                this.showMessage(`你结识了新人物：${character.name}`, 'info');
            }
        } catch (error) {
            console.error('生成新人物失败:', error);
        }
    }

    /**
     * 更新年度技能
     */
    updateYearlySkills() {
        // 年龄增长带来的自然成长
        const skills = this.gameState.character.skills;
        const attributes = this.gameState.character.attributes;
        
        // 技能自然增长
        Object.keys(skills).forEach(skill => {
            // 基础成长
            let growth = Math.floor(Math.random() * 5) + 1;
            
            // 年龄影响
            if (this.gameState.character.age < 15) {
                growth += 2; // 青少年学习能力更强
            } else if (this.gameState.character.age > 25) {
                growth -= 1; // 年龄增长，学习能力下降
            }
            
            skills[skill] = Math.min(100, skills[skill] + growth);
        });
        
        // 属性变化
        if (this.gameState.character.age < 18) {
            // 容貌增长
            attributes.beauty = Math.min(100, attributes.beauty + Math.floor(Math.random() * 3));
        } else if (this.gameState.character.age > 25) {
            // 容貌缓慢下降
            attributes.beauty = Math.max(50, attributes.beauty - Math.floor(Math.random() * 2));
        }
        
        // 健康波动
        attributes.health = Math.max(30, Math.min(100, attributes.health + (Math.floor(Math.random() * 10) - 5)));
        
        // 情感波动
        attributes.emotion = Math.max(20, Math.min(100, attributes.emotion + (Math.floor(Math.random() * 15) - 7)));
    }

    /**
     * 显示年度事件面板
     */
    async showYearlyEventsPanel() {
        this.showLoading('正在生成年度事件...');
        
        try {
            const yearlyEvents = await aiInterface.generate('event', {
                characterName: this.gameState.character.name,
                age: this.gameState.character.age,
                personality: this.gameState.character.personality,
                familyName: this.gameState.family.surname,
                dynasty: this.gameState.gameTime.dynasty,
                yearName: this.gameState.gameTime.yearName,
                year: this.gameState.gameTime.year,
                eventType: '年度',
                isYearly: true
            });
            
            this.showPanelModal('年度事件', yearlyEvents);
        } catch (error) {
            this.showMessage('加载年度事件失败', 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 显示人物互动面板
     */
    async showCharacterInteractionsPanel() {
        this.showLoading('正在加载人物互动...');
        
        try {
            // 获取可互动人物列表
            const characters = this.getInteractableCharacters();
            
            if (characters.length === 0) {
                this.showMessage('暂无可互动的人物', 'info');
                return;
            }
            
            // 随机选择一个人物进行互动
            const character = characters[Math.floor(Math.random() * characters.length)];
            
            const interaction = await aiInterface.generate('dialogue', {
                speaker: character.name,
                speakerPersonality: character.personality,
                addressee: this.gameState.character.name,
                scene: '日常互动',
                purpose: ['问候', '邀请', '建议', '分享'][Math.floor(Math.random() * 4)]
            });
            
            this.showInteractionModal(character, interaction);
        } catch (error) {
            this.showMessage('加载人物互动失败', 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 获取可互动人物列表
     */
    getInteractableCharacters() {
        const characters = [];
        
        // 添加家族成员
        if (this.gameState.family && this.gameState.family.members) {
            this.gameState.family.members.forEach(member => {
                characters.push({
                    name: member.name,
                    personality: member.personality,
                    relationship: member.role,
                    type: 'family'
                });
            });
        }
        
        // 添加其他人物
        if (this.gameState.characters) {
            this.gameState.characters.forEach(character => {
                characters.push({
                    name: character.name,
                    personality: character.personality,
                    relationship: character.relationship,
                    type: 'other'
                });
            });
        }
        
        return characters;
    }

    /**
     * 显示家庭动态面板
     */
    async showFamilyDynamicsPanel() {
        this.showLoading('正在生成家庭动态...');
        
        try {
            const familyEvent = await aiInterface.generate('event', {
                characterName: this.gameState.character.name,
                age: this.gameState.character.age,
                familyName: this.gameState.family.surname,
                dynasty: this.gameState.gameTime.dynasty,
                eventType: '家族',
                familyMembers: this.gameState.family.members
            });
            
            this.showPanelModal('家庭动态', familyEvent);
        } catch (error) {
            this.showMessage('加载家庭动态失败', 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 显示我的手记面板
     */
    showPersonalJournalPanel() {
        if (!this.gameState.logs || this.gameState.logs.length === 0) {
            this.showMessage('暂无手记内容', 'info');
            return;
        }
        
        // 按时间倒序排列
        const sortedLogs = [...this.gameState.logs].sort((a, b) => b.timestamp - a.timestamp);
        
        let content = '<div class="space-y-4">';
        sortedLogs.slice(0, 10).forEach(log => {
            const date = new Date(log.timestamp).toLocaleDateString();
            content += `
                <div class="p-3 bg-light rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-bold">${log.event}</h4>
                        <span class="text-xs text-muted">${date}</span>
                    </div>
                    <p class="text-sm mb-1">选择：${log.choice}</p>
                    <p class="text-sm text-muted">结果：${log.consequence}</p>
                </div>
            `;
        });
        content += '</div>';
        
        this.showPanelModal('我的手记', { content });
    }

    /**
     * 显示书信箱面板
     */
    async showLetterBoxPanel() {
        this.showLoading('正在生成信件...');
        
        try {
            // 随机决定是否有新信件
            if (Math.random() > 0.3) {
                const letter = await aiInterface.generate('event', {
                    characterName: this.gameState.character.name,
                    age: this.gameState.character.age,
                    familyName: this.gameState.family.surname,
                    dynasty: this.gameState.gameTime.dynasty,
                    eventType: '书信',
                    isLetter: true
                });
                
                this.showPanelModal('书信箱', letter);
            } else {
                this.showPanelModal('书信箱', {
                    title: '暂无新信件',
                    description: '书信箱中没有新的信件。'
                });
            }
        } catch (error) {
            this.showMessage('加载书信箱失败', 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 显示家宅地图面板
     */
    showHouseMapPanel() {
        const mapContent = `
            <div class="house-map-container">
                <div class="map-areas grid grid-cols-2 gap-4">
                    <div class="map-area p-4 bg-light rounded-lg text-center cursor-pointer hover:bg-primary hover:text-white transition-colors" data-area="闺房">
                        <i class="fa fa-bed text-2xl mb-2"></i>
                        <p>闺房</p>
                    </div>
                    <div class="map-area p-4 bg-light rounded-lg text-center cursor-pointer hover:bg-primary hover:text-white transition-colors" data-area="花园">
                        <i class="fa fa-tree text-2xl mb-2"></i>
                        <p>花园</p>
                    </div>
                    <div class="map-area p-4 bg-light rounded-lg text-center cursor-pointer hover:bg-primary hover:text-white transition-colors" data-area="书房">
                        <i class="fa fa-book text-2xl mb-2"></i>
                        <p>书房</p>
                    </div>
                    <div class="map-area p-4 bg-light rounded-lg text-center cursor-pointer hover:bg-primary hover:text-white transition-colors" data-area="客厅">
                        <i class="fa fa-coffee text-2xl mb-2"></i>
                        <p>客厅</p>
                    </div>
                </div>
            </div>
        `;
        
        this.showPanelModal('家宅地图', { content: mapContent });
        
        // 绑定地图区域点击事件
        setTimeout(() => {
            document.querySelectorAll('.house-map-container .map-area').forEach(area => {
                area.addEventListener('click', async () => {
                    await this.exploreMapArea(area.dataset.area);
                    document.querySelector('.panel-modal').remove();
                });
            });
        }, 100);
    }

    /**
     * 显示人物关系面板
     */
    showRelationshipsPanel() {
        if (!this.gameState.relationships || Object.keys(this.gameState.relationships).length === 0) {
            this.showMessage('暂无人物关系', 'info');
            return;
        }
        
        let content = '<div class="space-y-4">';
        
        Object.entries(this.gameState.relationships).forEach(([name, relationship]) => {
            const intimacyLevel = this.getIntimacyLevel(relationship.intimacy);
            const intimacyColor = this.getIntimacyColor(relationship.intimacy);
            
            content += `
                <div class="p-3 bg-light rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-bold">${name}</h4>
                        <span class="text-xs px-2 py-1 rounded-full ${intimacyColor} text-white">${intimacyLevel}</span>
                    </div>
                    <p class="text-sm mb-1">关系：${relationship.type}</p>
                    <div class="flex items-center">
                        <span class="text-xs text-muted mr-2">亲密度：</span>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-primary rounded-full h-2" style="width: ${relationship.intimacy}%"></div>
                        </div>
                        <span class="text-xs text-muted ml-2">${relationship.intimacy}%</span>
                    </div>
                </div>
            `;
        });
        
        content += '</div>';
        
        this.showPanelModal('人物关系', { content });
    }

    /**
     * 获取亲密度等级
     */
    getIntimacyLevel(intimacy) {
        if (intimacy >= 90) return '生死之交';
        if (intimacy >= 80) return '莫逆之交';
        if (intimacy >= 70) return '刎颈之交';
        if (intimacy >= 60) return '金兰之交';
        if (intimacy >= 50) return '亲密无间';
        if (intimacy >= 40) return '相敬如宾';
        if (intimacy >= 30) return '君子之交';
        if (intimacy >= 20) return '泛泛之交';
        if (intimacy >= 10) return '一面之交';
        return '素不相识';
    }

    /**
     * 获取亲密度颜色
     */
    getIntimacyColor(intimacy) {
        if (intimacy >= 80) return 'bg-danger';
        if (intimacy >= 60) return 'bg-love';
        if (intimacy >= 40) return 'bg-success';
        if (intimacy >= 20) return 'bg-info';
        return 'bg-gray-400';
    }

    /**
     * 显示资产技能面板
     */
    showAssetsSkillsPanel() {
        const character = this.gameState.character;
        
        let content = `
            <div class="space-y-6">
                <div>
                    <h4 class="font-bold mb-3">个人属性</h4>
                    <div class="space-y-3">
                        ${Object.entries(character.attributes).map(([attr, value]) => `
                            <div>
                                <div class="flex justify-between mb-1">
                                    <span class="text-sm">${this.getAttributeName(attr)}</span>
                                    <span class="text-sm font-bold">${this.getAttributeLevel(value)}</span>
                                </div>
                                <div class="attribute-bar">
                                    <div class="attribute-fill ${this.getAttributeColor(attr)}" style="width: ${value}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <h4 class="font-bold mb-3">技能水平</h4>
                    <div class="space-y-3">
                        ${Object.entries(character.skills).map(([skill, level]) => `
                            <div>
                                <div class="flex justify-between mb-1">
                                    <span class="text-sm">${this.getSkillName(skill)}</span>
                                    <span class="text-sm font-bold">${this.getSkillLevel(level)}</span>
                                </div>
                                <div class="attribute-bar">
                                    <div class="attribute-fill bg-info" style="width: ${level}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        this.showPanelModal('资产技能', { content });
    }

    /**
     * 获取属性名称
     */
    getAttributeName(attr) {
        const names = {
            beauty: '容貌',
            health: '健康',
            emotion: '情感'
        };
        return names[attr] || attr;
    }

    /**
     * 获取属性颜色
     */
    getAttributeColor(attr) {
        const colors = {
            beauty: 'bg-primary',
            health: 'bg-success',
            emotion: 'bg-love'
        };
        return colors[attr] || 'bg-info';
    }

    /**
     * 显示回顾事件面板
     */
    showEventHistoryPanel() {
        if (!this.gameState.logs || this.gameState.logs.length === 0) {
            this.showMessage('暂无事件记录', 'info');
            return;
        }
        
        // 按时间倒序排列
        const sortedLogs = [...this.gameState.logs].sort((a, b) => b.timestamp - a.timestamp);
        
        let content = '<div class="space-y-4 max-h-96 overflow-y-auto">';
        sortedLogs.forEach(log => {
            const date = new Date(log.timestamp).toLocaleDateString();
            content += `
                <div class="p-3 bg-light rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-bold">${log.event}</h4>
                        <span class="text-xs text-muted">${date}</span>
                    </div>
                    <p class="text-sm mb-1">选择：${log.choice}</p>
                    <p class="text-sm text-muted">结果：${log.consequence}</p>
                </div>
            `;
        });
        content += '</div>';
        
        this.showPanelModal('回顾事件', { content });
    }

    /**
     * 显示设置面板
     */
    showSettingsPanel() {
        const content = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-bold mb-2">文本显示速度</label>
                    <select class="w-full p-2 border rounded-lg" id="text-speed">
                        <option value="slow">慢速</option>
                        <option value="normal" selected>正常</option>
                        <option value="fast">快速</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-bold mb-2">自动保存</label>
                    <div class="flex items-center">
                        <input type="checkbox" id="auto-save" class="mr-2" checked>
                        <label for="auto-save">启用自动保存</label>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-bold mb-2">音效</label>
                    <div class="flex items-center">
                        <input type="checkbox" id="sound-effects" class="mr-2" checked>
                        <label for="sound-effects">启用音效</label>
                    </div>
                </div>
                
                <div class="pt-4 border-t">
                    <button id="reset-game" class="w-full py-2 bg-danger text-white rounded-lg hover:bg-opacity-90 transition-colors">
                        重置游戏数据
                    </button>
                </div>
            </div>
        `;
        
        this.showPanelModal('设置', { content });
        
        // 绑定设置事件
        setTimeout(() => {
            document.getElementById('reset-game').addEventListener('click', () => {
                if (confirm('确定要重置所有游戏数据吗？此操作不可恢复！')) {
                    localStorage.clear();
                    this.showMessage('游戏数据已重置', 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            });
            
            // 保存设置
            ['text-speed', 'auto-save', 'sound-effects'].forEach(id => {
                document.getElementById(id).addEventListener('change', () => {
                    const settings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
                    if (id === 'text-speed') {
                        settings.textSpeed = document.getElementById(id).value;
                    } else {
                        settings[id] = document.getElementById(id).checked;
                    }
                    localStorage.setItem('gameSettings', JSON.stringify(settings));
                });
            });
            
            // 加载现有设置
            const settings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
            if (settings.textSpeed) {
                document.getElementById('text-speed').value = settings.textSpeed;
            }
            if (settings['auto-save'] !== undefined) {
                document.getElementById('auto-save').checked = settings['auto-save'];
            }
            if (settings['sound-effects'] !== undefined) {
                document.getElementById('sound-effects').checked = settings['sound-effects'];
            }
        }, 100);
    }

    /**
     * 显示重开新人生确认
     */
    showNewGameConfirm() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="bg-light rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
                <h3 class="text-2xl font-bold mb-4 text-center">重开新人生</h3>
                <p class="mb-6">确定要开始新的人生吗？当前进度将会丢失。</p>
                <div class="flex justify-center space-x-4">
                    <button id="cancel-new-game" class="px-6 py-2 bg-gray-300 text-dark rounded-lg hover:bg-gray-400 transition-colors">
                        取消
                    </button>
                    <button id="confirm-new-game" class="px-6 py-2 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-colors">
                        确定
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('cancel-new-game').addEventListener('click', () => {
            modal.remove();
        });
        
        document.getElementById('confirm-new-game').addEventListener('click', () => {
            // 清除当前游戏状态
            saveLoadManager.clearCurrentGameState();
            
            // 跳转到角色创建页面
            window.location.href = 'create-role.html';
        });
    }

    /**
     * 显示推进时间确认
     */
    showAdvanceTimeConfirm() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="bg-light rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
                <h3 class="text-2xl font-bold mb-4 text-center">推进时间</h3>
                <p class="mb-6">确定要推进到下一年吗？当前年度的事件将会结束。</p>
                <div class="flex justify-center space-x-4">
                    <button id="cancel-advance" class="px-6 py-2 bg-gray-300 text-dark rounded-lg hover:bg-gray-400 transition-colors">
                        取消
                    </button>
                    <button id="confirm-advance" class="px-6 py-2 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-colors">
                        确定
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('cancel-advance').addEventListener('click', () => {
            modal.remove();
        });
        
        document.getElementById('confirm-advance').addEventListener('click', () => {
            modal.remove();
            this.advanceTime();
        });
    }

    /**
     * 显示面板模态框
     */
    showPanelModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'panel-modal fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="bg-light rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">${title}</h3>
                    <button class="close-panel text-dark hover:text-accent text-xl">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
                
                <div class="panel-content">
                    ${content.content || `
                        <h4 class="font-bold mb-2">${content.title}</h4>
                        <p class="mb-4">${content.description}</p>
                        ${content.choices ? `
                            <div class="flex flex-wrap gap-2">
                                ${content.choices.map((choice, index) => `
                                    <button class="panel-choice px-3 py-1 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors" data-choice-index="${index}">
                                        ${choice.text}
                                    </button>
                                `).join('')}
                            </div>
                        ` : ''}
                        ` : ''}
                    `}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定关闭事件
        document.querySelector('.close-panel').addEventListener('click', () => {
            modal.remove();
        });
        
        // 绑定选择事件
        if (content.choices) {
            document.querySelectorAll('.panel-choice').forEach(button => {
                button.addEventListener('click', async () => {
                    const choiceIndex = parseInt(button.dataset.choiceIndex);
                    const choice = content.choices[choiceIndex];
                    
                    // 应用效果
                    if (choice.effects) {
                        this.applyEffects(choice.effects);
                    }
                    
                    // 显示结果
                    const resultModal = document.createElement('div');
                    resultModal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
                    resultModal.innerHTML = `
                        <div class="bg-light rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                            <h4 class="font-bold mb-2">${content.title}</h4>
                            <p class="mb-4">${choice.consequence}</p>
                            <div class="text-center">
                                <button class="close-result px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors">
                                    我知道了
                                </button>
                            </div>
                        </div>
                    `;
                    
                    document.body.appendChild(resultModal);
                    
                    document.querySelector('.close-result').addEventListener('click', () => {
                        resultModal.remove();
                        modal.remove();
                    });
                });
            });
        }
    }

    /**
     * 显示互动模态框
     */
    showInteractionModal(character, interaction) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="bg-light rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">与${character.name}的互动</h3>
                    <button class="close-interaction text-dark hover:text-accent text-xl">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
                
                <div class="mb-4 p-4 bg-primary bg-opacity-10 rounded-lg">
                    <div class="flex items-start mb-2">
                        <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold mr-2 flex-shrink-0">
                            ${character.name.charAt(0)}
                        </div>
                        <div>
                            <p class="text-sm font-bold">${character.name} (${character.relationship})</p>
                            <p class="text-sm text-muted">${character.personality}</p>
                        </div>
                    </div>
                    <p class="mt-2 italic">${interaction.dialogue}</p>
                </div>
                
                <div class="flex flex-wrap gap-2">
                    <button class="interaction-choice px-3 py-1 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors" data-choice="friendly">
                        友好回应
                    </button>
                    <button class="interaction-choice px-3 py-1 bg-info text-white rounded-lg hover:bg-opacity-90 transition-colors" data-choice="neutral">
                        礼貌回应
                    </button>
                    <button class="interaction-choice px-3 py-1 bg-warning text-white rounded-lg hover:bg-opacity-90 transition-colors" data-choice="reserved">
                        保持距离
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定关闭事件
        document.querySelector('.close-interaction').addEventListener('click', () => {
            modal.remove();
        });
        
        // 绑定选择事件
        document.querySelectorAll('.interaction-choice').forEach(button => {
            button.addEventListener('click', () => {
                const choice = button.dataset.choice;
                let intimacyChange = 0;
                
                switch (choice) {
                    case 'friendly':
                        intimacyChange = 5;
                        this.showMessage(`你友好地回应了${character.name}，关系有所增进。`, 'success');
                        break;
                    case 'neutral':
                        intimacyChange = 2;
                        this.showMessage(`你礼貌地回应了${character.name}。`, 'info');
                        break;
                    case 'reserved':
                        intimacyChange = -2;
                        this.showMessage(`你与${character.name}保持了距离。`, 'info');
                        break;
                }
                
                // 更新关系
                if (this.gameState.relationships[character.name]) {
                    this.gameState.relationships[character.name].intimacy = Math.max(0, Math.min(100, 
                        this.gameState.relationships[character.name].intimacy + intimacyChange
                    ));
                    this.gameState.relationships[character.name].interactions++;
                    this.gameState.relationships[character.name].lastInteraction = Date.now();
                }
                
                modal.remove();
            });
        });
    }

    /**
     * 获取技能名称
     * @param {string} skill 技能标识
     * @returns {string} 技能名称
     */
    getSkillName(skill) {
        const names = {
            poetry: '诗词',
            embroidery: '刺绣',
            music: '音律',
            cooking: '烹饪',
            housekeeping: '管家'
        };
        return names[skill] || skill;
    }
}

// 游戏初始化
document.addEventListener('DOMContentLoaded', () => {
    window.game = new AncientLifeSimulator();
});