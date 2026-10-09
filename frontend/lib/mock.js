export const SALON = 'Mina Wellness Salon, Braće Radić 57, Subotica';
export const USER = { fullName: 'Ana Petrović', email: 'ana.petrovic@email.com', walletRsd: 0 };
export const CATEGORIES = ['Svi', 'Lice', 'Telo', 'Masaže', 'Depilacija', 'Wellness'];
export const TREATMENTS = [
  { id: 't1', name: 'Čišćenje lica', priceRsd: 1500, durationMin: 60, category: 'Lice', tone: 'lice' },
  { id: 't2', name: 'Facijalni tretman', priceRsd: 2500, durationMin: 60, category: 'Lice', tone: 'lice', popular: true },
  { id: 't3', name: 'Anti-age tretman', priceRsd: 3000, durationMin: 75, category: 'Lice', tone: 'lice' },
  { id: 't4', name: 'Masaža celog tela', priceRsd: 2000, durationMin: 60, category: 'Masaže', tone: 'masaze', popular: true },
  { id: 't5', name: 'Limfna drenaža', priceRsd: 1800, durationMin: 60, category: 'Telo', tone: 'telo' },
  { id: 't6', name: 'Tretman tela', priceRsd: 2800, durationMin: 60, category: 'Telo', tone: 'telo', popular: true },
  { id: 't7', name: 'Depilacija', priceRsd: 1500, durationMin: 30, category: 'Depilacija', tone: 'depilacija', popular: true },
  { id: 't8', name: 'Wellness paket', priceRsd: 4500, durationMin: 90, category: 'Wellness', tone: 'wellness', popular: true },
];
export const BOOKINGS = [
  { id: 'b1', treatment: 'Facijalni tretman', priceRsd: 2500, when: '15. april 2025. • 09:00', status: 'Potvrđeno', tone: 'lice' },
  { id: 'b2', treatment: 'Masaža', priceRsd: 2000, when: '22. april 2025. • 11:30', status: 'Potvrđeno', tone: 'masaze' },
  { id: 'b3', treatment: 'Depilacija', priceRsd: 1500, when: '30. april 2025. • 16:00', status: 'Na čekanju', tone: 'depilacija' },
];
export const HISTORY = [{ id: 'h1', treatment: 'Čišćenje lica', priceRsd: 1500, when: '2. mart 2025. • 10:30', status: 'Završeno', tone: 'lice' }];
export const SLOTS = ['09:00', '10:30', '12:00', '14:00', '16:30', '18:00'];
export const FAQ = [
  ['Kako otkazati termin?', 'U odeljku „Moja zakazivanja" izaberite termin i dodirnite Otkaži, najkasnije 24h unapred.'],
  ['Koliko traje tretman?', 'Trajanje je navedeno uz svaki tretman, od 30 do 90 minuta.'],
  ['Koje su metode plaćanja?', 'Gotovina, kartice i uplata sa novčanika u aplikaciji.'],
  ['Da li je potrebna prethodna priprema?', 'Za većinu tretmana nije; dolazite bez šminke i kreme na licu.'],
];
export const fmt = n => n.toLocaleString('sr-RS') + ' RSD';
