    // ===== AUTH =====
    const authScreen = document.getElementById('authScreen');
    const appScreen = document.getElementById('appScreen');

    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Redirect to dedicated reset page (session is already active)
        window.location.href = 'reset-password.html';
        return;
      }

      if (session && !appEntered) {
        currentUser = session.user;
        enterApp();
      } else if (!session) {
        currentUser = null;
        appEntered = false;
        progressLoaded = false;
        authScreen.style.display = 'flex';
        appScreen.style.display = 'none';
      }
    });

    // ===== PASSWORD VALIDATION =====
    function validatePassword(pw) {
      return {
        len: pw.length >= 8,
        upper: /[A-Z]/.test(pw),
        lower: /[a-z]/.test(pw),
        num: /[0-9]/.test(pw),
        special: /[^A-Za-z0-9]/.test(pw)
      };
    }

    function updatePasswordRules() {
      const pw = document.getElementById('passwordInput').value;
      const v = validatePassword(pw);
      const rules = { ruleLen: v.len, ruleUpper: v.upper, ruleLower: v.lower, ruleNum: v.num, ruleSpecial: v.special };
      for (const [id, pass] of Object.entries(rules)) {
        const el = document.getElementById(id);
        el.classList.toggle('pass', pass);
        el.querySelector('.check').innerHTML = pass ? '&#10003;' : '&#10005;';
      }
      return Object.values(v).every(Boolean);
    }

    document.getElementById('passwordInput').addEventListener('input', function() {
      if (isAuthSignUp) updatePasswordRules();
    });

    document.getElementById('authForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      const email = sanitizeEmail(document.getElementById('emailInput').value);
      const password = document.getElementById('passwordInput').value;
      const errEl = document.getElementById('authError');
      const msgEl = document.getElementById('authMessage');
      const btn = document.getElementById('authSubmitBtn');
      safeSetError(errEl, ''); safeSetMessage(msgEl, ''); btn.disabled = true;

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        btn.disabled = false;
        return;
      }

      // Cap password length to prevent abuse
      if (password.length > 128) {
        showToast('Password must be 128 characters or fewer.', 'error');
        btn.disabled = false;
        return;
      }

      if (isAuthSignUp) {
        if (!updatePasswordRules()) {
          showToast('Password does not meet all requirements.', 'error');
          btn.disabled = false;
          return;
        }
        const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + window.location.pathname } });
        btn.disabled = false;
        if (error) showToast(error.message, 'error');
        else if (!data.session) showToast('Check your email to confirm your account!', 'success');
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        btn.disabled = false;
        if (error) showToast(error.message, 'error');
      }
    });

    document.getElementById('authToggle').addEventListener('click', function() {
      isAuthSignUp = !isAuthSignUp;
      const btn = document.getElementById('authSubmitBtn');
      const pwInput = document.getElementById('passwordInput');
      const rulesEl = document.getElementById('passwordRules');
      const forgotEl = document.getElementById('forgotBtn');

      btn.textContent = isAuthSignUp ? 'Sign Up' : 'Sign In';
      btn.className = 'auth-btn ' + (isAuthSignUp ? 'signup' : 'signin');
      this.textContent = isAuthSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up";

      // Switch autocomplete so password managers offer to generate on sign-up
      pwInput.autocomplete = isAuthSignUp ? 'new-password' : 'current-password';

      // Show password rules only on sign-up
      rulesEl.classList.toggle('show', isAuthSignUp);
      if (isAuthSignUp) updatePasswordRules();

      // Hide forgot password on sign-up
      forgotEl.style.display = isAuthSignUp ? 'none' : '';

      document.getElementById('authError').textContent = '';
      document.getElementById('authMessage').textContent = '';
    });

    // ===== FORGOT PASSWORD =====
    document.getElementById('forgotBtn').addEventListener('click', async function() {
      const email = sanitizeEmail(document.getElementById('emailInput').value);
      const errEl = document.getElementById('authError');
      const msgEl = document.getElementById('authMessage');
      safeSetError(errEl, ''); safeSetMessage(msgEl, '');

      if (!email) {
        showToast('Enter your email above first.', 'error');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
      }

      this.disabled = true;
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password.html'
      });
      this.disabled = false;

      if (error) showToast(error.message, 'error');
      else showToast('Password reset link sent! Check your email.', 'success');
    });

    document.getElementById('googleBtn').addEventListener('click', async function() {
      try {
        const { data, error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname, skipBrowserRedirect: false } });
        if (error) showToast(error.message, 'error');
        else if (data?.url) window.location.href = data.url;
      } catch (e) { showToast('Error: ' + e.message, 'error'); }
    });

    document.getElementById('signOutBtn').addEventListener('click', async () => {
      closeSettings();
      await sb.auth.signOut();
    });
