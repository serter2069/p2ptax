/* overlays.jsx — prototype overlays: auth, new-request, catalog, profile, chat */
const {
  PT_SAMPLE_REQUEST: OV_REQ, PT_SAMPLE_MESSAGES: OV_MSGS,
  PT_Avatar: Avatar2, PT_Pill: Pill2,
} = window;
// Live getters — read from window.PT_* at call time so api.js hydration is picked up.
const OV_getCities = () => window.PT_CITIES || [];
const OV_getFns = () => window.PT_FNS || {};
const OV_getServices = () => window.PT_SERVICES || [];
const OV_getSpecialists = () => window.PT_SPECIALISTS || [];
const SRV_FALLBACK = { short: '—', name: '—', hint: '', color: 'oklch(0.65 0.02 260)' };
const srvById = (id) => OV_getServices().find(s => s.id === id) || SRV_FALLBACK;
const ctyById = (id) => OV_getCities().find(c => c.id === id);
const fnsById2 = (cityId, id) => (OV_getFns()[cityId] || []).find(f => f.id === id);
const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM, Fragment: Fr } = React;

// hook to force re-render when api.js finishes hydrating
function useOVDataVersion() {
  const [v, bump] = useS(0);
  useE(() => {
    const h = () => bump((n) => n + 1);
    window.addEventListener('pt:data-ready', h);
    return () => window.removeEventListener('pt:data-ready', h);
  }, []);
  return v;
}

