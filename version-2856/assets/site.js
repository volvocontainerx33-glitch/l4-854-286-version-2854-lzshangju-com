(function() {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    function getText(value) {
        return (value || "").toString().toLowerCase();
    }

    function initMenu() {
        var toggle = document.querySelector("[data-menu-toggle]");
        var panel = document.querySelector("[data-mobile-panel]");
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener("click", function() {
            panel.classList.toggle("is-open");
        });
    }

    function initGlobalSearch() {
        document.querySelectorAll("[data-site-search]").forEach(function(form) {
            form.addEventListener("submit", function(event) {
                event.preventDefault();
                var input = form.querySelector("input[name='q']");
                var query = input ? input.value.trim() : "";
                var target = "./search.html";
                if (query) {
                    target += "?q=" + encodeURIComponent(query);
                }
                window.location.href = target;
            });
        });
    }

    function filterCards(panel) {
        var section = panel.closest(".list-section") || document;
        var list = section.querySelector("[data-card-list]");
        if (!list) {
            return;
        }
        var input = panel.querySelector("[data-card-search]");
        var chips = Array.prototype.slice.call(panel.querySelectorAll("[data-filter-chip]"));
        var activeChip = "all";

        function apply() {
            var keyword = getText(input ? input.value.trim() : "");
            var chip = getText(activeChip);
            list.querySelectorAll("[data-movie-card]").forEach(function(card) {
                var haystack = getText([
                    card.dataset.title,
                    card.dataset.genre,
                    card.dataset.region,
                    card.dataset.year,
                    card.dataset.type,
                    card.textContent
                ].join(" "));
                var keywordMatch = !keyword || haystack.indexOf(keyword) !== -1;
                var chipMatch = chip === "all" || haystack.indexOf(chip) !== -1;
                card.classList.toggle("is-hidden", !(keywordMatch && chipMatch));
            });
        }

        if (input) {
            input.addEventListener("input", apply);
        }
        chips.forEach(function(button) {
            button.addEventListener("click", function() {
                chips.forEach(function(item) {
                    item.classList.remove("is-active");
                });
                button.classList.add("is-active");
                activeChip = button.getAttribute("data-filter-chip") || "all";
                apply();
            });
        });
        var params = new URLSearchParams(window.location.search);
        var query = params.get("q");
        if (query && input) {
            input.value = query;
            apply();
        }
    }

    function initFilters() {
        document.querySelectorAll("[data-filter-panel]").forEach(filterCards);
        var autofocus = document.querySelector("[data-autofocus-search]");
        if (autofocus && window.location.search) {
            autofocus.focus();
        }
    }

    function initHero() {
        var slider = document.querySelector("[data-hero-slider]");
        if (!slider) {
            return;
        }
        var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
        var next = slider.querySelector("[data-hero-next]");
        var prev = slider.querySelector("[data-hero-prev]");
        var index = 0;
        var timer;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function(slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === index);
            });
            dots.forEach(function(dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === index);
            });
        }

        function start() {
            timer = window.setInterval(function() {
                show(index + 1);
            }, 5200);
        }

        function restart() {
            window.clearInterval(timer);
            start();
        }

        if (next) {
            next.addEventListener("click", function() {
                show(index + 1);
                restart();
            });
        }
        if (prev) {
            prev.addEventListener("click", function() {
                show(index - 1);
                restart();
            });
        }
        dots.forEach(function(dot, dotIndex) {
            dot.addEventListener("click", function() {
                show(dotIndex);
                restart();
            });
        });
        if (slides.length > 1) {
            start();
        }
    }

    window.initMoviePlayer = function(mediaUrl) {
        var video = document.querySelector(".movie-player-video");
        var cover = document.querySelector(".player-cover");
        var attached = false;
        if (!video || !mediaUrl) {
            return;
        }

        function attach() {
            if (attached) {
                return;
            }
            attached = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = mediaUrl;
            } else if (window.Hls && window.Hls.isSupported()) {
                var hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });
                hls.loadSource(mediaUrl);
                hls.attachMedia(video);
                video.hlsInstance = hls;
            } else {
                video.src = mediaUrl;
            }
        }

        function play() {
            attach();
            if (cover) {
                cover.classList.add("is-hidden");
            }
            var promise = video.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(function() {});
            }
        }

        if (cover) {
            cover.addEventListener("click", play);
        }
        video.addEventListener("click", function() {
            if (!attached || video.paused) {
                play();
            }
        });
        video.addEventListener("play", function() {
            if (cover) {
                cover.classList.add("is-hidden");
            }
        });
    };

    ready(function() {
        initMenu();
        initGlobalSearch();
        initFilters();
        initHero();
    });
})();
