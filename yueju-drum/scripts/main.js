document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面滚动行为（平滑滚动）
    initSmoothScroll();
    
    // 初始化页面加载动画
    initPageLoadAnimation();
    
    // 检查音频支持
    checkAudioSupport();
    
    // 添加页面访问统计
    trackPageView();
});

// 初始化平滑滚动
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // 平滑滚动到目标位置
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // 减去导航栏高度
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 初始化页面加载动画
function initPageLoadAnimation() {
    // 添加加载类
    document.body.classList.add('page-loading');
    
    // 页面加载完成后移除加载类，显示内容
    window.addEventListener('load', () => {
        setTimeout(() => {
            document.body.classList.remove('page-loading');
        }, 500);
    });
}

// 检查音频支持
function checkAudioSupport() {
    // 检查Web Audio API支持
    if (typeof window.AudioContext === 'undefined' && typeof window.webkitAudioContext === 'undefined') {
        alert('很抱歉，您的浏览器不支持Web Audio API，无法使用本网站的音频功能。请更换现代浏览器（如Chrome、Firefox、Edge等）重试。');
    }
    
    // 添加用户交互触发音频上下文恢复（浏览器安全策略）
    document.addEventListener('click', () => {
        if (audioManager && audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
            audioManager.audioContext.resume();
        }
    }, { once: true });
}

// 页面访问统计（模拟）
function trackPageView() {
    console.log('页面访问统计: 记录访问信息');
    // 在实际应用中，这里可以添加Google Analytics等统计代码
}

// 添加全局错误处理
window.addEventListener('error', function(error) {
    console.error('全局错误:', error);
    
    // 显示友好的错误提示
    const errorMessage = '抱歉，页面发生错误。请刷新页面重试，如果问题持续，请联系我们。';
    
    // 创建错误提示元素
    const errorElement = document.createElement('div');
    errorElement.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorElement.textContent = errorMessage;
    
    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'ml-4 text-white hover:text-gray-200';
    closeButton.innerHTML = '<i class="fa fa-times"></i>';
    closeButton.addEventListener('click', () => {
        errorElement.remove();
    });
    
    errorElement.appendChild(closeButton);
    document.body.appendChild(errorElement);
    
    // 5秒后自动隐藏
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.remove();
        }
    }, 5000);
});
