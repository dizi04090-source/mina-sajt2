'use client';
import { ArrowRight, Check, Clock3, Sparkles } from 'lucide-react';
import { treatmentDetails } from '../lib/treatment-details';

export function TreatmentPrice({ value }) {
  return <span className="treatment-price"><strong>{Number(value).toLocaleString('sr-RS')}</strong><small>RSD</small></span>;
}

export default function TreatmentDetails({ treatment, image, onBook, onContact, ready }) {
  const detail = treatmentDetails(treatment);
  return <div className="treatment-detail">
    <img className="detail-photo" src={image} alt={treatment.name} />
    <div className="detail-meta"><span><Sparkles size={16} />{treatment.category}</span><span><Clock3 size={16} />{treatment.durationMin} min</span></div>
    <p className="detail-intro">{treatment.description || detail.intro}</p>
    <div className="detail-sections">
      <section><h3>Kako izgleda tretman</h3><ul>{detail.includes.map(item => <li key={item}><Check size={16} /><span>{item}</span></li>)}</ul></section>
      <section><h3>Šta može da ti pruži</h3><ul>{detail.benefits.map(item => <li key={item}><Check size={16} /><span>{item}</span></li>)}</ul></section>
    </div>
    <section className="detail-preparation"><h3>Pre dolaska</h3><p>{detail.preparation}</p>{detail.source && <a href={detail.source[1]} target="_blank" rel="noreferrer">{detail.source[0]} <ArrowRight size={13} /></a>}</section>
    <div className="detail-booking"><div><small>Cena tretmana</small><TreatmentPrice value={treatment.priceRsd} /></div><button className="primary" disabled={!ready} onClick={onBook}>Zakaži ovaj tretman <ArrowRight size={17} /></button></div>
    <button className="detail-question text-link" disabled={!ready} onClick={onContact}>Imaš pitanje? Piši Mini <ArrowRight size={15} /></button>
  </div>;
}
