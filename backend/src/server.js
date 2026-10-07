require('dotenv').config();
const express = require('express'), cors = require('cors'), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(), app = express();
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET nije postavljen');
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true }), express.json());
app.get('/health', (_, res) => res.json({ ok: true }));

const wrap = fn => (req, res) => fn(req, res).catch(e => { console.error(e); res.status(500).json({ error: 'Greška na serveru' }); });
const auth = (req, res, next) => {
  try { req.userId = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET).id; next(); }
  catch { res.status(401).json({ error: 'Niste prijavljeni' }); }
};
const token = (u, remember) => jwt.sign({ id: u.id }, process.env.JWT_SECRET, { expiresIn: remember ? '30d' : '1d' });
const pub = ({ passwordHash, ...u }) => u;

// ---- Auth & korisnici ----
app.post('/api/auth/register', wrap(async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password || password.length < 8) return res.status(400).json({ error: 'Lozinka mora imati najmanje 8 znakova' });
  if (await prisma.user.findUnique({ where: { email } })) return res.status(409).json({ error: 'Email je već registrovan' });
  const user = await prisma.user.create({ data: { fullName, email, passwordHash: await bcrypt.hash(password, 10) } });
  res.status(201).json({ token: token(user), user: pub(user) });
}));
app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password, remember } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Pogrešan email ili lozinka' });
  res.json({ token: token(user, remember), user: pub(user) });
}));
app.get('/api/users/profile', auth, wrap(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId },
    include: { bookings: { include: { treatment: true }, orderBy: { startsAt: 'desc' } }, notifications: { orderBy: { createdAt: 'desc' }, take: 20 } } });
  res.json(pub(user));
}));

// ---- Tretmani ----
app.get('/api/treatments', wrap(async (req, res) => {
  const { q, category, popular } = req.query;
  res.json(await prisma.treatment.findMany({
    where: { ...(q && { name: { contains: q, mode: 'insensitive' } }), ...(category && category !== 'svi' && { category: { slug: category } }), ...(popular && { popular: true }) },
    include: { category: true }, orderBy: { name: 'asc' } }));
}));
app.get('/api/treatments/:id', wrap(async (req, res) => {
  const t = await prisma.treatment.findUnique({ where: { id: req.params.id }, include: { category: true } });
  t ? res.json(t) : res.status(404).json({ error: 'Tretman nije pronađen' });
}));

// ---- Zakazivanja ----
app.post('/api/bookings', auth, wrap(async (req, res) => {
  const { treatmentId, date, time, location, note } = req.body;
  const startsAt = new Date(`${date}T${time}:00`);
  if (isNaN(startsAt) || startsAt < new Date()) return res.status(400).json({ error: 'Izaberite termin u budućnosti' });
  if (await prisma.booking.findFirst({ where: { startsAt, status: { in: ['PENDING', 'CONFIRMED'] } } }))
    return res.status(409).json({ error: 'Termin je zauzet, izaberite drugo vreme' });
  const b = await prisma.booking.create({ data: { userId: req.userId, treatmentId, startsAt, note, ...(location && { location }) }, include: { treatment: true } });
  await prisma.notification.create({ data: { userId: req.userId, title: 'Zakazivanje primljeno', body: `${b.treatment.name} čeka potvrdu.` } });
  res.status(201).json(b);
}));
app.get('/api/bookings/my', auth, wrap(async (req, res) => {
  const all = await prisma.booking.findMany({ where: { userId: req.userId }, include: { treatment: true }, orderBy: { startsAt: 'asc' } });
  const active = all.filter(b => ['PENDING', 'CONFIRMED'].includes(b.status) && b.startsAt >= new Date());
  res.json({ active, history: all.filter(b => !active.includes(b)) });
}));
app.delete('/api/bookings/:id', auth, wrap(async (req, res) => {
  const b = await prisma.booking.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!b) return res.status(404).json({ error: 'Zakazivanje nije pronađeno' });
  res.json(await prisma.booking.update({ where: { id: b.id }, data: { status: 'CANCELLED' } }));
}));

app.listen(process.env.PORT || 4000, () => console.log('MINA API radi na portu', process.env.PORT || 4000));
