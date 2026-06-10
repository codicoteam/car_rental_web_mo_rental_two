import { useState, useEffect } from 'react';
import { 
  ChevronRight, MapPin, Menu, Bell, Users, Car as CarIcon, 
  Calendar, CheckCircle, AlertCircle, X, Award, Star, 
  Globe, Briefcase, CheckCircle as CheckCircleIcon,
  type LucideIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/CustomerSidebar';
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchVehicles } from '../../features/vehicles/vehiclesThunks';
import { selectVehicles, selectVehiclesLoading, selectVehiclesError } from '../../features/vehicles/vehiclesSelectors';
import { fetchDrivers } from '../../features/driver/driverthunks';
import { selectDrivers, selectLoading, selectError } from '../../features/driver/driverSelectors';
import { fetchReservations } from '../../features/reservation/reservationthunks';
import { selectReservations, selectReservationsLoading, selectReservationsError } from '../../features/reservation/reservationSelectors';

interface Pricing {
  _id: string;
  branch_id: { _id: string; name: string };
  vehicle_class: string;
  vehicle_id: {
    _id: string;
    plate_number: string;
    photos: string[];
    availability_state: string;
    status: string;
  };
  currency: string;
  daily_rate: { $numberDecimal: string };
  name: string;
  active: boolean;
}

interface Driver {
  _id: string;
  user_id: { _id: string; full_name: string };
  display_name: string;
  base_city: string;
  base_country: string;
  hourly_rate: number;
  bio: string;
  years_experience: number;
  languages: string[];
  identity_document?: { imageUrl: string };
  driver_license?: { imageUrl: string };
  status: string;
  is_available: boolean;
  rating_average: number;
  rating_count: number;
}

