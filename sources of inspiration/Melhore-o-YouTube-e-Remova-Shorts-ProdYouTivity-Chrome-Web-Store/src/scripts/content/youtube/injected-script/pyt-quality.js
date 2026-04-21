(function () {
  window.addEventListener('message', (event) => {
    if (event.source !== window) {
      return;
    }
    if (event.data.type === 'SET_YT_PLAYER_QUALITY') {
      const ytPlayerElement =
        document.getElementById('movie_player') ||
        document.getElementsByClassName('html5-video-player')[0];
      if (ytPlayerElement) {
        if ('setPlaybackQualityRange' in ytPlayerElement) {
          ytPlayerElement.setPlaybackQualityRange(event.data.quality);
          window.postMessage(
            {
              type: 'YT_PLAYER_QUALITY',
              quality: ytPlayerElement.getPlaybackQuality(),
            },
            '*',
          );
        } else {
          // console.warn(
          //   'setPlaybackQualityRange is not available on the YouTube player',
          // );
        }
      } else {
        // console.warn('YouTube player element not found');/
      }
    }
  });
})();
