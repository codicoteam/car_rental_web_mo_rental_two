import { useState, useEffect, useMemo } from 'react';
import {  Car as CarIcon, Users ,  MapPin, Search, Menu, ChevronDown, Filter, X, Calendar, DollarSign, Percent, Tag, AlertCircle, CheckCircle, Info} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../../components/CustomerSidebar";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchVehicles } from '../../features/vehicles/vehiclesThunks';
import { selectVehicles, selectVehiclesLoading, selectVehiclesError } from '../../features/vehicles/vehiclesSelectors';
import { ratePlansService , type RatePlan  } from '../../features/rateplans/rateplansService';

// Updated interfaces to match actual API response
interface Branch {
  _id: string;
  name: string;
  code?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postal_code: string;
  };
  phone?: string;
  email?: string;
}

interface VehicleModel {
  _id: string;
  make: string;
  model: string;
  year: number;
  class: string;
  transmission: string;
  fuel_type: string;
  seats: number;
  doors: number;
  features: string[];
  images?: string[];
}

interface VehicleMetadata {
  seats?: number;
  doors?: number;
  features?: string[];
}

// Updated Vehicle interface matching actual API response
interface Vehicle {
  _id: string;
  vin: string;
  plate_number: string;
  color: string;
  status: string;
  availability_state: string;
  photos: string[];
  metadata?: VehicleMetadata;
  branch_id: Branch;
  vehicle_model_id: VehicleModel;
  odometer_km?: number;
  last_service_at?: string | null;
  last_service_odometer_km?: number | null;
  created_at?: string;
  updated_at?: string;
  active?: boolean;
  currency?: string;
  daily_rate?: { $numberDecimal: string };
  weekly_rate?: { $numberDecimal: string };
  name?: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    items: Vehicle[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const Vehicles = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('All');
  const navigate = useNavigate();

  const dispatch = useAppDispatch();
  const vehicles = useAppSelector(selectVehicles);
  const loading = useAppSelector(selectVehiclesLoading);
  const error = useAppSelector(selectVehiclesError);

   const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [loadingRatePlans, setLoadingRatePlans] = useState(false);
  const [ratePlanError, setRatePlanError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<RatePlan | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'seasonal' | 'fees'>('details');
  

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  const handleBookNow = (vehicle: Vehicle) => {
    navigate(`/book/${vehicle._id}`);
  };

  const parseDecimal = (decimalObj: { $numberDecimal: string } | undefined): string => {
    if (!decimalObj || !decimalObj.$numberDecimal) return '0.00';
    return parseFloat(decimalObj.$numberDecimal).toFixed(2);
  };

  // Extract vehicles array from API response
  const getVehiclesArray = (): Vehicle[] => {
    if (!vehicles) return [];
    
    console.log('Vehicles data structure:', vehicles); // Debug log
    
    // Handle the API response structure
    if (vehicles && typeof vehicles === 'object') {
      // Case 1: Response has data.items structure
      if ('data' in vehicles && vehicles.data && typeof vehicles.data === 'object') {
        const apiResponse = vehicles as unknown as ApiResponse;
        if ('items' in apiResponse.data && Array.isArray(apiResponse.data.items)) {
          console.log('Found items in data.items:', apiResponse.data.items.length);
          return apiResponse.data.items;
        }
      }
      
      // Case 2: Direct array
      if (Array.isArray(vehicles)) {
        console.log('Direct array found:', vehicles.length);
        return vehicles as unknown as Vehicle[];
      }
    }
    
    console.log('No valid vehicle array found');
    return [];
  };

  const vehiclesArray = getVehiclesArray();

  // Get unique branches from vehicles
  const getUniqueBranches = useMemo((): string[] => {
    const branchesSet = new Set<string>();
    
    vehiclesArray.forEach(vehicle => {
      if (vehicle.branch_id?.name) {
        branchesSet.add(vehicle.branch_id.name);
      }
    });
    
    return ['All', ...Array.from(branchesSet).sort()];
  }, [vehiclesArray]);

  const getStatusColor = (availabilityState: string) => {
    switch (availabilityState) {
      case "available": return "bg-green-100 text-green-800";
      case "reserved": return "bg-blue-100 text-blue-800";
      case "in_use": return "bg-indigo-100 text-indigo-800";
      case "maintenance": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDisplayText = (availabilityState: string) => {
    switch (availabilityState) {
      case "available": return "Available";
      case "reserved": return "Reserved";
      case "in_use": return "In Use";
      case "maintenance": return "Maintenance";
      default: return "Unavailable";
    }
  };

  // Filter vehicles based on search and branch
  const filteredVehicles = useMemo(() => {
    return vehiclesArray.filter((vehicle: Vehicle) => {
      const searchTermLower = searchTerm.toLowerCase();
      
      // Get vehicle name from model
      const vehicleName = vehicle.vehicle_model_id 
        ? `${vehicle.vehicle_model_id.make || ''} ${vehicle.vehicle_model_id.model || ''}`.trim()
        : '';
      
      // Check if vehicle matches search term
      const matchesSearch = searchTerm === '' ? true : (
        vehicleName.toLowerCase().includes(searchTermLower) ||
        vehicle.vehicle_model_id?.class?.toLowerCase().includes(searchTermLower) ||
        vehicle.plate_number?.toLowerCase().includes(searchTermLower) ||
        vehicle.branch_id?.name?.toLowerCase().includes(searchTermLower) ||
        vehicle.color?.toLowerCase().includes(searchTermLower)
      );

      // Check if vehicle matches selected branch
      const matchesBranch = selectedBranch === "All" 
        ? true 
        : vehicle.branch_id?.name === selectedBranch;

      // Check if vehicle is available (status active and availability_state available)
      const isActive = vehicle.status === 'active' && vehicle.availability_state === 'available';

      return matchesSearch && matchesBranch && isActive;
    });
  }, [vehiclesArray, searchTerm, selectedBranch]);

  // Get vehicle display name
  const getVehicleDisplayName = (vehicle: Vehicle): string => {
    if (vehicle.vehicle_model_id) {
      return `${vehicle.vehicle_model_id.make || ''} ${vehicle.vehicle_model_id.model || ''}`.trim() || 'Unknown Vehicle';
    }
    return 'Unknown Vehicle';
  };

  // Get vehicle class
  const getVehicleClass = (vehicle: Vehicle): string => {
    return vehicle.vehicle_model_id?.class || 'standard';
  };

  // Get vehicle features
  const getVehicleFeatures = (vehicle: Vehicle): string[] => {
    return vehicle.vehicle_model_id?.features || vehicle.metadata?.features || [];
  };

  const fetchRatePlans = async (vehicleId: string) => {
    setLoadingRatePlans(true);
    setRatePlanError(null);
    
    try {
      const plans = await ratePlansService.getRatePlansByVehicleId(vehicleId);
      setRatePlans(plans);
      
      // Select the active plan by default
      const activePlan = plans.find(plan => plan.active);
      if (activePlan) {
        setSelectedPlan(activePlan);
      } else if (plans.length > 0) {
        setSelectedPlan(plans[0]);
      } else {
        setSelectedPlan(null);
      }
    } catch (err: any) {
      setRatePlanError(err.message || 'Failed to load rate plans');
      console.error('Error fetching rate plans:', err);
    } finally {
      setLoadingRatePlans(false);
    }
  };

  // Open modal handler
  const handleViewRatePlans = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    fetchRatePlans(vehicle._id);
  };

  // Close modal handler
  const closeModal = () => {
    setSelectedVehicle(null);
    setRatePlans([]);
    setSelectedPlan(null);
    setRatePlanError(null);
    setActiveTab('details');
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: { $numberDecimal: string } | undefined, currency: string = 'USD') => {
    if (!amount || !amount.$numberDecimal) return `${currency} 0.00`;
    return `${currency} ${parseFloat(amount.$numberDecimal).toFixed(2)}`;
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
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mr-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600">Dashboard</span>
                  <span className="text-gray-300">›</span>
                  <span className="text-gray-900 font-semibold">Vehicle Fleet</span>
                </div>
              </div>

              <div className="flex items-center gap-4 cursor-pointer">
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
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>
        </nav>

        <div className="flex-1 overflow-y-auto pt-20">
          <div className="max-w-7xl mx-auto p-8">
            {loading && (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-lg text-gray-600">Loading vehicles...</span>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-xl text-red-600 font-semibold">Error loading vehicles</p>
                <p className="text-red-500 mt-2">
                  {typeof error === 'string' ? error : 'Failed to fetch vehicle data. Please try again.'}
                </p>
                <button
                  onClick={() => dispatch(fetchVehicles())}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all"
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && vehiclesArray.length > 0 && (
              <>
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Available Vehicles</h2>
                      <p className="text-gray-600 mt-1">Choose from our premium fleet</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-80">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search vehicles by name, class, plate..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm hover:border-gray-400"
                        />
                      </div>

                      <div className="relative flex-1 sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Filter className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          value={selectedBranch}
                          onChange={(e) => setSelectedBranch(e.target.value)}
                          className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm hover:border-gray-400"
                        >
                          {getUniqueBranches.map((branch) => (
                            <option key={branch} value={branch}>{branch}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-800">{filteredVehicles.length}</span> vehicle{filteredVehicles.length !== 1 ? 's' : ''} available
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{getUniqueBranches.length - 1} branch{getUniqueBranches.length - 1 !== 1 ? 'es' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredVehicles.map((vehicle: Vehicle) => {
                    const photos = vehicle.photos || [];
                    const primaryPhoto = photos[0] || vehicle.vehicle_model_id?.images?.[0];
                    const statusColor = getStatusColor(vehicle.availability_state);
                    const statusDisplay = getStatusDisplayText(vehicle.availability_state);
                    const isAvailable = vehicle.status === 'active' && vehicle.availability_state === 'available';
                    const vehicleName = getVehicleDisplayName(vehicle);
                    const vehicleClass = getVehicleClass(vehicle);
                    const features = getVehicleFeatures(vehicle);
                    
                    return (
                      <div key={vehicle._id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group">
                        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                          {primaryPhoto ? (
                            <img
                              src={primaryPhoto}
                              alt={vehicleName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement?.classList.add('flex', 'items-center', 'justify-center');
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                              <CarIcon className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          
                          <div className="absolute top-3 right-3">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusColor}`}>
                              {statusDisplay}
                            </span>
                          </div>
                          
                          <div className="absolute bottom-3 left-3">
                            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800">
                              {vehicleClass.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                            {vehicleName}
                          </h3>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{vehicle.branch_id?.name || 'Unknown Location'}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Seats</p>
                                <p className="text-sm font-semibold text-gray-800">
                                  {vehicle.vehicle_model_id?.seats || vehicle.metadata?.seats || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Plate</p>
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                {vehicle.plate_number || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {features.length > 0 && (
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-1">
                                {features.slice(0, 3).map((feature, index) => (
                                  <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {feature}
                                  </span>
                                ))}
                                {features.length > 3 && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    +{features.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mt-auto">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="text-sm text-gray-500">Daily rate</p>
                                <p className="text-xl font-bold text-blue-700">
                                  ${parseDecimal(vehicle.daily_rate)}
                                  <span className="text-sm text-gray-500 ml-1">/{vehicle.currency || 'USD'}</span>
                                </p>
                                {vehicle.weekly_rate && (
                                  <p className="text-xs text-gray-500">Weekly: ${parseDecimal(vehicle.weekly_rate)}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Color</p>
                                <p className="text-sm font-semibold text-gray-800">{vehicle.color || 'N/A'}</p>
                              </div>
                            </div>

                           <button
                                onClick={() => handleViewRatePlans(vehicle)}
                                disabled={!isAvailable}
                                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                                  isAvailable
                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-white shadow-md hover:shadow-lg' 
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                {isAvailable ? 'View Rate Plans' : 'Unavailable'}
                              </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredVehicles.length === 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-semibold text-gray-700 mb-2">No vehicles found</p>
                    <p className="text-gray-500 text-sm">
                      {searchTerm 
                        ? `No vehicles match "${searchTerm}"`
                        : selectedBranch !== "All"
                          ? `No vehicles found in ${selectedBranch}`
                          : 'No vehicles available at the moment'
                      }
                    </p>
                    {(searchTerm || selectedBranch !== "All") && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedBranch('All');
                        }}
                        className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-semibold"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {!loading && !error && vehiclesArray.length === 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CarIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-700 mb-2">No vehicles available</p>
                <p className="text-gray-500 text-sm">There are currently no vehicles in the system.</p>
              </div>
            )}
            {/* Rate Plans Modal */}
{selectedVehicle && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Modal Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Rate Plans</h2>
        <button
          onClick={closeModal}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Modal Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Vehicle Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
              {selectedVehicle.photos?.[0] ? (
                <img
                  src={selectedVehicle.photos[0]}
                  alt={getVehicleDisplayName(selectedVehicle)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <CarIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">
                {getVehicleDisplayName(selectedVehicle)}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-600">
                  {selectedVehicle.plate_number}
                </span>
                <span className="text-sm text-gray-600">•</span>
                <span className="text-sm text-gray-600">
                  {selectedVehicle.branch_id?.name}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-lg">
                  {getVehicleClass(selectedVehicle).toUpperCase()}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                  {selectedVehicle.vehicle_model_id?.seats || 'N/A'} seats
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loadingRatePlans && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading rate plans...</span>
          </div>
        )}

        {/* Error State */}
        {ratePlanError && !loadingRatePlans && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <p className="text-red-600 font-semibold mb-2">Failed to load rate plans</p>
            <p className="text-red-500 text-sm mb-4">{ratePlanError}</p>
            <button
              onClick={() => fetchRatePlans(selectedVehicle._id)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Rate Plans */}
        {!loadingRatePlans && !ratePlanError && ratePlans.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
            <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 mb-2">No Rate Plans Available</p>
            <p className="text-gray-500">This vehicle doesn't have any rate plans at the moment.</p>
          </div>
        )}

        {/* Rate Plans Display */}
        {!loadingRatePlans && !ratePlanError && ratePlans.length > 0 && (
          <>
            {/* Rate Plan Selector */}
            {ratePlans.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Rate Plan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ratePlans.map((plan) => (
                    <button
                      key={plan._id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        selectedPlan?._id === plan._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{plan.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Valid: {formatDate(plan.valid_from)} - {formatDate(plan.valid_to)}
                          </p>
                        </div>
                        {selectedPlan?._id === plan._id && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-lg font-bold text-blue-600 mt-2">
                        {formatCurrency(plan.daily_rate, plan.currency)}
                        <span className="text-sm font-normal text-gray-500">/day</span>
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Plan Details */}
            {selectedPlan && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-gray-200 bg-gray-50">
                  <div className="flex">
                    {[
                      { id: 'details', label: 'Rate Details', icon: DollarSign },
                      { id: 'seasonal', label: 'Seasonal Rates', icon: Calendar },
                      { id: 'fees', label: 'Fees & Taxes', icon: Tag }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'border-b-2 border-blue-500 text-blue-600 bg-white'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <tab.icon className="w-4 h-4 inline mr-2" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  {/* Details Tab */}
                  {activeTab === 'details' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Daily Rate</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(selectedPlan.daily_rate, selectedPlan.currency)}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Weekly Rate</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(selectedPlan.weekly_rate, selectedPlan.currency)}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Monthly Rate</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(selectedPlan.monthly_rate, selectedPlan.currency)}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Weekend Rate</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(selectedPlan.weekend_rate, selectedPlan.currency)}
                          </p>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-blue-900">Validity Period</p>
                            <p className="text-xs text-blue-700">
                              {formatDate(selectedPlan.valid_from)} - {formatDate(selectedPlan.valid_to)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {selectedPlan.notes && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm font-semibold text-gray-700 mb-1">Notes</p>
                          <p className="text-sm text-gray-600">{selectedPlan.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Seasonal Tab */}
                  {activeTab === 'seasonal' && (
                    <div>
                      {selectedPlan.seasonal_overrides && selectedPlan.seasonal_overrides.length > 0 ? (
                        <div className="space-y-4">
                          {selectedPlan.seasonal_overrides.map((override) => (
                            <div key={override._id} className="border border-gray-200 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 mb-2">
                                {override.season.name} Season
                              </h4>
                              <p className="text-xs text-gray-500 mb-3">
                                {formatDate(override.season.start)} - {formatDate(override.season.end)}
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs text-gray-500">Daily</p>
                                  <p className="font-semibold">
                                    {formatCurrency(override.daily_rate, selectedPlan.currency)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Weekly</p>
                                  <p className="font-semibold">
                                    {formatCurrency(override.weekly_rate, selectedPlan.currency)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Monthly</p>
                                  <p className="font-semibold">
                                    {formatCurrency(override.monthly_rate, selectedPlan.currency)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Weekend</p>
                                  <p className="font-semibold">
                                    {formatCurrency(override.weekend_rate, selectedPlan.currency)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">No seasonal rate overrides</p>
                          <p className="text-sm text-gray-400">Standard rates apply year-round</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fees & Taxes Tab */}
                  {activeTab === 'fees' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Percent className="w-4 h-4 mr-2" />
                          Taxes
                        </h4>
                        {selectedPlan.taxes && selectedPlan.taxes.length > 0 ? (
                          <div className="space-y-2">
                            {selectedPlan.taxes.map((tax) => (
                              <div key={tax._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-700">{tax.code}</span>
                                <span className="text-gray-900">{(tax.rate * 100).toFixed(0)}%</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No taxes apply</p>
                        )}
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Tag className="w-4 h-4 mr-2" />
                          Additional Fees
                        </h4>
                        {selectedPlan.fees && selectedPlan.fees.length > 0 ? (
                          <div className="space-y-2">
                            {selectedPlan.fees.map((fee) => (
                              <div key={fee._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-700">
                                  {fee.code.replace(/_/g, ' ')}
                                </span>
                                <span className="text-gray-900">
                                  {formatCurrency(fee.amount, selectedPlan.currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No additional fees</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Footer */}
      {selectedPlan && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <button
            onClick={() => {

              console.log('Selected Vehicle before navigation:', selectedVehicle);
              console.log('Selected Plan before navigation:', selectedPlan);
              
              closeModal();
              navigate(`/book/${selectedVehicle?._id}`, { 
                state: { 
                  ratePlan: selectedPlan ,
                  vehicle: selectedVehicle
                } 
              });
            }}
            disabled={!selectedPlan.active}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${
              selectedPlan.active
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-white shadow-md'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {selectedPlan.active ? 'Proceed to Booking' : 'Rate Plan Not Available'}
          </button>
          {selectedPlan.active && (
            <p className="text-center text-xs text-gray-500 mt-2">
              Secure your booking with our best rate guarantee
            </p>
          )}
        </div>
      )}
    </div>
  </div>
)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vehicles;

