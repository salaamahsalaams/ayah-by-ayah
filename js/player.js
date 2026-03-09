    // ===== AUDIO PLAYER =====
    (function() {
      const audio = document.getElementById('audioPlayer');
      const playBtn = document.getElementById('playBtn');
      const playIcon = document.getElementById('playIcon');
      const replayBtn = document.getElementById('replayBtn');
      const speedBtn = document.getElementById('speedBtn');
      const scrubber = document.getElementById('scrubber');
      const fill = document.getElementById('scrubberFill');
      const thumb = document.getElementById('scrubberThumb');
      const curTimeEl = document.getElementById('currentTime');
      const totTimeEl = document.getElementById('totalTime');
      const playRing = document.getElementById('playRing');
      const ringFill = document.getElementById('ringFill');
      const CIRCUMFERENCE = 2 * Math.PI * 30; // r=30

      const playSvg = '<polygon points="6,3 20,12 6,21" />';
      const pauseSvg = '<rect x="5" y="3" width="5" height="18"/><rect x="14" y="3" width="5" height="18"/>';

      const repeatBtn = document.getElementById('repeatBtn');
      const repeatBadge = document.getElementById('repeatBadge');
      const repeatCounter = document.getElementById('repeatCounter');
      const repeatOptions = [0, 3, 5, 7, 9, 11]; // 0 = off
      let repeatTotal = 0;
      let repeatCurrent = 0;
      let pendingPlay = false;
      let audioReady = false;

      function updateRepeatUI() {
        if (repeatTotal === 0) {
          repeatBtn.classList.remove('active');
          repeatBadge.textContent = '';
          repeatCounter.textContent = '';
        } else {
          repeatBtn.classList.add('active');
          repeatBadge.textContent = repeatTotal;
          repeatCounter.textContent = 'Repeat ' + repeatCurrent + ' / ' + repeatTotal;
        }
      }

      repeatBtn.addEventListener('click', () => {
        let idx = repeatOptions.indexOf(repeatTotal);
        idx = (idx + 1) % repeatOptions.length;
        repeatTotal = repeatOptions[idx];
        repeatCurrent = 0;
        updateRepeatUI();
      });

      function setRingProgress(pct) {
        // pct 0-1, 1 = full circle
        const offset = CIRCUMFERENCE * (1 - pct);
        ringFill.style.strokeDashoffset = offset;
      }

      function showRing() {
        playRing.classList.remove('hidden');
        playRing.classList.remove('loaded');
        setRingProgress(0);
      }

      function hideRing() {
        playRing.classList.add('loaded');
        setTimeout(() => { playRing.classList.add('hidden'); }, 400);
      }

      // Track buffering progress
      audio.addEventListener('progress', () => {
        if (!audio.duration || audioReady) return;
        if (audio.buffered.length > 0) {
          const buffered = audio.buffered.end(audio.buffered.length - 1);
          setRingProgress(buffered / audio.duration);
        }
      });

      audio.addEventListener('loadstart', () => {
        audioReady = false;
        showRing();
        playBtn.classList.add('loading');
      });

      audio.addEventListener('canplaythrough', () => {
        audioReady = true;
        setRingProgress(1);
        hideRing();
        playBtn.classList.remove('loading');
        if (pendingPlay) {
          pendingPlay = false;
          audio.play();
          playIcon.innerHTML = pauseSvg;
        }
      });

      audio.addEventListener('canplay', () => {
        // Partial ready — update ring but keep loading state if not fully buffered
        if (!audioReady && audio.buffered.length > 0 && audio.duration) {
          setRingProgress(audio.buffered.end(audio.buffered.length - 1) / audio.duration);
        }
      });

      audio.addEventListener('error', () => {
        playBtn.classList.remove('loading');
        playRing.classList.add('hidden');
        pendingPlay = false;
        if (audio.src && audio.src !== window.location.href) {
          showToast('Could not load audio for this reciter.', 'error');
        }
      });

      playBtn.addEventListener('click', () => {
        if (!audioReady && audio.src && audio.readyState < 3) {
          pendingPlay = !pendingPlay;
          if (pendingPlay) playBtn.classList.add('loading');
          else playBtn.classList.remove('loading');
          return;
        }
        if (audio.paused) {
          if (audio.ended || audio.currentTime === 0) { repeatCurrent = 0; updateRepeatUI(); }
          audio.play();
          playIcon.innerHTML = pauseSvg;
        } else {
          audio.pause();
          playIcon.innerHTML = playSvg;
        }
      });

      audio.addEventListener('ended', () => {
        if (repeatTotal > 0 && repeatCurrent < repeatTotal) {
          repeatCurrent++;
          updateRepeatUI();
          if (repeatCurrent < repeatTotal) {
            audio.currentTime = 0;
            audio.play();
            return;
          }
        }
        playIcon.innerHTML = playSvg;
      });
      audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        fill.style.width = pct + '%'; thumb.style.left = pct + '%';
        curTimeEl.textContent = fmtTime(audio.currentTime);
      });
      audio.addEventListener('loadedmetadata', () => { totTimeEl.textContent = fmtTime(audio.duration); });

      scrubber.addEventListener('click', (e) => {
        if (!audio.duration) return;
        const rect = scrubber.getBoundingClientRect();
        audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
      });

      replayBtn.addEventListener('click', () => { repeatCurrent = 0; updateRepeatUI(); audio.currentTime = 0; audio.play(); playIcon.innerHTML = pauseSvg; });

      const speeds = [0.5, 0.75, 1, 1.25, 1.5];
      speedBtn.addEventListener('click', () => {
        let idx = speeds.indexOf(audio.playbackRate);
        idx = (idx + 1) % speeds.length;
        audio.playbackRate = speeds[idx];
        settings.playback_speed = speeds[idx];
        speedBtn.querySelector('svg text').textContent = speeds[idx] + 'x';
        document.getElementById('setSpeed').value = speeds[idx];
        saveSettings();
      });
    })();
