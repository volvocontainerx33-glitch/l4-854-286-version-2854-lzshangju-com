(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    ready(function () {
        var toggle = document.querySelector("[data-menu-toggle]");
        var menu = document.querySelector("[data-mobile-menu]");
        if (toggle && menu) {
            toggle.addEventListener("click", function () {
                menu.classList.toggle("is-open");
            });
        }

        var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
        var next = document.querySelector("[data-hero-next]");
        var prev = document.querySelector("[data-hero-prev]");
        var active = 0;

        function showSlide(index) {
            if (!slides.length) {
                return;
            }
            active = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === active);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === active);
            });
        }

        if (slides.length) {
            showSlide(0);
            dots.forEach(function (dot, index) {
                dot.addEventListener("click", function () {
                    showSlide(index);
                });
            });
            if (next) {
                next.addEventListener("click", function () {
                    showSlide(active + 1);
                });
            }
            if (prev) {
                prev.addEventListener("click", function () {
                    showSlide(active - 1);
                });
            }
            window.setInterval(function () {
                showSlide(active + 1);
            }, 6500);
        }

        var input = document.querySelector("[data-search-input]");
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
        var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-filter-value]"));
        var sort = document.querySelector("[data-sort]");
        var empty = document.querySelector("[data-empty]");
        var currentFilter = "all";

        function normalize(value) {
            return String(value || "").toLowerCase().trim();
        }

        function applyCards() {
            var query = input ? normalize(input.value) : "";
            var visible = 0;
            cards.forEach(function (card) {
                var haystack = normalize(card.getAttribute("data-search"));
                var type = normalize(card.getAttribute("data-type"));
                var region = normalize(card.getAttribute("data-region"));
                var matchesQuery = !query || haystack.indexOf(query) !== -1;
                var matchesFilter = currentFilter === "all" || type.indexOf(currentFilter) !== -1 || region.indexOf(currentFilter) !== -1;
                var show = matchesQuery && matchesFilter;
                card.style.display = show ? "" : "none";
                if (show) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.style.display = visible ? "none" : "block";
            }
        }

        function applySort() {
            if (!sort || !cards.length) {
                return;
            }
            var value = sort.value;
            var parent = cards[0].parentElement;
            var sorted = cards.slice();
            sorted.sort(function (a, b) {
                if (value === "rating") {
                    return Number(b.getAttribute("data-rating")) - Number(a.getAttribute("data-rating"));
                }
                if (value === "year") {
                    return Number(b.getAttribute("data-year")) - Number(a.getAttribute("data-year"));
                }
                if (value === "views") {
                    return Number(b.getAttribute("data-views")) - Number(a.getAttribute("data-views"));
                }
                return Number(a.getAttribute("data-index")) - Number(b.getAttribute("data-index"));
            });
            sorted.forEach(function (card) {
                parent.appendChild(card);
            });
            cards = sorted;
            applyCards();
        }

        if (input && cards.length) {
            input.addEventListener("input", applyCards);
        }
        if (tabs.length && cards.length) {
            tabs.forEach(function (tab) {
                tab.addEventListener("click", function () {
                    currentFilter = normalize(tab.getAttribute("data-filter-value"));
                    tabs.forEach(function (item) {
                        item.classList.toggle("is-active", item === tab);
                    });
                    applyCards();
                });
            });
        }
        if (sort && cards.length) {
            sort.addEventListener("change", applySort);
        }
        if (cards.length) {
            applyCards();
        }
    });

    window.setupPlayer = function (source) {
        var box = document.querySelector("[data-player]");
        if (!box) {
            return;
        }
        var video = box.querySelector("video");
        var cover = box.querySelector("[data-player-cover]");
        var button = box.querySelector("[data-play-button]");
        var started = false;
        var hls = null;

        function begin() {
            if (!video || started) {
                return;
            }
            started = true;
            if (cover) {
                cover.classList.add("is-hidden");
            }
            video.setAttribute("controls", "controls");
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(source);
                hls.attachMedia(video);
            } else {
                video.src = source;
            }
            var promise = video.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {});
            }
        }

        if (button) {
            button.addEventListener("click", begin);
        }
        if (cover) {
            cover.addEventListener("click", begin);
        }
        if (video) {
            video.addEventListener("click", function () {
                if (!started) {
                    begin();
                }
            });
        }
    };
})();
