import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Car, MapPin, Calendar, CreditCard, Clock,
  CheckCircle, AlertCircle, XCircle, Menu, RefreshCw,
  User, Phone, Mail, FileText, Tag
} from 'lucide-react';
import Sidebar from '../../components/CustomerSidebar';
import { reservationsService } from '../../Services/reservations_service';

interface FullReservation {
  _id: string;
  code: string;
  status: string;
  created_at: string;
  pickup: { branch_id: any; at: string };
  dropoff: { branch_id: any; at: string };
  vehicle_id: any;
  vehicle_model_id: any;
  pricing: {
    currency: string;
    breakdown: Array<{ label: string; quantity: number; unit_amount: string; total: string }>;
    taxes: Array<{ code: string; rate: number; amount: string }>;
    grand_total: string;
  };
  payment_summary: {
    status: string;
    paid_total: any;
    outstanding: any;
    last_payment_at: string | null;
  };
  driver_snapshot?: {
    full_name: string;
    phone: string;
    email: string;
    driver_license: { number: string; country: string; class: string; expires_at: string; verified: boolean };
  };
  notes?: string;
}

const TIMELINE = [
  { key: 'pending', label: 'Booking Submitted', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'checked_out', label: 'Vehicle Picked Up', icon: Car },
  { key: 'checked_in', label: 'Vehicle Returned', icon: MapPin },
  { key: 'closed', label: 'Completed', icon: CheckCircle },
];

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

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  checked_out: 'bg-indigo-100 text-indigo-800',
  checked_in: 'bg-cyan-100 text-cyan-800',
  returned: 'bg-cyan-100 text-cyan-800',
  closed: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800',
};

const canonicalIndex = (status: string): number => {
  const s = status === 'returned' ? 'checked_in' : status === 'completed' ? 'closed' : status;
  return TIMELINE.findIndex(t => t.key === s);
};

const isFinal = (status: string) =>
  ['closed', 'completed', 'cancelled', 'no_show'].includes(status);

const CustomerReservationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reservation, setReservation] = useState<FullReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchReservation = async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await reservationsService.getReservationById(id);
      setReservation(data as unknown as FullReservation);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load reservation');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReservation();
  }, [id]);

  useEffect(() => {
    if (!reservation) return;
    if (isFinal(reservation.status)) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(() => fetchReservation(true), 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [reservation?.status]);

  const fmt = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const fmtAmount = (val: any, currency = 'USD') => {
    const num = typeof val === 'object' && val?.$numberDecimal
      ? parseFloat(val.$numberDecimal)
      : parseFloat(val || '0');
    return `${currency} ${num.toFixed(2)}`;
  };

  const outstanding = reservation?.payment_summary?.outstanding;
  const outstandingNum = outstanding
    ? (typeof outstanding === 'object' ? parseFloat(outstanding.$numberDecimal) : parseFloat(outstanding))
    : 0;
  const canPay = outstandingNum > 0 && !isFinal(reservation?.status || '') && reservation?.status !== 'cancelled';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900/5 via-cyan-100/30 to-blue-500/10 flex">
        <div className="fixed inset-y-0 left-0 z-50">
          <Sidebar isOpen={false} onClose={() => {}} />
        </div>
        <div className="flex-1 lg:ml-74 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading reservation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900/5 via-cyan-100/30 to-blue-500/10 flex">
        <div className="fixed inset-y-0 left-0 z-50">
          <Sidebar isOpen={false} onClose={() => {}} />
        </div>
        <div className="flex-1 lg:ml-74 flex items-center justify-center">
          <div className="text-center bg-white rounded-2xl p-10 shadow-lg">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-800 mb-2">Could not load reservation</p>
            <p className="text-gray-500 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => fetchReservation()} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold">Retry</button>
              <button onClick={() => navigate('/reservations')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold">My Reservations</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentIdx = canonicalIndex(reservation.status);
  const vehicleName = reservation.vehicle_model_id
    ? `${reservation.vehicle_model_id.make || ''} ${reservation.vehicle_model_id.model || ''}`.trim()
    : 'Vehicle';
  const vehiclePhoto = reservation.vehicle_id?.photos?.[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900/5 via-cyan-100/30 to-blue-500/10 flex">
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col lg:ml-74">
        <nav className="fixed top-0 right-0 left-0 lg:left-74 z-40 bg-white/90 backdrop-blur-xl shadow-sm border-b border-blue-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-slate-100">
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
                <button onClick={() => navigate('/reservations')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <ChevronLeft className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm font-medium">Reservations</span>
                </button>
                <span className="text-gray-300 hidden sm:inline">›</span>
                <span className="text-gray-900 font-semibold text-sm hidden sm:inline">{reservation.code}</span>
              </div>
              <button
                onClick={() => fetchReservation(true)}
                disabled={refreshing}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="flex-1 pt-16 sm:pt-20 pb-8 px-4">
          <div className="max-w-4xl mx-auto space-y-6 pt-6">

            {/* Header card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              <div className="h-48 sm:h-56 relative bg-gradient-to-br from-slate-800 to-slate-900">
                {vehiclePhoto ? (
                  <img src={vehiclePhoto} alt={vehicleName} className="w-full h-full object-cover opacity-70" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-20 h-20 text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white/80 text-sm mb-1">{reservation.vehicle_id?.plate_number}</p>
                  <h1 className="text-white text-2xl font-bold">{vehicleName}</h1>
                  <p className="text-white/70 text-sm mt-0.5">
                    {reservation.vehicle_model_id?.year} · {reservation.vehicle_model_id?.class}
                  </p>
                </div>
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_COLOR[reservation.status] || 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_LABEL[reservation.status] || reservation.status}
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Reservation Code</p>
                  <p className="text-lg font-bold text-blue-700 font-mono">{reservation.code}</p>
                  <p className="text-xs text-gray-500 mt-1">Created {fmt(reservation.created_at)}</p>
                </div>
                {canPay && (
                  <button
                    onClick={() => navigate(`/payment/${reservation._id}`)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:opacity-90 transition-all"
                  >
                    <CreditCard className="w-5 h-5" />
                    Pay Now — {fmtAmount(outstanding, reservation.pricing?.currency)}
                  </button>
                )}
              </div>
            </div>

            {/* Status Timeline */}
            {!['cancelled', 'no_show'].includes(reservation.status) && (
              <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 border border-gray-200">
                <h2 className="text-base font-bold text-gray-900 mb-6">Booking Progress</h2>
                <div className="relative">
                  <div className="hidden sm:block absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
                  <div
                    className="hidden sm:block absolute top-5 left-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
                    style={{ width: currentIdx >= 0 ? `${(currentIdx / (TIMELINE.length - 1)) * 100}%` : '0%' }}
                  />
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-0">
                    {TIMELINE.map((step, i) => {
                      const done = i < currentIdx;
                      const active = i === currentIdx;
                      const IconComp = step.icon;
                      return (
                        <div key={step.key} className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2">
                          <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                            ${done ? 'bg-gradient-to-r from-blue-600 to-cyan-500 border-blue-600'
                              : active ? 'bg-white border-blue-600 shadow-lg shadow-blue-200'
                              : 'bg-white border-gray-300'}`}>
                            <IconComp className={`w-4 h-4 ${done ? 'text-white' : active ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                          <p className={`text-xs font-medium text-center leading-tight
                            ${done || active ? 'text-gray-900' : 'text-gray-400'}`}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {reservation.status === 'cancelled' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4">
                <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">Reservation Cancelled</p>
                  <p className="text-red-600 text-sm">This reservation has been cancelled. Contact support if you need assistance.</p>
                </div>
              </div>
            )}

            {/* Dates & Locations */}
            <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 border border-gray-200">
              <h2 className="text-base font-bold text-gray-900 mb-4">Rental Period</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Pickup</p>
                  </div>
                  <p className="font-bold text-gray-900">{fmt(reservation.pickup.at)}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {reservation.pickup.branch_id?.name || 'Branch'}
                  </p>
                </div>
                <div className="bg-cyan-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-cyan-600" />
                    <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wide">Return</p>
                  </div>
                  <p className="font-bold text-gray-900">{fmt(reservation.dropoff.at)}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {reservation.dropoff.branch_id?.name || 'Branch'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 border border-gray-200">
              <h2 className="text-base font-bold text-gray-900 mb-4">Payment Summary</h2>
              <div className="space-y-3">
                {reservation.pricing?.breakdown?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{item.label} × {item.quantity}</span>
                    <span className="font-semibold text-gray-800">
                      {reservation.pricing.currency} {parseFloat(item.total || '0').toFixed(2)}
                    </span>
                  </div>
                ))}
                {reservation.pricing?.taxes?.map((tax, i) => (
                  <div key={i} className="flex justify-between items-center text-sm text-gray-600">
                    <span>{tax.code} ({(tax.rate * 100).toFixed(0)}%)</span>
                    <span>{reservation.pricing.currency} {parseFloat(tax.amount || '0').toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Grand Total</span>
                  <span className="text-xl font-bold text-blue-700">
                    {fmtAmount(reservation.pricing?.grand_total, reservation.pricing?.currency)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid</span>
                    <span className="font-semibold text-emerald-600">
                      {fmtAmount(reservation.payment_summary?.paid_total, reservation.pricing?.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Outstanding</span>
                    <span className={`font-semibold ${outstandingNum > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {fmtAmount(outstanding, reservation.pricing?.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-600">Payment Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      reservation.payment_summary?.status === 'paid' ? 'bg-emerald-100 text-emerald-700'
                      : reservation.payment_summary?.status === 'partial' ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                      {(reservation.payment_summary?.status || 'unpaid').toUpperCase()}
                    </span>
                  </div>
                </div>

                {canPay && (
                  <button
                    onClick={() => navigate(`/payment/${reservation._id}`)}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
                  >
                    <CreditCard className="w-5 h-5" />
                    Make Payment — {fmtAmount(outstanding, reservation.pricing?.currency)}
                  </button>
                )}

                {!canPay && reservation.payment_summary?.status === 'paid' && (
                  <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <p className="text-emerald-700 font-semibold text-sm">Payment fully completed</p>
                  </div>
                )}
              </div>
            </div>

            {/* Driver Info */}
            {reservation.driver_snapshot && (
              <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 border border-gray-200">
                <h2 className="text-base font-bold text-gray-900 mb-4">Driver Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Full Name</p>
                      <p className="font-semibold text-gray-800">{reservation.driver_snapshot.full_name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-semibold text-gray-800">{reservation.driver_snapshot.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-semibold text-gray-800">{reservation.driver_snapshot.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">License</p>
                      <p className="font-semibold text-gray-800">
                        {reservation.driver_snapshot.driver_license?.number || 'N/A'} · {reservation.driver_snapshot.driver_license?.country}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {reservation.notes && (
              <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <h2 className="text-base font-bold text-gray-900">Notes</h2>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{reservation.notes}</p>
              </div>
            )}

            {/* Info banner for pending */}
            {reservation.status === 'pending' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Your booking is pending review. You will be notified once it is confirmed. This page updates automatically every 30 seconds.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReservationDetailPage;
