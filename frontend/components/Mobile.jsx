'use client';
import { useState, useEffect } from 'react';
import { TREATMENTS, BOOKINGS, HISTORY, SLOTS, SALON, USER, CATEGORIES, fmt } from '../lib/mock';
import { Logo, Btn, Ghost, Field, Badge, Thumb, Calendar, lab, iso } from './ui';
import { api, hasApi } from '../lib/api';

const NAV = [['home', 'Početna', '🏠'], ['treatments', 'Tretmani', '🪷'], ['b1', 'Zakazivanje', '📅'], ['profile', 'Profil', '👤']];
const STEPS = ['Tretman', 'Datum', 'Vreme', 'Potvrda'];

export default function Mobile() {
  const [s, setS] = useState('splash');
  const [cat, setCat] = useState('Svi'), [q, setQ] = useState(''), [tab, setTab] = useState('Aktivna');
  const [bk, setBk] = useState({ t: TREATMENTS[1], day: new Date().getDate(), time: '09:00', note: '' });
  const [list, setList] = useState(BOOKINGS), [hist, setHist] = useState(HISTORY);
  const [TR, setTR] = useState(TREATMENTS), [tok, setTok] = useState(null), [user, setUser] = useState(USER), [err, setErr] = useState('');
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '', remember: false });
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const EMO = { Lice: '✨', Telo: '🌿', 'Masaže': '💆‍♀️', Depilacija: '🪷', Wellness: '🕯️' };
  const STAT = { PENDING: 'Na čekanju', CONFIRMED: 'Potvrđeno', COMPLETED: 'Završeno', CANCELLED: 'Otkazano' };
  const fmtB = b => { const d = new Date(b.startsAt); return { id: b.id, treatment: b.treatment.name, priceRsd: b.treatment.priceRsd, when: `${d.toLocaleDateString('sr-Latn')} • ${d.toTimeString().slice(0, 5)}`, status: STAT[b.status], emoji: '✨' }; };
  const reload = async t => { const r = await api('/api/bookings/my', { token: t }); setList(r.active.map(fmtB)); setHist(r.history.map(fmtB)); };
  useEffect(() => { if (!hasApi) return; api('/api/treatments').then(r => { const x = r.map(t => ({ id: t.id, name: t.name, priceRsd: t.priceRsd, durationMin: t.durationMin, category: t.category.name, emoji: EMO[t.category.name] || '✨', popular: t.popular })); setTR(x); setBk(b => ({ ...b, t: x[1] || x[0] })); }).catch(() => {}); }, []);
  const auth = async mode => {
    setErr(''); if (!hasApi) return setS('home');
    try {
      if (mode === 'register' && f.password !== f.confirm) throw new Error('Lozinke se ne poklapaju');
      const r = await api('/api/auth/' + mode, { method: 'POST', body: mode === 'login' ? { email: f.email, password: f.password, remember: f.remember } : { fullName: f.name, email: f.email, password: f.password } });
      setTok(r.token); setUser(r.user); await reload(r.token); setS('home');
    } catch (e) { setErr(e.message); }
  };
  const cancel = async id => { try { if (hasApi) await api('/api/bookings/' + id, { method: 'DELETE', token: tok }); setList(list.filter(x => x.id !== id)); } catch (e) { setErr(e.message); } };
  const Err = () => err ? <p role="alert" className="text-sm text-red-600">{err}</p> : null;
  useEffect(() => { if (s === 'splash') { const t = setTimeout(() => setS('login'), 2200); return () => clearTimeout(t); } }, [s]);

  const shown = TR.filter(t => (cat === 'Svi' || t.category === cat) && t.name.toLowerCase().includes(q.toLowerCase()));
  const step = { b1: 0, b2: 1, b3: 3 }[s];
  const withNav = ['home', 'treatments', 'b1', 'b2', 'b3', 'my', 'profile'].includes(s);
  const confirm = async () => {
    setErr('');
    try {
      if (hasApi) { await api('/api/bookings', { method: 'POST', token: tok, body: { treatmentId: bk.t.id, date: iso(bk.day), time: bk.time, note: bk.note } }); await reload(tok); }
      else setList([...list, { id: Date.now() + '', treatment: bk.t.name, priceRsd: bk.t.priceRsd, when: `${lab(bk.day)} • ${bk.time}`, status: 'Na čekanju', emoji: bk.t.emoji }]);
      setS('my');
    } catch (e) { setErr(e.message); }
  };
  const Row = ({ t, onClick, right }) => (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-soft">
      <Thumb e={t.emoji} /><div className="flex-1"><div className="font-semibold">{t.name}</div>
      <div className="text-xs text-mina/70">{fmt(t.priceRsd)}</div><div className="text-xs text-mina/50">{t.durationMin} min</div></div>{right ?? '›'}</button>);
  const Head = ({ title, back }) => (
    <div className="flex items-center gap-3 pb-4"><button aria-label="Nazad" onClick={() => setS(back)} className="text-xl text-mina">‹</button>
      <h1 className="flex-1 pr-6 text-center font-semibold">{title}</h1></div>);
  const Stepper = () => (
    <div className="mb-5 flex justify-between">{STEPS.map((l, i) => (
      <div key={l} className="flex flex-col items-center text-[11px]"><span className={`grid h-7 w-7 place-items-center rounded-full ${i <= step ? 'bg-mina text-white' : 'bg-lav-2 text-mina/50'}`}>{i + 1}</span>{l}</div>))}</div>);

  return (
    <div className="relative flex min-h-screen w-full max-w-md flex-col bg-paper">
      <main className="flex-1 overflow-y-auto p-5 pb-24">
        {s === 'splash' && <div className="grid min-h-[80vh] place-items-center bg-gradient-to-b from-lav-2 to-lav text-center"><div><Logo size="text-7xl" /><p className="mt-6 text-sm text-mina">Tvoje zdravlje. Tvoja lepota.<br />Naša briga.</p></div></div>}

        {s === 'login' && <div className="space-y-4 pt-6"><Logo size="text-4xl" />
          <h1 className="font-serif text-3xl text-mina">Prijavite se</h1><p className="text-sm text-mina/70">Dobrodošli nazad! Uživajte u svojim omiljenim tretmanima.</p>
          <Field icon="✉️" type="email" placeholder="Email adresa" value={f.email} onChange={set('email')} /><Field icon="🔒" type="password" placeholder="Lozinka" value={f.password} onChange={set('password')} />
          <div className="flex justify-between text-sm"><label><input type="checkbox" checked={f.remember} onChange={set('remember')} className="mr-2 accent-mina" />Zapamti me</label><a className="text-mina">Zaboravili ste lozinku?</a></div>
          <Err /><Btn className="w-full" onClick={() => auth('login')}>Prijavite se</Btn>
          <p className="text-center text-xs text-mina/60">ili se prijavite preko</p>
          <div className="flex justify-center gap-4">{['G', '', 'f'].map((x, i) => <button key={i} aria-label={['Google', 'Apple', 'Facebook'][i]} className="h-12 w-12 rounded-full bg-white font-bold text-mina shadow-soft">{x || ''}</button>)}</div>
          <p className="text-center text-sm">Nemate nalog? <button className="font-semibold text-mina" onClick={() => setS('register')}>Napravite nalog</button></p></div>}

        {s === 'register' && <div className="space-y-4 pt-6"><Logo size="text-4xl" />
          <h1 className="font-serif text-3xl text-mina">Napravi nalog</h1><p className="text-sm text-mina/70">Postanite deo naše zajednice i otkrijte sve pogodnosti.</p>
          <Field icon="👤" placeholder="Ime i prezime" value={f.name} onChange={set('name')} /><Field icon="✉️" type="email" placeholder="Email adresa" value={f.email} onChange={set('email')} />
          <Field icon="🔒" type="password" placeholder="Lozinka (min. 8 znakova)" value={f.password} onChange={set('password')} /><Field icon="🔒" type="password" placeholder="Potvrdite lozinku" value={f.confirm} onChange={set('confirm')} />
          <Err /><Btn className="w-full" onClick={() => auth('register')}>Napravi nalog</Btn>
          <p className="text-center text-sm">Već imate nalog? <button className="font-semibold text-mina" onClick={() => setS('login')}>Prijavite se</button></p></div>}

        {s === 'home' && <div className="space-y-5">
          <div><h1 className="font-serif text-3xl text-mina">Zdravo, {user.fullName.split(' ')[0]}! ✨</h1><p className="text-sm text-mina/70">Brinemo o tvom zdravlju i lepoti.</p></div>
          <div className="rounded-3xl bg-gradient-to-br from-mina to-mina-2 p-5 text-white shadow-soft"><h2 className="font-serif text-3xl leading-tight">Oseti razliku,<br />izaberi sebe.</h2>
            <button onClick={() => setS('b1')} className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-mina">Zakazivanje tretmana</button></div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">{[['🪷', 'Tretmani', 'treatments'], ['🎁', 'Paketi'], ['🧴', 'Kozmetika'], ['🤍', 'Sa nama']].map(([e, l, to]) => (
            <button key={l} onClick={() => to && setS(to)} className="rounded-2xl bg-white p-3 shadow-soft"><div className="text-xl">{e}</div>{l}</button>))}</div>
          <div className="flex justify-between"><h2 className="font-semibold">Popularni tretmani</h2><button className="text-xs text-mina" onClick={() => setS('treatments')}>Pogledaj sve →</button></div>
          <div className="flex gap-3 overflow-x-auto pb-2">{TR.filter(t => t.popular).map(t => (
            <div key={t.id} className="w-32 shrink-0 rounded-2xl bg-white p-2 text-xs shadow-soft"><Thumb e={t.emoji} className="mb-2 h-20 w-full" /><b>{t.name}</b><div className="text-mina/60">{fmt(t.priceRsd)}</div></div>))}</div></div>}

        {s === 'treatments' && <div className="space-y-4"><h1 className="text-center font-semibold">Tretmani</h1>
          <Field icon="🔍" placeholder="Pretraži tretmane..." value={q} onChange={e => setQ(e.target.value)} />
          <div className="flex gap-2 overflow-x-auto">{CATEGORIES.map(c => <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-sm ${cat === c ? 'bg-mina text-white' : 'text-mina'}`}>{c}</button>)}</div>
          <div className="space-y-3">{shown.map(t => <Row key={t.id} t={t} onClick={() => { setBk({ ...bk, t }); setS('b2'); }} />)}
            {!shown.length && <p className="py-8 text-center text-mina/60">Nema rezultata. Probajte drugu kategoriju.</p>}</div></div>}

        {s === 'b1' && <><Head title="Zakazivanje tretmana" back="home" /><Stepper /><h2 className="mb-3 font-semibold">Izaberi tretman</h2>
          <div className="space-y-3">{TR.slice(1, 6).map(t => <Row key={t.id} t={t} onClick={() => setBk({ ...bk, t })}
            right={<span className={`grid h-6 w-6 place-items-center rounded-full border ${bk.t.id === t.id ? 'bg-mina text-white' : 'border-mina/30'}`}>{bk.t.id === t.id && '✓'}</span>} />)}</div>
          <Btn className="mt-5 w-full" onClick={() => setS('b2')}>Dalje</Btn></>}

        {s === 'b2' && <><Head title="Zakazivanje tretmana" back="b1" /><Stepper /><h2 className="mb-3 font-semibold">Izaberi datum</h2>
          <Calendar value={bk.day} onChange={d => setBk({ ...bk, day: d })} /><h2 className="my-3 font-semibold">Izaberi vreme</h2>
          <div className="grid grid-cols-3 gap-2">{SLOTS.map(t => <button key={t} onClick={() => setBk({ ...bk, time: t })} className={`rounded-full border py-2 text-sm ${bk.time === t ? 'border-mina bg-mina text-white' : 'border-lav-2 bg-white'}`}>{t}</button>)}</div>
          <Btn className="mt-5 w-full" onClick={() => setS('b3')}>Dalje</Btn></>}

        {s === 'b3' && <><Head title="Zakazivanje tretmana" back="b2" /><Stepper /><h2 className="mb-3 font-semibold">Proveri podatke</h2>
          <div className="space-y-3 rounded-2xl bg-white p-4 text-sm shadow-soft">
            <div className="flex gap-3"><Thumb e={bk.t.emoji} /><div><b>{bk.t.name}</b><div>{fmt(bk.t.priceRsd)}</div><div className="text-mina/60">{bk.t.durationMin} min</div></div></div>
            <p>📅 {lab(bk.day)}</p><p>🕘 {bk.time}</p><p>📍 {SALON}</p></div>
          <textarea value={bk.note} onChange={e => setBk({ ...bk, note: e.target.value })} placeholder="Dodaj napomenu (opciono)..." className="mt-3 h-24 w-full rounded-2xl border border-lav-2 p-3 outline-none" />
          <div className="mt-3"><Err /></div><Btn className="mt-3 w-full" onClick={confirm}>Potvrdi zakazivanje</Btn></>}

        {s === 'my' && <div className="space-y-4"><h1 className="font-semibold">Moja zakazivanja</h1>
          <div className="grid grid-cols-2 rounded-full bg-lav-2 p-1 text-sm">{['Aktivna', 'Istorija'].map(t => <button key={t} onClick={() => setTab(t)} className={`rounded-full py-2 font-semibold ${tab === t ? 'bg-mina text-white' : 'text-mina'}`}>{t}</button>)}</div>
          {(tab === 'Aktivna' ? list : hist).map(b => (
            <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft"><Thumb e={b.emoji} />
              <div className="flex-1 text-sm"><div className="flex justify-between"><b>{b.treatment}</b><Badge s={b.status} /></div><div className="text-mina/70">{fmt(b.priceRsd)}</div><div className="text-xs text-mina/50">{b.when}</div></div>
              {tab === 'Aktivna' && <button aria-label="Otkaži" className="text-xs text-red-600" onClick={() => cancel(b.id)}>Otkaži</button>}</div>))}
          <Ghost className="w-full" onClick={() => setS('b1')}>+ Zakazivanje tretmana</Ghost></div>}

        {s === 'profile' && <div className="space-y-4 text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lav-2 text-3xl">👩</div>
          <div><h1 className="text-xl font-semibold">{user.fullName}</h1><p className="text-sm text-mina/70">{user.email}</p></div>
          <div className="rounded-2xl bg-white text-left shadow-soft">{[['Moji podaci'], ['Moja zakazivanja', 'my'], ['Moj novčanik', null, '0 RSD'], ['Obaveštenja'], ['Postavke'], ['Pomoć']].map(([l, to, x]) => (
            <button key={l} onClick={() => to && setS(to)} className="flex w-full justify-between border-b border-lav px-4 py-3 last:border-0"><span>{l}</span><span className="text-mina/60">{x ?? '›'}</span></button>))}</div>
          <Ghost className="w-full" onClick={() => { setTok(null); setUser(USER); setS('login'); }}>Odjavi se</Ghost></div>}
      </main>

      {withNav && <nav className="fixed bottom-0 z-10 grid w-full max-w-md grid-cols-4 border-t border-lav-2 bg-white py-2 text-[11px]">
        {NAV.map(([k, l, e]) => { const on = k === s || (k === 'b1' && ['b2', 'b3', 'my'].includes(s));
          return <button key={k} onClick={() => setS(k === 'b1' && s === 'my' ? 'my' : k)} className={`flex flex-col items-center gap-0.5 ${on ? 'font-bold text-mina' : 'text-mina/50'}`}><span className="text-lg">{e}</span>{l}</button>; })}
      </nav>}
    </div>);
}
