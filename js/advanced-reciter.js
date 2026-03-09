    // ===== ADVANCED RECITER =====
    var arContext = ''; // 'today' or 'revision'
    var arAudio = new Audio();
    var arPlaying = false;
    var arStopped = false;
    var arAyahs = [];      // array of global ayah numbers to play
    var arMode = 'each';   // 'each' or 'all'
    var arTimes = 3;
    var arCurrentIdx = 0;
    var arCurrentRep = 0;
    var arLoopRep = 0;     // for 'all' mode

    function getSurahForAyah(globalNum) {
      for (var i = SURAHS.length - 1; i >= 0; i--) {
        if (globalNum >= SURAH_STARTS[i]) return i;
      }
      return 0;
    }

    function getTodayAyahRange() {
      // Returns { surahs: [{idx, startAyah, endAyah}], extended: bool }
      var todayFloor = progress.learned - todayCount;
      var todayEnd = todayFloor + settings.daily_goal - 1;
      if (todayEnd >= TOTAL) todayEnd = TOTAL - 1;
      if (keepLearning) {
        // extend to end of current surah
        var currentGlobal = ayahNumAt(progress.learned);
        var si = getSurahForAyah(currentGlobal);
        todayEnd = Math.max(todayEnd, SURAH_STARTS[si] + SURAHS[si][3] - 1 - (settings.direction === 'back' ? 0 : 0));
        // Actually for keep learning, extend based on progress index
        var lastIdx = progress.learned;
        var lastGlobal = ayahNumAt(lastIdx);
        var lastSi = getSurahForAyah(lastGlobal);
        // End of that surah in index space
        if (settings.direction !== 'back') {
          todayEnd = SURAH_STARTS[lastSi] + SURAHS[lastSi][3] - 2; // index = global - 1
        }
      }

      // Collect ayah globals for the range
      var result = {};
      for (var idx = todayFloor; idx <= todayEnd && idx < TOTAL; idx++) {
        var g = ayahNumAt(idx);
        var si = getSurahForAyah(g);
        if (!result[si]) result[si] = { idx: si, ayahs: [] };
        result[si].ayahs.push(g);
      }

      var surahs = [];
      for (var k in result) surahs.push(result[k]);
      surahs.sort(function(a, b) { return a.idx - b.idx; });
      return surahs;
    }

    function getRevisionAyahRange() {
      if (revCurrentSurah < 0) return [];
      return getLearnedAyahsForSurah(revCurrentSurah);
    }

    function showArPlayer() {
      document.getElementById('normalPlayerBar').style.display = 'none';
      document.getElementById('arPlayerBar').style.display = '';
      document.querySelector('.bottom-action').style.display = 'none';
      document.getElementById('backToTodayBtn').classList.add('show');
    }
    function hideArPlayer() {
      document.getElementById('arPlayerBar').style.display = 'none';
      document.getElementById('normalPlayerBar').style.display = '';
      document.querySelector('.bottom-action').style.display = '';
      render(); // Restore button states
    }

    function openAdvReciter(context) {
      arContext = context;
      arStopped = false;
      arPlaying = false;

      var overlay = document.getElementById('arOverlay');
      var panel = document.getElementById('arPopup');
      var surahSel = document.getElementById('arSurah');
      var timesInput = document.getElementById('arTimes');

      // Set max times
      var maxTimes = context === 'revision' ? 15 : 30;
      timesInput.max = maxTimes;
      if (parseInt(timesInput.value) > maxTimes) timesInput.value = maxTimes;

      // Populate surah dropdown with all surahs that have learned ayahs
      surahSel.innerHTML = '';
      var currentSurahIdx = -1;
      if (context === 'today') {
        var currentGlobal = ayahNumAt(progress.learned);
        currentSurahIdx = getSurahForAyah(currentGlobal);
      } else {
        currentSurahIdx = revCurrentSurah;
      }

      var order = [];
      for (var i = 0; i < SURAHS.length; i++) order.push(i);
      if (settings.direction === 'back') order.reverse();

      for (var oi = 0; oi < order.length; oi++) {
        var si = order[oi];
        var learnedAyahs = getLearnedAyahsForSurah(si);
        if (learnedAyahs.length === 0) continue;
        var s = SURAHS[si];
        var opt = document.createElement('option');
        opt.value = si;
        opt.textContent = s[0] + '. ' + s[1];
        opt.dataset.ayahs = JSON.stringify(learnedAyahs);
        opt.dataset.total = s[3];
        if (si === currentSurahIdx) opt.selected = true;
        surahSel.appendChild(opt);
      }

      updateArRange();
      overlay.classList.add('show');
      panel.classList.add('show');
    }

    function closeAdvReciter() {
      document.getElementById('arOverlay').classList.remove('show');
      document.getElementById('arPopup').classList.remove('show');
    }

    function updateArRange() {
      var sel = document.getElementById('arSurah');
      var opt = sel.options[sel.selectedIndex];
      if (!opt) return;
      var ayahs = JSON.parse(opt.dataset.ayahs);
      var si = parseInt(opt.value);
      var fromInput = document.getElementById('arFrom');
      var toInput = document.getElementById('arTo');
      var info = document.getElementById('arRangeInfo');
      var totalInSurah = SURAHS[si][3];

      if (ayahs.length === 0) {
        fromInput.value = 1; toInput.value = ''; info.textContent = 'No ayahs';
        return;
      }
      var first = ayahs[0] - SURAH_STARTS[si] + 1;
      var last = ayahs[ayahs.length - 1] - SURAH_STARTS[si] + 1;
      fromInput.min = 1;
      fromInput.max = totalInSurah;
      fromInput.value = first;
      toInput.min = 1;
      toInput.max = totalInSurah;
      toInput.value = last;
      toInput.placeholder = last;
      info.textContent = last + ' of ' + totalInSurah + ' learned';
    }

    function getArAyahs() {
      var sel = document.getElementById('arSurah');
      var opt = sel.options[sel.selectedIndex];
      if (!opt) return [];
      var allAyahs = JSON.parse(opt.dataset.ayahs);
      var si = parseInt(opt.value);
      var fromVal = parseInt(document.getElementById('arFrom').value) || 1;
      var toVal = parseInt(document.getElementById('arTo').value) || fromVal;
      // Clamp
      var surahStart = SURAH_STARTS[si];
      var fromGlobal = surahStart + fromVal - 1;
      var toGlobal = surahStart + toVal - 1;
      var result = [];
      for (var a = fromGlobal; a <= toGlobal; a++) {
        result.push(a);
      }
      return result;
    }

    // Fetch and display ayah text in the main screen's ayah area
    async function loadArAyahText(num) {
      var isRevision = arContext === 'revision';
      var textEl = document.getElementById(isRevision ? 'revAyahText' : 'ayahText');
      var si = getSurahForAyah(num);
      var ayahInSurah = num - SURAH_STARTS[si] + 1;

      if (!isRevision) {
        document.getElementById('surahName').textContent = SURAHS[si][2];
        document.getElementById('surahMeta').textContent = SURAHS[si][1] + '  \u00B7  Ayah ' + ayahInSurah;
      }

      var cached = localStorage.getItem(AYAH_CACHE_KEY + num);
      if (cached) {
        var data = JSON.parse(cached);
        textEl.innerHTML = parseTajweed(data.text_tajweed);
        return;
      }
      textEl.innerHTML = '<span class="loading-text">Loading...</span>';
      try {
        var resp = await fetch('https://api.alquran.cloud/v1/ayah/' + num + '/quran-tajweed');
        var json = await resp.json();
        var d = json.data;
        var data = { number: d.number, surah_name: d.surah.name, surah_english: d.surah.englishName, ayah_in_surah: d.numberInSurah, text_tajweed: d.text };
        localStorage.setItem(AYAH_CACHE_KEY + num, JSON.stringify(data));
        textEl.innerHTML = parseTajweed(data.text_tajweed);
      } catch(e) {
        textEl.innerHTML = '<span class="error-text">Could not load ayah</span>';
      }
    }

    function startAdvReciter() {
      arAyahs = getArAyahs();
      if (arAyahs.length === 0) { showToast('No ayahs in range', 'error'); return; }
      arMode = document.querySelector('.ar-mode-btn.active').dataset.mode;
      arTimes = Math.max(1, Math.min(parseInt(document.getElementById('arTimes').value) || 1, parseInt(document.getElementById('arTimes').max)));
      arCurrentIdx = 0;
      arCurrentRep = 0;
      arLoopRep = 0;
      arPlaying = true;
      arStopped = false;

      // Pause other audio
      document.getElementById('audioPlayer').pause();
      revAudio.pause();

      // Close the setup panel, show AR player bar
      document.getElementById('arOverlay').classList.remove('show');
      document.getElementById('arPopup').classList.remove('show');
      showArPlayer();
      // Reset pause button to pause icon
      document.getElementById('arPauseBtn').innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';

      playNextArAyah();
    }

    function playNextArAyah() {
      if (arStopped || !arPlaying) return;

      var status = document.getElementById('arPlayerStatus');

      if (arMode === 'each') {
        if (arCurrentIdx >= arAyahs.length) {
          finishAdvReciter();
          return;
        }
        var num = arAyahs[arCurrentIdx];
        var si = getSurahForAyah(num);
        var ayahInSurah = num - SURAH_STARTS[si] + 1;
        status.textContent = SURAHS[si][1] + ' · Ayah ' + ayahInSurah + '  —  repeat ' + (arCurrentRep + 1) + '/' + arTimes;

        loadArAyahText(num);
  
        arAudio.src = getAudioBase() + '/' + num + '.mp3';
        arAudio.playbackRate = settings.playback_speed;
        arAudio.load();
        arAudio.play().catch(function() {});
      } else {
        if (arCurrentIdx >= arAyahs.length) {
          arLoopRep++;
          if (arLoopRep >= arTimes) {
            finishAdvReciter();
            return;
          }
          arCurrentIdx = 0;
        }
        var num = arAyahs[arCurrentIdx];
        var si = getSurahForAyah(num);
        var ayahInSurah = num - SURAH_STARTS[si] + 1;
        status.textContent = SURAHS[si][1] + ' · Ayah ' + ayahInSurah + '  —  loop ' + (arLoopRep + 1) + '/' + arTimes;

        loadArAyahText(num);
  
        arAudio.src = getAudioBase() + '/' + num + '.mp3';
        arAudio.playbackRate = settings.playback_speed;
        arAudio.load();
        arAudio.play().catch(function() {});
      }
    }


    arAudio.addEventListener('ended', function() {
      if (arStopped || !arPlaying) return;

      if (arMode === 'each') {
        arCurrentRep++;
        if (arCurrentRep >= arTimes) {
          arCurrentRep = 0;
          arCurrentIdx++;
        }
      } else {
        arCurrentIdx++;
      }
      playNextArAyah();
    });

    function stopAdvReciter() {
      arStopped = true;
      arPlaying = false;
      arAudio.pause();
      arAudio.src = '';
      hideArPlayer();
      restoreMainAyah();
    }

    function finishAdvReciter() {
      arPlaying = false;
      document.getElementById('arPlayerStatus').textContent = 'Complete ✓';
      // Player stays visible for a moment, then auto-hide after 2s
      setTimeout(function() {
        if (!arPlaying) {
          hideArPlayer();
          restoreMainAyah();
        }
      }, 2000);
    }

    function restoreMainAyah() {
      if (arContext === 'revision') {
        // Reload current revision ayah
        if (typeof loadRevAyah === 'function') loadRevAyah();
      } else {
        // Restore the main ayah text area to the current "today" ayah
        var viewIdx = progress.learned + viewOffset;
        var ayahNum = ayahNumAt(viewIdx);
        fetchAyah(ayahNum);
      }
    }

    // Event listeners
    document.getElementById('advReciterBtn').addEventListener('click', function() {
      openAdvReciter('today');
    });
    document.getElementById('revAdvReciterBtn').addEventListener('click', function() {
      openAdvReciter('revision');
    });
    document.getElementById('arClose').addEventListener('click', closeAdvReciter);
    document.getElementById('arOverlay').addEventListener('click', closeAdvReciter);
    document.getElementById('arPlayBtn').addEventListener('click', startAdvReciter);
    document.getElementById('arStopBtn').addEventListener('click', stopAdvReciter);
    document.getElementById('arSurah').addEventListener('change', updateArRange);
    document.getElementById('arPauseBtn').addEventListener('click', function() {
      if (arAudio.paused) {
        arAudio.play().catch(function() {});
        this.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
      } else {
        arAudio.pause();
        this.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21"/></svg>';
      }
    });

    document.querySelectorAll('.ar-mode-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.ar-mode-btn').forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
      });
    });
