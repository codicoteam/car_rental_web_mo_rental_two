import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  AlertCircle,
  ChevronLeft,
  CheckCircle,
  ChevronDown,
  Menu,
  Hash,
  Loader
} from 'lucide-react';
import Sidebar from "../../components/CustomerSidebar";
import { branchesService , type Branch } from '../../Services/branchesService'; 
import { reservationsService } from '../../Services/reservations_service';


interface Tax {
  code: string;
  rate: number;
  amount: string;
}

interface Discount {
  promo_code_id: string;
  amount: string;
}

interface BreakdownItem {
  label: string;
  quantity: number;
  unit_amount: string;
  total: string;
}

interface ReservationPayload {
  code: string;
  user_id: string;
  vehicle_id: string;
  vehicle_model_id: string;
  pickup: {
    branch_id: string;
    at: string;
  };
  dropoff: {
    branch_id: string;
    at: string;
  };
  pricing: {
    currency: string;
    breakdown: BreakdownItem[];
    taxes: Tax[];
    discounts?: Discount[];
    grand_total: string;
    computed_at: string;
  };
   payment_summary: {
    status: string;
    paid_total: string;
    outstanding: string;
    last_payment_at: string | null;
  };
  driver_snapshot?: {
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
}

const CreateReservation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get vehicle data from location state (passed from vehicle selection page)
  const { vehicle, ratePlan } = location.state || {};
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedRateType, setSelectedRateType] = useState('daily_rate');


  const getUserIdFromStorage = (): string => {
  try {
    // Method 1: If you have the user object stored
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user._id) return user._id;
    }
    
    // Method 2: Decode token to get user ID
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.userId) return payload.userId;
    }
    
      
    return '';
  } catch (error) {
    console.error('Error getting user ID from storage:', error);
    return '';
  }
};
  
  // Form state
  const [formData, setFormData] = useState<ReservationPayload>({
    code: '',
    user_id: getUserIdFromStorage(),
    vehicle_id: vehicle?._id || '',
    vehicle_model_id: vehicle?.vehicle_model_id?._id || '',
    pickup: {
      branch_id: '',
      at: ''
    },
    dropoff: {
      branch_id: '',
      at: ''
    },
    pricing: {
      currency: 'USD',
      breakdown: [
        {
          label: 'Base daily rate',
          quantity: 1,
          unit_amount: '',
          total: ''
        }
      ],
      taxes: [],
      grand_total: '',
      computed_at: new Date().toISOString()
    },
     payment_summary: {
    status: 'unpaid',
    paid_total: '0.00',
    outstanding: '',
    last_payment_at: null
  }
  });

 const [taxConfig, setTaxConfig] = useState({
  enabled: true,
  code: 'VAT',
  rate: 0.15 // default value
});
  
 
  // Discounts state (optional)
  const [discount, setDiscount] = useState<Discount>({ promo_code_id: '', amount: '' });
  
  // Driver snapshot state (optional)
  const [driverInfo, setDriverInfo] = useState({
    full_name: '',
    phone: '',
    email: '',
    driver_license: {
      number: '',
      country: 'ZW',
      class: 'Class 4',
      expires_at: '',
      verified: false
    }
  });

  // Add useEffect to load taxes from ratePlan
useEffect(() => {
  if (ratePlan && ratePlan.taxes && ratePlan.taxes.length > 0) {
    // Use the first tax from the ratePlan (you can modify logic if multiple taxes)
    const firstTax = ratePlan.taxes[0];
    setTaxConfig({
      enabled: true,
      code: firstTax.code,
      rate: firstTax.rate
    });
  }
}, [ratePlan]);


  // Fetch branches on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true);
        const branchesData = await branchesService.getAllBranches();
        setBranches(branchesData);
        
        // Set default branches if available
        if (branchesData.length > 0) {
          setFormData(prev => ({
            ...prev,
            pickup: { ...prev.pickup, branch_id: branchesData[0]._id },
            dropoff: { ...prev.dropoff, branch_id: branchesData[0]._id }
          }));
        }
      } catch (err: any) {
        console.error('Error fetching branches:', err);
        setError(err.message || 'Failed to load branches');
      } finally {
        setLoadingBranches(false);
      }
    };
    
    fetchBranches();
  }, []);


   // Handle rate type selection from dropdown
