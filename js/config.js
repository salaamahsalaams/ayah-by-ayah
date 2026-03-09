    // ===== CONFIG =====
    const SUPABASE_URL = 'https://zmkqhjitnijxafroznmz.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_KMvO-DqZIXOaGzxiJ5NRog_QokljpPK';
    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const TOTAL = 6236;

    const RECITERS = {
      'ar.alafasy':              { name: 'Mishary Rashid Alafasy', bitrate: 128 },
      'ar.abdurrahmaansudais':   { name: 'Abdurrahman As-Sudais',  bitrate: 192 },
      'ar.hudhaify':             { name: 'Ali Al-Hudhaify',         bitrate: 128 },
      'ar.abdulsamad':           { name: 'Abdul Samad',             bitrate: 64  },
      'ar.ahmedajamy':           { name: 'Ahmed al-Ajamy',          bitrate: 128 },
      'ar.muhammadayyoub':       { name: 'Muhammad Ayyoub',         bitrate: 128 },
      'ar.minshawi':             { name: 'Mohamed Al-Minshawi',     bitrate: 128 },
      'ar.saoodshuraym':         { name: 'Saud Ash-Shuraym',        bitrate: 64  }
    };

    const FONT_SIZES = {
      small:  { font: 'clamp(1.2rem, 3.5vw, 1.6rem)', line: '2.2' },
      medium: { font: 'clamp(1.5rem, 5vw, 2.2rem)',   line: '2.4' },
      large:  { font: 'clamp(1.8rem, 6vw, 2.8rem)',   line: '2.6' },
      xlarge: { font: 'clamp(2rem, 7.5vw, 3.4rem)',   line: '2.8' }
    };

    function getAudioBase() {
      const r = RECITERS[settings.reciter] || { bitrate: 128 };
      return 'https://cdn.islamic.network/quran/audio/' + r.bitrate + '/' + settings.reciter;
    }

    const TAJWEED_RULES = {
      h: { name: 'Hamzat ul Wasl', arabic: '\u0647\u0645\u0632\u0629 \u0627\u0644\u0648\u0635\u0644', desc: 'A connecting hamza not pronounced when continuing from the previous word. Only pronounced at the start of speech.' },
      l: { name: 'Lam Shamsiyyah', arabic: '\u0644\u0627\u0645 \u0634\u0645\u0633\u064a\u0629', desc: 'The lam in "Al" is silent and the following letter is doubled. Occurs before sun letters.' },
      n: { name: 'Madd (Natural)', arabic: '\u0645\u062f \u0637\u0628\u064a\u0639\u064a', desc: 'A natural prolongation of 2 counts. Elongate the vowel sound naturally.' },
      p: { name: 'Madd Leen', arabic: '\u0645\u062f \u0644\u064a\u0646', desc: 'A soft prolongation on waw or ya saakinah preceded by fathah. Extended 2-6 counts when stopping.' },
      m: { name: 'Madd Muttasil', arabic: '\u0645\u062f \u0645\u062a\u0635\u0644', desc: 'Compulsory connected prolongation of 4-5 counts. Madd letter followed by hamza in the same word.' },
      s: { name: 'Silent Letter', arabic: '\u062d\u0631\u0641 \u0644\u0627 \u064a\u064f\u0646\u0637\u064e\u0642', desc: 'This letter is written but not pronounced in recitation.' },
      o: { name: 'Madd Munfasil', arabic: '\u0645\u062f \u0645\u0646\u0641\u0635\u0644', desc: 'Separated prolongation of 4-5 counts. Madd letter at end of word followed by hamza at start of next.' },
      c: { name: 'Ikhfa Shafawi', arabic: '\u0625\u062e\u0641\u0627\u0621 \u0634\u0641\u0648\u064a', desc: 'Hiding of meem saakinah before ba. Light nasal sound (ghunnah) for 2 counts.' },
      a: { name: 'Idgham', arabic: '\u0625\u062f\u063a\u0627\u0645', desc: 'Merging of noon saakinah or tanween into the following letter, often with a nasal sound.' },
      q: { name: 'Qalqalah', arabic: '\u0642\u0644\u0642\u0644\u0629', desc: 'Echoing/bouncing sound on letters \u0642 \u0637 \u0628 \u062c \u062f when they carry sukoon.' },
      f: { name: 'Ikhfa', arabic: '\u0625\u062e\u0641\u0627\u0621 \u062d\u0642\u064a\u0642\u064a', desc: 'Concealment of noon saakinah or tanween before certain letters, with nasal ghunnah of 2 counts.' },
      w: { name: 'Idgham Shafawi', arabic: '\u0625\u062f\u063a\u0627\u0645 \u0634\u0641\u0648\u064a', desc: 'Meem saakinah merges into following meem with ghunnah of 2 counts.' },
      e: { name: 'Iqlab', arabic: '\u0625\u0642\u0644\u0627\u0628', desc: 'Noon saakinah or tanween converts to meem sound before ba, with ghunnah of 2 counts.' },
      g: { name: 'Ghunnah', arabic: '\u063a\u0646\u0651\u0629', desc: 'A nasal sound from the nose for 2 counts. Accompanies noon and meem with shaddah.' }
    };
