(function () {
    'use strict';

    var instruments = [
        { id: 'big-luo', name: '大锣', color: '#4169E1', image: 'images/instruments/daluo.png', fastAudio: 'audio/daluo-f.m4a', normalAudio: 'audio/daluo-l.m4a', row: 1, opera: 'jingju' },
        { id: 'nao-bo', name: '铙钹', color: '#8B4513', image: 'images/instruments/naobo.png', fastAudio: 'audio/naobo-f.m4a', normalAudio: 'audio/naobo-l.m4a', row: 1, opera: 'jingju' },
        { id: 'small-luo', name: '小锣', color: '#FFD700', image: 'images/instruments/xiaoluo.png', fastAudio: 'audio/xiaoluo-f.m4a', normalAudio: 'audio/xiaoluo-l.m4a', row: 1, opera: 'jingju' },
        { id: 'danpi-gu', name: '单皮鼓', color: '#A0522D', image: 'images/instruments/danpigu.png', fastAudio: 'audio/danbigu.m4a', normalAudio: 'audio/danbigu.m4a', row: 2, opera: 'jingju' },
        { id: 'gaobian-luo', name: '高边锣', color: '#FF6347', image: 'images/instruments/gaobianluo.png', fastAudio: 'audio/gaobianluo-f.m4a', normalAudio: 'audio/gaobianluo-l.m4a', row: 1, opera: 'yueju' },
        { id: 'wen-luo', name: '文锣', color: '#9370DB', image: 'images/instruments/wenluo.png', fastAudio: 'audio/wenluo-f.m4a', normalAudio: 'audio/wenluo-l.m4a', row: 1, opera: 'yueju' },
        { id: 'shi-cha', name: '狮镲', color: '#DC143C', image: 'images/instruments/shicha.png', fastAudio: 'audio/shicha-f.m4a', normalAudio: 'audio/shicha-l.m4a', row: 1, opera: 'yueju' },
        { id: 'shuangpi-gu', name: '双皮鼓', color: '#CD853F', image: 'images/instruments/shuangpigu.png', fastAudio: 'audio/zhangban-shuangpigu.m4a', normalAudio: 'audio/zhangban-shuangpigu.m4a', row: 2, opera: 'yueju' },
        { id: 'mu-yu', name: '木鱼', color: '#DEB887', image: 'images/instruments/muyu.png', fastAudio: 'audio/zhangban-muyu.m4a', normalAudio: 'audio/zhangban-muyu.m4a', row: 2, opera: 'yueju' },
        { id: 'sha-gu', name: '沙鼓', color: '#BC8F8F', image: 'images/instruments/shagu.png', fastAudio: 'audio/zhangban-shagu.m4a', normalAudio: 'audio/zhangban-shagu.m4a', row: 2, opera: 'yueju' }
    ];

    var challengeInstruments = [
        { id: 'small-luo', name: '小锣', image: 'images/instruments/xiaoluo.png', row: 1 },
        { id: 'big-luo', name: '大锣', image: 'images/instruments/daluo.png', row: 1 },
        { id: 'nao-bo', name: '铙钹', image: 'images/instruments/naobo.png', row: 2 }
    ];

    var KEY_MAP = {
        'q': 'big-luo',
        'w': 'nao-bo',
        'e': 'small-luo',
        'r': 'danpi-gu',
        'a': 'gaobian-luo',
        's': 'wen-luo',
        'd': 'shi-cha',
        'f': 'shuangpi-gu',
        'z': 'mu-yu',
        'x': 'sha-gu'
    };

    var KEY_LABELS = {};
    Object.keys(KEY_MAP).forEach(function (k) { KEY_LABELS[KEY_MAP[k]] = k.toUpperCase(); });

    var challengeSteps = [
        { prompt: '仓', expectedIds: ['small-luo', 'big-luo', 'nao-bo'], expectedNames: ['小锣', '大锣', '铙钹'] },
        { prompt: '才', expectedIds: ['small-luo', 'nao-bo'], expectedNames: ['小锣', '铙钹'] },
        { prompt: '台', expectedIds: ['small-luo'], expectedNames: ['小锣'] },
        { prompt: '仓', expectedIds: ['small-luo', 'big-luo', 'nao-bo'], expectedNames: ['小锣', '大锣', '铙钹'] },
        { prompt: '才', expectedIds: ['small-luo', 'nao-bo'], expectedNames: ['小锣', '铙钹'] },
        { prompt: '台', expectedIds: ['small-luo'], expectedNames: ['小锣'] }
    ];

    var state = {
        currentMode: 'practice',
        currentOpera: 'jingju',
        currentHitName: '',
        hitNameTimer: null,
        challengeWindowMs: 280,
        challengeStepIndex: 0,
        challengeProgress: 0,
        challengeDoneCount: 0,
        challengeTotalCount: challengeSteps.length,
        challengeDone: false,
        challengeCurrentLevel: 1,
        challengeTotalLevels: 5,
        challengeTapMap: {},
        longPressTimers: {},
        longPressedFlags: {}
    };

    var audioPools = {};
    var audioCursors = {};

    function createAudioPool(src, size) {
        var pool = [];
        for (var i = 0; i < size; i++) {
            var audio = new Audio(src);
            audio.preload = 'auto';
            pool.push(audio);
        }
        return pool;
    }

    function initAudioPools() {
        instruments.forEach(function (inst) {
            var fastPool = createAudioPool(inst.fastAudio, 5);
            audioPools[inst.id + '_fast'] = fastPool;
            audioCursors[inst.id + '_fast'] = 0;

            if (inst.normalAudio !== inst.fastAudio) {
                var normalPool = createAudioPool(inst.normalAudio, 3);
                audioPools[inst.id + '_normal'] = normalPool;
                audioCursors[inst.id + '_normal'] = 0;
            }
        });
    }

    function playFromPool(poolKey, seekTime) {
        if (seekTime === undefined) seekTime = 0;
        var pool = audioPools[poolKey];
        if (!pool) return;
        var cursor = audioCursors[poolKey] || 0;
        var audio = pool[cursor % pool.length];
        audioCursors[poolKey] = (cursor + 1) % pool.length;
        audio.pause();
        audio.currentTime = seekTime;
        audio.play().catch(function () {});
    }

    function playFastAudio(instrumentId) {
        var seekTime = (instrumentId === 'small-luo') ? 0.4 : 0;
        playFromPool(instrumentId + '_fast', seekTime);
    }

    function playNormalAudio(instrumentId) {
        var poolKey = instrumentId + '_normal';
        if (!audioPools[poolKey]) {
            poolKey = instrumentId + '_fast';
        }
        playFromPool(poolKey, 0);
    }

    window.playFastAudio = playFastAudio;
    window.playNormalAudio = playNormalAudio;

    var dom = {};

    function cacheDom() {
        dom.stageBg = document.getElementById('stageBg');
        dom.contentWrapper = document.getElementById('contentWrapper');
        dom.challengeLayout = document.getElementById('challengeLayout');
        dom.modeSection = document.getElementById('modeSection');
        dom.row1 = document.getElementById('row1');
        dom.row2 = document.getElementById('row2');
        dom.hitName = document.getElementById('hitName');
        dom.challengeLevel = document.getElementById('challengeLevel');
        dom.challengeToken = document.getElementById('challengeToken');
        dom.challengeExpected = document.getElementById('challengeExpected');
        dom.challengeFeedback = document.getElementById('challengeFeedback');
        dom.challengeComing = document.getElementById('challengeComing');
        dom.challengeRow = document.getElementById('challengeRow');
        dom.challengeProgressFill = document.getElementById('challengeProgressFill');
        dom.challengeProgressText = document.getElementById('challengeProgressText');
    }

    function renderPracticeMode() {
        var row1Instruments = instruments.filter(function (inst) {
            return inst.opera === state.currentOpera && inst.row === 1;
        });
        var row2Instruments = instruments.filter(function (inst) {
            return inst.opera === state.currentOpera && inst.row === 2;
        });

        dom.row1.innerHTML = '';
        dom.row2.innerHTML = '';

        dom.row2.className = 'row row-2';
        if (state.currentOpera === 'jingju') {
            dom.row2.classList.add('row-2-jingju');
        } else {
            dom.row2.classList.add('row-2-yueju');
        }

        row1Instruments.forEach(function (inst) {
            dom.row1.appendChild(createPadElement(inst));
        });
        row2Instruments.forEach(function (inst) {
            dom.row2.appendChild(createPadElement(inst));
        });
    }

    function createPadElement(inst) {
        var wrapper = document.createElement('div');
        wrapper.className = 'pad-wrapper pad-' + inst.id;

        var btn = document.createElement('div');
        btn.className = 'pad-btn';
        btn.setAttribute('data-id', inst.id);

        var img = document.createElement('img');
        img.className = 'pad-img';
        img.src = inst.image;
        img.alt = inst.name;

        var ripple = document.createElement('div');
        ripple.className = 'hit-ripple';

        var spark = document.createElement('div');
        spark.className = 'hit-spark';

        btn.appendChild(img);
        btn.appendChild(ripple);
        btn.appendChild(spark);
        wrapper.appendChild(btn);

        if (KEY_LABELS[inst.id]) {
            var keyTag = document.createElement('span');
            keyTag.className = 'key-hint';
            keyTag.textContent = KEY_LABELS[inst.id];
            wrapper.appendChild(keyTag);
        }

        bindPadEvents(btn, inst);

        return wrapper;
    }

    function bindPadEvents(btn, inst) {
        var instrumentId = inst.id;
        var longPressed = false;
        var longPressTimer = null;

        function onStart(e) {
            e.preventDefault();
            longPressed = false;

            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }

            longPressTimer = setTimeout(function () {
                longPressed = true;
                playNormalAudio(instrumentId);
                triggerHitAnim(btn, 220);
                showHitName(inst.name);
                if (window.Recorder) window.Recorder.recordEvent(instrumentId, 'normal');
            }, 320);

            state.longPressTimers[instrumentId] = longPressTimer;
        }

        function onEnd(e) {
            e.preventDefault();
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }

            if (!longPressed) {
                playFastAudio(instrumentId);
                triggerHitAnim(btn, 150);
                showHitName(inst.name);
                if (window.Recorder) window.Recorder.recordEvent(instrumentId, 'fast');
            }
        }

        function onCancel(e) {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            longPressed = false;
        }

        btn.addEventListener('touchstart', onStart, { passive: false });
        btn.addEventListener('touchend', onEnd, { passive: false });
        btn.addEventListener('touchcancel', onCancel);
        btn.addEventListener('mousedown', onStart);
        btn.addEventListener('mouseup', onEnd);
        btn.addEventListener('mouseleave', onCancel);
    }

    function triggerHitAnim(btn, duration) {
        btn.classList.remove('hit-anim');
        void btn.offsetWidth;
        btn.classList.add('hit-anim');
        setTimeout(function () {
            btn.classList.remove('hit-anim');
        }, duration);
    }

    function showHitName(name) {
        state.currentHitName = name;
        dom.hitName.textContent = name;
        dom.hitName.classList.add('hit-name-active');

        if (state.hitNameTimer) {
            clearTimeout(state.hitNameTimer);
        }
        state.hitNameTimer = setTimeout(function () {
            dom.hitName.textContent = '点击乐器图片查看名称';
            dom.hitName.classList.remove('hit-name-active');
            state.currentHitName = '';
        }, 900);
    }

    function renderChallengeMode() {
        dom.challengeRow.innerHTML = '';
        challengeInstruments.forEach(function (inst) {
            dom.challengeRow.appendChild(createChallengePadElement(inst));
        });
        updateChallengeUI();
    }

    function createChallengePadElement(inst) {
        var wrapper = document.createElement('div');
        wrapper.className = 'challenge-pad-wrapper';

        var btn = document.createElement('div');
        btn.className = 'challenge-pad-btn';
        btn.setAttribute('data-id', inst.id);

        var img = document.createElement('img');
        img.className = 'challenge-pad-img';
        img.src = inst.image;
        img.alt = inst.name;

        var ripple = document.createElement('div');
        ripple.className = 'hit-ripple';

        var spark = document.createElement('div');
        spark.className = 'hit-spark';

        var nameEl = document.createElement('div');
        nameEl.className = 'challenge-pad-name';
        nameEl.textContent = inst.name;

        btn.appendChild(img);
        btn.appendChild(ripple);
        btn.appendChild(spark);
        wrapper.appendChild(btn);
        wrapper.appendChild(nameEl);

        btn.addEventListener('touchstart', function (e) {
            e.preventDefault();
            onChallengeTap(inst.id, btn);
        }, { passive: false });

        btn.addEventListener('mousedown', function (e) {
            e.preventDefault();
            onChallengeTap(inst.id, btn);
        });

        return wrapper;
    }

    function onChallengeTap(instrumentId, btn) {
        if (state.challengeDone) return;

        playFastAudio(instrumentId);
        triggerHitAnim(btn, 180);

        handleChallengeTap(instrumentId);
    }

    function handleChallengeTap(id) {
        var now = Date.now();
        state.challengeTapMap[id] = now;

        var step = challengeSteps[state.challengeStepIndex];
        if (!step) return;

        var validIds = {};
        step.expectedIds.forEach(function (eid) { validIds[eid] = true; });

        if (!validIds[id]) {
            state.challengeTapMap = {};
            setChallengeFeedback('warn', '点击了错误的乐器，请重试');
            return;
        }

        var cutoff = now - state.challengeWindowMs;
        Object.keys(state.challengeTapMap).forEach(function (key) {
            if (state.challengeTapMap[key] < cutoff) {
                delete state.challengeTapMap[key];
            }
        });

        var allTapped = step.expectedIds.every(function (eid) {
            return state.challengeTapMap[eid] !== undefined;
        });

        if (!allTapped) return;

        var times = step.expectedIds.map(function (eid) {
            return state.challengeTapMap[eid];
        });
        var minTime = Math.min.apply(null, times);
        var maxTime = Math.max.apply(null, times);
        var span = maxTime - minTime;

        if (span > state.challengeWindowMs) {
            setChallengeFeedback('warn', '合击稍慢，时间差 ' + span + 'ms（要求 ≤ ' + state.challengeWindowMs + 'ms）');
            state.challengeTapMap = {};
            return;
        }

        advanceChallengeStep();
    }

    function advanceChallengeStep() {
        state.challengeTapMap = {};
        state.challengeDoneCount++;

        if (state.challengeDoneCount >= state.challengeTotalCount) {
            state.challengeDone = true;
            setChallengeFeedback('success', '恭喜通关！第' + state.challengeCurrentLevel + '关完成');
            updateChallengeUI();
            return;
        }

        state.challengeStepIndex++;
        setChallengeFeedback('info', '正确！请继续');
        updateChallengeUI();
    }

    function updateChallengeUI() {
        var step = challengeSteps[state.challengeStepIndex];
        if (!step) return;

        dom.challengeToken.textContent = step.prompt;
        dom.challengeExpected.textContent = '需同时点击：' + step.expectedNames.join(' + ');
        dom.challengeLevel.textContent = '闯关模式 · 第' + state.challengeCurrentLevel + '/' + state.challengeTotalLevels + '关';

        var progress = Math.round((state.challengeDoneCount / state.challengeTotalCount) * 100);
        state.challengeProgress = progress;
        dom.challengeProgressFill.style.width = progress + '%';
        dom.challengeProgressText.textContent = '进度 ' + state.challengeDoneCount + ' / ' + state.challengeTotalCount;

        if (state.challengeDone) {
            dom.challengeComing.style.display = 'block';
        } else {
            dom.challengeComing.style.display = 'none';
        }
    }

    function setChallengeFeedback(type, text) {
        dom.challengeFeedback.className = 'challenge-feedback challenge-feedback-' + type;
        dom.challengeFeedback.textContent = text;
    }

    function switchMode(mode) {
        state.currentMode = mode;
        clearActiveMap();

        document.querySelectorAll('.top-mode-btn').forEach(function (btn) {
            btn.classList.toggle('top-mode-btn-active', btn.getAttribute('data-mode') === mode);
        });

        if (mode === 'practice') {
            dom.contentWrapper.style.display = 'block';
            dom.challengeLayout.style.display = 'none';
            renderPracticeMode();
        } else {
            dom.contentWrapper.style.display = 'none';
            dom.challengeLayout.style.display = 'block';
            resetChallengeState();
            renderChallengeMode();
        }
    }

    function switchOpera(opera) {
        state.currentOpera = opera;
        clearActiveMap();

        document.querySelectorAll('.scene-btn').forEach(function (btn) {
            btn.classList.toggle('scene-btn-active', btn.getAttribute('data-opera') === opera);
        });

        if (opera === 'jingju') {
            dom.stageBg.src = 'images/background/jingju.png';
        } else {
            dom.stageBg.src = 'images/background/yueju.png';
        }

        renderPracticeMode();
    }

    function clearActiveMap() {
        if (state.hitNameTimer) {
            clearTimeout(state.hitNameTimer);
        }
        dom.hitName.textContent = '点击乐器图片查看名称';
        dom.hitName.classList.remove('hit-name-active');
        state.currentHitName = '';

        Object.keys(state.longPressTimers).forEach(function (key) {
            if (state.longPressTimers[key]) {
                clearTimeout(state.longPressTimers[key]);
            }
        });
        state.longPressTimers = {};
        state.longPressedFlags = {};
    }

    function resetChallengeState() {
        state.challengeStepIndex = 0;
        state.challengeProgress = 0;
        state.challengeDoneCount = 0;
        state.challengeDone = false;
        state.challengeTapMap = {};
        setChallengeFeedback('info', '请根据左侧提示，在短时间窗口内完成合击');
    }

    function bindGlobalEvents() {
        document.querySelectorAll('.top-mode-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var mode = btn.getAttribute('data-mode');
                switchMode(mode);
            });
        });

        document.querySelectorAll('.scene-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var opera = btn.getAttribute('data-opera');
                switchOpera(opera);
            });
        });

        document.addEventListener('keydown', function (e) {
            if (e.repeat || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            var key = e.key.toLowerCase();
            var instId = KEY_MAP[key];
            if (!instId) return;
            var pad = document.querySelector('.pad-btn[data-id="' + instId + '"]');
            if (!pad) return;
            e.preventDefault();
            playFastAudio(instId);
            triggerHitAnim(pad, 150);
            var inst = instruments.find(function (i) { return i.id === instId; });
            if (inst) showHitName(inst.name);
            if (window.Recorder) window.Recorder.recordEvent(instId, 'fast');
        });
    }

    function init() {
        cacheDom();
        initAudioPools();
        bindGlobalEvents();
        renderPracticeMode();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
