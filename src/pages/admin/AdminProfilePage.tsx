import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Edit2, Save, X, Shield, Calendar,
  CheckCircle, AlertCircle, Lock, LogOut, Eye, EyeOff,
  ChevronRight, Menu, RefreshCw, BadgeCheck, Phone, Mail, Clock,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import { authService } from '../../features/auth/authService';
import axiosInstance from '../../api/axiosInstance';

const BRAND_NAVY = '#0A1628';
const BRAND_BLUE = '#1EA2E4';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function timeAgo(iso?: string) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return fmtDate(iso);
}

const ROLE_META: Record<string, { label: string; color: string }> = {
  admin:               { label: 'Admin',               color: 'bg-violet-100 text-violet-700 border-violet-200' },
  executive_admin:     { label: 'Executive Admin',     color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  manager:             { label: 'Manager',             color: 'bg-blue-100 text-blue-700 border-blue-200' },
  branch_receptionist: { label: 'Receptionist',        color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  agent:               { label: 'Agent',               color: 'bg-teal-100 text-teal-700 border-teal-200' },
  driver:              { label: 'Driver',              color: 'bg-amber-100 text-amber-700 border-amber-200' },
  customer:            { label: 'Customer',            color: 'bg-green-100 text-green-700 border-green-200' },
};

interface UserProfile {
  _id: string;
  full_name: string;
  email: string;
  phone?: string;
  roles: string[];
  status: string;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ── small shared components ────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, sub, icon: Icon, action }: {
  title: string; sub?: string; icon: React.ElementType; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
      <div className="flex items-center gap-3">
        <div className="bg-slate-50 p-2 rounded-lg">
          <Icon className="w-4 h-4 text-slate-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 leading-none">{title}</h3>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3.5 border-b border-slate-50 last:border-0">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide w-32 flex-shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 text-sm text-slate-700">{value}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, hint, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; type?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50
          focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/25 focus:border-[#1EA2E4]
          transition-all placeholder:text-slate-300"
      />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function PwField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}<span className="text-red-400 ml-0.5">*</span>
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-10 text-sm border border-slate-200 rounded-xl bg-slate-50
            focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/25 focus:border-[#1EA2E4]
            transition-all placeholder:text-slate-300"
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function Flash({ msg }: { msg: { ok: boolean; text: string } }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium
      ${msg.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
      {msg.ok
        ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
        : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {msg.text}
    </div>
  );
}

// ── main ───────────────────────────────────────────────────────────────────────
export default function AdminProfilePage() {
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const authUser  = useAppSelector(s => s.auth.user);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile]         = useState<UserProfile | null>(null);
  const [loading, setLoading]         = useState(true);
  const [fetchErr, setFetchErr]       = useState<string | null>(null);

  // edit profile
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  // change password
  const [pwOpen, setPwOpen]   = useState(false);
  const [curPw, setCurPw]     = useState('');
  const [newPw, setNewPw]     = useState('');
  const [confPw, setConfPw]   = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  // logout modal
  const [logoutOpen, setLogoutOpen]   = useState(false);
  const [loggingOut, setLoggingOut]   = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = (setter: typeof setSaveMsg, msg: { ok: boolean; text: string }) => {
    setter(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setter(null), 4500);
  };

  const fetchProfile = async () => {
    setFetchErr(null);
    try {
      const res = await axiosInstance.get<{ success: boolean; data: UserProfile }>('/users/me');
      if (res.data.success) {
        const p = res.data.data;
        setProfile(p);
        setEditName(p.full_name || '');
        setEditPhone(p.phone || '');
      }
    } catch (err: unknown) {
      setFetchErr((err as Error)?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const cancelEdit = () => {
    setEditMode(false);
    setEditName(profile?.full_name ?? '');
    setEditPhone(profile?.phone ?? '');
    setSaveMsg(null);
  };

  const saveProfile = async () => {
    if (!editName.trim()) return flash(setSaveMsg, { ok: false, text: 'Full name is required.' });
    setSaving(true);
    try {
      const res = await axiosInstance.patch<{ success: boolean; data: UserProfile }>(
        '/users/me',
        { full_name: editName.trim(), phone: editPhone.trim() || undefined }
      );
      if (res.data.success) {
        setProfile(res.data.data);
        setEditMode(false);
        flash(setSaveMsg, { ok: true, text: 'Profile updated successfully.' });
      }
    } catch (err: unknown) {
      flash(setSaveMsg, { ok: false, text: (err as Error)?.message || 'Update failed.' });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curPw || !newPw || !confPw) return flash(setPwMsg, { ok: false, text: 'All fields are required.' });
    if (newPw.length < 8) return flash(setPwMsg, { ok: false, text: 'New password must be at least 8 characters.' });
    if (newPw !== confPw) return flash(setPwMsg, { ok: false, text: 'Passwords do not match.' });
    setPwSaving(true);
    try {
      const res = await axiosInstance.patch<{ success: boolean; message: string }>(
        '/users/me/change-password',
        { current_password: curPw, new_password: newPw }
      );
      if (res.data.success) {
        setCurPw(''); setNewPw(''); setConfPw('');
        setPwOpen(false);
        flash(setPwMsg, { ok: true, text: 'Password changed successfully.' });
      }
    } catch (err: unknown) {
      flash(setPwMsg, { ok: false, text: (err as Error)?.message || 'Failed to change password.' });
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    setLoggingOut(true);
    authService.logout();
    dispatch(logout());
    navigate('/login');
  };

  const initials = getInitials(profile?.full_name || authUser?.full_name || authUser?.email || 'U');

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <div className="hidden lg:block"><Sidebar /></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#1EA2E4] animate-spin" />
            <p className="text-sm text-slate-500">Loading profile…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── sticky header ───────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm px-4 sm:px-6 py-3.5 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-[17px] font-bold text-slate-900 leading-none">My Profile</h1>
                <p className="text-xs text-slate-400 mt-0.5">Manage your account and security settings</p>
              </div>
            </div>
            <button onClick={() => setLogoutOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* ── scroll body ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-6 space-y-5 max-w-screen-xl mx-auto w-full">

            {/* fetch error */}
            {fetchErr && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 flex-1">{fetchErr}</p>
                <button onClick={fetchProfile} className="text-sm font-semibold text-red-600 underline">Retry</button>
              </div>
            )}

            {/* global save message */}
            {saveMsg && <Flash msg={saveMsg} />}

            {/* ── HERO BANNER ─────────────────────────────────────────────── */}
            <div className="relative rounded-2xl overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${BRAND_NAVY} 0%, #132540 55%, ${BRAND_BLUE} 100%)` }}>
              {/* decorative rings */}
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border-[50px] border-white/5 pointer-events-none" />
              <div className="absolute -bottom-20 right-32 w-48 h-48 rounded-full border-[35px] border-white/5 pointer-events-none" />

              <div className="relative z-10 px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                    style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '2px solid rgba(255,255,255,0.2)' }}>
                    {initials}
                  </div>
                  {profile?.email_verified && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-400 rounded-full p-0.5 shadow-lg">
                      <BadgeCheck className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* name + roles */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-white text-xl font-bold truncate">{profile?.full_name || '—'}</h2>
                  <p className="text-white/60 text-sm mt-0.5 truncate">{profile?.email}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(profile?.roles ?? []).map(r => {
                      const m = ROLE_META[r] ?? { label: r, color: 'bg-white/15 text-white/80 border-white/20' };
                      return <span key={r} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${m.color}`}>{m.label}</span>;
                    })}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      profile?.status === 'active'
                        ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30'
                        : 'bg-red-400/20 text-red-200 border-red-400/30'
                    }`}>{profile?.status}</span>
                  </div>
                </div>

                {/* quick stats */}
                <div className="hidden md:flex items-center gap-8 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-white text-lg font-bold leading-none">{fmtDate(profile?.created_at).split(',')[1]?.trim() || '—'}</p>
                    <p className="text-white/50 text-xs mt-1">Joined</p>
                  </div>
                  <div className="w-px h-8 bg-white/15" />
                  <div className="text-center">
                    <p className="text-white text-lg font-bold leading-none">{timeAgo(profile?.updated_at)}</p>
                    <p className="text-white/50 text-xs mt-1">Last updated</p>
                  </div>
                </div>

                {/* edit btn */}
                {!editMode && (
                  <button onClick={() => setEditMode(true)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white border border-white/20 hover:bg-white/10 transition-all">
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* ── TWO-COLUMN GRID ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* LEFT — Personal info (2 of 3 cols) */}
              <div className="lg:col-span-2 space-y-5">

                {/* Personal Information */}
                <Card>
                  <CardHeader
                    title="Personal Information"
                    sub="Your name, email and contact details"
                    icon={User}
                    action={!editMode ? (
                      <button onClick={() => setEditMode(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1EA2E4] border border-[#1EA2E4]/30 rounded-lg hover:bg-[#1EA2E4]/5 transition-colors">
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    ) : undefined}
                  />
                  <div className="p-6">
                    {editMode ? (
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label="Full Name" value={editName} onChange={setEditName}
                            placeholder="John Doe" required />
                          <Field label="Phone Number" value={editPhone} onChange={setEditPhone}
                            placeholder="+263 77 123 4567" />
                        </div>
                        <div className="bg-slate-50 rounded-xl px-4 py-3">
                          <p className="text-xs text-slate-500">
                            <span className="font-semibold text-slate-600">Email address</span> cannot be changed here.
                            Contact support if you need to update it.
                          </p>
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                          <button onClick={saveProfile} disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:brightness-110"
                            style={{ background: BRAND_BLUE }}>
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving…' : 'Save Changes'}
                          </button>
                          <button onClick={cancelEdit}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                            <X className="w-4 h-4" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <InfoRow label="Full Name" value={
                          <span className="font-medium">{profile?.full_name || '—'}</span>
                        } />
                        <InfoRow label="Email" value={
                          <span className="flex items-center gap-2">
                            <span>{profile?.email}</span>
                            {profile?.email_verified
                              ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <CheckCircle className="w-3 h-3" />Verified
                                </span>
                              : <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                  <AlertCircle className="w-3 h-3" />Unverified
                                </span>}
                          </span>
                        } />
                        <InfoRow label="Phone" value={
                          profile?.phone
                            ? <span className="font-medium">{profile.phone}</span>
                            : <span className="text-slate-400 italic">Not set</span>
                        } />
                        <InfoRow label="Status" value={
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            profile?.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {profile?.status === 'active'
                              ? <CheckCircle className="w-3 h-3" />
                              : <AlertCircle className="w-3 h-3" />}
                            {profile?.status}
                          </span>
                        } />
                        <InfoRow label="Roles" value={
                          <div className="flex flex-wrap gap-1.5">
                            {(profile?.roles ?? []).map(r => {
                              const m = ROLE_META[r] ?? { label: r, color: 'bg-slate-100 text-slate-600 border-slate-200' };
                              return <span key={r} className={`text-xs font-medium px-2.5 py-1 rounded-full border ${m.color}`}>{m.label}</span>;
                            })}
                          </div>
                        } />
                      </div>
                    )}
                  </div>
                </Card>

                {/* Account Timeline */}
                <Card>
                  <CardHeader title="Account Timeline" sub="Activity and dates" icon={Calendar} />
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { icon: Calendar, label: 'Member Since',  value: fmtDate(profile?.created_at),   sub: timeAgo(profile?.created_at),  color: 'text-blue-600',   bg: 'bg-blue-50' },
                      { icon: Clock,    label: 'Last Updated',  value: timeAgo(profile?.updated_at),    sub: fmtDate(profile?.updated_at),   color: 'text-purple-600', bg: 'bg-purple-50' },
                      { icon: Shield,   label: 'Account Status',value: profile?.status ?? '—',          sub: profile?.email_verified ? 'Email verified' : 'Email not verified', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    ].map(({ icon: Icon, label, value, sub, color, bg }) => (
                      <div key={label} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className={`${bg} p-2.5 rounded-xl flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400 truncate">{label}</p>
                          <p className="text-sm font-semibold text-slate-800 mt-0.5 capitalize">{value}</p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

              </div>

              {/* RIGHT — Security + Contact + Sign Out (1 of 3 cols) */}
              <div className="space-y-5">

                {/* Contact summary */}
                <Card>
                  <CardHeader title="Contact" sub="Your contact info" icon={Phone} />
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                      <div className="bg-blue-50 p-2 rounded-lg flex-shrink-0">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400">Email</p>
                        <p className="text-sm font-medium text-slate-700 truncate">{profile?.email || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                      <div className="bg-emerald-50 p-2 rounded-lg flex-shrink-0">
                        <Phone className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400">Phone</p>
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {profile?.phone || <span className="text-slate-400 italic">Not set</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Security */}
                <Card>
                  <CardHeader title="Security" sub="Manage your password" icon={Lock} />
                  <div className="p-5">
                    {pwMsg && <div className="mb-4"><Flash msg={pwMsg} /></div>}

                    {!pwOpen ? (
                      <button onClick={() => setPwOpen(true)}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-[#1EA2E4]/40 hover:bg-slate-50 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-[#1EA2E4]/10 transition-colors">
                            <Lock className="w-4 h-4 text-slate-500 group-hover:text-[#1EA2E4]" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-slate-700">Change Password</p>
                            <p className="text-xs text-slate-400">Update your login credentials</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1EA2E4] transition-colors" />
                      </button>
                    ) : (
                      <form onSubmit={changePassword} className="space-y-4">
                        <PwField label="Current Password" value={curPw} onChange={setCurPw} placeholder="Current password" />
                        <PwField label="New Password" value={newPw} onChange={setNewPw} placeholder="Min. 8 characters" />
                        <PwField label="Confirm Password" value={confPw} onChange={setConfPw} placeholder="Repeat new password" />
                        <div className="flex gap-2 pt-1">
                          <button type="submit" disabled={pwSaving}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                            style={{ background: BRAND_BLUE }}>
                            <Lock className="w-3.5 h-3.5" />
                            {pwSaving ? 'Updating…' : 'Update'}
                          </button>
                          <button type="button" onClick={() => { setPwOpen(false); setCurPw(''); setNewPw(''); setConfPw(''); }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </Card>

                {/* Sign Out */}
                <Card>
                  <CardHeader title="Session" sub="End your current session" icon={LogOut} />
                  <div className="p-5">
                    <p className="text-sm text-slate-500 mb-4">
                      Signed in as <span className="font-semibold text-slate-700">{profile?.email}</span>.
                      You'll be redirected to the login page.
                    </p>
                    <button onClick={() => setLogoutOpen(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </Card>

              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Logout confirmation modal ────────────────────────────────────── */}
      {logoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loggingOut && setLogoutOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-xl flex-shrink-0">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Sign Out</h3>
                <p className="text-sm text-slate-500 mt-0.5">You'll need to sign in again to access the portal.</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600">
              Signed in as <span className="font-semibold">{profile?.email}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setLogoutOpen(false)} disabled={loggingOut}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-40">
                Cancel
              </button>
              <button onClick={handleLogout} disabled={loggingOut}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">
                {loggingOut
                  ? <><RefreshCw className="w-4 h-4 animate-spin" />Signing out…</>
                  : <><LogOut className="w-4 h-4" />Sign Out</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
