import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Search, Menu, AlertCircle, Car, CreditCard,
  Calendar, MapPin, ChevronRight, Tag
} from 'lucide-react';
import Sidebar from '../../components/CustomerSidebar';
import { reservationsService } from '../../Services/reservations_service';

interface Reservation {
  _id: string;
  code: string;
  status: string;
  created_at: string;
  pickup: { branch_id: any; at: string };
  dropoff: { branch_id: any; at: string };
  vehicle_id: any;
  vehicle_model_id: any;
  pricing: { currency: string; grand_total: string };
  payment_summary: { status: string; paid_total: any; outstanding: any };
}

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_out', label: 'Checked Out' },
  { value: 'checked_in', label: 'Returned' },
  { value: 'closed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800' },
  checked_out: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  checked_in: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  returned: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  closed: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
  no_show: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_out: 'Checked Out',
  checked_in: 'Returned',
  returned: 'Returned',
  closed: 'Completed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

const matchesTab = (status: string, tab: string): boolean => {
  if (tab === 'all') return true;
  if (tab === 'checked_in') return status === 'checked_in' || status === 'returned';
  if (tab === 'closed') return status === 'closed' || status === 'completed';
  return status === tab;
};

const CustomerReservationsPage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reservationsService.getUserReservations({ limit: 100 });
      setReservations((res.items || []) as unknown as Reservation[]);
    } catch (e: any) {
      setError(e.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservations(); }, []);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const fmtAmount = (val: any, currency = 'USD') => {
    const n = typeof val === 'object' && val?.$numberDecimal
      ? parseFloat(val.$numberDecimal)
      : parseFloat(val || '0');
    return `${currency} ${n.toFixed(2)}`;
  };

  const getOutstanding = (r: Reservation) => {
    const v = r.payment_summary?.outstanding;
    return v ? (typeof v === 'object' ? parseFloat(v.$numberDecimal) : parseFloat(v)) : 0;
  };

  const filtered = reservations.filter(r => {
    const tab = matchesTab(r.status, activeTab);
    const name = r.vehicle_model_id
      ? `${r.vehicle_model_id.make || ''} ${r.vehicle_model_id.model || ''}`.toLowerCase()
      : '';
    const search = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || r.code.toLowerCase().includes(search) || name.includes(search);
    return tab && matchSearch;
  });

  // Pin active reservations to top
  const sorted = [...filtered].sort((a, b) => {
    const activeStatuses = ['confirmed', 'checked_out', 'pending'];
    const aActive = activeStatuses.includes(a.status);
    const bActive = activeStatuses.includes(b.status);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col lg:ml-74">
        <nav className="fixed top-0 right-0 left-0 lg:left-74 z-40 bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-slate-100">
                  <Menu className="w-5 h-5 text-slate-700" />
                </button>
                <h1 className="font-bold text-lg bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent">
                  My Reservations
                </h1>
              </div>
              <button
                onClick={() => navigate('/vehicle')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-sm font-semibold shadow-md hover:opacity-90 transition-all"
              >
                + New Booking
              </button>
            </div>
          </div>
        </nav>

        <div className="flex-1 overflow-y-auto pt-16 sm:pt-20">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">

            {/* Search */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 border border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by code or vehicle..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {STATUS_TABS.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                      activeTab === tab.value
                        ? 'bg-gradient-to-r from-blue-700 to-cyan-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Count */}
            {!loading && !error && (
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  <span className="font-bold text-gray-900">{sorted.length}</span> reservation{sorted.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4 mb-6">
                <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-red-800">Failed to load reservations</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
                <button onClick={fetchReservations} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold">
                  Retry
                </button>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="bg-white rounded-2xl shadow-lg p-14 text-center border border-slate-200">
                <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full mx-auto relative">
                  <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-gray-600 font-medium mt-6">Loading your reservations...</p>
              </div>
            )}

            {/* Reservation Cards */}
            {!loading && !error && (
              <div className="space-y-4">
                {sorted.map(reservation => {
                  const colors = STATUS_COLOR[reservation.status] || { bg: 'bg-gray-100', text: 'text-gray-700' };
                  const vehicleName = reservation.vehicle_model_id
                    ? `${reservation.vehicle_model_id.make || ''} ${reservation.vehicle_model_id.model || ''}`.trim()
                    : 'Vehicle';
                  const photo = reservation.vehicle_id?.photos?.[0];
                  const outstanding = getOutstanding(reservation);
                  const canPay = outstanding > 0 && !['closed', 'completed', 'cancelled', 'no_show'].includes(reservation.status);
                  const isActive = ['pending', 'confirmed', 'checked_out'].includes(reservation.status);

                  return (
                    <div
                      key={reservation._id}
                      className={`bg-white rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 ${
                        isActive ? 'border-blue-200' : 'border-slate-200'
                      }`}
                    >
                      {isActive && (
                        <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                      )}
                      <div className="p-5">
                        <div className="flex gap-4">
                          {/* Photo */}
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-blue-50 flex-shrink-0">
                            {photo ? (
                              <img src={photo} alt={vehicleName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-bold text-gray-900 text-base truncate">{vehicleName}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${colors.bg} ${colors.text}`}>
                                {STATUS_LABEL[reservation.status] || reservation.status}
                              </span>
                            </div>
                            <p className="text-xs text-blue-600 font-mono font-semibold mb-2">{reservation.code}</p>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{fmtDate(reservation.pickup.at)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{fmtDate(reservation.dropoff.at)}</span>
                              </div>
                              <div className="flex items-center gap-1 col-span-2">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{reservation.pickup.branch_id?.name || 'N/A'}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-xs text-gray-500">
                                  {reservation.payment_summary?.status === 'paid' ? 'Paid' : `Outstanding`}
                                </p>
                                <p className={`text-sm font-bold ${canPay ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {canPay
                                    ? fmtAmount(reservation.payment_summary?.outstanding, reservation.pricing?.currency)
                                    : fmtAmount(reservation.pricing?.grand_total, reservation.pricing?.currency)
                                  }
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {canPay && (
                                  <button
                                    onClick={e => { e.stopPropagation(); navigate(`/payment/${reservation._id}`); }}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:opacity-90 transition-all"
                                  >
                                    <CreditCard className="w-3 h-3" />
                                    Pay
                                  </button>
                                )}
                                <button
                                  onClick={() => navigate(`/reservations/${reservation._id}`)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-all"
                                >
                                  View
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {sorted.length === 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-14 text-center border border-slate-200">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                      <Car className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-xl font-bold text-gray-700 mb-2">No reservations found</p>
                    <p className="text-gray-500 mb-6">
                      {activeTab !== 'all'
                        ? 'No reservations match the selected filter.'
                        : searchTerm
                          ? `No results for "${searchTerm}"`
                          : "You haven't made any bookings yet."
                      }
                    </p>
                    <button
                      onClick={() => navigate('/vehicle')}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold shadow-md hover:opacity-90 transition-all"
                    >
                      Browse Vehicles
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReservationsPage;
