import { useState, useEffect, type Key, useRef } from 'react';
import { 
  MapPin, 
  Users, 
  DoorOpen, 
  Shield, 
  Zap, 
  Fuel, 
  Cog, 
  CheckCircle,
  Clock,
  CreditCard,
  AlertCircle,
  Calendar,
  Phone,
  X,
  User,
  IdCard,
  Check,
  Smartphone,
  QrCode,
  ExternalLink,
  ChevronDown,
  Search
} from 'lucide-react';
import ServiceMaintenanceSection from '../../components/servicemaintanance';
import type { Pricing, ServiceOrder, ServiceSchedule } from '../../servicetypes';
import ReservationService from '../../Services/bookvihicle_service'; 
import UserService from '../../Services/users_service'; 
import PaymentService from '../../Services/payment_service';

interface BookingDetailsProps {
  pricing: Pricing;
  serviceOrders: ServiceOrder[];
  serviceSchedules: ServiceSchedule[];
  loadingServiceOrders: boolean;
  loadingServiceSchedules: boolean;
}

interface User {
  _id: string;
  email: string;
  phone: string;
  roles: string[];
  full_name: string;
  status: string;
  email_verified: boolean;
  auth_providers: any[];
  created_at: string;
  updated_at: string;
  __v: number;
}

type PaymentMethod = 'paynow' | 'mobile' | 'card';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

interface PaymentData {
  id?: string;
  pollUrl?: string;
  redirectUrl?: string;
  status?: PaymentStatus;
  paymentUrl?: string;
  mobilePaymentInstructions?: string;
  amount?: number;
  bookingCode?: string;
  guid?: string;
}

interface ReservationResponse {
  _id: string;
  id?: string;
  code: string;
  vehicle_id: any;
  vehicle_model_id: any;
  pickup: any;
  dropoff: any;
  pricing: any;
  payment_summary: any;
  driver_snapshot: any;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
  __v: number;
}

