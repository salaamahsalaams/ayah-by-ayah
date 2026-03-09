    function render() {
      const remaining = TOTAL - progress.learned;
      const viewIdx = progress.learned + viewOffset;
      const ayahNum = ayahNumAt(viewIdx);
      const isOnCurrent = viewOffset === 0;

      var prog = getProgressDisplay();
      var pillText = prog.done + ' / ' + prog.total;
      if (prog.label) pillText = prog.label + '  ·  ' + pillText;
      document.getElementById('progressPill').textContent = pillText;

      // Streak
      const badge = document.getElementById('streakBadge');
      badge.textContent = progress.streak >= 3 ? progress.streak + ' day streak' : '';

      // Buttons
      const btn = document.getElementById('learnBtn');
      const doneBtn = document.getElementById('doneLearningBtn');
      const doneMsg = document.getElementById('doneMsg');
      const banner = document.getElementById('completedBanner');

      btn.style.display = 'none';
      doneBtn.classList.remove('show');
      doneMsg.style.display = 'none';
      banner.style.display = 'none';

      if (remaining <= 0) {
        banner.style.display = 'block';
      } else if (keepLearning) {
        doneBtn.classList.add('show');
        if (viewOffset > 0) {
          // Browsing ahead — just previewing, grey out Done
          doneBtn.disabled = true;
        } else {
          // On current or reviewing learned ayahs — Done active
          doneBtn.disabled = false;
          if (isOnCurrent) { btn.style.display = ''; btn.disabled = false; }
        }
      } else if (!isOnCurrent) {
        // Browsing without keep-learning — hide action buttons
      } else if (todayCount >= settings.daily_goal && todayCount > 0) {
        doneMsg.style.display = 'block';
      } else {
        btn.style.display = ''; btn.disabled = false;
      }

      // Daily goal check: show celebration popup if goal met
      if (justLearned && remaining > 0 && isOnCurrent) {
        if (todayCount >= settings.daily_goal && !keepLearning) {
          btn.style.display = 'none';
          doneMsg.style.display = 'block';
          showGoalPopup();
        }
        justLearned = false;
      }

      // Nav buttons
      updateNavButtons();

      // Back to today button — show if navigated away from current ayah
      var bttBtn = document.getElementById('backToTodayBtn');
      if (viewOffset !== 0) {
        bttBtn.classList.add('show');
      } else {
        bttBtn.classList.remove('show');
      }

      fetchAyah(ayahNum);
    }

    function updateNavButtons() {
      const prevBtn = document.getElementById('prevAyahBtn');
      const nextBtn = document.getElementById('nextAyahBtn');
      const label = document.getElementById('ayahNavLabel');
      const remaining = TOTAL - progress.learned;

      // Previous: can go back to where today's learning started
      var todayFloor = progress.learned - todayCount;
      prevBtn.disabled = (progress.learned + viewOffset) <= todayFloor;

      // Next: always available unless at the very end
      nextBtn.disabled = (progress.learned + viewOffset) >= TOTAL - 1;

      // Label — show ayah number in surah context
      var viewIdx = progress.learned + viewOffset;
      var ayahN = ayahNumAt(viewIdx);
      var surahInfo = '';
      for (var si = SURAHS.length - 1; si >= 0; si--) {
        if (ayahN >= SURAH_STARTS[si]) {
          surahInfo = 'Ayah ' + (ayahN - SURAH_STARTS[si] + 1) + '/' + SURAHS[si][3];
          break;
        }
      }
      label.textContent = surahInfo;
    }

    // ===== DAILY GOAL COMPLETION POPUP =====
    function formatDaysYMD(totalDays) {
      var y = Math.floor(totalDays / 365);
      var m = Math.floor((totalDays % 365) / 30);
      var d = totalDays - y * 365 - m * 30;
      var simple = y === 0 && m === 0;
      if (simple) return { num: String(d), simple: true };
      var parts = [];
      if (y > 0) parts.push(y + 'y');
      if (m > 0) parts.push(m + 'm');
      if (d > 0) parts.push(d + 'd');
      return { num: parts.join(' '), simple: false };
    }

    function showGoalPopup() {
      const overlay = document.getElementById('goalOverlay');
      const popup = document.getElementById('goalPopup');

      // Always calculate projection based on ayahs (daily goal is per-ayah)
      const preAyahs = getPreCompletedAyahs();
      const ayahsLearned = Math.min(progress.learned + preAyahs, TOTAL);
      const ayahsRemaining = TOTAL - ayahsLearned;
      const goal = Math.max(settings.daily_goal, 1);
      const daysDone = Math.floor(ayahsLearned / goal);
      const daysLeft = Math.ceil(ayahsRemaining / goal);

      // Display progress in the chosen mode
      const prog = getProgressDisplay();

      // Update popup content
      document.getElementById('goalSubtitle').textContent =
        'You learned ' + todayCount + ' ayah' + (todayCount > 1 ? 's' : '') + ' today!';

      document.getElementById('goalDaysDone').textContent = formatDaysYMD(daysDone).num;
      document.getElementById('goalDaysLeft').textContent = formatDaysYMD(daysLeft).num;
      document.getElementById('goalStreak').textContent = progress.streak;

      // Projection text
      if (daysLeft > 0) {
        const finishDate = new Date();
        finishDate.setDate(finishDate.getDate() + daysLeft);
        const dateStr = finishDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById('goalProjection').textContent =
          'At ' + goal + ' ayah' + (goal > 1 ? 's' : '') +
          '/day, you\'ll complete the Quran by ' + dateStr;
      } else {
        document.getElementById('goalProjection').textContent = '';
      }

      // Ring label & animation
      const ringLabel = document.getElementById('goalRingLabel');
      const ringProgress = document.getElementById('goalRingProgress');
      const circumference = 2 * Math.PI * 40; // r=40
      ringLabel.textContent = todayCount + '/' + settings.daily_goal;

      // Reset ring
      ringProgress.style.transition = 'none';
      ringProgress.style.strokeDasharray = circumference;
      ringProgress.style.strokeDashoffset = circumference;

      // Show popup
      overlay.style.display = 'block';
      popup.style.display = 'block';

      // Animate ring after a small delay
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ringProgress.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)';
          const pct = Math.min(todayCount / settings.daily_goal, 1);
          ringProgress.style.strokeDashoffset = circumference * (1 - pct);
        });
      });

      // Spawn confetti
      spawnConfetti();
    }

    function hideGoalPopup() {
      document.getElementById('goalOverlay').style.display = 'none';
      document.getElementById('goalPopup').style.display = 'none';
      document.getElementById('goalConfetti').innerHTML = '';
      render();
    }

    function spawnConfetti() {
      const container = document.getElementById('goalConfetti');
      container.innerHTML = '';
      const colors = ['#c9a84c', '#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#f39c12', '#e67e22', '#1abc9c'];
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      for (let i = 0; i < 60; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.left = (Math.random() * screenW) + 'px';
        piece.style.width = (5 + Math.random() * 6) + 'px';
        piece.style.height = (10 + Math.random() * 10) + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        piece.style.setProperty('--fall', (screenH + 40) + 'px');
        piece.style.setProperty('--cr', (Math.random() * 1080 - 540) + 'deg');
        piece.style.setProperty('--delay', (Math.random() * 0.8) + 's');
        piece.style.setProperty('--duration', (1.5 + Math.random() * 1.5) + 's');
        container.appendChild(piece);
      }
    }

    document.getElementById('goalDismiss').addEventListener('click', hideGoalPopup);
    document.getElementById('goalOverlay').addEventListener('click', hideGoalPopup);
    document.getElementById('goalContinueNow').addEventListener('click', function() {
      hideGoalPopup();
      continueNext();
    });

    // ===== LEARN =====
    async function markLearned() {
      const today = getToday();
      if (!progress.start_date) progress.start_date = today;
      if (progress.last_date !== today) {
        if (progress.last_date && daysBetween(progress.last_date, today) === 1) progress.streak++;
        else progress.streak = 1;
        todayCount = 0;
      }
      progress.learned++;
      progress.last_date = today;
      todayCount++;
      viewOffset = 0;
      localStorage.setItem('todayCount-' + currentUser.id, todayCount);
      justLearned = true;
      render();
      await saveProgress();
    }

    function continueNext() {
      keepLearning = true;
      justLearned = false;
      render();
    }

    document.getElementById('learnBtn').addEventListener('click', markLearned);
    document.getElementById('continueBtn').addEventListener('click', continueNext);
    document.getElementById('doneLearningBtn').addEventListener('click', function() {
      keepLearning = false;
      viewOffset = 0;
      if (todayCount > 0) showGoalPopup();
      else render();
    });

    document.getElementById('prevAyahBtn').addEventListener('click', function() {
      var todayFloor = progress.learned - todayCount;
      if ((progress.learned + viewOffset) > todayFloor) {
        viewOffset--;
        render();
      }
    });

    document.getElementById('nextAyahBtn').addEventListener('click', function() {
      if ((progress.learned + viewOffset) < TOTAL - 1) {
        viewOffset++;
        render();
      }
    });

    document.getElementById('backToTodayBtn').addEventListener('click', function() {
      // Stop AR if playing
      if (arPlaying) stopAdvReciter();
      viewOffset = 0;
      render();
    });

    document.getElementById('resetBtn').addEventListener('click', async function() {
      if (confirm('Reset all progress? This cannot be undone.')) {
        progress = { learned: 0, last_date: null, streak: 0, start_date: null };
        todayCount = 0; viewOffset = 0; sessionStart = 0; keepLearning = false;
        closeSettings();
        render();
        await saveProgress();
        showToast('Progress has been reset.', 'info');
      }
    });
