    // ===== TAB SWITCHING =====
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('tab' + this.dataset.tab.charAt(0).toUpperCase() + this.dataset.tab.slice(1)).classList.add('active');
        // Pause audio when switching tabs
        if (this.dataset.tab !== 'today') document.getElementById('audioPlayer').pause();
        if (this.dataset.tab !== 'revision') { revAudio.pause(); revAudio.src = ''; }
        if (this.dataset.tab === 'quran') renderQuran();
        if (this.dataset.tab === 'revision') renderRevision();
        if (this.dataset.tab === 'progress') renderProgress();
      });
    });