const BookingDetails = ({ 
  pricing, 
  serviceOrders, 
  serviceSchedules, 
  loadingServiceOrders, 
  loadingServiceSchedules 
}: BookingDetailsProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingCode, setBookingCode] = useState('');
  const [bookingSuccessData, setBookingSuccessData] = useState<{
    code: string;
    vehicle: string;
    total: string;
    email: string;
    phone: string;
    fullName: string;
    reservationId?: string;
    paymentStatus?: PaymentStatus;
  } | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [bookingDetails, setBookingDetails] = useState({
    startDate: '',
    endDate: '',
    days: 1,
    insurance: 'basic' as 'basic' | 'premium' | 'full',
    addons: [] as string[]
  });
  
  const [bookingForm, setBookingForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    licenseNumber: '',
    licenseCountry: 'ZW',
    licenseClass: '',
    licenseExpiry: '',
    notes: ''
  });

  const [paymentData, setPaymentData] = useState<PaymentData>({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('paynow');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const [isPollingPayment, setIsPollingPayment] = useState(false);
  const [paymentPollingInterval, setPaymentPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [hasRedirectedToPayNow, setHasRedirectedToPayNow] = useState(false);

  // User selection states
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (paymentPollingInterval) {
        clearInterval(paymentPollingInterval);
      }
    };
  }, [paymentPollingInterval]);

  // Auto-redirect to PayNow when we have the redirectUrl
  useEffect(() => {
    if (paymentData.redirectUrl && !hasRedirectedToPayNow) {
      console.log('Redirecting to PayNow:', paymentData.redirectUrl);
      window.open(paymentData.redirectUrl, '_blank');
      setHasRedirectedToPayNow(true);
    }
  }, [paymentData.redirectUrl, hasRedirectedToPayNow]);

  // Fetch users from API - FIXED VERSION
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setUsersError(null);
      console.log("Fetching users...");
      
      const response = await UserService.getAllUsers();
      console.log("Users API response:", response);
      
      // Check if response has success and data properties
      if (response && response.success === true && response.data) {
        // Extract users from response.data.users
        const usersData = response.data.users;
        
        if (Array.isArray(usersData)) {
          console.log("Users loaded from response.data.users:", usersData.length);
          setUsers(usersData);
        } else {
          console.error("Users data is not an array:", usersData);
          setUsers([]);
          setUsersError('Invalid users data format: expected array');
        }
      } else {
        console.error("Unexpected response format:", response);
        setUsers([]);
        setUsersError('Unexpected response format from server');
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      setUsersError(error.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const userName = user.full_name || '';
    const userEmail = user.email || '';
    const userPhone = user.phone || '';
    
    return (
      userName.toLowerCase().includes(searchLower) ||
      userEmail.toLowerCase().includes(searchLower) ||
      userPhone.toLowerCase().includes(searchLower)
    );
  });

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setBookingForm({
      ...bookingForm,
      fullName: user.full_name || '',
      email: user.email || '',
      phone: user.phone || ''
    });
    setShowUserDropdown(false);
    setSearchQuery('');
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setBookingForm({
      ...bookingForm,
      fullName: '',
      email: '',
      phone: ''
    });
  };

  const generateBookingCode = () => {
    const prefix = 'HRE';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `${prefix}-${year}-${random}`;
  };

  const parseDecimal = (decimalObj: { $numberDecimal: string }): number => {
    if (!decimalObj || !decimalObj.$numberDecimal) return 0;
    return parseFloat(decimalObj.$numberDecimal);
  };

  const calculateTotal = () => {
    const dailyRate = parseDecimal(pricing.daily_rate);
    const days = bookingDetails.days || 1;
    const subtotal = dailyRate * days;
    
    const insuranceCost = bookingDetails.insurance === 'basic' ? 15 : 
                          bookingDetails.insurance === 'premium' ? 25 : 40;
    
    const taxAmount = subtotal * (pricing.taxes.reduce((sum: number, tax: { rate: number }) => sum + tax.rate, 0));
    const feeAmount = pricing.fees.reduce((sum: number, fee: { amount: { $numberDecimal: string } }) => sum + parseDecimal(fee.amount), 0);
    
    return subtotal + taxAmount + feeAmount + (insuranceCost * days);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const vehicle = pricing.vehicle_id;
  const branch = pricing.branch_id;
  const photos = vehicle.photos || [];
  const primaryPhoto = photos[selectedPhoto] || photos[0];

  const handleConfirmBooking = () => {
    if (vehicle.availability_state !== 'available') return;
    
    // Check if a user is selected
    if (!selectedUser) {
      setSubmitError('Please select a user to book for');
      return;
    }
    
    setShowBookingModal(true);
    setSubmitError(null);
  };

  const startPaymentPolling = (guid: string) => {
    if (paymentPollingInterval) {
      clearInterval(paymentPollingInterval);
    }

    const interval = setInterval(async () => {
      try {
        console.log('Polling payment status with GUID:', guid);
        const statusResponse = await PaymentService.pollPaymentStatus(guid);
        
        console.log('Polling response:', statusResponse);
        
        if (statusResponse.status === 'paid' || statusResponse.status === 'Paid') {
          setIsPollingPayment(false);
          clearInterval(interval);
          
          setBookingSuccessData(prev => prev ? {
            ...prev,
            paymentStatus: 'paid'
          } : null);
          
          setPaymentData(prev => ({
            ...prev,
            status: 'paid'
          }));
          
          setTimeout(() => {
            setShowPaymentModal(false);
            setShowSuccessPopup(true);
            
            setTimeout(() => {
              setShowSuccessPopup(false);
            }, 10000);
          }, 2000);
        } else if (statusResponse.status === 'failed' || statusResponse.status === 'cancelled' || 
                  statusResponse.status === 'Failed' || statusResponse.status === 'Cancelled') {
          setIsPollingPayment(false);
          clearInterval(interval);
          setPaymentError(`Payment ${statusResponse.status}. Please try again.`);
        }
      } catch (error) {
        console.error('Payment polling error:', error);
      }
    }, 5000);

    setPaymentPollingInterval(interval);
  };

  const handleInitiatePayment = async () => {
    if (!bookingSuccessData?.reservationId) {
      setPaymentError('Reservation ID not found. Please try booking again.');
      return;
    }

    if (!bookingSuccessData?.phone) {
      setPaymentError('Phone number is required for payment.');
      return;
    }

    if (!bookingSuccessData?.email) {
      setPaymentError('Email address is required for payment.');
      return;
    }

    // Validate email format more strictly
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const cleanEmail = bookingSuccessData.email.trim().toLowerCase();
    
    if (!emailRegex.test(cleanEmail)) {
      setPaymentError('Please provide a valid email address (e.g., john@example.com).');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);
    setHasRedirectedToPayNow(false); // Reset redirect flag

    try {
      // Create payment payload with proper structure for PayNow
      const paymentPayload = {
        reservation_id: bookingSuccessData.reservationId,
        booking_code: bookingSuccessData.code,
        amount: calculateTotal(),
        currency: pricing.currency,
        payment_method: selectedPaymentMethod,
        customer: {
          email: cleanEmail,
          phone: bookingSuccessData.phone.trim(),
          name: bookingSuccessData.fullName.trim()
        },
        // PayNow specific required fields
        phone: bookingSuccessData.phone.trim(),
        email: cleanEmail,
        name: bookingSuccessData.fullName.trim(),
        metadata: {
          vehicle_name: pricing.name,
          branch_name: branch.name,
          days: bookingDetails.days,
          insurance: bookingDetails.insurance,
          reservation_id: bookingSuccessData.reservationId,
          booking_code: bookingSuccessData.code
        }
      };

      console.log('Initiating payment with payload:', JSON.stringify(paymentPayload, null, 2));

      let paymentResponse;

      if (selectedPaymentMethod === 'mobile') {
        // For mobile payments, PayNow requires specific field names
        const mobilePaymentPayload = {
          reservation_id: bookingSuccessData.reservationId,
          booking_code: bookingSuccessData.code,
          amount: calculateTotal(),
          currency: pricing.currency,
          payment_method: 'mobile',
          // PayNow mobile payment required fields
          email: cleanEmail,
          phone: bookingSuccessData.phone.trim(),
          name: bookingSuccessData.fullName.trim(),
          // Additional fields for mobile payments
          customer_email: cleanEmail,
          customer_phone: bookingSuccessData.phone.trim(),
          customer_name: bookingSuccessData.fullName.trim(),
          // Mobile specific metadata
          metadata: {
            ...paymentPayload.metadata,
            payment_type: 'mobile',
            channel: 'web'
          }
        };
        
        console.log('Mobile payment payload:', JSON.stringify(mobilePaymentPayload, null, 2));
        paymentResponse = await PaymentService.initiateMobilePayment(mobilePaymentPayload);
      } else {
        // For PayNow QR/banking
        console.log('Initiating PayNow payment...');
        paymentResponse = await PaymentService.initiatePayment(paymentPayload);
      }

      console.log('Payment response:', paymentResponse);

      if (paymentResponse && paymentResponse.success === false) {
        throw new Error(paymentResponse.message || 'Payment initiation failed');
      }

      // Handle PayNow response structure
      if (paymentResponse.success === true) {
        // Extract GUID from pollUrl for polling
        let guid = '';
        if (paymentResponse.pollUrl) {
          const guidMatch = paymentResponse.pollUrl.match(/guid=([a-f0-9-]+)/);
          if (guidMatch && guidMatch[1]) {
            guid = guidMatch[1];
          }
        }

        setPaymentData({
          id: guid || paymentResponse.id || paymentResponse.paymentId || paymentResponse._id,
          pollUrl: paymentResponse.pollUrl || paymentResponse.poll_url,
          redirectUrl: paymentResponse.redirectUrl || paymentResponse.redirect_url,
          status: paymentResponse.status || 'pending',
          paymentUrl: paymentResponse.paymentUrl || paymentResponse.url || paymentResponse.payment_url,
          mobilePaymentInstructions: paymentResponse.instructions || paymentResponse.mobile_instructions,
          amount: calculateTotal(),
          bookingCode: bookingSuccessData.code,
          guid: guid
        });

        console.log('Payment data set:', {
          redirectUrl: paymentResponse.redirectUrl || paymentResponse.redirect_url,
          pollUrl: paymentResponse.pollUrl || paymentResponse.poll_url,
          guid: guid
        });

        // Start polling if we have a GUID
        if (guid) {
          setIsPollingPayment(true);
          startPaymentPolling(guid);
        }

        // Show instructions for mobile payments
        if (selectedPaymentMethod === 'mobile') {
          setShowPaymentInstructions(true);
        }

      } else {
        throw new Error('Payment initiation failed - invalid response structure');
      }

    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      let errorMessage = 'Failed to initiate payment. Please try again.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.response?.data) {
        const apiError = error.response.data;
        if (apiError.message) {
          errorMessage = apiError.message;
        } else if (apiError.error) {
          errorMessage = apiError.error;
        }
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }
      
      setPaymentError(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleOpenPaymentLink = () => {
    if (paymentData.redirectUrl) {
      window.open(paymentData.redirectUrl, '_blank');
    } else if (paymentData.paymentUrl) {
      window.open(paymentData.paymentUrl, '_blank');
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (!paymentData.guid && !paymentData.id) return;
    
    try {
      const guid = paymentData.guid || paymentData.id;
      const statusResponse = await PaymentService.getPaymentStatus(guid!);
      setPaymentData(prev => ({
        ...prev,
        status: statusResponse.status
      }));
      
      if (statusResponse.status === 'paid' || statusResponse.status === 'Paid') {
        setShowPaymentModal(false);
        setShowSuccessPopup(true);
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
      setPaymentError('Failed to check payment status');
    }
  };

  const handleSubmitBooking = async () => {
    if (!selectedUser) {
      setSubmitError('Please select a user to book for');
      return;
    }

    if (!bookingForm.fullName || !bookingForm.phone || !bookingForm.email || 
        !bookingForm.licenseNumber || !bookingForm.licenseExpiry || 
        !bookingDetails.startDate || !bookingDetails.endDate) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    // Validate email before submitting
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const cleanEmail = bookingForm.email.trim().toLowerCase();
    
    if (!emailRegex.test(cleanEmail)) {
      setSubmitError('Please enter a valid email address (e.g., john@example.com).');
      return;
    }

    const generatedBookingCode = generateBookingCode();
    const totalAmount = calculateTotal();
    const bookingData = {
      code: generatedBookingCode,
      created_channel: "web",
      vehicle_id: vehicle._id,
      vehicle_model_id: vehicle.vehicle_model_id,
      pickup: {
        branch_id: branch._id,
        at: new Date(bookingDetails.startDate).toISOString()
      },
      dropoff: {
        branch_id: branch._id,
        at: new Date(bookingDetails.endDate).toISOString()
      },
      pricing: {
        currency: pricing.currency,
        breakdown: [
          {
            label: "Base daily rate",
            quantity: bookingDetails.days,
            unit_amount: parseDecimal(pricing.daily_rate).toFixed(2),
            total: (parseDecimal(pricing.daily_rate) * bookingDetails.days).toFixed(2)
          }
        ],
        fees: pricing.fees.map((fee: any) => ({
          code: fee.code,
          amount: parseDecimal(fee.amount).toFixed(2)
        })),
        taxes: pricing.taxes.map((tax: any) => ({
          code: tax.code,
          rate: tax.rate,
          amount: (parseDecimal(pricing.daily_rate) * bookingDetails.days * tax.rate).toFixed(2)
        })),
        discounts: [],
        grand_total: totalAmount.toFixed(2),
        computed_at: new Date().toISOString()
      },
      payment_summary: {
        status: "unpaid",
        paid_total: "0.00",
        outstanding: totalAmount.toFixed(2),
        last_payment_at: null
      },
      driver_snapshot: {
        full_name: bookingForm.fullName.trim(),
        phone: bookingForm.phone.trim(),
        email: cleanEmail, // Use cleaned email
        driver_license: {
          number: bookingForm.licenseNumber,
          country: bookingForm.licenseCountry,
          class: bookingForm.licenseClass,
          expires_at: new Date(bookingForm.licenseExpiry).toISOString(),
          verified: false
        }
      },
      notes: bookingForm.notes,
      // Add user_id if you have a field for it in your reservation model
      user_id: selectedUser._id
    };

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      console.log('Creating reservation with data:', bookingData);
      
      // Call the ReservationService to create the reservation
      const response = await ReservationService.createReservation(bookingData);
      
      console.log('Reservation response:', response);
      
      // Extract reservation ID from response
      let reservationId: string | undefined;
      let actualBookingCode: string;
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // Check for direct response
        reservationId = response._id || response.id;
        actualBookingCode = response.code || generatedBookingCode;
        
        // Check for nested responses
        if (!reservationId && response.data) {
          const data = response.data;
          reservationId = data._id || data.id;
          actualBookingCode = data.code || generatedBookingCode;
        }
        
        if (!reservationId && response.reservation) {
          const reservation = response.reservation;
          reservationId = reservation._id || reservation.id;
          actualBookingCode = reservation.code || generatedBookingCode;
        }
        
        // If still no reservationId, try to extract from any nested object
        if (!reservationId) {
          const findIdInObject = (obj: any): string | undefined => {
            if (obj._id) return obj._id;
            if (obj.id) return obj.id;
            if (obj.reservation_id) return obj.reservation_id;
            
            for (const key in obj) {
              if (typeof obj[key] === 'object' && obj[key] !== null) {
                const found = findIdInObject(obj[key]);
                if (found) return found;
              }
            }
            return undefined;
          };
          
          reservationId = findIdInObject(response);
        }
      } else {
        actualBookingCode = generatedBookingCode;
      }
      
      if (!reservationId) {
        // Try one more approach - look for any string that looks like an ID
        const responseString = JSON.stringify(response);
        const idMatch = responseString.match(/"[_a-zA-Z0-9]{20,}"/);
        if (idMatch) {
          reservationId = idMatch[0].replace(/"/g, '');
        }
      }
      
      if (!reservationId) {
        throw new Error('Reservation ID not found in response. Response: ' + JSON.stringify(response));
      }
      
      console.log('Extracted reservation ID:', reservationId);
      console.log('Booking code:', actualBookingCode);
      
      // Store ALL booking data including phone number for payment
      setBookingSuccessData({
        code: actualBookingCode,
        vehicle: pricing.name,
        total: formatCurrency(totalAmount),
        email: cleanEmail, // Use cleaned email
        phone: bookingForm.phone.trim(),
        fullName: bookingForm.fullName.trim(),
        reservationId: reservationId
      });
      
      setBookingCode(actualBookingCode);
      
      // Show payment modal instead of success popup
      setShowBookingModal(false);
      setShowPaymentModal(true);
      
      // Reset form but keep the selected user
      setBookingForm({
        fullName: bookingForm.fullName, // Keep name from selected user
        phone: bookingForm.phone, // Keep phone from selected user
        email: bookingForm.email, // Keep email from selected user
        licenseNumber: '',
        licenseCountry: 'ZW',
        licenseClass: '',
        licenseExpiry: '',
        notes: ''
      });
      
    } catch (error: any) {
      console.error('Booking failed:', error);
      
      let errorMessage = 'Failed to create booking. Please try again.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.response?.data) {
        const apiError = error.response.data;
        if (apiError.message) {
          errorMessage = apiError.message;
        } else if (apiError.error) {
          errorMessage = apiError.error;
        } else if (typeof apiError === 'string') {
          errorMessage = apiError;
        }
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Small Success Popup */}
      {showSuccessPopup && bookingSuccessData && (
        <div className="fixed top-6 right-6 z-50 max-w-md">
          <div className="bg-white rounded-xl shadow-2xl border border-green-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-green-100 text-sm">Reservation created successfully</p>
                </div>
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="ml-auto p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{bookingSuccessData.vehicle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Booking Code:</span>
                  <span className="font-bold text-blue-600">{bookingSuccessData.code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-green-600">{bookingSuccessData.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className="font-bold text-green-600">Paid ✓</span>
                </div>
                {bookingSuccessData.reservationId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Reservation ID:</span>
                    <span className="font-mono text-xs text-gray-500 truncate max-w-[120px]">
                      {bookingSuccessData.reservationId}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  A confirmation email has been sent to {bookingSuccessData.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Selection Section - At the top */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Book for a User</h2>
              <p className="text-blue-100">Select a user to book this vehicle for</p>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6" />
              <span className="font-medium">Total Users: {users.length}</span>
            </div>
          </div>

          <div className="relative" ref={userDropdownRef}>
            {selectedUser ? (
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{selectedUser.full_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-blue-100">
                        <span>{selectedUser.email}</span>
                        <span>•</span>
                        <span>{selectedUser.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedUser.roles.map((role, index) => (
                          <span key={index} className="px-2 py-1 bg-white/20 rounded text-xs">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleClearUser}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    title="Clear selection"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-amber-200 font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  No user selected. Please select a user to proceed with booking.
                </p>
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="w-full flex items-center justify-between bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white py-4 px-6 rounded-xl transition-all hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">
                    {selectedUser ? `Selected: ${selectedUser.full_name}` : 'Select a User'}
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showUserDropdown && (
                <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Loading users...</p>
                      </div>
                    ) : usersError ? (
                      <div className="p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                        <p className="text-red-600">{usersError}</p>
                        <button
                          onClick={fetchUsers}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-8 text-center">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">
                          {searchQuery ? 'No users found matching your search' : 'No users available'}
                        </p>
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => handleUserSelect(user)}
                          className={`p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${
                            selectedUser?._id === user._id ? 'bg-blue-100' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedUser?._id === user._id 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              <User className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-gray-900 truncate">{user.full_name}</h4>
                                {selectedUser?._id === user._id && (
                                  <Check className="w-4 h-4 text-green-600" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate">{user.email}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-gray-500">{user.phone}</span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  user.roles.includes('admin') ? 'bg-red-100 text-red-700' :
                                  user.roles.includes('agent') ? 'bg-blue-100 text-blue-700' :
                                  user.roles.includes('driver') ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {user.roles[0] || 'User'}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  user.status === 'active' ? 'bg-green-100 text-green-700' :
                                  user.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {user.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedUser && (
            <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ready to book for {selectedUser.full_name}</p>
                  <p className="text-sm text-blue-100">All fields will be pre-filled with user information</p>
                </div>
                <div className="flex items-center gap-2">
                  {vehicle.availability_state === 'available' ? (
                    <span className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full">
                      ✓ Vehicle Available
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
                      ✗ Vehicle Unavailable
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Complete Your Booking</h2>
                  <p className="text-blue-100">
                    Booking {pricing.name} for {selectedUser?.full_name}
                  </p>
                  <p className="text-blue-200 text-sm mt-1">
                    User: {selectedUser?.email} • {selectedUser?.phone}
                  </p>
                </div>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {submitError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-red-800 font-medium">{submitError}</p>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 border-blue-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Booking Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Vehicle</p>
                    <p className="font-bold text-gray-900">{pricing.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Location</p>
                    <p className="font-bold text-gray-900">{branch.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-bold text-gray-900">{bookingDetails.days} days</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Amount</p>
                    <p className="font-bold text-blue-600 text-lg">{formatCurrency(calculateTotal())}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-sm font-medium text-gray-700">Booking for:</p>
                  <p className="font-semibold text-gray-900">{selectedUser?.full_name}</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={bookingForm.fullName}
                      onChange={(e) => setBookingForm({...bookingForm, fullName: e.target.value})}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                      placeholder="+263771234567"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required for payment processing
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required for payment confirmation and receipts. Must be valid (e.g., john@example.com)
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <IdCard className="w-5 h-5 text-blue-600" />
                  Driver License Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      License Number *
                    </label>
                    <input
                      type="text"
                      value={bookingForm.licenseNumber}
                      onChange={(e) => setBookingForm({...bookingForm, licenseNumber: e.target.value})}
                      placeholder="DL1234567"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      License Country *
                    </label>
                    <select
                      value={bookingForm.licenseCountry}
                      onChange={(e) => setBookingForm({...bookingForm, licenseCountry: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    >
                      <option value="ZW">Zimbabwe (ZW)</option>
                      <option value="ZA">South Africa (ZA)</option>
                      <option value="US">United States (US)</option>
                      <option value="GB">United Kingdom (GB)</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      License Class
                    </label>
                    <input
                      type="text"
                      value={bookingForm.licenseClass}
                      onChange={(e) => setBookingForm({...bookingForm, licenseClass: e.target.value})}
                      placeholder="Class 4"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      License Expiry Date *
                    </label>
                    <input
                      type="date"
                      value={bookingForm.licenseExpiry}
                      onChange={(e) => setBookingForm({...bookingForm, licenseExpiry: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                  placeholder="Any special requests or information we should know..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-3xl border-t-2 border-gray-200">
              <div className="flex gap-4">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitBooking}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && bookingSuccessData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Complete Payment</h2>
                  <p className="text-emerald-100">Booking #{bookingSuccessData.code}</p>
                  <p className="text-emerald-200 text-sm mt-1">
                    For: {selectedUser?.full_name}
                  </p>
                  {bookingSuccessData.reservationId && (
                    <p className="text-emerald-200 text-xs mt-1 font-mono">
                      Reservation ID: {bookingSuccessData.reservationId.substring(0, 8)}...
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  disabled={isProcessingPayment || isPollingPayment}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {paymentError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-red-800 font-medium">{paymentError}</p>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border-2 border-emerald-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Payment Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Vehicle</p>
                    <p className="font-bold text-gray-900">{bookingSuccessData.vehicle}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Booking Code</p>
                    <p className="font-bold text-emerald-600">{bookingSuccessData.code}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Amount to Pay</p>
                    <p className="font-bold text-emerald-600 text-lg">{bookingSuccessData.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className="font-bold text-amber-600">Payment Required</p>
                  </div>
                </div>
                {bookingSuccessData.reservationId && (
                  <div className="mt-3 pt-3 border-t border-emerald-200">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Reservation ID:</span>{' '}
                      <span className="font-mono">{bookingSuccessData.reservationId}</span>
                    </p>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Phone for payment:</span>{' '}
                    <span className="font-mono">{bookingSuccessData.phone}</span>
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Email for confirmation:</span>{' '}
                    <span className="font-mono">{bookingSuccessData.email}</span>
                  </p>
                </div>
                {selectedUser && (
                  <div className="mt-3 pt-3 border-t border-emerald-200">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Booked for user:</span>{' '}
                      <span className="font-semibold">{selectedUser.full_name}</span>
                    </p>
                  </div>
                )}
              </div>

              {!paymentData.id && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    Select Payment Method
                  </h3>
                  
                  <div className="space-y-3">
                    <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedPaymentMethod === 'paynow' 
                        ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 shadow-md' 
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paynow"
                        checked={selectedPaymentMethod === 'paynow'}
                        onChange={() => setSelectedPaymentMethod('paynow')}
                        className="w-5 h-5 text-emerald-600 mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <QrCode className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900">PayNow (Zimbabwe)</span>
                            <p className="text-sm text-gray-600 mt-1">
                              Scan QR code or pay via online banking
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Phone: {bookingSuccessData.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedPaymentMethod === 'mobile' 
                        ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 shadow-md' 
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="mobile"
                        checked={selectedPaymentMethod === 'mobile'}
                        onChange={() => setSelectedPaymentMethod('mobile')}
                        className="w-5 h-5 text-emerald-600 mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Smartphone className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900">Mobile Money</span>
                            <p className="text-sm text-gray-600 mt-1">
                              EcoCash, OneMoney, Telecash &amp; other mobile wallets
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Phone: {bookingSuccessData.phone}
                            </p>
                            <p className="text-xs text-amber-600 mt-1 font-medium">
                              Valid email required: {bookingSuccessData.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {showPaymentInstructions && paymentData.mobilePaymentInstructions && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 border-blue-200">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    Mobile Payment Instructions
                  </h3>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <p className="whitespace-pre-line">{paymentData.mobilePaymentInstructions}</p>
                  </div>
                </div>
              )}

              {paymentData.id && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-200">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    Payment Status: {paymentData.status?.toUpperCase()}
                  </h3>
                  
                  {paymentData.redirectUrl && (
                    <div className="mb-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <ExternalLink className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-700">Redirecting to PayNow...</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          You should have been redirected to PayNow. If not, click the button below:
                        </p>
                        <button
                          onClick={handleOpenPaymentLink}
                          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-5 h-5" />
                          Go to PayNow Payment Page
                        </button>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-2">
                        <p><span className="font-medium">Payment URL:</span> <span className="text-xs font-mono truncate block">{paymentData.redirectUrl}</span></p>
                        {paymentData.pollUrl && (
                          <p><span className="font-medium">Poll URL:</span> <span className="text-xs font-mono truncate block">{paymentData.pollUrl}</span></p>
                        )}
                        {paymentData.guid && (
                          <p><span className="font-medium">Payment GUID:</span> <span className="text-xs font-mono">{paymentData.guid}</span></p>
                        )}
                      </div>
                    </div>
                  )}

                  {isPollingPayment && (
                    <div className="flex items-center gap-3 text-amber-700">
                      <svg className="animate-spin h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Waiting for payment confirmation...</span>
                    </div>
                  )}

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleCheckPaymentStatus}
                      className="flex-1 py-2 px-4 bg-emerald-100 text-emerald-700 font-medium rounded-lg hover:bg-emerald-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Check Payment Status
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-3xl border-t-2 border-gray-200">
              <div className="flex gap-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all"
                  disabled={isProcessingPayment || isPollingPayment}
                >
                  {paymentData.id ? 'Close' : 'Cancel'}
                </button>
                
                {!paymentData.id ? (
                  <button
                    onClick={handleInitiatePayment}
                    disabled={isProcessingPayment}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isProcessingPayment ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      `Pay ${bookingSuccessData.total}`
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setShowSuccessPopup(true);
                    }}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    View Booking Details
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Vehicle Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Overview with Enhanced Image Gallery */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-700 overflow-hidden">
                {primaryPhoto ? (
                  <img
                    src={primaryPhoto}
                    alt={pricing.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <span className="text-gray-400 text-lg font-medium">No Image Available</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Image Thumbnails */}
              {photos.length > 1 && (
                <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto">
                  {photos.map((photo: string | undefined, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPhoto(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedPhoto === index 
                          ? 'border-white shadow-lg scale-105' 
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`View ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
              
              <div className="absolute top-4 right-4 flex gap-2">
                <span className="px-4 py-2 bg-white/90 backdrop-blur-sm text-blue-600 text-sm font-bold rounded-full shadow-lg">
                  {pricing.vehicle_class.toUpperCase()}
                </span>
                <span className={`px-4 py-2 backdrop-blur-sm rounded-full text-sm font-bold shadow-lg ${
                  vehicle.availability_state === 'available' 
                    ? 'bg-green-500/90 text-white'
                    : 'bg-red-500/90 text-white'
                }`}>
                  {vehicle.availability_state === 'available' ? '✓ Available' : '✗ Unavailable'}
                </span>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{pricing.name}</h2>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{vehicle.metadata?.year || 'Year N/A'}</span>
                    <span className="mx-2">•</span>
                    <span className="text-sm">{vehicle.color}</span>
                  </div>
                </div>
                <div className="text-right bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-200">
                  <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {formatCurrency(parseDecimal(pricing.daily_rate))}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">/day</p>
                  <p className="text-xs text-gray-500 mt-1">+ taxes & fees</p>
                </div>
              </div>

              {/* Vehicle Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { icon: Users, label: 'Seats', value: vehicle.metadata?.seats || 'N/A', color: 'blue' },
                  { icon: DoorOpen, label: 'Doors', value: vehicle.metadata?.doors || 'N/A', color: 'cyan' },
                  { icon: Fuel, label: 'Fuel Type', value: vehicle.metadata?.fuel_type || 'N/A', color: 'green' },
                  { icon: Cog, label: 'Transmission', value: vehicle.metadata?.transmission || 'N/A', color: 'purple' }
                ].map((stat, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                    <stat.icon className={`w-6 h-6 text-${stat.color}-500 mb-2`} />
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className="font-bold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Pickup Location */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Pickup Location</h3>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">{branch.name}</p>
                  {branch.address && (
                    <p className="text-sm text-gray-700 flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                      {branch.address}
                    </p>
                  )}
                  {branch.phone && (
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-500" />
                      {branch.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Features & Specifications */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-500" />
              Features & Specifications
            </h3>
            
            {vehicle.metadata?.features && vehicle.metadata.features.length > 0 && (
              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-4">Key Features</h4>
                <div className="flex flex-wrap gap-3">
                  {vehicle.metadata.features.map((feature: string, index: number) => (
                    <span key={index} className="px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200 hover:shadow-md transition-shadow">
                      ✓ {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-gray-900 mb-4 text-lg">Vehicle Details</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Plate Number', value: vehicle.plate_number },
                    { label: 'Color', value: vehicle.color },
                    { label: 'VIN', value: vehicle.vin },
                    { label: 'Odometer', value: `${vehicle.odometer_km.toLocaleString()} km` }
                  ].map((detail, index) => (
                    <div key={index} className="flex justify-between py-3 border-b border-gray-200 hover:bg-gray-50 px-2 rounded transition-colors">
                      <span className="text-gray-600 font-medium">{detail.label}</span>
                      <span className="font-semibold text-gray-900">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-4 text-lg">Pricing Options</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Weekly Rate', value: formatCurrency(parseDecimal(pricing.weekly_rate)) },
                    { label: 'Weekend Rate', value: formatCurrency(parseDecimal(pricing.weekend_rate)) },
                    { label: 'Monthly Rate', value: formatCurrency(parseDecimal(pricing.monthly_rate)) },
                    { label: 'Currency', value: pricing.currency }
                  ].map((detail, index) => (
                    <div key={index} className="flex justify-between py-3 border-b border-gray-200 hover:bg-gray-50 px-2 rounded transition-colors">
                      <span className="text-gray-600 font-medium">{detail.label}</span>
                      <span className="font-bold text-blue-600">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance & Service Section */}
          <ServiceMaintenanceSection
            vehicle={vehicle}
            serviceOrders={serviceOrders}
            serviceSchedules={serviceSchedules}
            loadingServiceOrders={loadingServiceOrders}
            loadingServiceSchedules={loadingServiceSchedules}
            formatDate={formatDate}
          />

          {/* Notes & Information */}
          {(pricing.notes || vehicle.metadata?.notes) && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Important Information</h3>
              </div>
              <p className="text-amber-900 leading-relaxed">{pricing.notes || vehicle.metadata?.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column - Booking Summary (Sticky) */}
        <div className="space-y-6">
          <div className="lg:sticky lg:top-28 space-y-6">
            {/* Booking Dates */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Select Dates
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={bookingDetails.startDate}
                    onChange={(e) => setBookingDetails({...bookingDetails, startDate: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={bookingDetails.endDate}
                    onChange={(e) => setBookingDetails({...bookingDetails, endDate: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rental Days
                  </label>
                  <div className="flex items-center">
                    <button
                      onClick={() => setBookingDetails({...bookingDetails, days: Math.max(1, bookingDetails.days - 1)})}
                      className="px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-l-xl hover:from-blue-600 hover:to-cyan-600 transition-all"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={bookingDetails.days}
                      onChange={(e) => setBookingDetails({...bookingDetails, days: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-3 border-y-2 border-gray-200 text-center font-bold text-lg"
                      min="1"
                    />
                    <button
                      onClick={() => setBookingDetails({...bookingDetails, days: bookingDetails.days + 1})}
                      className="px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-r-xl hover:from-blue-600 hover:to-cyan-600 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Insurance Options */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Insurance Options
              </h3>
              
              <div className="space-y-3">
                {(['basic', 'premium', 'full'] as const).map((type) => (
                  <label key={type} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    bookingDetails.insurance === type 
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-md' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="insurance"
                      value={type}
                      checked={bookingDetails.insurance === type}
                      onChange={(e) => setBookingDetails({...bookingDetails, insurance: e.target.value as 'basic' | 'premium' | 'full'})}
                      className="w-5 h-5 text-blue-600 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold capitalize text-gray-900">{type} Coverage</span>
                        <span className="text-blue-600 font-bold text-lg">
                          {type === 'basic' ? '$15/day' : type === 'premium' ? '$25/day' : '$40/day'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {type === 'basic' ? 'Basic liability coverage' : 
                         type === 'premium' ? 'Extended coverage with lower deductible' :
                         'Full coverage with zero deductible'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4">Price Breakdown</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-blue-100">Daily Rate × {bookingDetails.days} days</span>
                  <span className="font-semibold">{formatCurrency(parseDecimal(pricing.daily_rate) * bookingDetails.days)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-blue-100">Insurance ({bookingDetails.insurance})</span>
                  <span className="font-semibold">
                    {formatCurrency((bookingDetails.insurance === 'basic' ? 15 : 
                      bookingDetails.insurance === 'premium' ? 25 : 40) * bookingDetails.days)}
                  </span>
                </div>
                
                {pricing.taxes.map((tax: { _id: Key | null | undefined; description: any; code: any; rate: number; }) => (
                  <div key={tax._id} className="flex justify-between">
                    <span className="text-blue-100">{tax.description || tax.code}</span>
                    <span className="font-semibold">{formatCurrency(parseDecimal(pricing.daily_rate) * bookingDetails.days * tax.rate)}</span>
                  </div>
                ))}
                
                {pricing.fees.map((fee: { _id: Key | null | undefined; description: any; code: any; amount: { $numberDecimal: string; }; }) => (
                  <div key={fee._id} className="flex justify-between">
                    <span className="text-blue-100">{fee.description || fee.code}</span>
                    <span className="font-semibold">{formatCurrency(parseDecimal(fee.amount))}</span>
                  </div>
                ))}
                
                <div className="pt-4 border-t-2 border-white/30 mt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total Amount</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                  <p className="text-blue-100 text-sm mt-1">Including all taxes and fees</p>
                </div>
              </div>

              <button
                onClick={handleConfirmBooking}
                disabled={vehicle.availability_state !== 'available' || !selectedUser}
                className={`w-full mt-4 py-4 rounded-xl font-bold text-lg transition-all transform ${
                  vehicle.availability_state === 'available' && selectedUser
                    ? 'bg-white text-blue-600 hover:scale-105 shadow-lg hover:shadow-xl'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
              >
                {!selectedUser ? '👤 Select a User First' :
                 vehicle.availability_state === 'available' ? '🚗 Confirm Booking' : 'Currently Unavailable'}
              </button>

              {vehicle.availability_state === 'available' && (
                <div className="mt-4 flex items-center justify-center text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>This vehicle is available for booking</span>
                </div>
              )}

              {!selectedUser && (
                <div className="mt-3 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                  <p className="text-amber-100 text-sm text-center">
                    Please select a user from the dropdown above to proceed with booking
                  </p>
                </div>
              )}
            </div>

            {/* Help & Support */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-blue-100 shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Flexible cancellation policy</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Secure payment processing</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Multiple payment methods</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;