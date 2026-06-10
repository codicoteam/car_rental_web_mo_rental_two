import { useState, type JSX } from 'react';
import { Clock, Search, Menu, ChevronDown, MapPin, Phone, Mail, AlertCircle, Star, Zap, Shield, Car, Settings } from 'lucide-react';
import Sidebar from '../../components/CustomerSidebar';

// Define types
interface RatePlan {
  id: number;
  name: string;
  vehicleType: string;
  branch: string;
  baseRate: number;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  mileageIncluded: number;
  excessMileageFee: number;
  securityDeposit: number;
  features: string[];
  popularity: number;
  isFeatured: boolean;
  image: string;
  category: 'economy' | 'premium' | 'luxury' | 'suv' | 'sports';
}

interface Branch {
  id: number;
  name: string;
  location: string;
  phone: string;
  email: string;
  hours: string;
  vehiclesAvailable: number;
}

const Pricing = () => {
  const [] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  const branches: Branch[] = [
    {
      id: 1,
      name: "Beverly Hills Showroom",
      location: "123 Rodeo Drive, Beverly Hills, CA",
      phone: "+1 (555) 123-4567",
      email: "beverlyhills@luxuryrentals.com",
      hours: "Mon-Sun: 8:00 AM - 10:00 PM",
      vehiclesAvailable: 24
    },
    {
      id: 2,
      name: "Manhattan Office",
      location: "456 Park Avenue, New York, NY",
      phone: "+1 (555) 234-5678",
      email: "manhattan@luxuryrentals.com",
      hours: "Mon-Sun: 7:00 AM - 11:00 PM",
      vehiclesAvailable: 32
    },
    {
      id: 3,
      name: "Miami Beach Location",
      location: "789 Ocean Drive, Miami Beach, FL",
      phone: "+1 (555) 345-6789",
      email: "miami@luxuryrentals.com",
      hours: "Mon-Sun: 6:00 AM - 12:00 AM",
      vehiclesAvailable: 28
    },
    {
      id: 4,
      name: "Chicago Center",
      location: "321 Magnificent Mile, Chicago, IL",
      phone: "+1 (555) 456-7890",
      email: "chicago@luxuryrentals.com",
      hours: "Mon-Sun: 8:00 AM - 9:00 PM",
      vehiclesAvailable: 18
    }
  ];

  const ratePlans: RatePlan[] = [
    {
      id: 1,
      name: "Executive Luxury",
      vehicleType: "Mercedes-Benz S-Class",
      branch: "Beverly Hills Showroom",
      baseRate: 299,
      dailyRate: 299,
      weeklyRate: 1899,
      monthlyRate: 6999,
      mileageIncluded: 100,
      excessMileageFee: 0.35,
      securityDeposit: 1500,
      features: ["Chauffeur Service", "Premium Insurance", "24/7 Roadside Assistance", "Complimentary Car Wash", "Airport Pickup"],
      popularity: 4.8,
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80",
      category: 'luxury'
    },
    {
      id: 2,
      name: "Sports Premium",
      vehicleType: "Porsche 911 Turbo S",
      branch: "Manhattan Office",
      baseRate: 499,
      dailyRate: 499,
      weeklyRate: 2999,
      monthlyRate: 10999,
      mileageIncluded: 150,
      excessMileageFee: 0.45,
      securityDeposit: 2500,
      features: ["Performance Package", "Track Day Access", "Premium Fuel Included", "GPS Tracking", "Valet Service"],
      popularity: 4.9,
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=600&q=80",
      category: 'sports'
    },
    {
      id: 3,
      name: "Ultimate Luxury",
      vehicleType: "Rolls-Royce Phantom",
      branch: "Beverly Hills Showroom",
      baseRate: 899,
      dailyRate: 899,
      weeklyRate: 5499,
      monthlyRate: 19999,
      mileageIncluded: 200,
      excessMileageFee: 0.55,
      securityDeposit: 5000,
      features: ["Personal Butler", "Luxury Insurance", "Concierge Service", "Gourmet Refreshments", "VIP Airport Service"],
      popularity: 4.9,
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=600&q=80",
      category: 'luxury'
    },
    {
      id: 4,
      name: "Family Premium",
      vehicleType: "Range Rover Autobiography",
      branch: "Chicago Center",
      baseRate: 349,
      dailyRate: 349,
      weeklyRate: 2199,
      monthlyRate: 7999,
      mileageIncluded: 120,
      excessMileageFee: 0.38,
      securityDeposit: 2000,
      features: ["Family Package", "Child Seats Included", "Entertainment System", "Spacious Interior", "All-Weather Package"],
      popularity: 4.7,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80",
      category: 'suv'
    },
    {
      id: 5,
      name: "Business Class",
      vehicleType: "BMW 7 Series",
      branch: "Manhattan Office",
      baseRate: 279,
      dailyRate: 279,
      weeklyRate: 1699,
      monthlyRate: 6299,
      mileageIncluded: 110,
      excessMileageFee: 0.32,
      securityDeposit: 1200,
      features: ["Business Package", "WiFi Hotspot", "Meeting Mode", "Premium Sound System", "Executive Interior"],
      popularity: 4.6,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80",
      category: 'premium'
    },
    {
      id: 6,
      name: "Supercar Experience",
      vehicleType: "Lamborghini Huracán",
      branch: "Miami Beach Location",
      baseRate: 799,
      dailyRate: 799,
      weeklyRate: 4799,
      monthlyRate: 17999,
      mileageIncluded: 100,
      excessMileageFee: 0.65,
      securityDeposit: 7500,
      features: ["Exotic Insurance", "Performance Training", "Photo Session", "Track Access", "VIP Experience"],
      popularity: 4.9,
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1621135802920-133df287f89c?w=600&q=80",
      category: 'sports'
    },
    {
      id: 7,
      name: "City Compact",
      vehicleType: "Audi A4",
      branch: "Chicago Center",
      baseRate: 129,
      dailyRate: 129,
      weeklyRate: 799,
      monthlyRate: 2799,
      mileageIncluded: 80,
      excessMileageFee: 0.25,
      securityDeposit: 750,
      features: ["Economy Package", "City Navigation", "Fuel Efficient", "Easy Parking", "Basic Insurance"],
      popularity: 4.3,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80",
      category: 'economy'
    },
    {
      id: 8,
      name: "Grand Touring",
      vehicleType: "Bentley Continental GT",
      branch: "Miami Beach Location",
      baseRate: 599,
      dailyRate: 599,
      weeklyRate: 3599,
      monthlyRate: 12999,
      mileageIncluded: 180,
      excessMileageFee: 0.42,
      securityDeposit: 3500,
      features: ["Grand Touring Package", "Luxury Picnic Set", "Scenic Route Planning", "Premium Audio", "Comfort Plus Seats"],
      popularity: 4.8,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&q=80",
      category: 'luxury'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Categories', count: ratePlans.length },
    { id: 'luxury', name: 'Luxury Sedans', count: ratePlans.filter(plan => plan.category === 'luxury').length },
    { id: 'sports', name: 'Sports Cars', count: ratePlans.filter(plan => plan.category === 'sports').length },
    { id: 'suv', name: 'SUV & Family', count: ratePlans.filter(plan => plan.category === 'suv').length },
    { id: 'premium', name: 'Premium', count: ratePlans.filter(plan => plan.category === 'premium').length },
    { id: 'economy', name: 'Economy', count: ratePlans.filter(plan => plan.category === 'economy').length }
  ];

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'luxury': return 'bg-purple-500 text-white';
      case 'sports': return 'bg-red-500 text-white';
      case 'suv': return 'bg-green-500 text-white';
      case 'premium': return 'bg-blue-500 text-white';
      case 'economy': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPopularityStars = (popularity: number): JSX.Element[] => {
    const stars = [];
    const fullStars = Math.floor(popularity);
    const hasHalfStar = popularity % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  const filteredRatePlans = ratePlans.filter(plan => {
    const matchesCategory = selectedCategory === 'all' || plan.category === selectedCategory;
    const matchesBranch = selectedBranch === 'all' || plan.branch === selectedBranch;
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.vehicleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.branch.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesBranch && matchesSearch;
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
                  <span className="text-gray-800 font-medium">Pricing & Rate Plans</span>
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

        {/* Dashboard Content - With padding to account for fixed navbar */}
        <div className="flex-1 overflow-y-auto pt-20">
          <div className="max-w-7xl mx-auto p-8">
            {/* Premium Header */}
            <div className="mb-10">
             
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Total Plans</p>
                    <p className="text-2xl font-bold text-gray-800">{ratePlans.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Settings className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Branches</p>
                    <p className="text-2xl font-bold text-gray-800">{branches.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Featured Plans</p>
                    <p className="text-2xl font-bold text-gray-800">{ratePlans.filter(plan => plan.isFeatured).length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Avg. Rating</p>
                    <p className="text-2xl font-bold text-gray-800">4.7/5</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100 mb-8">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                {/* Category Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Vehicle Category</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all ${
                          selectedCategory === category.id
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {category.name}
                        <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                          {category.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Branch Filter */}
                <div className="w-full lg:w-64">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Location</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Branches</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.name}>{branch.name}</option>
                    ))}
                  </select>
                </div>

                {/* Search */}
                <div className="w-full lg:w-80">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Plans</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by plan name, vehicle, or branch..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-800">{filteredRatePlans.length}</span> rate plans
                {searchTerm && (
                  <span> for "<span className="font-semibold text-gray-800">{searchTerm}</span>"</span>
                )}
                {selectedCategory !== 'all' && (
                  <span> • Category: <span className="font-semibold text-gray-800">{categories.find(c => c.id === selectedCategory)?.name}</span></span>
                )}
                {selectedBranch !== 'all' && (
                  <span> • Branch: <span className="font-semibold text-gray-800">{selectedBranch}</span></span>
                )}
              </p>
            </div>

            {/* Rate Plans Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredRatePlans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  {/* Featured Badge */}
                  {plan.isFeatured && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Featured
                      </span>
                    </div>
                  )}

                  {/* Vehicle Image */}
                  <div className="h-48 relative overflow-hidden">
                    <img 
                      src={plan.image} 
                      alt={plan.vehicleType}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(plan.category)} shadow-md`}>
                        {plan.category.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Plan Details */}
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{plan.name}</h3>
                        <p className="text-gray-600 font-medium">{plan.vehicleType}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          {getPopularityStars(plan.popularity)}
                        </div>
                        <p className="text-sm text-gray-500">{plan.popularity}/5</p>
                      </div>
                    </div>

                    {/* Branch Info */}
                    <div className="flex items-center gap-2 text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">{plan.branch}</span>
                    </div>

                    {/* Pricing */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Daily</p>
                          <p className="text-lg font-bold text-gray-800">${plan.dailyRate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Weekly</p>
                          <p className="text-lg font-bold text-gray-800">${plan.weeklyRate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Monthly</p>
                          <p className="text-lg font-bold text-gray-800">${plan.monthlyRate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Deposit</p>
                          <p className="text-lg font-bold text-gray-800">${plan.securityDeposit}</p>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Includes:</p>
                      <div className="flex flex-wrap gap-2">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs">
                            {feature}
                          </span>
                        ))}
                        {plan.features.length > 3 && (
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs">
                            +{plan.features.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-green-600" />
                        <span>{plan.mileageIncluded} mi/day</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-600" />
                        <span>${plan.excessMileageFee}/extra mi</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-semibold transition-all text-sm">
                        View Details
                      </button>
                      <button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl font-semibold transition-all shadow-lg text-sm">
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No Results Message */}
            {filteredRatePlans.length === 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-blue-100">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600 font-semibold">No rate plans found</p>
                <p className="text-gray-500 mt-2">Try adjusting your filters or search terms</p>
              </div>
            )}

            {/* Branches Section */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Our Branch Locations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {branches.map((branch) => (
                  <div key={branch.id} className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{branch.name}</h4>
                        <p className="text-sm text-green-600">{branch.vehiclesAvailable} vehicles</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {branch.phone}
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {branch.email}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {branch.hours}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;