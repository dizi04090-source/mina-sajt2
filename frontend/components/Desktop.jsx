'use client';
import { useState } from 'react';
import { TREATMENTS, BOOKINGS, SLOTS, FAQ, fmt } from '../lib/mock';
import { Logo, Btn, Badge, Thumb, Calendar, Faq, lab, LineIcon } from './ui';

const MENU = [['Početna', 'home'], ['Zakazivanje tretmana', 'calendar'], ['Tretmani', 'spa'], ['Moj nalog', 'user'], ['Poruke', 'message', 2], ['Obaveštenja', 'bell'], ['Postavke', 'settings']];
const CARDS = [['lice', 'Facijalni tretmani', 'Čista i blistava koža'], ['masaze', 'Masaže', 'Duboka relaksacija'], ['depilacija', 'Depilacija', 'Glatka koža'], ['telo', 'Tretmani tela', 'Oblikuj i neguj'], ['wellness', 'Wellness', 'Harmonija uma i tela']];
const QUICK = [['plus', 'Novi tretman', 'Rezerviši sada'], ['calendar', 'Moj kalendar', 'Pogledaj zakazane termine'], ['card', 'Moje uplate', 'Pregledaj istoriju plaćanja'], ['phone', 'Kontakt', 'Piši nam']];

export default function Desktop() {
  const [active, setActive] = useState('Početna');
  const [day, setDay] = useState(new Date().getDate()), [time, setTime] = useState('09:00'), [pick, setPick] = useState(TREATMENTS[1]);
  const [done, setDone] = useState(false);
  return (
    <div className="grid min-h-screen grid-cols-[250px_1fr_300px] bg-lav-2 p-3 gap-0">
      <aside className="flex flex-col rounded-l-3xl bg-gradient-to-b from-lav to-lav-2 p-5">
        <div className="mb-8"><Logo size="text-5xl" /></div>
        <nav className="space-y-1">{MENU.map(([l, e, n]) => (
          <button key={l} onClick={() => setActive(l)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm ${active === l ? 'bg-lav-2 font-bold text-mina' : 'text-mina/80 hover:bg-white/60'}`}>
            <LineIcon name={e} className="h-4 w-4" /><span className="flex-1">{l}</span>{n && <span className="grid h-5 w-5 place-items-center rounded-full bg-mina text-xs text-white">{n}</span>}</button>))}</nav>
        <blockquote className="mt-auto pt-16 font-serif text-lg italic text-mina">„Briga o sebi nije luksuz, već potreba."<footer className="mt-2 font-sans text-xs not-italic text-mina/60">— Mina Wellness Salon</footer></blockquote>
      </aside>

      <main className="bg-paper p-6">
        <header className="mb-5 flex items-center gap-4">
          <label className="flex flex-1 items-center gap-3 rounded-full bg-white px-5 py-3 shadow-soft"><LineIcon name="search" className="h-4 w-4 text-mina/60" /><input className="w-full outline-none" placeholder="Pretraži tretmane, usluge..." /></label>
          <button aria-label="Obaveštenja" className="relative text-mina"><LineIcon name="bell" /><span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-mina" /></button>
          <div className="flex items-center gap-2"><div className="grid h-10 w-10 place-items-center rounded-full bg-lav-2"><LineIcon name="user" className="h-5 w-5 text-mina" /></div><div className="text-xs"><b className="block text-sm">Ana Petrović</b>Korisnik</div></div>
        </header>

        <section className="soft-hero rounded-3xl p-10">
          <p className="text-xs tracking-[.3em] text-mina">MINA WELLNESS SALON</p>
          <h1 className="my-3 font-serif text-6xl leading-[1.05] text-mina">Tvoje zdravlje.<br />Tvoja lepota.</h1>
          <p className="mb-6 max-w-sm text-mina/80">Profesionalni tretmani, prirodna nega i potpuna relaksacija.</p>
          <Btn className="inline-flex items-center gap-2 rounded-full"><LineIcon name="calendar" className="h-4 w-4" />Zakazivanje tretmana <LineIcon name="arrow" className="h-4 w-4" /></Btn>
        </section>

        <div className="my-5 grid grid-cols-5 gap-3">{CARDS.map(([e, t, d]) => (
          <button key={t} className="rounded-2xl bg-lav p-4 text-center transition hover:bg-lav-2"><Thumb tone={e} className="mx-auto mb-2 h-12 w-12" /><b className="text-sm">{t}</b><div className="text-xs text-mina/60">{d}</div></button>))}</div>

        <div className="mb-3 flex justify-between"><h2 className="font-serif text-3xl text-mina">Popularni tretmani</h2><a className="text-sm text-mina">Pogledaj sve →</a></div>
        <div className="grid grid-cols-5 gap-3">{TREATMENTS.filter(t => t.popular).concat(TREATMENTS[0]).slice(0, 5).map((t, i) => (
          <div key={t.id} className="rounded-2xl bg-white p-2 text-sm shadow-soft"><div className="relative"><Thumb tone={t.tone} className="h-24 w-full" />
            {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-mina px-2 py-0.5 text-[10px] text-white">Najpopularnije</span>}</div>
            <b className="mt-2 block">{t.name}</b><div className="text-xs text-mina/60">{t.durationMin} min</div>
            <div className="mt-1 flex items-center justify-between"><span className="font-semibold">{fmt(t.priceRsd)}</span><button aria-label={`Izaberi ${t.name}`} onClick={() => setPick(t)} className="grid h-7 w-7 place-items-center rounded-full bg-lav-2 text-mina"><LineIcon name="arrow" className="h-4 w-4" /></button></div></div>))}</div>

        <div className="mt-5 grid grid-cols-[1.6fr_1fr] gap-4">
          <section className="rounded-2xl bg-white p-4 shadow-soft"><h2 className="mb-3 font-serif text-2xl text-mina">Zakazivanje tretmana</h2>
            <div className="grid grid-cols-[1.3fr_.6fr_1fr] gap-3"><Calendar value={day} onChange={setDay} compact />
              <div className="space-y-1.5">{SLOTS.map(t => <button key={t} onClick={() => setTime(t)} className={`w-full rounded-lg border py-1.5 text-xs ${time === t ? 'border-mina bg-mina text-white' : 'border-lav-2'}`}>{t}</button>)}</div>
              <div className="rounded-xl border border-lav-2 p-3 text-sm"><div className="flex gap-2"><Thumb tone={pick.tone} className="h-14 w-14" /><div><b>{pick.name}</b><div className="text-xs text-mina/60">{pick.durationMin} min</div><div className="font-semibold">{fmt(pick.priceRsd)}</div></div></div>
                <Btn className="mt-3 w-full !py-2 text-sm" onClick={() => setDone(true)}>Rezerviši termin</Btn>
                {done && <p role="status" className="mt-2 text-xs text-emerald-700">Termin {lab(day)} u {time} je poslat na potvrdu.</p>}</div></div></section>
          <section className="rounded-2xl bg-white p-4 shadow-soft"><div className="mb-2 flex justify-between"><h2 className="font-serif text-2xl text-mina">Naredni tretmani</h2><a className="text-xs text-mina">Pogledaj sve →</a></div>
            {BOOKINGS.map(b => <div key={b.id} className="flex items-center gap-3 border-b border-lav py-2 last:border-0"><Thumb tone={b.tone} className="h-11 w-11" /><div className="flex-1 text-sm"><b>{b.treatment}</b><div className="text-xs text-mina/60">{b.when}</div></div><Badge s={b.status} /></div>)}</section>
        </div>
      </main>

      <aside className="space-y-4 rounded-r-3xl bg-paper p-5 border-l border-lav-2">
        <div className="rounded-2xl bg-gradient-to-br from-lav-2 to-[#cbb8e4] p-4"><p className="text-xs text-mina">Posebna ponuda</p><h3 className="font-serif text-3xl text-mina">Relax &amp; Glow</h3>
          <p className="my-2 text-xs text-mina/80">Kompletan wellness paket za vašu savršenu kožu i telo.</p><Btn className="rounded-full !px-4 !py-2 text-xs">Saznaj više →</Btn></div>
        <h3 className="font-serif text-2xl text-mina">Brzi pristup</h3>
        {QUICK.map(([e, t, d]) => <button key={t} className="flex w-full items-center gap-3 rounded-xl border border-lav-2 bg-white p-3 text-left text-sm"><span className="grid h-9 w-9 place-items-center rounded-lg bg-lav text-mina"><LineIcon name={e} className="h-4 w-4" /></span><span className="flex-1"><b className="block">{t}</b><span className="text-xs text-mina/60">{d}</span></span><LineIcon name="arrow" className="h-4 w-4 text-mina/60" /></button>)}
        <h3 className="font-serif text-2xl text-mina">Najčešća pitanja</h3><Faq items={FAQ} />
        <a className="block text-xs text-mina">Pogledaj sva pitanja →</a>
        <div className="rounded-2xl bg-lav-2 p-4 text-center text-xs text-mina"><Logo size="text-3xl" />Tvoje dobro počinje ovde.</div>
      </aside>
    </div>);
}
