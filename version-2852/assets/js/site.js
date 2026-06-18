(function () {
    'use strict';

    function ready(callback) {
        if (document.readyState !== 'loading') {
            callback();
            return;
        }
        document.addEventListener('DOMContentLoaded', callback);
    }

    function normalize(value) {
        return String(value || '').toLowerCase().replace(/\s+/g, '');
    }

    function initNavigation() {
        var button = document.querySelector('[data-nav-toggle]');
        var nav = document.getElementById('siteNav');
        if (!button || !nav) {
            return;
        }
        button.addEventListener('click', function () {
            var isOpen = nav.classList.toggle('is-open');
            button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }

    function initHero() {
        var hero = document.querySelector('[data-hero]');
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var prev = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(index - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                show(index + 1);
                start();
            });
        }
        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.getAttribute('data-hero-dot')) || 0);
                start();
            });
        });
        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function initFilters() {
        var forms = Array.prototype.slice.call(document.querySelectorAll('.js-filter-form'));
        forms.forEach(function (form) {
            var scope = form.parentElement ? form.parentElement.querySelector('[data-filter-scope]') : null;
            if (!scope) {
                scope = document.querySelector('[data-filter-scope]');
            }
            if (!scope) {
                return;
            }
            var cards = Array.prototype.slice.call(scope.querySelectorAll('.movie-card'));
            var fields = Array.prototype.slice.call(form.querySelectorAll('[data-filter-field]'));
            var count = form.querySelector('[data-visible-count]');
            var reset = form.querySelector('[data-filter-reset]');

            function getField(name) {
                var input = form.querySelector('[data-filter-field="' + name + '"]');
                return input ? input.value : '';
            }

            function apply() {
                var query = normalize(getField('q'));
                var category = normalize(getField('category'));
                var year = normalize(getField('year'));
                var region = normalize(getField('region'));
                var type = normalize(getField('type'));
                var visible = 0;

                cards.forEach(function (card) {
                    var haystack = normalize([
                        card.getAttribute('data-title'),
                        card.getAttribute('data-genre'),
                        card.getAttribute('data-region'),
                        card.getAttribute('data-year'),
                        card.getAttribute('data-type'),
                        card.getAttribute('data-category')
                    ].join(' '));
                    var matches = true;
                    matches = matches && (!query || haystack.indexOf(query) !== -1);
                    matches = matches && (!category || normalize(card.getAttribute('data-category')) === category);
                    matches = matches && (!year || normalize(card.getAttribute('data-year')) === year);
                    matches = matches && (!region || normalize(card.getAttribute('data-region')) === region);
                    matches = matches && (!type || normalize(card.getAttribute('data-type')).indexOf(type) !== -1);
                    card.hidden = !matches;
                    if (matches) {
                        visible += 1;
                    }
                });

                if (count) {
                    count.textContent = String(visible);
                }
            }

            fields.forEach(function (field) {
                field.addEventListener('input', apply);
                field.addEventListener('change', apply);
            });
            if (reset) {
                reset.addEventListener('click', function () {
                    fields.forEach(function (field) {
                        field.value = '';
                    });
                    apply();
                });
            }
            apply();
        });
    }

    function initPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll('[data-video-player]'));
        players.forEach(function (player) {
            var video = player.querySelector('video');
            var source = player.getAttribute('data-video-src');
            var playButtons = Array.prototype.slice.call(player.querySelectorAll('[data-player-play]'));
            var muteButton = player.querySelector('[data-player-mute]');
            var fullscreenButton = player.querySelector('[data-player-fullscreen]');
            var errorBox = player.querySelector('[data-player-error]');
            var hlsInstance = null;

            function showError(message) {
                if (!errorBox) {
                    return;
                }
                errorBox.textContent = message;
                errorBox.hidden = false;
            }

            function setupSource() {
                if (!video || !source) {
                    showError('未找到可播放的 m3u8 片源。');
                    return;
                }
                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.ERROR, function (_, data) {
                        if (!data || !data.fatal) {
                            return;
                        }
                        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                            showError('网络加载异常，正在尝试重新连接片源。');
                            hlsInstance.startLoad();
                        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                            showError('媒体解码异常，正在尝试恢复播放。');
                            hlsInstance.recoverMediaError();
                        } else {
                            showError('当前浏览器无法继续播放该片源。');
                            hlsInstance.destroy();
                        }
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                } else {
                    showError('当前浏览器不支持 HLS 播放，请更换浏览器或启用 HLS 支持。');
                }
            }

            function togglePlay() {
                if (!video) {
                    return;
                }
                if (video.paused) {
                    var promise = video.play();
                    if (promise && typeof promise.catch === 'function') {
                        promise.catch(function () {
                            showError('浏览器阻止了自动播放，请再次点击播放按钮。');
                        });
                    }
                } else {
                    video.pause();
                }
            }

            setupSource();
            playButtons.forEach(function (button) {
                button.addEventListener('click', togglePlay);
            });
            if (video) {
                video.addEventListener('click', togglePlay);
                video.addEventListener('play', function () {
                    player.classList.add('is-playing');
                });
                video.addEventListener('pause', function () {
                    player.classList.remove('is-playing');
                });
            }
            if (muteButton && video) {
                muteButton.addEventListener('click', function () {
                    video.muted = !video.muted;
                    muteButton.textContent = video.muted ? '取消静音' : '静音';
                });
            }
            if (fullscreenButton) {
                fullscreenButton.addEventListener('click', function () {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else if (player.requestFullscreen) {
                        player.requestFullscreen();
                    }
                });
            }
            window.addEventListener('beforeunload', function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                }
            });
        });
    }

    ready(function () {
        initNavigation();
        initHero();
        initFilters();
        initPlayers();
    });
}());
