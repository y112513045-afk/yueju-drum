class AudioManager {
    constructor() {
        // 音频上下文，用于高级音频处理
        this.audioContext = null;
        // 存储所有加载的音频缓冲区
        this.audioBuffers = {};
        
        // 1. 新增：基础乐器配置（7种，含京剧/粤剧分类，文锣/高边锣默认不初始加载）
        // 说明：带 -l 后缀为常规（左手），带 -f 后缀为快击（右手）
        this.baseInstruments = [
            // 京剧锣鼓（前4种）
            { 
                id: 'small-luo',       // 小锣
                name: '小锣', 
                category: 'jingju',    // 分类：京剧
                color: '#FFD700', 
                image: 'images/instruments/xiaoluo.png',
                audio: 'audio/xiaoluo-l.m4a',       // 左键常规
                audioFast: 'audio/xiaoluo-f.m4a',   // 右键快击
                hasTwoSounds: true,
                shortcut: 'q'
            },
            { 
                id: 'nao-bo',          // 铙钹/闹钹
                name: '铙钹', 
                category: 'jingju', 
                color: '#8B4513', 
                image: 'images/instruments/naobo.png',
                audio: 'audio/naobo-l.m4a',         // 左键常规
                audioFast: 'audio/naobo-f.m4a',      // 右键快击
                hasTwoSounds: true,
                shortcut: 'w'
            },
            { 
                id: 'big-luo',         // 大锣
                name: '大锣', 
                category: 'jingju', 
                color: '#4169E1', 
                image: 'images/instruments/daluo.png',
                audio: 'audio/daluo-l.m4a',           // 左键常规
                audioFast: 'audio/daluo-f.m4a',       // 右键快击
                hasTwoSounds: true,
                shortcut: 'e'
            },
            { 
                id: 'danpi-gu',        // 单皮鼓
                name: '单皮鼓', 
                category: 'jingju', 
                color: '#A0522D', 
                image: 'images/instruments/danpigu.png',
                audio: 'audio/danbigu.m4a',           // 单一音频
                hasTwoSounds: false,
                shortcut: 'r'
            },
            // 粤剧锣鼓（基础3种掌版，文锣/高边锣动态添加）
            { 
                id: 'zhangban-muyu',       // 掌版木鱼
                name: '木鱼', 
                category: 'yueju',     // 分类：粤剧
                color: '#8B4513', 
                image: 'images/instruments/muyu.png',
                audio: 'audio/zhangban-muyu.m4a',  // 单一音频
                hasTwoSounds: false,
                shortcut: 'a'
            },
            { 
                id: 'zhangban-shagu',       // 掌版沙鼓
                name: '沙鼓', 
                category: 'yueju',     // 分类：粤剧
                color: '#A0522D', 
                image: 'images/instruments/shagu.png',
                audio: 'audio/zhangban-shagu.m4a',  // 单一音频
                hasTwoSounds: false,
                shortcut: 's'
            },
            { 
                id: 'zhangban-shuangpigu',       // 掌版双皮鼓
                name: '双皮鼓', 
                category: 'yueju',     // 分类：粤剧
                color: '#228B22', 
                image: 'images/instruments/shuangpigu.png',
                audio: 'audio/zhangban-shuangpigu.m4a',  // 单一音频
                hasTwoSounds: false,
                shortcut: 'd'
            },
            { 
                id: 'shi-cha',         // 狮镲/铓巾
                name: '狮镲', 
                category: 'yueju', 
                color: '#DC143C', 
                image: 'images/instruments/shicha.png',
                audio: 'audio/shicha-l.m4a',          // 左键常规
                audioFast: 'audio/shicha-f.m4a',      // 右键快击
                hasTwoSounds: true,
                shortcut: 's'
            }
        ];
        
        // 2. 动态乐器列表（初始为空，通过setStyleScene方法设置曲风后填充）
        this.instruments = [];
        
        // 3. 文锣/高边锣配置（单独提取，供曲风切换使用）
        this.sceneSpecificInstruments = {
            fight: { // 打斗戏：高边锣
                id: 'gaobian-luo',
                name: '高边锣',
                category: 'yueju',
                color: '#FF6347',
                image: 'images/instruments/gaobianluo.png',
                audio: 'audio/gaobianluo-l.m4a',        // 左键常规
                audioFast: 'audio/gaobianluo-f.m4a',   // 右键快击
                hasTwoSounds: true,
                shortcut: 'd'
            },
            civil: { // 文场戏：文锣
                id: 'wen-luo',
                name: '文锣',
                category: 'yueju',
                color: '#9370DB',
                image: 'images/instruments/wenluo.png',
                audio: 'audio/wenluo-l.m4a',            // 左键常规
                audioFast: 'audio/wenluo-f.m4a',        // 右键快击
                hasTwoSounds: true,
                shortcut: 'd'
            }
        };
        
        // 原有曲牌、节奏型配置（保持不变）
        this.tunes = [
            { id: 'yuanban', name: '原板' },
            { id: 'kuaiban', name: '快板' },
            { id: 'manban', name: '慢板' },
            { id: 'sanban', name: '散板' }
        ];
        this.rhythms = [
            { id: 'rhythm1', name: '节奏型一', pattern: [['ban', 0], ['gu', 200], ['luo', 400], ['bo', 600]] },
            { id: 'rhythm2', name: '节奏型二', pattern: [['gu', 0], ['ban', 100], ['gu', 200], ['bo', 300], ['luo', 400]] },
            { id: 'rhythm3', name: '节奏型三', pattern: [['luo', 0], ['bo', 300], ['luo', 600], ['bo', 900]] },
            { id: 'rhythm4', name: '节奏型四', pattern: [['ban', 0], ['ban', 150], ['gu', 300], ['ban', 450], ['bo', 600]] }
        ];
        
        // 初始化音频上下文
        this.initAudioContext();
        // 初始加载基础乐器音频（文锣/高边锣暂不加载，切换曲风时再加载）
        this.loadBaseInstrumentAudios();
        // 加载曲牌音频（保持原有）
        this.loadAllTuneAudios();
    }
    
    // 初始化音频上下文（保持原有）
    initAudioContext() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {
            console.error('Web Audio API 不受支持: ' + e);
            alert('很抱歉，您的浏览器不支持音频功能，请更换现代浏览器重试。');
        }
    }
    
    // 3. 新增：加载基础乐器音频（不含文锣/高边锣）
    loadBaseInstrumentAudios() {
        this.baseInstruments.forEach(instrument => {
            this.loadAudio(instrument.id, instrument.audio);
            if (instrument.hasTwoSounds && instrument.audioFast) {
                this.loadAudio(`${instrument.id}-fast`, instrument.audioFast);
            }
        });
        console.log("基础乐器音频加载完成（共6种）");
    }

    // 4. 新增：加载曲风专属乐器音频（文锣/高边锣）
    loadSceneInstrumentAudio(sceneType) {
        const sceneInst = this.sceneSpecificInstruments[sceneType];
        if (!sceneInst) return;
        
        // 先检查是否已加载，避免重复加载
        if (this.audioBuffers[sceneInst.id]) {
            console.log(`曲风乐器${sceneInst.name}已加载，无需重复加载`);
            return;
        }
        
        this.loadAudio(sceneInst.id, sceneInst.audio);
        if (sceneInst.hasTwoSounds && sceneInst.audioFast) {
            this.loadAudio(`${sceneInst.id}-fast`, sceneInst.audioFast);
        }
        console.log(`曲风乐器${sceneInst.name}音频加载完成`);
    }
    
    // 5. 新增：设置曲风场景（核心方法，切换文锣/高边锣）
    // sceneType: 'fight'（打斗戏，高边锣） / 'civil'（文场戏，文锣）
    setStyleScene(sceneType) {
        if (!['fight', 'civil'].includes(sceneType)) {
            console.error("无效的曲风类型，仅支持'fight'或'civil'");
            return;
        }
        
        // 1. 获取当前曲风专属乐器（文锣/高边锣）
        const sceneInst = this.sceneSpecificInstruments[sceneType];
        // 2. 组合基础乐器 + 曲风专属乐器（共7种）
        this.instruments = [...this.baseInstruments, sceneInst];
        // 3. 加载当前曲风专属乐器的音频
        this.loadSceneInstrumentAudio(sceneType);
        
        console.log(`已切换至${sceneType === 'fight' ? '打斗戏' : '文场戏'}场景，当前乐器：`, this.instruments.map(inst => inst.name));
    }
    
    // 加载所有曲牌音频（原有逻辑，优化路径写法）
    loadAllTuneAudios() {
        this.tunes.forEach(tune => {
            this.loadAudio(`tune_${tune.id}`, `audio/tunes/${tune.id}.m4a`);
        });
        console.log("曲牌音频加载完成");
    }
    
    // 加载单个音频文件（保持原有）
    loadAudio(id, url) {
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP错误：${response.status}（${url}）`);
                return response.arrayBuffer();
            })
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                this.audioBuffers[id] = audioBuffer;
                console.log(`音频加载完成: ${id}（${url}）`);
            })
            .catch(error => {
                console.error(`音频加载失败 ${id}: ${error.message}`);
            });
    }
    
    // 播放音频（保持原有）
    playAudio(id, time = 0) {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        if (!this.audioBuffers[id]) {
            console.warn(`音频未加载: ${id}`);
            return null;
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.audioBuffers[id];
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start(this.audioContext.currentTime + time);
        return source;
    }
    
    // 播放乐器声音（保持原有）
    playInstrument(instrumentId) {
        return this.playAudio(instrumentId);
    }
    
    // 播放乐器快击声音（右键触发）
    playInstrumentFast(instrumentId) {
        const fastId = `${instrumentId}-fast`;
        if (this.audioBuffers[fastId]) {
            return this.playAudio(fastId);
        }
        return this.playAudio(instrumentId);
    }
    
    // 播放曲牌（保持原有）
    playTune(tuneId) {
        return this.playAudio(`tune_${tuneId}`);
    }
    
    // 播放节奏型（保持原有，若需适配新乐器可后续修改pattern）
    playRhythm(rhythmId, startTime = 0) {
        const rhythm = this.rhythms.find(r => r.id === rhythmId);
        if (!rhythm) {
            console.warn(`节奏型不存在: ${rhythmId}`);
            return [];
        }
        
        const sources = [];
        rhythm.pattern.forEach(([instrumentId, timeOffset]) => {
            const source = this.playInstrument(instrumentId, startTime + timeOffset / 1000);
            if (source) sources.push(source);
        });
        return sources;
    }
    
    // 获取所有乐器信息（保持原有，现在返回的是动态切换后的7种）
    getInstruments() {
        return [...this.instruments];
    }
    
    // 获取所有曲牌（保持原有）
    getTunes() {
        return [...this.tunes];
    }
    
    // 获取所有节奏型（保持原有）
    getRhythms() {
        return [...this.rhythms];
    }
    
    // 获取乐器颜色（保持原有，适配新乐器）
    getInstrumentColor(instrumentId) {
        const instrument = this.instruments.find(inst => inst.id === instrumentId);
        return instrument ? instrument.color : '#CCCCCC';
    }
    
    // 6. 新增：根据乐器ID获取分类（京剧/粤剧，用于UI区分）
    getInstrumentCategory(instrumentId) {
        const instrument = this.instruments.find(inst => inst.id === instrumentId);
        return instrument ? instrument.category : 'unknown';
    }
}

// 创建音频管理器实例
const audioManager = new AudioManager();