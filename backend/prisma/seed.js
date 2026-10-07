const { PrismaClient } = require('@prisma/client'); const bcrypt = require('bcryptjs');
const p = new PrismaClient();
(async () => {
  const cats = {};
  for (const [name, slug] of [['Lice','lice'],['Telo','telo'],['Masaže','masaze'],['Depilacija','depilacija'],['Wellness','wellness']])
    cats[slug] = await p.category.upsert({ where: { slug }, update: {}, create: { name, slug } });
  let ts = await p.treatment.findMany({ orderBy: { name: 'asc' } });
  if (!ts.length) {
    const T = [
      ['Čišćenje lica',1500,60,'lice'],['Facijalni tretman',2500,60,'lice',1],['Anti-age tretman',3000,75,'lice'],
      ['Masaža celog tela',2000,60,'masaze',1],['Limfna drenaža',1800,60,'telo'],['Tretman tela',2800,60,'telo',1],
      ['Depilacija',1500,30,'depilacija',1],['Wellness paket',4500,90,'wellness',1]];
    ts = [];
    for (const [name, priceRsd, durationMin, c, popular] of T)
      ts.push(await p.treatment.create({ data: { name, priceRsd, durationMin, popular: !!popular, categoryId: cats[c].id } }));
  }
  const u = await p.user.upsert({ where: { email: 'ana.petrovic@email.com' }, update: {},
    create: { fullName: 'Ana Petrović', email: 'ana.petrovic@email.com', passwordHash: await bcrypt.hash('Lozinka123', 10) } });
  if (!(await p.booking.count())) {
    for (const [i, days, h, status] of [[1,3,9,'CONFIRMED'],[3,7,11,'CONFIRMED'],[6,14,16,'PENDING']]) {
      const d = new Date(); d.setDate(d.getDate() + days); d.setHours(h, 0, 0, 0);
      await p.booking.create({ data: { userId: u.id, treatmentId: ts[i].id, startsAt: d, status } });
    }
  }
  if (!(await p.notification.count({ where: { userId: u.id } }))) await p.notification.create({ data: { userId: u.id, title: 'Dobrodošli!', body: 'Vaš nalog je spreman.' } });
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    await p.user.upsert({
      where: { email: process.env.ADMIN_EMAIL.toLowerCase() },
      update: { role: 'ADMIN' },
      create: {
        fullName: process.env.ADMIN_NAME || 'MINA Admin',
        email: process.env.ADMIN_EMAIL.toLowerCase(),
        role: 'ADMIN',
        passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
      },
    });
    console.log('Admin nalog je spreman.');
  } else {
    console.log('ADMIN_EMAIL i ADMIN_PASSWORD nisu postavljeni; admin nalog nije kreiran.');
  }
})().finally(() => p.$disconnect());
