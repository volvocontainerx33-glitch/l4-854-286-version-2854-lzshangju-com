(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function setupMobileMenu() {
    var button = document.querySelector('.menu-toggle');
    var panel = document.querySelector('.mobile-panel');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      var expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      panel.hidden = expanded;
    });
  }

  function setupHeroSlider() {
    var slider = document.querySelector('.hero-slider');
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('.hero-dot'));
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
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

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var target = Number(dot.getAttribute('data-slide-target') || 0);
        show(target);
        start();
      });
    });

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function setupCatalogFilters() {
    var grid = document.querySelector('.searchable-grid');
    if (!grid) {
      return;
    }
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.movie-card'));
    var search = document.querySelector('.catalog-search');
    var selects = Array.prototype.slice.call(document.querySelectorAll('.filter-select'));
    var empty = document.createElement('div');
    empty.className = 'search-empty';
    empty.textContent = '没有找到匹配的影片';
    empty.hidden = true;
    grid.appendChild(empty);

    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q');
    if (initial && search) {
      search.value = initial;
    }

    function matches(card) {
      var text = normalize(card.getAttribute('data-text'));
      var keyword = normalize(search ? search.value : '');
      if (keyword && text.indexOf(keyword) === -1) {
        return false;
      }
      for (var i = 0; i < selects.length; i += 1) {
        var select = selects[i];
        var value = normalize(select.value);
        var field = select.getAttribute('data-filter');
        if (!value) {
          continue;
        }
        var cardValue = normalize(card.getAttribute('data-' + field));
        if (cardValue.indexOf(value) === -1) {
          return false;
        }
      }
      return true;
    }

    function apply() {
      var visible = 0;
      cards.forEach(function (card) {
        var ok = matches(card);
        card.hidden = !ok;
        if (ok) {
          visible += 1;
        }
      });
      empty.hidden = visible !== 0;
    }

    if (search) {
      search.addEventListener('input', apply);
    }
    selects.forEach(function (select) {
      select.addEventListener('change', apply);
    });
    apply();
  }

  function attachSource(video, sourceUrl) {
    if (video.getAttribute('data-loaded') === 'true') {
      return;
    }
    video.setAttribute('data-loaded', 'true');
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = sourceUrl;
      return;
    }
    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: false
      });
      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
      video._hlsInstance = hls;
      return;
    }
    video.src = sourceUrl;
  }

  window.setupMoviePlayer = function (videoId, buttonId, sourceUrl) {
    var video = document.getElementById(videoId);
    var button = document.getElementById(buttonId);
    if (!video || !sourceUrl) {
      return;
    }

    function play() {
      attachSource(video, sourceUrl);
      if (button) {
        button.classList.add('is-hidden');
      }
      var result = video.play();
      if (result && typeof result.catch === 'function') {
        result.catch(function () {
          if (button) {
            button.classList.remove('is-hidden');
          }
        });
      }
    }

    if (button) {
      button.addEventListener('click', play);
    }
    video.addEventListener('click', function () {
      if (video.paused) {
        play();
      }
    });
  };

  ready(function () {
    setupMobileMenu();
    setupHeroSlider();
    setupCatalogFilters();
  });
})();
