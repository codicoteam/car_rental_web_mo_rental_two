import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, RefreshCw, Building2, Car, Users, DollarSign, AlertTriangle,
  Wrench, TrendingUp, TrendingDown, Minus, Calendar, CreditCard,
  UserCheck, MapPin, BarChart3, Bell, Tag, ShieldCheck,
  Activity, ChevronRight, AlertCircle, Lock,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Sidebar from '../../components/Sidebar';
import { useAppSelector } from '../../app/hooks';
import {
  fetchAdminDashboardData, getErrorDisplay,
  type IAdminDashboardData, type BranchMapItem,
} from '../../Services/adminAndManager/admin_dashboard_service';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  AreaChart, Area, CartesianGrid, XAxis, YAxis, BarChart, Bar,
  LineChart, Line,
} from 'recharts';

// Fix leaflet default marker icons (bundler strips the default path)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const branchMapIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ── palette ────────────────────────────────────────────────────────────────────
const BRAND_NAVY  = '#0A1628';
const BRAND_BLUE  = '#1EA2E4';
const CHART_COLORS = ['#1EA2E4','#22C55E','#F59E0B','#A855F7','#EF4444','#14B8A6','#F97316','#64748B'];

// ── helpers ────────────────────────────────────────────────────────────────────

/** Safely coerce any value (including Decimal128 objects) to a number or null. */
function safeNum(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'object' && '$numberDecimal' in (val as object)) {
    const n = parseFloat((val as Record<string, string>)['$numberDecimal']);
    return isNaN(n) ? null : n;
  }
  const n = parseFloat(String(val));
  return isNaN(n) ? null : n;
}

const fmt = (val: unknown) => {
  const n = safeNum(val);
  return n != null ? n.toLocaleString() : '—';
};

const fmtCurrency = (val: unknown) => {
  const n = safeNum(val);
  return n != null
    ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    : '$0';
};

const fmtDate = (d: Date) => d.toISOString().split('T')[0];

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// ── shimmer skeleton ───────────────────────────────────────────────────────────
const Shimmer = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded-xl bg-slate-100 ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  </div>
);

const LoadingSkeleton = () => (
  <div className="flex min-h-screen bg-slate-50">
    <div className="hidden lg:block"><Sidebar /></div>
    <div className="flex-1 p-6 space-y-5">
      <Shimmer className="h-10 w-72" />
      <Shimmer className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <Shimmer key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {[...Array(12)].map((_, i) => <Shimmer key={i} className="h-16" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <Shimmer key={i} className="h-72" />)}
      </div>
    </div>
    <style>{`@keyframes shimmer{100%{transform:translateX(100%)}}`}</style>
  </div>
);

// ── KPI card ───────────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string; value: string | number; sub: string;
  icon: React.ElementType; accent: string; bg: string; trend?: number | null;
}
const KpiCard = ({ title, value, sub, icon: Icon, accent, bg, trend }: KpiCardProps) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className={`${bg} p-2.5 rounded-xl`}>
        <Icon className={`w-5 h-5 ${accent}`} />
      </div>
      {trend != null && (
        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {trend !== 0 ? `${Math.abs(trend)}%` : 'Flat'}
        </span>
      )}
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-900 leading-none tracking-tight">{value}</p>
      <p className="text-sm font-medium text-slate-500 mt-1.5">{title}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  </div>
);

