'use client';
import { useState } from 'react';
export const Logo = ({ size = 'text-5xl', sub = true }) => (
  <div className="text-center text-mina">
    <img src="/mina-icon.png" alt="" className="mx-auto mb-2 h-12 w-12 object-contain" />
    <div className={`font-serif tracking-[.18em] ${size}`}>MINA</div>
    {sub && <div className="text-[10px] tracking-[.35em]">WELLNESS SALON</div>}
  </div>);
export const Mark = ({ className = 'h-8 w-8' }) => <img src="/mina-icon.png" alt="" className={`${className} object-contain`} />;
const treatmentImages = {
  lice: '/images/facial-treatment.png',
  masaze: '/images/massage-treatment.png',
  telo: '/images/body-treatment.png',
  depilacija: '/images/depilation-treatment.png',
  wellness: '/images/body-treatment.png',
};
export function LineIcon({ name = 'mina', className = 'h-5 w-5' }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    home: <><path d="M4 11.5 12 5l8 6.5" /><path d="M6.5 10.5V20h11v-9.5" /><path d="M10 20v-5h4v5" /></>,
    calendar: <><path d="M7 4v3M17 4v3" /><rect x="4" y="6" width="16" height="14" rx="3" /><path d="M4 10h16" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    message: <><path d="M5 6h14v10H8l-3 3z" /></>,
    bell: <><path d="M6 17h12l-1.5-2v-4a4.5 4.5 0 0 0-9 0v4z" /><path d="M10 20h4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    card: <><rect x="4" y="6" width="16" height="12" rx="2.5" /><path d="M4 10h16M8 15h3" /></>,
    phone: <><path d="M8 5 5 8c1.5 5 6 9.5 11 11l3-3-3-3-2 2c-2.4-1-4-2.6-5-5l2-2z" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V8a4 4 0 0 1 8 0v2" /></>,
    mail: <><rect x="4" y="6" width="16" height="12" rx="2" /><path d="m5 8 7 5 7-5" /></>,
    wallet: <><path d="M5 7h13a2 2 0 0 1 2 2v8H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11" /><path d="M16 13h4" /></>,
    spa: <><path d="M12 19c-4-1.6-6.5-4.4-7.5-8.5 3.7.2 6.2 2 7.5 5.5 1.3-3.5 3.8-5.3 7.5-5.5-1 4.1-3.5 6.9-7.5 8.5z" /><path d="M12 16V6" /></>,
  };
  return <svg {...common}>{paths[name] || paths.spa}</svg>;
}
export const Btn = ({ className = '', ...p }) => (
  <button className={`rounded-2xl bg-mina px-5 py-3 font-semibold text-white shadow-soft transition hover:bg-mina-2 disabled:opacity-40 ${className}`} {...p} />);
export const Ghost = ({ className = '', ...p }) => (
  <button className={`rounded-2xl border border-mina/30 bg-white px-5 py-3 font-semibold text-mina hover:bg-lav ${className}`} {...p} />);
export const Field = ({ icon, ...p }) => (
  <label className="flex items-center gap-3 rounded-xl border border-lav-2 bg-white px-4 py-3 shadow-soft">
    {icon && <LineIcon name={icon} className="h-4 w-4 text-mina/60" />}<input className="w-full bg-transparent outline-none placeholder:text-mina/40" {...p} /></label>);
export const Badge = ({ s }) => (
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s === 'Na čekanju' ? 'bg-amber-100 text-amber-700' : s === 'Otkazano' ? 'bg-red-100 text-red-700' : s === 'Završeno' ? 'bg-lav-2 text-mina' : 'bg-emerald-100 text-emerald-700'}`}>{s}</span>);
export const Thumb = ({ tone = 'lice', className = 'h-14 w-14' }) => (
  <div className={`${className} relative grid shrink-0 place-items-center overflow-hidden rounded-xl treatment-${tone}`}>
    <img src={treatmentImages[tone] || treatmentImages.lice} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-300 hover:scale-105" />
    <div className="absolute inset-0 bg-gradient-to-t from-mina/30 via-transparent to-white/10" />
  </div>);

// Kalendar tekućeg meseca (prošli dani su onemogućeni)
const MESEC = d => d.toLocaleDateString('sr-Latn', { month: 'long' });
export const lab = day => { const n = new Date(); return `${day}. ${MESEC(n)} ${n.getFullYear()}.`; };
export const iso = day => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; };
export function Calendar({ value, onChange, compact }) {
  const n = new Date(), lead = (new Date(n.getFullYear(), n.getMonth(), 1).getDay() + 6) % 7, days = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <div className="rounded-2xl bg-white p-3 shadow-soft">
      <div className="mb-2 text-center text-sm font-semibold capitalize">{MESEC(n)} {n.getFullYear()}</div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-mina/60">
        {['Po','Ut','Sr','Če','Pe','Su','Ne'].map(d => <span key={d}>{d}</span>)}
        {cells.map((d, i) => d ? (
          <button key={i} disabled={d < n.getDate()} onClick={() => onChange(d)} className={`mx-auto grid ${compact ? 'h-7 w-7' : 'h-9 w-9'} place-items-center rounded-full text-sm text-[#2d2236] disabled:opacity-30 ${value === d ? '!bg-mina !text-white' : 'hover:bg-lav'}`}>{d}</button>) : <span key={i} />)}
      </div>
    </div>);
}
export function Faq({ items }) {
  const [open, setOpen] = useState(null);
  return items.map(([q, a], i) => (
    <div key={q} className="mb-2 rounded-xl border border-lav-2 bg-white text-sm">
      <button className="flex w-full justify-between px-3 py-2.5 text-left" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>{q}<span>{open === i ? '−' : '+'}</span></button>
      {open === i && <p className="px-3 pb-3 text-mina/70">{a}</p>}
    </div>));
}
