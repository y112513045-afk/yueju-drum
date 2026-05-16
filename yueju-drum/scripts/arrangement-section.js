document.addEventListener('DOMContentLoaded', function() {
    // 获取编曲区域元素
    const melodiesLibrary = document.getElementById('melodies-library');
    const rhythmsLibrary = document.getElementById('rhythms-library');
    const arrangementTimeline = document.getElementById('arrangement-timeline');
    const playArrangementBtn = document.getElementById('play-arrangement-btn');
    const clearArrangementBtn = document.getElementById('clear-arrangement-btn');
    const saveArrangementBtn = document.getElementById('save-arrangement-btn');
    
    // 编曲数据
    let arrangement = {
        melodies: [],
        rhythms: []
    };
    
    // 播放状态
    let isPlaying = false;
    let playStartTime = 0;
    let playInterval = null;
    
    // 创建素材库项
    function createLibraryItem(id, name, type) {
        const item = document.createElement('div');
        item.className = 'library-item';
        item.dataset.id = id;
        item.dataset.type = type;
        item.textContent = name;
        
        // 添加拖拽功能
        item.draggable = true;
        
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                id: id,
                type: type,
                name: name
            }));
        });
        
        return item;
    }
    
    // 初始化素材库
    function initLibraries() {
        // 初始化曲牌旋律库
        const tunes = audioManager.getTunes();
        tunes.forEach(tune => {
            const item = createLibraryItem(tune.id, tune.name, 'melody');
            melodiesLibrary.appendChild(item);
        });
        
        // 初始化节奏型库
        const rhythms = audioManager.getRhythms();
        rhythms.forEach(rhythm => {
            const item = createLibraryItem(rhythm.id, rhythm.name, 'rhythm');
            rhythmsLibrary.appendChild(item);
        });
        
        // 设置时间线拖拽目标
        setupTimelineDropTarget();
    }
    
    // 设置时间线为拖拽目标
    function setupTimelineDropTarget() {
        arrangementTimeline.addEventListener('dragover', (e) => {
            e.preventDefault(); // 允许放置
            arrangementTimeline.classList.add('bg-gray-100');
        });
        
        arrangementTimeline.addEventListener('dragleave', () => {
            arrangementTimeline.classList.remove('bg-gray-100');
        });
        
        arrangementTimeline.addEventListener('drop', (e) => {
            e.preventDefault();
            arrangementTimeline.classList.remove('bg-gray-100');
            
            // 获取拖拽的数据
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            
            // 计算放置位置（相对于时间线的X坐标）
            const rect = arrangementTimeline.getBoundingClientRect();
            const x = e.clientX - rect.left;
            
            // 将素材添加到时间线
            addToTimeline(data.id, data.type, data.name, x);
        });
    }
    
    // 创建时间线轨道
    function createTimelineTrack(type) {
        // 检查是否已存在该类型的轨道
        let trackSection = document.querySelector(`.timeline-section[data-type="${type}"]`);
        
        if (!trackSection) {
            // 创建轨道部分
            trackSection = document.createElement('div');
            trackSection.className = 'timeline-section';
            trackSection.dataset.type = type;
            
            // 创建轨道标签
            const label = document.createElement('div');
            label.className = 'timeline-section-label';
            label.textContent = type === 'melody' ? '曲牌旋律' : '节奏型';
            
            // 创建轨道
            const track = document.createElement('div');
            track.className = 'timeline-track';
            
            // 组合轨道部分
            trackSection.appendChild(label);
            trackSection.appendChild(track);
            
            // 添加到时间线
            arrangementTimeline.appendChild(trackSection);
        }
        
        return trackSection.querySelector('.timeline-track');
    }
    
    // 添加素材到时间线
    function addToTimeline(id, type, name, xPos) {
        // 获取或创建对应类型的轨道
        const track = createTimelineTrack(type);
        
        // 创建时间线项目
        const item = document.createElement('div');
        const itemId = `${type}-${id}-${Date.now()}`; // 唯一ID
        item.id = itemId;
        item.className = 'timeline-item';
        item.style.left = `${xPos}px`;
        item.dataset.id = id;
        item.dataset.type = type;
        item.textContent = name;
        
        // 设置不同类型的颜色
        if (type === 'melody') {
            item.style.backgroundColor = '#4285F4'; // 蓝色
        } else {
            item.style.backgroundColor = '#00C851'; // 绿色
        }
        
        // 添加拖拽功能（在时间线上移动）
        let isDragging = false;
        let startX;
        let startLeft;
        
        item.addEventListener('mousedown', (e) => {
            if (isPlaying) return; // 播放时不允许拖拽
            
            isDragging = true;
            startX = e.clientX;
            startLeft = parseInt(item.style.left);
            item.style.zIndex = '100';
            item.classList.add('opacity-70');
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            let newLeft = startLeft + dx;
            
            // 限制在轨道内
            if (newLeft < 0) newLeft = 0;
            if (newLeft > track.clientWidth - item.clientWidth) {
                newLeft = track.clientWidth - item.clientWidth;
            }
            
            item.style.left = `${newLeft}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                item.style.zIndex = '10';
                item.classList.remove('opacity-70');
                
                // 更新编曲数据
                updateArrangementData();
            }
        });
        
        // 双击删除
        item.addEventListener('dblclick', () => {
            if (isPlaying) return;
            
            if (confirm(`确定要删除 "${name}" 吗？`)) {
                item.remove();
                updateArrangementData();
                
                // 如果轨道为空，删除轨道
                if (track.children.length === 0) {
                    track.parentNode.remove();
                }
            }
        });
        
        // 添加到轨道
        track.appendChild(item);
        
        // 更新编曲数据
        updateArrangementData();
    }
    
    // 更新编曲数据
    function updateArrangementData() {
        // 清空现有数据
        arrangement.melodies = [];
        arrangement.rhythms = [];
        
        // 收集曲牌旋律数据
        document.querySelectorAll('.timeline-item[data-type="melody"]').forEach(item => {
            arrangement.melodies.push({
                id: item.dataset.id,
                name: item.textContent,
                time: Math.round(parseInt(item.style.left) / 50) * 100 // 转换为毫秒
            });
        });
        
        // 收集节奏型数据
        document.querySelectorAll('.timeline-item[data-type="rhythm"]').forEach(item => {
            arrangement.rhythms.push({
                id: item.dataset.id,
                name: item.textContent,
                time: Math.round(parseInt(item.style.left) / 50) * 100 // 转换为毫秒
            });
        });
        
        // 按时间排序
        arrangement.melodies.sort((a, b) => a.time - b.time);
        arrangement.rhythms.sort((a, b) => a.time - b.time);
    }
    
    // 播放编曲
    function playArrangement() {
        if (isPlaying) {
            stopArrangementPlayback();
            return;
        }
        
        if (arrangement.melodies.length === 0 && arrangement.rhythms.length === 0) {
            alert('请先添加曲牌旋律或节奏型到编曲中');
            return;
        }
        
        // 更新按钮状态
        isPlaying = true;
        playArrangementBtn.innerHTML = '<i class="fa fa-stop mr-2"></i>停止播放';
        saveArrangementBtn.disabled = true;
        clearArrangementBtn.disabled = true;
        
        // 记录开始时间
        playStartTime = Date.now();
        
        // 创建播放指示器
        createPlayIndicator();
        
        // 播放所有曲牌旋律
        arrangement.melodies.forEach(melody => {
            setTimeout(() => {
                if (isPlaying) {
                    audioManager.playTune(melody.id);
                    highlightTimelineItem('melody', melody.id, melody.time);
                }
            }, melody.time);
        });
        
        // 播放所有节奏型
        arrangement.rhythms.forEach(rhythm => {
            setTimeout(() => {
                if (isPlaying) {
                    audioManager.playRhythm(rhythm.id);
                    highlightTimelineItem('rhythm', rhythm.id, rhythm.time);
                }
            }, rhythm.time);
        });
        
        // 计算总时长
        const allItems = [...arrangement.melodies, ...arrangement.rhythms];
        const maxTime = allItems.length > 0 ? Math.max(...allItems.map(item => item.time)) + 5000 : 0;
        
        // 设置播放结束自动停止
        if (maxTime > 0) {
            setTimeout(() => {
                if (isPlaying) {
                    stopArrangementPlayback();
                }
            }, maxTime);
        }
        
        // 更新播放指示器位置
        updatePlayIndicatorPosition();
    }
    
    // 创建播放指示器
    function createPlayIndicator() {
        // 先移除已有的指示器
        const existingIndicator = document.querySelector('.play-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // 创建新的指示器
        const indicator = document.createElement('div');
        indicator.className = 'play-indicator absolute h-full w-1 bg-red-500 pointer-events-none z-20';
        indicator.style.top = '0';
        indicator.style.left = '0';
        
        // 添加到所有轨道
        document.querySelectorAll('.timeline-track').forEach(track => {
            const trackIndicator = indicator.cloneNode(true);
            track.appendChild(trackIndicator);
        });
    }
    
    // 更新播放指示器位置
    function updatePlayIndicatorPosition() {
        if (!isPlaying) return;
        
        const elapsedTime = Date.now() - playStartTime;
        const position = (elapsedTime / 100) * 50; // 转换为像素位置
        
        // 更新所有指示器位置
        document.querySelectorAll('.play-indicator').forEach(indicator => {
            indicator.style.left = `${position}px`;
        });
        
        // 继续更新
        playInterval = requestAnimationFrame(updatePlayIndicatorPosition);
    }
    
    // 高亮显示正在播放的时间线项目
    function highlightTimelineItem(type, id, time) {
        const items = document.querySelectorAll(`.timeline-item[data-type="${type}"][data-id="${id}"]`);
        
        items.forEach(item => {
            // 检查是否是对应时间的项目（可能有多个相同的项目）
            const itemTime = Math.round(parseInt(item.style.left) / 50) * 100;
            if (itemTime === time) {
                item.classList.add('ring-2', 'ring-yellow-400');
                
                setTimeout(() => {
                    item.classList.remove('ring-2', 'ring-yellow-400');
                }, 500);
            }
        });
    }
    
    // 停止编曲播放
    function stopArrangementPlayback() {
        isPlaying = false;
        cancelAnimationFrame(playInterval);
        
        // 移除播放指示器
        document.querySelectorAll('.play-indicator').forEach(indicator => {
            indicator.remove();
        });
        
        // 恢复按钮状态
        playArrangementBtn.innerHTML = '<i class="fa fa-play mr-2"></i>播放';
        saveArrangementBtn.disabled = false;
        clearArrangementBtn.disabled = false;
    }
    
    // 清空编曲
    function clearArrangement() {
        if (isPlaying) {
            stopArrangementPlayback();
        }
        
        if (confirm('确定要清空当前编曲吗？所有内容将被删除。')) {
            // 清空时间线
            document.querySelectorAll('.timeline-section').forEach(section => {
                section.remove();
            });
            
            // 重置编曲数据
            arrangement = {
                melodies: [],
                rhythms: []
            };
            
            // 显示初始提示
            arrangementTimeline.innerHTML = `
                <div class="text-center text-gray-500 py-12">
                    <i class="fa fa-arrow-left text-2xl mb-2"></i>
                    <p>从左侧素材库拖放元素到这里开始编曲</p>
                </div>
            `;
        }
    }
    
    // 保存编曲作品
    function saveArrangement() {
        if (arrangement.melodies.length === 0 && arrangement.rhythms.length === 0) {
            alert('请先创建编曲内容再保存');
            return;
        }
        
        // 获取作品名称
        const workName = prompt('请输入作品名称:', `我的粤剧编曲_${new Date().toLocaleDateString()}`);
        
        if (!workName) return; // 用户取消
        
        // 创建作品数据
        const work = {
            id: `work_${Date.now()}`,
            name: workName,
            arrangement: arrangement,
            createdAt: new Date().toISOString(),
            duration: calculateArrangementDuration()
        };
        
        // 保存到本地存储
        saveWorkToLocalStorage(work);
        
        // 提示保存成功
        alert(`作品"${workName}"保存成功！`);
        
        // 更新作品列表
        updateMyWorksList();
    }
    
    // 计算编曲时长
    function calculateArrangementDuration() {
        const allItems = [...arrangement.melodies, ...arrangement.rhythms];
        if (allItems.length === 0) return 0;
        
        return Math.max(...allItems.map(item => item.time)) + 3000; // 最大时间加3秒
    }
    
    // 保存作品到本地存储
    function saveWorkToLocalStorage(work) {
        // 获取现有作品
        let works = JSON.parse(localStorage.getItem('yueju_works') || '[]');
        
        // 添加新作品
        works.push(work);
        
        // 保存回本地存储
        localStorage.setItem('yueju_works', JSON.stringify(works));
    }
    
    // 设置按钮事件
    function setupButtons() {
        playArrangementBtn.addEventListener('click', playArrangement);
        clearArrangementBtn.addEventListener('click', clearArrangement);
        saveArrangementBtn.addEventListener('click', saveArrangement);
    }
    
    // 初始化编曲区域
    function initArrangementSection() {
        initLibraries();
        setupButtons();
    }
    
    // 启动初始化
    initArrangementSection();
});
