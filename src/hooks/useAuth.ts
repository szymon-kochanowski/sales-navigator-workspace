import React, { useState, useEffect, useCallback } from 'react';

export function useAuth(showToast: (msg: string) => void) {
  const [token, setToken] = useState<string>(() => localStorage.getItem('sn_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const currentToken = token || localStorage.getItem('sn_token') || '';
      const headers = new Headers(options.headers || {});
      if (currentToken) headers.set('Authorization', `Bearer ${currentToken}`);
      headers.set('Content-Type', 'application/json');

      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        setIsAuthenticated(false);
        setToken('');
        localStorage.removeItem('sn_token');
        throw new Error('Sesja wygasła. Zaloguj się ponownie.');
      }
      return res;
    },
    [token]
  );

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsCheckingAuth(true);
      try {
        const storedToken = localStorage.getItem('sn_token');
        if (!storedToken) {
          setIsAuthenticated(false);
          return;
        }

        const res = await fetch('/api/auth/status', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            setToken(storedToken);
          } else {
            setIsAuthenticated(false);
            localStorage.removeItem('sn_token');
          }
        } else if (res.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem('sn_token');
        } else if (storedToken.startsWith('sn_')) {
          setIsAuthenticated(true);
          setToken(storedToken);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        const storedToken = localStorage.getItem('sn_token');
        if (storedToken && storedToken.startsWith('sn_')) {
          setIsAuthenticated(true);
          setToken(storedToken);
        } else {
          setIsAuthenticated(false);
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) {
          setToken(data.token);
          localStorage.setItem('sn_token', data.token);
          setIsAuthenticated(true);
          showToast('Zalogowano pomyślnie do panelu');
          return;
        }
      }

      let errorMsg = 'Nieprawidłowe hasło';
      try {
        const data = await res.json();
        if (data.error) errorMsg = data.error;
      } catch {
        errorMsg = `Błąd logowania (kod ${res.status})`;
      }
      setLoginError(errorMsg);
    } catch {
      if (loginPassword.trim() === 'admin2026') {
        const fallbackToken = 'sn_offline_' + Date.now();
        setToken(fallbackToken);
        localStorage.setItem('sn_token', fallbackToken);
        setIsAuthenticated(true);
        showToast('Zalogowano do panelu');
      } else {
        setLoginError('Błąd połączenia. Użyj hasła admin2026 lub Trybu Demo.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 1-Click Demo login without entering password
  const handleDemoLogin = async () => {
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo: true }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) {
          setToken(data.token);
          localStorage.setItem('sn_token', data.token);
          setIsAuthenticated(true);
          showToast('Wejście w tryb Demo udane!');
          return;
        }
      }

      // Offline client fallback
      const demoToken = 'sn_demo_' + Date.now();
      setToken(demoToken);
      localStorage.setItem('sn_token', demoToken);
      setIsAuthenticated(true);
      showToast('Uruchomiono tryb demonstracyjny');
    } catch {
      const demoToken = 'sn_demo_' + Date.now();
      setToken(demoToken);
      localStorage.setItem('sn_token', demoToken);
      setIsAuthenticated(true);
      showToast('Uruchomiono tryb demonstracyjny (offline)');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setToken('');
    localStorage.removeItem('sn_token');
    setIsAuthenticated(false);
    showToast('Wylogowano z systemu');
  };

  return {
    token,
    isAuthenticated,
    isCheckingAuth,
    loginPassword,
    setLoginPassword,
    loginError,
    isLoggingIn,
    authFetch,
    handleLogin,
    handleDemoLogin,
    handleLogout,
  };
}
