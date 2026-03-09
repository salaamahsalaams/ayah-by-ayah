    // ===== SERVICE WORKER =====
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').then(() => {
        navigator.serviceWorker.ready.then(() => { syncSettingsToSW(); });
      }).catch(() => {});
      navigator.serviceWorker.addEventListener('controllerchange', () => { syncSettingsToSW(); });
    }

    function syncSettingsToSW() {
      if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;
      var ayahInfo = getNextAyahText();
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_NOTIF_SETTINGS',
        settings: {
          enabled: settings.notifications_enabled,
          times: settings.notification_times || [],
          daily_goal: settings.daily_goal
        },
        ayah: ayahInfo ? {
          title: ayahInfo.surah + ' - Ayah ' + ayahInfo.ayahNum,
          body: ayahInfo.text.length > 120 ? ayahInfo.text.slice(0, 120) + '...' : ayahInfo.text
        } : null
      });
    }

    // ===== INIT =====
    // Auth is handled entirely by onAuthStateChange above
  </script>
