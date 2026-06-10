// src/pages/Reservation.tsx
import { useState, useEffect } from 'react';
import { Clock, Search, Menu, Phone, Mail, AlertCircle, Filter, X, Eye, User, Car, CreditCard, FileText, CalendarDays, Tag, Gauge, Shield, Image } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from '../../components/agentsidebar';
import { fetchReservations } from '../../features/reservation/reservationthunks';
import { selectReservations, selectReservationsLoading, selectReservationsError } from '../../features/reservation/reservationSelectors';
import type { AppDispatch } from '../../app/store';

interface ApiReservation {
  _id: string;
  code: string;
  created_at: string;
  status: string;
  pickup: {
    branch_id: { name: string; address?: string };
    at: string;
  };
  dropoff: {
    branch_id: { name: string; address?: string };
    at: string;
  };
  driver_snapshot: {
    full_name: string;
    phone: string;
    email: string;
    driver_license: {
      number: string;
      country: string;
      class: string;
      expires_at: string;
      verified: boolean;
    };
  };
  vehicle_id: {
    plate_number: string;
    vin: string;
    color: string;
    odometer_km: number;
    photos: string[];
    metadata?: {
      seats?: number;
      doors?: number;
      features?: string[];
      gps_device_id?: string;
      notes?: string;
    };
    status: string;
    availability_state: string;
    vehicle_model_id: string;
  };
  vehicle_model_id: {
    make: string;
    model: string;
    year: number;
    class: string;
  };
  pricing: {
    currency: string;
    total: number;
    breakdown: Array<{ description: string; amount: number }>;
    fees: Array<{ name: string; amount: number }>;
    taxes: Array<{ name: string; amount: number }>;
    discounts: Array<{ name: string; amount: number }>;
  };
  payment_summary: {
    status: string;
    paid_total: { $numberDecimal: string };
    outstanding: { $numberDecimal: string };
    last_payment_at: string | null;
  };
  notes: string;
  user_id: {
    full_name: string;
    email: string;
  };
  created_by: {
    full_name: string;
    email: string;
  };
  created_channel: string;
}

interface TransformedReservation {
  id: string;
  code: string;
  customer: string;
  email: string;
  phone: string;
  vehicleName: string;
  make: string;
  model: string;
  year: number;
  vehicleClass: string;
  plateNumber: string;
  vin: string;
  color: string;
  odometer: string;
  vehicleStatus: string;
  availabilityState: string;
  seats: number;
  doors: number;
  features: string[];
  gpsDeviceId: string;
  vehicleNotes: string;
  photos: string[];
  startDate: string;
  endDate: string;
  status: string;
  totalAmount: string;
  pickupLocation: string;
  dropoffLocation: string;
  duration: string;
  createdDate: string;
  createdBy: string;
  createdChannel: string;
  licenseClass: string;
  licenseCountry: string;
  licenseExpiry: string;
  licenseVerified: boolean;
  paymentStatus: string;
  paidAmount: string;
  outstandingAmount: string;
  currency: string;
  notes: string;
  pricingBreakdown: Array<{ description: string; amount: string }>;
  fees: Array<{ name: string; amount: string }>;
  taxes: Array<{ name: string; amount: string }>;
  discounts: Array<{ name: string; amount: string }>;
}

