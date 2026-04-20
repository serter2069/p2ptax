// api.js — thin fetch client for P2PTax landing.
// Hydrates window.PT_* with live data from backend, keeps static fallbacks
// in place so the landing still renders when the API is slow or down.
(function(){
  // Allow override via <meta name="pt-api-base" content="...">; default to same-origin /api.
  const meta = document.querySelector('meta[name="pt-api-base"]');
  const API_BASE = (meta && meta.content) || '/api';

  const TIMEOUT_MS = 6000;
  const REFRESH_KEY = 'p2ptax_refresh';

  // -------- Auth state (in-memory access, persisted refresh) --------
  const authState = {
    accessToken: null,
    user: null,
  };

  function getRefreshToken() {
    try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
  }
  function setRefreshToken(t) {
    try {
      if (t) localStorage.setItem(REFRESH_KEY, t);
      else localStorage.removeItem(REFRESH_KEY);
    } catch {}
  }

  function emitAuthChange() {
    window.dispatchEvent(new CustomEvent('pt:auth-change', { detail: { user: authState.user } }));
  }

  async function jfetch(path, opts) {
    opts = opts || {};
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), opts.timeout || TIMEOUT_MS);
    try {
      return await fetch(API_BASE + path, {
        ...opts,
        signal: ctrl.signal,
        credentials: 'omit',
      });
    } finally {
      clearTimeout(t);
    }
  }

  async function jget(path) {
    const r = await jfetch(path);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  }

  async function jpost(path, body, extraHeaders) {
    const r = await jfetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(extraHeaders || {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(data.error || ('HTTP ' + r.status)), { status: r.status, data });
    return data;
  }

  // -------- Auth API --------
  async function requestOtp(email) {
    return jpost('/auth/request-otp', { email });
  }

  async function verifyOtp(email, code) {
    const data = await jpost('/auth/verify-otp', { email, code });
    authState.accessToken = data.accessToken;
    authState.user = data.user || null;
    setRefreshToken(data.refreshToken);
    emitAuthChange();
    return data;
  }

  async function refreshAccess() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');
    const r = await jfetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!r.ok) {
      setRefreshToken(null);
      authState.accessToken = null;
      authState.user = null;
      emitAuthChange();
      throw new Error('Refresh failed');
    }
    const data = await r.json();
    authState.accessToken = data.accessToken;
    authState.user = data.user || authState.user;
    setRefreshToken(data.refreshToken);
    return data;
  }

  async function logout() {
    const refreshToken = getRefreshToken();
    if (authState.accessToken) {
      try {
        await jfetch('/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authState.accessToken,
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {}
    }
    setRefreshToken(null);
    authState.accessToken = null;
    authState.user = null;
    emitAuthChange();
  }

  async function me() {
    if (!authState.accessToken) throw new Error('No access token');
    const r = await jfetch('/auth/me', {
      headers: { 'Authorization': 'Bearer ' + authState.accessToken },
    });
    if (!r.ok) throw Object.assign(new Error('HTTP ' + r.status), { status: r.status });
    const data = await r.json();
    authState.user = data.user || data;
    return authState.user;
  }

  // Fetch wrapper with auto-refresh on 401
  async function authFetch(path, opts) {
    opts = opts || {};
    const doFetch = async () => {
      const headers = {
        ...(opts.headers || {}),
      };
      if (authState.accessToken) headers['Authorization'] = 'Bearer ' + authState.accessToken;
      return jfetch(path, { ...opts, headers });
    };
    let r = await doFetch();
    if (r.status === 401 && getRefreshToken()) {
      try {
        await refreshAccess();
        r = await doFetch();
      } catch {
        // refresh failed — propagate 401 to caller
      }
    }
    return r;
  }

  async function authJson(path, opts) {
    const r = await authFetch(path, opts);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(data.error || ('HTTP ' + r.status)), { status: r.status, data });
    return data;
  }

  // Boot: if we have a refresh token, try to restore session
  async function bootAuth() {
    if (!getRefreshToken()) { emitAuthChange(); return; }
    try {
      await refreshAccess();
      try { await me(); } catch {}
    } catch {
      // refresh expired — stay logged out
    }
    emitAuthChange();
  }

  // Turn API shapes into the shapes components expect (matching the static fallbacks).
  function mapCity(c) {
    return {
      id: c.slug || c.id,
      _id: c.id,          // keep UUID for later calls
      slug: c.slug,
      name: c.name,
      fns_count: c.officesCount || 0,
      specialists: 0,     // backend does not expose this yet
    };
  }

  function mapFns(f, cityId) {
    return {
      id: f.id,
      code: f.name || f.code,
      area: f.address || '',
      cityId: cityId,
    };
  }

  // Map API service `name` -> canonical static slug used by the prototype UI.
  function slugForServiceName(name) {
    const n = (name || '').toLowerCase();
    if (n.includes('камерал')) return 'desk';
    if (n.includes('выездн')) return 'field';
    if (n.includes('оператив') || n.includes('окк')) return 'oper';
    return 'unknown';
  }

  function mapService(s) {
    const slug = s.slug || slugForServiceName(s.name);
    const fallback = (window.PT_SERVICES || []).find(x => x.id === slug) || {};
    return {
      id: slug,
      _id: s.id,
      name: s.name || fallback.name || '—',
      short: s.shortName || s.short || fallback.short || s.name,
      hint: s.description || s.hint || fallback.hint || '',
      color: s.color || fallback.color || 'oklch(0.65 0.02 260)',
    };
  }

  function mapSpecialist(s) {
    const first = s.firstName || s.first || '';
    const last = s.lastName || s.last || '';
    const init = (first[0] || 'X') + (last[0] || '');
    const cities = (s.cities || []).map((c) => c.name).filter(Boolean);
    const services = (s.services || []).map((x) => x.id || x);
    const fnsLabel = cities.length
      ? 'ИФНС · ' + cities.join(', ')
      : 'Рабочие ИФНС — в профиле';
    // id from server is UUID; expose city/service slugs would require another call.
    return {
      id: s.id,
      first, last,
      init,
      role: s.role || 'Специалист',
      city: (s.cities && s.cities[0] && s.cities[0].id) || null,
      fns: [], // detail endpoint has richer data
      fnsLabel,
      services,
      online: s.isAvailable !== false,
      cases: s.casesCount || 0,
      responseTime: s.responseTime || '< 2 ч',
      since: s.since || '—',
      bio: s.bio || '',
      avatarUrl: s.avatarUrl || null,
    };
  }

  // -------- Request helpers (public / authenticated) --------
  async function createRequest(payload) {
    // Prefer authenticated /api/requests when we have a session — backend
    // enforces validation (length, city/fns match) and returns richer data.
    if (authState.accessToken) {
      return authJson('/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    // Fallback: /requests/public. It still requires userId on the backend,
    // so without auth this path will 401. Callers should open AuthModal first.
    return jpost('/requests/public', payload);
  }

  async function getPublicRequest(id) {
    return jget('/requests/' + encodeURIComponent(id) + '/public');
  }

  async function getSpecialist(id) {
    return jget('/specialists/' + encodeURIComponent(id));
  }

  async function fetchSpecialists(params) {
    params = params || {};
    const qs = [];
    if (params.q) qs.push('q=' + encodeURIComponent(params.q));
    if (params.city_id || params.city) qs.push('city_id=' + encodeURIComponent(params.city_id || params.city));
    if (params.fns_id || params.fns) qs.push('fns_id=' + encodeURIComponent(params.fns_id || params.fns));
    if (params.services) qs.push('services=' + encodeURIComponent(params.services));
    if (params.limit) qs.push('limit=' + encodeURIComponent(params.limit));
    const path = '/specialists' + (qs.length ? ('?' + qs.join('&')) : '');
    return jget(path);
  }

  // -------- Threads / Messages (auth required) --------
  async function listThreads() {
    return authJson('/threads');
  }

  async function getMessages(threadId) {
    return authJson('/messages/' + encodeURIComponent(threadId));
  }

  async function sendMessage(threadId, text) {
    return authJson('/messages/' + encodeURIComponent(threadId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  }

  async function startThread(requestId, firstMessage) {
    return authJson('/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, firstMessage }),
    });
  }

  async function markThreadRead(threadId) {
    return authJson('/messages/' + encodeURIComponent(threadId) + '/read', { method: 'PATCH' });
  }

  async function loadCities() {
    const r = await jget('/cities');
    const items = (r.items || r.cities || []).map(mapCity);
    if (items.length) window.PT_CITIES = items;
  }

  async function loadServices() {
    const r = await jget('/services');
    const items = (r.items || r.services || []).map(mapService);
    if (items.length) window.PT_SERVICES = items;
  }

  async function loadSpecialists() {
    const r = await jget('/specialists?limit=30');
    const items = (r.items || []).map(mapSpecialist);
    if (items.length) window.PT_SPECIALISTS = items;
  }

  async function loadFnsForCities() {
    const cities = window.PT_CITIES || [];
    // Don't fan out to every city at boot — just load the first handful (used on home + coverage).
    const sample = cities.slice(0, 8);
    const out = {};
    await Promise.all(sample.map(async (c) => {
      if (!c.slug) return;
      try {
        const r = await jget('/cities/' + encodeURIComponent(c.slug) + '/ifns');
        const list = (r.items || []).map((f) => mapFns(f, c.id));
        if (list.length) out[c.id] = list;
      } catch (e) {
        // fallback entry already present from static data.js
      }
    }));
    if (Object.keys(out).length) {
      window.PT_FNS = Object.assign({}, window.PT_FNS || {}, out);
    }
  }

  async function hydrate() {
    // Run independently — any one failing shouldn't kill the others.
    await Promise.allSettled([
      loadCities().catch(() => {}),
      loadServices().catch(() => {}),
      loadSpecialists().catch(() => {}),
    ]);
    // FNS depends on cities slugs, so run after.
    await loadFnsForCities().catch(() => {});
    window.dispatchEvent(new CustomEvent('pt:data-ready'));
  }

  // Kick off immediately; components can re-read from window.PT_* after 'pt:data-ready'.
  window.PT_API = {
    hydrate, jget, jpost, authFetch, authJson, API_BASE,
    createRequest, getPublicRequest,
    getSpecialist, fetchSpecialists,
    listThreads, getMessages, sendMessage, startThread, markThreadRead,
  };

  window.PT_AUTH = {
    requestOtp,
    verifyOtp,
    refreshAccess,
    logout,
    me,
    authFetch,
    authJson,
    getToken: () => authState.accessToken,
    getUser: () => authState.user,
    isAuthenticated: () => !!authState.accessToken,
    onChange: (cb) => {
      const h = (e) => cb(e.detail?.user || null);
      window.addEventListener('pt:auth-change', h);
      return () => window.removeEventListener('pt:auth-change', h);
    },
  };

  hydrate();
  bootAuth();
})();
