// api.js — thin fetch client for P2PTax landing.
// Hydrates window.PT_* with live data from backend, keeps static fallbacks
// in place so the landing still renders when the API is slow or down.
(function(){
  // Allow override via <meta name="pt-api-base" content="...">; default to same-origin /api.
  const meta = document.querySelector('meta[name="pt-api-base"]');
  const API_BASE = (meta && meta.content) || '/api';

  const TIMEOUT_MS = 6000;

  async function jget(path) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(API_BASE + path, { signal: ctrl.signal, credentials: 'omit' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally {
      clearTimeout(t);
    }
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

  function mapService(s) {
    return {
      id: s.slug || s.id,
      _id: s.id,
      name: s.name,
      short: s.shortName || s.short || s.name,
      hint: s.description || s.hint || '',
      color: s.color || 'oklch(0.65 0.02 260)',
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
  window.PT_API = { hydrate, jget, API_BASE };
  hydrate();
})();