// ── quick-action nav card ──────────────────────────────────────────────────────
interface QuickNavItem { label: string; sub: string; icon: React.ElementType; path: string; color: string; bg: string; }
const QuickCard = ({ item, onClick }: { item: QuickNavItem; onClick: () => void }) => (
  <button onClick={onClick}
    className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#1EA2E4]/40 transition-all duration-200 p-4 flex items-center gap-3 text-left w-full">
    <div className={`${item.bg} p-2.5 rounded-xl group-hover:scale-105 transition-transform duration-150 flex-shrink-0`}>
      <item.icon className={`w-4 h-4 ${item.color}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-800 truncate">{item.label}</p>
      <p className="text-xs text-slate-400 truncate">{item.sub}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-[#1EA2E4] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
  </button>
);

// ── chart card wrapper ─────────────────────────────────────────────────────────
const ChartCard = ({ title, sub, icon: Icon, children }: { title: string; sub: string; icon: React.ElementType; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
    <div className="flex items-start justify-between mb-5">
      <div>
        <h3 className="text-[15px] font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
      <div className="bg-slate-50 p-2 rounded-lg"><Icon className="w-4 h-4 text-slate-400" /></div>
    </div>
    {children}
  </div>
);

const ttStyle = {
  backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
  padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
};

// ── main ───────────────────────────────────────────────────────────────────────
const ADMIN_ROLES = ['admin', 'executive_admin'];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const authUser = useAppSelector((state) => state.auth.user);
  const hasAccess = authUser?.roles?.some(r => ADMIN_ROLES.includes(r)) ?? false;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading]     = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [data, setData]               = useState<IAdminDashboardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await fetchAdminDashboardData({
        from: fmtDate(dateRange.from),
        to: fmtDate(dateRange.to),
      });
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(getErrorDisplay(err).message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateRange.from, dateRange.to]);

  useEffect(() => { setIsLoading(true); load(); }, [load]);
  const refresh = () => { setIsRefreshing(true); load(); };

  // derived chart data
  const revenuePerDay       = useMemo(() => (data?.charts.lines.revenue_per_day ?? []).map(x => ({ date: shortDate(x.date), value: x.value })), [data]);
  const reservationsPerDay  = useMemo(() => (data?.charts.lines.reservations_per_day ?? []).map(x => ({ date: shortDate(x.date), value: x.value })), [data]);
  const reservationsByStatus= useMemo(() => (data?.charts.pie.reservations_by_status ?? []).map(x => ({ name: x.label.replace(/_/g,' '), value: x.value })), [data]);
  const revenueByBranch     = useMemo(() => (data?.charts.bars.revenue_by_branch ?? []).map(x => ({ name: x.label, value: x.value })), [data]);
  const vehiclesByClass     = useMemo(() => (data?.charts.bars.vehicles_by_class ?? []).map(x => ({ name: x.label, value: x.value })), [data]);

  const quickNav: QuickNavItem[] = [
    { label:'Reservations',   sub:'View & manage',       icon:Calendar,    path:'/admin-reservations',       color:'text-blue-600',   bg:'bg-blue-50' },
    { label:'Payments',       sub:'Revenue & history',   icon:CreditCard,  path:'/admin-payments',           color:'text-emerald-600',bg:'bg-emerald-50' },
    { label:'Users',          sub:'Customer accounts',   icon:Users,       path:'/admin-users',              color:'text-purple-600', bg:'bg-purple-50' },
    { label:'Vehicles',       sub:'Fleet units',         icon:Car,         path:'/admin-vehicles',           color:'text-amber-600',  bg:'bg-amber-50' },
    { label:'Branches',       sub:'Office locations',    icon:Building2,   path:'/admin-branches',           color:'text-cyan-600',   bg:'bg-cyan-50' },
    { label:'Driver Bookings',sub:'Driver-assisted',     icon:UserCheck,   path:'/admin-driver-bookings',    color:'text-indigo-600', bg:'bg-indigo-50' },
    { label:'Incidents',      sub:'Damage & reports',    icon:AlertTriangle,path:'/admin-vehicle-incidents', color:'text-red-600',    bg:'bg-red-50' },
    { label:'Service Orders', sub:'Maintenance',         icon:Wrench,      path:'/admin-service-orders',     color:'text-orange-600', bg:'bg-orange-50' },
    { label:'Reports',        sub:'Analytics & exports', icon:BarChart3,   path:'/admin-reports',            color:'text-teal-600',   bg:'bg-teal-50' },
    { label:'Notifications',  sub:'Push & in-app',       icon:Bell,        path:'/admin-notifications',      color:'text-pink-600',   bg:'bg-pink-50' },
    { label:'Rate Plans',     sub:'Pricing config',      icon:ShieldCheck, path:'/admin-rate-plans',         color:'text-violet-600', bg:'bg-violet-50' },
    { label:'Promo Codes',    sub:'Discounts & offers',  icon:Tag,         path:'/admin-promo-codes',        color:'text-rose-600',   bg:'bg-rose-50' },
  ];

  if (!authUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 max-w-sm px-6">
          <div className="bg-slate-100 p-5 rounded-full inline-block">
            <Lock className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Not signed in</h2>
          <p className="text-sm text-slate-500">Please log in to access the admin dashboard.</p>
          <button onClick={() => navigate('/login')}
            className="mt-2 px-5 py-2.5 rounded-xl bg-[#1EA2E4] text-white text-sm font-semibold hover:bg-[#1891cd] transition-colors">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (authUser && !hasAccess) {
      const roles = authUser.roles ?? [];
      if (roles.includes('manager')) {
        navigate('/branch-manager-dashboard', { replace: true });
      } else if (roles.includes('branch_receptionist')) {
        navigate('/receptionist-dashboard', { replace: true });
      } else if (roles.includes('agent')) {
        navigate('/agentdashboard', { replace: true });
      } else if (roles.includes('driver')) {
        navigate('/driver-dashboard', { replace: true });
      } else {
        navigate('/dashboardy', { replace: true });
      }
    }
  }, [authUser, hasAccess, navigate]);

  if (isLoading) return <LoadingSkeleton />;

  const k   = data?.kpis;
  const s   = data?.additional_stats;
  const mom = s?.mom_revenue_growth ?? null;
  const periodDays = Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000) + 1;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── top header ────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[17px] font-bold text-slate-900 leading-none">Admin Dashboard</h1>
                  <span className="hidden sm:inline text-xs font-medium text-white bg-[#1EA2E4] px-2 py-0.5 rounded-full">Live</span>
                </div>
                {lastUpdated && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Updated {lastUpdated.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* date range */}
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <input type="date" value={fmtDate(dateRange.from)} max={fmtDate(dateRange.to)}
                  onChange={e => setDateRange(p => ({ ...p, from: new Date(e.target.value) }))}
                  className="bg-transparent border-none outline-none w-28 cursor-pointer text-xs text-slate-700" />
                <span className="text-slate-300">→</span>
                <input type="date" value={fmtDate(dateRange.to)} min={fmtDate(dateRange.from)}
                  onChange={e => setDateRange(p => ({ ...p, to: new Date(e.target.value) }))}
                  className="bg-transparent border-none outline-none w-28 cursor-pointer text-xs text-slate-700" />
              </div>
              <button onClick={refresh} disabled={isRefreshing}
                className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-40"
                title="Refresh data">
                <RefreshCw className={`w-4 h-4 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        {/* ── main scroll area ───────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">

            {/* error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Failed to load dashboard</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <button onClick={refresh} className="mt-3 text-sm font-semibold text-red-600 hover:text-red-800 underline underline-offset-2">Try again</button>
                </div>
              </div>
            )}

            {/* ── hero strip ──────────────────────────────────────────────────── */}
            <div className="relative rounded-2xl overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${BRAND_NAVY} 0%, #132540 55%, ${BRAND_BLUE} 100%)` }}>
              {/* decorative rings */}
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border-[50px] border-white/5 pointer-events-none" />
              <div className="absolute -bottom-20 right-24 w-52 h-52 rounded-full border-[35px] border-white/5 pointer-events-none" />
              <div className="absolute top-0 left-1/2 w-96 h-96 rounded-full border-[60px] border-white/[0.02] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

              <div className="relative z-10 px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div>
                  <p className="text-white/60 text-sm font-medium">Welcome back, Admin</p>
                  <h2 className="text-white text-2xl font-bold mt-0.5">MoRental Overview</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-white/10 text-white/80 text-xs font-medium px-2.5 py-1 rounded-full">
                      {fmtDate(dateRange.from)} → {fmtDate(dateRange.to)}
                    </span>
                    <span className="bg-white/10 text-white/80 text-xs font-medium px-2.5 py-1 rounded-full">
                      {periodDays} day window
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                  <HeroStat label="Revenue" value={fmtCurrency(k?.total_revenue_paid_in_range)} />
                  <div className="w-px h-8 bg-white/15 hidden sm:block" />
                  <HeroStat label="Active Now" value={fmt(k?.active_reservations_now)} />
                  <div className="w-px h-8 bg-white/15 hidden sm:block" />
                  <HeroStat label="Fleet Active" value={fmt(k?.active_fleet)} />
                  <div className="w-px h-8 bg-white/15 hidden sm:block" />
                  <HeroStat label="Customers" value={fmt(s?.total_customers)} />
                </div>
              </div>
            </div>

            {/* ── KPIs ──────────────────────────────────────────────────────── */}
            <section>
              <SectionLabel>Key Metrics</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                <KpiCard title="Active Branches"   value={fmt(k?.total_branches)}  sub="Operational locations"    icon={Building2}   accent="text-blue-600"   bg="bg-blue-50" />
                <KpiCard title="Total Fleet"        value={fmt(k?.total_vehicles)}  sub={`${fmt(k?.active_fleet)} active`} icon={Car} accent="text-emerald-600" bg="bg-emerald-50" />
                <KpiCard title="Revenue"            value={fmtCurrency(k?.total_revenue_paid_in_range)} sub="Paid in period" icon={DollarSign} accent="text-amber-600" bg="bg-amber-50" trend={mom} />
                <KpiCard title="Total Customers"    value={fmt(s?.total_customers)} sub="Registered accounts"     icon={Users}      accent="text-violet-600"  bg="bg-violet-50" />
                <KpiCard title="Reservations"       value={fmt(k?.reservations_in_range)} sub="Bookings in period" icon={Calendar}  accent="text-purple-600" bg="bg-purple-50" />
                <KpiCard title="Active Bookings"    value={fmt(k?.active_reservations_now)} sub="Pending / checked-out" icon={Activity} accent="text-cyan-600" bg="bg-cyan-50" />
                <KpiCard title="Open Incidents"     value={fmt(k?.open_or_review_incidents)} sub="Needs resolution"  icon={AlertTriangle} accent="text-red-600"   bg="bg-red-50" />
                <KpiCard title="Service Orders"     value={fmt(k?.open_or_in_progress_services)} sub={`${fmt(k?.due_service_schedules_by_date)} due soon`} icon={Wrench} accent="text-orange-600" bg="bg-orange-50" />
                <KpiCard title="Driver Bookings"    value={fmt(k?.driver_bookings_in_range)} sub="In period"          icon={UserCheck} accent="text-indigo-600" bg="bg-indigo-50" />
              </div>
            </section>

            {/* ── quick navigation ──────────────────────────────────────────── */}
            <section>
              <SectionLabel>Quick Navigation</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                {quickNav.map(item => (
                  <QuickCard key={item.path} item={item} onClick={() => navigate(item.path)} />
                ))}
              </div>
            </section>

            {/* ── charts ────────────────────────────────────────────────────── */}
            <section>
              <SectionLabel>Analytics</SectionLabel>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Revenue trend */}
                <ChartCard title="Revenue Trend" sub={`${revenuePerDay.length} data points`} icon={TrendingUp}>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenuePerDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="date" tick={{ fill:'#94A3B8', fontSize:11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill:'#94A3B8', fontSize:11 }} tickLine={false} axisLine={false}
                          tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} />
                        <Tooltip contentStyle={ttStyle} formatter={(v:number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                        <Line type="monotone" dataKey="value" stroke={BRAND_BLUE} strokeWidth={2.5}
                          dot={{ fill:BRAND_BLUE, r:3, strokeWidth:0 }} activeDot={{ r:5, fill:BRAND_BLUE, strokeWidth:0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                {/* Bookings by status — donut */}
                <ChartCard title="Bookings by Status" sub="Current distribution" icon={Activity}>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={reservationsByStatus} cx="50%" cy="42%" innerRadius={52} outerRadius={82} dataKey="value" paddingAngle={3}>
                          {reservationsByStatus.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={ttStyle} />
                        <Legend verticalAlign="bottom" height={28} iconType="circle" iconSize={8}
                          formatter={v => <span className="text-xs text-slate-600 capitalize">{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                {/* Daily reservations */}
                <ChartCard title="Daily Reservations" sub="Booking volume over time" icon={Calendar}>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={reservationsPerDay}>
                        <defs>
                          <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#22C55E" stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="date" tick={{ fill:'#94A3B8', fontSize:11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill:'#94A3B8', fontSize:11 }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={ttStyle} formatter={(v:number) => [v, 'Reservations']} />
                        <Area type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2.5}
                          fill="url(#resGrad)" dot={false} activeDot={{ r:5, fill:'#22C55E', strokeWidth:0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                {/* Revenue by branch */}
                <ChartCard title="Revenue by Branch" sub="Top performing locations" icon={MapPin}>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueByBranch}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="name" tick={{ fill:'#94A3B8', fontSize:11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill:'#94A3B8', fontSize:11 }} tickLine={false} axisLine={false}
                          tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                        <Tooltip contentStyle={ttStyle} formatter={(v:number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                        <Bar dataKey="value" fill={BRAND_BLUE} radius={[6,6,0,0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                {/* Fleet by class — full width */}
                <div className="lg:col-span-2">
                  <ChartCard title="Fleet Distribution by Class" sub={`${fmt(k?.total_vehicles)} total vehicles across all classes`} icon={Car}>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={vehiclesByClass}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis dataKey="name" tick={{ fill:'#94A3B8', fontSize:11 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill:'#94A3B8', fontSize:11 }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={ttStyle} formatter={(v:number) => [v, 'Vehicles']} />
                          <Bar dataKey="value" radius={[6,6,0,0]} barSize={42}>
                            {vehiclesByClass.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>
                </div>
              </div>
            </section>

            {/* ── branch map ─────────────────────────────────────────────────── */}
            <section>
              <SectionLabel>Branch Network</SectionLabel>
              <BranchesMap branches={data?.branches ?? []} onViewAll={() => navigate('/admin-branches')} />
            </section>

            {/* footer */}
            <footer className="pt-4 pb-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-1">
              <span>Data range: <span className="font-medium text-slate-500">{fmtDate(dateRange.from)} → {fmtDate(dateRange.to)}</span></span>
              <span>© {new Date().getFullYear()} MoRental · Admin Portal</span>
            </footer>

          </div>
        </main>
      </div>

      <style>{`@keyframes shimmer{100%{transform:translateX(100%)}}`}</style>
    </div>
  );
}

// ── shared sub-components ──────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{children}</h2>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center sm:text-left">
      <p className="text-white text-xl font-bold leading-none">{value}</p>
      <p className="text-white/55 text-xs mt-1">{label}</p>
    </div>
  );
}

function BranchesMap({ branches, onViewAll }: { branches: BranchMapItem[]; onViewAll: () => void }) {
  const valid = branches.filter(b => b.lat != null && b.lng != null);
  // Center: average of all branch coords, fallback to Zimbabwe centroid
  const center: [number, number] = valid.length > 0
    ? [
        valid.reduce((s, b) => s + b.lat!, 0) / valid.length,
        valid.reduce((s, b) => s + b.lng!, 0) / valid.length,
      ]
    : [-19.015, 29.154];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-800">Branch Locations</h3>
          <p className="text-xs text-slate-400 mt-0.5">{valid.length} active location{valid.length !== 1 ? 's' : ''} on the map</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onViewAll}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#1EA2E4] hover:text-[#1891cd] transition-colors">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <div className="bg-slate-50 p-2 rounded-lg">
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* map */}
      <div style={{ height: 440 }}>
        <MapContainer center={center} zoom={valid.length > 1 ? 6 : 10}
          style={{ width: '100%', height: '100%' }} scrollWheelZoom={false} zoomControl>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {valid.map(b => (
            <Marker key={b._id} position={[b.lat!, b.lng!]} icon={branchMapIcon}>
              <Popup>
                <div style={{ minWidth: 170, lineHeight: 1.5 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#0A1628', margin: 0 }}>{b.name}</p>
                  <p style={{ fontSize: 11, color: '#1EA2E4', margin: '2px 0 0', fontWeight: 600 }}>{b.code}</p>
                  {(b.address?.city || b.address?.country) && (
                    <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>
                      {[b.address.city, b.address.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '3px 0 0' }}>
                    {b.lat?.toFixed(4)}, {b.lng?.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* branch chips */}
      {valid.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap gap-2">
          {valid.map(b => (
            <span key={b._id}
              className="inline-flex items-center gap-1.5 bg-[#1EA2E4]/10 text-[#1EA2E4] text-xs font-semibold px-3 py-1.5 rounded-full">
              <MapPin className="w-3 h-3 flex-shrink-0" />{b.name}
            </span>
          ))}
        </div>
      )}

      {valid.length === 0 && (
        <div className="px-6 py-8 text-center text-sm text-slate-400">
          No branches with coordinates yet. Add geo data to branches to see them here.
        </div>
      )}
    </div>
  );
}
