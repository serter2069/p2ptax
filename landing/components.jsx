/* components.jsx — P2PTax landing + prototype */
(function(){
const { useState, useEffect, useRef, useMemo, Fragment } = React;

const {
  PT_CITIES: CITIES, PT_FNS: FNS_BY_CITY, PT_SERVICES: SERVICES,
  PT_SPECIALISTS: SPECIALISTS, PT_SAMPLE_REQUEST: SAMPLE_REQUEST,
  PT_SAMPLE_MESSAGES: SAMPLE_MESSAGES, PT_SITUATIONS: SITUATIONS,
  PT_TIMELINE: TIMELINE,
} = window;

const serviceById = (id) => SERVICES.find(s => s.id === id);
const cityById = (id) => CITIES.find(c => c.id === id);
const fnsById = (cityId, id) => (FNS_BY_CITY[cityId] || []).find(f => f.id === id);

// ---------- primitives ----------
function Pill({ children, active, onClick, className='' }) {
  return <button className={`chip ${active?'active':''} ${className}`} onClick={onClick}>{children}</button>;
}

// stylized SVG portrait placeholder — deterministic from seed (name init)
function Avatar({ init, online, size='md', seed }) {
  const cls = size === 'lg' ? 'avatar lg' : size === 'xl' ? 'avatar xl' : 'avatar';
  // simple hash
  const s = (seed || init || 'X').split('').reduce((a,c)=>a + c.charCodeAt(0), 0);
  // female vs male cue: first init char — last letter 'а/я/и' -> female-ish
  const last = (init || '').slice(-1).toLowerCase();
  const female = 'аеиоыюя'.includes(last) || s % 2 === 0;
  // colour palette — desaturated business tones
  const palettes = [
    { bg:'#e8eefb', skin:'#e8c9a8', hair:'#2b2418', suit:'#1e3a7a', accent:'#c8976f' },
    { bg:'#edf1f7', skin:'#f0d5b8', hair:'#6b4226', suit:'#2a3a56', accent:'#a8805a' },
    { bg:'#eaf0ef', skin:'#dcb890', hair:'#1a1511', suit:'#1f4c72', accent:'#d9a871' },
    { bg:'#f0ece4', skin:'#e5c3a0', hair:'#8a6a3d', suit:'#384968', accent:'#b08762' },
    { bg:'#e8ecf2', skin:'#eec9a8', hair:'#3d2814', suit:'#24365a', accent:'#c09070' },
    { bg:'#efe9dc', skin:'#e2bd96', hair:'#2e1e12', suit:'#1d3760', accent:'#a77a50' },
  ];
  const p = palettes[s % palettes.length];
  return (
    <div className={cls}>
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" fill={p.bg}/>
        {/* shoulders / suit */}
        <path d={`M 0 64 L 0 54 Q 14 42 ${female?20:18} 40 L ${female?44:46} 40 Q 50 42 64 54 L 64 64 Z`} fill={p.suit}/>
        {/* collar / shirt v */}
        {!female && <path d="M 26 40 L 32 48 L 38 40 L 36 40 L 32 46 L 28 40 Z" fill="#f6f7fb"/>}
        {female && <path d="M 22 42 Q 32 48 42 42 L 42 44 Q 32 50 22 44 Z" fill={p.accent} opacity=".5"/>}
        {/* neck */}
        <rect x={female?28:27} y="34" width={female?8:10} height="8" fill={p.skin}/>
        {/* head */}
        <ellipse cx="32" cy={female?24:25} rx={female?11:11.5} ry={female?13:13} fill={p.skin}/>
        {/* hair */}
        {female ? (
          <>
            <path d={`M 20 22 Q 18 10 32 9 Q 46 10 44 22 L 46 30 Q 44 28 44 24 Q 44 18 40 16 Q 36 14 32 14 Q 26 14 24 18 Q 22 22 22 26 Q 22 30 20 30 Z`} fill={p.hair}/>
            <path d="M 20 30 Q 18 38 22 42 L 22 36 Q 20 32 20 30 Z" fill={p.hair}/>
            <path d="M 44 30 Q 46 38 42 42 L 42 36 Q 44 32 44 30 Z" fill={p.hair}/>
          </>
        ) : (
          <path d={`M 21 22 Q 20 12 32 11 Q 44 12 43 22 Q 42 18 39 17 Q 36 15 32 15 Q 28 15 25 17 Q 22 19 21 22 Z`} fill={p.hair}/>
        )}
        {/* eyes */}
        <circle cx={28} cy={female?24:25} r="0.9" fill="#1a1612"/>
        <circle cx={36} cy={female?24:25} r="0.9" fill="#1a1612"/>
        {/* subtle cheek */}
        <ellipse cx="26" cy={female?28:29} rx="1.6" ry="1" fill={p.accent} opacity=".35"/>
        <ellipse cx="38" cy={female?28:29} rx="1.6" ry="1" fill={p.accent} opacity=".35"/>
        {/* mouth */}
        <path d={`M 29 ${female?29:30} Q 32 ${female?31:31.5} 35 ${female?29:30}`} stroke="#6b3a28" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
      </svg>
      {online && <span className="online"></span>}
    </div>
  );
}

function Select({ value, placeholder, onClick, open }) {
  return (
    <div className="select-trigger" onClick={onClick}>
      <span className={value ? '' : 'placeholder'}>{value || placeholder}</span>
      <span className="dim mono">▾</span>
    </div>
  );
}

// ---------- top nav ----------
function Nav({ onAuth, onCreate, onCatalog }) {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <a href="#" className="logo">
          <span className="dot"></span>
          P2PTax
        </a>
        <div className="nav-links">
          <a onClick={onCatalog} style={{cursor:'pointer'}}>Специалисты</a>
          <a href="#situations">Ситуации</a>
          <a href="#coverage">Покрытие</a>
          <a href="#specialists-cta">Для специалистов</a>
        </div>
        <div className="nav-right">
          <button className="btn btn-subtle" onClick={onAuth}>Войти</button>
          <button className="btn btn-primary" onClick={onCreate}>Создать заявку</button>
        </div>
      </div>
    </nav>
  );
}

// ---------- hero ----------
function Hero({ onOpenSearch, onCreate, onCatalog, searchState, setSearchState }) {
  const [openField, setOpenField] = useState(null);
  const [cityQuery, setCityQuery] = useState('');
  const cardRef = useRef(null);

  const city = searchState.city ? cityById(searchState.city) : null;
  const service = searchState.service ? serviceById(searchState.service) : null;
  const fns = (city && searchState.fns) ? fnsById(city.id, searchState.fns) : null;
  const fnsOpts = city ? (FNS_BY_CITY[city.id] || []) : [];

  useEffect(() => {
    const h = (e) => { if (cardRef.current && !cardRef.current.contains(e.target)) setOpenField(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return CITIES;
    return CITIES.filter(c => c.name.toLowerCase().includes(q));
  }, [cityQuery]);

  const pickCity = (c) => {
    const list = FNS_BY_CITY[c.id] || [];
    setSearchState({ ...searchState, city: c.id, fns: list.length === 1 ? list[0].id : null });
    setCityQuery(c.name);
    setOpenField(list.length === 1 ? 'service' : 'fns');
  };

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-kicker">
          <span className="pulse"></span>
          <span>Сейчас на связи · 47 специалистов в 12 городах</span>
        </div>

        <div className="hero-grid">
          <div>
            <h1 className="hero-title">
              Специалисты<br/>
              <em>по вашей ФНС.</em><br/>
              Не юристы<br/>
              из интернета.
            </h1>
            <p className="hero-sub">
              Практики с опытом в камеральных, выездных и оперативных проверках. Знают именно вашу инспекцию — каждый работает с 2–6 конкретными ИФНС. Опишите ситуацию — напишут сами. Бесплатно для вас.
            </p>

            {/* Search card */}
            <div className="search-card" ref={cardRef}>
              <div className="search-row">
                <div className={`search-field ${openField==='city'?'open':''}`}>
                  <label>Город</label>
                  <input className="field-input" placeholder="Начните вводить…"
                    value={openField==='city' ? cityQuery : (city?.name || '')}
                    onFocus={() => { setOpenField('city'); setCityQuery(city?.name || ''); }}
                    onChange={(e) => { setCityQuery(e.target.value); setOpenField('city'); }}
                  />
                  {openField === 'city' && (
                    <div className="popover">
                      {filteredCities.map(c => (
                        <div key={c.id} className={`pop-item ${searchState.city===c.id?'selected':''}`}
                          onMouseDown={(e) => { e.preventDefault(); pickCity(c); }}>
                          <span>{c.name}</span>
                          <span className="sub">{c.specialists} спец.</span>
                        </div>
                      ))}
                      {filteredCities.length === 0 && <div className="pop-empty">Пока нет в этом городе</div>}
                    </div>
                  )}
                </div>

                <div className={`search-field ${openField==='fns'?'open':''}`}
                  onClick={() => city && fnsOpts.length > 1 && setOpenField(openField === 'fns' ? null : 'fns')}
                  style={{opacity: city ? 1 : .55, cursor: city ? 'pointer':'not-allowed'}}>
                  <label>Инспекция</label>
                  <div className={`val ${!fns ? 'placeholder' : ''}`}>
                    {fns ? `${fns.code}` : (city ? (fnsOpts.length === 1 ? 'одна в городе' : 'любая') : 'сначала город')}
                  </div>
                  {openField === 'fns' && city && (
                    <div className="popover">
                      <div className="pop-item" onMouseDown={(e) => { e.preventDefault(); setSearchState({...searchState, fns: null}); setOpenField('service'); }}>
                        <span>Любая ФНС в {city.name}</span>
                      </div>
                      {fnsOpts.map(f => (
                        <div key={f.id} className={`pop-item ${searchState.fns===f.id?'selected':''}`}
                          onMouseDown={(e) => { e.preventDefault(); setSearchState({...searchState, fns: f.id}); setOpenField('service'); }}>
                          <span>{f.code}</span>
                          <span className="sub">{f.area}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`search-field ${openField==='service'?'open':''}`}
                  onClick={() => setOpenField(openField === 'service' ? null : 'service')}>
                  <label>Тип проверки</label>
                  <div className={`val ${!service ? 'placeholder' : ''}`}>{service?.short || 'выберите'}</div>
                  {openField === 'service' && (
                    <div className="popover">
                      {SERVICES.map(s => (
                        <div key={s.id} className={`pop-item ${searchState.service===s.id?'selected':''}`}
                          onMouseDown={(e) => { e.preventDefault(); setSearchState({...searchState, service: s.id}); setOpenField(null); }}>
                          <div style={{display:'flex', flexDirection:'column', gap: 2}}>
                            <span>{s.name}</span>
                            {s.hint && <span className="sub" style={{fontSize: 11}}>{s.hint}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button className="search-submit" onClick={onOpenSearch}>
                  Найти →
                </button>
              </div>
            </div>

            <div className="row" style={{marginTop: 24, gap: 20}}>
              <button className="btn btn-ghost btn-lg" onClick={onCreate}>Создать заявку бесплатно</button>
              <span className="small dim">или <a onClick={onCatalog} style={{cursor:'pointer', textDecoration:'underline'}}>смотрите каталог</a></span>
            </div>
          </div>

          {/* Right: specialist stack */}
          <div>
            <div className="xs mono dim" style={{marginBottom: 14, letterSpacing:'.08em'}}>СЕЙЧАС НА СВЯЗИ</div>
            <div className="spec-stack">
              {SPECIALISTS.slice(0, 4).map(s => (
                <div key={s.id} className="spec-card">
                  <Avatar init={s.init} online={s.online} seed={s.id} />
                  <div className="spec-meta">
                    <div className="spec-name">{s.first} {s.last}</div>
                    <div className="spec-desc">{s.fnsLabel}</div>
                  </div>
                  <div className="spec-tag">{serviceById(s.services[0]).short}</div>
                </div>
              ))}
              <div className="small dim mono" style={{marginTop: 4, textAlign:'right'}}>
                и ещё 43 → <a style={{cursor:'pointer', color:'var(--text-mute)', textDecoration:'underline'}} onClick={onCatalog}>весь каталог</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- situations ----------
function Situations() {
  return (
    <section className="section" id="situations">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="section-kicker">Типовые ситуации</div>
            <h2 className="section-title">Три повода,<br/><em>с которыми приходят</em></h2>
          </div>
          <p className="section-sub">
            Если пришло требование, вызвали на допрос или постучались из ОКК — вот что это, чем грозит и кто поможет. Специалист под вашу конкретную ситуацию найдётся за пару часов.
          </p>
        </div>

        <div className="situations">
          {SITUATIONS.map(s => (
            <div className="situation" key={s.id}>
              <div className="situation-num">{s.num}</div>
              <h3 className="situation-title">{s.title.split('\n').map((l,i)=>(<Fragment key={i}>{l}<br/></Fragment>))}</h3>
              <p className="situation-desc">{s.desc}</p>
              <div className="situation-meta">
                {s.meta.map((m, i) => (
                  <div className="situation-meta-row" key={i}>
                    <span className="k">{m.k}</span>
                    <span className="v">{m.v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- how it works ----------
function HowItWorks({ onCreate }) {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="section-kicker">Как это работает</div>
            <h2 className="section-title">Три шага<br/><em>вместо обзвона</em></h2>
          </div>
          <p className="section-sub">
            Не вы ищете специалистов — они сами приходят к вам. Платформа показывает вашу заявку только тем, кто работает с вашей инспекцией и именно с этим типом проверки.
          </p>
        </div>

        <div className="steps">
          <div className="step">
            <div className="step-num">[ ШАГ 01 ]</div>
            <div className="step-title">Опишите ситуацию за 3 минуты</div>
            <div className="step-desc">Город, ИФНС, тип проверки и что произошло. Анонимно — контакты никто не увидит.</div>
            <div className="step-preview">
              <div style={{fontSize: 11, color:'var(--text-dim)', marginRight: 8}}>[форма]</div>
              <div className="bar"></div>
            </div>
          </div>

          <div className="step">
            <div className="step-num">[ ШАГ 02 ]</div>
            <div className="step-title">Специалисты пишут первыми</div>
            <div className="step-desc">Обычно 2–5 откликов в течение часа. Они смотрят заявку и решают, берутся или нет — уже с планом.</div>
            <div className="step-preview" style={{flexDirection:'column', alignItems:'flex-start', gap:6}}>
              <div>◉ Алексей М. · ИФНС №7 · ответил через 18 мин</div>
              <div>◉ Ирина К. · ИФНС №1 · ответила через 32 мин</div>
              <div className="dim">○ ...ещё 2 специалиста изучают</div>
            </div>
          </div>

          <div className="step">
            <div className="step-num">[ ШАГ 03 ]</div>
            <div className="step-title">Выбираете и работаете напрямую</div>
            <div className="step-desc">Обсуждаете в чате, согласуете оплату напрямую со специалистом. Платформа не берёт комиссию.</div>
            <div className="step-preview">
              <div className="xs mono" style={{color:'var(--accent)'}}>→ 0% комиссия · прямой контакт</div>
            </div>
          </div>
        </div>

        <div style={{marginTop: 40, textAlign:'center'}}>
          <button className="btn btn-primary btn-lg" onClick={onCreate}>Начать с заявки →</button>
        </div>
      </div>
    </section>
  );
}

// ---------- catalog preview ----------
function CatalogPreview({ onCatalog, onOpenSpecialist }) {
  const [cityFilter, setCityFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState(null);

  const filtered = useMemo(() => {
    return SPECIALISTS.filter(s => {
      if (cityFilter !== 'all' && s.city !== cityFilter) return false;
      if (serviceFilter && !s.services.includes(serviceFilter)) return false;
      return true;
    });
  }, [cityFilter, serviceFilter]);

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="section-kicker">Каталог</div>
            <h2 className="section-title">Кто сейчас<br/><em>берёт клиентов</em></h2>
          </div>
          <p className="section-sub">
            Каждый специалист указал, с какими ФНС работает и какие виды проверок ведёт. Не «все подряд юристы» — только те, кто реально знает вашу инспекцию.
          </p>
        </div>

        <div className="cat-toolbar">
          <Pill active={cityFilter==='all'} onClick={()=>setCityFilter('all')}>Все города</Pill>
          {CITIES.slice(0, 5).map(c => (
            <Pill key={c.id} active={cityFilter===c.id} onClick={()=>setCityFilter(c.id)}>{c.name}</Pill>
          ))}
          <div style={{width: 1, background:'var(--line)', margin:'0 6px'}}></div>
          {SERVICES.map(s => (
            <Pill key={s.id} active={serviceFilter===s.id} onClick={()=>setServiceFilter(serviceFilter===s.id?null:s.id)}>
              {s.short}
            </Pill>
          ))}
          <div style={{flex:1}}></div>
          <span className="small dim mono">{filtered.length} специалистов</span>
        </div>

        <div className="catalog">
          {filtered.map(s => (
            <div className="cat-card" key={s.id} onClick={()=>onOpenSpecialist(s.id)}>
              <div className="cat-card-head">
                <Avatar init={s.init} online={s.online} size="lg" />
                <div>
                  <div className="cat-card-name">{s.first} {s.last}</div>
                  <div className="cat-card-role">{s.role}</div>
                </div>
              </div>
              <div className="cat-card-fns">{s.fnsLabel}</div>
              <div className="cat-card-tags">
                {s.services.map(id => {
                  const srv = serviceById(id);
                  return <span key={id} className="spec-tag">{srv.short}</span>;
                })}
              </div>
              <div className="cat-card-foot">
                {s.online ? <span className="status-on">На связи · ответ {s.responseTime}</span>
                         : <span className="status-off">Не в сети</span>}
                <span className="dim mono xs">{s.cases} кейсов</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{marginTop: 28, textAlign:'center'}}>
          <button className="btn btn-ghost" onClick={onCatalog}>Открыть полный каталог →</button>
        </div>
      </div>
    </section>
  );
}

// ---------- coverage map ----------
function Coverage() {
  const [sel, setSel] = useState('msk');
  const selCity = cityById(sel);
  const fns = FNS_BY_CITY[sel] || [];

  // simple positioned dots on a stylized "map" rectangle
  const positions = {
    msk: { x: 38, y: 48 }, spb: { x: 30, y: 26 }, ekb: { x: 56, y: 50 },
    nsk: { x: 70, y: 58 }, kzn: { x: 46, y: 52 }, nnov: { x: 44, y: 48 },
    sam: { x: 48, y: 58 }, rnd: { x: 34, y: 66 }, ufa: { x: 54, y: 55 },
    chb: { x: 58, y: 54 }, vrn: { x: 36, y: 58 }, krd: { x: 32, y: 68 },
  };

  return (
    <section className="section" id="coverage">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="section-kicker">Покрытие</div>
            <h2 className="section-title">12 городов,<br/><em>78+ инспекций</em></h2>
          </div>
          <p className="section-sub">
            Добавляем новые города каждую неделю. Не нашли свою — оставьте заявку, подтянем специалиста под неё за 5–7 дней.
          </p>
        </div>

        <div className="coverage">
          <div className="coverage-viz">
            <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
              {/* grid */}
              {[...Array(10)].map((_, i) => (
                <line key={'v'+i} x1={i*10} y1="0" x2={i*10} y2="100" stroke="var(--line)" strokeWidth="0.15" />
              ))}
              {[...Array(10)].map((_, i) => (
                <line key={'h'+i} x1="0" y1={i*10} x2="100" y2={i*10} stroke="var(--line)" strokeWidth="0.15" />
              ))}
              {/* dots */}
              {CITIES.map(c => {
                const p = positions[c.id];
                if (!p) return null;
                const r = Math.min(2.6, 0.8 + Math.sqrt(c.specialists) * 0.45);
                return (
                  <g key={c.id}>
                    <circle cx={p.x} cy={p.y} r={r*2.2}
                      fill="var(--accent)" fillOpacity={sel===c.id?.3:.1} />
                    <circle cx={p.x} cy={p.y} r={r}
                      fill={sel===c.id ? 'var(--accent)' : 'var(--text)'}
                      fillOpacity={sel===c.id?1:.9}
                      className="city-dot"
                      onClick={()=>setSel(c.id)} />
                    <text x={p.x + r + 1.5} y={p.y + 0.8} className="city-label"
                      fill={sel===c.id ? 'var(--accent)' : 'var(--text-mute)'}>
                      {c.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div>
            <div className="city-list">
              {CITIES.map(c => (
                <div key={c.id} className={`city-row ${sel===c.id?'selected':''}`} onClick={()=>setSel(c.id)}>
                  <div>
                    <div>{c.name}</div>
                    <div className="xs dim mono" style={{marginTop: 2}}>{c.fns_count} инспекций</div>
                  </div>
                  <span className="count">{c.specialists} спец.</span>
                  <span className="chev">→</span>
                </div>
              ))}
            </div>
            {selCity && fns.length > 0 && (
              <div style={{marginTop: 16, padding: '16px 18px', border:'1px solid var(--line)', borderRadius: 'var(--radius)', background:'var(--surface-2)'}}>
                <div className="xs mono dim" style={{marginBottom: 10, letterSpacing:'.08em'}}>
                  ИНСПЕКЦИИ · {selCity.name.toUpperCase()}
                </div>
                <div style={{display:'grid', gap: 6}}>
                  {fns.map(f => (
                    <div key={f.id} className="flex-between small">
                      <span>{f.code}</span>
                      <span className="dim">{f.area}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- reality check ----------
function RealityCheck({ onCreate }) {
  return (
    <section className="section">
      <div className="container">
        <div className="reality">
          <div>
            <div className="section-kicker">Что будет, если ничего не делать</div>
            <h2 className="reality-title" style={{marginTop: 12}}>
              Требование ФНС<br/>
              <em>не проходит само.</em>
            </h2>
            <p className="section-sub" style={{marginTop: 20}}>
              Типовая траектория, если проигнорировать первое письмо. Мы видели все эти сценарии десятки раз — именно поэтому первый шаг самый важный.
            </p>
            <div style={{marginTop: 24}}>
              <button className="btn btn-primary btn-lg" onClick={onCreate}>Опишите ситуацию сейчас →</button>
            </div>
          </div>

          <div>
            {TIMELINE.map((t, i) => (
              <div key={i} className={`timeline-item ${t.bad?'bad':''}`}>
                <div className="timeline-day">{t.day}</div>
                <div>
                  <div className="timeline-label">{t.label}</div>
                  <div className="timeline-desc">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- cases ----------
function Cases() {
  const cases = [
    { quote: 'Пришло требование по разрывам НДС. Специалист с опытом именно в нашей ИФНС переписал пояснение — вопрос закрыли без выезда.', who: 'ООО, Москва · НДС', service: 'Камеральная' },
    { quote: 'Выездная на 2 недели. Дмитрий вёл все коммуникации с инспектором, готовил возражения. Доначисление снизили с 4.2 млн до 780 тыс.', who: 'ИП на ОСНО · Екатеринбург', service: 'Выездная' },
    { quote: 'Внезапно нагрянули с ОКК по ККТ. Екатерина выехала к нам на место — протокол удалось переписать, штраф минимальный.', who: 'Кофейня · СПб', service: 'ОКК' },
  ];
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="section-kicker">Кейсы</div>
            <h2 className="section-title">Как это<br/><em>прошло у других</em></h2>
          </div>
          <p className="section-sub">
            Кейсы — анонимные, с согласия клиентов. Раздел наполняется по мере запуска платформы. Пока — типовые сценарии, с которыми мы работаем.
          </p>
        </div>
        <div className="cases">
          {cases.map((c, i) => (
            <div className="case" key={i}>
              <span className="placeholder-badge">демо</span>
              <div className="case-num">{`[ CASE 0${i+1} ]`}</div>
              <div className="case-quote">«{c.quote}»</div>
              <div className="case-foot">
                <span>{c.who}</span>
                <span className="dim mono xs">· {c.service}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- specialists CTA ----------
function SpecialistsCTA({ onJoin }) {
  return (
    <section className="section" id="specialists-cta">
      <div className="container">
        <div className="specialists-cta">
          <div>
            <div className="section-kicker">Для специалистов</div>
            <h2 className="section-title" style={{fontSize:'clamp(28px, 3.5vw, 44px)', marginTop: 10}}>
              Ваша экспертиза —<br/><em>ваш рынок.</em>
            </h2>
            <p className="section-sub" style={{marginTop: 20}}>
              Если вы налоговый консультант, бывший инспектор или адвокат — добавьте свою инспекцию и виды проверок, с которыми работаете. Клиенты по вашей ФНС будут приходить сами. Без подписки, без комиссии в MVP.
            </p>

            <div className="spec-stat">
              <div>
                <div className="stat-val">20</div>
                <div className="stat-label">новых заявок в день на пике</div>
              </div>
              <div>
                <div className="stat-val">0%</div>
                <div className="stat-label">комиссия платформы в MVP</div>
              </div>
            </div>

            <div style={{marginTop: 28}} className="row">
              <button className="btn btn-primary btn-lg" onClick={onJoin}>Стать специалистом</button>
              <button className="btn btn-ghost btn-lg" onClick={onJoin}>Как это устроено</button>
            </div>
          </div>

          <div>
            {/* mock mini dashboard */}
            <div style={{background:'var(--bg)', border:'1px solid var(--line)', borderRadius: 'var(--radius)', padding: 20}}>
              <div className="flex-between" style={{marginBottom: 16}}>
                <div className="xs mono dim">КАБИНЕТ СПЕЦИАЛИСТА</div>
                <div className="status-on">На связи</div>
              </div>
              <div className="stack-gap-md">
                {[
                  {t:'Требование по НДС · ИФНС №7', sub:'Москва · 2 часа назад', new:true},
                  {t:'Возражение на акт · ИФНС №14', sub:'Москва · вчера', new:false},
                  {t:'Подготовка к допросу · ИФНС №7', sub:'Москва · 3 дня назад', new:false},
                ].map((it, i) => (
                  <div key={i} style={{padding:'12px 14px', border:'1px solid var(--line)', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                      <div style={{fontSize: 13}}>{it.t}</div>
                      <div className="xs dim mono" style={{marginTop: 2}}>{it.sub}</div>
                    </div>
                    {it.new && <div className="xs mono" style={{color:'var(--accent)'}}>НОВАЯ</div>}
                  </div>
                ))}
              </div>
              <div className="xs dim mono" style={{marginTop: 16, paddingTop: 12, borderTop: '1px dashed var(--line)'}}>
                20 новых диалогов в день · лимит платформы
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- final CTA ----------
function FinalCTA({ onCreate }) {
  return (
    <section className="final-cta">
      <div className="container">
        <h2 className="final-title">
          Уже пришло<br/>
          <em>уведомление?</em>
        </h2>
        <p className="section-sub" style={{margin:'0 auto 32px', textAlign:'center', maxWidth: '48ch'}}>
          Опишите ситуацию. Специалисты по вашей ФНС получат заявку и напишут сами. Бесплатно, 3 минуты, без регистрации заранее.
        </p>
        <button className="btn btn-primary btn-lg" onClick={onCreate} style={{padding:'18px 28px', fontSize: 16}}>
          Создать заявку →
        </button>
      </div>
    </section>
  );
}

// ---------- footer ----------
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo" style={{marginBottom: 16}}>
              <span className="dot"></span> P2PTax
            </div>
            <div className="small muted" style={{maxWidth: '38ch'}}>
              Маркетплейс специалистов по проверкам ФНС. Платформа связывает клиентов со специалистами — юридические услуги оказывают сами специалисты.
            </div>
          </div>
          <div>
            <h4>Продукт</h4>
            <ul>
              <li><a>Для клиентов</a></li>
              <li><a>Для специалистов</a></li>
              <li><a>Каталог</a></li>
              <li><a>Покрытие</a></li>
            </ul>
          </div>
          <div>
            <h4>Помощь</h4>
            <ul>
              <li><a>Как это работает</a></li>
              <li><a>Безопасность</a></li>
              <li><a>Контакты</a></li>
              <li><a>FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4>Юр. инфо</h4>
            <ul>
              <li><a>Условия</a></li>
              <li><a>Конфиденциальность</a></li>
              <li><a>Оферта</a></li>
            </ul>
          </div>
        </div>
        <div className="legal">
          <span>© 2026 P2PTax</span>
          <span>Платформа не оказывает юридических услуг. Услуги оказывают независимые специалисты.</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, {
  PT_Nav: Nav, PT_Hero: Hero, PT_Situations: Situations, PT_HowItWorks: HowItWorks,
  PT_CatalogPreview: CatalogPreview, PT_Coverage: Coverage, PT_RealityCheck: RealityCheck,
  PT_Cases: Cases, PT_SpecialistsCTA: SpecialistsCTA, PT_FinalCTA: FinalCTA, PT_Footer: Footer,
  PT_Avatar: Avatar, PT_Pill: Pill, PT_serviceById: serviceById, PT_cityById: cityById, PT_fnsById: fnsById,
});
})();
