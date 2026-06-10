import { useState, useEffect } from 'react';
import { MapPin, Search, Menu, ChevronDown, Filter, Car as CarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../../components/agentsidebar";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchVehicles } from '../../features/vehicles/vehiclesThunks';
import { selectVehicles, selectVehiclesLoading, selectVehiclesError } from '../../features/vehicles/vehiclesSelectors';

interface Branch {
  _id: string;
  name: string;
}

interface VehicleMetadata {
  seats?: number;
  doors?: number;
  features?: string[];
}

interface Vehicle {
  _id: string;
  plate_number: string;
  color: string;
  status: string;
  availability_state: string;
  photos: string[];
  metadata: VehicleMetadata;
}

interface Pricing {
  _id: string;
  branch_id: Branch;
  vehicle_class: string;
  vehicle_id: Vehicle;
  currency: string;
  daily_rate: { $numberDecimal: string };
  weekly_rate: { $numberDecimal: string };
  name: string;
  active: boolean;
}

interface ApiResponse {
  success: boolean;
  data: {
    items: Pricing[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const AgentVehicles = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('All');
  const navigate = useNavigate();

  const dispatch = useAppDispatch();
  const vehicles = useAppSelector(selectVehicles);
  const loading = useAppSelector(selectVehiclesLoading);
  const error = useAppSelector(selectVehiclesError);

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  const handleBookNow = (pricingInfo: Pricing) => {
    navigate(`/agentbook/${pricingInfo._id}`);
  };

  const parseDecimal = (decimalObj: { $numberDecimal: string }): string => {
    if (!decimalObj || !decimalObj.$numberDecimal) return '0.00';
    return parseFloat(decimalObj.$numberDecimal).toFixed(2);
  };

  const getUniqueBranches = (): string[] => {
    const pricingArray = getPricingArray();
    const branchesSet = new Set<string>();
    
    pricingArray.forEach(pricing => {
      if (pricing.branch_id?.name) {
        branchesSet.add(pricing.branch_id.name);
      }
    });
    
    return ['All', ...Array.from(branchesSet).sort()];
  };

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

  const getPricingArray = (): Pricing[] => {
    if (!vehicles) return [];
    
    if (typeof vehicles === 'object' && vehicles !== null) {
      if ('data' in vehicles && typeof vehicles.data === 'object' && vehicles.data !== null) {
        const apiResponse = vehicles as unknown as ApiResponse;
        if ('items' in apiResponse.data && Array.isArray(apiResponse.data.items)) {
          return apiResponse.data.items;
        }
      }
      
      if (Array.isArray(vehicles)) {
        return vehicles as unknown as Pricing[];
      }
    }
    
    return [];
  };

  const pricingArray = getPricingArray();
  const availableBranches = getUniqueBranches();

  const filteredItems = pricingArray.filter((pricing: Pricing) => {
    const searchTermLower = searchTerm.toLowerCase();
    
    const matchesSearch =
      pricing.name.toLowerCase().includes(searchTermLower) ||
      pricing.vehicle_class.toLowerCase().includes(searchTermLower) ||
      pricing.vehicle_id.plate_number.toLowerCase().includes(searchTermLower) ||
      pricing.branch_id?.name.toLowerCase().includes(searchTermLower);

    const matchesBranch =
      selectedBranch === "All" ? true : pricing.branch_id?.name === selectedBranch;

    return matchesSearch && matchesBranch && pricing.active;
  });

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
                <p className="text-red-500 mt-2">{error}</p>
                <button
                  onClick={() => dispatch(fetchVehicles())}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all"
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && pricingArray.length > 0 && (
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
                          placeholder="Search vehicles..."
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
                          <option value="All">All Branches</option>
                          {availableBranches.filter(b => b !== "All").map((branch) => (
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
                        <span className="font-semibold text-gray-800">{filteredItems.length}</span> vehicle{filteredItems.length !== 1 ? 's' : ''} available
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{availableBranches.length - 1} branch{availableBranches.length - 1 !== 1 ? 'es' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredItems.map((pricing: Pricing) => {
                    const vehicle = pricing.vehicle_id;
                    const photos = vehicle.photos || [];
                    const primaryPhoto = photos[0];
                    const statusColor = getStatusColor(vehicle.availability_state);
                    const statusDisplay = getStatusDisplayText(vehicle.availability_state);
                    const isAvailable = pricing.active && vehicle.availability_state === 'available';
                    
                    return (
                      <div key={pricing._id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                          {primaryPhoto ? (
                            <img
                              src={primaryPhoto}
                              alt={pricing.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
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
                              {pricing.vehicle_class.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                            {pricing.name}
                          </h3>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <MapPin className="w-4 h-4" />
                            <span>{pricing.branch_id?.name || 'Unknown Location'}</span>
                          </div>

                          {/* Seats and Plate section - not displayed */}
                          {/* <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Seats</p>
                                <p className="text-sm font-semibold text-gray-800">
                                  {vehicle.metadata?.seats || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Plate</p>
                              <p className="text-sm font-semibold text-gray-800">
                                {vehicle.plate_number}
                              </p>
                            </div>
                          </div> */}

                          <div className="mt-auto">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="text-sm text-gray-500">Daily rate</p>
                                <p className="text-xl font-bold text-blue-700">
                                  ${parseDecimal(pricing.daily_rate)}
                                  <span className="text-sm text-gray-500 ml-1">/{pricing.currency}</span>
                                </p>
                                <p className="text-xs text-gray-500">Weekly: ${parseDecimal(pricing.weekly_rate)}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleBookNow(pricing)}
                              disabled={!isAvailable}
                              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                                isAvailable
                                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-white shadow-md' 
                                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              {isAvailable ? 'View Details & Book' : 'Unavailable'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredItems.length === 0 && (
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
                          : 'No vehicles available'
                      }
                    </p>
                  </div>
                )}
              </>
            )}

            {!loading && !error && pricingArray.length === 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-700 mb-2">No vehicles available</p>
                <p className="text-gray-500 text-sm">There are currently no vehicles with pricing in the system.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentVehicles;