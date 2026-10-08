'use client';
import { useState } from 'react';
import { ArrowRight, Bell, CalendarDays, ChevronDown, CreditCard, Home, LockKeyhole, Mail, MessageSquare, Phone, Plus, Search, Settings, UserRound, Wallet } from 'lucide-react';
export const Logo = ({ size = 'text-5xl', sub = true }) => (
  <div className="text-center text-mina">
    <img src="/mina-icon.png" alt="" className="mx-auto mb-2 h-12 w-12 object-contain" />
    <div className={`font-serif tracking-[.18em] ${size}`}>MINA</div>
    {sub && <div className="text-[10px] tracking-[.35em]">WELLNESS SALON</div>}
  </div>);
export const Mark = ({ className = 'h-8 w-8' }) => <img src="/mina-icon.png" alt="" className={`${className} object-contain`} />;
const treatmentImages = {
  lice: '/images/facial-treatment-v2.webp',
  masaze: '/images/massage-treatment-v2.webp',
  telo: '/images/body-treatment.webp',
  depilacija: '/images/depilation-treatment.webp',
  wellness: '/images/body-treatment.webp',
};
export function LineIcon({ name = 'mina', className = 'h-5 w-5' }) {
  const icons = { home: Home, calendar: CalendarDays, user: UserRound, message: MessageSquare, bell: Bell, settings: Settings, search: Search, plus: Plus, card: CreditCard, phone: Phone, arrow: ArrowRight, lock: LockKeyhole, mail: Mail, wallet: Wallet };
  const Icon = icons[name];
  return Icon ? <Icon className={className} strokeWidth={1.7} aria-hidden="true" /> : <Mark className={className} />;
}
export const Btn = ({ className = '', ...p }) => (
  <button data-magnetic className={`rounded-full bg-mina px-5 py-3 font-semibold text-white shadow-soft transition hover:bg-mina-2 disabled:opacity-40 ${className}`} {...p} />);
export const Ghost = ({ className = '', ...p }) => (
  <button className={`rounded-2xl border border-mina/30 bg-white px-5 py-3 font-semibold text-mina hover:bg-lav ${className}`} {...p} />);
export const Field = ({ icon, ...p }) => (
  <label className="flex items-center gap-3 rounded-xl border border-lav-2 bg-white px-4 py-3 shadow-soft">
    {icon && <LineIcon name={icon} className="h-4 w-4 text-mina/60" />}<input className="w-full bg-transparent outline-none placeholder:text-mina/40" {...p} /></label>);
export const Badge = ({ s }) => (
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s === 'Na čekanju' ? 'bg-amber-100 text-amber-700' : s === 'Otkazano' ? 'bg-red-100 text-red-700' : s === 'Završeno' ? 'bg-lav-2 text-mina' : 'bg-emerald-100 text-emerald-700'}`}>{s}</span>);
export const Thumb = ({ tone = 'lice', className = 'h-14 w-14' }) => (
  <div className={`${className} relative grid shrink-0 place-items-center overflow-hidden rounded-xl treatment-${tone}`}>
    <img src={treatmentImages[tone] || treatmentImages.lice} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition duration-300 hover:scale-105" />
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
      <button className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>{q}<ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} /></button>
      {open === i && <p className="px-3 pb-3 text-mina/70">{a}</p>}
    </div>));
}
