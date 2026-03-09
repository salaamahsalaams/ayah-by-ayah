    // Back-to-front: surahs in reverse (114→1), ayahs within each surah forward (1→2→3)
    // Maps a progress index (0-based) to a global ayah number
    function backToFrontGlobal(idx) {
      let count = 0;
      for (let s = SURAHS.length - 1; s >= 0; s--) {
        const surahCount = SURAHS[s][3];
        if (idx < count + surahCount) {
          const ayahInSurah = idx - count; // 0-based
          return SURAH_STARTS[s] + ayahInSurah;
        }
        count += surahCount;
      }
      return 1;
    }

    // Maps a surah index + ayah-in-surah (1-based) to a back-to-front progress index
    function backToFrontIndex(surahIdx, ayahInSurah) {
      let count = 0;
      for (let s = SURAHS.length - 1; s > surahIdx; s--) {
        count += SURAHS[s][3];
      }
      return count + (ayahInSurah - 1);
    }

    // How many ayahs are learned in a given surah (for back-to-front tracker)
    function getLearnedInSurah(surahIdx) {
      if (settings.direction !== 'back') {
        const start = SURAH_STARTS[surahIdx];
        const count = SURAHS[surahIdx][3];
        return Math.max(0, Math.min(count, progress.learned - start + 1));
      }
      // Back-to-front: count how many in this surah are done
      let before = 0;
      for (let s = SURAHS.length - 1; s > surahIdx; s--) {
        before += SURAHS[s][3];
      }
      const surahCount = SURAHS[surahIdx][3];
      const doneInSurah = Math.max(0, Math.min(surahCount, progress.learned - before));
      return doneInSurah;
    }

    function ayahNumAt(learnedIdx) {
      var idx = Math.max(0, Math.min(learnedIdx, TOTAL - 1));
      if (settings.direction === 'back') return backToFrontGlobal(idx);
      return idx + 1;
    }

    function currentAyahNum() {
      return ayahNumAt(progress.learned);
    }
