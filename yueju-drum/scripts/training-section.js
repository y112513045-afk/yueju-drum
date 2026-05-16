(function () {
    'use strict';

    var PATTERNS = {
        easy: [
            { token: '台', ids: ['small-luo'] },
            { token: '台', ids: ['small-luo'] },
            { token: '七', ids: ['nao-bo'] },
            { token: '台', ids: ['small-luo'] },
            { token: '台', ids: ['small-luo'] },
            { token: '冬', ids: ['big-luo'] }
        ],
        medium: [
            { token: '仓', ids: ['big-luo', 'nao-bo', 'small-luo'] },
            { token: '台', ids: ['small-luo'] },
            { token: '才', ids: ['nao-bo', 'small-luo'] },
            { token: '台', ids: ['small-luo'] },
            { token: '仓', ids: ['big-luo', 'nao-bo', 'small-luo'] },
            { token: '七', ids: ['nao-bo'] },
            { token: '台', ids: ['small-luo'] },
            { token: '才', ids: ['nao-bo', 'small-luo'] },
            { token: '仓', ids: ['big-luo', 'nao-bo', 'small-luo'] },
            { token: '仓', ids: ['big-luo', 'nao-bo', 'small-luo'] }
        ],
        hard: [
            { token: '仓', ids: ['big-luo', 'nao-bo', 'small-luo'] },
            { token: '才', ids: ['nao-bo', 'small-luo'] },
            { token: '台', ids: ['small-luo'] },
            { token: '七', ids: ['nao-bo'] },
            { token: '仓', ids: ['big-luo', 'nao-bo', 'small-luo'] },
            { token: '台', ids: ['small-luo'] },
            { token: '才', ids: ['nao-bo', 'small-luo'] },
            { token: '仓', ids: ['big-luo', 'nao-bo', 'small-luo'] },
            { token: '冬', ids: ['big-luo'] },
            { token: '台', ids: ['small-luo'] },
            { token: '才', ids: ['nao-bo', 'small-luo'] },
            { token: '仓', ids: ['big-luo', 'nao-bo', 'small-luo'] }
        ]
    };

    var INSTRUMENT_INFO = {
        'big-luo': { name: '大锣', image: 'images/instruments/daluo.png', audio: 'audio/daluo-f.m4a' },
        'nao-bo': { name: '铙钹', image: 'images/instruments/naobo.png', audio: 'audio/naobo-f.m4a' },
        'small-luo': { name: '小锣', image: 'images/instruments/xiaoluo.png', audio: 'audio/xiaoluo-f.m4a' }
    };

    var TEMPO = { easy: 1600, medium: 1200, hard: 800 };

    var state = {
        difficulty: 'easy',
        status: 'idle',
        pattern: [],
        currentBeat: -1,
        score: 0,
        totalHits: 0,
        perfect: 0,
        good: 0,
        miss: 0,
        timer: null,
        beatWindow: 400,
        userInput: {},
        inputTimer: null
    };

    var dom = {};

    function init() {
        dom.diffBtns = document.querySelectorAll('.train-diff-btn');
        dom.patternDisplay = document.getElementById('patternDisplay');
        dom.timeline = document.getElementById('timeline');
        dom.progressFill = document.getElementById('trainProgressFill');
        dom.progressText = document.getElementById('trainProgressText');
        dom.scoreVal = document.getElementById('trainScoreVal');
        dom.comboVal = document.getElementById('trainComboVal');
        dom.comboWrap = document.getElementById('trainComboWrap');
        dom.resultPanel = document.getElementById('trainResultPanel');
        dom.resultScore = document.getElementById('trainResultScore');
        dom.resultPerfect = document.getElementById('trainResultPerfect');
        dom.resultGood = document.getElementById('trainResultGood');
        dom.resultMiss = document.getElementById('trainResultMiss');
        dom.resultGrade = document.getElementById('trainResultGrade');
        dom.startBtn = document.getElementById('trainStartBtn');
        dom.stopBtn = document.getElementById('trainStopBtn');
        dom.hitZone = document.getElementById('trainHitZone');
        dom.hitFeedback = document.getElementById('trainHitFeedback');

        dom.diffBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (state.status !== 'idle') return;
                dom.diffBtns.forEach(function (b) { b.classList.remove('train-diff-active'); });
                btn.classList.add('train-diff-active');
                state.difficulty = btn.getAttribute('data-diff');
            });
        });

        dom.startBtn.addEventListener('click', startTraining);
        dom.stopBtn.addEventListener('click', stopTraining);

        renderPatternPreview();
    }

    function renderPatternPreview() {
        var pattern = PATTERNS[state.difficulty];
        dom.patternDisplay.innerHTML = '';
        pattern.forEach(function (step, i) {
            var el = document.createElement('span');
            el.className = 'train-token';
            el.textContent = step.token;
            el.setAttribute('data-index', i);
            dom.patternDisplay.appendChild(el);
        });
    }

    function startTraining() {
        if (state.status === 'playing') return;

        state.pattern = PATTERNS[state.difficulty].slice();
        state.currentBeat = -1;
        state.score = 0;
        state.totalHits = 0;
        state.perfect = 0;
        state.good = 0;
        state.miss = 0;
        state.userInput = {};
        state.status = 'playing';

        dom.scoreVal.textContent = '0';
        dom.comboWrap.style.display = 'none';
        dom.resultPanel.style.display = 'none';
        dom.startBtn.disabled = true;
        dom.stopBtn.disabled = false;

        renderPatternPreview();
        renderTimeline();

        var tempo = TEMPO[state.difficulty];
        nextBeat();
        state.timer = setInterval(nextBeat, tempo);
    }

    function stopTraining() {
        state.status = 'idle';
        if (state.timer) { clearInterval(state.timer); state.timer = null; }
        if (state.inputTimer) { clearTimeout(state.inputTimer); state.inputTimer = null; }
        dom.startBtn.disabled = false;
        dom.stopBtn.disabled = true;
        dom.hitFeedback.className = 'train-hit-feedback';
        showResult();
    }

    function nextBeat() {
        state.currentBeat++;
        if (state.currentBeat >= state.pattern.length) {
            stopTraining();
            return;
        }

        var step = state.pattern[state.currentBeat];
        state.userInput = {};
        state.totalHits++;

        highlightBeat(state.currentBeat);
        updateProgress();

        if (dom.hitZone) {
            dom.hitZone.querySelector('.train-hit-token').textContent = step.token;
        }

        var tempo = TEMPO[state.difficulty];
        state.beatWindow = tempo * 0.7;

        if (state.inputTimer) clearTimeout(state.inputTimer);
        state.inputTimer = setTimeout(function () {
            if (state.status !== 'playing') return;
            if (!state.userInput.hit) {
                state.miss++;
                showFeedback('miss', '未命中');
            }
            dom.comboVal.textContent = state.perfect + state.good;
            if (state.perfect + state.good > 0) {
                dom.comboWrap.style.display = 'inline';
            }
        }, state.beatWindow);
    }

    function highlightBeat(index) {
        var tokens = dom.patternDisplay.querySelectorAll('.train-token');
        tokens.forEach(function (t, i) {
            t.classList.toggle('train-token-active', i === index);
            t.classList.toggle('train-token-done', i < index);
        });

        var cells = dom.timeline.querySelectorAll('.train-beat-cell');
        cells.forEach(function (c, i) {
            c.classList.toggle('train-beat-active', i === index);
            c.classList.toggle('train-beat-done', i < index);
        });
    }

    function updateProgress() {
        var pct = Math.round((state.currentBeat / state.pattern.length) * 100);
        dom.progressFill.style.width = pct + '%';
        dom.progressText.textContent = pct + '%';
    }

    function renderTimeline() {
        dom.timeline.innerHTML = '';
        state.pattern.forEach(function (step, i) {
            var cell = document.createElement('div');
            cell.className = 'train-beat-cell';
            cell.setAttribute('data-index', i);

            var tokenEl = document.createElement('span');
            tokenEl.className = 'train-beat-token';
            tokenEl.textContent = step.token;

            var imgRow = document.createElement('div');
            imgRow.className = 'train-beat-imgs';
            step.ids.forEach(function (id) {
                var info = INSTRUMENT_INFO[id];
                if (!info) return;
                var img = document.createElement('img');
                img.src = info.image;
                img.alt = info.name;
                img.title = info.name;
                imgRow.appendChild(img);
            });

            cell.appendChild(tokenEl);
            cell.appendChild(imgRow);
            dom.timeline.appendChild(cell);
        });
    }

    function onInstrumentHit(instrumentId) {
        if (state.status !== 'playing' || state.currentBeat < 0) return;

        var step = state.pattern[state.currentBeat];
        if (!step) return;

        if (step.ids.indexOf(instrumentId) === -1) {
            showFeedback('miss', '错误乐器');
            return;
        }

        if (state.userInput.hit) return;

        state.userInput.hit = true;
        state.userInput.ids = state.userInput.ids || [];
        state.userInput.ids.push(instrumentId);

        var allHit = step.ids.every(function (id) {
            return state.userInput.ids.indexOf(id) !== -1;
        });

        if (allHit) {
            var points = 100;
            state.perfect++;
            state.score += points;
            showFeedback('perfect', '完美 +' + points);
        } else {
            var pts = 50;
            state.good++;
            state.score += pts;
            showFeedback('good', '良好 +' + pts);
        }

        dom.scoreVal.textContent = state.score;
    }

    function showFeedback(type, text) {
        dom.hitFeedback.className = 'train-hit-feedback train-feedback-' + type;
        dom.hitFeedback.textContent = text;
        dom.hitFeedback.style.opacity = '1';
        setTimeout(function () { dom.hitFeedback.style.opacity = '0'; }, 600);
    }

    function showResult() {
        var total = state.perfect + state.good + state.miss;
        var accuracy = total > 0 ? Math.round(((state.perfect + state.good) / total) * 100) : 0;
        var grade = 'D';
        if (accuracy >= 95) grade = 'S';
        else if (accuracy >= 85) grade = 'A';
        else if (accuracy >= 70) grade = 'B';
        else if (accuracy >= 50) grade = 'C';

        dom.resultScore.textContent = state.score;
        dom.resultPerfect.textContent = state.perfect;
        dom.resultGood.textContent = state.good;
        dom.resultMiss.textContent = state.miss;
        dom.resultGrade.textContent = grade;
        dom.resultPanel.style.display = 'block';
        dom.progressFill.style.width = '100%';
        dom.progressText.textContent = '100%';
    }

    window.TrainModule = {
        hit: onInstrumentHit,
        getState: function () { return state; }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
