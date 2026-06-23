import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, CreditCard, Smartphone, CheckCircle,
  AlertCircle, Loader, Menu, Car, MapPin, Calendar,
  Phone, DollarSign
} from 'lucide-react';
import Sidebar from '../../components/CustomerSidebar';
import { reservationsService } from '../../Services/reservations_service';
import PaymentService from '../../Services/payment_service';

interface FullReservation {
  _id: string;
  code: string;
  status: string;
  vehicle_id: any;
  vehicle_model_id: any;
  pickup: { branch_id: any; at: string };
  dropoff: { branch_id: any; at: string };
  pricing: { currency: string; grand_total: string };
  payment_summary: { status: string; paid_total: any; outstanding: any };
}

type PaymentMethod = 'paynow' | 'mobile';
type MobileProvider = 'ecocash' | 'telecash' | 'onemoney';

const PROVIDERS: { value: MobileProvider; label: string; color: string }[] = [
  { value: 'ecocash', label: 'EcoCash', color: 'bg-green-500' },
  { value: 'telecash', label: 'TeleCash', color: 'bg-blue-500' },
  { value: 'onemoney', label: 'OneMoney', color: 'bg-red-500' },
];

const PaymentPage = () => {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [reservation, setReservation] = useState<FullReservation | null>(null);
  const [loadingRes, setLoadingRes] = useState(true);
  const [resError, setResError] = useState<string | null>(null);

  const [method, setMethod] = useState<PaymentMethod>('paynow');
  const [provider, setProvider] = useState<MobileProvider>('ecocash');
  const [phone, setPhone] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    if (!reservationId) return;
    reservationsService.getReservationById(reservationId)
      .then(data => setReservation(data as unknown as FullReservation))
      .catch(e => setResError(e.message))
      .finally(() => setLoadingRes(false));
  }, [reservationId]);

  const getOutstanding = () => {
    if (!reservation) return 0;
    const v = reservation.payment_summary?.outstanding;
    return v ? (typeof v === 'object' ? parseFloat(v.$numberDecimal) : parseFloat(v)) : 0;
  };

  const fmtAmount = (amount: number, currency = 'USD') =>
    `${currency} ${amount.toFixed(2)}`;

  const fmt = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handlePaynow = async () => {
    if (!reservation) return;
    setPaying(true);
    setPayError(null);
    try {
      const amount = getOutstanding();
      const result = await PaymentService.initiatePayment({
        reservation_id: reservation._id,
        amount: amount.toFixed(2),
        currency: reservation.pricing?.currency || 'USD',
        payment_method: 'paynow',
      });

      if (result?.data?.payment_url || result?.payment_url) {
        const url = result?.data?.payment_url || result?.payment_url;
        window.open(url, '_blank');
        // Navigate to status page to poll
        const paymentId = result?.data?._id || result?._id || result?.data?.payment_id || result?.payment_id;
        if (paymentId) {
          navigate(`/payment/status/${paymentId}?reservationId=${reservation._id}`);
        } else {
          navigate(`/reservations/${reservation._id}`);
        }
      } else {
        throw new Error('No payment URL returned from server');
      }
    } catch (e: any) {
      setPayError(typeof e === 'string' ? e : e?.message || 'Payment initiation failed');
    } finally {
      setPaying(false);
    }
  };

  const handleMobilePayment = async () => {
    if (!reservation) return;
    if (!phone.trim()) { setPayError('Phone number is required'); return; }
    setPaying(true);
    setPayError(null);
    try {
      const amount = getOutstanding();
      const result = await PaymentService.initiateMobilePayment({
        reservation_id: reservation._id,
        amount: amount.toFixed(2),
        currency: reservation.pricing?.currency || 'USD',
        payment_method: 'mobile',
        provider,
        phone: phone.trim(),
      });

      const paymentId = result?.data?._id || result?._id || result?.data?.payment_id || result?.payment_id;
      if (paymentId) {
        navigate(`/payment/status/${paymentId}?reservationId=${reservation._id}`);
      } else {
        navigate(`/reservations/${reservation._id}`);
      }
    } catch (e: any) {
      setPayError(typeof e === 'string' ? e : e?.message || 'Mobile payment initiation failed');
    } finally {
      setPaying(false);
    }
  };

  const handleSubmit = () => {
    if (method === 'paynow') handlePaynow();
    else handleMobilePayment();
  };

  if (loadingRes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900/5 via-cyan-100/30 to-blue-500/10 flex">
        <div className="fixed inset-y-0 left-0 z-50">
          <Sidebar isOpen={false} onClose={() => {}} />
        </div>
        <div className="flex-1 lg:ml-74 flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading payment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (resError || !reservation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900/5 via-cyan-100/30 to-blue-500/10 flex">
        <div className="fixed inset-y-0 left-0 z-50">
          <Sidebar isOpen={false} onClose={() => {}} />
        </div>
        <div className="flex-1 lg:ml-74 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-800 font-semibold mb-4">{resError || 'Reservation not found'}</p>
            <button onClick={() => navigate('/reservations')} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold">
              Back to Reservations
            </button>
          </div>
        </div>
      </div>
    );
  }

  const outstanding = getOutstanding();
  const vehicleName = reservation.vehicle_model_id
    ? `${reservation.vehicle_model_id.make || ''} ${reservation.vehicle_model_id.model || ''}`.trim()
    : 'Vehicle';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900/5 via-cyan-100/30 to-blue-500/10 flex">
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col lg:ml-74">
        <nav className="fixed top-0 right-0 left-0 lg:left-74 z-40 bg-white/90 backdrop-blur-xl shadow-sm border-b border-blue-200">
          <div className="max-w-2xl mx-auto px-4 sm:px-8">
            <div className="flex items-center h-16 sm:h-20 gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-slate-100">
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={() => navigate(`/reservations/${reservationId}`)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <span className="text-gray-300">›</span>
              <span className="text-gray-900 font-semibold text-sm">Make Payment</span>
            </div>
          </div>
        </nav>

        <div className="flex-1 pt-16 sm:pt-20 pb-8 px-4">
          <div className="max-w-2xl mx-auto pt-6 space-y-6">

            {/* Reservation Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Booking Summary</h2>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
                  {reservation.vehicle_id?.photos?.[0] ? (
                    <img src={reservation.vehicle_id.photos[0]} alt={vehicleName} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Car className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-lg">{vehicleName}</p>
                  <p className="text-xs text-gray-500 font-mono mb-2">{reservation.code}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{fmt(reservation.pickup.at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{reservation.pickup.branch_id?.name || 'Pickup'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Outstanding Balance</span>
                  <span className="text-2xl font-bold text-blue-700">
                    {fmtAmount(outstanding, reservation.pricing?.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Select Payment Method</h2>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setMethod('paynow')}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    method === 'paynow'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 text-sm">Paynow</p>
                    <p className="text-xs text-gray-500">Card / Bank</p>
                  </div>
                  {method === 'paynow' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                </button>

                <button
                  onClick={() => setMethod('mobile')}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    method === 'mobile'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 text-sm">Mobile Money</p>
                    <p className="text-xs text-gray-500">EcoCash & more</p>
                  </div>
                  {method === 'mobile' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                </button>
              </div>

              {/* Paynow info */}
              {method === 'paynow' && (
                <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                  <p className="font-semibold mb-1">Pay with Paynow</p>
                  <p>You will be redirected to the Paynow payment gateway. Complete your payment using a debit/credit card or internet banking.</p>
                </div>
              )}

              {/* Mobile money fields */}
              {method === 'mobile' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Provider</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PROVIDERS.map(p => (
                        <button
                          key={p.value}
                          onClick={() => setProvider(p.value)}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                            provider === p.value
                              ? 'border-blue-500 bg-blue-50 text-blue-800'
                              : 'border-gray-200 text-gray-700 hover:border-blue-300'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. 0771234567"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter the mobile number registered with {PROVIDERS.find(p => p.value === provider)?.label}</p>
                  </div>

                  <div className="bg-emerald-50 rounded-xl p-4 text-sm text-emerald-700">
                    <p className="font-semibold mb-1">How it works</p>
                    <p>After submitting, you will receive a USSD push notification on your phone to approve the payment.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {payError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{payError}</p>
              </div>
            )}

            {/* Amount & Submit */}
            <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700 font-medium">Amount to Pay</span>
                </div>
                <span className="text-2xl font-bold text-blue-700">
                  {fmtAmount(outstanding, reservation.pricing?.currency)}
                </span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={paying || outstanding <= 0}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold text-base flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paying ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : method === 'paynow' ? (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay with Paynow
                  </>
                ) : (
                  <>
                    <Smartphone className="w-5 h-5" />
                    Pay with {PROVIDERS.find(p => p.value === provider)?.label}
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-500 mt-3">
                Secure payment processing. Your details are encrypted.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
