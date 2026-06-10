import { useState, useEffect } from 'react';
import { Search, Menu, ChevronDown, AlertCircle, Tag, Copy, CheckCircle, Calendar as CalendarIcon, Users } from 'lucide-react';
import Sidebar from '../../components/CustomerSidebar';

// Types for promo codes
interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minRentalDays?: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  applicableVehicleTypes?: string[];
}

const Promo = () => {
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Mock data for testing - remove this when your API is working
  const mockPromoCodes: PromoCode[] = [
    {
      id: '1',
      code: 'SUMMER25',
      description: 'Summer special discount for luxury rentals',
      discountType: 'PERCENTAGE',
      discountValue: 25,
      minRentalDays: 3,
      maxDiscountAmount: 500,
      validFrom: '2024-06-01',
      validUntil: '2024-08-31',
      usageLimit: 100,
      usedCount: 45,
      isActive: true,
      applicableVehicleTypes: ['SUV', 'SEDAN', 'SPORTS']
    },
    {
      id: '2',
      code: 'WEEKEND100',
      description: 'Weekend rental special',
      discountType: 'FIXED_AMOUNT',
      discountValue: 100,
      minRentalDays: 2,
      validFrom: '2024-01-01',
      validUntil: '2024-12-31',
      usageLimit: 200,
      usedCount: 89,
      isActive: true,
      applicableVehicleTypes: ['ALL']
    },
    {
      id: '3',
      code: 'LUXURY50',
      description: '50% off on premium luxury vehicles',
      discountType: 'PERCENTAGE',
      discountValue: 50,
      minRentalDays: 1,
      maxDiscountAmount: 1000,
      validFrom: '2024-11-01',
      validUntil: '2024-11-30', // This will show as expiring soon
      usageLimit: 50,
      usedCount: 12,
      isActive: true,
      applicableVehicleTypes: ['LUXURY', 'SPORTS']
    },
    {
      id: '4',
      code: 'FIRST15',
      description: '15% off for first-time customers',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minRentalDays: 1,
      validFrom: '2024-01-01',
      validUntil: '2024-12-31',
      usageLimit: 500,
      usedCount: 234,
      isActive: true,
      applicableVehicleTypes: ['ALL']
    },
    {
      id: '5',
      code: 'WEEKLY200',
      description: '$200 off weekly rentals',
      discountType: 'FIXED_AMOUNT',
      discountValue: 200,
      minRentalDays: 7,
      validFrom: '2024-01-01',
      validUntil: '2024-12-31',
      usageLimit: 150,
      usedCount: 67,
      isActive: true,
      applicableVehicleTypes: ['SEDAN', 'SUV']
    },
    {
      id: '6',
      code: 'VIP300',
      description: 'Exclusive VIP discount',
      discountType: 'FIXED_AMOUNT',
      discountValue: 300,
      minRentalDays: 1,
      validFrom: '2024-01-01',
      validUntil: '2024-12-31',
      usageLimit: 75,
      usedCount: 28,
      isActive: true,
      applicableVehicleTypes: ['LUXURY', 'SPORTS', 'SUV']
    }
  ];

  // Fetch active promo codes on component mount
  useEffect(() => {
    fetchActivePromoCodes();
  }, []);

  const fetchActivePromoCodes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from API first
      console.log('Fetching promo codes from API...');
      const response = await fetch('/api/v1/promo-codes/active');
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response:', data);
        setPromoCodes(data);
      } else {
        // If API fails, use mock data
        console.log('API failed, using mock data');
        throw new Error('API not available, showing demo data');
      }
    } catch (err) {
      console.log('Using mock promo codes:', err);
      setPromoCodes(mockPromoCodes);
      setError('Connected to demo data - API endpoint not available');
    } finally {
      setLoading(false);
    }
  };


  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getDiscountDisplay = (promo: PromoCode) => {
    if (promo.discountType === 'PERCENTAGE') {
      return `${promo.discountValue}% OFF`;
    } else {
      return `$${promo.discountValue} OFF`;
    }
  };

  const getDiscountColor = (discountValue: number, discountType: string) => {
    if (discountType === 'PERCENTAGE') {
      if (discountValue >= 30) return 'from-red-500 to-pink-600';
      if (discountValue >= 15) return 'from-orange-500 to-red-500';
      return 'from-green-500 to-emerald-600';
    } else {
      if (discountValue >= 500) return 'from-red-500 to-pink-600';
      if (discountValue >= 200) return 'from-orange-500 to-red-500';
      return 'from-green-500 to-emerald-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpiringSoon = (validUntil: string) => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return new Date(validUntil) <= sevenDaysFromNow;
  };

  // Filter promo codes based on search
  const filteredPromoCodes = promoCodes.filter(promo => {
    const matchesSearch = promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promo.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Sidebar - Fixed Position */}
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-74">
        {/* Premium Navbar - Fixed Position */}
        <nav className="fixed top-0 right-0 left-0 lg:left-74 z-40 bg-white/80 backdrop-blur-xl shadow-sm border-b border-blue-100 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center justify-between h-20">
              {/* Left Side - Breadcrumb */}
              <div className="flex items-center">
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mr-4 p-2 rounded-xl bg-slate-100/50 hover:bg-slate-200 transition-all duration-200"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600">Dashboard</span>
                  <span className="text-slate-300">›</span>
                  <span className="text-gray-800 font-medium">Promo Codes</span>
                </div>
              </div>

              {/* Right Side - Profile & Actions */}
              <div className="flex items-center gap-4">
                {/* Profile Section */}
                <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition-colors">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-800">John Doe</p>
                    <p className="text-xs text-gray-500">Customer</p>
                  </div>
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <span className="text-white font-semibold text-sm">JD</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow-sm"></div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto pt-20">
          <div className="max-w-7xl mx-auto p-8">
            {/* Premium Header */}
            <div className="mb-10">
              <h2 className="text-4xl font-bold text-gray-800 mb-2">Special Offers & Promo Codes</h2>
              <p className="text-gray-600 text-lg">Discover exclusive discounts for your luxury car rentals</p>
            </div>

            {/* Demo Data Notice */}
            {error && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-amber-800 font-medium">Demo Mode</p>
                    <p className="text-amber-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Promo Codes Section */}
            <div className="mb-10">
              {/* Search and Filter */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedTab('all')}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                        selectedTab === 'all'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All Promo Codes
                      <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                        {promoCodes.length}
                      </span>
                    </button>
                  </div>
                  <div className="relative w-full md:w-auto">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search promo codes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-80 text-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Promo Codes Grid */}
              {loading ? (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-blue-100">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-xl text-gray-600 font-semibold">Loading Promo Codes...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                    {filteredPromoCodes.map((promo) => (
                      <div 
                        key={promo.id} 
                        className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group"
                      >
                        {/* Promo Header with Gradient */}
                        <div className={`bg-gradient-to-r ${getDiscountColor(promo.discountValue, promo.discountType)} p-6 relative overflow-hidden`}>
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                          
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                              <Tag className="w-8 h-8 text-white" />
                              {isExpiringSoon(promo.validUntil) && (
                                <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                                  Expiring Soon
                                </span>
                              )}
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">{getDiscountDisplay(promo)}</h3>
                            <p className="text-white/90 text-sm">{promo.description}</p>
                          </div>
                        </div>

                        {/* Promo Code Display */}
                        <div className="p-6 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Promo Code</p>
                              <div className="flex items-center gap-3">
                                <code className="text-2xl font-mono font-bold text-gray-800 bg-gray-50 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300">
                                  {promo.code}
                                </code>
                                <button
                                  onClick={() => handleCopyCode(promo.code)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Copy code"
                                >
                                  {copiedCode === promo.code ? (
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                  ) : (
                                    <Copy className="w-6 h-6 text-gray-400" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Promo Details */}
                        <div className="p-6">
                          <div className="space-y-4">
                            {/* Validity Period */}
                            <div className="flex items-center gap-3 text-sm">
                              <CalendarIcon className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="text-gray-600">Valid until: </span>
                                <span className="font-semibold text-gray-800">
                                  {formatDate(promo.validUntil)}
                                </span>
                              </div>
                            </div>

                            {/* Usage Info */}
                            <div className="flex items-center gap-3 text-sm">
                              <Users className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="text-gray-600">Usage: </span>
                                <span className="font-semibold text-gray-800">
                                  {promo.usedCount}{promo.usageLimit ? ` / ${promo.usageLimit}` : ''}
                                </span>
                              </div>
                            </div>

                            {/* Conditions */}
                            <div className="space-y-2">
                              {promo.minRentalDays && (
                                <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                                  📅 Minimum {promo.minRentalDays} rental day{promo.minRentalDays > 1 ? 's' : ''}
                                </div>
                              )}
                              {promo.maxDiscountAmount && promo.discountType === 'PERCENTAGE' && (
                                <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                                  💰 Maximum discount: ${promo.maxDiscountAmount}
                                </div>
                              )}
                              {promo.applicableVehicleTypes && promo.applicableVehicleTypes.length > 0 && (
                                <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                                  🚗 Applies to: {promo.applicableVehicleTypes.join(', ')}
                                </div>
                              )}
                            </div>

                            {/* Apply Button */}
                            <button 
                              onClick={() => handleCopyCode(promo.code)}
                              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl mt-4"
                            >
                              {copiedCode === promo.code ? 'Copied!' : 'Copy & Apply Code'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredPromoCodes.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-blue-100">
                      <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-xl text-gray-600 font-semibold">No promo codes found</p>
                      <p className="text-gray-500 mt-2">Try adjusting your search terms or check back later for new offers</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Info Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">How to Use Promo Codes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold text-lg">1</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Copy Code</h4>
                  <p className="text-gray-600 text-sm">Click the copy button next to your desired promo code</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold text-lg">2</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Apply at Checkout</h4>
                  <p className="text-gray-600 text-sm">Paste the code in the promo code field during booking</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold text-lg">3</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Enjoy Savings</h4>
                  <p className="text-gray-600 text-sm">Your discount will be automatically applied to your total</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Promo;