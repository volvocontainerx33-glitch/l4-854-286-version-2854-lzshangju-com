(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function setupMenu() {
    var button = document.querySelector(".menu-toggle");
    var nav = document.querySelector(".mobile-nav");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setupHero() {
    var section = document.querySelector(".hero-section[data-hero]");
    if (!section) {
      return;
    }
    var slides;
    try {
      slides = JSON.parse(section.getAttribute("data-hero"));
    } catch (error) {
      slides = [];
    }
    if (!slides.length) {
      return;
    }
    var bg = section.querySelector(".hero-bg");
    var title = section.querySelector(".hero-copy h1");
    var meta = section.querySelector(".hero-meta");
    var desc = section.querySelector(".hero-copy p");
    var tags = section.querySelector(".hero-tags");
    var poster = section.querySelector(".hero-poster-card img");
    var posterLink = section.querySelector(".hero-poster-card a");
    var primary = section.querySelector(".primary-btn");
    var thumbs = Array.prototype.slice.call(section.querySelectorAll(".hero-thumb"));
    var index = 0;

    function render(nextIndex) {
      index = nextIndex;
      var item = slides[index];
      if (!item) {
        return;
      }
      if (bg) {
        bg.style.backgroundImage = "url('" + item.cover + "')";
      }
      if (title) {
        title.textContent = item.title;
      }
      if (meta) {
        meta.innerHTML = "<span>★ " + item.rating + "</span><span>" + item.year + "</span><span>" + item.region + "</span><span>" + item.duration + "</span>";
      }
      if (desc) {
        desc.textContent = item.oneLine;
      }
      if (tags) {
        tags.innerHTML = item.genres.map(function (name) {
          return "<span>" + name + "</span>";
        }).join("");
      }
      if (poster) {
        poster.src = item.cover;
        poster.alt = item.title;
      }
      if (posterLink) {
        posterLink.href = item.url;
      }
      if (primary) {
        primary.href = item.url;
      }
      thumbs.forEach(function (thumb, thumbIndex) {
        thumb.classList.toggle("active", thumbIndex === index);
      });
    }

    thumbs.forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        var next = Number(thumb.getAttribute("data-hero-index"));
        if (Number.isFinite(next)) {
          render(next);
        }
      });
    });

    window.setInterval(function () {
      render((index + 1) % slides.length);
    }, 6500);
  }

  function setupSearch() {
    var input = document.querySelector(".site-search");
    var genre = document.querySelector(".filter-genre");
    var region = document.querySelector(".filter-region");
    var lists = Array.prototype.slice.call(document.querySelectorAll(".searchable-list"));
    var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card, .rank-item"));
    if (!input && !genre && !region) {
      return;
    }

    function value(node) {
      return node ? node.value.trim().toLowerCase() : "";
    }

    function filter() {
      var query = value(input);
      var genreValue = value(genre);
      var regionValue = value(region);
      var visibleCount = 0;
      cards.forEach(function (card) {
        var text = [
          card.getAttribute("data-title") || "",
          card.getAttribute("data-region") || "",
          card.getAttribute("data-genre") || "",
          card.getAttribute("data-tags") || ""
        ].join(" ").toLowerCase();
        var cardGenre = (card.getAttribute("data-genre") || "").toLowerCase();
        var cardRegion = (card.getAttribute("data-region") || "").toLowerCase();
        var matched = true;
        if (query && text.indexOf(query) === -1) {
          matched = false;
        }
        if (genreValue && cardGenre.indexOf(genreValue) === -1) {
          matched = false;
        }
        if (regionValue && cardRegion.indexOf(regionValue) === -1) {
          matched = false;
        }
        card.style.display = matched ? "" : "none";
        if (matched) {
          visibleCount += 1;
        }
      });
      lists.forEach(function (list) {
        var empty = list.parentElement ? list.parentElement.querySelector(".empty-state") : null;
        if (empty) {
          empty.classList.toggle("show", visibleCount === 0);
        }
      });
    }

    [input, genre, region].forEach(function (node) {
      if (node) {
        node.addEventListener("input", filter);
        node.addEventListener("change", filter);
      }
    });
  }

  window.initMoviePlayer = function (src) {
    ready(function () {
      var video = document.getElementById("movie-video");
      var cover = document.querySelector(".player-cover");
      var loaded = false;
      var hls = null;
      if (!video || !src) {
        return;
      }

      function attach() {
        if (loaded) {
          return;
        }
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
          loaded = true;
          return;
        }
        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({ enableWorker: true });
          hls.loadSource(src);
          hls.attachMedia(video);
          loaded = true;
          return;
        }
        video.src = src;
        loaded = true;
      }

      function play() {
        attach();
        if (cover) {
          cover.classList.add("is-hidden");
        }
        video.controls = true;
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {});
        }
      }

      if (cover) {
        cover.addEventListener("click", play);
      }
      video.addEventListener("click", function () {
        if (video.paused) {
          play();
        }
      });
      video.addEventListener("play", function () {
        if (cover) {
          cover.classList.add("is-hidden");
        }
      });
      window.addEventListener("pagehide", function () {
        if (hls && typeof hls.destroy === "function") {
          hls.destroy();
        }
      });
    });
  };

  ready(function () {
    setupMenu();
    setupHero();
    setupSearch();
  });
})();
