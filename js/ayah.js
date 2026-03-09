    // ===== TAJWEED PARSER =====
    function parseTajweed(raw) {
      let html = '', i = 0;
      while (i < raw.length) {
        if (raw[i] === '[') {
          const rc = raw[i + 1]; let j = i + 2;
          if (raw[j] === ':') { j++; while (j < raw.length && raw[j] !== '[') j++; }
          if (raw[j] === '[') {
            j++; let depth = 1, content = '';
            while (j < raw.length && depth > 0) { if (raw[j] === '[') depth++; else if (raw[j] === ']') depth--; if (depth > 0) content += raw[j]; j++; }
            if (j < raw.length && raw[j] === ']') j++;
            const k = rc.toLowerCase();
            html += TAJWEED_RULES[k] ? '<span class="tj tj-' + k + '" data-rule="' + k + '">' + esc(content) + '</span>' : esc(content);
            i = j;
          } else { html += esc(raw[i]); i++; }
        } else { html += esc(raw[i]); i++; }
      }
      return html;
    }

    function esc(t) { return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    // ===== FETCH AYAH (with local cache) =====
    const AYAH_CACHE_KEY = 'ayah-cache-';
    const TRANS_CACHE_KEY = 'trans-cache-';

    async function fetchAyah(num) {
      const textEl = document.getElementById('ayahText');
      const nameEl = document.getElementById('surahName');
      const metaEl = document.getElementById('surahMeta');

      const cached = localStorage.getItem(AYAH_CACHE_KEY + num);
      if (cached) {
        const data = JSON.parse(cached);
        displayAyah(data, textEl, nameEl, metaEl, num);
        return;
      }

      textEl.innerHTML = '<span class="loading-text">Loading...</span>';

      try {
        const { data, error } = await sb.from('ayahs').select('*').eq('number', num).single();
        if (error) throw new Error(error.message);
        localStorage.setItem(AYAH_CACHE_KEY + num, JSON.stringify(data));
        displayAyah(data, textEl, nameEl, metaEl, num);
        prefetchAyahs(num + 1, 5);
      } catch (err) {
        try {
          const resp = await fetch('https://api.alquran.cloud/v1/ayah/' + num + '/quran-tajweed');
          const json = await resp.json();
          const d = json.data;
          const data = { number: d.number, surah_name: d.surah.name, surah_english: d.surah.englishName, ayah_in_surah: d.numberInSurah, text_tajweed: d.text };
          localStorage.setItem(AYAH_CACHE_KEY + num, JSON.stringify(data));
          displayAyah(data, textEl, nameEl, metaEl, num);
        } catch (err2) {
          textEl.innerHTML = '<span class="error-text">Could not load ayah</span>';
          nameEl.textContent = ''; metaEl.textContent = 'Ayah #' + num;
        }
      }
    }

    function displayAyah(data, textEl, nameEl, metaEl, num) {
      nameEl.textContent = data.surah_name;
      metaEl.textContent = data.surah_english + '  \u00B7  Ayah ' + data.ayah_in_surah;
      textEl.innerHTML = parseTajweed(data.text_tajweed);

      const audio = document.getElementById('audioPlayer');
      audio.src = getAudioBase() + '/' + num + '.mp3';
      audio.playbackRate = settings.playback_speed;
      audio.load();

      // Translation
      if (settings.show_translation) fetchTranslation(num);
      else document.getElementById('translationText').textContent = '';
    }

    async function fetchTranslation(num) {
      const el = document.getElementById('translationText');
      const cached = localStorage.getItem(TRANS_CACHE_KEY + num);
      if (cached) { el.textContent = cached; return; }

      el.textContent = 'Loading translation...';
      try {
        const resp = await fetch('https://api.alquran.cloud/v1/ayah/' + num + '/en.sahih');
        const json = await resp.json();
        const text = json.data.text;
        localStorage.setItem(TRANS_CACHE_KEY + num, text);
        el.textContent = text;
      } catch (e) {
        el.textContent = 'Translation unavailable';
      }
    }

    async function prefetchAyahs(start, count) {
      const end = Math.min(start + count - 1, TOTAL);
      const needed = [];
      for (let i = start; i <= end; i++) {
        if (!localStorage.getItem(AYAH_CACHE_KEY + i)) needed.push(i);
      }
      if (needed.length === 0) return;
      try {
        const { data } = await sb.from('ayahs').select('*').in('number', needed);
        if (data) data.forEach(a => localStorage.setItem(AYAH_CACHE_KEY + a.number, JSON.stringify(a)));
      } catch (e) { /* silent */ }
    }
