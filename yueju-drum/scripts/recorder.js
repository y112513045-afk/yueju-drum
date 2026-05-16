(function () {
    'use strict';

    window.Recorder = {
        state: 'idle',
        events: [],
        startTime: 0,
        pauseTime: 0,
        totalPaused: 0,
        timerInterval: null,
        playTimer: null,
        onStateChange: null,
        onTimeUpdate: null,

        init: function (opts) {
            this.btnRecord = document.getElementById(opts.btnRecord || 'btnRecord');
            this.btnStop = document.getElementById(opts.btnStop || 'btnStop');
            this.btnPause = document.getElementById(opts.btnPause || 'btnPause');
            this.btnPlay = document.getElementById(opts.btnPlay || 'btnPlay');
            this.timeDisplay = document.getElementById(opts.timeDisplay || 'recTime');
            this.statusDisplay = document.getElementById(opts.statusDisplay || 'recStatus');
            this.bindEvents();
            this.updateUI();
        },

        bindEvents: function () {
            var self = this;
            if (this.btnRecord) this.btnRecord.addEventListener('click', function () { self.start(); });
            if (this.btnStop) this.btnStop.addEventListener('click', function () { self.stop(); });
            if (this.btnPause) this.btnPause.addEventListener('click', function () { self.pause(); });
            if (this.btnPlay) this.btnPlay.addEventListener('click', function () { self.playback(); });
        },

        recordEvent: function (instrumentId, type) {
            if (this.state !== 'recording') return;
            var elapsed = Date.now() - this.startTime - this.totalPaused;
            this.events.push({ id: instrumentId, type: type, time: elapsed });
        },

        start: function () {
            if (this.state === 'paused') {
                this.totalPaused += Date.now() - this.pauseTime;
                this.state = 'recording';
                this.startTimer();
                this.updateUI();
                return;
            }
            this.events = [];
            this.startTime = Date.now();
            this.totalPaused = 0;
            this.state = 'recording';
            this.startTimer();
            this.updateUI();
        },

        stop: function () {
            this.stopTimer();
            this.state = 'idle';
            this.updateUI();
        },

        pause: function () {
            if (this.state !== 'recording') return;
            this.pauseTime = Date.now();
            this.stopTimer();
            this.state = 'paused';
            this.updateUI();
        },

        playback: function () {
            if (this.events.length === 0) return;
            if (this.state === 'playing') {
                this.stopPlayback();
                this.state = 'idle';
                this.updateUI();
                return;
            }
            this.state = 'playing';
            this.updateUI();
            var self = this;
            var startTime = Date.now();
            var index = 0;

            function scheduleNext() {
                if (index >= self.events.length || self.state !== 'playing') {
                    self.state = 'idle';
                    self.updateUI();
                    return;
                }
                var evt = self.events[index];
                var delay = evt.time - (Date.now() - startTime);
                if (delay < 0) delay = 0;

                self.playTimer = setTimeout(function () {
                    if (self.state !== 'playing') return;
                    self.triggerPlayEvent(evt);
                    index++;
                    scheduleNext();
                }, delay);
            }

            scheduleNext();
        },

        stopPlayback: function () {
            if (this.playTimer) {
                clearTimeout(this.playTimer);
                this.playTimer = null;
            }
        },

        triggerPlayEvent: function (evt) {
            var btn = document.querySelector('[data-id="' + evt.id + '"]');
            if (!btn) return;
            btn.classList.remove('hit-anim');
            void btn.offsetWidth;
            btn.classList.add('hit-anim');
            setTimeout(function () { btn.classList.remove('hit-anim'); }, 150);
            if (typeof window.playInstrumentAudio === 'function') {
                window.playInstrumentAudio(evt.id, evt.type);
            }
        },

        startTimer: function () {
            var self = this;
            this.timerInterval = setInterval(function () { self.updateTime(); }, 100);
        },

        stopTimer: function () {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        },

        updateTime: function () {
            if (!this.timeDisplay) return;
            var elapsed = Date.now() - this.startTime - this.totalPaused;
            this.timeDisplay.textContent = this.formatTime(elapsed);
        },

        formatTime: function (ms) {
            var s = Math.floor(ms / 1000);
            var m = Math.floor(s / 60);
            s = s % 60;
            return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
        },

        updateUI: function () {
            var s = this.state;
            if (this.btnRecord) {
                this.btnRecord.disabled = (s === 'recording' || s === 'playing');
                this.btnRecord.classList.toggle('rec-btn-active', s === 'recording');
            }
            if (this.btnStop) {
                this.btnStop.disabled = (s === 'idle');
            }
            if (this.btnPause) {
                this.btnPause.disabled = (s !== 'recording');
                this.btnPause.classList.toggle('rec-btn-active', s === 'paused');
            }
            if (this.btnPlay) {
                this.btnPlay.disabled = (s === 'recording' || s === 'playing' || this.events.length === 0);
                this.btnPlay.classList.toggle('rec-btn-active', s === 'playing');
            }
            if (this.statusDisplay) {
                var labels = { idle: '待机', recording: '录制中', paused: '已暂停', playing: '回放中' };
                this.statusDisplay.textContent = labels[s] || '';
            }
            if (s === 'idle' && this.timeDisplay) {
                this.timeDisplay.textContent = '00:00';
            }
        }
    };
})();
