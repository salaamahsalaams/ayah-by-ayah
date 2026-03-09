    // Jump to position
    document.getElementById('jumpBtn').addEventListener('click', async function() {
      const surahIdx = parseInt(document.getElementById('setSurah').value, 10);
      const ayahInSurah = parseInt(document.getElementById('setAyah').value, 10);
      if (settings.direction === 'back') {
        progress.learned = backToFrontIndex(surahIdx, ayahInSurah);
      } else {
        const globalAyah = SURAH_STARTS[surahIdx] + ayahInSurah - 1;
        progress.learned = globalAyah - 1;
      }
      todayCount = 0; viewOffset = 0; sessionStart = progress.learned; keepLearning = false;
      localStorage.setItem('todayCount-' + currentUser.id, '0');
      render();
      await saveProgress();
      showToast('Jumped to ' + SURAHS[surahIdx][1] + ', Ayah ' + ayahInSurah, 'success');
    });

    // Change password
    document.getElementById('changePwBtn').addEventListener('click', async function() {
      const newPw = document.getElementById('newPwInput').value;
      const confirmPw = document.getElementById('confirmPwInput').value;

      if (newPw.length > 128) { showToast('Password must be 128 characters or fewer.', 'error'); return; }

      const v = validatePassword(newPw);
      if (!Object.values(v).every(Boolean)) {
        showToast('Password needs: 8+ chars, uppercase, lowercase, number, special character.', 'error');
        return;
      }
      if (newPw !== confirmPw) { showToast('Passwords do not match.', 'error'); return; }

      this.disabled = true;
      const { error } = await sb.auth.updateUser({ password: newPw });
      this.disabled = false;

      if (error) showToast(error.message, 'error');
      else {
        showToast('Password updated successfully!', 'success');
        document.getElementById('newPwInput').value = '';
        document.getElementById('confirmPwInput').value = '';
      }
    });

    // Delete account
    document.getElementById('deleteAccountBtn').addEventListener('click', async function() {
      if (!confirm('Permanently delete your account and all data? This cannot be undone.')) return;
      if (!confirm('Are you absolutely sure?')) return;

      try {
        const { error } = await sb.rpc('delete_own_account');
        if (error) throw error;
        await sb.auth.signOut();
        showToast('Account deleted.', 'info');
      } catch (e) {
        showToast('Could not delete account: ' + e.message, 'error');
      }
    });
