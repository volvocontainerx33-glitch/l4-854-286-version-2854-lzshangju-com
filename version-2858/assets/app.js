(function () {
  var navButton = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-site-nav]');

  if (navButton && nav) {
    navButton.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    var showSlide = function (index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    };

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        showSlide(current + 1);
      }, 5600);
    }
  }

  var textOf = function (value) {
    return String(value || '').toLowerCase().trim();
  };

  var matchCard = function (card, filters) {
    var haystack = textOf([
      card.getAttribute('data-title'),
      card.getAttribute('data-region'),
      card.getAttribute('data-year'),
      card.getAttribute('data-type'),
      card.getAttribute('data-category'),
      card.getAttribute('data-genre'),
      card.getAttribute('data-tags'),
      card.textContent
    ].join(' '));

    if (filters.query && haystack.indexOf(filters.query) === -1) {
      return false;
    }

    if (filters.category && textOf(card.getAttribute('data-category')).indexOf(filters.category) === -1) {
      return false;
    }

    if (filters.type && textOf(card.getAttribute('data-type')).indexOf(filters.type) === -1) {
      return false;
    }

    if (filters.year && textOf(card.getAttribute('data-year')).indexOf(filters.year) === -1) {
      return false;
    }

    return true;
  };

  var applyFilters = function (root, filters) {
    var cards = Array.prototype.slice.call(root.querySelectorAll('[data-movie-card]'));
    var empty = root.querySelector('[data-empty-state]');
    var visible = 0;

    cards.forEach(function (card) {
      var matched = matchCard(card, filters);
      card.style.display = matched ? '' : 'none';
      if (matched) {
        visible += 1;
      }
    });

    if (empty) {
      empty.classList.toggle('show', visible === 0);
    }
  };

  document.querySelectorAll('[data-catalog]').forEach(function (root) {
    var input = root.querySelector('[data-catalog-search]');
    var type = root.querySelector('[data-catalog-type]');
    var year = root.querySelector('[data-catalog-year]');

    var refresh = function () {
      applyFilters(root, {
        query: textOf(input && input.value),
        type: textOf(type && type.value),
        year: textOf(year && year.value)
      });
    };

    [input, type, year].forEach(function (control) {
      if (control) {
        control.addEventListener('input', refresh);
        control.addEventListener('change', refresh);
      }
    });
  });

  var searchRoot = document.querySelector('[data-search-page]');

  if (searchRoot) {
    var params = new URLSearchParams(window.location.search);
    var queryInput = searchRoot.querySelector('[data-search-input]');
    var categorySelect = searchRoot.querySelector('[data-filter-category]');
    var typeSelect = searchRoot.querySelector('[data-filter-type]');
    var yearSelect = searchRoot.querySelector('[data-filter-year]');

    if (queryInput) {
      queryInput.value = params.get('q') || '';
    }

    var refreshSearch = function () {
      applyFilters(searchRoot, {
        query: textOf(queryInput && queryInput.value),
        category: textOf(categorySelect && categorySelect.value),
        type: textOf(typeSelect && typeSelect.value),
        year: textOf(yearSelect && yearSelect.value)
      });
    };

    [queryInput, categorySelect, typeSelect, yearSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', refreshSearch);
        control.addEventListener('change', refreshSearch);
      }
    });

    refreshSearch();
  }

  var startVideo = function (box) {
    var video = box.querySelector('video');
    var url = box.getAttribute('data-video');

    if (!video || !url) {
      return;
    }

    var begin = function () {
      box.classList.add('playing');
      var playRequest = video.play();
      if (playRequest && typeof playRequest.catch === 'function') {
        playRequest.catch(function () {});
      }
    };

    if (video.getAttribute('src')) {
      begin();
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.load();
      begin();
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({ enableWorker: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, begin);
      return;
    }

    video.src = url;
    video.load();
    begin();
  };

  document.querySelectorAll('.watch-box').forEach(function (box) {
    var overlay = box.querySelector('.play-overlay');
    var video = box.querySelector('video');

    if (overlay) {
      overlay.addEventListener('click', function () {
        startVideo(box);
      });
    }

    if (video) {
      video.addEventListener('click', function () {
        startVideo(box);
      });
      video.addEventListener('play', function () {
        box.classList.add('playing');
      });
    }
  });
})();
