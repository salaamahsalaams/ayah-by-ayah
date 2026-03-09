    // ===== QURAN VIEW =====
    function getPreCompletedAyahs() {
      const cs = settings.completed_surahs || [];
      let total = 0;
      for (let i = 0; i < cs.length; i++) {
        const idx = cs[i];
        if (idx >= 0 && idx < SURAHS.length) total += SURAHS[idx][3];
      }
      return total;
    }

    let _lastQuranDirection = null;
    let _surahClickBound = false;

    function renderQuran() {
      const preAyahs = getPreCompletedAyahs();
      const learned = Math.min(progress.learned + preAyahs, TOTAL);
      const pct = ((learned / TOTAL) * 100).toFixed(1);

      document.getElementById('quranOverallFill').style.width = pct + '%';
      document.getElementById('quranOverallText').textContent = learned.toLocaleString() + ' of 6,236 ayahs learned (' + pct + '%)';

      const container = document.getElementById('surahList');
      const isBack = settings.direction === 'back';

      // Rebuild if not built or direction changed
      if (container.children.length === 0 || _lastQuranDirection !== settings.direction) {
        _lastQuranDirection = settings.direction;
        const order = [];
        for (let i = 0; i < SURAHS.length; i++) order.push(i);
        if (isBack) order.reverse();

        let html = '';
        for (const i of order) {
          const [num, en, ar, count] = SURAHS[i];
          html += '<div class="surah-card" data-idx="' + i + '">';
          html += '<div class="surah-card-header">';
          html += '<div class="surah-num">' + num + '</div>';
          html += '<div class="surah-card-info">';
          html += '<div class="surah-card-name"><span>' + en + '</span><span class="surah-card-name-ar">' + ar + '</span></div>';
          html += '<div class="surah-card-progress"><div class="surah-bar"><div class="surah-bar-fill" id="sbar' + i + '"></div></div><span class="surah-pct" id="spct' + i + '"></span></div>';
          html += '</div></div>';
          html += '<div class="surah-dots" id="sdots' + i + '">';
          for (let a = 0; a < count; a++) {
            html += '<div class="ayah-dot" id="adot' + i + '_' + a + '"></div>';
          }
          html += '</div></div>';
        }
        container.innerHTML = html;

        if (!_surahClickBound) {
          _surahClickBound = true;
          container.addEventListener('click', function(e) {
            const card = e.target.closest('.surah-card');
            if (card) card.classList.toggle('expanded');
          });
        }
      }

      // Update fills
      for (let i = 0; i < SURAHS.length; i++) {
        const count = SURAHS[i][3];
        const preCompleted = (settings.completed_surahs || []).indexOf(i) !== -1;
        const done = preCompleted ? count : getLearnedInSurah(i);
        const sp = count > 0 ? Math.round((done / count) * 100) : 0;

        document.getElementById('sbar' + i).style.width = sp + '%';
        document.getElementById('spct' + i).textContent = done + '/' + count;

        const card = document.querySelector('.surah-card[data-idx="' + i + '"]');
        if (done >= count) card.classList.add('complete');
        else card.classList.remove('complete');
        if (preCompleted) card.classList.add('pre-completed');
        else card.classList.remove('pre-completed');

        for (let a = 0; a < count; a++) {
          const dot = document.getElementById('adot' + i + '_' + a);
          if (a < done) dot.classList.add('done');
          else dot.classList.remove('done');
        }
      }
    }

    // ===== MARK COMPLETED POPUP =====
    (function() {
      const btn = document.getElementById('markCompletedBtn');
      const overlay = document.getElementById('mcOverlay');
      const popup = document.getElementById('mcPopup');
      const closeBtn = document.getElementById('mcClose');
      const saveBtn = document.getElementById('mcSaveBtn');
      const list = document.getElementById('mcList');

      function openMcPopup() {
        // Build list
        let html = '';
        const checked = settings.completed_surahs || [];
        for (let i = 0; i < SURAHS.length; i++) {
          const [num, en, ar] = SURAHS[i];
          const isChecked = checked.indexOf(i) !== -1;
          html += '<div class="mc-item' + (isChecked ? ' checked' : '') + '" data-idx="' + i + '">';
          html += '<span class="mc-num">' + num + '</span>';
          html += '<div class="mc-check"></div>';
          html += '<div class="mc-info"><div class="mc-name"><span>' + en + '</span><span class="mc-name-ar">' + ar + '</span></div></div>';
          html += '</div>';
        }
        list.innerHTML = html;
        overlay.classList.add('show');
        popup.classList.add('show');
      }

      function closeMcPopup() {
        overlay.classList.remove('show');
        popup.classList.remove('show');
      }

      btn.addEventListener('click', openMcPopup);
      overlay.addEventListener('click', closeMcPopup);
      closeBtn.addEventListener('click', closeMcPopup);

      list.addEventListener('click', function(e) {
        const item = e.target.closest('.mc-item');
        if (item) item.classList.toggle('checked');
      });

      saveBtn.addEventListener('click', function() {
        const items = list.querySelectorAll('.mc-item.checked');
        const completed = [];
        items.forEach(function(el) { completed.push(parseInt(el.dataset.idx)); });
        settings.completed_surahs = completed;
        saveSettings();
        closeMcPopup();
        renderQuran();
        showToast('Completed surahs updated', 'success');
      });
    })();
