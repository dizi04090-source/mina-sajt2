'use client';
import { useEffect, useMemo, useState } from 'react';
import { TREATMENTS, SLOTS, FAQ, fmt } from '../lib/mock';
import { api, hasApi } from '../lib/api';
import { Logo, Btn, Badge, Thumb, Faq, LineIcon } from './ui';

const MENU = [
  ['home', 'Početna', 'home'],
  ['booking', 'Zakazivanje', 'calendar'],
  ['treatments', 'Tretmani', 'spa'],
  ['my', 'Moji termini', 'message'],
  ['profile', 'Nalog', 'user'],
];
const ADMIN_MENU = [['admin', 'Admin panel', 'settings']];
const CATEGORIES = ['Svi', 'Lice', 'Telo', 'Masaže', 'Depilacija', 'Wellness'];
const STATUS = { PENDING: 'Na čekanju', CONFIRMED: 'Potvrđeno', COMPLETED: 'Završeno', CANCELLED: 'Otkazano' };
const toneOf = name => ({ Lice: 'lice', Telo: 'telo', 'Masaže': 'masaze', Depilacija: 'depilacija', Wellness: 'wellness' }[name] || 'lice');
const listOf = value => Array.isArray(value) ? value : [];
const todayIso = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const emptyAdmin = { counts: { users: 0, bookings: 0, pending: 0, treatments: 0 }, bookings: [] };