interface Reservation {
  _id: string;
  code: string;
  status: string;
  pickup: {
    branch_id: { name: string };
    at: string;
  };
  vehicle_id: {
    vehicle_model_id: { make: string; model: string };
    plate_number: string;
    photos: string[];
  };
  pricing: {
    total: number;
    currency: string;
  };
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface BookingDrawerData {
  driver: Driver;
  hours: number;
  totalAmount: number;
  bookingDate: string;
  specialInstructions: string;
}


interface StatCard {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bg: string;
  text: string;
}

const Dashboardy = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showBookingDrawer, setShowBookingDrawer] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [bookingDrawerData, setBookingDrawerData] = useState<BookingDrawerData | null>(null);
  const navigate = useNavigate();

  const dispatch = useAppDispatch();
  const vehicles = useAppSelector(selectVehicles);
  const vehiclesLoading = useAppSelector(selectVehiclesLoading);
  const vehiclesError = useAppSelector(selectVehiclesError);
  const drivers = useAppSelector(selectDrivers) as unknown as Driver[] || [];
  const driversLoading = useAppSelector(selectLoading);
  const driversError = useAppSelector(selectError);
  const reservations = useAppSelector(selectReservations);
  const reservationsLoading = useAppSelector(selectReservationsLoading);
  const reservationsError = useAppSelector(selectReservationsError);

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchDrivers());
    dispatch(fetchReservations());
  }, [dispatch]);

  useEffect(() => {
    if (selectedDriver) {
      setBookingDrawerData({
        driver: selectedDriver,
        hours: 1,
        totalAmount: selectedDriver.hourly_rate,
        bookingDate: new Date().toISOString().split('T')[0],
        specialInstructions: ''
      });
    }
  }, [selectedDriver]);

  const handleBookNow = (pricingInfo: Pricing) => navigate(`/book/${pricingInfo._id}`);
  const handleBookDriver = (driver: Driver) => {
    if (driver.is_available) {
      setSelectedDriver(driver);
      setShowBookingDrawer(true);
    }
  };
  const viewAll = (path: string) => navigate(path);

  const parseDecimal = (decimalObj: { $numberDecimal: string } | null | undefined): string => 
    !decimalObj?.$numberDecimal ? '0.00' : parseFloat(decimalObj.$numberDecimal).toFixed(2);

  const getPricingArray = (): Pricing[] => {
    if (!vehicles) return [];
    if (Array.isArray(vehicles)) return vehicles as unknown as Pricing[];
    const apiResponse = vehicles as any;
    return apiResponse?.data?.items || apiResponse?.items || [];
  };

  // const getReservationsArray = (): Reservation[] => {
  //   if (!reservations) return [];
  
  //   const apiResponse = reservations as any;
  //   return (apiResponse?.success && apiResponse.data) ? apiResponse.data.slice(0, 3) : [];
  // };

  const getReservationsArray = (): Reservation[] => {
  if (!reservations) return [];

  const apiResponse = reservations as any;
  
  // Handle different response structures
  let reservationsData = [];
  if (apiResponse?.success && Array.isArray(apiResponse.data)) {
    reservationsData = apiResponse.data;
  } else if (Array.isArray(apiResponse)) {
    reservationsData = apiResponse;
  } else if (apiResponse?.items && Array.isArray(apiResponse.items)) {
    reservationsData = apiResponse.items;
  } else {
    reservationsData = [];
  }
  
  // Add null checks for each reservation
  return reservationsData.slice(0, 3).map((res: any) => ({
    ...res,
    vehicle_id: res.vehicle_id || {},
    pickup: {
      ...res.pickup,
      branch_id: res.pickup?.branch_id || { name: 'Unknown Location' },
      at: res.pickup?.at || new Date().toISOString()
    },
    pricing: {
      total: res.pricing?.total || 0,
      currency: res.pricing?.currency || 'USD'
    }
  }));
};

  const statusColors: Record<string, string> = {
    "available": "bg-green-100 text-green-800",
    "reserved": "bg-blue-100 text-blue-800",
    "in_use": "bg-indigo-100 text-indigo-800",
    "maintenance": "bg-yellow-100 text-yellow-800",
  };

  const statusTexts: Record<string, string> = {
    "available": "Available",
    "reserved": "Reserved",
    "in_use": "In Use",
    "maintenance": "Maintenance",
  };

  const reservationStatusColors: Record<string, string> = {
    "pending": "bg-yellow-100 text-yellow-800",
    "confirmed": "bg-blue-100 text-blue-800",
    "active": "bg-cyan-100 text-cyan-800",
    "completed": "bg-green-100 text-green-800",
    "cancelled": "bg-red-100 text-red-800",
  };

  const formatDate = (dateString: string): string => 
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatCurrency = (amount: number, currency: string = 'USD'): string => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);

  const getDriverImage = (driver: Driver | null): string => {
    if (!driver) return `https://ui-avatars.com/api/?name=Driver&background=3b82f6&color=fff&size=256`;
    const imageUrl = driver.identity_document?.imageUrl || driver.driver_license?.imageUrl;
    return imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.user_id.full_name)}&background=3b82f6&color=fff&size=256`;
  };

  const getDriverStatusText = (driver: Driver): string => 
    driver.status === 'approved' && driver.is_available ? 'Available' : 
    !driver.is_available ? 'Unavailable' : 
    driver.status.charAt(0).toUpperCase() + driver.status.slice(1);

  const handleConfirmBooking = () => {
    if (!selectedDriver || !bookingDrawerData) return;
    setShowBookingDrawer(false);
    setSelectedDriver(null);
    setBookingDrawerData(null);
    alert(`✅ Booking confirmed! ${selectedDriver.user_id.full_name} has been booked for ${bookingDrawerData.hours} hour(s) at $${bookingDrawerData.totalAmount}`);
  };

  const handleHoursChange = (hours: number) => {
    if (!bookingDrawerData || !selectedDriver) return;
    const newHours = Math.max(1, Math.min(24, hours));
    setBookingDrawerData({ ...bookingDrawerData, hours: newHours, totalAmount: newHours * selectedDriver.hourly_rate });
  };

  const pricingArray = getPricingArray();
  const recentVehicles = pricingArray.slice(0, 3);
  const recentDrivers = drivers.filter(d => d.is_available && d.status === 'approved').slice(0, 3);
  const recentReservations = getReservationsArray();

  const stats = {
    totalTrips: recentReservations.length,
    activeBookings: recentReservations.filter(r => r.status === 'active' || r.status === 'confirmed').length,
    availableDrivers: recentDrivers.length,
    totalSpent: recentReservations.reduce((sum, r) => sum + (r.pricing?.total || 0), 0)
  };

  const notifications: NotificationItem[] = [
    { id: 1, title: "Booking Confirmed", message: "Your vehicle booking has been confirmed", time: "5 min ago", read: false },
    { id: 2, title: "Driver Assigned", message: "Driver has been assigned to your trip", time: "1 hour ago", read: false },
    { id: 3, title: "Payment Received", message: "Payment processed successfully", time: "2 hours ago", read: true }
  ];

  const statCards: StatCard[] = [
    { label: "Total Trips", value: stats.totalTrips, icon: CarIcon, color: "blue", bg: "bg-blue-100", text: "text-blue-600" },
    { label: "Active Bookings", value: stats.activeBookings, icon: CheckCircle, color: "green", bg: "bg-green-100", text: "text-green-600" },
    { label: "Available Drivers", value: stats.availableDrivers, icon: Users, color: "purple", bg: "bg-purple-100", text: "text-purple-600" },
    { label: "Total Spent", value: formatCurrency(stats.totalSpent), icon: Calendar, color: "cyan", bg: "bg-cyan-100", text: "text-cyan-600" }
  ];

  const LoadingSpinner = ({ message }: { message: string }) => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="ml-4 text-gray-600">{message}</p>
    </div>
  );

  const ErrorMessage = ({ error }: { error: string }) => (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>
      <p className="text-lg text-red-600 font-semibold">Error loading data</p>
      <p className="text-red-500 text-sm mt-1">{error}</p>
    </div>
  );

  const EmptyState = ({ icon: Icon, title, message }: { icon: any; title: string; message: string }) => (
    <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-200">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-lg font-semibold text-gray-700 mb-2">{title}</p>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );

  const NotificationsPanel = () => (
    <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200 flex justify-between">
        <h3 className="font-bold text-gray-800">Notifications</h3>
        <span className="text-sm text-gray-500">{notifications.filter(n => !n.read).length} unread</span>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.map((n) => (
          <div key={n.id} className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${!n.read ? 'bg-blue-50' : ''}`}>
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${!n.read ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div>
                <p className="font-semibold text-gray-800">{n.title}</p>
                <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                <p className="text-xs text-gray-400 mt-2">{n.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-200">
        <button className="w-full text-blue-700 hover:text-blue-800 font-medium text-sm">View All Notifications</button>
      </div>
    </div>
  );

  const BookingDrawer = () => {
    if (!selectedDriver || !bookingDrawerData) return null;
    
    return (
      <div className="fixed inset-y-0 right-0 z-50 w-full md:w-2/3 lg:w-1/2 xl:w-1/3 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
        <div className="h-full flex flex-col">
          <div className="bg-gradient-to-r from-blue-800 to-cyan-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Confirm Booking</h2>
                <p className="text-blue-100 mt-1">Complete your booking with {selectedDriver.user_id.full_name}</p>
              </div>
              <button 
                onClick={() => { 
                  setShowBookingDrawer(false); 
                  setSelectedDriver(null); 
                  setBookingDrawerData(null); 
                }} 
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <img 
                    src={getDriverImage(selectedDriver)} 
                    alt={selectedDriver.user_id.full_name} 
                    className="h-full w-full object-cover" 
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedDriver.user_id.full_name}</h3>
                  <p className="text-gray-600">{selectedDriver.display_name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{selectedDriver.base_city}, {selectedDriver.base_country}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-700">Experience</span>
                </div>
                <p className="text-gray-600">{selectedDriver.years_experience} years</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold text-gray-700">Rating</span>
                </div>
                <p className="text-gray-600">{selectedDriver.rating_average.toFixed(1)} ({selectedDriver.rating_count} reviews)</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Languages Spoken</h4>
              <div className="flex flex-wrap gap-2">
                {selectedDriver.languages.map((lang, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">About Driver</h4>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-xl text-sm">{selectedDriver.bio}</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hours Required</label>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleHoursChange(bookingDrawerData.hours - 1)} 
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-bold text-gray-900">{bookingDrawerData.hours}</span>
                      <span className="text-gray-600 ml-2">hour(s)</span>
                    </div>
                    <button 
                      onClick={() => handleHoursChange(bookingDrawerData.hours + 1)} 
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Booking Date</label>
                  <input 
                    type="date" 
                    value={bookingDrawerData.bookingDate} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setBookingDrawerData({ ...bookingDrawerData, bookingDate: e.target.value })
                    } 
                    min={new Date().toISOString().split('T')[0]} 
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions (Optional)</label>
                  <textarea 
                    value={bookingDrawerData.specialInstructions} 
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setBookingDrawerData({ ...bookingDrawerData, specialInstructions: e.target.value })
                    } 
                    placeholder="Any special requirements or instructions..." 
                    rows={2} 
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm" 
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <h5 className="font-semibold text-gray-700 mb-3">Pricing Summary</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hourly Rate</span>
                      <span className="font-medium">${selectedDriver.hourly_rate}/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hours</span>
                      <span className="font-medium">{bookingDrawerData.hours}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                        <span className="text-2xl font-bold text-blue-800">${bookingDrawerData.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => { 
                  setShowBookingDrawer(false); 
                  setSelectedDriver(null); 
                  setBookingDrawerData(null); 
                }} 
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex-1"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmBooking} 
                className="px-6 py-3 bg-gradient-to-r from-blue-800 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:opacity-90 transition-opacity flex-1 flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="w-5 h-5" />Confirm Booking
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">By confirming, you agree to our terms and conditions</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900/5 via-cyan-100/30 to-blue-500/10 flex">
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col lg:ml-74">
        <nav className="fixed top-0 right-0 left-0 lg:left-74 z-40 bg-white/90 backdrop-blur-xl shadow-sm border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200">
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600">Dashboard</span>
                  <span className="text-gray-300">›</span>
                  <span className="text-gray-900 font-semibold">Customer Dashboard</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="relative p-2 rounded-xl bg-gray-100 hover:bg-gray-200">
                    <Bell className="w-5 h-5 text-gray-600" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </button>
                  {notificationsOpen && <NotificationsPanel />}
                </div>

                <div className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-2 cursor-pointer">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-800">John Doe</p>
                    <p className="text-xs text-gray-500">Customer</p>
                  </div>
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-800 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-semibold text-sm">JD</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex-1 overflow-y-auto pt-20">
          <div className="max-w-7xl mx-auto p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, John!</h2>
              <p className="text-gray-600 text-lg">Here's what's happening with your bookings today</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat, idx) => {
                const IconComponent = stat.icon;
                return (
                  <div key={idx} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                        <IconComponent className={`w-6 h-6 ${stat.text}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recent Vehicles</h2>
                <button onClick={() => viewAll('/dashboardy')} className="text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-2">
                  View All Vehicles <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {vehiclesLoading && <LoadingSpinner message="Loading vehicles..." />}
              {vehiclesError && !vehiclesLoading && <ErrorMessage error={vehiclesError} />}

              {!vehiclesLoading && !vehiclesError && recentVehicles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {recentVehicles.map((pricing) => {
  const vehicle = pricing.vehicle_id;
  const isAvailable = pricing.active && vehicle?.availability_state === 'available';
  
  return (
    <div key={pricing._id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
        {/* Fix: Add optional chaining for vehicle.photos */}
        {vehicle?.photos?.[0] ? (
          <img 
            src={vehicle.photos[0]} 
            alt={pricing.name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <CarIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusColors[vehicle?.availability_state] || "bg-gray-100 text-gray-800"}`}>
            {statusTexts[vehicle?.availability_state] || "Unavailable"}
          </span>
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800">
            {pricing.vehicle_class?.toUpperCase() || 'STANDARD'}
          </span>
        </div>
      </div>

          <div className="p-5 flex-1 flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{pricing.name || 'Unnamed Vehicle'}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <MapPin className="w-4 h-4" />
              <span>{pricing.branch_id?.name || 'Unknown Location'}</span>
            </div>
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Daily rate</p>
                  <p className="text-xl font-bold text-blue-700">
                    ${parseDecimal(pricing.daily_rate)}
                    <span className="text-sm text-gray-500 ml-1">/{pricing.currency || 'USD'}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => handleBookNow(pricing)} 
                disabled={!isAvailable} 
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  isAvailable ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-white shadow-md' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isAvailable ? 'Book Now' : 'Unavailable'}
              </button>
            </div>
          </div>
        </div>
      );
    })}
                </div>
              )}

              {!vehiclesLoading && !vehiclesError && recentVehicles.length === 0 && (
                <EmptyState icon={CarIcon} title="No vehicles available" message="Check back later for available vehicles." />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Available Drivers</h2>
                  <button onClick={() => viewAll('/driver')} className="text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-2">
                    View All <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {driversLoading && <LoadingSpinner message="Loading drivers..." />}
                {driversError && !driversLoading && <ErrorMessage error={driversError} />}

                {!driversLoading && !driversError && recentDrivers.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Driver</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Location</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Rate</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {recentDrivers.map((driver) => (
                            <tr 
                              key={driver._id} 
                              className="hover:bg-gray-50 cursor-pointer" 
                              onClick={() => handleBookDriver(driver)}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={getDriverImage(driver)} 
                                    alt={driver.user_id.full_name} 
                                    className="w-10 h-10 rounded-full object-cover" 
                                  />
                                  <div>
                                    <p className="font-medium text-gray-900">{driver.user_id.full_name}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                      <Briefcase className="w-3 h-3" />
                                      {driver.years_experience} yrs exp
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <MapPin className="w-3 h-3" />
                                  {driver.base_city}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">${driver.hourly_rate}</span>
                                  <span className="text-xs text-gray-500">per hour</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${driver.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {getDriverStatusText(driver)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {!driversLoading && !driversError && recentDrivers.length === 0 && (
                  <EmptyState icon={Users} title="No drivers available" message="Check back later for available drivers." />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Recent Reservations</h2>
                  <button onClick={() => viewAll('/reservations')} className="text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-2">
                    View All <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {reservationsLoading && <LoadingSpinner message="Loading reservations..." />}
                {reservationsError && !reservationsLoading && <ErrorMessage error={reservationsError} />}

                {!reservationsLoading && !reservationsError && recentReservations.length > 0 && (
  <div className="space-y-4">
    {recentReservations.map((reservation) => {
      const vehicle = reservation.vehicle_id;
      
      return (
        <div key={reservation._id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
              {/* Fix: Add optional chaining and null checks */}
              {vehicle?.photos?.[0] ? (
                <img 
                  src={vehicle.photos[0]} 
                  alt={`${vehicle?.vehicle_model_id?.make || 'Vehicle'} ${vehicle?.vehicle_model_id?.model || ''}`} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <CarIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {vehicle?.vehicle_model_id?.make || 'Vehicle'} {vehicle?.vehicle_model_id?.model || ''}
                  </p>
                  <p className="text-sm text-gray-500">
                    {vehicle?.plate_number ? `Plate: ${vehicle.plate_number}` : 'No plate'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${reservationStatusColors[reservation.status.toLowerCase()] || "bg-gray-100 text-gray-800"}`}>
                  {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Pickup: {formatDate(reservation.pickup.at)}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-blue-700">
                      {formatCurrency(reservation.pricing?.total || 0, reservation.pricing?.currency)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{reservation.pickup.branch_id?.name || 'Unknown Location'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{reservation.code}</span>
                <button onClick={() => navigate(`/reservations`)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">View Details</button>
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
)}

                {!reservationsLoading && !reservationsError && recentReservations.length === 0 && (
                  <EmptyState icon={Calendar} title="No reservations yet" message="Book a vehicle to see your reservations here." />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBookingDrawer && <BookingDrawer />}
      {notificationsOpen && <div className="fixed inset-0 z-30" onClick={() => setNotificationsOpen(false)} />}
    </div>
  );
};

export default Dashboardy;  