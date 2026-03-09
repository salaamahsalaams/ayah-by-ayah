    // ===== PROGRESS / STATS TAB =====
    function renderProgress() {
      var preAyahs = getPreCompletedAyahs();
      var totalLearned = Math.min(progress.learned + preAyahs, TOTAL);
      var totalRemaining = TOTAL - totalLearned;
      var pct = TOTAL > 0 ? (totalLearned / TOTAL * 100) : 0;
      var goal = Math.max(settings.daily_goal, 1);

      // Surahs
      var completedSurahs = getCompletedSurahs();
      var remainingSurahs = TOTAL_SURAHS - completedSurahs;

      // Juz
      var completedJuz = getCompletedJuz();
      var remainingJuz = TOTAL_JUZ - completedJuz;

      // Current position
      var currentGlobal = ayahNumAt(Math.max(0, progress.learned));
      var currentSurahIdx = getSurahForAyah(currentGlobal);
      var currentJuzIdx = getJuzForAyah(currentGlobal);

      // Time stats
      var daysSinceStart = 0;
      var avgPerDay = 0;
      if (progress.start_date) {
        var start = new Date(progress.start_date);
        var now = new Date();
        daysSinceStart = Math.max(1, Math.floor((now - start) / 86400000));
        avgPerDay = (totalLearned / daysSinceStart).toFixed(1);
      }

      // Projection
      var daysLeft = Math.ceil(totalRemaining / goal);
      var daysDone = Math.floor(totalLearned / goal);
      var finishDateStr = '';
      if (daysLeft > 0) {
        var finishDate = new Date();
        finishDate.setDate(finishDate.getDate() + daysLeft);
        finishDateStr = finishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      // Ring
      var circumference = 2 * Math.PI * 52;
      var ringEl = document.getElementById('statsRingFill');
      var ringLabel = document.getElementById('statsRingLabel');
      ringLabel.textContent = pct.toFixed(1) + '%';
      ringEl.style.strokeDasharray = circumference;
      ringEl.style.strokeDashoffset = circumference * (1 - pct / 100);

      // Stat cards
      var grid = document.getElementById('statsGrid');
      grid.innerHTML = buildStatCard(totalLearned.toLocaleString(), 'Ayahs Learned')
        + buildStatCard(totalRemaining.toLocaleString(), 'Ayahs Left')
        + buildStatCard(completedSurahs + ' / ' + TOTAL_SURAHS, 'Surahs Done')
        + buildStatCard(completedJuz + ' / ' + TOTAL_JUZ, 'Juz Done')
        + buildStatCard(progress.streak, 'Day Streak')
        + buildStatCard(todayCount, 'Today');

      // Breakdown sections
      var html = '';

      // Current position
      html += '<div class="stats-section">'
        + '<div class="stats-section-title">Current Position</div>'
        + buildStatsRow('Surah', SURAHS[currentSurahIdx][1] + ' (' + SURAHS[currentSurahIdx][0] + '/114)')
        + buildStatsRow('Juz', (currentJuzIdx + 1) + ' of 30')
        + buildStatsRow('Ayah', currentGlobal.toLocaleString() + ' of 6,236')
        + '</div>';

      // Time & Pace
      html += '<div class="stats-section">'
        + '<div class="stats-section-title">Time & Pace</div>'
        + buildStatsRow('Daily Goal', goal + ' ayah' + (goal > 1 ? 's' : '') + '/day')
        + buildStatsRow('Average', avgPerDay + ' ayahs/day')
        + buildStatsRow('Days Active', daysSinceStart > 0 ? daysSinceStart + ' day' + (daysSinceStart > 1 ? 's' : '') : 'Not started')
        + buildStatsRow('Days Done', formatDaysYMD(daysDone).num + (formatDaysYMD(daysDone).simple ? ' days' : ''))
        + buildStatsRow('Days Left', formatDaysYMD(daysLeft).num + (formatDaysYMD(daysLeft).simple ? ' days' : ''))
        + (finishDateStr ? buildStatsRow('Projected Finish', finishDateStr) : '')
        + '</div>';

      // Surah progress bar
      html += '<div class="stats-section">'
        + '<div class="stats-section-title">Breakdown</div>'
        + buildStatsBar('Surahs', completedSurahs, TOTAL_SURAHS)
        + buildStatsBar('Juz', completedJuz, TOTAL_JUZ)
        + buildStatsBar('Ayahs', totalLearned, TOTAL)
        + '</div>';

      document.getElementById('statsBreakdown').innerHTML = html;
    }

    function buildStatCard(value, label) {
      return '<div class="stat-card"><div class="stat-card-value">' + value + '</div><div class="stat-card-label">' + label + '</div></div>';
    }

    function buildStatsRow(label, value) {
      return '<div class="stats-row"><span class="stats-row-label">' + label + '</span><span class="stats-row-value">' + value + '</span></div>';
    }

    function buildStatsBar(label, done, total) {
      var pct = total > 0 ? (done / total * 100).toFixed(1) : 0;
      return '<div class="stats-bar-row">'
        + '<div class="stats-bar-header"><span>' + label + '</span><span>' + done + ' / ' + total + '</span></div>'
        + '<div class="stats-bar"><div class="stats-bar-fill" style="width:' + pct + '%"></div></div>'
        + '</div>';
    }
