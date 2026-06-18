(function () {
  var video = document.getElementById('movie-player');
  var button = document.querySelector('[data-player-button]');
  var frame = document.querySelector('[data-player-frame]');

  if (!video) {
    return;
  }

  var url = video.getAttribute('data-url') || '';
  var hlsInstance = null;

  function setVideoUrl() {
    if (!url || video.getAttribute('data-ready') === 'true') {
      return;
    }
    video.setAttribute('data-ready', 'true');
    if (/\.m3u8(\?|$)/i.test(url) && window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({ enableWorker: true });
      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(video);
    } else {
      video.src = url;
    }
  }

  function hideButton() {
    if (button) {
      button.classList.add('is-hidden');
    }
  }

  function startPlayback() {
    setVideoUrl();
    hideButton();
    var promise = video.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(function () {
        if (button) {
          button.classList.remove('is-hidden');
        }
      });
    }
  }

  setVideoUrl();

  if (button) {
    button.addEventListener('click', function (event) {
      event.preventDefault();
      startPlayback();
    });
  }

  if (frame) {
    frame.addEventListener('click', function (event) {
      if (event.target === video || event.target === button || button && button.contains(event.target)) {
        return;
      }
      if (video.paused) {
        startPlayback();
      }
    });
  }

  video.addEventListener('play', hideButton);
  video.addEventListener('loadeddata', function () {
    if (!video.paused) {
      hideButton();
    }
  });

  window.addEventListener('beforeunload', function () {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
})();