const handleRateTypeSelect = (index: number, rateType: string, currentItem: BreakdownItem) => {
  setSelectedRateType(rateType);
  
  if (ratePlan && vehicle) {
    let rateValue = '0';
    let rateLabel = '';
    
    switch(rateType) {
      case 'daily_rate':
        rateValue = ratePlan.daily_rate?.$numberDecimal || '0';
        rateLabel = 'Daily Rate';
        break;
      case 'weekly_rate':
        rateValue = ratePlan.weekly_rate?.$numberDecimal || '0';
        rateLabel = 'Weekly Rate';
        break;
      case 'monthly_rate':
        rateValue = ratePlan.monthly_rate?.$numberDecimal || '0';
        rateLabel = 'Monthly Rate';
        break;
      case 'weekend_rate':
        rateValue = ratePlan.weekend_rate?.$numberDecimal || '0';
        rateLabel = 'Weekend Rate';
        break;
      default:
        rateValue = ratePlan.daily_rate?.$numberDecimal || '0';
        rateLabel = 'Daily Rate';
    }
    
    const quantity = currentItem.quantity;
    const subtotal = parseFloat(rateValue) * quantity;
    
    const newBreakdown = [...formData.pricing.breakdown];
    newBreakdown[index] = {
      ...newBreakdown[index],
      label: `${ratePlan.name} - ${rateLabel}`,
      unit_amount: rateValue,
      total: subtotal.toFixed(2)
    };
    
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        breakdown: newBreakdown
      }
    }));
    
    setTimeout(updatePricing, 0);
  }
};

// Get current rate type from label
const getCurrentRateType = (label: string): string => {
  if (label.includes('Daily Rate')) return 'daily_rate';
  if (label.includes('Weekly Rate')) return 'weekly_rate';
  if (label.includes('Monthly Rate')) return 'monthly_rate';
  if (label.includes('Weekend Rate')) return 'weekend_rate';
  return selectedRateType;
};

  
  // Calculate total from breakdown
  const calculateSubtotal = (): number => {
    return formData.pricing.breakdown.reduce((sum, item) => {
      return sum + (parseFloat(item.total) || 0);
    }, 0);
  };
  
  // Calculate taxes based on subtotal
const calculateTaxes = (subtotal: number): Tax[] => {
  if (!taxConfig.enabled) return [];
  
  const taxAmount = subtotal * taxConfig.rate;
  return [
    {
      code: taxConfig.code,
      rate: taxConfig.rate,
      amount: taxAmount.toFixed(2)
    }
  ];
};

  
  // Calculate discounts total
  const calculateDiscountsTotal = (): number => {
    if (discount.amount) {
      return parseFloat(discount.amount) || 0;
    }
    return 0;
  };
  
  // Update all pricing calculations
  const updatePricing = () => {
    const subtotal = calculateSubtotal();
    const taxes = calculateTaxes(subtotal);
    const taxesTotal = taxes.reduce((sum, tax) => sum + parseFloat(tax.amount), 0);
    const discountsTotal = calculateDiscountsTotal();
    const grandTotal = subtotal + taxesTotal - discountsTotal;
    
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        taxes: taxes,
        grand_total: grandTotal.toFixed(2)
      }
    }));
  };
  
  // Handle breakdown item changes
