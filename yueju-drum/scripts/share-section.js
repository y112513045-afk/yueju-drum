document.addEventListener('DOMContentLoaded', function() {
    // 获取作品展示区域
    const myWorksContainer = document.getElementById('my-works');
    const communityWorksContainer = document.getElementById('community-works');
    
    // 初始化作品展示
    function initWorkDisplays() {
        // 加载并显示我的作品
        updateMyWorksList();
        
        // 加载并显示社区精选作品
        loadCommunityWorks();
    }
    
    // 更新我的作品列表
    function updateMyWorksList() {
        // 清空容器
        myWorksContainer.innerHTML = '';
        
        // 从本地存储获取作品
        const works = JSON.parse(localStorage.getItem('yueju_works') || '[]');
        
        if (works.length === 0) {
            // 没有作品时显示提示
            myWorksContainer.innerHTML = `
                <div class="text-center text-gray-500 py-12 col-span-full">
                    <p>你还没有保存任何作品</p>
                    <a href="#create" class="text-blue-600 hover:underline mt-2 inline-block">去创作一个吧</a>
                </div>
            `;
            return;
        }
        
        // 按创建时间排序（最新的在前）
        works.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // 创建作品卡片
        works.forEach(work => {
            const workCard = createWorkCard(work, true);
            myWorksContainer.appendChild(workCard);
        });
    }
    
    // 加载社区精选作品（模拟数据）
    function loadCommunityWorks() {
        // 清空容器
        communityWorksContainer.innerHTML = '';
        
        // 模拟社区作品数据
        const communityWorks = [
            {
                id: 'community_1',
                name: '粤韵风华',
                author: '粤剧爱好者',
                createdAt: '2023-06-15T10:30:00Z',
                duration: 15000
            },
            {
                id: 'community_2',
                name: '锣鼓喧天',
                author: '戏曲达人',
                createdAt: '2023-06-10T14:20:00Z',
                duration: 12000
            },
            {
                id: 'community_3',
                name: '经典再现',
                author: '老戏骨',
                createdAt: '2023-06-05T09:15:00Z',
                duration: 18000
            }
        ];
        
        // 创建作品卡片
        communityWorks.forEach(work => {
            const workCard = createWorkCard(work, false);
            communityWorksContainer.appendChild(workCard);
        });
    }
    
    // 创建作品卡片
    function createWorkCard(work, isMyWork) {
        const card = document.createElement('div');
        card.className = 'work-card';
        
        // 格式化时间
        const date = new Date(work.createdAt);
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        
        // 格式化时长
        const minutes = Math.floor(work.duration / 60000);
        const seconds = Math.floor((work.duration % 60000) / 1000);
        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // 卡片内容
        card.innerHTML = `
            <div class="work-card-info">
                <h4 class="work-card-title">${work.name}</h4>
                <div class="work-card-meta">
                    <span>${isMyWork ? '我的作品' : `作者: ${work.author}`}</span> · 
                    <span>${formattedDate}</span> · 
                    <span>${formattedDuration}</span>
                </div>
                <audio class="work-card-audio" controls>
                    <source src="audio/samples/${work.id}.m4a" type="audio/mp4">
                    您的浏览器不支持音频播放
                </audio>
                <div class="work-card-actions mt-3">
                    <button class="play-work-btn bg-green-100 hover:bg-green-200 text-green-800 py-1 px-3 rounded text-sm" data-id="${work.id}">
                        <i class="fa fa-play mr-1"></i> 播放
                    </button>
                    ${isMyWork ? `
                        <button class="edit-work-btn bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-3 rounded text-sm" data-id="${work.id}">
                            <i class="fa fa-edit mr-1"></i> 编辑
                        </button>
                        <button class="share-work-btn bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-3 rounded text-sm" data-id="${work.id}" data-name="${work.name}">
                            <i class="fa fa-share-alt mr-1"></i> 分享
                        </button>
                        <button class="delete-work-btn bg-red-100 hover:bg-red-200 text-red-800 py-1 px-3 rounded text-sm" data-id="${work.id}">
                            <i class="fa fa-trash mr-1"></i> 删除
                        </button>
                    ` : `
                        <button class="share-work-btn bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-3 rounded text-sm" data-id="${work.id}" data-name="${work.name}">
                            <i class="fa fa-share-alt mr-1"></i> 分享
                        </button>
                        <button class="like-work-btn bg-pink-100 hover:bg-pink-200 text-pink-800 py-1 px-3 rounded text-sm" data-id="${work.id}">
                            <i class="fa fa-heart mr-1"></i> 喜欢
                        </button>
                    `}
                </div>
            </div>
        `;
        
        // 添加按钮事件
        if (isMyWork) {
            // 编辑按钮事件
            card.querySelector('.edit-work-btn').addEventListener('click', () => {
                editWork(work.id);
            });
            
            // 删除按钮事件
            card.querySelector('.delete-work-btn').addEventListener('click', () => {
                deleteWork(work.id);
            });
        } else {
            // 喜欢按钮事件
            card.querySelector('.like-work-btn').addEventListener('click', (e) => {
                likeWork(e.target.closest('.like-work-btn'));
            });
        }
        
        // 播放按钮事件
        card.querySelector('.play-work-btn').addEventListener('click', () => {
            playWork(work);
        });
        
        // 分享按钮事件
        card.querySelector('.share-work-btn').addEventListener('click', (e) => {
            shareWork(e.target.closest('.share-work-btn').dataset.id, e.target.closest('.share-work-btn').dataset.name);
        });
        
        return card;
    }
    
    // 播放作品
    function playWork(work) {
        // 在实际应用中，这里会加载并播放作品的音频
        // 这里只是模拟播放
        alert(`正在播放作品: ${work.name}`);
        
        // 如果是自己的作品，可以跳转到编曲页面加载该作品
        if (work.arrangement) {
            // 跳转到编曲页面
            document.querySelector('a[href="#create"]').click();
            
            // 这里可以添加加载作品到编曲界面的逻辑
        }
    }
    
    // 编辑作品
    function editWork(workId) {
        // 从本地存储获取作品
        const works = JSON.parse(localStorage.getItem('yueju_works') || '[]');
        const work = works.find(w => w.id === workId);
        
        if (!work) {
            alert('作品不存在');
            return;
        }
        
        // 跳转到编曲页面
        document.querySelector('a[href="#create"]').click();
        
        // 这里可以添加加载作品到编曲界面的逻辑
        alert(`加载作品"${work.name}"到编曲界面进行编辑`);
    }
    
    // 删除作品
    function deleteWork(workId) {
        if (confirm('确定要删除这个作品吗？此操作不可恢复。')) {
            // 从本地存储获取作品
            let works = JSON.parse(localStorage.getItem('yueju_works') || '[]');
            
            // 过滤掉要删除的作品
            works = works.filter(w => w.id !== workId);
            
            // 保存回本地存储
            localStorage.setItem('yueju_works', JSON.stringify(works));
            
            // 更新作品列表
            updateMyWorksList();
        }
    }
    
    // 分享作品
    function shareWork(workId, workName) {
        // 模拟分享功能
        const shareText = `我在粤剧锣鼓虚拟演奏工坊创作了作品《${workName}》，快来听听吧！`;
        
        // 简单的分享模拟
        if (navigator.share) {
            // 如果浏览器支持Web Share API
            navigator.share({
                title: '粤剧锣鼓作品分享',
                text: shareText,
                url: window.location.href + `?work=${workId}`
            }).catch(error => {
                console.log('分享失败:', error);
                copyShareLink(shareText);
            });
        } else {
            // 否则使用复制链接的方式
            copyShareLink(shareText);
        }
    }
    
    // 复制分享链接
    function copyShareLink(shareText) {
        // 创建分享链接
        const shareUrl = window.location.href;
        
        // 创建要复制的文本
        const textToCopy = `${shareText}\n${shareUrl}`;
        
        // 复制到剪贴板
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('分享链接已复制到剪贴板，可以粘贴到社交平台分享给好友了！');
        }).catch(error => {
            console.error('复制失败:', error);
            alert('复制失败，请手动复制分享链接');
        });
    }
    
    // 喜欢作品
    function likeWork(button) {
        const isLiked = button.classList.contains('bg-pink-500');
        
        if (isLiked) {
            // 取消喜欢
            button.classList.remove('bg-pink-500', 'text-white');
            button.classList.add('bg-pink-100', 'text-pink-800');
            button.innerHTML = '<i class="fa fa-heart mr-1"></i> 喜欢';
        } else {
            // 喜欢
            button.classList.remove('bg-pink-100', 'text-pink-800');
            button.classList.add('bg-pink-500', 'text-white');
            button.innerHTML = '<i class="fa fa-heart mr-1"></i> 已喜欢';
        }
    }
    
    // 启动初始化
    initWorkDisplays();
});
