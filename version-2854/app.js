(function () {
  var menuButton = document.querySelector('[data-menu-button]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('is-open');
      document.body.classList.toggle('menu-open', mobilePanel.classList.contains('is-open'));
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
  var prev = document.querySelector('[data-hero-prev]');
  var next = document.querySelector('[data-hero-next]');
  var activeIndex = 0;
  var heroTimer = null;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach(function (slide, current) {
      slide.classList.toggle('is-active', current === activeIndex);
    });
    dots.forEach(function (dot, current) {
      dot.classList.toggle('is-active', current === activeIndex);
    });
  }

  function restartHeroTimer() {
    if (!slides.length) {
      return;
    }
    window.clearInterval(heroTimer);
    heroTimer = window.setInterval(function () {
      showSlide(activeIndex + 1);
    }, 5200);
  }

  if (slides.length) {
    showSlide(0);
    restartHeroTimer();
    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(activeIndex - 1);
        restartHeroTimer();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        showSlide(activeIndex + 1);
        restartHeroTimer();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
        restartHeroTimer();
      });
    });
  }

  var input = document.querySelector('[data-filter-input]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('[data-filter-category]'));
  var empty = document.querySelector('[data-filter-empty]');
  var selectedCategory = 'all';

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function runFilter() {
    if (!cards.length) {
      return;
    }
    var query = normalize(input ? input.value : '');
    var visible = 0;
    cards.forEach(function (card) {
      var category = card.getAttribute('data-category') || '';
      var text = normalize(card.getAttribute('data-search'));
      var categoryMatched = selectedCategory === 'all' || category === selectedCategory;
      var queryMatched = !query || text.indexOf(query) !== -1;
      var shown = categoryMatched && queryMatched;
      card.classList.toggle('is-hidden-by-filter', !shown);
      if (shown) {
        visible += 1;
      }
    });
    if (empty) {
      empty.classList.toggle('is-visible', visible === 0);
    }
  }

  if (input) {
    var params = new URLSearchParams(window.location.search);
    var queryValue = params.get('q') || '';
    if (queryValue) {
      input.value = queryValue;
    }
    input.addEventListener('input', runFilter);
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      selectedCategory = chip.getAttribute('data-filter-category') || 'all';
      chips.forEach(function (item) {
        item.classList.toggle('is-active', item === chip);
      });
      runFilter();
    });
  });

  runFilter();
})();
