(function () {
    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    function initMenu() {
        var toggle = document.querySelector("[data-menu-toggle]");
        var menu = document.querySelector("[data-mobile-menu]");
        if (!toggle || !menu) {
            return;
        }
        toggle.addEventListener("click", function () {
            menu.classList.toggle("is-open");
        });
    }

    function initHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, idx) {
                slide.classList.toggle("is-active", idx === current);
            });
            dots.forEach(function (dot, idx) {
                dot.classList.toggle("is-active", idx === current);
            });
        }

        function schedule() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }

        if (prev) {
            prev.addEventListener("click", function () {
                show(current - 1);
                schedule();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(current + 1);
                schedule();
            });
        }
        dots.forEach(function (dot, idx) {
            dot.addEventListener("click", function () {
                show(idx);
                schedule();
            });
        });
        show(0);
        schedule();
    }

    function initLocalFilter() {
        var input = document.querySelector("[data-filter-input]");
        var select = document.querySelector("[data-filter-select]");
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
        if (!cards.length || (!input && !select)) {
            return;
        }

        function applyFilter() {
            var keyword = input ? input.value.trim().toLowerCase() : "";
            var year = select ? select.value : "";
            var shown = 0;
            cards.forEach(function (card) {
                var haystack = [card.dataset.title, card.dataset.tags, card.dataset.region, card.dataset.year]
                    .join(" ")
                    .toLowerCase();
                var matchesText = !keyword || haystack.indexOf(keyword) !== -1;
                var matchesYear = !year || (card.dataset.year || "").indexOf(year) !== -1;
                var visible = matchesText && matchesYear;
                card.style.display = visible ? "" : "none";
                if (visible) {
                    shown += 1;
                }
            });
            var count = document.querySelector("[data-filter-count]");
            if (count) {
                count.textContent = "当前显示 " + shown + " 部影片";
            }
        }

        if (input) {
            input.addEventListener("input", applyFilter);
        }
        if (select) {
            select.addEventListener("change", applyFilter);
        }
        applyFilter();
    }

    function initSearchPage() {
        var root = document.querySelector("[data-search-page]");
        if (!root || !window.MOVIE_INDEX) {
            return;
        }
        var input = root.querySelector("[data-search-input]");
        var genre = root.querySelector("[data-search-genre]");
        var year = root.querySelector("[data-search-year]");
        var count = root.querySelector("[data-search-count]");
        var results = root.querySelector("[data-search-results]");
        var params = new URLSearchParams(window.location.search);
        var initialQuery = params.get("q") || "";
        if (input) {
            input.value = initialQuery;
        }

        function card(movie) {
            var tags = movie.tags.slice(0, 3).map(function (tag) {
                return "<span>" + escapeHtml(tag) + "</span>";
            }).join("");
            return "<article class=\"movie-card\" data-movie-card>" +
                "<a class=\"card-link\" href=\"" + movie.url + "\">" +
                "<div class=\"poster-wrap\">" +
                "<img src=\"" + movie.cover + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\" onerror=\"this.closest('.poster-wrap').classList.add('poster-missing'); this.remove();\">" +
                "<span class=\"duration\">" + escapeHtml(movie.duration) + "</span>" +
                "<span class=\"play-badge\">播放</span>" +
                "</div>" +
                "<div class=\"card-body\">" +
                "<div class=\"card-meta\"><span class=\"category-pill\">" + escapeHtml(movie.category) + "</span><span>" + escapeHtml(movie.year) + "</span></div>" +
                "<h3>" + escapeHtml(movie.title) + "</h3>" +
                "<p>" + escapeHtml(movie.oneLine) + "</p>" +
                "<div class=\"mini-tags\">" + tags + "</div>" +
                "</div>" +
                "</a>" +
                "</article>";
        }

        function escapeHtml(value) {
            return String(value || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function run() {
            var keyword = input ? input.value.trim().toLowerCase() : "";
            var genreValue = genre ? genre.value : "";
            var yearValue = year ? year.value : "";
            var filtered = window.MOVIE_INDEX.filter(function (movie) {
                var haystack = [movie.title, movie.oneLine, movie.region, movie.year, movie.category].concat(movie.tags || []).join(" ").toLowerCase();
                var matchesText = !keyword || haystack.indexOf(keyword) !== -1;
                var matchesGenre = !genreValue || movie.genres.indexOf(genreValue) !== -1;
                var matchesYear = !yearValue || String(movie.year).indexOf(yearValue) !== -1;
                return matchesText && matchesGenre && matchesYear;
            }).slice(0, 160);
            if (count) {
                count.textContent = "找到 " + filtered.length + " 条结果" + (keyword ? "：" + input.value.trim() : "");
            }
            if (results) {
                results.innerHTML = filtered.length ? filtered.map(card).join("") : "<div class=\"no-results\">没有找到匹配影片，可以换一个关键词或清空筛选条件。</div>";
            }
        }

        [input, genre, year].forEach(function (el) {
            if (el) {
                el.addEventListener("input", run);
                el.addEventListener("change", run);
            }
        });
        run();
    }

    function initPlayers() {
        var boxes = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
        boxes.forEach(function (box) {
            var video = box.querySelector("video");
            var overlay = box.querySelector("[data-player-overlay]");
            var status = box.querySelector("[data-player-status]");
            var src = box.getAttribute("data-video-src");
            if (!video || !src) {
                return;
            }

            function setStatus(text) {
                if (status) {
                    status.textContent = text;
                }
            }

            function hideOverlay() {
                if (overlay) {
                    overlay.classList.add("is-hidden");
                }
            }

            function showOverlay() {
                if (overlay) {
                    overlay.classList.remove("is-hidden");
                }
            }

            if (/\.m3u8(\?|$)/i.test(src)) {
                if (window.Hls && window.Hls.isSupported()) {
                    var hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hls.loadSource(src);
                    hls.attachMedia(video);
                    hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        setStatus("播放源已就绪，点击画面开始播放");
                    });
                    hls.on(window.Hls.Events.ERROR, function (_, data) {
                        if (data && data.fatal) {
                            setStatus("视频加载失败，请稍后重试");
                        }
                    });
                } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = src;
                    setStatus("播放源已就绪，点击画面开始播放");
                } else {
                    setStatus("当前浏览器需要加载 HLS 播放组件后才能播放 m3u8");
                }
            } else {
                video.src = src;
                setStatus("播放源已就绪，点击画面开始播放");
            }

            if (overlay) {
                overlay.addEventListener("click", function () {
                    video.play();
                });
            }
            video.addEventListener("play", hideOverlay);
            video.addEventListener("pause", showOverlay);
            video.addEventListener("ended", showOverlay);
            video.addEventListener("error", function () {
                setStatus("视频加载失败，请稍后重试");
            });
        });
    }

    ready(function () {
        initMenu();
        initHero();
        initLocalFilter();
        initSearchPage();
        initPlayers();
    });
}());
