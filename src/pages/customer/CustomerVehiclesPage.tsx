import { useState } from 'react';
import { MapPin, Search, Menu, ChevronDown } from 'lucide-react';
import Sidebar from '../../components/CustomerSidebar';

const Vihicles = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('All');

  const handleBookNow = (carInfo: { id?: number; make: any; model: any; year?: number; image?: string; status?: string; price: any; location: any; mileage?: string; }) => {
    alert(`Booking ${carInfo.make} ${carInfo.model}\nPrice: ${carInfo.price}/day\nLocation: ${carInfo.location}`);
  };

  const luxuryCars = [
    { id: 1, make: "Rolls-Royce", model: "Phantom", year: 2024, image: "https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=600&q=80", status: "Available", price: 1500, location: "Harare", mileage: "2,450 mi" },
    { id: 2, make: "Bentley", model: "Continental GT", year: 2024, image: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&q=80", status: "Reserved", price: 1200, location: "Mutare", mileage: "3,120 mi" },
    { id: 3, make: "Lamborghini", model: "Huracán", year: 2024, image: "https://images.unsplash.com/photo-1621135802920-133df287f89c?w=600&q=80", status: "Available", price: 2000, location: "Bulawayo", mileage: "1,890 mi" },
    { id: 4, make: "Ferrari", model: "F8 Tributo", year: 2024, image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&q=80", status: "In Use", price: 2500, location: "Harare", mileage: "980 mi" },
    { id: 5, make: "Porsche", model: "911 Turbo S", year: 2024, image: "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=600&q=80", status: "Available", price: 950, location: "Gweru", mileage: "4,230 mi" },
    { id: 6, make: "Mercedes-Benz", model: "S-Class", year: 2024, image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80", status: "Reserved", price: 800, location: "Mutare", mileage: "5,670 mi" }
  ];

  const branches = ["All", "Harare", "Mutare", "Bulawayo", "Gweru"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-cyan-600 text-white";
      case "Reserved": return "bg-blue-600 text-white";
      case "In Use": return "bg-indigo-600 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const filteredCars = luxuryCars.filter(car => {
    const matchesSearch =
      car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBranch =
      selectedBranch === "All" ? true : car.location === selectedBranch;

    return matchesSearch && matchesBranch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900/5 via-cyan-100/30 to-blue-500/10 flex">
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:ml-74">

        {/* Navbar */}
        <nav className="fixed top-0 right-0 left-0 lg:left-74 z-40 bg-white/90 backdrop-blur-xl shadow-sm border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center justify-between h-20">

              {/* Left */}
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

              {/* Right */}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto pt-20">
          <div className="max-w-7xl mx-auto p-8">

            {/* Search & Branch Filter */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-200 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search vehicles by make, model, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-gray-700 text-lg"
                  />
                </div>

                {/* Smaller Dropdown */}
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-70 py-2 px-3 border border-gray-300 rounded-md text-gray-700 text-sm focus:ring-2 focus:ring-cyan-600"
                >
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>

              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Showing <span className="font-semibold text-gray-800">{filteredCars.length}</span> vehicles
              {(searchTerm || selectedBranch !== "All") && (
                <span>
                  {' '}for "
                  <span className="font-semibold text-gray-800">
                    {searchTerm || selectedBranch}
                  </span>"
                </span>
              )}
            </p>

            {/* Cars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCars.map((car) => (
                <div key={car.id} className="bg-white rounded-2xl shadow-xl border border-blue-200 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">

                  <div className="relative h-56">
                    <img
                      src={car.image}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4">
                      <span className={`px-4 py-2 rounded-xl text-xs font-bold ${getStatusColor(car.status)}`}>
                        {car.status}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-white text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{car.location}</span>
                      <span className="ml-auto text-xs bg-white/25 px-3 py-1 rounded-full">
                        {car.mileage}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-800">{car.make}</h3>
                    <p className="text-gray-600 font-medium mb-4">{car.model} • {car.year}</p>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Daily Rate</p>
                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-cyan-500 bg-clip-text text-transparent">
                          ${car.price}
                        </span>
                      </div>

                      <button
                        onClick={() => handleBookNow(car)}
                        className="bg-gradient-to-r from-blue-800 to-cyan-500 hover:opacity-90 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {filteredCars.length === 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-blue-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-xl text-gray-600 font-semibold">No vehicles found</p>
                <p className="text-gray-500 mt-2">Try adjusting your search or branch selection</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Vihicles;