export default function Desktop() {
  const [view, setView] = useState('home');
  const [authMode, setAuthMode] = useState('register');
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '', remember: true });
  const [treatments, setTreatments] = useState(TREATMENTS);
  const [cat, setCat] = useState('Svi');
  const [query, setQuery] = useState('');
  const [booking, setBooking] = useState({ treatment: TREATMENTS[1], day: new Date().getDate(), date: todayIso(), time: '09:00', note: '' });
  const [activeBookings, setActiveBookings] = useState([]);
  const [history, setHistory] = useState([]);
  const [admin, setAdmin] = useState(emptyAdmin);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [adminForm, setAdminForm] = useState({ fullName: '', email: '', password: '' });
  const [notice, setNotice] = useState('');
  const [err, setErr] = useState('');

  const nav = user?.role === 'ADMIN' ? MENU.concat(ADMIN_MENU) : MENU;
  const shownTreatments = useMemo(() => listOf(treatments).filter(t => (cat === 'Svi' || t.category === cat) && t.name.toLowerCase().includes(query.toLowerCase())), [treatments, cat, query]);
  const fmtBooking = b => ({
    ...b,
    treatmentName: b.treatment?.name || 'Tretman',
    priceRsd: b.treatment?.priceRsd || 0,
    tone: toneOf(b.treatment?.category?.name || b.treatment?.category),
    statusLabel: STATUS[b.status] || b.status,
    when: new Date(b.startsAt).toLocaleString('sr-Latn'),
  });

  const setF = key => e => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const setAF = key => e => setAdminForm({ ...adminForm, [key]: e.target.value });

  const reloadBookings = async t => {
    if (!hasApi || !t) return;
    const r = await api('/api/bookings/my', { token: t });
    setActiveBookings(listOf(r.active).map(fmtBooking));
    setHistory(listOf(r.history).map(fmtBooking));
  };
  const reloadAdmin = async t => {
    if (!hasApi || !t) return;
    const r = await api('/api/admin/overview', { token: t });
    setAdmin({ ...emptyAdmin, ...r, counts: { ...emptyAdmin.counts, ...(r.counts || {}) }, bookings: listOf(r.bookings).map(fmtBooking) });
  };
  const reloadTreatments = async () => {
    if (!hasApi) return;
    const r = await api('/api/treatments');
    const x = listOf(r).map(t => ({ id: t.id, name: t.name, priceRsd: t.priceRsd, durationMin: t.durationMin, category: t.category?.name || 'Lice', tone: toneOf(t.category?.name), popular: t.popular }));
    if (x.length) {
      setTreatments(x);
      setBooking(b => ({ ...b, treatment: x[1] || x[0] || b.treatment }));
    }
  };
  const loadMessages = async b => {
    if (!b?.id || !token) return;
    setSelected(b);
    setMessages(listOf(await api(`/api/bookings/${b.id}/messages`, { token })));
  };

  useEffect(() => {
    reloadTreatments().catch(() => {});
    const saved = typeof window !== 'undefined' && localStorage.getItem('minaSession');
    if (!saved || !hasApi) return;
    try {
      const data = JSON.parse(saved);
      setToken(data.token);
      setUser(data.user);
      setView('home');
      reloadBookings(data.token).catch(() => localStorage.removeItem('minaSession'));
      if (data.user.role === 'ADMIN') reloadAdmin(data.token).catch(() => {});
    } catch {
      localStorage.removeItem('minaSession');
    }
  }, []);

  const authenticate = async mode => {
    setErr(''); setNotice('');
    if (!hasApi) return setErr('Backend API nije povezan. Postavi NEXT_PUBLIC_API_URL na Renderu.');
    if (mode === 'register' && form.password !== form.confirm) return setErr('Lozinke se ne poklapaju.');
    const body = mode === 'register'
      ? { fullName: form.fullName, email: form.email, password: form.password }
      : { email: form.email, password: form.password, remember: form.remember };
    try {
      const r = await api('/api/auth/' + mode, { method: 'POST', body });
      setToken(r.token); setUser(r.user); setView('home');
      if (form.remember) localStorage.setItem('minaSession', JSON.stringify({ token: r.token, user: r.user }));
      await reloadBookings(r.token);
      if (r.user.role === 'ADMIN') await reloadAdmin(r.token);
    } catch (e) {
      setErr(e.message);
    }
  };

  const createBooking = async () => {
    setErr(''); setNotice('');
    if (!token) return setAuthMode('login');
    try {
      await api('/api/bookings', { method: 'POST', token, body: { treatmentId: booking.treatment.id, date: booking.date, time: booking.time, note: booking.note } });
      await reloadBookings(token);
      if (user?.role === 'ADMIN') await reloadAdmin(token);
      setNotice('Termin je poslat i sačuvan. Admin ga sada vidi u panelu.');
      setView('my');
    } catch (e) {
      setErr(e.message);
    }
  };

  const updateStatus = async (id, status) => {
    await api('/api/admin/bookings/' + id, { method: 'PATCH', token, body: { status } });
    await reloadAdmin(token);
    setNotice('Status termina je ažuriran.');
  };

  const sendMessage = async () => {
    if (!selected?.id || !message.trim()) return;
    const m = await api(`/api/bookings/${selected.id}/messages`, { method: 'POST', token, body: { body: message } });
    setMessages([...messages, m]);
    setMessage('');
    if (user?.role === 'ADMIN') await reloadAdmin(token);
  };

  const createAdmin = async () => {
    setErr(''); setNotice('');
    try {
      await api('/api/admin/admins', { method: 'POST', token, body: adminForm });
      setAdminForm({ fullName: '', email: '', password: '' });
      setNotice('Admin nalog je dodat ili postojeći korisnik sada ima admin pristup.');
    } catch (e) {
      setErr(e.message);
    }
  };

  if (!user) {
    return (
      <div className="auth-shell min-h-screen bg-lav-2 p-6">
        <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl grid-cols-[1fr_440px] overflow-hidden rounded-3xl bg-paper shadow-soft">
          <section className="soft-hero relative flex flex-col justify-between p-12">
            <Logo size="text-6xl" />
            <div className="max-w-xl animate-rise">
              <p className="text-xs tracking-[.35em] text-mina">MINA WELLNESS SALON</p>
              <h1 className="mt-5 font-serif text-7xl leading-none text-mina">Rezerviši negu bez čekanja.</h1>
              <p className="mt-5 max-w-md text-mina/70">Nalog je potreban da bi svaki termin bio sačuvan u bazi i vidljiv adminu za potvrdu.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm text-mina">
              {['Sigurno zakazivanje', 'Admin potvrda', 'Razgovor o plaćanju'].map(x => <div key={x} className="rounded-2xl bg-white/70 p-4">{x}</div>)}
            </div>
          </section>
          <section className="flex flex-col justify-center p-10">
            <div className="mb-7 grid grid-cols-2 rounded-full bg-lav p-1 text-sm">
              <button onClick={() => setAuthMode('register')} className={`rounded-full py-2 font-semibold ${authMode === 'register' ? 'bg-mina text-white' : 'text-mina'}`}>Napravi nalog</button>
              <button onClick={() => setAuthMode('login')} className={`rounded-full py-2 font-semibold ${authMode === 'login' ? 'bg-mina text-white' : 'text-mina'}`}>Prijava</button>
            </div>
            <h2 className="font-serif text-4xl text-mina">{authMode === 'register' ? 'Napravi nalog' : 'Prijavite se'}</h2>
            <p className="mb-6 mt-2 text-sm text-mina/60">Prvo napravi nalog, zatim biraš tretman i termin.</p>
            <div className="space-y-3">
              {authMode === 'register' && <input value={form.fullName} onChange={setF('fullName')} className="w-full rounded-2xl border border-lav-2 px-4 py-3 outline-none" placeholder="Ime i prezime" />}
              <input value={form.email} onChange={setF('email')} className="w-full rounded-2xl border border-lav-2 px-4 py-3 outline-none" placeholder="Email adresa" type="email" />
              <input value={form.password} onChange={setF('password')} className="w-full rounded-2xl border border-lav-2 px-4 py-3 outline-none" placeholder="Lozinka" type="password" />
              {authMode === 'register' && <input value={form.confirm} onChange={setF('confirm')} className="w-full rounded-2xl border border-lav-2 px-4 py-3 outline-none" placeholder="Potvrdi lozinku" type="password" />}
              {authMode === 'login' && <label className="flex items-center gap-2 text-sm text-mina"><input type="checkbox" checked={form.remember} onChange={setF('remember')} className="accent-mina" /> Zapamti me</label>}
              {err && <p className="text-sm text-red-600">{err}</p>}
              <Btn className="w-full rounded-full" onClick={() => authenticate(authMode)}>{authMode === 'register' ? 'Napravi nalog' : 'Prijavite se'}</Btn>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr_340px] bg-lav-2 p-3">
      <aside className="flex flex-col rounded-l-3xl bg-gradient-to-b from-lav to-lav-2 p-5">
        <Logo size="text-5xl" />
        <nav className="mt-8 space-y-1">{nav.map(([k, label, icon]) => (
          <button key={k} onClick={() => setView(k)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${view === k ? 'bg-white font-bold text-mina shadow-soft' : 'text-mina/80 hover:bg-white/60'}`}>
            <LineIcon name={icon} className="h-4 w-4" /><span>{label}</span>
          </button>
        ))}</nav>
        <button onClick={() => { localStorage.removeItem('minaSession'); setUser(null); setToken(null); setAuthMode('login'); }} className="mt-auto rounded-xl border border-mina/20 px-4 py-3 text-sm font-semibold text-mina hover:bg-white">Odjavi se</button>
      </aside>

      <main className="bg-paper p-6">
        <header className="mb-6 flex items-center gap-4">
          <label className="flex flex-1 items-center gap-3 rounded-full bg-white px-5 py-3 shadow-soft"><LineIcon name="search" className="h-4 w-4 text-mina/60" /><input value={query} onChange={e => setQuery(e.target.value)} className="w-full outline-none" placeholder="Pretraži tretmane..." /></label>
          <div className="rounded-full bg-white px-4 py-2 text-sm shadow-soft"><b>{user.fullName}</b><span className="ml-2 text-mina/50">{user.role === 'ADMIN' ? 'Admin' : 'Korisnik'}</span></div>
        </header>

        {notice && <p className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
        {err && <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}

        {view === 'home' && <section className="space-y-6 animate-rise">
          <div className="soft-hero rounded-3xl p-10">
            <p className="text-xs tracking-[.3em] text-mina">MINA WELLNESS SALON</p>
            <h1 className="my-3 font-serif text-6xl leading-[1.05] text-mina">Tvoje zdravlje.<br />Tvoja lepota.</h1>
            <p className="mb-6 max-w-sm text-mina/80">Izaberi tretman, pošalji zahtev, a admin potvrđuje termin iz panela.</p>
            <Btn className="inline-flex items-center gap-2 rounded-full" onClick={() => setView('booking')}><LineIcon name="calendar" className="h-4 w-4" />Zakaži termin</Btn>
          </div>
          <div className="grid grid-cols-4 gap-3">{shownTreatments.filter(t => t.popular).slice(0, 4).map(t => <TreatmentCard key={t.id} t={t} onPick={() => { setBooking({ ...booking, treatment: t }); setView('booking'); }} />)}</div>
        </section>}

        {view === 'treatments' && <section className="animate-rise">
          <div className="mb-4 flex gap-2">{CATEGORIES.map(c => <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-2 text-sm ${cat === c ? 'bg-mina text-white' : 'bg-white text-mina shadow-soft'}`}>{c}</button>)}</div>
          <div className="grid grid-cols-4 gap-3">{shownTreatments.map(t => <TreatmentCard key={t.id} t={t} onPick={() => { setBooking({ ...booking, treatment: t }); setView('booking'); }} />)}</div>
        </section>}

        {view === 'booking' && <section className="grid grid-cols-[1fr_1fr] gap-5 animate-rise">
          <div className="rounded-2xl bg-white p-5 shadow-soft">
            <h2 className="mb-4 font-serif text-3xl text-mina">Zakazivanje</h2>
            <div className="grid grid-cols-2 gap-3">{treatments.slice(0, 8).map(t => <button key={t.id} onClick={() => setBooking({ ...booking, treatment: t })} className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${booking.treatment.id === t.id ? 'border-mina bg-lav' : 'border-lav-2'}`}><Thumb tone={t.tone} className="mb-2 h-16 w-full" /><b>{t.name}</b><div className="text-xs text-mina/60">{fmt(t.priceRsd)} · {t.durationMin} min</div></button>)}</div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-soft">
            <h3 className="font-serif text-2xl text-mina">Detalji termina</h3>
            <div className="my-4 flex gap-3"><Thumb tone={booking.treatment.tone} /><div><b>{booking.treatment.name}</b><p className="text-sm text-mina/60">{fmt(booking.treatment.priceRsd)}</p></div></div>
            <label className="text-sm font-semibold text-mina">Datum</label>
            <input type="date" value={booking.date} onChange={e => setBooking({ ...booking, date: e.target.value })} className="mt-1 w-full rounded-xl border border-lav-2 px-4 py-3 outline-none" />
            <label className="mt-4 block text-sm font-semibold text-mina">Vreme</label>
            <div className="mt-2 grid grid-cols-3 gap-2">{SLOTS.map(t => <button key={t} onClick={() => setBooking({ ...booking, time: t })} className={`rounded-full border py-2 text-sm ${booking.time === t ? 'border-mina bg-mina text-white' : 'border-lav-2'}`}>{t}</button>)}</div>
            <textarea value={booking.note} onChange={e => setBooking({ ...booking, note: e.target.value })} className="mt-4 h-28 w-full rounded-2xl border border-lav-2 p-3 outline-none" placeholder="Napomena za admina, pitanje za plaćanje ili poseban zahtev..." />
            <Btn className="mt-4 w-full rounded-full" onClick={createBooking}>Pošalji zahtev za termin</Btn>
          </div>
        </section>}

        {view === 'my' && <BookingList title="Moji termini" items={activeBookings.concat(history)} onOpen={loadMessages} />}

        {view === 'profile' && <section className="rounded-2xl bg-white p-6 shadow-soft animate-rise"><h2 className="font-serif text-3xl text-mina">Moj nalog</h2><p className="mt-2">{user.fullName}</p><p className="text-mina/60">{user.email}</p><p className="mt-4 text-sm text-mina/70">Svi termini poslati preko ovog naloga čuvaju se u bazi i vidljivi su adminu.</p></section>}

        {view === 'admin' && <AdminPanel admin={admin} adminForm={adminForm} setAF={setAF} createAdmin={createAdmin} updateStatus={updateStatus} loadMessages={loadMessages} />}
      </main>

      <aside className="space-y-4 rounded-r-3xl border-l border-lav-2 bg-paper p-5">
        <div className="rounded-2xl bg-white p-4 shadow-soft">
          <h3 className="font-serif text-2xl text-mina">Razgovor</h3>
          {!selected ? <p className="mt-3 text-sm text-mina/60">Izaberi termin da vidiš poruke o zakazivanju i plaćanju.</p> : <>
            <p className="mt-1 text-sm font-semibold">{selected.treatmentName}</p>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
              {messages.length ? messages.map(m => <div key={m.id} className={`rounded-2xl p-3 text-sm ${m.sender?.role === 'ADMIN' ? 'bg-mina text-white' : 'bg-lav text-mina'}`}><b className="block text-xs opacity-70">{m.sender?.fullName || 'Korisnik'}</b>{m.body}</div>) : <p className="text-sm text-mina/50">Još nema poruka.</p>}
            </div>
            <textarea value={message} onChange={e => setMessage(e.target.value)} className="mt-3 h-24 w-full rounded-2xl border border-lav-2 p-3 text-sm outline-none" placeholder="Napiši poruku..." />
            <Btn className="mt-2 w-full !py-2 text-sm" onClick={sendMessage}>Pošalji poruku</Btn>
          </>}
        </div>
        <h3 className="font-serif text-2xl text-mina">Najčešća pitanja</h3>
        <Faq items={FAQ} />
      </aside>
    </div>
  );
}

function TreatmentCard({ t, onPick }) {
  return <button onClick={onPick} className="group rounded-2xl bg-white p-3 text-left shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lg">
    <Thumb tone={t.tone} className="h-28 w-full" />
    <b className="mt-3 block">{t.name}</b>
    <p className="text-xs text-mina/60">{fmt(t.priceRsd)} · {t.durationMin} min</p>
    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-mina">Izaberi <LineIcon name="arrow" className="h-3 w-3 transition group-hover:translate-x-1" /></span>
  </button>;
}

function BookingList({ title, items, onOpen }) {
  return <section className="animate-rise"><h2 className="mb-4 font-serif text-3xl text-mina">{title}</h2>
    <div className="space-y-3">{items.length ? items.map(b => <button key={b.id} onClick={() => onOpen(b)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5">
      <Thumb tone={b.tone} /><div className="flex-1"><b>{b.treatmentName}</b><p className="text-sm text-mina/60">{b.when}</p><p className="text-xs text-mina/50">{fmt(b.priceRsd)}</p></div><Badge s={b.statusLabel} />
    </button>) : <p className="rounded-2xl bg-white p-5 text-mina/60 shadow-soft">Još nema termina.</p>}</div>
  </section>;
}

function AdminPanel({ admin, adminForm, setAF, createAdmin, updateStatus, loadMessages }) {
  return <section className="space-y-5 animate-rise">
    <div className="grid grid-cols-4 gap-3">{[
      ['Korisnici', admin.counts?.users || 0],
      ['Termini', admin.counts?.bookings || 0],
      ['Na čekanju', admin.counts?.pending || 0],
      ['Tretmani', admin.counts?.treatments || 0],
    ].map(([label, value]) => <div key={label} className="rounded-2xl bg-white p-4 shadow-soft"><b className="block text-3xl text-mina">{value}</b><span className="text-sm text-mina/60">{label}</span></div>)}</div>

    <div className="grid grid-cols-[1fr_330px] gap-5">
      <div className="rounded-2xl bg-white p-5 shadow-soft">
        <h2 className="mb-4 font-serif text-3xl text-mina">Zakazani termini</h2>
        <div className="space-y-3">{listOf(admin.bookings).map(b => <div key={b.id} className="rounded-2xl border border-lav-2 p-4">
          <div className="flex items-center gap-3"><Thumb tone={b.tone} /><div className="flex-1"><b>{b.treatmentName}</b><p className="text-sm text-mina/60">{b.user?.fullName} · {b.when}</p></div><Badge s={b.statusLabel} /></div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => updateStatus(b.id, 'CONFIRMED')} className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Odobri</button>
            <button onClick={() => updateStatus(b.id, 'COMPLETED')} className="rounded-full bg-lav px-3 py-2 text-xs font-semibold text-mina">Završi</button>
            <button onClick={() => updateStatus(b.id, 'CANCELLED')} className="rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Otkaži</button>
            <button onClick={() => loadMessages(b)} className="ml-auto rounded-full border border-mina/20 px-3 py-2 text-xs font-semibold text-mina">Poruke</button>
          </div>
        </div>)}</div>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-soft">
        <h3 className="font-serif text-2xl text-mina">Dodaj admina</h3>
        <p className="mb-4 mt-1 text-sm text-mina/60">Admin nalog se pravi direktno kroz zaštićeni backend endpoint.</p>
        <input value={adminForm.fullName} onChange={setAF('fullName')} className="mb-2 w-full rounded-xl border border-lav-2 px-3 py-2 outline-none" placeholder="Ime i prezime" />
        <input value={adminForm.email} onChange={setAF('email')} className="mb-2 w-full rounded-xl border border-lav-2 px-3 py-2 outline-none" placeholder="Email" />
        <input value={adminForm.password} onChange={setAF('password')} className="mb-3 w-full rounded-xl border border-lav-2 px-3 py-2 outline-none" placeholder="Privremena lozinka" type="password" />
        <Btn className="w-full !py-2 text-sm" onClick={createAdmin}>Dodaj admin nalog</Btn>
      </div>
    </div>
  </section>;
}
