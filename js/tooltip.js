    // ===== TAJWEED TOOLTIP =====
    (function() {
      const tooltip = document.getElementById('tjTooltip');
      document.getElementById('ayahText').addEventListener('click', function(e) {
        const span = e.target.closest('.tj');
        if (!span) { tooltip.classList.remove('show'); return; }
        const rule = TAJWEED_RULES[span.dataset.rule];
        if (!rule) return;
        document.getElementById('tjRuleName').textContent = rule.name;
        document.getElementById('tjRuleName').style.color = getComputedStyle(span).color;
        document.getElementById('tjRuleArabic').textContent = rule.arabic;
        document.getElementById('tjRuleDesc').textContent = rule.desc;
        tooltip.classList.add('show');
        const rect = span.getBoundingClientRect();
        let top = rect.bottom + 8, left = rect.left + rect.width / 2 - 140;
        if (left < 8) left = 8;
        if (left + 280 > window.innerWidth) left = window.innerWidth - 288;
        if (top + 150 > window.innerHeight) top = rect.top - tooltip.offsetHeight - 8;
        tooltip.style.top = top + 'px'; tooltip.style.left = left + 'px';
      });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.tj') && !e.target.closest('.tj-tooltip')) tooltip.classList.remove('show');
      });
    })();

    // ===== LEGEND =====
    document.getElementById('legendBtn').addEventListener('click', () => {
      document.getElementById('legendPanel').classList.add('show');
      document.getElementById('legendOverlay').classList.add('show');
    });
    function closeLegend() {
      document.getElementById('legendPanel').classList.remove('show');
      document.getElementById('legendOverlay').classList.remove('show');
    }
    document.getElementById('legendClose').addEventListener('click', closeLegend);
    document.getElementById('legendOverlay').addEventListener('click', closeLegend);
