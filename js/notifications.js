    // ===== NOTIFICATIONS =====
    let _notifInterval = null;
    let _notifFiredTimes = {}; // track which times fired today to avoid dupes

    function parse24(timeStr) {
      const parts = (timeStr || '08:00').split(':');
      return { h: parseInt(parts[0], 10), m: parseInt(parts[1], 10) || 0 };
    }

    function to12(h24) {
      const ampm = h24 < 12 ? 'AM' : 'PM';
      const h = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
      return { h, ampm };
    }

    function to24(h12, m, ampm) {
      let h = h12;
      if (ampm === 'AM' && h === 12) h = 0;
      else if (ampm === 'PM' && h !== 12) h += 12;
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }

    function buildNotifTimeInputs() {
      const container = document.getElementById('notifTimesContainer');
      container.innerHTML = '';
      const count = settings.notification_count;
      while (settings.notification_times.length < count) {
        settings.notification_times.push('08:00');
      }
      if (settings.notification_times.length > count) {
        settings.notification_times = settings.notification_times.slice(0, count);
      }

      for (let i = 0; i < count; i++) {
        const t = parse24(settings.notification_times[i]);
        const t12 = to12(t.h);

        const row = document.createElement('div');
        row.className = 'notif-time-row';
        row.innerHTML =
          '<input class="notif-time-input" data-idx="' + i + '" data-field="h" type="text" inputmode="numeric" maxlength="2" value="' + t12.h + '" />' +
          '<span class="notif-time-sep">:</span>' +
          '<input class="notif-time-input" data-idx="' + i + '" data-field="m" type="text" inputmode="numeric" maxlength="2" value="' + String(t.m).padStart(2, '0') + '" />' +
          '<div class="notif-ampm-group">' +
            '<button class="notif-ampm-btn' + (t12.ampm === 'AM' ? ' active' : '') + '" data-idx="' + i + '" data-val="AM">AM</button>' +
            '<button class="notif-ampm-btn' + (t12.ampm === 'PM' ? ' active' : '') + '" data-idx="' + i + '" data-val="PM">PM</button>' +
          '</div>';
        container.appendChild(row);
      }

      // Event delegation — only bind once
      if (container._notifBound) return;
      container._notifBound = true;
      container.addEventListener('input', function(e) {
        if (!e.target.classList.contains('notif-time-input')) return;
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
      });

      container.addEventListener('change', function(e) {
        if (!e.target.classList.contains('notif-time-input')) return;
        const idx = parseInt(e.target.dataset.idx, 10);
        const row = e.target.closest('.notif-time-row');
        const hInput = row.querySelector('[data-field="h"]');
        const mInput = row.querySelector('[data-field="m"]');
        const activeAmpm = row.querySelector('.notif-ampm-btn.active');

        let h = parseInt(hInput.value, 10) || 12;
        let m = parseInt(mInput.value, 10) || 0;
        if (h < 1) h = 1; if (h > 12) h = 12;
        if (m < 0) m = 0; if (m > 59) m = 59;
        hInput.value = h;
        mInput.value = String(m).padStart(2, '0');

        settings.notification_times[idx] = to24(h, m, activeAmpm.dataset.val);
        saveSettings();
        scheduleNotifications();
      });

      container.addEventListener('click', function(e) {
        if (!e.target.classList.contains('notif-ampm-btn')) return;
        const idx = parseInt(e.target.dataset.idx, 10);
        const row = e.target.closest('.notif-time-row');
        const hInput = row.querySelector('[data-field="h"]');
        const mInput = row.querySelector('[data-field="m"]');

        // Toggle active state on both buttons in the group
        row.querySelectorAll('.notif-ampm-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const h = parseInt(hInput.value, 10) || 12;
        const m = parseInt(mInput.value, 10) || 0;
        settings.notification_times[idx] = to24(h, m, e.target.dataset.val);
        saveSettings();
        scheduleNotifications();
      });
    }

    function toggleNotifSettings() {
      document.getElementById('notifSettings').style.display = settings.notifications_enabled ? '' : 'none';
    }

    async function requestNotifPermission() {
      if (!('Notification' in window)) {
        showToast('Your browser doesn\'t support notifications.', 'error');
        return false;
      }
      if (Notification.permission === 'granted') return true;
      if (Notification.permission === 'denied') {
        showToast('Notifications are blocked. Please enable them in your browser settings.', 'error');
        return false;
      }
      const result = await Notification.requestPermission();
      if (result === 'granted') return true;
      showToast('Notification permission was not granted.', 'error');
      return false;
    }

    function getNextAyahText() {
      const num = currentAyahNum();
      const cached = localStorage.getItem(AYAH_CACHE_KEY + num);
      if (cached) {
        const data = JSON.parse(cached);
        // Strip tajweed tags for plain text
        const plain = data.text_tajweed.replace(/\[[a-z]:?[^\]]*\]/g, '').replace(/\[/g, '').replace(/\]/g, '');
        return { surah: data.surah_english, ayahNum: data.ayah_in_surah, text: plain };
      }
      return null;
    }

    function fireNotification() {
      if (Notification.permission !== 'granted') return;
      const remaining = TOTAL - progress.learned;
      if (remaining <= 0) return;

      const ayahInfo = getNextAyahText();
      let title = 'Time to learn your ayah!';
      let body = 'You have ' + settings.daily_goal + ' ayah' + (settings.daily_goal > 1 ? 's' : '') + ' to learn today.';

      if (ayahInfo) {
        title = ayahInfo.surah + ' - Ayah ' + ayahInfo.ayahNum;
        body = ayahInfo.text.length > 120 ? ayahInfo.text.slice(0, 120) + '...' : ayahInfo.text;
      }

      // Always use service worker — notifications come from the app, not the browser
      navigator.serviceWorker.ready.then(function(reg) {
        reg.showNotification(title, {
          body: body, icon: 'logo.svg', tag: 'ayah-reminder', renotify: true
        });
      });
    }

    function isNotificationDay() {
      const freq = settings.notification_frequency || 'daily';
      if (freq === 'daily') return true;

      // Use start_date as anchor, fall back to today
      const anchor = progress.start_date ? new Date(progress.start_date) : new Date();
      const now = new Date();
      const diffDays = Math.floor((now - anchor) / 86400000);

      if (freq === 'weekly') return diffDays % 7 === 0;
      if (freq === 'biweekly') return diffDays % 14 === 0;
      if (freq === 'monthly') return now.getDate() === anchor.getDate();
      return true;
    }

    function scheduleNotifications() {
      clearInterval(_notifInterval);
      _notifFiredTimes = {};
      syncSettingsToSW();

      if (!settings.notifications_enabled || !settings.notification_times.length) return;

      // Check every 30 seconds
      _notifInterval = setInterval(() => {
        if (!isNotificationDay()) return;

        const now = new Date();
        const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        const todayKey = getToday();

        for (const time of settings.notification_times) {
          const firedKey = todayKey + '-' + time;
          if (currentTime === time && !_notifFiredTimes[firedKey]) {
            _notifFiredTimes[firedKey] = true;
            fireNotification();
          }
        }

        // Reset tracking at midnight
        if (currentTime === '00:00') {
          _notifFiredTimes = {};
        }
      }, 30000);
    }

    document.getElementById('setNotifications').addEventListener('change', async function() {
      if (this.checked) {
        const granted = await requestNotifPermission();
        if (!granted) {
          this.checked = false;
          return;
        }
        settings.notifications_enabled = true;
      } else {
        settings.notifications_enabled = false;
      }
      toggleNotifSettings();
      saveSettings();
      scheduleNotifications();
    });

    document.getElementById('setNotifCount').addEventListener('change', function() {
      settings.notification_count = parseInt(this.value, 10);
      buildNotifTimeInputs();
      saveSettings();
      scheduleNotifications();
    });
