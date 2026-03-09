    // ===== SUPABASE SYNC =====
    async function loadProgress() {
      const { data, error } = await sb.from('user_progress').select('*').eq('id', currentUser.id).maybeSingle();
      if (data) {
        progress = { learned: data.learned, last_date: data.last_date, streak: data.streak, start_date: data.start_date };
      } else if (!error) {
        progress = { learned: 0, last_date: null, streak: 0, start_date: null };
        sb.from('user_progress').upsert({ id: currentUser.id, learned: 0, streak: 0, last_date: null, start_date: null }, { onConflict: 'id', ignoreDuplicates: true }).then(() => {});
      }
      // Track how many we learned today
      todayCount = progress.last_date === getToday() ? (parseInt(localStorage.getItem('todayCount-' + currentUser.id) || '0', 10)) : 0;
      sessionStart = progress.learned;
      viewOffset = 0;
      keepLearning = false;
    }

    async function saveProgress() {
      const el = document.getElementById('syncStatus');
      el.textContent = 'Saving...';
      const { error } = await sb.from('user_progress').update({ learned: progress.learned, last_date: progress.last_date, streak: progress.streak, start_date: progress.start_date, updated_at: new Date().toISOString() }).eq('id', currentUser.id);
      el.textContent = error ? 'Sync error' : 'Saved';
      setTimeout(() => { el.textContent = ''; }, 2000);
    }

    const SETTINGS_LOCAL_KEY = 'user-settings-';

    async function loadSettings() {
      // Load from localStorage first for instant startup
      const cached = localStorage.getItem(SETTINGS_LOCAL_KEY + currentUser.id);
      if (cached) {
        try { Object.assign(settings, JSON.parse(cached)); } catch(e) {}
      }

      // Then fetch from Supabase and update
      try {
        const { data, error } = await sb.from('user_settings').select('*').eq('id', currentUser.id).maybeSingle();
        if (data) {
          settings = { daily_goal: data.daily_goal, reciter: data.reciter, font_size: data.font_size, playback_speed: data.playback_speed, tajweed_colors: data.tajweed_colors, theme: data.theme, direction: data.direction, show_translation: data.show_translation, notifications_enabled: data.notifications_enabled ?? false, notification_frequency: data.notification_frequency ?? 'daily', notification_count: data.notification_count ?? 1, notification_times: data.notification_times ?? ['08:00'], completed_surahs: data.completed_surahs ?? [], progression_mode: data.progression_mode ?? 'quran' };
          localStorage.setItem(SETTINGS_LOCAL_KEY + currentUser.id, JSON.stringify(settings));
        } else if (!error) {
          // First time — insert defaults
          await sb.from('user_settings').insert({ id: currentUser.id, ...settings });
          localStorage.setItem(SETTINGS_LOCAL_KEY + currentUser.id, JSON.stringify(settings));
        }
      } catch(e) {
        console.error('loadSettings:', e);
        // localStorage cache keeps us running offline
      }
    }

    let _saveSettingsTimer = null;
    function saveSettings() {
      // Save to localStorage immediately
      localStorage.setItem(SETTINGS_LOCAL_KEY + currentUser.id, JSON.stringify(settings));

      // Debounce Supabase save
      clearTimeout(_saveSettingsTimer);
      _saveSettingsTimer = setTimeout(async () => {
        try {
          const { error } = await sb.from('user_settings').upsert({
            id: currentUser.id,
            ...settings,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
          if (error) console.error('saveSettings:', error.message);
        } catch(e) {
          console.error('saveSettings:', e);
        }
      }, 500);
    }

    function applySettings() {
      // Theme
      document.documentElement.setAttribute('data-theme', settings.theme);
      // Font size
      const fs = FONT_SIZES[settings.font_size] || FONT_SIZES.medium;
      document.documentElement.style.setProperty('--ayah-font', fs.font);
      document.documentElement.style.setProperty('--ayah-line', fs.line);
      // Tajweed
      document.getElementById('ayahText').classList.toggle('no-tajweed', !settings.tajweed_colors);
      // Translation
      document.getElementById('translationText').classList.toggle('show', settings.show_translation);
      // Reciter name
      const rec = RECITERS[settings.reciter];
      document.querySelector('.reciter-name').textContent = rec ? rec.name : settings.reciter;
      // Playback speed
      const audio = document.getElementById('audioPlayer');
      audio.playbackRate = settings.playback_speed;
      const speedBtn = document.getElementById('speedBtn');
      if (speedBtn) speedBtn.querySelector('svg text').textContent = settings.playback_speed + 'x';
    }

    // ===== APP =====
    async function enterApp() {
      if (appEntered) return;
      appEntered = true;

      authScreen.style.display = 'none';
      appScreen.style.display = 'flex';

      try {
        await Promise.all([loadProgress(), loadSettings()]);
        progressLoaded = true;
      } catch (e) {
        console.error('enterApp:', e);
      }
      applySettings();
      populateSettingsUI();
      render();
      // Start notification scheduler if enabled
      if (settings.notifications_enabled) scheduleNotifications();
    }
