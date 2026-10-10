'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, MapPin, Menu, MessageSquare, X } from 'lucide-react';
import { api, hasApi } from '../lib/api';
import { TREATMENTS, CATEGORIES, SLOTS, fmt } from '../lib/mock';
import { Modal } from './Dialog';
import TreatmentDetails, { TreatmentPrice } from './TreatmentDetails';
import { treatmentDetails } from '../lib/treatment-details';
import { Badge } from './ui';
import { MotionBloom, useSalonScroll, useButtonMotion } from './SalonMotion';

const STATUS = { PENDING: 'Na čekanju', CONFIRMED: 'Potvrđeno', COMPLETED: 'Završeno', CANCELLED: 'Otkazano' };
const images = { Lice: '/images/facial-treatment-v2.webp', Telo: '/images/body-treatment.webp', 'Masaže': '/images/massage-treatment-v2.webp', Depilacija: '/images/depilation-treatment.webp', Wellness: '/images/salon-room.webp' };
const day = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dateLabel = value => new Date(value).toLocaleString('sr-Latn', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Belgrade' });
function Brand() { return <a className="brand" href="#home" aria-label="Mina Wellness Salon — početna"><img src="/mina-mark.svg" alt="" /><span>MINA<small>WELLNESS SALON</small></span></a>; }

export default function Website() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [treatments, setTreatments] = useState(TREATMENTS);
  const [catalogReady, setCatalogReady] = useState(false);
  const [category, setCategory] = useState('Svi');
  const [menu, setMenu] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);
  useEffect(() => { setMotionEnabled(localStorage.getItem('minaMotion') !== 'quiet'); }, []);
  const toggleMotion = () => { const next = !motionEnabled; setMotionEnabled(next); localStorage.setItem('minaMotion', next ? 'full' : 'quiet');  };
  const [modal, setModal] = useState(null);
  const [detailTreatment, setDetailTreatment] = useState(null);
  const showTreatment = treatment => { setDetailTreatment(treatment); setError(''); setThread(null); setModal('details'); };
  const [authMode, setAuthMode] = useState('login');
  const [afterAuth, setAfterAuth] = useState('account');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '', remember: true });
  const [booking, setBooking] = useState({ treatmentId: '', date: day(1), time: '09:00', note: '' });
  const [accountTab, setAccountTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [overview, setOverview] = useState(null);
  const [inbox, setInbox] = useState([]);
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [adminForm, setAdminForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const root = useRef(null);
  const generation = useRef(0);
  const lock = useRef(false);
  const user = session?.user;
  const isAdmin = ready && user?.role === 'ADMIN';
  const selectedTreatment = treatments.find(t => String(t.id) === String(booking.treatmentId));
  useEffect(() => { document.documentElement.style.scrollBehavior = motionEnabled ? '' : 'auto'; return () => { document.documentElement.style.scrollBehavior = ''; }; }, [motionEnabled]);
  useSalonScroll(root, motionEnabled);
  useButtonMotion(motionEnabled);

  const reloadCatalog = async () => {
    if (!hasApi) throw new Error('Povezivanje sa salonom trenutno nije dostupno. Pokušajte kasnije.');
    const data = await api('/api/treatments');
    if (!Array.isArray(data)) throw new Error('Lista tretmana trenutno nije dostupna. Pokušajte kasnije.');
    const next = data.map(t => ({ ...t, category: t.category?.name || 'Wellness' }));
    setBooking(b => {
      const previous = treatments.find(t => String(t.id) === String(b.treatmentId));
      const match = next.find(t => t.name === previous?.name) || next.find(t => String(t.id) === String(b.treatmentId));
      return { ...b, treatmentId: match ? String(match.id) : '' };
    });
    setTreatments(next); setCatalogReady(true);
  };

  useEffect(() => {
    if (hasApi) reloadCatalog().catch(() => {});
    let saved;
    try { saved = JSON.parse(localStorage.getItem('minaSession') || sessionStorage.getItem('minaSession') || 'null'); } catch {}
    if (saved?.token && hasApi) api('/api/users/profile', { token: saved.token, timeoutMs: 5000 }).then(profile => {
      if (!profile.id || !['USER', 'ADMIN'].includes(profile.role)) throw new Error('Nevažeća sesija.');
      setSession({ token: saved.token, user: profile });
    }).catch(() => { localStorage.removeItem('minaSession'); sessionStorage.removeItem('minaSession'); }).finally(() => setReady(true));
    else setReady(true);
  }, []);

  useEffect(() => {
    const elements = root.current?.querySelectorAll('[data-reveal]');
    if (!elements) return;
    if (!motionEnabled || !window.IntersectionObserver) { elements.forEach(e => e.classList.add('is-visible')); return; }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { rootMargin: '0px 0px -17% 0px', threshold: 0 });
    elements.forEach(e => observer.observe(e));
    return () => observer.disconnect();
  }, [category, treatments, motionEnabled]);

  const run = async action => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await action(); } catch (e) { setError(e.message); }
    finally { lock.current = false; setBusy(false); }
  };
  const close = () => { if (lock.current) return; generation.current++; setModal(null); setThread(null); setError(''); setLoading(false); };
  const refreshAccount = async (s = session) => {
    if (!s) return;
    if (s.user.role === 'ADMIN') {
      const [data, conversations] = await Promise.all([api('/api/admin/overview', { token: s.token }), api('/api/admin/conversations', { token: s.token })]);
      setOverview(data); setBookings(data.bookings); setInbox(conversations);
    } else {
      const data = await api('/api/bookings/my', { token: s.token });
      setBookings([...data.active, ...data.history]);
    }
  };
  const enter = async (target, s = session) => {
    setMenu(false); setError(''); setNotice(''); setThread(null);
    if (!ready) return;
    if (!s) { setAfterAuth(target); setAuthMode('login'); setModal('auth'); return; }
    setModal(target);
    if (target === 'account') { setAccountTab('bookings'); setLoading(true); try { await refreshAccount(s); } catch (e) { setError(e.message); } finally { setLoading(false); } }
    if (target === 'contact') await openThread({ path: '/api/conversations/my', title: 'Razgovor sa Minom', general: true }, s);
  };
  const startBooking = treatment => {
    if (treatment) setBooking(b => ({ ...b, treatmentId: String(treatment.id) }));
    else if (!booking.treatmentId && treatments.length) setBooking(b => ({ ...b, treatmentId: String(treatments[0].id) }));
    enter('booking');
  };
  const authenticate = event => {
    event.preventDefault();
    run(async () => {
      if (!hasApi) throw new Error('Prijava trenutno nije dostupna. Pokušajte ponovo kasnije.');
      if (authMode === 'register' && form.password !== form.confirm) throw new Error('Lozinke se ne poklapaju.');
      const s = await api('/api/auth/' + authMode, { method: 'POST', body: form });
      if (!s.token || !s.user) throw new Error('Prijava nije uspela. Pokušajte ponovo.');
      setSession(s); setForm(f => ({ ...f, password: '', confirm: '' }));
      localStorage.removeItem('minaSession'); sessionStorage.removeItem('minaSession');
      (form.remember ? localStorage : sessionStorage).setItem('minaSession', JSON.stringify(s));
      await enter(afterAuth, s);
    });
  };
  const openThread = async (target, s = session) => {
    const requestId = ++generation.current;
    setThread(target); setMessage(''); setMessages([]); setLoading(true); setError('');
    try {
      const data = await api(target.path, { token: s.token });
      if (generation.current === requestId) setMessages(target.general ? data.messages : data);
    } catch (e) { if (generation.current === requestId) setError(e.message); }
    finally { if (generation.current === requestId) setLoading(false); }
  };
  useEffect(() => {
    if (!thread || !session || !modal) return;
    let active = true;
    const id = setInterval(async () => {
      if (document.hidden || lock.current) return;
      try { const data = await api(thread.path, { token: session.token }); if (active) setMessages(thread.general ? data.messages : data); } catch {}
    }, 12000);
    return () => { active = false; clearInterval(id); };
  }, [thread, session, modal]);
  const send = event => {
    event.preventDefault();
    run(async () => {
      if (!message.trim()) return;
      const data = await api(thread.path, { method: 'POST', token: session.token, body: { body: message.trim() } });
      setMessages(m => [...m, data]); setMessage('');
    });
  };
  const submitBooking = event => {
    event.preventDefault();
    run(async () => {
      if (!catalogReady || !selectedTreatment) throw new Error('Lista tretmana trenutno nije dostupna. Pokušajte ponovo kasnije.');
      await api('/api/bookings', { method: 'POST', token: session.token, body: { ...booking, treatmentId: selectedTreatment.id } });
      await refreshAccount(); setModal('account'); setAccountTab('bookings'); setNotice('Zahtev je poslat. Termin je rezervisan nakon potvrde salona.');
    });
  };
  const updateBooking = (b, status) => run(async () => {
    await api(isAdmin ? `/api/admin/bookings/${b.id}` : `/api/bookings/${b.id}`, { method: isAdmin ? 'PATCH' : 'DELETE', token: session.token, ...(isAdmin && { body: { status } }) });
    await refreshAccount(); setNotice('Status termina je ažuriran.');
  });
  const logout = () => { close(); setSession(null); setBookings([]); setInbox([]); setOverview(null); localStorage.removeItem('minaSession'); sessionStorage.removeItem('minaSession'); setNotice('Uspešno ste se odjavili.'); };
  const field = key => event => setForm(f => ({ ...f, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));

  return <div className="mina-site" ref={root} data-motion={motionEnabled ? 'full' : 'quiet'}>
    <header className="site-header"><div className="site-container header-inner"><Brand />
      <nav className={menu ? 'main-nav open' : 'main-nav'} aria-label="Glavna navigacija">
        {[['#treatments', 'Tretmani'], ['#about', 'O salonu'], ['#contact', 'Kontakt']].map(([href, label]) => <a key={href} href={href} onClick={() => setMenu(false)}>{label}</a>)}
        {isAdmin ? <button onClick={() => enter('account')}>Admin panel</button> : <button disabled={!ready} onClick={() => enter('account')}>{user ? 'Moj nalog' : 'Prijava'}</button>}
      </nav>
      <button className="primary header-book" disabled={!ready} onClick={() => startBooking()}>Zakaži termin <ArrowRight size={15} /></button>
      <button className="menu-toggle" aria-label={menu ? 'Zatvori meni' : 'Otvori meni'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
    </div><div className="scroll-progress" aria-hidden="true" /></header>
    {notice && <div className="site-container"><div className="site-notice" role="status">{notice}<button aria-label="Zatvori obaveštenje" onClick={() => setNotice('')}><X size={16} /></button></div></div>}
    <main>
      <section id="home" className="landing-hero"><img className="hero-backdrop" src="/images/mina-portrait.webp" alt="Mina u svom salonu" fetchPriority="high" /><MotionBloom className="hero-bloom" /><div className="site-container hero-layout">
        <div className="hero-copy"><p className="eyebrow hero-enter">MINA WELLNESS · SUBOTICA</p><h1 className="hero-enter">Vreme za mir.<br />Vreme za <em>sebe.</em></h1><p className="hero-enter hero-description">Prepusti se nezi, pronađi svoj balans i uživaj u malim ritualima koji čine veliku razliku.</p>
          <div className="hero-actions hero-enter"><button className="primary" disabled={!ready} onClick={() => startBooking()}>Zakaži svoj trenutak <ArrowRight size={17} /></button><a href="#treatments" className="text-link">Istraži tretmane</a></div>
          <div className="hero-location hero-enter"><MapPin size={15} /> Braće Radić 57, Subotica</div>
        </div>
      </div></section>
      <div className="ritual-strip"><span>Pažnja u svakom detalju</span><span>Nega po tvojoj meri</span><span>Tvoj trenutak mira</span></div>
      <section id="treatments" className="site-section site-container"><div className="section-heading" data-reveal><div><p className="eyebrow">NAŠI RITUALI</p><h2>Nega koja ti <em>prija.</em></h2></div><p>Od opuštajuće masaže do nege lica i tela.<br />Pronađi tretman za svoj ritam.</p></div>
        <div className="category-list" data-reveal aria-label="Kategorije tretmana">{CATEGORIES.map(c => <button aria-pressed={category === c} key={c} onClick={() => setCategory(c)} className={category === c ? 'active' : ''}>{c}</button>)}</div>
        <div className="service-grid">{treatments.filter(t => category === 'Svi' || t.category === category).map((t, i) => <article className="service-card" key={t.id} onClick={event => { if (!event.target.closest('button')) showTreatment(t); }} data-reveal style={{ '--reveal-delay': `${(i % 3) * 75}ms` }}>
          <div className="service-image"><img src={images[t.category] || images.Wellness} alt={t.name} loading="lazy" />{t.popular && <span>Omiljeni ritual</span>}</div><div className="service-content"><small>{t.category} · {t.durationMin} min</small><h3><button className="service-title" onClick={() => showTreatment(t)} aria-label={`Detalji: ${t.name}`}>{t.name}</button></h3><p className="service-summary">{treatmentDetails(t).summary}</p><button className="service-details-link" onClick={() => showTreatment(t)} aria-label={`Saznaj više: ${t.name}`}>O tretmanu <ArrowRight size={15} /></button><div className="service-bottom"><TreatmentPrice value={t.priceRsd} /><button disabled={!ready} onClick={() => startBooking(t)} aria-label={`Zakaži ${t.name}`}>Zakaži <ArrowRight size={16} /></button></div></div>
        </article>)}</div>
        {!treatments.length && <p className="empty-state">Tretmani će uskoro biti dostupni. Pošalji Mini pitanje za preporuku.</p>}
      </section>
      <section id="about" className="about-section"><MotionBloom className="about-bloom" /><div className="site-container about-layout"><div className="about-image" data-reveal><img src="/images/salon-room.webp" alt="Prostor Mina salona sa lavandom i priborom za masažu" loading="lazy" /></div><div className="about-copy" data-reveal><p className="eyebrow">DOBRODOŠLA U MINA WELLNESS</p><h2>Mali predah.<br /><em>Velika razlika.</em></h2><p>Mirna atmosfera, tople boje i vreme posvećeno tebi. U našem salonu u Subotici svaki dolazak je prilika da usporiš i posvetiš pažnju svom telu.</p><p>Nisi sigurna koji tretman da izabereš? Piši Mini i zajedno pronađite negu koja ti odgovara.</p><button className="text-link" disabled={!ready} onClick={() => enter('contact')}>Razgovaraj sa Minom <ArrowRight size={17} /></button></div></div></section>
      <section className="site-section site-container gallery-section"><div className="section-heading" data-reveal><div><p className="eyebrow">PROSTOR ZA OPUŠTANJE</p><h2>Oseti atmosferu <em>salona.</em></h2></div></div><div className="salon-gallery"><img data-reveal src="/images/salon-atmosphere.webp" alt="Toplo osvetljen prostor za masažu" loading="lazy" /><img data-reveal src="/images/salon-details.webp" alt="Detalji prostora i priprema za tretman" loading="lazy" /></div></section>
      <section id="contact" className="contact-section"><MotionBloom className="contact-bloom" /><div className="site-container contact-layout" data-reveal><div><p className="eyebrow">TU SMO ZA TEBE</p><h2>Tvoj sledeći trenutak <em>mira.</em></h2><p><MapPin size={18} /> Braće Radić 57, 24000 Subotica</p><a className="text-link" href="https://www.google.com/maps/search/?api=1&query=Bra%C4%87e+Radi%C4%87+57+Subotica" target="_blank" rel="noreferrer">Pronađi salon <ArrowRight size={16} /></a></div><div className="contact-actions"><button className="primary" disabled={!ready} onClick={() => startBooking()}><CalendarDays size={18} /> Zakaži termin</button><button className="secondary" disabled={!ready} onClick={() => enter('contact')}><MessageSquare size={18} /> Piši Mini</button><small>Za zakazivanje i poruke potrebna je prijava.</small></div></div></section>
    </main>
    <footer className="site-container site-footer"><Brand /><p>© {new Date().getFullYear()} Mina Wellness Salon</p><button className="motion-toggle" aria-pressed={motionEnabled} onClick={toggleMotion}>Animacije: {motionEnabled ? 'uključene' : 'isključene'}</button><a href="#home">Na vrh <ArrowRight size={14} /></a></footer>

    <Modal reduced={!motionEnabled} open={Boolean(modal)} onClose={close} title={modal === 'details' ? detailTreatment?.name : modal === 'auth' ? authMode === 'login' ? 'Dobrodošla nazad.' : 'Tvoj nalog za negu.' : modal === 'booking' ? 'Zakaži svoj trenutak.' : modal === 'contact' ? 'Razgovor sa Minom' : isAdmin ? `Zdravo, ${user?.fullName || user?.username}!` : 'Moj nalog'}>
      {modal === 'details' && detailTreatment && <TreatmentDetails treatment={detailTreatment} image={images[detailTreatment.category] || images.Wellness} ready={ready} onBook={() => startBooking(detailTreatment)} onContact={() => enter('contact')} />}
      {notice && modal === 'account' && <p className="dialog-intro" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {modal === 'auth' && <><p className="dialog-intro">{afterAuth === 'booking' ? 'Prijavi se da nastaviš zakazivanje. Tvoj izbor tretmana ostaje sačuvan.' : afterAuth === 'contact' ? 'Prijavi se da pošalješ Mini poruku.' : 'Prijavi se da vidiš svoje termine i poruke.'}</p><div className="dialog-tabs"><button className={authMode === 'login' ? 'active' : ''} onClick={() => { setAuthMode('login'); setError(''); }}>Prijava</button><button className={authMode === 'register' ? 'active' : ''} onClick={() => { setAuthMode('register'); setError(''); }}>Napravi nalog</button></div><form className="site-form" onSubmit={authenticate}>
        {authMode === 'register' && <label>Ime i prezime<input autoComplete="name" required maxLength={160} value={form.fullName} onChange={field('fullName')} /></label>}
        <label>Email adresa<input type="email" autoComplete="email" required value={form.email} onChange={field('email')} /></label><label>Lozinka<input type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} required minLength={authMode === 'register' ? 8 : undefined} value={form.password} onChange={field('password')} /></label>
        {authMode === 'register' && <><small>Najmanje 8 znakova, uključujući slovo i broj.</small><label>Potvrdi lozinku<input type="password" autoComplete="new-password" required value={form.confirm} onChange={field('confirm')} /></label></>}
        <label className="checkbox-label"><input type="checkbox" checked={form.remember} onChange={field('remember')} /> Zapamti me na ovom uređaju</label><button className="primary" disabled={busy}>{busy ? 'Sačekajte...' : authMode === 'login' ? 'Prijavi se' : 'Napravi nalog'}</button><button type="button" className="text-link" onClick={close}>Nastavi razgledanje</button>
      </form></>}
      {modal === 'booking' && <form className="site-form" onSubmit={submitBooking}><p className="dialog-intro">Izaberi tretman i željeni termin. Mina će potvrditi tvoju rezervaciju.</p><label>Tretman<select required value={booking.treatmentId} onChange={e => setBooking(b => ({ ...b, treatmentId: e.target.value }))}><option value="">Izaberi tretman</option>{treatments.map(t => <option key={t.id} value={t.id}>{t.name} · {fmt(t.priceRsd)}</option>)}</select></label><div className="form-pair"><label>Datum<input type="date" required min={day()} value={booking.date} onChange={e => setBooking(b => ({ ...b, date: e.target.value }))} /></label><label>Željeno vreme<select value={booking.time} onChange={e => setBooking(b => ({ ...b, time: e.target.value }))}>{SLOTS.map(time => <option key={time}>{time}</option>)}</select></label></div><label>Napomena <span>(opciono)</span><textarea maxLength={1000} value={booking.note} onChange={e => setBooking(b => ({ ...b, note: e.target.value }))} placeholder="Šta bi želela da znamo pre dolaska?" /></label>{selectedTreatment && <div className="booking-summary"><span>{selectedTreatment.durationMin} min · {fmt(selectedTreatment.priceRsd)}</span><small>Braće Radić 57, Subotica</small></div>}<button className="primary" disabled={busy || !catalogReady}>{busy ? 'Slanje...' : 'Pošalji zahtev za termin'}</button>{!catalogReady && <><small>Lista tretmana trenutno nije dostupna.</small><button type="button" className="text-link" disabled={busy} onClick={() => run(reloadCatalog)}>Pokušaj ponovo</button></>}</form>}
      {modal === 'account' && !thread && <div className="account-content"><div className="account-user"><span>{user?.fullName}<small>{user?.email}</small></span><button className="text-link" onClick={logout}>Odjavi se</button></div><div className="dialog-tabs"><button className={accountTab === 'bookings' ? 'active' : ''} onClick={() => setAccountTab('bookings')}>Termini</button><button className={accountTab === 'messages' ? 'active' : ''} onClick={() => { setAccountTab('messages'); if (!isAdmin) openThread({ path: '/api/conversations/my', title: 'Razgovor sa Minom', general: true }); }}>Poruke</button>{isAdmin && <button className={accountTab === 'admins' ? 'active' : ''} onClick={() => setAccountTab('admins')}>Admin nalozi</button>}</div>
        <button className="text-link refresh-link" disabled={busy || loading} onClick={() => run(() => refreshAccount())}>Osveži podatke</button>
        {loading ? <p role="status">Učitavanje...</p> : accountTab === 'bookings' ? <>{isAdmin && overview && <div className="admin-stats"><span><b>{overview.counts.bookings}</b>Termini</span><span><b>{overview.counts.pending}</b>Na čekanju</span><span><b>{overview.counts.users}</b>Korisnici</span></div>}{!bookings.length && <p className="empty-state">{isAdmin ? 'Još nema zakazanih termina.' : 'Još nemaš zakazan termin. Pronađi svoj omiljeni ritual.'}</p>}{bookings.map(b => <article className="booking-card" key={b.id}><div className="booking-card-head"><h3>{b.treatment?.name}</h3><Badge s={STATUS[b.status]} /></div>{isAdmin && <p>{b.user?.fullName} · {b.user?.email}</p>}<p>{dateLabel(b.startsAt)}</p><small>{b.location}</small>{b.note && <p className="booking-note">{b.note}</p>}<div className="booking-card-actions"><button className="text-link" onClick={() => openThread({ path: `/api/bookings/${b.id}/messages`, title: b.treatment?.name })}>{isAdmin ? 'Razgovor sa klijentom' : 'Poruke o terminu'}</button>{['PENDING', 'CONFIRMED'].includes(b.status) && <>{isAdmin && b.status === 'PENDING' && <button disabled={busy} onClick={() => updateBooking(b, 'CONFIRMED')}>Potvrdi</button>}{isAdmin && b.status === 'CONFIRMED' && <button disabled={busy} onClick={() => updateBooking(b, 'COMPLETED')}>Završi</button>}<button disabled={busy} onClick={() => updateBooking(b, 'CANCELLED')}>Otkaži</button></>}</div></article>)}{!isAdmin && <button className="primary" onClick={() => startBooking()}>Novi termin <ArrowRight size={16} /></button>}</> : accountTab === 'messages' ? <>{!inbox.length && <p className="empty-state">Još nema pitanja klijenata.</p>}{inbox.map(c => <button className="inbox-row" key={c.id} onClick={() => openThread({ path: `/api/conversations/${c.id}/messages`, title: c.user.fullName })}><b>{c.user.fullName}</b><span>{c.lastMessage}</span><small>{dateLabel(c.updatedAt)}</small></button>)}</> : <form className="site-form" onSubmit={e => { e.preventDefault(); run(async () => { await api('/api/admin/admins', { method: 'POST', token: session.token, body: adminForm }); setAdminForm({ fullName: '', email: '', password: '' }); setNotice('Admin pristup je dodeljen.'); }); }}><p className="dialog-intro">Dodaj administratora ili dodeli admin pristup postojećem nalogu.</p>{[['fullName', 'Ime i prezime', 'text'], ['email', 'Email adresa', 'email'], ['password', 'Lozinka', 'password']].map(([key, label, type]) => <label key={key}>{label}<input type={type} required minLength={key === 'password' ? 8 : undefined} value={adminForm[key]} onChange={e => setAdminForm(f => ({ ...f, [key]: e.target.value }))} /></label>)}<button className="primary" disabled={busy}>Dodaj administratora</button></form>}
      </div>}
      {thread && ['contact', 'account'].includes(modal) && <div className="conversation"><div className="conversation-heading">{modal === 'account' && <button className="text-link" onClick={() => { generation.current++; setThread(null); setLoading(false); setError(''); }}>Nazad</button>}<span>{thread.title}</span><button className="text-link" disabled={loading || busy} onClick={() => openThread(thread)}>Osveži</button></div><p className="dialog-intro">{isAdmin ? 'Odgovori klijentu direktno iz svog panela.' : 'Mina će odgovoriti ovde. Poruke ostaju sačuvane u tvom nalogu.'}</p><div className="message-list" aria-live="polite">{loading ? <p role="status">Učitavanje poruka...</p> : !messages.length ? <p className="empty-state">Počni razgovor. Kako možemo da ti pomognemo?</p> : messages.map(m => <div key={m.id} className={String(m.sender?.id) === String(user?.id) ? 'message-bubble own' : 'message-bubble'}><b>{m.sender?.fullName}</b><p>{m.body}</p><small>{dateLabel(m.createdAt)}</small></div>)}</div><form className="site-form" onSubmit={send}><label>Tvoja poruka<textarea required maxLength={1000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Napiši poruku..." /></label><button className="primary" disabled={busy || loading || !message.trim()}>{busy ? 'Slanje...' : 'Pošalji poruku'} <ArrowRight size={16} /></button></form></div>}
    </Modal>
  </div>;
}
