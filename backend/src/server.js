require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PrismaClient, BookingStatus } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const isProd = process.env.NODE_ENV === 'production';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET mora biti postavljen i imati najmanje 32 karaktera');
}

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: '25kb' }));
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin) || (!isProd && !allowedOrigins.length)) return cb(null, true);
    cb(new Error('CORS origin nije dozvoljen'));
  },
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const cleanEmail = email => String(email || '').trim().toLowerCase();
const publicUser = ({ passwordHash, ...user }) => user;
const strongPassword = password => typeof password === 'string' && password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
const signToken = (user, remember) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: remember ? '30d' : '1d' });

const auth = wrap(async (req, res, next) => {
  const raw = req.headers.authorization || '';
  const [scheme, value] = raw.split(' ');
  if (scheme !== 'Bearer' || !value) return res.status(401).json({ error: 'Niste prijavljeni' });
  try {
    const payload = jwt.verify(value, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, role: true } });
    if (!user) return res.status(401).json({ error: 'Niste prijavljeni' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Niste prijavljeni' });
  }
});
const adminOnly = (req, res, next) => (req.user?.role === 'ADMIN' ? next() : res.status(403).json({ error: 'Nemate pristup admin panelu' }));

app.get('/health', (_, res) => res.json({ ok: true }));

// Auth & korisnici
app.post('/api/auth/register', authLimiter, wrap(async (req, res) => {
  const fullName = String(req.body.fullName || '').trim();
  const email = cleanEmail(req.body.email);
  const { password } = req.body;
  if (!fullName || !email || !strongPassword(password)) {
    return res.status(400).json({ error: 'Unesite ime, validan email i lozinku sa najmanje 8 znakova, slovom i brojem' });
  }
  if (await prisma.user.findUnique({ where: { email } })) return res.status(409).json({ error: 'Email je već registrovan' });
  const user = await prisma.user.create({ data: { fullName, email, passwordHash: await bcrypt.hash(password, 12) } });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

app.post('/api/auth/login', authLimiter, wrap(async (req, res) => {
  const email = cleanEmail(req.body.email);
  const { password, remember } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(String(password || ''), user.passwordHash))) {
    return res.status(401).json({ error: 'Pogrešan email ili lozinka' });
  }
  res.json({ token: signToken(user, remember), user: publicUser(user) });
}));

app.get('/api/users/profile', auth, wrap(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      bookings: { include: { treatment: { include: { category: true } } }, orderBy: { startsAt: 'desc' } },
      notifications: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
  res.json(publicUser(user));
}));

// Tretmani
app.get('/api/treatments', wrap(async (req, res) => {
  const { q, category, popular } = req.query;
  res.json(await prisma.treatment.findMany({
    where: {
      ...(q && { name: { contains: String(q), mode: 'insensitive' } }),
      ...(category && category !== 'svi' && { category: { slug: String(category) } }),
      ...(popular && { popular: true }),
    },
    include: { category: true },
    orderBy: { name: 'asc' },
  }));
}));

app.get('/api/treatments/:id', wrap(async (req, res) => {
  const treatment = await prisma.treatment.findUnique({ where: { id: req.params.id }, include: { category: true } });
  treatment ? res.json(treatment) : res.status(404).json({ error: 'Tretman nije pronađen' });
}));

// Zakazivanja
app.post('/api/bookings', auth, wrap(async (req, res) => {
  const { treatmentId, date, time, location, note } = req.body;
  const startsAt = new Date(`${date}T${time}:00`);
  if (!treatmentId || isNaN(startsAt) || startsAt < new Date()) return res.status(400).json({ error: 'Izaberite validan budući termin' });
  if (await prisma.booking.findFirst({ where: { startsAt, status: { in: ['PENDING', 'CONFIRMED'] } } })) {
    return res.status(409).json({ error: 'Termin je zauzet, izaberite drugo vreme' });
  }
  const booking = await prisma.booking.create({
    data: { userId: req.user.id, treatmentId, startsAt, note: note ? String(note).slice(0, 500) : null, ...(location && { location: String(location).slice(0, 160) }) },
    include: { treatment: { include: { category: true } } },
  });
  await prisma.notification.create({ data: { userId: req.user.id, title: 'Zakazivanje primljeno', body: `${booking.treatment.name} čeka potvrdu.` } });
  res.status(201).json(booking);
}));

app.get('/api/bookings/my', auth, wrap(async (req, res) => {
  const all = await prisma.booking.findMany({
    where: { userId: req.user.id },
    include: { treatment: { include: { category: true } } },
    orderBy: { startsAt: 'asc' },
  });
  const active = all.filter(booking => ['PENDING', 'CONFIRMED'].includes(booking.status) && booking.startsAt >= new Date());
  res.json({ active, history: all.filter(booking => !active.includes(booking)) });
}));

app.delete('/api/bookings/:id', auth, wrap(async (req, res) => {
  const booking = await prisma.booking.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!booking) return res.status(404).json({ error: 'Zakazivanje nije pronađeno' });
  res.json(await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } }));
}));

// Admin
app.get('/api/admin/overview', auth, adminOnly, wrap(async (_, res) => {
  const [users, bookings, pending, treatments, latest] = await Promise.all([
    prisma.user.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.treatment.count(),
    prisma.booking.findMany({
      take: 12,
      orderBy: { startsAt: 'desc' },
      include: { user: { select: { fullName: true, email: true } }, treatment: { include: { category: true } } },
    }),
  ]);
  res.json({ counts: { users, bookings, pending, treatments }, bookings: latest });
}));

app.get('/api/admin/users', auth, adminOnly, wrap(async (_, res) => {
  res.json(await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, fullName: true, email: true, role: true, createdAt: true } }));
}));

app.get('/api/admin/bookings', auth, adminOnly, wrap(async (req, res) => {
  res.json(await prisma.booking.findMany({
    where: req.query.status ? { status: String(req.query.status) } : {},
    include: { user: { select: { fullName: true, email: true } }, treatment: { include: { category: true } } },
    orderBy: { startsAt: 'desc' },
  }));
}));

app.patch('/api/admin/bookings/:id', auth, adminOnly, wrap(async (req, res) => {
  const { status } = req.body;
  if (!Object.values(BookingStatus).includes(status)) return res.status(400).json({ error: 'Status nije validan' });
  res.json(await prisma.booking.update({ where: { id: req.params.id }, data: { status } }));
}));

app.post('/api/admin/treatments', auth, adminOnly, wrap(async (req, res) => {
  const { name, priceRsd, durationMin, categoryId, description, popular } = req.body;
  if (!name || !categoryId || !Number.isInteger(priceRsd) || !Number.isInteger(durationMin)) return res.status(400).json({ error: 'Nedostaju podaci za tretman' });
  res.status(201).json(await prisma.treatment.create({ data: { name: String(name).trim(), priceRsd, durationMin, categoryId, description, popular: !!popular } }));
}));

app.patch('/api/admin/treatments/:id', auth, adminOnly, wrap(async (req, res) => {
  const allowed = ['name', 'description', 'priceRsd', 'durationMin', 'imageUrl', 'popular', 'categoryId'];
  const data = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  res.json(await prisma.treatment.update({ where: { id: req.params.id }, data }));
}));

app.delete('/api/admin/treatments/:id', auth, adminOnly, wrap(async (req, res) => {
  await prisma.treatment.delete({ where: { id: req.params.id } });
  res.status(204).send();
}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.message === 'CORS origin nije dozvoljen' ? 403 : 500).json({ error: 'Greška na serveru' });
});

app.listen(process.env.PORT || 4000, () => console.log('MINA API radi na portu', process.env.PORT || 4000));
