    // ===== STATE =====
    let currentUser = null;
    let progress = { learned: 0, last_date: null, streak: 0, start_date: null };
    let settings = { daily_goal: 1, reciter: 'ar.alafasy', font_size: 'medium', playback_speed: 1, tajweed_colors: true, theme: 'dark', direction: 'front', show_translation: false, notifications_enabled: false, notification_frequency: 'daily', notification_count: 1, notification_times: ['08:00'], completed_surahs: [], progression_mode: 'quran' };
    let isAuthSignUp = false;
    let justLearned = false;
    let appEntered = false;
    let progressLoaded = false;
    let todayCount = 0;
    let viewOffset = 0;        // 0 = current ayah, negative = reviewing previous
    let sessionStart = 0;      // progress.learned value at session start
    let keepLearning = false;   // true after "Keep learning" clicked

    function getToday() { return new Date().toISOString().slice(0, 10); }
    function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
    function fmtTime(s) { const m = Math.floor(s / 60); return m + ':' + String(Math.floor(s % 60)).padStart(2, '0'); }

    // ===== TOAST NOTIFICATIONS =====
    function showToast(message, type = 'info') {
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      const icons = { success: '\u2713', error: '\u2717', info: '\u24D8' };
      toast.innerHTML = '<span class="toast-icon">' + (icons[type] || '') + '</span><span>' + sanitizeText(message) + '</span>';
      container.appendChild(toast);
      setTimeout(() => { toast.remove(); }, 3500);
    }

    // ===== INPUT SANITIZATION =====
    function sanitizeEmail(raw) {
      // Trim, lowercase, strip anything that isn't a valid email character
      return raw.trim().toLowerCase().replace(/[^a-z0-9.@+_\-]/g, '').slice(0, 254);
    }

    function sanitizeText(raw) {
      // Strip HTML/script tags and control characters for safe display
      return raw.replace(/[<>&"']/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&#39;' })[c])
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    }

    function safeSetError(el, msg) { el.textContent = msg; }
    function safeSetMessage(el, msg) { el.textContent = msg; }
