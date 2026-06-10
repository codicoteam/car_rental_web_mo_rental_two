import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
 Tag,
  Wrench,
  AlertTriangle,
  LogOut,
  X,

  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import Logo from "../assets/Logo.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { authService } from "../features/auth/authService";
import { AlertCircle } from "lucide-react";

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

const ManagerSidebar = ({ isOpen = true, onClose = () => {} }: SidebarProps) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
  try {
    setIsLoggingOut(true);
    authService.logout();
    navigate("/roles");
    setShowLogoutModal(false);
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    setIsLoggingOut(false);
  }
};

const handleCancelLogout = () => {
  setShowLogoutModal(false);
};



  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin-dashboard" },

    // Core management
    { icon: Users, label: "Users", path: "/manager-users" },

    // Fleet
    { icon: Car, label: "Vehicle Models", path: "/manager-vehicle-models" },
    { icon: Car, label: "Vehicles", path: "/manager-vehicles" },
    // { icon: MapPin, label: "Vehicle Trackers", path: "/admin-vehicle-trackers" },

    // Operations
    { icon: Calendar, label: "Reservations", path: "/manager-reservations" },
    { icon: Wrench, label: "Service Orders", path: "/manager-service-orders" },
    { icon: Wrench, label: "Service Schedules", path: "/manager-service-schedules" },
    { icon: AlertTriangle, label: "Incidents & Damage", path: "/manager-vehicle-incidents" },

    // // Business setup
    
    { icon: ShieldCheck, label: "Rate Plans", path: "/manager-rate-plans" },
    { icon: Tag, label: "Promo Codes", path: "/manager-promo-codes" },

    // // Drivers feature
    { icon: UserCheck, label: "Driver Profiles", path: "/manager-driver-profiles" },
    { icon: Calendar, label: "Driver Bookings", path: "/manager-driver-bookings"},

    // // Finance & comms
    // { icon: CreditCard, label: "Payments", path: "/admin-payments" },
    // { icon: MessageSquare, label: "Chats", path: "/admin-chats" },

    // // Analytics
    // { icon: BarChart3, label: "Reports", path: "/admin-reports" },

    // Auth
    
    { icon: LogOut, label: "Logout", path: "#", onClick: () => setShowLogoutModal(true) },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 
        transform ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        transition-transform duration-200 ease-out
        lg:translate-x-0 lg:static lg:inset-0 shadow-xl flex flex-col h-screen`}
      >
        {/* Header with Logo */}
        <div className="flex items-center justify-center h-24 px-6 border-b border-gray-200 flex-shrink-0 relative">
          <img src={Logo} alt="Logo" className="w-16 h-16 object-contain" />

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden absolute right-6 p-2 rounded-xl bg-gray-100 hover:bg-gray-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 flex-shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]"
            />

            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-1 flex-1 overflow-y-auto pb-6">
          {sidebarItems.map((item, index) => {
            const IconComponent = item.icon;

            return (
           
              <NavLink
                  key={index}
                  to={item.path}
                  onClick={(e) => {
                    if (item.onClick) {
                      e.preventDefault();
                      item.onClick();
                    }
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={({ isActive }) =>
                    `group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-colors duration-150
                    ${
                      isActive && item.path !== "#"
                        ? "bg-[#1EA2E4] text-white shadow-md"
                        : "text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/15"
                    }`
                  }
                >
                  <IconComponent className="w-5 h-5 mr-3" />
                  {item.label}
                </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 text-center text-xs text-gray-500">
          © {currentYear} Morental — Admin
        </div>
      </div>

      {/* Logout Confirmation Modal */}
{showLogoutModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={handleCancelLogout}
    />
    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Confirm Logout</h3>
            <p className="text-sm text-gray-600">Are you sure you want to logout?</p>
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          You will need to login again to access your account.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancelLogout}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoggingOut ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Logging out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </>
  );
};

export default ManagerSidebar;
