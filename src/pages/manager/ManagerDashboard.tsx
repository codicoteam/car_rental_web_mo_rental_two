import { useState, useEffect } from "react";
import {
  Car,
  Users,
  DollarSign,
  Menu,
  ChevronDown,
  TrendingUp,
  Activity,
  Key,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import ManagerSidebar from "../../components/ManagerSideBar";

const ManagerDashboard = () => {
  const [isDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [animatedValues, setAnimatedValues] = useState([0, 0, 0, 0]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Mock data - replace with actual API calls
  const totalCars = 45;
  const activeRentals = 32;
  const totalCustomers = 156;
  const monthlyRevenue = 48500;

  const firstName = "John Doe"; // Replace with actual user data

  // Theme classes
  const themeClasses = {
    bg: isDarkMode
      ? "bg-gray-900"
      : "bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100",
    card: isDarkMode ? "bg-gray-800/70" : "bg-white/70",
    text: isDarkMode ? "text-white" : "text-slate-800",
    textSecondary: isDarkMode ? "text-gray-400" : "text-slate-600",
    border: isDarkMode ? "border-gray-700" : "border-white/50",
    header: isDarkMode ? "bg-gray-800/80" : "bg-white/80",
    heroGradient: isDarkMode
      ? "from-gray-900 via-gray-800 to-gray-900"
      : "from-slate-900 via-blue-900 to-slate-900",
  };

  // Hero slides data
  const heroSlides = [
    {
      title: "Fleet Management",
      subtitle: "Made Simple",
      description:
        "Monitor your entire vehicle fleet in real-time with powerful analytics",
      image:
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1920&h=1080&fit=crop",
    },
    {
      title: "Track Rentals",
      subtitle: "Effortlessly",
      description:
        "Manage bookings, availability, and customer requests from one dashboard",
      image:
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1920&h=1080&fit=crop",
    },
    {
      title: "Maximize Revenue",
      subtitle: "Intelligently",
      description:
        "Data-driven insights to optimize pricing and boost your profits",
      image:
        "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1920&h=1080&fit=crop",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const metrics = [
    {
      label: "Total Vehicles",
      value: totalCars,
      unit: "",
      trend: "+5%",
      color: "from-blue-500 to-blue-600",
      bgColor: isDarkMode
        ? "bg-blue-900/20"
        : "bg-gradient-to-br from-blue-500/10 to-cyan-500/5",
      borderColor: isDarkMode ? "border-blue-700/50" : "border-blue-200/50",
      icon: Car,
      chartColor: "#3B82F6",
    },
    {
      label: "Active Rentals",
      value: activeRentals,
      unit: "",
      trend: "+12%",
      color: "from-emerald-500 to-emerald-600",
      bgColor: isDarkMode
        ? "bg-emerald-900/20"
        : "bg-gradient-to-br from-emerald-500/10 to-teal-500/5",
      borderColor: isDarkMode
        ? "border-emerald-700/50"
        : "border-emerald-200/50",
      icon: Key,
      chartColor: "#10B981",
    },
    {
      label: "Total Customers",
      value: totalCustomers,
      unit: "",
      trend: "+8%",
      color: "from-purple-500 to-purple-600",
      bgColor: isDarkMode
        ? "bg-purple-900/20"
        : "bg-gradient-to-br from-purple-500/10 to-pink-500/5",
      borderColor: isDarkMode ? "border-purple-700/50" : "border-purple-200/50",
      icon: Users,
      chartColor: "#8B5CF6",
    },
    {
      label: "Monthly Revenue",
      value: monthlyRevenue,
      unit: "$",
      trend: "+15%",
      color: "from-orange-500 to-orange-600",
      bgColor: isDarkMode
        ? "bg-orange-900/20"
        : "bg-gradient-to-br from-orange-500/10 to-yellow-500/5",
      borderColor: isDarkMode ? "border-orange-700/50" : "border-orange-200/50",
      icon: DollarSign,
      chartColor: "#F59E0B",
    },
  ];

  // Animation effect for counters
  useEffect(() => {
    const timer = setTimeout(() => {
      metrics.forEach((metric, index) => {
        const targetValue = metric.value;
        let currentValue = 0;
        const increment = targetValue / 50;

        const counter = setInterval(() => {
          currentValue += increment;
          if (currentValue >= targetValue) {
            currentValue = targetValue;
            clearInterval(counter);
          }

          setAnimatedValues((prev) => {
            const newValues = [...prev];
            newValues[index] = Math.floor(currentValue);
            return newValues;
          });
        }, 30);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [totalCars, activeRentals, totalCustomers, monthlyRevenue]);

  // Chart data
  const rentalStatusData = [
    { status: "Active", count: 32, fill: "#3B82F6" },
    { status: "Pending", count: 8, fill: "#F59E0B" },
    { status: "Completed", count: 45, fill: "#10B981" },
    { status: "Cancelled", count: 5, fill: "#EF4444" },
  ];

  const revenueData = [
    { month: "Jan", revenue: 35000 },
    { month: "Feb", revenue: 38000 },
    { month: "Mar", revenue: 42000 },
    { month: "Apr", revenue: 40000 },
    { month: "May", revenue: 45000 },
    { month: "Jun", revenue: 48500 },
  ];

  const vehicleTypeData = [
    { name: "Sedan", value: 18, fill: "#3B82F6" },
    { name: "SUV", value: 15, fill: "#10B981" },
    { name: "Luxury", value: 8, fill: "#8B5CF6" },
    { name: "Sports", value: 4, fill: "#F59E0B" },
  ];

  const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"];

  return (
    <div
      className={`flex h-screen ${themeClasses.bg} relative transition-colors duration-300`}
    >
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <ManagerSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className={`${themeClasses.header} backdrop-blur-xl shadow-sm border-b ${themeClasses.border} px-6 py-4 relative`}
        >
          <div className="relative flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className={`lg:hidden mr-4 p-2 rounded-xl ${
                  isDarkMode ? "bg-gray-700" : "bg-slate-100/50"
                } hover:bg-opacity-80 transition-all duration-200`}
              >
                <Menu className={`w-5 h-5 ${themeClasses.textSecondary}`} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm">
                  <span className={themeClasses.textSecondary}>Dashboard</span>
                  <span
                    className={isDarkMode ? "text-gray-600" : "text-slate-300"}
                  >
                    ›
                  </span>
                  <span className={`${themeClasses.text} font-medium`}>
                    Admin Dashboard
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              {/* <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-xl ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-slate-100 hover:bg-slate-200"
                } transition-all duration-200`}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </button> */}

              {/* User Profile */}
              <div
                className={`flex items-center space-x-3 pl-4 border-l ${themeClasses.border}`}
              >
                <div className="text-right hidden sm:block">
                  <div className={`text-sm font-semibold ${themeClasses.text}`}>
                    {firstName}
                  </div>
                  <div className={`text-xs ${themeClasses.textSecondary}`}>
                    Admin
                  </div>
                </div>
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <span className="text-white font-semibold text-sm">
                      {firstName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow-sm"></div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 ${themeClasses.textSecondary}`}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Hero Section with Featured Cars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hero Section - Left Column */}
            <div className="relative rounded-xl overflow-hidden shadow-2xl min-h-[400px] group">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div
                  className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"
                  style={{ animationDelay: "1s" }}
                ></div>
              </div>

              {/* Car Images */}
              {heroSlides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-1000 ${
                    currentSlide === index
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95"
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent"></div>
                </div>
              ))}

              {/* Content */}
              <div className="relative z-10 h-full flex items-center px-6 sm:px-8 py-12">
                <div className="w-full space-y-6">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-cyan-500/20 backdrop-blur-sm border border-cyan-500/50 w-fit">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-cyan-300">
                      Premium Fleet
                    </span>
                  </div>

                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-2">
                      {heroSlides[currentSlide].title}
                      <br />
                      <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        {heroSlides[currentSlide].subtitle}
                      </span>
                    </h1>
                    <p className="text-sm text-slate-200 max-w-md leading-relaxed">
                      {heroSlides[currentSlide].description}
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60 hover:scale-105 text-xs sm:text-sm">
                      Book Now
                    </button>
                    <button className="px-5 py-2 bg-white/10 hover:bg-white/20 border-2 border-white/30 hover:border-white/60 text-white font-bold rounded-lg backdrop-blur-sm transition-all duration-300 text-xs sm:text-sm">
                      View Fleet
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 pt-3 border-t border-white/10">
                    <div>
                      <div className="text-xl font-bold text-cyan-400">
                        {totalCars}+
                      </div>
                      <div className="text-xs text-slate-300">Vehicles</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-cyan-400">
                        {totalCustomers}+
                      </div>
                      <div className="text-xs text-slate-300">Customers</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-cyan-400">
                        24/7
                      </div>
                      <div className="text-xs text-slate-300">Support</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={() =>
                  setCurrentSlide(
                    (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all duration-300 group-hover:bg-white/50"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={() =>
                  setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all duration-300 group-hover:bg-white/50"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {/* Slide Indicators */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`rounded-full transition-all duration-300 ${
                      currentSlide === index
                        ? "bg-gradient-to-r from-cyan-400 to-blue-400 w-6 h-2"
                        : "bg-white/30 hover:bg-white/50 w-2 h-2"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right Column - Featured Cars */}
            <div className="space-y-4">
              <div className="mb-4">
                <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
                  Featured Cars
                </h2>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  Popular rental options
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 1,
                    name: "Tesla Model 3",
                    type: "Electric",
                    price: "$120/day",
                    image:
                      "https://images.unsplash.com/photo-1560958089-b8a63c50ce20?w=400&h=300&fit=crop",
                    badge: "Popular",
                    badgeColor: "bg-blue-500",
                  },
                  {
                    id: 2,
                    name: "BMW X5",
                    type: "SUV",
                    price: "$180/day",
                    image:
                      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=300&fit=crop",
                    badge: "Luxury",
                    badgeColor: "bg-purple-500",
                  },
                  {
                    id: 3,
                    name: "Mercedes C-Class",
                    type: "Sedan",
                    price: "$150/day",
                    image:
                      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop",
                    badge: "Premium",
                    badgeColor: "bg-amber-500",
                  },
                  {
                    id: 4,
                    name: "Audi A4",
                    type: "Sedan",
                    price: "$140/day",
                    image:
                      "https://images.unsplash.com/photo-1606611012088-0e0e71be0fbf?w=400&h=300&fit=crop",
                    badge: "Eco",
                    badgeColor: "bg-green-500",
                  },
                ].map((car) => (
                  <div
                    key={car.id}
                    className={`group relative overflow-hidden rounded-2xl ${themeClasses.card} backdrop-blur-sm border ${themeClasses.border} hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
                  >
                    {/* Car Image */}
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={car.image}
                        alt={car.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                      {/* Badge */}
                      <div
                        className={`absolute top-3 right-3 ${car.badgeColor} text-white text-xs font-semibold px-3 py-1 rounded-full`}
                      >
                        {car.badge}
                      </div>
                    </div>

                    {/* Car Details */}
                    <div className="p-3">
                      <h3
                        className={`text-base font-bold ${themeClasses.text}`}
                      >
                        {car.name}
                      </h3>
                      <p
                        className={`text-xs ${themeClasses.textSecondary} mb-3`}
                      >
                        {car.type}
                      </p>

                      {/* Price and Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold text-blue-500`}>
                            {car.price}
                          </span>
                          <div className="flex items-center space-x-1 text-xs text-green-500">
                            <span>Available</span>
                          </div>
                        </div>
                      </div>

                      {/* Book Button
                      <button className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all duration-300 text-sm">
                        Book Now
                      </button> */}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <div
                  key={index}
                  className={`group relative overflow-hidden rounded-2xl p-5 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl cursor-pointer ${metric.bgColor} ${metric.borderColor} border backdrop-blur-sm hover:-translate-y-1`}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`p-2 rounded-xl ${
                            isDarkMode ? "bg-white/10" : "bg-white/20"
                          } backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}
                        >
                          <IconComponent
                            className={`w-4 h-4 ${
                              isDarkMode ? "text-white" : "text-slate-700"
                            }`}
                          />
                        </div>
                        <TrendingUp className="w-3 h-3 text-green-600 animate-pulse" />
                      </div>
                      <div
                        className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${metric.color} shadow-sm`}
                      >
                        <Activity className="w-3 h-3" />
                        <span>{metric.trend}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline space-x-1">
                        {metric.unit && (
                          <span
                            className={`text-sm ${
                              isDarkMode ? "text-gray-300" : "text-slate-600"
                            }`}
                          >
                            {metric.unit}
                          </span>
                        )}
                        <span
                          className={`text-2xl font-bold ${
                            isDarkMode ? "text-white" : "text-slate-800"
                          } tabular-nums`}
                        >
                          {animatedValues[index].toLocaleString()}
                        </span>
                      </div>
                      <h3
                        className={`text-xs font-medium ${
                          isDarkMode ? "text-gray-300" : "text-slate-600"
                        } leading-tight`}
                      >
                        {metric.label}
                      </h3>
                    </div>

                    <div className="mt-3 relative">
                      <div
                        className={`w-full h-1 ${
                          isDarkMode ? "bg-white/20" : "bg-white/30"
                        } rounded-full overflow-hidden`}
                      >
                        <div
                          className={`h-full bg-gradient-to-r ${metric.color} rounded-full animate-progress-bar origin-left transform scale-x-0`}
                          style={{
                            animation: `progress-bar 1.5s ease-out ${
                              index * 0.2
                            }s forwards`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Vehicle Distribution */}
            <div
              className={`${themeClasses.card} backdrop-blur-sm rounded-2xl p-8 shadow-lg border ${themeClasses.border} hover:shadow-xl transition-all duration-300`}
            >
              <div className="mb-6">
                <h3 className={`text-xl font-bold ${themeClasses.text} mb-1`}>
                  Vehicle Distribution
                </h3>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  Fleet breakdown by type
                </p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vehicleTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {vehicleTypeData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                {vehicleTypeData.map((item, index) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index] }}
                    ></div>
                    <span className={`text-xs ${themeClasses.textSecondary}`}>
                      {item.name}
                    </span>
                    <span
                      className={`text-xs font-semibold ${themeClasses.text}`}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rental Status */}
            <div
              className={`${themeClasses.card} backdrop-blur-sm rounded-2xl p-8 shadow-lg border ${themeClasses.border} hover:shadow-xl transition-all duration-300`}
            >
              <div className="mb-6">
                <h3 className={`text-xl font-bold ${themeClasses.text} mb-1`}>
                  Rental Status
                </h3>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  Current bookings overview
                </p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rentalStatusData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? "#374151" : "#f1f5f9"}
                    />
                    <XAxis
                      dataKey="status"
                      tick={{
                        fontSize: 12,
                        fill: isDarkMode ? "#9CA3AF" : "#64748b",
                      }}
                    />
                    <YAxis
                      tick={{
                        fontSize: 12,
                        fill: isDarkMode ? "#9CA3AF" : "#64748b",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? "#1F2937" : "#ffffff",
                        border: `1px solid ${
                          isDarkMode ? "#374151" : "#e2e8f0"
                        }`,
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue Trends */}
            <div
              className={`${themeClasses.card} backdrop-blur-sm rounded-2xl p-8 shadow-lg border ${themeClasses.border} hover:shadow-xl transition-all duration-300`}
            >
              <div className="mb-6">
                <h3 className={`text-xl font-bold ${themeClasses.text} mb-1`}>
                  Revenue Trends
                </h3>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  Monthly revenue overview
                </p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? "#374151" : "#f1f5f9"}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{
                        fontSize: 12,
                        fill: isDarkMode ? "#9CA3AF" : "#64748b",
                      }}
                    />
                    <YAxis
                      tick={{
                        fontSize: 12,
                        fill: isDarkMode ? "#9CA3AF" : "#64748b",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? "#1F2937" : "#ffffff",
                        border: `1px solid ${
                          isDarkMode ? "#374151" : "#e2e8f0"
                        }`,
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div
            className={`${themeClasses.card} backdrop-blur-sm rounded-2xl p-8 shadow-lg border ${themeClasses.border}`}
          >
            <div className="mb-6">
              <h3 className={`text-xl font-bold ${themeClasses.text} mb-1`}>
                Recent Activity
              </h3>
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                Latest rental updates
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: CheckCircle,
                  color: "text-green-500",
                  bg: "bg-green-500/10",
                  text: "New rental confirmed - Tesla Model 3",
                  time: "2 min ago",
                },
                {
                  icon: Clock,
                  color: "text-blue-500",
                  bg: "bg-blue-500/10",
                  text: "Pending approval - BMW X5",
                  time: "15 min ago",
                },
                {
                  icon: AlertCircle,
                  color: "text-orange-500",
                  bg: "bg-orange-500/10",
                  text: "Maintenance due - Mercedes C-Class",
                  time: "1 hour ago",
                },
                {
                  icon: CheckCircle,
                  color: "text-green-500",
                  bg: "bg-green-500/10",
                  text: "Rental completed - Audi A4",
                  time: "3 hours ago",
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-4 p-4 rounded-xl ${
                    isDarkMode ? "bg-gray-700/30" : "bg-slate-50/50"
                  } hover:scale-[1.01] transition-transform duration-200`}
                >
                  <div className={`p-2 rounded-lg ${activity.bg}`}>
                    <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${themeClasses.text}`}>
                      {activity.text}
                    </p>
                    <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes progress-bar {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ManagerDashboard;
