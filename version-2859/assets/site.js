(function () {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupNav() {
    var toggle = $('.nav-toggle');
    var mobile = $('#mobile-nav');
    if (!toggle || !mobile) return;
    toggle.addEventListener('click', function () {
      var open = mobile.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function setupHero() {
    var root = $('[data-hero-slider]');
    if (!root) return;
    var slides = $all('.hero-slide', root);
    var dots = $all('[data-hero-dot]', root);
    var prev = $('[data-hero-prev]', root);
    var next = $('[data-hero-next]', root);
    if (!slides.length) return;
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function restart() {
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    restart();
  }

  function setupGlobalSearch() {
    var input = $('[data-global-search]');
    var results = $('[data-global-results]');
    var data = window.__SITE_INDEX__ || [];
    if (!input || !results || !data.length) return;

    function render(items) {
      if (!items.length) {
        results.classList.remove('is-visible');
        results.innerHTML = '';
        return;
      }
      results.innerHTML = items.slice(0, 12).map(function (item) {
        return '<a class="result-link" href="' + item.url + '">' +
          '<img src="' + item.poster + '" alt="' + escapeHtml(item.title) + '">' +
          '<span><strong>' + escapeHtml(item.title) + '</strong>' +
          '<span>' + escapeHtml(item.year + ' · ' + item.region + ' · ' + item.genre) + '</span></span>' +
          '</a>';
      }).join('');
      results.classList.add('is-visible');
    }

    input.addEventListener('input', function () {
      var query = input.value.trim().toLowerCase();
      if (query.length < 1) {
        render([]);
        return;
      }
      var matched = data.filter(function (item) {
        return item.search.indexOf(query) !== -1;
      });
      render(matched);
    });
  }

  function setupLocalFilters() {
    var list = $('[data-filter-list]');
    if (!list) return;
    var cards = $all('[data-card]', list);
    var search = $('.js-local-search');
    var selects = $all('.filter-select');
    var genreSelect = selects.filter(function (select) {
      return select.getAttribute('data-filter') === 'genre';
    })[0];

    if (genreSelect) {
      var genres = [];
      cards.forEach(function (card) {
        var genre = card.getAttribute('data-genre') || '';
        genre.split(/[\/，,、\s]+/).forEach(function (part) {
          part = part.trim();
          if (part && genres.indexOf(part) === -1) genres.push(part);
        });
      });
      genres.slice(0, 60).forEach(function (genre) {
        var option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreSelect.appendChild(option);
      });
    }

    function pass(card) {
      var text = [
        card.getAttribute('data-title'),
        card.getAttribute('data-region'),
        card.getAttribute('data-year'),
        card.getAttribute('data-type'),
        card.getAttribute('data-genre'),
        card.textContent
      ].join(' ').toLowerCase();
      var query = search ? search.value.trim().toLowerCase() : '';
      if (query && text.indexOf(query) === -1) return false;
      for (var i = 0; i < selects.length; i += 1) {
        var select = selects[i];
        var value = select.value;
        var field = select.getAttribute('data-filter');
        if (!value) continue;
        var source = card.getAttribute('data-' + field) || '';
        if (source.indexOf(value) === -1) return false;
      }
      return true;
    }

    function apply() {
      cards.forEach(function (card) {
        card.hidden = !pass(card);
      });
    }

    if (search) search.addEventListener('input', apply);
    selects.forEach(function (select) {
      select.addEventListener('change', apply);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  ready(function () {
    setupNav();
    setupHero();
    setupGlobalSearch();
    setupLocalFilters();
  });

  window.initMoviePlayer = function (src) {
    ready(function () {
      var video = $('[data-player]');
      var cover = $('[data-play-cover]');
      if (!video || !src) return;
      var bound = false;
      var hls = null;

      function bind() {
        if (bound) return;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({ maxBufferLength: 30 });
          hls.loadSource(src);
          hls.attachMedia(video);
        } else {
          video.src = src;
        }
        bound = true;
      }

      function start() {
        bind();
        if (cover) cover.classList.add('is-hidden');
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            if (cover) cover.classList.remove('is-hidden');
          });
        }
      }

      if (cover) {
        cover.addEventListener('click', start);
      }

      video.addEventListener('click', function () {
        if (video.paused) start();
      });

      video.addEventListener('play', function () {
        if (cover) cover.classList.add('is-hidden');
      });

      video.addEventListener('ended', function () {
        if (cover) cover.classList.remove('is-hidden');
      });
    });
  };
}());
