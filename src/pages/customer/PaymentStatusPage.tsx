import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, Clock, RefreshCw, ChevronLeft,
  CreditCard, Loader, Menu
} from 'lucide-react';
import Sidebar from '../../components/CustomerSidebar';
import PaymentService from '../../Services/payment_service';

type PollStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'loading' | 'error';

const STATUS_CONFIG: Record<PollStatus, {
  icon: React.ComponentType<any>;
  iconClass: string;
  bgClass: string;
  title: string;
  subtitle: string;
}> = {
  loading: {
    icon: Loader,
    iconClass: 'text-blue-600 animate-spin',
    bgClass: 'bg-blue-50',
    title: 'Checking Payment...',
    subtitle: 'Please wait while we verify your payment.',
  },
  pending: {
    icon: Clock,
    iconClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    title: 'Payment Pending',
    subtitle: 'Your payment is being processed. This page will update automatically.',
  },
  paid: {
    icon: CheckCircle,
    iconClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50',
    title: 'Payment Successful!',
    subtitle: 'Your payment has been received and your booking is confirmed.',
  },
  failed: {
    icon: XCircle,
    iconClass: 'text-red-600',
    bgClass: 'bg-red-50',
    title: 'Payment Failed',
    subtitle: 'Your payment could not be processed. Please try again.',
  },
  cancelled: {
    icon: XCircle,
    iconClass: 'text-gray-600',
    bgClass: 'bg-gray-50',
    title: 'Payment Cancelled',
    subtitle: 'You cancelled the payment. You can try again from your reservation.',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-red-600',
    bgClass: 'bg-red-50',
    title: 'Error Checking Payment',
    subtitle: 'Could not retrieve payment status. Please check your reservations.',
  },
};

const TERMINAL_STATUSES = ['paid', 'failed', 'cancelled'];

const PaymentStatusPage = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('reservationId');
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [status, setStatus] = useState<PollStatus>('loading');
  const [payment, setPayment] = useState<any>(null);
  const [pollCount, setPollCount] = useState(0);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = async () => {
    if (!paymentId) return;
    try {
      const result = await PaymentService.pollPaymentStatus(paymentId);
      const payData = result?.data || result;
      setPayment(payData);
      const rawStatus = (payData?.paymentStatus || payData?.status || '').toLowerCase();
      const mappedStatus: PollStatus =
        rawStatus === 'paid' || rawStatus === 'successful' || rawStatus === 'success' ? 'paid'
        : rawStatus === 'failed' || rawStatus === 'declined' ? 'failed'
        : rawStatus === 'cancelled' || rawStatus === 'canceled' ? 'cancelled'
        : 'pending';
      setStatus(mappedStatus);
      setLastChecked(new Date());
      setPollCount(c => c + 1);

      if (TERMINAL_STATUSES.includes(mappedStatus)) {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      setStatus('error');
      if (pollRef.current) clearInterval(pollRef.current);
    }
  };

  useEffect(() => {
    poll();
    pollRef.current = setInterval(poll, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [paymentId]);

  const config = STATUS_CONFIG[status];
  const IconComp = config.icon;
  const isTerminal = TERMINAL_STATUSES.includes(status);

  const fmtAmount = (val: any, currency = 'USD') => {
    if (!val) return '';
    const num = typeof val === 'object' && val.$numberDecimal ? parseFloat(val.$numberDecimal) : parseFloat(val);
    return `${currency} ${num.toFixed(2)}`;
  };

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
              {reservationId && (
                <button onClick={() => navigate(`/reservations/${reservationId}`)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">Back to Reservation</span>
                </button>
              )}
              <span className="text-gray-900 font-semibold text-sm ml-auto">Payment Status</span>
            </div>
          </div>
        </nav>

        <div className="flex-1 pt-16 sm:pt-20 pb-8 px-4 flex items-center justify-center">
          <div className="max-w-md w-full space-y-6 pt-6">

            {/* Main Status Card */}
            <div className={`rounded-3xl shadow-xl p-8 text-center border border-gray-100 ${config.bgClass}`}>
              <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <IconComp className={`w-10 h-10 ${config.iconClass}`} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{config.title}</h1>
              <p className="text-gray-600 leading-relaxed">{config.subtitle}</p>

              {/* Payment details if available */}
              {payment && status !== 'loading' && status !== 'error' && (
                <div className="mt-6 bg-white/70 rounded-2xl p-4 text-left space-y-2">
                  {payment.amount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-bold text-gray-800">{fmtAmount(payment.amount, payment.currency)}</span>
                    </div>
                  )}
                  {payment.provider && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Provider</span>
                      <span className="font-semibold text-gray-700 capitalize">{payment.provider}</span>
                    </div>
                  )}
                  {payment.method && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Method</span>
                      <span className="font-semibold text-gray-700 capitalize">{payment.method}</span>
                    </div>
                  )}
                  {payment.boughtAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Date</span>
                      <span className="font-semibold text-gray-700">
                        {new Date(payment.boughtAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Polling indicator */}
            {!isTerminal && status !== 'error' && (
              <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200 flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Checking payment status...</p>
                  {lastChecked && (
                    <p className="text-xs text-gray-500">
                      Last checked: {lastChecked.toLocaleTimeString()} · Check #{pollCount}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {status === 'paid' && reservationId && (
                <button
                  onClick={() => navigate(`/reservations/${reservationId}`)}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
                >
                  <CheckCircle className="w-5 h-5" />
                  View My Booking
                </button>
              )}

              {(status === 'failed' || status === 'cancelled') && reservationId && (
                <button
                  onClick={() => navigate(`/payment/${reservationId}`)}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
                >
                  <CreditCard className="w-5 h-5" />
                  Try Payment Again
                </button>
              )}

              {status === 'error' && (
                <button
                  onClick={() => { setStatus('loading'); poll(); }}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
                >
                  <RefreshCw className="w-5 h-5" />
                  Check Again
                </button>
              )}

              <button
                onClick={() => navigate('/reservations')}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                My Reservations
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusPage;
