import { mountLoginScene3D } from './LoginScene3D.js';

const THEME_KEY = 'novyn-theme';

export function createLoginPage({ onSubmit }) {
  const form = document.getElementById('loginForm');
  const usernameInput = document.getElementById('usernameInput');
  const passwordInput = document.getElementById('passwordInput');
  const passwordToggle = document.getElementById('passwordToggle');
  const capsLockHint = document.getElementById('capsLockHint');
  const errorEl = document.getElementById('loginError');
  const hintEl = document.getElementById('usernameHint');
  const suggestionsEl = document.getElementById('usernameSuggestions');
  const loginBtn = document.getElementById('loginBtn');
  const spinner = loginBtn ? loginBtn.querySelector('.login-btn-spinner') : null;
  const arrow = loginBtn ? loginBtn.querySelector('.login-btn-arrow') : null;
  const themeToggle = document.getElementById('themeToggle');

  const heroCanvas =
    document.getElementById('heroThreeCanvas') ||
    document.getElementById('heroCanvas');
  const disposeScene = mountLoginScene3D(heroCanvas);

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (_err) {
      // Ignore storage errors.
    }
  }

  function initTheme() {
    let saved = 'light';
    try {
      saved = localStorage.getItem(THEME_KEY) || 'light';
    } catch (_err) {
      saved = 'light';
    }

    applyTheme(saved);

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const isLight = document.documentElement.classList.contains('light');
        applyTheme(isLight ? 'dark' : 'light');
      });
    }
  }

  function setLoading(isLoading) {
    if (!loginBtn) return;

    loginBtn.disabled = Boolean(isLoading);

    if (spinner) {
      spinner.classList.toggle('hidden', !isLoading);
    }
    if (arrow) {
      arrow.classList.toggle('hidden', isLoading);
    }
  }

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = String(message || 'Could not sign in');
    errorEl.classList.remove('hidden');
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
  }

  function showHint(message) {
    if (!hintEl) return;
    hintEl.textContent = String(message || '');
    hintEl.classList.toggle('hidden', !hintEl.textContent);
  }

  function renderSuggestions(suggestions = []) {
    if (!suggestionsEl) return;

    suggestionsEl.innerHTML = '';
    const list = Array.isArray(suggestions)
      ? suggestions.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 6)
      : [];

    if (!list.length) {
      suggestionsEl.classList.add('hidden');
      return;
    }

    list.forEach((username) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sug-chip';
      button.textContent = username;
      button.addEventListener('click', () => {
        if (!usernameInput) return;
        usernameInput.value = username;
        passwordInput?.focus();
      });
      suggestionsEl.appendChild(button);
    });

    suggestionsEl.classList.remove('hidden');
  }

  function readCredentials() {
    return {
      username: String(usernameInput?.value || '').trim(),
      password: String(passwordInput?.value || ''),
    };
  }

  function setPasswordVisibility(isVisible) {
    if (!passwordInput || !passwordToggle) return;

    passwordInput.type = isVisible ? 'text' : 'password';
    passwordToggle.textContent = isVisible ? 'Hide' : 'Show';
    passwordToggle.setAttribute('aria-pressed', isVisible ? 'true' : 'false');
    passwordToggle.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
  }

  function setCapsLockHint(isVisible) {
    if (!capsLockHint) return;
    capsLockHint.classList.toggle('hidden', !isVisible);
  }

  if (passwordToggle && passwordInput) {
    setPasswordVisibility(false);

    passwordToggle.addEventListener('click', () => {
      const showPassword = passwordInput.type === 'password';
      setPasswordVisibility(showPassword);
      passwordInput.focus();
    });

    const handleCapsState = (event) => {
      if (!event || typeof event.getModifierState !== 'function') return;
      setCapsLockHint(event.getModifierState('CapsLock'));
    };

    passwordInput.addEventListener('keydown', handleCapsState);
    passwordInput.addEventListener('keyup', handleCapsState);
    passwordInput.addEventListener('blur', () => setCapsLockHint(false));
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearError();
      showHint('');

      const { username, password } = readCredentials();
      if (!username || !password) {
        showError('Enter username and password.');
        return;
      }

      setLoading(true);
      try {
        if (typeof onSubmit === 'function') {
          await onSubmit({ username, password });
        }
      } finally {
        setLoading(false);
      }
    });
  }

  initTheme();

  return {
    setLoading,
    showError,
    clearError,
    showHint,
    renderSuggestions,
    setCredentials({ username, password }) {
      if (usernameInput && typeof username === 'string') usernameInput.value = username;
      if (passwordInput && typeof password === 'string') passwordInput.value = password;
    },
    getCredentials: readCredentials,
    focus() {
      usernameInput?.focus();
    },
    destroy() {
      disposeScene();
    },
  };
}