function Modal({ children, size, onClose }) {
  useE(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', h);
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${size||''}`} onClick={(e)=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// --- AUTH: email + OTP ---
function AuthModal({ onClose, onDone }) {
  const [step, setStep] = useS('email');
  const [email, setEmail] = useS('');
  const [code, setCode] = useS(['','','','','','']);
  const [err, setErr] = useS(null);
  const [busy, setBusy] = useS(false);
  const inputs = useR([]);

  const submitEmail = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('Проверьте формат email'); return; }
    setErr(null); setBusy(true);
    try {
      if (window.PT_AUTH && window.PT_AUTH.requestOtp) {
        await window.PT_AUTH.requestOtp(email.trim());
      }
      setStep('otp');
      setTimeout(() => inputs.current[0]?.focus(), 80);
    } catch (e) {
      setErr(e.message || 'Не удалось отправить код. Попробуйте позже.');
    } finally {
      setBusy(false);
    }
  };

  const setDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const nc = [...code]; nc[i] = v; setCode(nc);
    if (v && i < 5) inputs.current[i+1]?.focus();
    if (nc.every(x => x)) setTimeout(() => verify(nc.join('')), 150);
  };

  const verify = async (val) => {
    if (busy) return;
    setErr(null); setBusy(true);
    try {
      if (window.PT_AUTH && window.PT_AUTH.verifyOtp) {
        await window.PT_AUTH.verifyOtp(email.trim(), val);
      }
      onDone();
    } catch (e) {
      setErr(e.message || 'Неверный код');
      setCode(['','','','','','']);
      inputs.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="modal-head">
        <h3>{step === 'email' ? 'Вход / Регистрация' : 'Код из письма'}</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        {step === 'email' && (
          <>
            <p className="muted small" style={{marginTop: 0, marginBottom: 20}}>
              Отправим код на почту. Если аккаунта ещё нет — создадим автоматически. Ни пароля, ни подтверждений.
            </p>
            <div className="field">
              <label>Email</label>
              <input className="input" autoFocus type="email" placeholder="you@company.ru"
                value={email} onChange={(e)=>setEmail(e.target.value)}
                onKeyDown={(e)=>e.key==='Enter' && !busy && submitEmail()} />
              {err && <div className="small" style={{color:'var(--danger)'}}>{err}</div>}
            </div>
            <button className="btn btn-primary btn-block" disabled={busy} onClick={submitEmail}>
              {busy ? 'Отправляем…' : 'Получить код →'}
            </button>
            <p className="xs dim" style={{marginTop: 16, textAlign:'center'}}>Нажимая, вы принимаете <a style={{textDecoration:'underline'}}>условия</a></p>
          </>
        )}
        {step === 'otp' && (
          <>
            <p className="muted small" style={{marginTop: 0, marginBottom: 20}}>
              Отправили 6-значный код на <b>{email}</b>. Проверьте почту (и папку «Спам»).
            </p>
            <div className="otp-grid">
              {code.map((d, i) => (
                <input key={i} ref={el => inputs.current[i] = el}
                  className={`otp-box ${d?'filled':''}`}
                  value={d} onChange={(e)=>setDigit(i, e.target.value)}
                  onKeyDown={(e)=>{ if (e.key==='Backspace' && !d && i>0) inputs.current[i-1]?.focus(); }}
                  maxLength={1} inputMode="numeric" />
              ))}
            </div>
            {err && <div className="small" style={{color:'var(--danger)', marginBottom: 12}}>{err}</div>}
            <button
              className="btn btn-primary btn-block"
              disabled={!code.every(x => x) || busy}
              style={{opacity: (code.every(x => x) && !busy) ? 1 : .4, cursor: (code.every(x => x) && !busy) ? 'pointer' : 'not-allowed', marginBottom: 12}}
              onClick={()=>verify(code.join(''))}>
              {busy ? 'Проверяем…' : 'Подтвердить код'}
            </button>
            <div className="flex-between">
              <button className="btn btn-subtle" onClick={()=>setStep('email')}>← Изменить email</button>
              <button className="btn btn-subtle">Отправить ещё раз</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// --- NEW REQUEST flow (3 steps + OTP inline + success) ---
function NewRequestModal({ onClose, onDone, initial, requireAuth }) {
  const [step, setStep] = useS(1);
  const [submitting, setSubmitting] = useS(false);
  const [submitErr, setSubmitErr] = useS(null);
  const [form, setForm] = useS({
    city: initial?.city || null,
    fns: initial?.fns || null,
    service: initial?.service || null,
    title: '',
    desc: '',
    budget: '',
    visibility: 'public',
    files: [],
    email: (window.PT_AUTH && window.PT_AUTH.getUser && window.PT_AUTH.getUser()?.email) || '',
    code: '',
  });

  const set = (k, v) => setForm(prev => ({...prev, [k]: v}));

  const city = form.city ? ctyById(form.city) : null;
  const fnsOpts = city ? (OV_getFns()[city.id] || []) : [];
  const singleFns = fnsOpts.length === 1;

  // auto-select FNS if only one exists in the picked city
  useE(() => {
    if (form.city && !form.fns && singleFns) {
      setForm(prev => ({...prev, fns: fnsOpts[0].id}));
    }
  }, [form.city]);

  const stepInfo = [
    { n: 1, label: 'Ситуация' },
    { n: 2, label: 'Детали' },
    { n: 3, label: 'Контакт' },
  ];

  const [openField, setOpenField] = useS(null);
  const [cityQuery, setCityQuery] = useS(city?.name || '');

  useE(() => { if (city) setCityQuery(city.name); }, [form.city]);

  const filteredCities = OV_getCities().filter(c => {
    const q = cityQuery.trim().toLowerCase();
    return !q || c.name.toLowerCase().includes(q);
  });

  const canNext = () => {
    if (step === 1) return form.city && form.service;  // fns optional
    if (step === 2) return form.title.length >= 5 && form.desc.length >= 20;
    if (step === 3) return /^\S+@\S+\.\S+$/.test(form.email);
    return true;
  };

  // file handling
  const fileInput = useR(null);
  const addFiles = (fList) => {
    const arr = Array.from(fList).slice(0, 5 - form.files.length).map(f => ({
      name: f.name, size: f.size,
      ext: (f.name.split('.').pop() || 'FILE').toUpperCase().slice(0,4),
    }));
    set('files', [...form.files, ...arr]);
  };
  const removeFile = (idx) => set('files', form.files.filter((_,i)=>i!==idx));
  const fmtSize = (b) => b < 1024 ? b+' б' : b < 1048576 ? (b/1024).toFixed(1)+' кб' : (b/1048576).toFixed(1)+' мб';

  return (
    <Modal size="lg" onClose={onClose}>
      <div className="modal-head">
        <h3>Новая заявка</h3>
        <div className="step-dots">
          {stepInfo.map(s => (
            <span key={s.n} style={{color: s.n <= step ? 'var(--text)' : 'var(--text-dim)'}}>
              {s.n < step ? '●' : s.n === step ? '◉' : '○'} <span style={{opacity: s.n===step?1:.5}}>{s.label}</span>
              {s.n < 3 && <span style={{margin:'0 10px', color:'var(--text-dim)'}}>—</span>}
            </span>
          ))}
        </div>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="modal-body" onClick={(e) => { if (!e.target.closest('.select-trigger') && !e.target.closest('.popover') && !e.target.closest('.city-autocomplete')) setOpenField(null); }}>
        {step === 1 && (
          <div className="fade-in">
            <div className="section-kicker">Шаг 1 · Ситуация</div>
            <h4 style={{fontFamily:'var(--fs-serif)', fontSize: 30, marginTop: 6, marginBottom: 20, fontWeight: 400, letterSpacing: '-0.02em'}}>
              Где и с какой инспекцией?
            </h4>

            <div style={{display:'grid', gridTemplateColumns: (!city || singleFns) ? '1fr' : '1fr 1fr', gap: 16}}>
              <div className="field city-autocomplete" style={{position:'relative'}}>
                <label>Город *</label>
                <input className="input" placeholder="Начните вводить название…"
                  value={openField==='c' ? cityQuery : (city?.name || '')}
                  onFocus={(e)=>{ e.stopPropagation(); setOpenField('c'); setCityQuery(city?.name || ''); }}
                  onChange={(e)=>{ setCityQuery(e.target.value); setOpenField('c'); }}
                />
                {openField==='c' && (
                  <div className="popover">
                    {filteredCities.map(c => (
                      <div key={c.id} className={`pop-item ${form.city===c.id?'selected':''}`}
                        onMouseDown={(e)=>{ e.preventDefault();
                          set('city', c.id);
                          setForm(prev => ({...prev, city: c.id, fns: null}));
                          setCityQuery(c.name);
                          setOpenField(null);
                        }}>
                        <span>{c.name}</span>
                        <span className="sub">{c.specialists} спец.</span>
                      </div>
                    ))}
                    {filteredCities.length === 0 && (
                      <div className="pop-item" style={{color:'var(--text-dim)'}}>Пока нет в этом городе — напишите название, добавим</div>
                    )}
                  </div>
                )}
              </div>

              {city && !singleFns && (
                <div className="field" style={{position:'relative'}}>
                  <label>Инспекция <span style={{color:'var(--text-dim)', fontWeight:400, textTransform:'none', letterSpacing:0}}>(необязательно)</span></label>
                  <div className="select-trigger" onClick={(e)=>{e.stopPropagation(); setOpenField(openField==='f'?null:'f');}}>
                    <span className={form.fns?'':'placeholder'}>
                      {form.fns ? fnsById2(form.city, form.fns)?.code + ' · ' + fnsById2(form.city, form.fns)?.area : 'Любая в городе'}
                    </span>
                    <span className="dim mono">▾</span>
                  </div>
                  {openField==='f' && (
                    <div className="popover">
                      <div className={`pop-item ${!form.fns?'selected':''}`} onMouseDown={(e)=>{e.preventDefault(); set('fns', null); setOpenField(null);}}>
                        <span>Любая ФНС в {city.name}</span><span className="sub">{fnsOpts.length} шт.</span>
                      </div>
                      {fnsOpts.map(f => (
                        <div key={f.id} className={`pop-item ${form.fns===f.id?'selected':''}`}
                          onMouseDown={(e)=>{e.preventDefault(); set('fns', f.id); setOpenField(null);}}>
                          <span>{f.code}</span><span className="sub">{f.area}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {city && singleFns && form.fns && (
              <div className="xs dim" style={{marginTop: -4, marginBottom: 12, padding:'8px 12px', background:'var(--surface-2)', border:'1px solid var(--line)', borderRadius: 8}}>
                В {city.name} одна инспекция — <b style={{color:'var(--text)'}}>{fnsById2(form.city, form.fns)?.code}</b> ({fnsById2(form.city, form.fns)?.area}). Подставили автоматически.
              </div>
            )}

            <div className="field">
              <label>Тип проверки *</label>
              <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 10}}>
                {OV_getServices().map(s => (
                  <button key={s.id}
                    onClick={()=>set('service', s.id)}
                    style={{padding:'14px 16px', borderRadius: 10, border: '1.5px solid ' + (form.service===s.id?'var(--accent)':'var(--line)'),
                      background: form.service===s.id ? 'color-mix(in oklch, var(--accent) 10%, transparent)' : 'var(--bg)',
                      textAlign:'left', transition:'all .15s ease', cursor:'pointer', display:'flex', flexDirection:'column', gap: 4}}>
                    <div style={{fontSize: 14, fontWeight: 500, color: form.service===s.id?'var(--accent)':'var(--text)'}}>{s.name}</div>
                    {s.hint && <div style={{fontSize: 12, color:'var(--text-mute)', lineHeight: 1.4}}>{s.hint}</div>}
                  </button>
                ))}
              </div>
              {form.service === 'unknown' && (
                <div style={{marginTop: 10, padding:'10px 12px', background:'color-mix(in oklch, var(--accent) 10%, transparent)', borderRadius: 8, fontSize: 13, color:'var(--accent)'}}>
                  Опишите на следующем шаге что пришло — специалисты сами определят вид проверки.
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <div className="section-kicker">Шаг 2 · Детали</div>
            <h4 style={{fontFamily:'var(--fs-serif)', fontSize: 30, marginTop: 6, marginBottom: 20, fontWeight: 400, letterSpacing: '-0.02em'}}>
              Расскажите, что произошло
            </h4>

            <div className="field">
              <label>Заголовок заявки *</label>
              <input className="input" placeholder="Например: «Пришло требование по НДС»"
                value={form.title} onChange={(e)=>set('title', e.target.value)} />
            </div>

            <div className="field">
              <label>Описание ситуации *</label>
              <textarea className="textarea" rows="5"
                placeholder="ИП/ООО, режим налогообложения. Что именно пришло, какой срок. Особенности, которые важны. Контакты не пишите — они появятся автоматически для специалиста, когда вы откроете чат."
                value={form.desc} onChange={(e)=>set('desc', e.target.value)} />
              <div className="xs dim">{form.desc.length}/2000 · минимум 20 символов</div>
            </div>

            <div className="field">
              <label>Документы <span style={{color:'var(--text-dim)', fontWeight:400, textTransform:'none', letterSpacing:0}}>(до 5 файлов, необязательно)</span></label>
              <div className="upload-drop"
                onClick={()=>fileInput.current?.click()}
                onDragOver={(e)=>e.preventDefault()}
                onDrop={(e)=>{e.preventDefault(); addFiles(e.dataTransfer.files);}}>
                <div className="up-icon">⇪</div>
                <div className="small">Перетащите требование, декларацию, акт — или <span style={{color:'var(--accent)', textDecoration:'underline'}}>выберите файлы</span></div>
                <div className="xs dim" style={{marginTop: 4}}>PDF · JPG · PNG · DOCX · до 10 МБ. Видят только выбранные вами специалисты.</div>
                <input ref={fileInput} type="file" multiple hidden onChange={(e)=>addFiles(e.target.files)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
              </div>
              {form.files.length > 0 && (
                <div className="upload-list">
                  {form.files.map((f, i) => (
                    <div key={i} className="upload-item">
                      <div className="file-icon">{f.ext}</div>
                      <div className="file-name">{f.name}</div>
                      <div className="file-size">{fmtSize(f.size)}</div>
                      <button className="file-x" onClick={()=>removeFile(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="field">
              <label>Бюджет <span style={{color:'var(--text-dim)', fontWeight:400, textTransform:'none', letterSpacing:0}}>(необязательно — поможет отсеять лишние отклики)</span></label>
              <div className="row">
                {['до 10 000 ₽', '10–40 тыс. ₽', '40–100 тыс. ₽', '100+ тыс. ₽', 'Готов обсудить'].map(b => (
                  <Pill2 key={b} active={form.budget===b} onClick={()=>set('budget', b===form.budget?'':b)}>{b}</Pill2>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Кто увидит заявку</label>
              <div className="pub-toggle">
                <button className={`pub-opt ${form.visibility==='public'?'active':''}`} onClick={()=>set('visibility','public')}>
                  <div className="pub-icon">Публично</div>
                  <div className="pub-title">Видят все специалисты платформы</div>
                  <div className="pub-sub">Быстрее получите отклики. Ваши контакты, ИНН и файлы — скрыты до того, как вы сами откроете чат.</div>
                </button>
                <button className={`pub-opt ${form.visibility==='private'?'active':''}`} onClick={()=>set('visibility','private')}>
                  <div className="pub-icon">Только по выбору</div>
                  <div className="pub-title">Я сам приглашу конкретных</div>
                  <div className="pub-sub">Заявка закрыта. Смотрите каталог, отправляете приглашения адресно. Медленнее, но точнее.</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <div className="section-kicker">Шаг 3 · Контакт</div>
            <h4 style={{fontFamily:'var(--fs-serif)', fontSize: 30, marginTop: 6, marginBottom: 20, fontWeight: 400, letterSpacing: '-0.02em'}}>
              Куда присылать отклики?
            </h4>

            <div className="field">
              <label>Email *</label>
              <input className="input" type="email" placeholder="you@company.ru"
                value={form.email} onChange={(e)=>set('email', e.target.value)} />
            </div>

            <div style={{padding: 16, background:'var(--surface-2)', borderRadius: 10, marginBottom: 16}}>
              <div className="xs mono dim" style={{marginBottom: 10, letterSpacing:'.08em'}}>ПРЕДПРОСМОТР ЗАЯВКИ</div>
              <div style={{fontFamily:'var(--fs-serif)', fontSize: 20, letterSpacing:'-0.015em', marginBottom: 8}}>
                {form.title || '(без заголовка)'}
              </div>
              <div className="small muted" style={{marginBottom: 12}}>{form.desc.slice(0, 180)}{form.desc.length>180?'…':''}</div>
              <div className="row" style={{gap: 8}}>
                <span className="spec-tag">{city?.name}</span>
                {form.fns && <span className="spec-tag">{fnsById2(form.city, form.fns)?.code}</span>}
                {form.service && <span className="spec-tag">{srvById(form.service).short}</span>}
                {form.budget && <span className="spec-tag">{form.budget}</span>}
                {form.files.length > 0 && <span className="spec-tag">⎙ {form.files.length} файл(ов)</span>}
                <span className="spec-tag" style={{background:'var(--surface-2)', color:'var(--text-mute)'}}>
                  {form.visibility==='public'?'◎ публично':'◉ по выбору'}
                </span>
              </div>
            </div>

            <div className="small muted">
              После отправки мы попросим короткий код с почты для подтверждения. Занимает 30 секунд.
            </div>
          </div>
        )}
      </div>

      {submitErr && (
        <div className="small" style={{color:'var(--danger)', padding:'0 24px 8px'}}>{submitErr}</div>
      )}

      <div className="modal-foot">
        {step > 1 ? (
          <button className="btn btn-ghost" onClick={()=>setStep(step-1)} disabled={submitting}>← Назад</button>
        ) : <span></span>}
        {step < 3 ? (
          <button className="btn btn-primary" disabled={!canNext()}
            style={{opacity: canNext()?1:.4, cursor: canNext()?'pointer':'not-allowed'}}
            onClick={()=>canNext() && setStep(step+1)}>
            Далее →
          </button>
        ) : (
          <button className="btn btn-primary" disabled={!canNext() || submitting}
            style={{opacity: (canNext() && !submitting)?1:.4, cursor: (canNext() && !submitting)?'pointer':'not-allowed'}}
            onClick={async () => {
              if (!canNext() || submitting) return;
              setSubmitErr(null);
              const isAuthed = window.PT_AUTH && window.PT_AUTH.isAuthenticated && window.PT_AUTH.isAuthenticated();
              if (!isAuthed) {
                if (requireAuth) {
                  requireAuth(form);
                  return;
                }
                setSubmitErr('Войдите в аккаунт, чтобы опубликовать заявку');
                return;
              }
              setSubmitting(true);
              try {
                const city = form.city ? ctyById(form.city) : null;
                const fnsEntry = (city && form.fns) ? fnsById2(city.id, form.fns) : null;
                const cityUuid = city?._id || city?.id;
                const fnsUuid = fnsEntry?._id || fnsEntry?.id || form.fns;
                if (!cityUuid) { setSubmitErr('Выберите город'); setSubmitting(false); return; }
                if (!fnsUuid) { setSubmitErr('Выберите инспекцию'); setSubmitting(false); return; }
                if ((form.title || '').trim().length < 3) { setSubmitErr('Заголовок: минимум 3 символа'); setSubmitting(false); return; }
                if ((form.desc || '').trim().length < 10) { setSubmitErr('Описание: минимум 10 символов'); setSubmitting(false); return; }
                const payload = {
                  title: form.title.trim(),
                  cityId: cityUuid,
                  fnsId: fnsUuid,
                  description: form.desc.trim(),
                };
                const created = await window.PT_API.createRequest(payload);
                onDone({ ...form, requestId: created.id, apiResult: created });
              } catch (e) {
                setSubmitErr(e.message || 'Не удалось опубликовать заявку');
              } finally {
                setSubmitting(false);
              }
            }}>
            {submitting ? 'Публикуем…' : 'Опубликовать заявку →'}
          </button>
        )}
      </div>
    </Modal>
  );
}

// --- Request SUCCESS state — show published request with live feeds ---
function RequestSuccessModal({ onClose, onOpenChat, data }) {
  const [incoming, setIncoming] = useS([]);
  const [apiDown, setApiDown] = useS(false);

  useE(() => {
    const requestId = data?.requestId;
    // No real request id — fall back to the static sample so the demo still plays.
    if (!requestId || !window.PT_API || !window.PT_API.getPublicRequest) {
      const timeouts = [];
      [{ delay: 1200, id: 'am' }, { delay: 2800, id: 'ik' }].forEach(({ delay, id }) => {
        timeouts.push(setTimeout(() => setIncoming(prev => prev.includes(id) ? prev : [...prev, id]), delay));
      });
      return () => timeouts.forEach(clearTimeout);
    }

    // Real request — poll the public detail endpoint. Each 5s we read
    // threadsCount and, for now, surface a simple synthetic entry per thread
    // because the endpoint only exposes the count, not per-specialist data.
    let alive = true;
    let timer = null;
    const tick = async () => {
      try {
        const r = await window.PT_API.getPublicRequest(requestId);
        if (!alive) return;
        setApiDown(false);
        const count = r.threadsCount || 0;
        setIncoming(prev => {
          if (count <= prev.length) return prev;
          // Generate synthetic keys so React list stays stable between polls.
          const next = [...prev];
          while (next.length < count) next.push('t' + next.length);
          return next;
        });
      } catch {
        if (alive) setApiDown(true);
      } finally {
        if (alive) timer = setTimeout(tick, 5000);
      }
    };
    tick();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [data?.requestId]);

  return (
    <Modal size="lg" onClose={onClose}>
      <div className="modal-head">
        <h3 style={{display:'flex', gap: 10, alignItems:'center'}}>
          <span style={{color:'var(--accent)'}}>●</span>
          Заявка опубликована
        </h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr', gap: 24}}>
          <div>
            <div className="section-kicker">Ваша заявка</div>
            <h4 style={{fontFamily:'var(--fs-serif)', fontSize: 28, fontWeight: 400, letterSpacing:'-0.02em', marginTop: 8, marginBottom: 16, lineHeight: 1.1}}>
              {data?.title || OV_REQ.title}
            </h4>
            <p className="muted small" style={{marginBottom: 16}}>
              {data?.desc || OV_REQ.desc}
            </p>
            <div className="row" style={{marginBottom: 24}}>
              {data?.city && <span className="spec-tag">{ctyById(data.city)?.name}</span>}
              {data?.fns && <span className="spec-tag">{fnsById2(data.city, data.fns)?.code}</span>}
              {data?.service && <span className="spec-tag">{srvById(data.service).short}</span>}
              <span className="req-badge active">● Активна</span>
            </div>

            <div style={{padding: 14, background:'var(--surface-2)', borderRadius: 10, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12}}>
              <div><div className="stat-val" style={{fontSize: 22}}>{incoming.length}</div><div className="stat-label">откликов</div></div>
              <div><div className="stat-val" style={{fontSize: 22}}>7</div><div className="stat-label">просмотров</div></div>
              <div><div className="stat-val" style={{fontSize: 22}}>28</div><div className="stat-label">дней до закрытия</div></div>
            </div>
          </div>

          <div>
            <div className="section-kicker">Отклики в реальном времени</div>
            <div style={{marginTop: 10, display:'grid', gap: 10}}>
              {incoming.length === 0 && (
                <div style={{padding: 16, border:'1px dashed var(--line)', borderRadius: 10, textAlign:'center'}}>
                  <div className="small dim mono">Ждём специалистов…</div>
                  <div style={{marginTop: 12, height: 2, background:'var(--surface-2)', borderRadius: 1, overflow:'hidden'}}>
                    <div style={{height:'100%', background:'var(--accent)', animation:'fill 2s ease-in-out infinite'}}></div>
                  </div>
                </div>
              )}
              {incoming.map(id => {
                const s = OV_getSpecialists().find(x => x.id === id);
                if (s) {
                  return (
                    <div key={id} className="spec-card fade-in" style={{cursor:'pointer'}} onClick={()=>onOpenChat(id)}>
                      <Avatar2 init={s.init} online={s.online} />
                      <div className="spec-meta">
                        <div className="spec-name">{s.first} {s.last}</div>
                        <div className="spec-desc">написал только что</div>
                      </div>
                      <span className="xs mono" style={{color:'var(--accent)'}}>ОТКРЫТЬ →</span>
                    </div>
                  );
                }
                // Real response but we don't know the specialist yet — show a placeholder
                return (
                  <div key={id} className="spec-card fade-in" style={{cursor:'pointer'}}>
                    <Avatar2 init="?" online={true} />
                    <div className="spec-meta">
                      <div className="spec-name">Новый отклик</div>
                      <div className="spec-desc">откройте диалог, чтобы посмотреть</div>
                    </div>
                    <span className="xs mono" style={{color:'var(--accent)'}}>В ЧАТ →</span>
                  </div>
                );
              })}
              {apiDown && incoming.length === 0 && (
                <div style={{padding:'10px 12px', fontSize:12, color:'var(--text-mute)', background:'var(--surface-2)', borderRadius:8}}>
                  Не удалось обновить список откликов. Проверим ещё раз через 5 секунд.
                </div>
              )}
            </div>
            {incoming.length > 0 && (
              <div className="xs dim" style={{marginTop: 12}}>
                Email-уведомление отправлено · можно закрыть окно
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>В личный кабинет</button>
        <button className="btn btn-primary" onClick={() => onOpenChat(incoming[0] || 'am')}>
          {incoming.length > 0 ? 'Открыть чат с первым откликом →' : 'Подождать ещё…'}
        </button>
      </div>
    </Modal>
  );
}

// --- CATALOG modal ---
// ============ PAGE SHELL (breadcrumbs + back) ============
function PageShell({ crumbs, title, action, children }) {
  return (
    <section className="page">
      <div className="page-bar">
        <div className="container page-bar-inner">
          <button className="btn btn-ghost btn-sm" onClick={()=>{
            const internalReferrer = document.referrer && document.referrer.includes(location.host);
            if (internalReferrer || window.history.length > 2) {
              window.history.back();
            } else {
              window.history.pushState(null, '', '/');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}>
            ← Назад
          </button>
          <nav className="crumbs">
            <a href="/" onClick={(e)=>{e.preventDefault(); window.history.pushState(null,'','/'); window.dispatchEvent(new PopStateEvent('popstate'));}}>Главная</a>
            {crumbs && crumbs.map((c, i) => (
              <React.Fragment key={i}>
                <span className="crumb-sep">/</span>
                {c.href ? (
                  <a href={c.href} onClick={(e)=>{
                    e.preventDefault();
                    if (c.onClick) return c.onClick();
                    window.history.pushState(null,'', c.href);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}>{c.label}</a>
                ) : <span className="crumb-cur">{c.label}</span>}
              </React.Fragment>
            ))}
          </nav>
          <div style={{flex: 1}} />
          {action}
        </div>
      </div>
      {children}
    </section>
  );
}

// ============ CATALOG (page) ============
function CatalogPage({ onOpen }) {
  const [city, setCity] = useS('all');
  const [svc, setSvc] = useS(null);
  const [q, setQ] = useS('');
  const dataV = useOVDataVersion();

  const list = useM(() => {
    return OV_getSpecialists().filter(s => {
      if (city !== 'all' && s.city !== city) return false;
      if (svc && !s.services.includes(svc)) return false;
      if (q && !(`${s.first} ${s.last} ${s.role} ${s.fnsLabel}`).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [city, svc, q, dataV]);

  return (
    <PageShell crumbs={[{label:'Каталог специалистов'}]}>
      <div className="container" style={{paddingTop: 20, paddingBottom: 48}}>
        <div className="page-title">
          <h1>Каталог специалистов</h1>
          <div className="dim">Практики с опытом в ваших ИФНС. Выбирайте по инспекции, городу и типу проверки.</div>
        </div>
        <div className="page-card">
        <div style={{padding:'16px 24px', borderBottom:'1px solid var(--line)', display:'grid', gridTemplateColumns:'1fr auto', gap: 16, alignItems:'center'}}>
          <input className="input" placeholder="Поиск по имени, роли, ФНС…" value={q} onChange={(e)=>setQ(e.target.value)} />
          <span className="small dim mono">{list.length} специалистов</span>
        </div>
        <div style={{padding:'12px 24px', borderBottom:'1px solid var(--line)', display:'flex', gap: 8, flexWrap:'wrap'}}>
          <Pill2 active={city==='all'} onClick={()=>setCity('all')}>Все города</Pill2>
          {OV_getCities().slice(0, 6).map(c => <Pill2 key={c.id} active={city===c.id} onClick={()=>setCity(c.id)}>{c.name}</Pill2>)}
          <div style={{width: 1, background:'var(--line)', margin:'0 6px'}}></div>
          {OV_getServices().map(s => (
            <Pill2 key={s.id} active={svc===s.id} onClick={()=>setSvc(svc===s.id?null:s.id)}>{s.short}</Pill2>
          ))}
        </div>
        <div style={{padding: 20}}>
          <div className="catalog">
            {list.map(s => (
              <div key={s.id} className="cat-card" onClick={()=>onOpen(s.id)}>
                <div className="cat-card-head">
                  <Avatar2 init={s.init} online={s.online} size="lg" />
                  <div>
                    <div className="cat-card-name">{s.first} {s.last}</div>
                    <div className="cat-card-role">{s.role}</div>
                  </div>
                </div>
                <div className="cat-card-fns">{s.fnsLabel}</div>
                <div className="cat-card-tags">
                  {s.services.map(id => <span key={id} className="spec-tag">{srvById(id).short}</span>)}
                </div>
                <div className="cat-card-foot">
                  {s.online ? <span className="status-on">На связи · {s.responseTime}</span> : <span className="status-off">Не в сети</span>}
                  <span className="dim mono xs">{s.cases} кейсов</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </PageShell>
  );
}

// --- Specialist profile (page) ---
function SpecialistPage({ id, onBack, onCatalog, onMessage }) {
  const s = OV_getSpecialists().find(x => x.id === id);
  if (!s) {
    return (
      <PageShell crumbs={[{label:'Каталог', href:'/catalog'}, {label:'Специалист не найден'}]}>
        <div className="container" style={{padding:'48px 0'}}>
          <h1>Специалист не найден</h1>
          <p className="dim">Возможно, ссылка устарела. Попробуйте вернуться в каталог.</p>
          <a className="btn btn-primary" href="/catalog" onClick={(e)=>{e.preventDefault(); onCatalog && onCatalog();}}>В каталог</a>
        </div>
      </PageShell>
    );
  }
  return (
    <PageShell
      crumbs={[
        {label:'Каталог', href:'/catalog', onClick: onCatalog},
        {label: s.first + ' ' + s.last}
      ]}
      action={<button className="btn btn-primary" onClick={()=>onMessage(s.id)}>Написать →</button>}
    >
      <div className="container" style={{paddingTop: 20, paddingBottom: 64}}>
        <div className="prof page-card" style={{padding: 0}}>
        <div className="prof-head">
          <Avatar2 init={s.init} online={s.online} size="xl" />
          <div style={{flex: 1}}>
            <div style={{fontFamily:'var(--fs-sans)', fontSize: 34, fontWeight: 600, letterSpacing:'-0.02em', lineHeight: 1}}>
              {s.first} {s.last}
            </div>
            <div className="mono small dim" style={{marginTop: 6}}>{s.role}</div>
            <div className="row" style={{marginTop: 12}}>
              {s.online
                ? <span className="status-on">На связи · ответ {s.responseTime}</span>
                : <span className="status-off">Не в сети · ответ к утру</span>}
              <span className="dim small">· на P2PTax с {s.since}</span>
            </div>
          </div>
        </div>

        <div className="prof-stats">
          <div><div className="prof-stat-val">{s.cases}</div><div className="prof-stat-k">Кейсов</div></div>
          <div><div className="prof-stat-val">{s.fns.length}</div><div className="prof-stat-k">ИФНС в работе</div></div>
          <div><div className="prof-stat-val">{s.services.length}</div><div className="prof-stat-k">Видов проверок</div></div>
        </div>

        <div className="prof-section">
          <h5>О себе</h5>
          <p className="muted" style={{margin: 0}}>{s.bio}</p>
        </div>

        <div className="prof-section">
          <h5>Рабочие инспекции</h5>
          <div className="row">
            {s.fns.map(fid => {
              const f = fnsById2(s.city, fid);
              return <span key={fid} className="spec-tag">{ctyById(s.city).name} · {f?.code}</span>;
            })}
          </div>
        </div>

        <div className="prof-section">
          <h5>Виды проверок</h5>
          <div className="row">
            {s.services.map(sid => {
              const srv = srvById(sid);
              return <span key={sid} className="spec-tag">{srv.name}</span>;
            })}
          </div>
        </div>

        <div className="prof-section">
          <h5>Контакты</h5>
          <div className="prof-contacts">
            {s.phone && <div className="prof-contact"><span className="k">Телефон</span><span className="mono">{s.phone}</span></div>}
            {s.telegram && <div className="prof-contact"><span className="k">Telegram</span><span className="mono">{s.telegram.startsWith('@') ? s.telegram : '@' + s.telegram}</span></div>}
            {s.city && ctyById(s.city) && <div className="prof-contact"><span className="k">Офис</span><span>{s.officeAddress || ctyById(s.city).name}</span></div>}
            {!s.phone && !s.telegram && (
              <div className="prof-contact dim"><span className="k">—</span><span>Контакты появятся после первого сообщения</span></div>
            )}
          </div>
        </div>
        </div>
      </div>
    </PageShell>
  );
}

// --- Chat (page) ---
function ChatPage({ specialistId, onBack, onProfile }) {
  const initial = OV_getSpecialists().find(x => x.id === specialistId) || OV_getSpecialists()[0];
  const [active, setActive] = useS(initial.id);
  const [messages, setMessages] = useS({});
  const [input, setInput] = useS('');
  const [typing, setTyping] = useS({}); // id -> bool
  const [menuOpen, setMenuOpen] = useS(false);
  const [muted, setMuted] = useS({});
  const bodyRef = useR();
  const fileRef = useR();

  useE(() => {
    setMessages(prev => {
      if (prev[active]) return prev;
      // seed with read statuses
      const seed = OV_MSGS.map((m, i) => ({
        ...m,
        who: m.who || active,
        status: m.from === 'me' ? (i === OV_MSGS.length - 1 ? 'delivered' : 'read') : undefined,
      }));
      return {...prev, [active]: seed};
    });
  }, [active]);

  useE(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, active, typing]);

  // close kebab menu on outside click
  useE(() => {
    if (!menuOpen) return;
    const h = (e) => { if (!e.target.closest('.kebab-wrap')) setMenuOpen(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [menuOpen]);

  const now = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  };

  const push = (peerId, msg) => {
    setMessages(prev => ({...prev, [peerId]: [...(prev[peerId]||[]), msg]}));
  };

  const simulateResponse = (peerId) => {
    setTyping(t => ({...t, [peerId]: true}));
    setTimeout(() => {
      // mark all my messages as read
      setMessages(prev => ({
        ...prev,
        [peerId]: (prev[peerId]||[]).map(m => m.from === 'me' ? {...m, status: 'read'} : m)
      }));
    }, 800);
    setTimeout(() => {
      setTyping(t => ({...t, [peerId]: false}));
      push(peerId, { from:'them', who: peerId, text:'Принял. Давайте уточним детали — пришлите скан требования и декларацию, из которой пришли вопросы.', time: now() });
    }, 2200);
  };

  const send = () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    const peer = active;
    push(peer, { from:'me', text, time: now(), status: 'sent' });
    // quick transitions: sent → delivered → read
    setTimeout(() => setMessages(prev => ({
      ...prev,
      [peer]: (prev[peer]||[]).map((m, i, arr) => i === arr.length - 1 && m.from === 'me' ? {...m, status: 'delivered'} : m)
    })), 400);
    simulateResponse(peer);
  };

  const onPickFile = (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    const peer = active;
    files.forEach(f => {
      push(peer, {
        from:'me',
        kind:'file',
        file: { name: f.name, size: f.size, type: f.type },
        time: now(),
        status: 'sent',
      });
    });
    e.target.value = '';
    setTimeout(() => setMessages(prev => ({
      ...prev,
      [peer]: (prev[peer]||[]).map(m => m.from === 'me' && m.status === 'sent' ? {...m, status: 'delivered'} : m)
    })), 500);
    simulateResponse(peer);
  };

  const clearChat = () => {
    if (!confirm('Удалить переписку? Это действие нельзя отменить.')) return;
    setMessages(prev => ({...prev, [active]: []}));
    setMenuOpen(false);
  };
  const toggleMute = () => { setMuted(m => ({...m, [active]: !m[active]})); setMenuOpen(false); };
  const report = () => { alert('Жалоба отправлена модераторам. Мы разберёмся в течение суток.'); setMenuOpen(false); };
  const block = () => {
    if (!confirm('Заблокировать этого специалиста? Он больше не сможет писать вам.')) return;
    alert('Специалист заблокирован.');
    setMenuOpen(false);
  };

  const activeSpec = OV_getSpecialists().find(x => x.id === active) || initial;
  const list = [initial, ...OV_getSpecialists().filter(x=>x.id!==initial.id).slice(0,3)];

  return (
    <PageShell crumbs={[{label:'Сообщения'}, {label: activeSpec.first + ' ' + activeSpec.last}]}>
      <div className="container" style={{paddingTop: 16, paddingBottom: 32}}>
        <div className="chat page-card" style={{padding: 0, height: 'calc(100vh - 180px)', minHeight: 560}}>
        <div className="chat-list">
          {list.map(s => (
            <div key={s.id} className={`chat-item ${active===s.id?'active':''}`} onClick={()=>setActive(s.id)}>
              <Avatar2 init={s.init} online={s.online} />
              <div style={{minWidth: 0, flex: 1}}>
                <div className="chat-item-name">
                  {s.first} {s.last}
                  {muted[s.id] && <span className="chat-mute-dot" title="Без уведомлений">🔕</span>}
                </div>
                <div className="chat-item-last">{s.id === initial.id ? 'Принял. Давайте уточним…' : 'Посмотрел вашу заявку…'}</div>
                <div className="chat-item-time">{s.id === initial.id ? '14:12' : 'вчера'}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="chat-panel">
          <div className="chat-head">
            <Avatar2 init={activeSpec.init} online={activeSpec.online} />
            <div style={{flex: 1, cursor:'pointer'}} onClick={()=>onProfile(activeSpec.id)}>
              <div style={{fontSize: 14, fontWeight: 500}}>{activeSpec.first} {activeSpec.last}</div>
              <div className="xs dim">
                {typing[active]
                  ? <span className="typing-inline">печатает<span className="dots"><i/><i/><i/></span></span>
                  : <>{activeSpec.online ? 'на связи' : 'не в сети'} · {activeSpec.fnsLabel}</>}
              </div>
            </div>
            <span className="req-badge">РЕ: {OV_REQ.title.slice(0, 40)}…</span>
            <div className="kebab-wrap">
              <button className="kebab-btn" onClick={(e)=>{e.stopPropagation(); setMenuOpen(v=>!v);}} aria-label="Меню">⋮</button>
              {menuOpen && (
                <div className="kebab-menu">
                  <button onClick={()=>{ setMenuOpen(false); onProfile(activeSpec.id); }}>Профиль специалиста</button>
                  <button onClick={toggleMute}>{muted[active] ? 'Включить уведомления' : 'Отключить уведомления'}</button>
                  <div className="kebab-sep"></div>
                  <button onClick={report}>Пожаловаться</button>
                  <button onClick={block} className="danger">Заблокировать</button>
                  <button onClick={clearChat} className="danger">Удалить переписку</button>
                </div>
              )}
            </div>
          </div>
          <div className="chat-body" ref={bodyRef}>
            {(messages[active] || []).map((m, i) => (
              <div key={i} className={`msg ${m.from}`}>
                {m.kind === 'file' ? (
                  <div className="msg-file">
                    <div className="msg-file-icon">📎</div>
                    <div style={{minWidth: 0, flex: 1}}>
                      <div className="msg-file-name">{m.file.name}</div>
                      <div className="msg-file-size">{fmtSize(m.file.size)}</div>
                    </div>
                    <button className="msg-file-dl" onClick={(e)=>{e.stopPropagation();}}>↓</button>
                  </div>
                ) : (
                  <div>{m.text}</div>
                )}
                <div className="msg-meta">
                  <span className="msg-time">{m.time}</span>
                  {m.from === 'me' && m.status && (
                    <span className={`msg-tick ${m.status}`}>
                      {m.status === 'sent' && '✓'}
                      {m.status === 'delivered' && '✓✓'}
                      {m.status === 'read' && '✓✓'}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {typing[active] && (
              <div className="msg them typing">
                <span className="dots"><i/><i/><i/></span>
              </div>
            )}
          </div>
          <div className="chat-foot">
            <input ref={fileRef} type="file" multiple style={{display:'none'}} onChange={onPickFile} />
            <button className="chat-attach" onClick={()=>fileRef.current?.click()} title="Прикрепить файл" aria-label="Прикрепить файл">📎</button>
            <input className="input" placeholder="Напишите сообщение…" value={input}
              onChange={(e)=>setInput(e.target.value)}
              onKeyDown={(e)=>e.key==='Enter' && send()} />
            <button className="btn btn-primary" onClick={send}>Отправить</button>
          </div>
        </div>
        </div>
      </div>
    </PageShell>
  );
}

function fmtSize(n) {
  if (n < 1024) return n + ' Б';
  if (n < 1024*1024) return (n/1024).toFixed(1) + ' КБ';
  return (n/1024/1024).toFixed(1) + ' МБ';
}

Object.assign(window, {
  PT_AuthModal: AuthModal, PT_NewRequestModal: NewRequestModal,
  PT_RequestSuccessModal: RequestSuccessModal,
  PT_CatalogPage: CatalogPage, PT_SpecialistPage: SpecialistPage, PT_ChatPage: ChatPage,
});
