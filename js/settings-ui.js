    // ===== SETTINGS PANEL =====
    function openSettings() {
      document.getElementById('settingsPanel').classList.add('show');
      document.getElementById('settingsOverlay').classList.add('show');
    }
    function closeSettings() {
      document.getElementById('settingsPanel').classList.remove('show');
      document.getElementById('settingsOverlay').classList.remove('show');
    }

    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('settingsClose').addEventListener('click', closeSettings);
    document.getElementById('settingsOverlay').addEventListener('click', closeSettings);

    function populateSettingsUI() {
      document.getElementById('setDailyGoal').value = settings.daily_goal;
      document.getElementById('setDirection').value = settings.direction;
      document.getElementById('setProgression').value = settings.progression_mode || 'quran';
      document.getElementById('setTheme').value = settings.theme;
      document.getElementById('setFontSize').value = settings.font_size;
      document.getElementById('setTajweed').checked = settings.tajweed_colors;
      document.getElementById('setTranslation').checked = settings.show_translation;
      document.getElementById('setReciter').value = settings.reciter;
      document.getElementById('setSpeed').value = settings.playback_speed;

      // Notifications
      document.getElementById('setNotifications').checked = settings.notifications_enabled;
      document.getElementById('setNotifCount').value = settings.notification_count;
      toggleNotifSettings();
      buildNotifTimeInputs();

      // Populate surah picker
      const surahSel = document.getElementById('setSurah');
      if (surahSel.options.length === 0) {
        for (let i = 0; i < SURAHS.length; i++) {
          const o = document.createElement('option');
          o.value = i;
          o.textContent = SURAHS[i][0] + '. ' + SURAHS[i][1];
          surahSel.appendChild(o);
        }
      }
      updateAyahPicker();
    }

    function updateAyahPicker() {
      const surahIdx = parseInt(document.getElementById('setSurah').value, 10);
      const ayahSel = document.getElementById('setAyah');
      const count = SURAHS[surahIdx][3];
      ayahSel.innerHTML = '';
      for (let a = 1; a <= count; a++) {
        const o = document.createElement('option');
        o.value = a;
        o.textContent = 'Ayah ' + a;
        ayahSel.appendChild(o);
      }
    }

    document.getElementById('setSurah').addEventListener('change', updateAyahPicker);

    // Setting change handlers
    document.getElementById('setDailyGoal').addEventListener('input', function() {
      // Strip non-digits
      this.value = this.value.replace(/[^0-9]/g, '');
      let val = parseInt(this.value, 10);
      if (isNaN(val) || val < 1) return;
      if (val > 50) { val = 50; this.value = 50; }
      settings.daily_goal = val;
      saveSettings();
    });

    document.getElementById('setDailyGoal').addEventListener('blur', function() {
      let val = parseInt(this.value, 10);
      if (isNaN(val) || val < 1) { val = 1; this.value = 1; }
      if (val > 50) { val = 50; this.value = 50; }
      settings.daily_goal = val;
      saveSettings();
    });

    document.getElementById('setDirection').addEventListener('change', function() {
      settings.direction = this.value;
      saveSettings();
      render();
      renderQuran();
    });

    document.getElementById('setProgression').addEventListener('change', function() {
      settings.progression_mode = this.value;
      saveSettings();
      render();
      renderQuran();
    });

    document.getElementById('setTheme').addEventListener('change', function() {
      settings.theme = this.value;
      applySettings();
      saveSettings();
    });

    document.getElementById('setFontSize').addEventListener('change', function() {
      settings.font_size = this.value;
      applySettings();
      saveSettings();
    });

    document.getElementById('setTajweed').addEventListener('change', function() {
      settings.tajweed_colors = this.checked;
      applySettings();
      saveSettings();
    });

    document.getElementById('setTranslation').addEventListener('change', function() {
      settings.show_translation = this.checked;
      applySettings();
      saveSettings();
      if (this.checked) fetchTranslation(currentAyahNum());
      else document.getElementById('translationText').textContent = '';
    });

    document.getElementById('setReciter').addEventListener('change', function() {
      settings.reciter = this.value;
      applySettings();
      saveSettings();
      // Reload current audio
      const audio = document.getElementById('audioPlayer');
      audio.src = getAudioBase() + '/' + currentAyahNum() + '.mp3';
      audio.load();
    });

    document.getElementById('setSpeed').addEventListener('change', function() {
      settings.playback_speed = parseFloat(this.value);
      document.getElementById('audioPlayer').playbackRate = settings.playback_speed;
      document.getElementById('speedBtn').querySelector('svg text').textContent = this.value + 'x';
      saveSettings();
    });
