(function () {
  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[char];
    });
  }

  function initNavigation() {
    var button = $('[data-nav-toggle]');
    var nav = $('[data-site-nav]');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function initHeroSlider() {
    var slider = $('[data-hero-slider]');
    if (!slider) {
      return;
    }
    var slides = $all('.hero-slide', slider);
    var dots = $all('[data-hero-dot]', slider);
    if (slides.length <= 1) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
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
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        start();
      });
    });
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initLocalFilters() {
    $all('[data-filter-form]').forEach(function (form) {
      var input = $('[data-filter-input]', form);
      var region = $('[data-filter-region]', form);
      var type = $('[data-filter-type]', form);
      var year = $('[data-filter-year]', form);
      var targetSelector = form.getAttribute('data-filter-form');
      var cards = $all(targetSelector + ' .movie-card');
      var counter = document.querySelector(form.getAttribute('data-count-target') || '');

      function apply() {
        var query = (input && input.value || '').trim().toLowerCase();
        var regionValue = region && region.value || '';
        var typeValue = type && type.value || '';
        var yearValue = year && year.value || '';
        var visible = 0;

        cards.forEach(function (card) {
          var text = [
            card.dataset.title,
            card.dataset.region,
            card.dataset.genre,
            card.dataset.type,
            card.dataset.year
          ].join(' ').toLowerCase();
          var matched = true;
          if (query && text.indexOf(query) === -1) {
            matched = false;
          }
          if (regionValue && card.dataset.region !== regionValue) {
            matched = false;
          }
          if (typeValue && card.dataset.type !== typeValue) {
            matched = false;
          }
          if (yearValue && card.dataset.year !== yearValue) {
            matched = false;
          }
          card.classList.toggle('is-hidden-card', !matched);
          if (matched) {
            visible += 1;
          }
        });
        if (counter) {
          counter.textContent = '当前显示 ' + visible + ' 部影片';
        }
      }

      [input, region, type, year].forEach(function (control) {
        if (control) {
          control.addEventListener('input', apply);
          control.addEventListener('change', apply);
        }
      });
      apply();
    });
  }

  function movieResultCard(movie) {
    var tags = (movie.genre || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    return [
      '<article class="movie-card">',
      '  <a class="movie-card__poster" href="' + escapeHtml(movie.href) + '">',
      '    <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '    <span class="movie-card__score">' + escapeHtml(movie.rating) + '</span>',
      '  </a>',
      '  <div class="movie-card__body">',
      '    <div class="movie-card__meta">',
      '      <span>' + escapeHtml(movie.year) + '</span>',
      '      <span>' + escapeHtml(movie.region) + '</span>',
      '      <span>' + escapeHtml(movie.type) + '</span>',
      '    </div>',
      '    <h3><a href="' + escapeHtml(movie.href) + '">' + escapeHtml(movie.title) + '</a></h3>',
      '    <p>' + escapeHtml(movie.oneLine) + '</p>',
      '    <div class="tag-row">' + tags + '</div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function initGlobalSearch() {
    var form = $('[data-global-search]');
    var results = $('[data-search-results]');
    if (!form || !results || !window.SEARCH_INDEX) {
      return;
    }
    var queryInput = $('[data-search-query]', form);
    var regionSelect = $('[data-search-region]', form);
    var typeSelect = $('[data-search-type]', form);
    var yearSelect = $('[data-search-year]', form);
    var count = $('[data-search-count]');

    function render() {
      var query = (queryInput.value || '').trim().toLowerCase();
      var region = regionSelect.value;
      var type = typeSelect.value;
      var year = yearSelect.value;
      var found = window.SEARCH_INDEX.filter(function (movie) {
        var haystack = [
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          (movie.genre || []).join(' '),
          movie.oneLine
        ].join(' ').toLowerCase();
        if (query && haystack.indexOf(query) === -1) {
          return false;
        }
        if (region && movie.region !== region) {
          return false;
        }
        if (type && movie.type !== type) {
          return false;
        }
        if (year && String(movie.year) !== year) {
          return false;
        }
        return true;
      }).slice(0, 120);
      results.innerHTML = found.map(movieResultCard).join('');
      if (count) {
        count.textContent = '找到 ' + found.length + ' 部影片';
      }
    }

    [queryInput, regionSelect, typeSelect, yearSelect].forEach(function (control) {
      control.addEventListener('input', render);
      control.addEventListener('change', render);
    });
    render();
  }

  function initPlayers() {
    $all('[data-player]').forEach(function (shell) {
      var video = $('video', shell);
      var overlay = $('.player-overlay', shell);
      var message = $('.player-message', shell);
      var source = shell.getAttribute('data-src');
      var started = false;
      var hls = null;

      function showMessage(text) {
        if (!message) {
          return;
        }
        message.hidden = false;
        message.textContent = text;
      }

      function playVideo() {
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            showMessage('点击视频画面或播放按钮即可继续播放。');
          });
        }
      }

      function startPlayer() {
        if (!video || !source) {
          return;
        }
        if (overlay) {
          overlay.classList.add('is-hidden');
        }
        if (started) {
          playVideo();
          return;
        }
        started = true;

        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            playVideo();
          });
          hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (!data || !data.fatal) {
              return;
            }
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              showMessage('网络加载异常，正在重新连接播放源。');
              hls.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              showMessage('媒体解码异常，正在尝试恢复播放。');
              hls.recoverMediaError();
            } else {
              showMessage('播放器初始化失败，请更换浏览器后再试。');
              hls.destroy();
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.addEventListener('loadedmetadata', playVideo, { once: true });
          video.load();
        } else {
          video.src = source;
          video.load();
          playVideo();
          showMessage('当前浏览器正在尝试直接播放 HLS 视频流。');
        }
      }

      if (overlay) {
        overlay.addEventListener('click', startPlayer);
      }
      video.addEventListener('click', function () {
        if (!started) {
          startPlayer();
        }
      });
      window.addEventListener('beforeunload', function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initHeroSlider();
    initLocalFilters();
    initGlobalSearch();
    initPlayers();
  });
}());
