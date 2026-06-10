import { useState, useEffect } from 'react';
import { 
  MapPin, Search, Menu, User, X, Loader2, 
  Star, Globe, Shield, 
  Briefcase, CheckCircle, AlertCircle
  } from 'lucide-react';
import Sidebar from '../../components/CustomerSidebar';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchDrivers } from '../../features/driver/driverthunks'; 
import { selectDrivers, selectLoading, selectError } from '../../features/driver/driverSelectors';
import BookingDriverService from '../../Services/boking_service';
import PaymentService from '../../Services/payment_service';
import {
  BookingFormModal,
  PaymentConfirmationModal,
  BookingsModal,
  BookingDrawer,
  SuccessMessage,
  ErrorMessage} from '../../components/drivers';
import type {
  Driver,
  Booking,
  ApiBooking,
  BookingFormData,
  BookingDrawerData
} from '../../drivertypes';

// Type guard to check if driver has the required properties
const isDriver = (driver: any): driver is Driver => {
  return (
    driver &&
    typeof driver === 'object' &&
    '_id' in driver &&
    'user_id' in driver &&
    'display_name' in driver &&
    'base_city' in driver
  );
};

const Drivers: React.FC = () => {
  const dispatch = useAppDispatch();
  const drivers = useAppSelector(selectDrivers) as unknown as Driver[] || [];
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);

  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [apiBookings, setApiBookings] = useState<ApiBooking[]>([]);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [showBookingDrawer, setShowBookingDrawer] = useState(false);
  const [showBookingFormModal, setShowBookingFormModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentInitiationModal, setShowPaymentInitiationModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showPaymentError, setShowPaymentError] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [bookingDrawerData, setBookingDrawerData] = useState<BookingDrawerData | null>(null);
  const [bookingFormData, setBookingFormData] = useState<BookingFormData>({
    customer_id: "",
    driver_profile_id: "",
    start_at: "",
    end_at: "",
    pickup_location: {
      label: "Home",
      address: "",
      latitude: 0,
      longitude: 0
    },
    dropoff_location: {
      label: "Home",
      address: "",
      latitude: 0,
      longitude: 0
    },
    notes: "",
    pricing: {
      currency: "USD",
      hours_requested: 1
    }
  });
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string>('');
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<ApiBooking | null>(null);
  const [paymentInitiationData, setPaymentInitiationData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'paynow' | 'mobile' | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string>('');
  const [paymentErrorMessage, setPaymentErrorMessage] = useState<string>('');
  const [redirectUrls, setRedirectUrls] = useState<{
    redirectUrl?: string;
    pollUrl?: string;
  }>({});

  // Get customer ID from localStorage
  const getCustomerId = () => {
    const customer = localStorage.getItem('customer');
    if (customer) {
      try {
        const customerData = JSON.parse(customer);
        return customerData._id || "";
      } catch (e) {
        console.error('Error parsing customer data:', e);
        return "";
      }
    }
    return "";
  };

  // Get customer email and phone from localStorage
  const getCustomerContactInfo = () => {
    const customer = localStorage.getItem('customer');
    if (customer) {
      try {
        const customerData = JSON.parse(customer);
        return {
          email: customerData.email || "",
          phone: customerData.phone || ""
        };
      } catch (e) {
        console.error('Error parsing customer data:', e);
        return { email: "", phone: "" };
      }
    }
    return { email: "", phone: "" };
  };

  // Get unique locations from drivers data
  const uniqueLocations = drivers && drivers.length > 0 
    ? ['All', ...new Set(drivers.map(driver => driver.base_city).filter(Boolean) as string[])]
    : ['All', 'Harare', 'Mutare', 'Bulawayo', 'Gweru'];

  useEffect(() => {
    dispatch(fetchDrivers());
  }, [dispatch]);

  // Initialize booking drawer data when a driver is selected
  useEffect(() => {
    if (selectedDriver) {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setHours(9, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1);
      
      setBookingDrawerData({
        driver: selectedDriver,
        hours: 1,
        totalAmount: selectedDriver.hourly_rate,
        bookingDate: now.toISOString().split('T')[0],
        specialInstructions: ''
      });
    }
  }, [selectedDriver]);

  // Load bookings from API
  const loadBookingsFromAPI = async () => {
    try {
      setIsLoadingBookings(true);
      const response = await BookingDriverService.getMyBookings();
      
      let bookingsData = [];
      if (response && response.data && Array.isArray(response.data)) {
        bookingsData = response.data;
      } else if (response && Array.isArray(response)) {
        bookingsData = response;
      } else if (response && response.bookings && Array.isArray(response.bookings)) {
        bookingsData = response.bookings;
      }
      
      if (bookingsData.length > 0) {
        setApiBookings(bookingsData);
        
        const localBookings: Booking[] = bookingsData.map((apiBooking: ApiBooking) => ({
          id: Date.now() + Math.random(),
          driverName: apiBooking.driver_profile_id?.user_id?.full_name || 'Unknown Driver',
          price: apiBooking.driver_profile_id?.hourly_rate || 0,
          location: apiBooking.pickup_location?.address || 'No location',
          date: new Date(apiBooking.start_at).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          driverId: apiBooking.driver_profile_id?._id || '',
          hours: apiBooking.pricing?.hours_requested || 1,
          totalAmount: (apiBooking.driver_profile_id?.hourly_rate || 0) * (apiBooking.pricing?.hours_requested || 1),
          status: apiBooking.status
        }));
        
        setBookings(localBookings);
      } else {
        setApiBookings([]);
        setBookings([]);
      }
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      setApiBookings([]);
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  // Load bookings when modal is opened
  useEffect(() => {
    if (showBookingsModal) {
      loadBookingsFromAPI();
    }
  }, [showBookingsModal]);

  const filteredDrivers = drivers ? drivers.filter(driver => {
    if (!isDriver(driver)) return false;
    
    const matchSearch = driver.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.base_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.user_id.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLocation = selectedLocation === 'All' ? true : driver.base_city === selectedLocation;
    const isAvailable = driver.is_available;

    return matchSearch && matchLocation && isAvailable;
  }) : [];

  const handleBookDriver = (driver: Driver) => {
    if (!isDriver(driver)) {
      console.error('Invalid driver object:', driver);
      return;
    }
    
    setSelectedDriver(driver);
    setShowBookingDrawer(true);
  };

  const handleConfirmBooking = () => {
    if (!selectedDriver || !bookingDrawerData) return;

    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(9, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + bookingDrawerData.hours);

    setBookingFormData({
      customer_id: getCustomerId(),
      driver_profile_id: selectedDriver._id,
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      pickup_location: {
        label: "Home",
        address: "",
        latitude: -17.8292,
        longitude: 31.053
      },
      dropoff_location: {
        label: "Home",
        address: "",
        latitude: -17.8292,
        longitude: 31.053
      },
      notes: bookingDrawerData.specialInstructions,
      pricing: {
        currency: "USD",
        hours_requested: bookingDrawerData.hours
      }
    });

    setShowBookingDrawer(false);
    setShowBookingFormModal(true);
  };

  const handleCreateBooking = async () => {
    if (!selectedDriver) return;
    
    try {
      if (!bookingFormData.pickup_location.address || !bookingFormData.dropoff_location.address) {
        alert("Please fill in both pickup and dropoff locations");
        return;
      }

      if (!bookingFormData.start_at) {
        alert("Please select a start date and time");
        return;
      }

      setIsCreatingBooking(true);
      
      const bookingData = {
        ...bookingFormData,
        customer_id: getCustomerId(),
        driver_profile_id: selectedDriver._id,
        pickup_location: {
          ...bookingFormData.pickup_location,
          latitude: parseFloat(bookingFormData.pickup_location.latitude.toString()),
          longitude: parseFloat(bookingFormData.pickup_location.longitude.toString())
        },
        dropoff_location: {
          ...bookingFormData.dropoff_location,
          latitude: parseFloat(bookingFormData.dropoff_location.latitude.toString()),
          longitude: parseFloat(bookingFormData.dropoff_location.longitude.toString())
        },
        pricing: {
          ...bookingFormData.pricing,
          hours_requested: parseInt(bookingFormData.pricing.hours_requested.toString())
        }
      };

      const response = await BookingDriverService.createBooking(bookingData);
      
      let bookingId = null;
      let bookingResponse = null;
      
      if (response.data && response.data._id) {
        bookingId = response.data._id;
        bookingResponse = response.data;
      } else if (response._id) {
        bookingId = response._id;
        bookingResponse = response;
      }
      
      setCreatedBookingId(bookingId);
      
      // Prepare payment initiation data
      const totalAmount = selectedDriver.hourly_rate * bookingFormData.pricing.hours_requested;
      const contactInfo = getCustomerContactInfo();
      
      setPaymentInitiationData({
        bookingId: bookingId,
        driverId: selectedDriver._id,
        driverEmail: selectedDriver.user_id.email || '',
        driverPhone: selectedDriver.user_id.phone || '',
        customerEmail: contactInfo.email,
        customerPhone: contactInfo.phone,
        amount: totalAmount,
        hours: bookingFormData.pricing.hours_requested,
        hourlyRate: selectedDriver.hourly_rate,
        driverName: selectedDriver.user_id.full_name,
        bookingDate: new Date().toISOString(),
        driver_booking_id: bookingId // CRITICAL: Add driver_booking_id here
      });

      // Update email and mobile number from contact info
      setEmail(contactInfo.email);
      setMobileNumber(contactInfo.phone);
      
      const newBooking: Booking = {
        id: Date.now(),
        driverName: selectedDriver.user_id.full_name,
        price: selectedDriver.hourly_rate,
        location: bookingFormData.pickup_location.address,
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        driverId: selectedDriver._id,
        hours: bookingFormData.pricing.hours_requested,
        totalAmount: totalAmount,
        status: 'pending'
      };

      setBookings([newBooking, ...bookings]);
      
      // Close booking form and show payment initiation modal
      setShowBookingFormModal(false);
      setShowPaymentInitiationModal(true);
      
      // Reset messages
      setPaymentSuccessMessage('');
      setPaymentErrorMessage('');
      
      // Reset driver selection
      setSelectedDriver(null);
      setBookingDrawerData(null);
      
    } catch (error: any) {
      console.error('Error creating booking:', error);
      alert(`❌ Failed to create booking: ${error.message || 'Please try again.'}`);
    } finally {
      setIsCreatingBooking(false);
    }
  };

  // Handle payment initiation with PayNow
  const handlePayNowPayment = async () => {
    if (!paymentInitiationData || !paymentInitiationData.driver_booking_id) {
      setPaymentErrorMessage('Booking ID is missing. Please try booking again.');
      return;
    }

    try {
      setIsProcessingPayment(true);
      setPaymentErrorMessage('');
      setPaymentSuccessMessage('');

      const paymentData = {
        amount: paymentInitiationData.amount,
        currency: "USD",
        reference: `DRIVER-${paymentInitiationData.bookingId}`,
        description: `Driver booking: ${paymentInitiationData.driverName} for ${paymentInitiationData.hours} hour(s)`,
        customer_email: email || paymentInitiationData.customerEmail,
        customer_mobile: mobileNumber || paymentInitiationData.customerPhone,
        booking_id: paymentInitiationData.bookingId,
        driver_id: paymentInitiationData.driverId,
        driver_booking_id: paymentInitiationData.driver_booking_id,
        metadata: {
          driver_name: paymentInitiationData.driverName,
          hours: paymentInitiationData.hours,
          hourly_rate: paymentInitiationData.hourlyRate,
          booking_date: paymentInitiationData.bookingDate
        }
      };

      console.log('Sending payment data:', paymentData);

      const response = await PaymentService.initiatePayment(paymentData);
      
      console.log('Payment response:', response);
      
      if (response && response.success) {
        if (response.redirectUrl || response.redirect_url) {
          // Store redirect URLs from response
          const redirectUrl = response.redirectUrl || response.redirect_url;
          const pollUrl = response.pollUrl || response.poll_url;
          
          setRedirectUrls({
            redirectUrl,
            pollUrl
          });
          
          // Show success message
          setPaymentSuccessMessage('Payment initiated successfully! Redirecting to PayNow...');
          
          // Wait a moment to show the success message
          setTimeout(() => {
            // Redirect to PayNow payment page in new tab using the URL from response
            if (redirectUrl) {
              window.open(redirectUrl, '_blank');
            }
            
            // Poll for payment status if pollUrl is provided
            if (pollUrl) {
              pollPaymentStatus(paymentInitiationData.bookingId);
            } else {
              pollPaymentStatus(paymentInitiationData.bookingId);
            }
            
            // Close modal after a delay
            setTimeout(() => {
              setShowPaymentInitiationModal(false);
              setShowSuccessMessage(true);
              setTimeout(() => {
                setShowSuccessMessage(false);
              }, 5000);
            }, 2000);
          }, 1500);
        } else if (response.message) {
          setPaymentSuccessMessage(response.message);
        }
      } else {
        throw new Error(response?.message || 'Payment initiation failed');
      }
      
    } catch (error: any) {
      console.error('Error initiating PayNow payment:', error);
      
      // Handle specific error messages
      if (error.response?.data?.message) {
        setPaymentErrorMessage(error.response.data.message);
      } else if (error.message) {
        setPaymentErrorMessage(error.message);
      } else {
        setPaymentErrorMessage('Failed to initiate PayNow payment. Please try again.');
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle mobile payment initiation
  const handleMobilePayment = async () => {
    if (!paymentInitiationData || !paymentInitiationData.driver_booking_id) {
      setPaymentErrorMessage('Booking ID is missing. Please try booking again.');
      return;
    }

    const phoneNumber = mobileNumber || paymentInitiationData.customerPhone;
    
    if (!phoneNumber) {
      setPaymentErrorMessage('Mobile number is required for mobile payments. Please enter your mobile number.');
      return;
    }

    try {
      setIsProcessingPayment(true);
      setPaymentErrorMessage('');
      setPaymentSuccessMessage('');

      const paymentData = {
        amount: paymentInitiationData.amount,
        currency: "USD",
        reference: `DRIVER-${paymentInitiationData.bookingId}`,
        description: `Driver booking: ${paymentInitiationData.driverName} for ${paymentInitiationData.hours} hour(s)`,
        mobile_number: phoneNumber,
        phone: phoneNumber, // Send both fields to ensure compatibility
        provider: "ecocash",
        booking_id: paymentInitiationData.bookingId,
        driver_id: paymentInitiationData.driverId,
        driver_booking_id: paymentInitiationData.driver_booking_id,
        metadata: {
          driver_name: paymentInitiationData.driverName,
          hours: paymentInitiationData.hours,
          hourly_rate: paymentInitiationData.hourlyRate,
          booking_date: paymentInitiationData.bookingDate
        }
      };

      console.log('Sending mobile payment data:', paymentData);

      const response = await PaymentService.initiateMobilePayment(paymentData);
      
      console.log('Mobile payment response:', response);
      
      if (response && response.success) {
        setPaymentSuccessMessage(response.message || 'Mobile payment request sent successfully! Check your phone for payment prompt.');
        
        // Poll for payment status
        pollPaymentStatus(paymentInitiationData.bookingId);
        
        // Close modal after a delay
        setTimeout(() => {
          setShowPaymentInitiationModal(false);
          setShowSuccessMessage(true);
          setTimeout(() => {
            setShowSuccessMessage(false);
          }, 5000);
        }, 3000);
      } else {
        throw new Error(response?.message || 'Mobile payment initiation failed');
      }
      
    } catch (error: any) {
      console.error('Error initiating mobile payment:', error);
      
      if (error.response?.data?.message) {
        setPaymentErrorMessage(error.response.data.message);
      } else if (error.message) {
        setPaymentErrorMessage(error.message);
      } else {
        setPaymentErrorMessage('Failed to initiate mobile payment. Please try again.');
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Poll payment status
  const pollPaymentStatus = async (bookingId: string) => {
    try {
      const response = await PaymentService.pollPaymentStatus(bookingId);
      
      if (response && response.status === 'paid') {
        // Update booking status
        setApiBookings(prev => 
          prev.map(booking => 
            booking._id === bookingId 
              ? { ...booking, status: 'paid', payment_status: 'completed' } 
              : booking
          )
        );
        
        console.log('Payment poll successful:', response);
      }
    } catch (error) {
      console.error('Error polling payment status:', error);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedBookingForPayment) {
      alert("No booking selected for payment.");
      return;
    }

    try {
      setIsConfirmingPayment(true);
      setPaymentError('');
      
      const response = await BookingDriverService.confirmPayment(selectedBookingForPayment._id);
      
      setApiBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === selectedBookingForPayment._id 
            ? { 
                ...booking, 
                status: 'paid' as const,
                payment_status: 'completed' as const
              } 
            : booking
        )
      );
      
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.driverId === selectedBookingForPayment.driver_profile_id._id 
            ? { ...booking, status: 'paid' as const }
            : booking
        )
      );
      
      setShowPaymentModal(false);
      setShowSuccessMessage(true);
      
      setSelectedBookingForPayment(null);
      
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      
      if (error.message && error.message.includes('Booking must be accepted by driver')) {
        setPaymentError('Driver has not accepted this booking yet. Please wait for driver confirmation or contact support.');
        setShowPaymentError(true);
      } else {
        setPaymentError(error.message || 'Failed to confirm payment. Please try again.');
        setShowPaymentError(true);
      }
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleBookingCardClick = (booking: ApiBooking) => {
    const bookingStatus = getSafeBookingStatus(booking);
    const paymentStatus = getSafePaymentStatus(booking);
    
    if (bookingStatus === 'accepted' && paymentStatus === 'pending') {
      setSelectedBookingForPayment(booking);
      setShowPaymentModal(true);
    } else if (bookingStatus === 'pending') {
      alert('This booking is still pending driver acceptance. You can only pay after the driver accepts.');
    } else if (bookingStatus === 'paid') {
      alert('This booking has already been paid.');
    } else if (bookingStatus === 'cancelled') {
      alert('This booking has been cancelled.');
    } else {
      alert(`Booking status: ${bookingStatus.toUpperCase()}`);
    }
  };

  const handleHoursChange = (hours: number) => {
    if (!bookingDrawerData || !selectedDriver) return;
    
    if (hours < 1) hours = 1;
    if (hours > 24) hours = 24;
    
    const totalAmount = hours * selectedDriver.hourly_rate;
    setBookingDrawerData({
      ...bookingDrawerData,
      hours,
      totalAmount
    });
  };

  const getDriverImage = (driver: Driver) => {
    if (!isDriver(driver)) {
      return `https://ui-avatars.com/api/?name=Driver&background=3b82f6&color=fff&size=256`;
    }
    
    return driver.identity_document?.imageUrl || 
           driver.driver_license?.imageUrl || 
           `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.user_id.full_name)}&background=3b82f6&color=fff&size=256`;
  };

  // Safe access functions
  const getSafeDriverName = (booking: ApiBooking) => {
    return booking?.driver_profile_id?.user_id?.full_name || '';
  };

  const getSafeDisplayName = (booking: ApiBooking) => {
    return booking?.driver_profile_id?.display_name || '';
  };

  const getSafeHourlyRate = (booking: ApiBooking) => {
    return booking?.driver_profile_id?.hourly_rate || 0;
  };

  const getSafeHoursRequested = (booking: ApiBooking) => {
    return booking?.pricing?.hours_requested || 1;
  };

  const getSafeBookingStatus = (booking: ApiBooking) => {
    return booking?.status || 'pending';
  };

  const getSafePaymentStatus = (booking: ApiBooking) => {
    return booking?.payment_status || 'pending';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-100 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Drivers</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => dispatch(fetchDrivers())}
            className="w-full bg-gradient-to-r from-blue-800 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-100 flex">
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col lg:ml-74 relative">
        <Navbar 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          driversCount={drivers.length}
        />

        <div className="flex-1 overflow-y-auto mt-20 p-4 md:p-8 max-w-7xl mx-auto w-full relative">
          {loading && <LoadingOverlay />}

          {/* Popup Messages */}
          {showSuccessMessage && (
            <SuccessMessage 
              message="Booking & Payment Successful!"
              subMessage="Your driver booking has been confirmed and paid."
              onClose={() => setShowSuccessMessage(false)}
            />
          )}

          {showPaymentError && (
            <ErrorMessage 
              message="Payment Error"
              subMessage={paymentError}
              onClose={() => setShowPaymentError(false)}
            />
          )}

          <HeaderSection 
            driversCount={drivers.length}
            filteredDriversCount={filteredDrivers.length}
            apiBookingsCount={apiBookings.length}
            onShowBookings={() => setShowBookingsModal(true)}
          />

          <SearchFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            uniqueLocations={uniqueLocations}
            driversCount={drivers.length}
            availableDriversCount={filteredDrivers.filter(d => d.is_available).length}
            filteredDriversCount={filteredDrivers.length}
          />

          {filteredDrivers.length === 0 ? (
            <NoDriversFound />
          ) : (
            <DriversGrid 
              drivers={filteredDrivers}
              getDriverImage={getDriverImage}
              handleBookDriver={handleBookDriver}
            />
          )}

          {/* Modals and Drawers */}
          {showBookingDrawer && selectedDriver && bookingDrawerData && (
            <BookingDrawer
              isOpen={showBookingDrawer}
              onClose={() => {
                setShowBookingDrawer(false);
                setSelectedDriver(null);
                setBookingDrawerData(null);
              }}
              driver={selectedDriver}
              driverImage={getDriverImage(selectedDriver)}
              drawerData={bookingDrawerData}
              onHoursChange={handleHoursChange}
              onSpecialInstructionsChange={(instructions) => 
                setBookingDrawerData({...bookingDrawerData, specialInstructions: instructions})
              }
              onConfirm={handleConfirmBooking}
            />
          )}

          {showBookingFormModal && selectedDriver && (
            <BookingFormModal
              isOpen={showBookingFormModal}
              onClose={() => {
                setShowBookingFormModal(false);
                setSelectedDriver(null);
                setBookingDrawerData(null);
              }}
              driver={selectedDriver}
              formData={bookingFormData}
              onFormDataChange={setBookingFormData}
              onCreateBooking={handleCreateBooking}
              isCreating={isCreatingBooking}
            />
          )}

          {/* Payment Initiation Modal */}
          {showPaymentInitiationModal && paymentInitiationData && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
                    <button
                      onClick={() => {
                        setShowPaymentInitiationModal(false);
                        setPaymentSuccessMessage('');
                        setPaymentErrorMessage('');
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  
                  {/* Success/Error Messages at the top */}
                  {paymentSuccessMessage && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{paymentSuccessMessage}</span>
                      </div>
                    </div>
                  )}
                  
                  {paymentErrorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{paymentErrorMessage}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Driver:</span>
                        <span className="font-semibold">{paymentInitiationData.driverName}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Booking ID:</span>
                        <span className="font-mono text-sm bg-blue-100 px-2 py-1 rounded">
                          {paymentInitiationData.bookingId.substring(0, 8)}...
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Hours:</span>
                        <span className="font-semibold">{paymentInitiationData.hours} hour(s)</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Rate:</span>
                        <span className="font-semibold">${paymentInitiationData.hourlyRate}/hour</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-blue-100">
                        <span className="text-lg font-bold text-gray-700">Total Amount:</span>
                        <span className="text-2xl font-bold text-blue-700">${paymentInitiationData.amount}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email for PayNow
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          disabled={isProcessingPayment}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile Number (required for mobile payments)
                        </label>
                        <input
                          type="tel"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          placeholder="Enter your mobile number (e.g., 0771234567)"
                          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          disabled={isProcessingPayment}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Mobile number is required for mobile payments
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 pt-4">
                        <button
                          onClick={() => {
                            setPaymentMethod('paynow');
                            handlePayNowPayment();
                          }}
                          disabled={isProcessingPayment}
                          className={`p-4 rounded-xl font-semibold transition-all flex items-center justify-center ${
                            isProcessingPayment && paymentMethod === 'paynow'
                              ? 'bg-gray-300 text-gray-500 cursor-wait'
                              : 'bg-gradient-to-r from-blue-800 to-cyan-600 text-white hover:opacity-90'
                          }`}
                        >
                          {isProcessingPayment && paymentMethod === 'paynow' ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            'Pay with PayNow'
                          )}
                        </button>
                        
                        <button
                          onClick={() => {
                            setPaymentMethod('mobile');
                            handleMobilePayment();
                          }}
                          disabled={isProcessingPayment || !mobileNumber}
                          className={`p-4 rounded-xl font-semibold transition-all flex items-center justify-center ${
                            isProcessingPayment && paymentMethod === 'mobile'
                              ? 'bg-gray-300 text-gray-500 cursor-wait'
                              : !mobileNumber
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:opacity-90'
                          }`}
                        >
                          {isProcessingPayment && paymentMethod === 'mobile' ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            'Mobile Payment'
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500 text-center pt-4">
                      Your booking will be confirmed once payment is completed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showPaymentModal && selectedBookingForPayment && (
            <PaymentConfirmationModal
              isOpen={showPaymentModal}
              onClose={() => {
                setShowPaymentModal(false);
                setSelectedBookingForPayment(null);
                setPaymentError('');
              }}
              booking={selectedBookingForPayment}
              onConfirmPayment={handleConfirmPayment}
              isConfirming={isConfirmingPayment}
              getDriverName={getSafeDriverName}
              getDisplayName={getSafeDisplayName}
              getHourlyRate={getSafeHourlyRate}
              getHoursRequested={getSafeHoursRequested}
              getBookingStatus={getSafeBookingStatus}
            />
          )}

          {showBookingsModal && (
            <BookingsModal
              isOpen={showBookingsModal}
              onClose={() => setShowBookingsModal(false)}
              bookings={apiBookings}
              isLoading={isLoadingBookings}
              onBookingClick={handleBookingCardClick}
              getDriverName={getSafeDriverName}
              getDisplayName={getSafeDisplayName}
              getHourlyRate={getSafeHourlyRate}
              getHoursRequested={getSafeHoursRequested}
              getBookingStatus={getSafeBookingStatus}
              getPaymentStatus={getSafePaymentStatus}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-components (same as before)
const Navbar: React.FC<{
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  driversCount: number;
}> = ({ setSidebarOpen, driversCount }) => (
  <nav className="fixed top-0 right-0 left-0 lg:left-74 z-40 bg-white/90 backdrop-blur-xl shadow-sm border-b border-blue-200 h-20">
    <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden mr-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      <div className="text-gray-700 font-semibold">Driver Booking System</div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600 hidden md:block">
          {driversCount} drivers available
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-500 flex items-center justify-center text-white font-bold">
          JD
        </div>
      </div>
    </div>
  </nav>
);

const LoadingOverlay: React.FC = () => (
  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-40">
    <div className="flex flex-col items-center">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      <p className="mt-3 text-gray-700 font-medium">Loading drivers…</p>
    </div>
  </div>
);

const HeaderSection: React.FC<{
  driversCount: number;
  filteredDriversCount: number;
  apiBookingsCount: number;
  onShowBookings: () => void;
}> = ({ driversCount, filteredDriversCount, apiBookingsCount, onShowBookings }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Available Drivers</h1>
      <p className="text-gray-600 mt-1">
        {driversCount} driver{driversCount !== 1 ? 's' : ''}
        {filteredDriversCount !== driversCount && (
          <span className="ml-2 text-blue-600 font-medium">
            ({filteredDriversCount} matching your search)
          </span>
        )}
      </p>
    </div>

    <button
      onClick={onShowBookings}
      className="flex items-center gap-2 bg-gradient-to-r from-blue-800 to-cyan-600 text-white px-5 md:px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-300 font-semibold w-full sm:w-auto justify-center"
    >
      <User className="w-5 h-5" />
      My Bookings
      {apiBookingsCount > 0 && (
        <span className="bg-white text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold ml-1">
          {apiBookingsCount}
        </span>
      )}
    </button>
  </div>
);

const SearchFilters: React.FC<{
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  uniqueLocations: string[];
  driversCount: number;
  availableDriversCount: number;
  filteredDriversCount: number;
}> = ({ 
  searchTerm, 
  setSearchTerm, 
  selectedLocation, 
  setSelectedLocation, 
  uniqueLocations,
  driversCount,
  availableDriversCount,
  filteredDriversCount
}) => (
  <div className="bg-white shadow-xl border border-blue-200 p-4 md:p-6 rounded-2xl mb-8 md:mb-10">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search drivers by name or location..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
      </div>

      <select
        value={selectedLocation}
        onChange={(e) => setSelectedLocation(e.target.value)}
        className="py-3 px-4 border border-gray-300 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
      >
        {uniqueLocations.map(loc => (
          <option key={loc} value={loc}>{loc}</option>
        ))}
      </select>
    </div>

    <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
        <span>Showing {filteredDriversCount} of {driversCount} drivers</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span>{availableDriversCount} available now</span>
      </div>
    </div>
  </div>
);

const NoDriversFound: React.FC = () => (
  <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-blue-200">
    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
      <Search className="w-10 h-10 text-gray-400" />
    </div>
    <h3 className="text-xl font-semibold text-gray-700 mb-2">No drivers found</h3>
    <p className="text-gray-500">Try changing your search criteria</p>
  </div>
);

const DriversGrid: React.FC<{
  drivers: Driver[];
  getDriverImage: (driver: Driver) => string;
  handleBookDriver: (driver: Driver) => void;
}> = ({ drivers, getDriverImage, handleBookDriver }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {drivers.map((driver) => (
      <div 
        key={driver._id} 
        className="bg-white rounded-2xl shadow-xl border border-blue-200 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
      >
        <div className="h-48 w-full overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50">
          <img 
            src={getDriverImage(driver)} 
            alt={driver.user_id.full_name}
            className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.user_id.full_name)}&background=3b82f6&color=fff&size=256`;
            }}
          />
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-blue-800 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            {driver.status === 'approved' ? 'Verified' : driver.status}
          </div>
          {!driver.is_available && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Unavailable
            </div>
          )}
        </div>
        
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 truncate">{driver.user_id.full_name}</h3>
              <p className="text-sm text-gray-500">{driver.display_name}</p>
            </div>
            {driver.is_available && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Available
              </span>
            )}
          </div>
          
          <p className="text-gray-600 flex items-center gap-2 mt-2">
            <MapPin className="w-4 h-4 flex-shrink-0" /> 
            <span className="truncate">{driver.base_city}, {driver.base_country}</span>
          </p>
          
          <div className="flex items-center justify-between mt-3">
            <span className="text-gray-500 text-sm flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              {driver.years_experience} years exp
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold text-gray-700">
                {driver.rating_average.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">({driver.rating_count})</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {driver.languages.slice(0, 2).map((lang, index) => (
                <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  <Globe className="w-3 h-3 inline mr-1" />
                  {lang}
                </span>
              ))}
              {driver.languages.length > 2 && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  +{driver.languages.length - 2} more
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <div>
              <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-800 to-cyan-500 bg-clip-text text-transparent">
                ${driver.hourly_rate}
              </span>
              <span className="text-gray-500 text-sm ml-1">/hour</span>
            </div>
            <button
              onClick={() => handleBookDriver(driver)}
              disabled={!driver.is_available}
              className={`px-4 md:px-5 py-2 rounded-xl font-semibold shadow transition-all ${
                driver.is_available 
                  ? 'bg-gradient-to-r from-blue-800 to-cyan-500 text-white hover:opacity-90' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {driver.is_available ? 'Book Now' : 'Unavailable'}
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default Drivers;