const handleBreakdownChange = (index: number, field: keyof BreakdownItem, value: string | number) => {
  // Prevent editing of unit_amount field
  if (field === 'unit_amount') {
    return;
  }
  
  const newBreakdown = [...formData.pricing.breakdown];
  newBreakdown[index] = { ...newBreakdown[index], [field]: value };
  
  // Auto-calculate total if quantity is changed
  if (field === 'quantity') {
    const quantity = Number(value);
    const unitAmount = parseFloat(newBreakdown[index].unit_amount);
    if (!isNaN(quantity) && !isNaN(unitAmount)) {
      newBreakdown[index].total = (quantity * unitAmount).toFixed(2);
    }
  }
  
  setFormData(prev => ({
    ...prev,
    pricing: {
      ...prev.pricing,
      breakdown: newBreakdown
    }
  }));
  
  setTimeout(updatePricing, 0);
};
  
  // Handle discount change
  const handleDiscountChange = (field: keyof Discount, value: string) => {
    setDiscount(prev => ({ ...prev, [field]: value }));
    setTimeout(updatePricing, 0);
  };
  
  // Handle driver snapshot changes
  const handleDriverChange = (field: string, value: string) => {
    setDriverInfo(prev => ({ ...prev, [field]: value }));
  };
  
  const handleLicenseChange = (field: string, value: string) => {
    setDriverInfo(prev => ({
      ...prev,
      driver_license: {
        ...prev.driver_license,
        [field]: value
      }
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validate required fields
    if (!formData.code) {
      setError('Reservation code is required');
      setLoading(false);
      return;
    }
    
    if (!formData.pickup.branch_id) {
      setError('Pickup branch is required');
      setLoading(false);
      return;
    }
    
    if (!formData.dropoff.branch_id) {
      setError('Dropoff branch is required');
      setLoading(false);
      return;
    }
    
    if (!formData.pickup.at || !formData.dropoff.at) {
      setError('Pickup and dropoff dates are required');
      setLoading(false);
      return;
    }
    
    // Prepare final payload
    const payload: ReservationPayload = {
      ...formData,
      pricing: {
        ...formData.pricing,
        computed_at: new Date().toISOString()
      }
    };
    
    // Add discounts only if has values
    if (discount.promo_code_id && discount.amount) {
      payload.pricing.discounts = [discount];
    }
    
    // Add driver snapshot only if has values
    if (driverInfo.full_name || driverInfo.phone || driverInfo.email) {
      payload.driver_snapshot = {
        ...driverInfo,
        driver_license: {
          ...driverInfo.driver_license,
          expires_at: driverInfo.driver_license.expires_at 
            ? new Date(driverInfo.driver_license.expires_at).toISOString() 
            : ''
        }
      };
    }
    
    try {
        await reservationsService.createReservation(payload);
        setSuccess(true);
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate(`/vehicle`);
        }, 2000);
        
      } catch (err: any) {
        setError(err.message || 'Failed to create reservation');
      } finally {
        setLoading(false);
      }
  };
  
  // Calculate duration in days
  const calculateDuration = () => {
    if (formData.pickup.at && formData.dropoff.at) {
      const pickupDate = new Date(formData.pickup.at);
      const dropoffDate = new Date(formData.dropoff.at);
      const diffTime = Math.abs(dropoffDate.getTime() - pickupDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays || 1;
    }
    return 1;
  };
  
  // Auto-calculate based on rate plan if available
  useEffect(() => {
  if (ratePlan && vehicle) {
    let rateValue = '0';
    switch(selectedRateType) {
      case 'daily_rate':
        rateValue = ratePlan.daily_rate?.$numberDecimal || '0';
        break;
      case 'weekly_rate':
        rateValue = ratePlan.weekly_rate?.$numberDecimal || '0';
        break;
      case 'monthly_rate':
        rateValue = ratePlan.monthly_rate?.$numberDecimal || '0';
        break;
      case 'weekend_rate':
        rateValue = ratePlan.weekend_rate?.$numberDecimal || '0';
        break;
      default:
        rateValue = ratePlan.daily_rate?.$numberDecimal || '0';
    }
    
    const days = calculateDuration();
    const subtotal = parseFloat(rateValue) * days;
    
    const rateTypeLabel = {
      daily_rate: 'Daily Rate',
      weekly_rate: 'Weekly Rate',
      monthly_rate: 'Monthly Rate',
      weekend_rate: 'Weekend Rate'
    };
    
    setFormData(prev => ({
      ...prev,
      vehicle_id: vehicle._id,
      vehicle_model_id: vehicle.vehicle_model_id?._id || '',
      pricing: {
        ...prev.pricing,
        breakdown: [
          {
            label: `${ratePlan.name} - ${rateTypeLabel[selectedRateType as keyof typeof rateTypeLabel]}`,
            quantity: days,
            unit_amount: rateValue,
            total: subtotal.toFixed(2)
          }
        ],
        grand_total: subtotal.toFixed(2)
      }
    }));
  }
}, [ratePlan, vehicle, formData.pickup.at, formData.dropoff.at, selectedRateType]);
  
  // Update pricing when subtotal or discount changes
  useEffect(() => {
    updatePricing();
  }, [formData.pricing.breakdown, discount]);

  useEffect(() => {
  if (formData.pricing.grand_total) {
    setFormData(prev => ({
      ...prev,
      payment_summary: {
        ...prev.payment_summary,
        outstanding: formData.pricing.grand_total
      }
    }));
  }
}, [formData.pricing.grand_total]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900/5 via-cyan-100/30 to-blue-500/10">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-74">
        {/* Fixed Navigation Bar */}
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
                  <span className="text-gray-900 font-semibold">Book Now</span>
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

        {/* Main Content Area with proper padding for fixed nav */}
        <div className="pt-24 pb-8 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header with Back Button */}
            <div className="mb-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Create New Reservation</h1>
              <p className="text-gray-600 mt-1">Fill in the details to complete the booking</p>
            </div>
            
            {/* Success Message */}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Reservation Created Successfully!</p>
                  <p className="text-sm text-green-600">Redirecting to vehicles...</p>
                </div>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vehicle Summary */}
              {vehicle && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Vehicle Details</h2>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {vehicle.photos?.[0] ? (
                        <img src={vehicle.photos[0]} alt={vehicle.vehicle_model_id?.model} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {vehicle.vehicle_model_id?.make} {vehicle.vehicle_model_id?.model} ({vehicle.vehicle_model_id?.year})
                      </h3>
                      <p className="text-sm text-gray-600">{vehicle.vehicle_model_id?.class}</p>
                      <p className="text-sm text-gray-500">Plate: {vehicle.plate_number}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Rental Details */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Rental Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reservation Code */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Hash className="w-4 h-4 inline mr-1" />
                      Reservation Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Enter reservation code (e.g., HRE-2025-000131)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter a unique reservation code</p>
                  </div>
                  
                  {/* Pickup Branch */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Pickup Branch <span className="text-red-500">*</span>
                    </label>
                    {loadingBranches ? (
                      <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                        <Loader className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-500">Loading branches...</span>
                      </div>
                    ) : (
                      <select
                        value={formData.pickup.branch_id}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pickup: { ...prev.pickup, branch_id: e.target.value }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select branch</option>
                        {branches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name} - {branch.address.city}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  {/* Dropoff Branch */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Dropoff Branch <span className="text-red-500">*</span>
                    </label>
                    {loadingBranches ? (
                      <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                        <Loader className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-500">Loading branches...</span>
                      </div>
                    ) : (
                      <select
                        value={formData.dropoff.branch_id}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          dropoff: { ...prev.dropoff, branch_id: e.target.value }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select branch</option>
                        {branches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name} - {branch.address.city}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  {/* Pickup Date/Time */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Pickup Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.pickup.at.replace('Z', '').slice(0, 16)}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        pickup: { ...prev.pickup, at: new Date(e.target.value).toISOString() }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  {/* Dropoff Date/Time */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Dropoff Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.dropoff.at.replace('Z', '').slice(0, 16)}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        dropoff: { ...prev.dropoff, at: new Date(e.target.value).toISOString() }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Pricing Breakdown */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Pricing</h2>
                    
                                      
                    
                                       
                    {/* Breakdown Items */}
                    <div className="space-y-3">
                      {formData.pricing.breakdown.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end">
                         <div className="col-span-4">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Rate Type</label>
                                <select
                                  value={getCurrentRateType(item.label)}
                                  onChange={(e) => handleRateTypeSelect(index, e.target.value, item)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  required
                                >
                                  <option value="daily_rate">Daily Rate</option>
                                  <option value="weekly_rate">Weekly Rate</option>
                                  <option value="monthly_rate">Monthly Rate</option>
                                  <option value="weekend_rate">Weekend Rate</option>
                                </select>
                              </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity (Days)</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleBreakdownChange(index, 'quantity', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              required
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Unit Amount ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_amount}
                              readOnly
                              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm cursor-not-allowed"
                              title="Unit amount is automatically calculated based on selected rate type"
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Total ($)</label>
                            <input
                              type="text"
                              value={item.total}
                              readOnly
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Note about auto-calculation */}
                    <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                      <p>ℹ️ Unit amount is automatically populated from the selected rate type and cannot be edited. Quantity can be adjusted to calculate the total.</p>
                    </div>
                    
                    {/* Tax Summary (Calculated automatically) */}
                    {formData.pricing.taxes && formData.pricing.taxes.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
                        </div>
                        {formData.pricing.taxes.map((tax, index) => (
                          <div key={index} className="flex justify-between items-center text-sm mt-2">
                            <span className="text-gray-600">{tax.code} ({(tax.rate * 100).toFixed(0)}%):</span>
                            <span className="font-semibold">${tax.amount}</span>
                          </div>
                        ))}
                        {discount.amount && (
                          <div className="flex justify-between items-center text-sm mt-2 text-green-600">
                            <span>Discount:</span>
                            <span>-${parseFloat(discount.amount).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Discounts Section (Optional) */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h3 className="font-semibold text-gray-800 mb-3">Discounts (Optional)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Promo Code ID
                          </label>
                          <input
                            type="text"
                            value={discount.promo_code_id}
                            onChange={(e) => handleDiscountChange('promo_code_id', e.target.value)}
                            placeholder="Enter promo code"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Discount Amount
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={discount.amount}
                            onChange={(e) => handleDiscountChange('amount', e.target.value)}
                            placeholder="Enter discount amount"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Grand Total */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900 text-lg">Grand Total:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formData.pricing.currency} {parseFloat(formData.pricing.grand_total || '0').toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
              
              {/* Driver Information (Optional) */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Driver Information (Optional)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={driverInfo.full_name}
                      onChange={(e) => handleDriverChange('full_name', e.target.value)}
                      placeholder="Enter full name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={driverInfo.phone}
                      onChange={(e) => handleDriverChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={driverInfo.email}
                      onChange={(e) => handleDriverChange('email', e.target.value)}
                      placeholder="Enter email address"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Driver License Number
                    </label>
                    <input
                      type="text"
                      value={driverInfo.driver_license.number}
                      onChange={(e) => handleLicenseChange('number', e.target.value)}
                      placeholder="Enter license number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      License Country
                    </label>
                    <select
                      value={driverInfo.driver_license.country}
                      onChange={(e) => handleLicenseChange('country', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ZW">Zimbabwe</option>
                      <option value="ZA">South Africa</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      License Class
                    </label>
                    <select
                      value={driverInfo.driver_license.class}
                      onChange={(e) => handleLicenseChange('class', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Class 1">Class 1</option>
                      <option value="Class 2">Class 2</option>
                      <option value="Class 3">Class 3</option>
                      <option value="Class 4">Class 4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      License Expiry Date
                    </label>
                    <input
                      type="date"
                      value={driverInfo.driver_license.expires_at.split('T')[0]}
                      onChange={(e) => handleLicenseChange('expires_at', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">* Driver information is optional. You can leave these fields blank if not required.</p>
              </div>
              
              {/* Submit Button */}
              <div className="flex gap-4 pb-8">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateReservation;