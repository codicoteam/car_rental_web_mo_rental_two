import { useState } from "react";
import {
  Car,
  Plus,
  Edit,
  Trash2,
  Eye,
  Menu,
  Filter,
  Fuel,
  Search,
  Gauge,
  Users,
  Zap,
  X,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";

interface Vehicle {
  id: number;
  name: string;
  type: string;
  year: number;
  price: number;
  status: string;
  image: string;
  seats: number;
  fuel: string;
  transmission: string;
  color: string;
  badge: string;
  badgeColor: string;
}

const Vehicles = () => {
  const [isDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showModal, setShowModal] = useState(false);

  const VehicleDetailModal = ({
    vehicle,
    onClose,
  }: {
    vehicle: Vehicle;
    onClose: () => void;
  }) => {
    if (!vehicle) return null;

    return (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className={`fixed inset-y-0 right-0 w-full sm:w-[500px] ${
            themeClasses.card
          } shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto ${
            showModal ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div
            className={`sticky top-0 ${themeClasses.header} backdrop-blur-xl border-b ${themeClasses.border} p-6 z-10`}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
                Vehicle Details
              </h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-slate-100 hover:bg-slate-200"
                } transition-colors`}
              >
                <X className={`w-5 h-5 ${themeClasses.textSecondary}`} />
              </button>
            </div>
            <p className={`text-sm ${themeClasses.textSecondary}`}>
              Complete information about this vehicle
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Image */}
            <div className="relative h-64 rounded-xl overflow-hidden">
              <img
                src={vehicle.image}
                alt={vehicle.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`${vehicle.badgeColor} text-white text-sm font-semibold px-3 py-1.5 rounded-lg shadow-lg`}
                  >
                    {vehicle.badge}
                  </span>
                  <span
                    className={`${getStatusColor(
                      vehicle.status
                    )} text-sm font-medium px-3 py-1.5 rounded-lg border backdrop-blur-md`}
                  >
                    {vehicle.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div>
              <h3 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>
                {vehicle.name}
              </h3>
              <div className="flex items-center gap-4">
                <span className={`text-sm ${themeClasses.textSecondary}`}>
                  {vehicle.type}
                </span>
                <span className={`text-sm ${themeClasses.textSecondary}`}>
                  •
                </span>
                <span className={`text-sm ${themeClasses.textSecondary}`}>
                  {vehicle.year}
                </span>
                <span className={`text-sm ${themeClasses.textSecondary}`}>
                  •
                </span>
                <span className={`text-sm ${themeClasses.textSecondary}`}>
                  {vehicle.color}
                </span>
              </div>
            </div>

            {/* Price */}
            <div
              className={`${
                isDarkMode
                  ? "bg-gray-700/50"
                  : "bg-gradient-to-br from-blue-50 to-blue-100/50"
              } rounded-xl p-4 border ${themeClasses.border}`}
            >
              <div className={`text-sm ${themeClasses.textSecondary} mb-1`}>
                Rental Price
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-blue-600">
                  ${vehicle.price}
                </span>
                <span className={`text-sm ${themeClasses.textSecondary}`}>
                  per day
                </span>
              </div>
            </div>

            {/* Specifications */}
            <div>
              <h4 className={`text-lg font-bold ${themeClasses.text} mb-4`}>
                Specifications
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`${themeClasses.card} border ${themeClasses.border} rounded-xl p-4`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isDarkMode ? "bg-gray-700" : "bg-slate-100"
                      }`}
                    >
                      <Users className={`w-4 h-4 ${themeClasses.text}`} />
                    </div>
                    <span
                      className={`text-xs ${themeClasses.textSecondary} uppercase tracking-wide`}
                    >
                      Seats
                    </span>
                  </div>
                  <div className={`text-xl font-bold ${themeClasses.text}`}>
                    {vehicle.seats}
                  </div>
                </div>

                <div
                  className={`${themeClasses.card} border ${themeClasses.border} rounded-xl p-4`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isDarkMode ? "bg-gray-700" : "bg-slate-100"
                      }`}
                    >
                      <Fuel className={`w-4 h-4 ${themeClasses.text}`} />
                    </div>
                    <span
                      className={`text-xs ${themeClasses.textSecondary} uppercase tracking-wide`}
                    >
                      Fuel
                    </span>
                  </div>
                  <div className={`text-xl font-bold ${themeClasses.text}`}>
                    {vehicle.fuel}
                  </div>
                </div>

                <div
                  className={`${themeClasses.card} border ${themeClasses.border} rounded-xl p-4`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isDarkMode ? "bg-gray-700" : "bg-slate-100"
                      }`}
                    >
                      <Gauge className={`w-4 h-4 ${themeClasses.text}`} />
                    </div>
                    <span
                      className={`text-xs ${themeClasses.textSecondary} uppercase tracking-wide`}
                    >
                      Transmission
                    </span>
                  </div>
                  <div className={`text-xl font-bold ${themeClasses.text}`}>
                    {vehicle.transmission}
                  </div>
                </div>

                <div
                  className={`${themeClasses.card} border ${themeClasses.border} rounded-xl p-4`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isDarkMode ? "bg-gray-700" : "bg-slate-100"
                      }`}
                    >
                      <Car className={`w-4 h-4 ${themeClasses.text}`} />
                    </div>
                    <span
                      className={`text-xs ${themeClasses.textSecondary} uppercase tracking-wide`}
                    >
                      Type
                    </span>
                  </div>
                  <div className={`text-xl font-bold ${themeClasses.text}`}>
                    {vehicle.type}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => handleEditVehicle(vehicle.id)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-sm shadow-blue-500/25 hover:shadow-md hover:shadow-blue-500/30 transition-all duration-200"
              >
                <Edit className="w-4 h-4" />
                Edit Vehicle
              </button>
              <button
                onClick={() => handleDeleteVehicle(vehicle.id)}
                className={`px-4 py-3 rounded-lg ${
                  isDarkMode
                    ? "bg-red-900/20 hover:bg-red-900/30 text-red-400"
                    : "bg-red-50 hover:bg-red-100 text-red-600"
                } font-semibold transition-all duration-200`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const firstName = "John Doe";

  const themeClasses = {
    bg: isDarkMode
      ? "bg-gray-900"
      : "bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100",
    card: isDarkMode ? "bg-gray-800/90" : "bg-white",
    text: isDarkMode ? "text-white" : "text-slate-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-slate-500",
    border: isDarkMode ? "border-gray-700/50" : "border-slate-200/60",
    header: isDarkMode ? "bg-gray-900/95" : "bg-white/95",
    input: isDarkMode
      ? "bg-gray-800 border-gray-700 text-white"
      : "bg-slate-50/80 border-slate-200 text-slate-900",
  };

  const vehicles = [
    {
      id: 1,
      name: "Tesla Model 3",
      type: "Electric",
      year: 2023,
      price: 120,
      status: "Available",
      image:
        "https://images.unsplash.com/photo-1560958089-b8a63c50ce20?w=400&h=300&fit=crop",
      seats: 5,
      fuel: "Electric",
      transmission: "Auto",
      color: "White",
      badge: "Popular",
      badgeColor: "bg-blue-500",
    },
    {
      id: 2,
      name: "BMW X5",
      type: "SUV",
      year: 2023,
      price: 180,
      status: "Rented",
      image:
        "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=300&fit=crop",
      seats: 7,
      fuel: "Diesel",
      transmission: "Auto",
      color: "Black",
      badge: "Luxury",
      badgeColor: "bg-purple-500",
    },
    {
      id: 3,
      name: "Mercedes C-Class",
      type: "Sedan",
      year: 2022,
      price: 150,
      status: "Available",
      image:
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop",
      seats: 5,
      fuel: "Petrol",
      transmission: "Auto",
      color: "Silver",
      badge: "Premium",
      badgeColor: "bg-amber-500",
    },
    {
      id: 4,
      name: "Audi A4",
      type: "Sedan",
      year: 2023,
      price: 140,
      status: "Maintenance",
      image:
        "https://images.unsplash.com/photo-1606611012088-0e0e71be0fbf?w=400&h=300&fit=crop",
      seats: 5,
      fuel: "Hybrid",
      transmission: "Auto",
      color: "Blue",
      badge: "Eco",
      badgeColor: "bg-emerald-500",
    },
    {
      id: 5,
      name: "Range Rover Sport",
      type: "SUV",
      year: 2023,
      price: 220,
      status: "Available",
      image:
        "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop",
      seats: 7,
      fuel: "Petrol",
      transmission: "Auto",
      color: "Black",
      badge: "Luxury",
      badgeColor: "bg-purple-500",
    },
    {
      id: 6,
      name: "Porsche 911",
      type: "Sports",
      year: 2023,
      price: 350,
      status: "Available",
      image:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop",
      seats: 2,
      fuel: "Petrol",
      transmission: "Manual",
      color: "Red",
      badge: "Premium",
      badgeColor: "bg-red-500",
    },
    {
      id: 7,
      name: "Toyota Camry",
      type: "Sedan",
      year: 2022,
      price: 90,
      status: "Available",
      image:
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop",
      seats: 5,
      fuel: "Petrol",
      transmission: "Auto",
      color: "White",
      badge: "Economy",
      badgeColor: "bg-green-500",
    },
    {
      id: 8,
      name: "Ford Mustang",
      type: "Sports",
      year: 2023,
      price: 200,
      status: "Rented",
      image:
        "https://images.unsplash.com/photo-1584345604476-8ec5f5ca8c9d?w=400&h=300&fit=crop",
      seats: 4,
      fuel: "Petrol",
      transmission: "Manual",
      color: "Yellow",
      badge: "Popular",
      badgeColor: "bg-blue-500",
    },
  ];

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterType === "all" ||
      vehicle.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "Rented":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "Maintenance":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const handleAddVehicle = () => console.log("Add vehicle clicked");

  const handleViewVehicle = (id: number) => {
    const vehicle = vehicles.find((v) => v.id === id) || null;
    setSelectedVehicle(vehicle);
    setTimeout(() => setShowModal(true), 10); // Trigger animation after mount
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedVehicle(null), 300); // Wait for animation to complete
  };

  const handleEditVehicle = (id: number) => console.log("Edit vehicle:", id);
  const handleDeleteVehicle = (id: number) =>
    console.log("Delete vehicle:", id);

  return (
    <div
      className={`flex h-screen ${themeClasses.bg} transition-colors duration-300`}
    >
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className={`${themeClasses.header} backdrop-blur-xl border-b ${themeClasses.border} px-4 sm:px-6 py-3.5 sticky top-0 z-30`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className={`lg:hidden p-2 rounded-lg ${
                  isDarkMode ? "bg-gray-800" : "bg-slate-100"
                } hover:bg-opacity-80 transition-colors`}
              >
                <Menu className={`w-5 h-5 ${themeClasses.textSecondary}`} />
              </button>
              <div className="flex items-center gap-2 text-sm">
                <span className={themeClasses.textSecondary}>Dashboard</span>
                <span className={themeClasses.textSecondary}>›</span>
                <span className={`${themeClasses.text} font-medium`}>
                  Vehicles
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`hidden sm:flex items-center gap-3 pl-3 border-l ${themeClasses.border}`}
              >
                <div className="text-right">
                  <div className={`text-sm font-semibold ${themeClasses.text}`}>
                    {firstName}
                  </div>
                  <div className={`text-xs ${themeClasses.textSecondary}`}>
                    Admin
                  </div>
                </div>
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-sm">
                      {firstName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1
                  className={`text-2xl sm:text-3xl font-bold ${themeClasses.text} mb-1`}
                >
                  Vehicle Fleet
                </h1>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  Manage and monitor your entire vehicle collection
                </p>
              </div>
              <button
                onClick={handleAddVehicle}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/25 hover:shadow-md hover:shadow-blue-500/30 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vehicle</span>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div
                className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      isDarkMode ? "bg-gray-700" : "bg-slate-100"
                    }`}
                  >
                    <Car className={`w-4 h-4 ${themeClasses.text}`} />
                  </div>
                  <span className={`text-2xl font-bold ${themeClasses.text}`}>
                    {vehicles.length}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${themeClasses.textSecondary}`}
                >
                  Total Fleet
                </div>
              </div>

              <div
                className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-emerald-50">
                    <Zap className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">
                    {vehicles.filter((v) => v.status === "Available").length}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${themeClasses.textSecondary}`}
                >
                  Available
                </div>
              </div>

              <div
                className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {vehicles.filter((v) => v.status === "Rented").length}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${themeClasses.textSecondary}`}
                >
                  On Rent
                </div>
              </div>

              <div
                className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-amber-50">
                    <Gauge className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-2xl font-bold text-amber-600">
                    {vehicles.filter((v) => v.status === "Maintenance").length}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${themeClasses.textSecondary}`}
                >
                  In Service
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div
              className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.textSecondary}`}
                  />
                  <input
                    type="text"
                    placeholder="Search by name or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-200 transition-colors`}
                    >
                      <X
                        className={`w-3.5 h-3.5 ${themeClasses.textSecondary}`}
                      />
                    </button>
                  )}
                </div>

                <div className="relative sm:w-48">
                  <Filter
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.textSecondary} pointer-events-none`}
                  />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className={`w-full pl-10 pr-8 py-2.5 text-sm rounded-lg border ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all appearance-none cursor-pointer`}
                  >
                    <option value="all">All Types</option>
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="sports">Sports</option>
                    <option value="electric">Electric</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vehicles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`group ${themeClasses.card} rounded-xl border ${themeClasses.border} shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden`}
                >
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden bg-slate-100">
                    <img
                      src={vehicle.image}
                      alt={vehicle.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
                      <span
                        className={`${vehicle.badgeColor} text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm`}
                      >
                        {vehicle.badge}
                      </span>
                      <span
                        className={`${getStatusColor(
                          vehicle.status
                        )} text-xs font-medium px-2.5 py-1 rounded-md border backdrop-blur-sm`}
                      >
                        {vehicle.status}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="mb-3">
                      <h3
                        className={`text-base font-bold ${themeClasses.text} mb-0.5 truncate`}
                      >
                        {vehicle.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs ${themeClasses.textSecondary}`}
                        >
                          {vehicle.type} • {vehicle.year}
                        </span>
                        <span className="text-base font-bold text-blue-600">
                          ${vehicle.price}
                          <span className="text-xs font-normal text-slate-400">
                            /day
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Specs */}
                    <div className="flex items-center justify-between py-2.5 mb-3 border-y border-slate-100">
                      <div className="flex flex-col items-center flex-1">
                        <Users
                          className={`w-3.5 h-3.5 ${themeClasses.textSecondary} mb-0.5`}
                        />
                        <span
                          className={`text-xs ${themeClasses.textSecondary}`}
                        >
                          {vehicle.seats}
                        </span>
                      </div>
                      <div className="flex flex-col items-center flex-1 border-x border-slate-100">
                        <Fuel
                          className={`w-3.5 h-3.5 ${themeClasses.textSecondary} mb-0.5`}
                        />
                        <span
                          className={`text-xs ${themeClasses.textSecondary}`}
                        >
                          {vehicle.fuel}
                        </span>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <Gauge
                          className={`w-3.5 h-3.5 ${themeClasses.textSecondary} mb-0.5`}
                        />
                        <span
                          className={`text-xs ${themeClasses.textSecondary}`}
                        >
                          {vehicle.transmission}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewVehicle(vehicle.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 hover:bg-gray-600"
                            : "bg-slate-100 hover:bg-slate-200"
                        } transition-colors group/btn`}
                      >
                        <Eye
                          className={`w-3.5 h-3.5 ${themeClasses.textSecondary} group-hover/btn:text-blue-500 transition-colors`}
                        />
                        <span
                          className={`text-xs font-medium ${themeClasses.textSecondary} group-hover/btn:text-blue-500 transition-colors`}
                        >
                          View
                        </span>
                      </button>
                      <button
                        onClick={() => handleEditVehicle(vehicle.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 hover:bg-gray-600"
                            : "bg-slate-100 hover:bg-slate-200"
                        } transition-colors group/btn`}
                      >
                        <Edit
                          className={`w-3.5 h-3.5 ${themeClasses.textSecondary} group-hover/btn:text-emerald-500 transition-colors`}
                        />
                        <span
                          className={`text-xs font-medium ${themeClasses.textSecondary} group-hover/btn:text-emerald-500 transition-colors`}
                        >
                          Edit
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className={`px-2.5 py-2 rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 hover:bg-gray-600"
                            : "bg-slate-100 hover:bg-slate-200"
                        } transition-colors group/btn`}
                      >
                        <Trash2
                          className={`w-3.5 h-3.5 ${themeClasses.textSecondary} group-hover/btn:text-red-500 transition-colors`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No Results */}
            {filteredVehicles.length === 0 && (
              <div
                className={`${themeClasses.card} rounded-xl p-12 text-center border ${themeClasses.border} shadow-sm`}
              >
                <Car
                  className={`w-12 h-12 ${themeClasses.textSecondary} mx-auto mb-3 opacity-50`}
                />
                <h3 className={`text-lg font-bold ${themeClasses.text} mb-1`}>
                  No vehicles found
                </h3>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </main>
        {/* Vehicle Detail Modal */}
        {selectedVehicle && (
          <VehicleDetailModal
            vehicle={selectedVehicle}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </div>
  );
};

export default Vehicles;