const AgentReservation = () => {
  const dispatch = useDispatch<AppDispatch>();
  const apiResponse = useSelector(selectReservations);
  const isLoading = useSelector(selectReservationsLoading);
  const error = useSelector(selectReservationsError);
  
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<TransformedReservation | null>(null);

  useEffect(() => {
    dispatch(fetchReservations());
  }, [dispatch]);

  const transformReservations = (apiRes: any): TransformedReservation[] => {
    if (!apiRes?.success || !Array.isArray(apiRes.data)) return [];
    
    return apiRes.data.map((res: ApiReservation) => {
      const pickupDate = new Date(res.pickup.at);
      const dropoffDate = new Date(res.dropoff.at);
      const duration = Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });

      const formatCurrency = (amount: string | number, currency = 'USD') => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num || 0);
      };

      return {
        id: res._id,
        code: res.code,
        customer: res.driver_snapshot?.full_name || 'N/A',
        email: res.driver_snapshot?.email || 'N/A',
        phone: res.driver_snapshot?.phone || 'N/A',
        vehicleName: `${res.vehicle_model_id?.make || ''} ${res.vehicle_model_id?.model || ''}`.trim(),
        make: res.vehicle_model_id?.make || 'N/A',
        model: res.vehicle_model_id?.model || 'N/A',
        year: res.vehicle_model_id?.year || 0,
        vehicleClass: res.vehicle_model_id?.class || 'N/A',
        plateNumber: res.vehicle_id?.plate_number || 'N/A',
        vin: res.vehicle_id?.vin || 'N/A',
        color: res.vehicle_id?.color || 'N/A',
        odometer: `${res.vehicle_id?.odometer_km?.toLocaleString() || '0'} km`,
        vehicleStatus: res.vehicle_id?.status || 'N/A',
        availabilityState: res.vehicle_id?.availability_state || 'N/A',
        seats: res.vehicle_id?.metadata?.seats || 0,
        doors: res.vehicle_id?.metadata?.doors || 0,
        features: res.vehicle_id?.metadata?.features || [],
        gpsDeviceId: res.vehicle_id?.metadata?.gps_device_id || 'N/A',
        vehicleNotes: res.vehicle_id?.metadata?.notes || 'No notes',
        photos: res.vehicle_id?.photos || [],
        startDate: formatDate(res.pickup.at),
        endDate: formatDate(res.dropoff.at),
        status: res.status.charAt(0).toUpperCase() + res.status.slice(1),
        totalAmount: formatCurrency(res.pricing?.total || 0, res.pricing?.currency),
        pickupLocation: res.pickup.branch_id?.name || 'N/A',
        dropoffLocation: res.dropoff.branch_id?.name || 'N/A',
        duration: `${duration} day${duration !== 1 ? 's' : ''}`,
        createdDate: formatDate(res.created_at),
        createdBy: res.created_by?.full_name || 'N/A',
        createdChannel: res.created_channel || 'N/A',
        licenseClass: res.driver_snapshot?.driver_license?.class || 'N/A',
        licenseCountry: res.driver_snapshot?.driver_license?.country || 'N/A',
        licenseExpiry: res.driver_snapshot?.driver_license?.expires_at ? formatDate(res.driver_snapshot.driver_license.expires_at) : 'N/A',
        licenseVerified: res.driver_snapshot?.driver_license?.verified || false,
        paymentStatus: res.payment_summary?.status || 'N/A',
        paidAmount: formatCurrency(res.payment_summary?.paid_total?.$numberDecimal || 0, res.pricing?.currency),
        outstandingAmount: formatCurrency(res.payment_summary?.outstanding?.$numberDecimal || 0, res.pricing?.currency),
        currency: res.pricing?.currency || 'USD',
        notes: res.notes || 'No notes',
        pricingBreakdown: res.pricing?.breakdown?.map(item => ({
          description: item.description,
          amount: formatCurrency(item.amount, res.pricing?.currency)
        })) || [],
        fees: res.pricing?.fees?.map(fee => ({
          name: fee.name,
          amount: formatCurrency(fee.amount, res.pricing?.currency)
        })) || [],
        taxes: res.pricing?.taxes?.map(tax => ({
          name: tax.name,
          amount: formatCurrency(tax.amount, res.pricing?.currency)
        })) || [],
        discounts: res.pricing?.discounts?.map(discount => ({
          name: discount.name,
          amount: formatCurrency(discount.amount, res.pricing?.currency)
        })) || []
      };
    });
  };

  const reservations = transformReservations(apiResponse);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
      confirmed: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
      active: 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white',
      completed: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
      cancelled: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white'
    };
    return colors[status.toLowerCase()] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
      unpaid: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white',
      partial: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
    };
    return colors[status.toLowerCase()] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  };

  const getVehicleStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
      available: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
      unavailable: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white',
      maintenance: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
    };
    return colors[status.toLowerCase()] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  };

  const filteredReservations = reservations.filter(res => {
    const matchesTab = selectedTab === 'all' || res.status.toLowerCase() === selectedTab;
    const matchesSearch = res.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          res.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          res.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col lg:ml-74">
        {/* Navbar */}
        <nav className="fixed top-0 right-0 left-0 lg:left-74 z-40 bg-white/95 backdrop-blur-xl shadow-lg border-b border-slate-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-3 p-2 rounded-xl bg-gradient-to-r from-slate-100 to-blue-50 hover:from-slate-200 hover:to-blue-100 transition-all">
                  <Menu className="w-5 h-5 text-slate-700" />
                </button>
                <div className="hidden sm:flex items-center space-x-2 text-sm">
                  <span className="text-slate-600">Dashboard</span>
                  <span className="text-slate-300">›</span>
                  <span className="font-bold bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent">Reservations</span>
                </div>
                <div className="sm:hidden">
                  <span className="font-bold text-lg bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent">Reservations</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-800">John Doe</p>
                  <p className="text-xs text-slate-500">Customer</p>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-700 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">JD</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pt-16 sm:pt-20">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-gradient-to-r from-rose-50/90 to-rose-100/70 rounded-2xl shadow-xl p-5 sm:p-7 mb-7 sm:mb-9 border border-rose-200/60 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 flex items-center justify-center shadow-lg">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-rose-800 font-bold text-lg">Error loading reservations</p>
                    <p className="text-rose-700 text-sm mt-1">{error}</p>
                  </div>
                  <button
                    onClick={() => dispatch(fetchReservations())}
                    className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Search and Filter */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-5 sm:p-7 mb-7 sm:mb-9 border border-slate-200/60">
              <div className="flex flex-col gap-5">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-cyan-500/5 rounded-2xl -m-1 group-hover:opacity-100 opacity-0 transition-opacity"></div>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search reservations by customer, vehicle, or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="relative w-full pl-12 pr-4 py-3.5 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white/50"
                  />
                </div>
                <div className="hidden sm:flex gap-2">
                  {['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSelectedTab(tab)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        selectedTab === tab
                          ? 'bg-gradient-to-r from-blue-700 to-cyan-500 text-white shadow-lg'
                          : 'bg-gradient-to-r from-slate-100 to-blue-50 text-slate-700 hover:shadow-md'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowMobileFilters(true)} className="sm:hidden flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-100 to-blue-50 text-slate-700 rounded-xl font-bold">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-10 sm:p-14 text-center border border-slate-200/60">
                <div className="relative inline-block">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-500/20 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-lg text-slate-700 font-bold mt-6">Loading your reservations...</p>
              </div>
            )}

            {/* Count */}
            {!isLoading && (
              <div className="mb-5">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-50/80 to-cyan-50/50 rounded-xl px-4 py-2.5 border border-slate-200/60">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center">
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-slate-700">
                    Showing <span className="font-bold text-slate-900">{filteredReservations.length}</span> reservation{filteredReservations.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Reservation Cards */}
            {!isLoading && !error && (
              <div className="grid grid-cols-1 gap-5 sm:gap-7">
                {filteredReservations.map((reservation) => (
                  <div key={reservation.id} className="group">
                    {/* Desktop View - Beautiful Card */}
                    <div className="hidden sm:block bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-xl overflow-hidden border border-slate-200/60 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                      <div className="flex">
                        {/* Car Image Section */}
                        <div className="w-64 relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-800/90">
                          {reservation.photos && reservation.photos.length > 0 ? (
                            <>
                              <img 
                                src={reservation.photos[0]} 
                                alt={reservation.vehicleName}
                                className="w-full h-full object-cover opacity-70"
                              />
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40"></div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-900/80 to-cyan-800/80 flex items-center justify-center">
                              <Car className="w-16 h-16 text-white/60" />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600/90 to-cyan-500/90 flex items-center justify-center shadow-lg">
                                <Car className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-white font-bold text-lg">{reservation.vehicleName}</p>
                                <p className="text-white/80 text-sm">{reservation.year} • {reservation.vehicleClass}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-2xl font-bold text-slate-900">{reservation.customer}</h3>
                                <span className={`px-4 py-2 rounded-xl font-bold ${getStatusColor(reservation.status)} shadow-md`}>
                                  {reservation.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-slate-600 mb-4">
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  <span className="text-sm">{reservation.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  <span className="text-sm">{reservation.phone}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 flex-wrap">
                                <span className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-bold rounded-lg">
                                  {reservation.code}
                                </span>
                                <span className="px-3 py-1.5 bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 font-bold rounded-lg">
                                  Plate: {reservation.plateNumber}
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: reservation.color.toLowerCase()}}></div>
                                  <span className="text-sm font-semibold text-slate-700">{reservation.color}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500 mb-2">Total Amount</p>
                              <p className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent">
                                {reservation.totalAmount}
                              </p>
                              <p className="text-slate-500 text-sm mt-1">Created: {reservation.createdDate}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-xl p-4 border border-slate-200/60">
                              <p className="text-sm text-slate-500 mb-2">Pick-up</p>
                              <p className="font-bold text-slate-800 text-lg">{reservation.startDate}</p>
                              <p className="text-slate-600 text-sm">{reservation.pickupLocation}</p>
                            </div>
                            <div className="bg-gradient-to-br from-white to-cyan-50/50 rounded-xl p-4 border border-slate-200/60">
                              <p className="text-sm text-slate-500 mb-2">Return</p>
                              <p className="font-bold text-slate-800 text-lg">{reservation.endDate}</p>
                              <p className="text-slate-600 text-sm">{reservation.dropoffLocation}</p>
                            </div>
                            <div className="bg-gradient-to-br from-white to-emerald-50/50 rounded-xl p-4 border border-slate-200/60">
                              <p className="text-sm text-slate-500 mb-2">Payment Status</p>
                              <span className={`px-3 py-1.5 rounded-lg font-bold ${getPaymentStatusColor(reservation.paymentStatus)} mb-2 inline-block`}>
                                {reservation.paymentStatus.toUpperCase()}
                              </span>
                              <p className="text-rose-600 font-bold">{reservation.outstandingAmount} outstanding</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2 text-slate-600">
                                <Gauge className="w-4 h-4" />
                                <span className="font-medium">{reservation.odometer}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <Shield className="w-4 h-4" />
                                <span className={`px-2 py-1 rounded text-xs font-bold ${getVehicleStatusColor(reservation.vehicleStatus)}`}>
                                  {reservation.vehicleStatus}
                                </span>
                              </div>
                            </div>
                            <button 
                              onClick={() => setSelectedReservation(reservation)}
                              className="px-6 py-3 bg-gradient-to-r from-blue-700 to-cyan-500 hover:from-blue-800 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl flex items-center gap-3"
                            >
                              <Eye className="w-5 h-5" />
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile View */}
                    <div className="sm:hidden bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-lg overflow-hidden border border-slate-200/60">
                      <div className="relative h-48 bg-gradient-to-br from-slate-900 to-slate-800">
                        {reservation.photos && reservation.photos.length > 0 ? (
                          <>
                            <img 
                              src={reservation.photos[0]} 
                              alt={reservation.vehicleName}
                              className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/50"></div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-900 to-cyan-800 flex items-center justify-center">
                            <Car className="w-12 h-12 text-white/50" />
                          </div>
                        )}
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-bold">{reservation.vehicleName}</p>
                              <p className="text-white/80 text-sm">{reservation.year} • {reservation.vehicleClass}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-white">{reservation.totalAmount}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900">{reservation.customer}</h3>
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(reservation.status)}`}>
                              {reservation.status}
                            </span>
                          </div>
                          <span className="px-2 py-1 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 text-xs font-bold rounded">
                            {reservation.code}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1">Pick-up</p>
                            <p className="font-bold text-slate-800">{reservation.startDate}</p>
                          </div>
                          <div className="bg-gradient-to-br from-white to-cyan-50/50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1">Return</p>
                            <p className="font-bold text-slate-800">{reservation.endDate}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: reservation.color.toLowerCase()}}></div>
                            <span className="text-sm text-slate-700">{reservation.color}</span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getPaymentStatusColor(reservation.paymentStatus)}`}>
                            {reservation.paymentStatus}
                          </span>
                        </div>

                        <button 
                          onClick={() => setSelectedReservation(reservation)}
                          className="w-full py-3 bg-gradient-to-r from-blue-700 to-cyan-500 text-white font-bold rounded-xl shadow-lg"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !error && filteredReservations.length === 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-10 sm:p-14 text-center border border-slate-200/60">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center shadow-lg">
                  <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400" />
                </div>
                <p className="text-xl sm:text-2xl text-slate-700 font-bold mb-2">No reservations found</p>
                <p className="text-slate-500">Try adjusting your filters or search terms</p>
              </div>
            )}

          </div>
        </div>

        {/* Details Modal */}
        {selectedReservation && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-white to-slate-50/80 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-slate-200/60">
              <div className="sticky top-0 bg-gradient-to-r from-white to-blue-50/50 backdrop-blur-sm border-b border-slate-200/60 px-7 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Reservation Details</h2>
                    <p className="text-slate-600 text-sm">{selectedReservation.code}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedReservation(null)} className="p-2.5 hover:bg-slate-100 rounded-xl">
                  <X className="w-6 h-6 text-slate-600" />
                </button>
              </div>

              <div className="p-7 space-y-7">
                {/* Car Photos Gallery */}
                {selectedReservation.photos.length > 0 && (
                  <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-6 border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 flex items-center justify-center">
                        <Image className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Vehicle Photos</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedReservation.photos.slice(0, 4).map((photo, index) => (
                        <div key={index} className="relative rounded-xl overflow-hidden border border-slate-200/60 shadow-sm">
                          <img 
                            src={photo} 
                            alt={`${selectedReservation.vehicleName} ${index + 1}`}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-6 border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Customer Information</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500 mb-1.5">Full Name</p>
                          <p className="font-bold text-slate-800">{selectedReservation.customer}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1.5">Email</p>
                          <p className="font-bold text-slate-800">{selectedReservation.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500 mb-1.5">Phone</p>
                          <p className="font-bold text-slate-800">{selectedReservation.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1.5">Driver License</p>
                          <p className="font-bold text-slate-800">{selectedReservation.licenseClass}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-slate-500 mb-1">License Country</p>
                          <span className="px-2.5 py-1.5 bg-gradient-to-r from-slate-500/10 to-slate-600/10 text-slate-700 font-bold rounded-lg text-sm">
                            {selectedReservation.licenseCountry}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1">License Verified</p>
                          <span className={`px-2.5 py-1.5 font-bold rounded-lg text-sm ${
                            selectedReservation.licenseVerified 
                              ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-700'
                              : 'bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-700'
                          }`}>
                            {selectedReservation.licenseVerified ? 'Verified' : 'Not Verified'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl p-6 border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-lg bg-gradient-to-r from-emerald-500/10 to-green-500/10 flex items-center justify-center">
                        <Car className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Vehicle Information</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500 mb-1.5">Vehicle Name</p>
                          <p className="font-bold text-slate-800 text-lg">{selectedReservation.vehicleName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1.5">Year</p>
                          <p className="font-bold text-slate-800">{selectedReservation.year}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500 mb-1.5">Plate Number</p>
                          <p className="font-bold text-slate-800 text-blue-800">{selectedReservation.plateNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1.5">VIN</p>
                          <p className="font-bold text-slate-800 font-mono">{selectedReservation.vin}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full" style={{backgroundColor: selectedReservation.color.toLowerCase()}}></div>
                          <div>
                            <p className="text-sm text-slate-500">Color</p>
                            <p className="font-bold text-slate-800">{selectedReservation.color}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1.5">Odometer</p>
                          <p className="font-bold text-slate-800">{selectedReservation.odometer}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Vehicle Status</p>
                          <span className={`px-2.5 py-1.5 rounded-lg font-bold ${getVehicleStatusColor(selectedReservation.vehicleStatus)}`}>
                            {selectedReservation.vehicleStatus}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Availability</p>
                          <span className={`px-2.5 py-1.5 rounded-lg font-bold ${getVehicleStatusColor(selectedReservation.availabilityState)}`}>
                            {selectedReservation.availabilityState}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1.5">Vehicle Class</p>
                        <span className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-800 font-bold rounded-lg">
                          {selectedReservation.vehicleClass}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rental Period */}
                  <div className="bg-gradient-to-br from-white to-violet-50/30 rounded-2xl p-6 border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 flex items-center justify-center">
                        <CalendarDays className="w-6 h-6 text-violet-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Rental Period</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-slate-200/80">
                          <p className="text-sm text-slate-500 mb-2">Pick-up Date</p>
                          <p className="font-bold text-slate-800 text-lg">{selectedReservation.startDate}</p>
                          <p className="text-slate-600 text-sm mt-2">{selectedReservation.pickupLocation}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-200/80">
                          <p className="text-sm text-slate-500 mb-2">Return Date</p>
                          <p className="font-bold text-slate-800 text-lg">{selectedReservation.endDate}</p>
                          <p className="text-slate-600 text-sm mt-2">{selectedReservation.dropoffLocation}</p>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-xl p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500">Duration</p>
                            <p className="font-bold text-slate-800 text-2xl">{selectedReservation.duration}</p>
                          </div>
                          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
                            <Clock className="w-7 h-7 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-gradient-to-br from-white to-rose-50/30 rounded-2xl p-6 border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-lg bg-gradient-to-r from-rose-500/10 to-pink-500/10 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-rose-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Payment Information</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={`px-5 py-2.5 rounded-xl font-bold ${getPaymentStatusColor(selectedReservation.paymentStatus)}`}>
                          {selectedReservation.paymentStatus.toUpperCase()}
                        </span>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Total Amount</p>
                          <p className="font-bold text-blue-800 text-xl">{selectedReservation.totalAmount}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-slate-200/80">
                          <p className="text-sm text-slate-500 mb-2">Paid Amount</p>
                          <p className="font-bold text-emerald-600 text-xl">{selectedReservation.paidAmount}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-200/80">
                          <p className="text-sm text-slate-500 mb-2">Outstanding</p>
                          <p className="font-bold text-rose-600 text-xl">{selectedReservation.outstandingAmount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm text-slate-500">Currency</p>
                          <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-700 font-bold rounded-lg">
                            {selectedReservation.currency}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-500">Created By</p>
                          <p className="font-bold text-slate-800">{selectedReservation.createdBy}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Details */}
                  <div className="lg:col-span-2 bg-gradient-to-br from-white to-amber-50/30 rounded-2xl p-6 border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 flex items-center justify-center">
                        <Tag className="w-6 h-6 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Vehicle Details</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-sm text-slate-500 mb-2">Seats</p>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <p className="font-bold text-slate-800 text-lg">{selectedReservation.seats}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-2">Doors</p>
                        <p className="font-bold text-slate-800 text-lg">{selectedReservation.doors}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-2">GPS Device</p>
                        <p className="font-bold text-slate-800">{selectedReservation.gpsDeviceId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-2">Created Channel</p>
                        <span className="px-2.5 py-1.5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-700 font-bold rounded-lg">
                          {selectedReservation.createdChannel}
                        </span>
                      </div>
                      {selectedReservation.features.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-sm text-slate-500 mb-2">Features</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedReservation.features.map((feature, index) => (
                              <span key={index} className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 font-bold rounded-lg">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {selectedReservation.vehicleNotes !== 'No notes' && (
                      <div className="mt-6 bg-white rounded-xl p-4 border border-slate-200/80">
                        <p className="text-sm text-slate-500 mb-2">Vehicle Notes</p>
                        <p className="text-slate-800">{selectedReservation.vehicleNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {selectedReservation.notes !== 'No notes' && (
                    <div className="lg:col-span-2 bg-gradient-to-br from-white to-slate-50/80 rounded-2xl p-6 border border-slate-200/60">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-11 h-11 rounded-lg bg-gradient-to-r from-slate-500/10 to-slate-600/10 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Reservation Notes</h3>
                      </div>
                      <div className="bg-white rounded-xl p-5 border border-slate-200/80">
                        <p className="text-slate-800 leading-relaxed">{selectedReservation.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button onClick={() => setSelectedReservation(null)} className="px-6 py-3 bg-gradient-to-r from-slate-100 to-blue-50 hover:from-slate-200 hover:to-blue-100 text-slate-700 font-bold rounded-xl">
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Filters Modal */}
        {showMobileFilters && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setShowMobileFilters(false)}>
            <div className="absolute right-0 top-0 h-full w-64 bg-white p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Filter</h3>
                <button onClick={() => setShowMobileFilters(false)} className="p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                {['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setSelectedTab(tab);
                      setShowMobileFilters(false);
                    }}
                    className={`w-full px-4 py-3 rounded-lg font-semibold text-left ${
                      selectedTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AgentReservation;