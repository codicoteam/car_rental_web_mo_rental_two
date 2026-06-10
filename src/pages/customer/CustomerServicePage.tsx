import { useState } from 'react';
import { Calendar, Search, ChevronRight, MapPin, Phone, Mail, Menu, ChevronDown, AlertCircle, Wrench, Car, Settings, FileText } from 'lucide-react';
import Sidebar from '../../components/CustomerSidebar';

const Service = () => {
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);


  const maintenanceServices = [
    {
      id: 1,
      service: "Oil Change & Filter Replacement",
      vehicle: "Toyota Camry 2023",
      image: "https://images.unsplash.com/photo-1621135802920-133df287f89c?w=600&q=80",
      status: "Available",
      estimatedCost: 120,
      duration: "1-2 hours",
      location: "Downtown Service Center",
      nextDue: "3,000 miles",
      description: "Complete oil change with premium synthetic oil and filter replacement"
    },
    {
      id: 2,
      service: "Brake System Inspection & Repair",
      vehicle: "Honda Civic 2022",
      image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&q=80",
      status: "Available",
      estimatedCost: 350,
      duration: "3-4 hours",
      location: "Northside Auto Care",
      nextDue: "15,000 miles",
      description: "Complete brake inspection, pad replacement, and rotor resurfacing"
    },
    {
      id: 3,
      service: "Tire Rotation & Balancing",
      vehicle: "Ford Explorer 2023",
      image: "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=600&q=80",
      status: "Available",
      estimatedCost: 80,
      duration: "1 hour",
      location: "Quick Service Hub",
      nextDue: "6,000 miles",
      description: "Professional tire rotation and wheel balancing for optimal wear"
    },
    {
      id: 4,
      service: "Engine Tune-up",
      vehicle: "BMW 3 Series 2021",
      image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80",
      status: "Available",
      estimatedCost: 450,
      duration: "4-5 hours",
      location: "Premium Service Center",
      nextDue: "30,000 miles",
      description: "Comprehensive engine performance check and spark plug replacement"
    },
    {
      id: 5,
      service: "AC System Service",
      vehicle: "Tesla Model 3 2022",
      image: "https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=600&q=80",
      status: "Available",
      estimatedCost: 200,
      duration: "2-3 hours",
      location: "Climate Control Specialists",
      nextDue: "Annual",
      description: "AC system recharge and performance optimization"
    },
    {
      id: 6,
      service: "Transmission Fluid Change",
      vehicle: "Chevrolet Tahoe 2020",
      image: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&q=80",
      status: "Available",
      estimatedCost: 280,
      duration: "2-3 hours",
      location: "Transmission Experts",
      nextDue: "60,000 miles",
      description: "Complete transmission fluid flush and filter replacement"
    }
  ];

  const serviceOrders = [
    {
      id: 1,
      customer: "James Anderson",
      email: "james.a@email.com",
      phone: "+1 (555) 123-4567",
      vehicle: "Toyota Camry 2023",
      serviceType: "Oil Change & Filter Replacement",
      vehicleImage: "https://images.unsplash.com/photo-1621135802920-133df287f89c?w=400&q=80",
      scheduledDate: "2025-11-28",
      estimatedCompletion: "2025-11-28",
      status: "Scheduled",
      totalAmount: "$120",
      serviceLocation: "Downtown Service Center",
      duration: "2 hours",
      priority: "Standard",
      notes: "Use synthetic oil only"
    },
    {
      id: 2,
      customer: "Sarah Mitchell",
      email: "sarah.m@email.com",
      phone: "+1 (555) 234-5678",
      vehicle: "Honda Civic 2022",
      serviceType: "Brake System Inspection & Repair",
      vehicleImage: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&q=80",
      scheduledDate: "2025-11-25",
      estimatedCompletion: "2025-11-25",
      status: "In Progress",
      totalAmount: "$350",
      serviceLocation: "Northside Auto Care",
      duration: "4 hours",
      priority: "High",
      notes: "Front brakes grinding noise reported"
    },
    {
      id: 3,
      customer: "Michael Chen",
      email: "m.chen@email.com",
      phone: "+1 (555) 345-6789",
      vehicle: "BMW 3 Series 2021",
      serviceType: "Engine Tune-up",
      vehicleImage: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&q=80",
      scheduledDate: "2025-11-25",
      estimatedCompletion: "2025-11-25",
      status: "In Progress",
      totalAmount: "$450",
      serviceLocation: "Premium Service Center",
      duration: "5 hours",
      priority: "Standard",
      notes: "Check engine light is on"
    },
    {
      id: 4,
      customer: "Emma Williams",
      email: "emma.w@email.com",
      phone: "+1 (555) 456-7890",
      vehicle: "Ford Explorer 2023",
      serviceType: "Tire Rotation & Balancing",
      vehicleImage: "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=400&q=80",
      scheduledDate: "2025-12-01",
      estimatedCompletion: "2025-12-01",
      status: "Scheduled",
      totalAmount: "$80",
      serviceLocation: "Quick Service Hub",
      duration: "1 hour",
      priority: "Standard",
      notes: "Include wheel alignment check"
    },
    {
      id: 5,
      customer: "David Rodriguez",
      email: "david.r@email.com",
      phone: "+1 (555) 567-8901",
      vehicle: "Tesla Model 3 2022",
      serviceType: "AC System Service",
      vehicleImage: "https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=400&q=80",
      scheduledDate: "2025-12-03",
      estimatedCompletion: "2025-12-03",
      status: "Scheduled",
      totalAmount: "$200",
      serviceLocation: "Climate Control Specialists",
      duration: "3 hours",
      priority: "Standard",
      notes: "AC not cooling properly"
    },
    {
      id: 6,
      customer: "Sophie Laurent",
      email: "sophie.l@email.com",
      phone: "+1 (555) 678-9012",
      vehicle: "Chevrolet Tahoe 2020",
      serviceType: "Transmission Fluid Change",
      vehicleImage: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&q=80",
      scheduledDate: "2025-11-26",
      estimatedCompletion: "2025-11-26",
      status: "Completed",
      totalAmount: "$280",
      serviceLocation: "Transmission Experts",
      duration: "3 hours",
      priority: "Standard",
      notes: "Routine maintenance"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-emerald-500 text-white";
      case "Scheduled": return "bg-indigo-500 text-white";
      case "In Progress": return "bg-amber-500 text-white";
      case "Completed": return "bg-emerald-500 text-white";
      case "Cancelled": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "In Progress": return <Settings className="w-4 h-4" />;
      case "Scheduled": return <Calendar className="w-4 h-4" />;
      case "Completed": return <FileText className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800 border-red-200";
      case "Medium": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Standard": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredServiceOrders = serviceOrders.filter(order => {
    const matchesTab = selectedTab === 'all' || order.status.toLowerCase().replace(' ', '') === selectedTab;
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
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
                  <span className="text-gray-800 font-medium">Service Management</span>
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

            {/* Maintenance Services */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Available Services</h2>
                <button className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
                  View All Services <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {maintenanceServices.map((service) => (
                  <div key={service.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
                    <div className="relative h-56 overflow-hidden">
                      <img 
                        src={service.image} 
                        alt={`${service.service}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-4 right-4">
                        <span className={`px-4 py-2 rounded-xl text-xs font-bold ${getStatusColor(service.status)} shadow-lg backdrop-blur-sm`}>
                          {service.status}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 text-white text-sm">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">{service.location}</span>
                          <span className="ml-auto text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                            Due: {service.nextDue}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench className="w-5 h-5 text-blue-600" />
                          <h3 className="text-xl font-bold text-gray-800">{service.service}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <Car className="w-4 h-4" />
                          <p className="font-medium">{service.vehicle}</p>
                        </div>
                        <p className="text-sm text-gray-500">{service.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Estimated Cost</p>
                          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            ${service.estimatedCost}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{service.duration}</p>
                        </div>
                        
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Service Orders Section */}
            <div>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Service Orders & Status</h2>
                
                {/* Filter Tabs & Search */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100 mb-6">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-3 flex-wrap">
                      {['all', 'scheduled', 'inprogress', 'completed'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setSelectedTab(tab)}
                          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                            selectedTab === tab
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {tab === 'inprogress' ? 'In Progress' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                          <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                            {tab === 'all' ? serviceOrders.length : 
                             serviceOrders.filter(order => order.status.toLowerCase().replace(' ', '') === tab).length}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="relative w-full md:w-auto">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search service orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-80 text-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Service Order Cards */}
              <div className="grid grid-cols-1 gap-6">
                {filteredServiceOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex flex-col lg:flex-row">
                      {/* Vehicle Image */}
                      <div className="lg:w-80 h-64 lg:h-auto relative overflow-hidden">
                        <img 
                          src={order.vehicleImage} 
                          alt={order.vehicle}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                      </div>
                      
                      {/* Service Order Details */}
                      <div className="flex-1 p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-2xl font-bold text-gray-800">{order.customer}</h3>
                              <span className={`px-4 py-2 rounded-xl text-xs font-bold ${getStatusColor(order.status)} shadow-md flex items-center gap-2`}>
                                {getStatusIcon(order.status)}
                                {order.status}
                              </span>
                              <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getPriorityColor(order.priority)}`}>
                                {order.priority} Priority
                              </span>
                            </div>
                            <p className="text-xl text-gray-700 font-semibold mb-2">{order.vehicle}</p>
                            <p className="text-lg text-blue-600 font-medium mb-2">{order.serviceType}</p>
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>{order.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{order.phone}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">Total Cost</p>
                            <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                              {order.totalAmount}
                            </p>
                          </div>
                        </div>

                        {/* Service Timeline */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <p className="text-sm text-gray-600 mb-2 font-medium">Scheduled Date</p>
                              <p className="text-lg font-bold text-gray-800">{order.scheduledDate}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-2 font-medium">Estimated Completion</p>
                              <p className="text-lg font-bold text-gray-800">{order.estimatedCompletion}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-2 font-medium">Duration</p>
                              <p className="text-lg font-bold text-gray-800">{order.duration}</p>
                            </div>
                          </div>
                          {order.notes && (
                            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <p className="text-sm text-amber-800">
                                <span className="font-semibold">Notes:</span> {order.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Location & Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            <span className="font-medium">{order.serviceLocation}</span>
                          </div>
                          <div className="flex gap-3">
                            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all">
                              View Details
                            </button>
                            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg">
                              Track Progress
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredServiceOrders.length === 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-blue-100">
                  <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600 font-semibold">No service orders found</p>
                  <p className="text-gray-500 mt-2">Try adjusting your filters or search terms</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Service;