    // ===== REVISION TAB =====
    var revAudio = new Audio();
    var revCurrentSurah = -1;
    var revCurrentAyahIdx = 0; // index within learned ayahs of that surah
    var revLearnedAyahs = [];  // global ayah numbers for current surah
    var revRepeat = false;
    var revSpeed = 1;

    function getLearnedAyahsForSurah(surahIdx) {
      var ayahs = [];
      var preCompleted = (settings.completed_surahs || []).indexOf(surahIdx) !== -1;
      var count = SURAHS[surahIdx][3];
      if (preCompleted) {
        for (var a = 0; a < count; a++) ayahs.push(SURAH_STARTS[surahIdx] + a);
        return ayahs;
      }
      var learned = getLearnedInSurah(surahIdx);
      if (settings.direction === 'back') {
        for (var a = 0; a < learned; a++) ayahs.push(SURAH_STARTS[surahIdx] + a);
      } else {
        for (var a = 0; a < learned; a++) ayahs.push(SURAH_STARTS[surahIdx] + a);
      }
      return ayahs;
    }

    function renderRevision() {
      var list = document.getElementById('revSurahList');
      var empty = document.getElementById('revEmpty');
      var headerText = document.getElementById('revHeaderText');

      // Show list view, hide player
      document.getElementById('revListView').style.display = '';
      document.getElementById('revPlayerView').style.display = 'none';

      var html = '';
      var totalLearned = 0;
      var order = [];
      for (var i = 0; i < SURAHS.length; i++) order.push(i);
      if (settings.direction === 'back') order.reverse();

      for (var oi = 0; oi < order.length; oi++) {
        var i = order[oi];
        var learned = getLearnedAyahsForSurah(i).length;
        if (learned === 0) continue;
        totalLearned += learned;
        var s = SURAHS[i];
        html += '<div class="rev-surah-card" data-idx="' + i + '">';
        html += '<div class="rev-surah-num">' + s[0] + '</div>';
        html += '<div class="rev-surah-info">';
        html += '<div class="rev-surah-name"><span>' + s[1] + '</span><span class="rev-surah-name-ar">' + s[2] + '</span></div>';
        html += '<div class="rev-surah-count">' + learned + ' of ' + s[3] + ' ayahs learned</div>';
        html += '</div>';
        html += '</div>';
      }

      list.innerHTML = html;
      headerText.textContent = totalLearned + ' ayah' + (totalLearned !== 1 ? 's' : '') + ' to revise';
      empty.style.display = totalLearned === 0 ? 'block' : 'none';

      // Click handler for surah cards
      list.querySelectorAll('.rev-surah-card').forEach(function(card) {
        card.addEventListener('click', function() {
          openRevisionPlayer(parseInt(this.dataset.idx));
        });
      });
    }

    function openRevisionPlayer(surahIdx) {
      revCurrentSurah = surahIdx;
      revLearnedAyahs = getLearnedAyahsForSurah(surahIdx);
      revCurrentAyahIdx = 0;
      revSpeed = settings.playback_speed;

      document.getElementById('revListView').style.display = 'none';
      document.getElementById('revPlayerView').style.display = 'flex';

      var s = SURAHS[surahIdx];
      document.getElementById('revSurahName').textContent = s[2];
      document.getElementById('revSurahMeta').textContent = s[1] + ' \u00B7 ' + revLearnedAyahs.length + ' ayahs';

      loadRevAyah();
    }

    function loadRevAyah() {
      if (revLearnedAyahs.length === 0) return;
      var num = revLearnedAyahs[revCurrentAyahIdx];
      var textEl = document.getElementById('revAyahText');
      var transEl = document.getElementById('revTransText');
      var counter = document.getElementById('revAyahCounter');

      counter.textContent = 'Ayah ' + (revCurrentAyahIdx + 1) + ' of ' + revLearnedAyahs.length;

      // Update nav buttons
      document.getElementById('revPrevBtn').disabled = revCurrentAyahIdx <= 0;
      document.getElementById('revNextBtn').disabled = revCurrentAyahIdx >= revLearnedAyahs.length - 1;

      // Load ayah text from cache
      var cached = localStorage.getItem(AYAH_CACHE_KEY + num);
      if (cached) {
        var data = JSON.parse(cached);
        textEl.innerHTML = parseTajweed(data.text_tajweed);
        if (settings.show_translation) {
          transEl.classList.add('show');
          var transCached = localStorage.getItem(TRANS_CACHE_KEY + num);
          transEl.textContent = transCached || '';
          if (!transCached) {
            fetch('https://api.alquran.cloud/v1/ayah/' + num + '/en.sahih')
              .then(function(r) { return r.json(); })
              .then(function(j) { transEl.textContent = j.data.text; localStorage.setItem(TRANS_CACHE_KEY + num, j.data.text); })
              .catch(function() { transEl.textContent = ''; });
          }
        } else {
          transEl.classList.remove('show');
          transEl.textContent = '';
        }
      } else {
        textEl.innerHTML = '<span class="loading-text">Loading...</span>';
        transEl.textContent = '';
        fetch('https://api.alquran.cloud/v1/ayah/' + num + '/quran-tajweed')
          .then(function(r) { return r.json(); })
          .then(function(j) {
            var d = j.data;
            var obj = { number: d.number, surah_name: d.surah.name, surah_english: d.surah.englishName, ayah_in_surah: d.numberInSurah, text_tajweed: d.text };
            localStorage.setItem(AYAH_CACHE_KEY + num, JSON.stringify(obj));
            textEl.innerHTML = parseTajweed(obj.text_tajweed);
          })
          .catch(function() { textEl.innerHTML = '<span class="error-text">Could not load ayah</span>'; });
      }

      // Audio
      revAudio.pause();
      revAudio.src = getAudioBase() + '/' + num + '.mp3';
      revAudio.playbackRate = revSpeed;
      revAudio.load();
      document.getElementById('revPlayIcon').innerHTML = '<polygon points="6,3 20,12 6,21" />';
    }

    // Rev audio player controls
    revAudio.addEventListener('timeupdate', function() {
      if (!revAudio.duration) return;
      var pct = (revAudio.currentTime / revAudio.duration) * 100;
      document.getElementById('revScrubberFill').style.width = pct + '%';
      document.getElementById('revScrubberThumb').style.left = pct + '%';
      document.getElementById('revCurrentTime').textContent = fmtTime(revAudio.currentTime);
    });

    revAudio.addEventListener('loadedmetadata', function() {
      document.getElementById('revTotalTime').textContent = fmtTime(revAudio.duration);
    });

    revAudio.addEventListener('ended', function() {
      if (revRepeat) {
        revAudio.currentTime = 0;
        revAudio.play();
      } else if (revCurrentAyahIdx < revLearnedAyahs.length - 1) {
        revCurrentAyahIdx++;
        loadRevAyah();
        revAudio.addEventListener('canplay', function oncan() {
          revAudio.removeEventListener('canplay', oncan);
          revAudio.play();
        });
      } else {
        document.getElementById('revPlayIcon').innerHTML = '<polygon points="6,3 20,12 6,21" />';
      }
    });

    revAudio.addEventListener('play', function() {
      document.getElementById('revPlayIcon').innerHTML = '<rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />';
    });

    revAudio.addEventListener('pause', function() {
      document.getElementById('revPlayIcon').innerHTML = '<polygon points="6,3 20,12 6,21" />';
    });

    document.getElementById('revPlayBtn').addEventListener('click', function() {
      if (revAudio.paused) revAudio.play();
      else revAudio.pause();
    });

    document.getElementById('revRepeatBtn').addEventListener('click', function() {
      revRepeat = !revRepeat;
      this.classList.toggle('active', revRepeat);
    });

    document.getElementById('revSpeedBtn').addEventListener('click', function() {
      var speeds = [0.5, 0.75, 1, 1.25, 1.5];
      var idx = speeds.indexOf(revSpeed);
      revSpeed = speeds[(idx + 1) % speeds.length];
      revAudio.playbackRate = revSpeed;
      this.querySelector('text').textContent = revSpeed + 'x';
    });

    document.getElementById('revPrevBtn').addEventListener('click', function() {
      if (revCurrentAyahIdx > 0) {
        revCurrentAyahIdx--;
        loadRevAyah();
      }
    });

    document.getElementById('revNextBtn').addEventListener('click', function() {
      if (revCurrentAyahIdx < revLearnedAyahs.length - 1) {
        revCurrentAyahIdx++;
        loadRevAyah();
      }
    });

    document.getElementById('revBackBtn').addEventListener('click', function() {
      revAudio.pause();
      revAudio.src = '';
      renderRevision();
    });

    // Scrubber for revision player
    (function() {
      var scrub = document.getElementById('revScrubber');
      function seek(e) {
        var rect = scrub.getBoundingClientRect();
        var pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (revAudio.duration) revAudio.currentTime = pct * revAudio.duration;
      }
      scrub.addEventListener('click', seek);
      var dragging = false;
      scrub.addEventListener('mousedown', function() { dragging = true; });
      document.addEventListener('mousemove', function(e) { if (dragging) seek(e); });
      document.addEventListener('mouseup', function() { dragging = false; });
      scrub.addEventListener('touchstart', function(e) { seek(e.touches[0]); dragging = true; }, { passive: true });
      document.addEventListener('touchmove', function(e) { if (dragging) seek(e.touches[0]); }, { passive: true });
      document.addEventListener('touchend', function() { dragging = false; });
    })();
