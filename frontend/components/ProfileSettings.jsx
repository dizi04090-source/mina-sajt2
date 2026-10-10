'use client';
import { useState } from 'react';
import { Camera, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { api } from '../lib/api';

export function ProfileAvatar({ user, avatar = user?.avatar }) {
  return <span className="profile-avatar">{avatar ? <img src={avatar} alt="Profilna slika" /> : <UserRound size={28} />}</span>;
}

async function photoPreview(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error('Izaberite JPG, PNG ili WebP sliku do 8 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d');
    context.fillStyle = '#E0D4FC'; context.fillRect(0, 0, 256, 256);
    const size = Math.min(bitmap.width, bitmap.height);
    context.drawImage(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2, size, size, 0, 0, 256, 256);
    return canvas.toDataURL('image/jpeg', .85);
  } finally { bitmap.close(); }
}

export default function ProfileSettings({ session, onSession, onLogout, onBusyChange }) {
  const [profile, setProfile] = useState({ fullName: session.user.fullName, username: session.user.username, avatar: session.user.avatar || '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const perform = async action => {
    if (busy) return;
    setBusy(true); onBusyChange(true); setError(''); setNotice('');
    try { await action(); } catch (e) { setError(e.message); }
    finally { setBusy(false); onBusyChange(false); }
  };
  const upload = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setPhotoBusy(true); setError(''); setNotice('');
    try { const avatar = await photoPreview(file); setProfile(p => ({ ...p, avatar })); }
    catch (e) { setError(e.message || 'Slika nije mogla da se učita.'); }
    finally { setPhotoBusy(false); }
  };
  return <div className="profile-settings">
    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p className="profile-success" role="status">{notice}</p>}
    <form className="site-form" onSubmit={event => { event.preventDefault(); perform(async () => { const user = await api('/api/users/profile', { method: 'PATCH', token: session.token, body: profile }); onSession({ ...session, user }); setNotice('Profil je sačuvan.'); }); }}>
      <div className="profile-photo-row"><ProfileAvatar user={session.user} avatar={profile.avatar} /><div><label className="photo-upload"><Camera size={16} /> {photoBusy ? 'Priprema slike...' : 'Promeni sliku'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={busy || photoBusy} /></label>{profile.avatar && <button type="button" className="text-link" disabled={busy || photoBusy} onClick={() => setProfile(p => ({ ...p, avatar: '' }))}>Ukloni sliku</button>}<small>Slika se čuva kada sačuvaš profil.</small></div></div>
      <label>Ime i prezime<input required maxLength={160} autoComplete="name" value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} /></label>
      <label>Korisničko ime<input required maxLength={150} autoComplete="username" value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value }))} /></label>
      <small>Za novo korisničko ime koristi 3–30 slova, brojeva, tačaka ili crtica. Prijava i dalje koristi email.</small>
      <label>Email adresa<input readOnly type="email" value={session.user.email} /></label>
      <button className="primary" disabled={busy || photoBusy}>{busy ? 'Čuvanje...' : 'Sačuvaj profil'}</button>
    </form>
    <section className="profile-security"><h3><ShieldCheck size={20} /> Promeni lozinku</h3><p>Potvrdi trenutnu lozinku. Druge prijavljene sesije će biti odjavljene.</p><form className="site-form" onSubmit={event => { event.preventDefault(); perform(async () => {
      if (password.newPassword !== password.confirm) throw new Error('Nove lozinke se ne poklapaju.');
      const updated = await api('/api/users/password', { method: 'POST', token: session.token, body: { currentPassword: password.currentPassword, newPassword: password.newPassword, remember: Boolean(localStorage.getItem('minaSession')) } });
      onSession(updated); setPassword({ currentPassword: '', newPassword: '', confirm: '' }); setNotice('Lozinka je promenjena. Druge sesije su odjavljene.');
    }); }}>
      {[['currentPassword', 'Trenutna lozinka', 'current-password'], ['newPassword', 'Nova lozinka', 'new-password'], ['confirm', 'Potvrdi novu lozinku', 'new-password']].map(([key, label, complete]) => <label key={key}>{label}<input type="password" required minLength={key === 'currentPassword' ? undefined : 8} autoComplete={complete} value={password[key]} onChange={e => setPassword(p => ({ ...p, [key]: e.target.value }))} /></label>)}
      <small>Najmanje 8 znakova, uključujući slovo i broj.</small><button className="secondary" disabled={busy || photoBusy}>{busy ? 'Sačekajte...' : 'Sačuvaj novu lozinku'}</button>
    </form></section>
    <button className="profile-signout" disabled={busy || photoBusy} onClick={onLogout}><LogOut size={18} /> Odjavi se</button>
  </div>;
}
