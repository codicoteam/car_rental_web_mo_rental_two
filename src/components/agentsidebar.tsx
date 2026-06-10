import {
  LayoutDashboard,
  Car,
  Calendar,
  User,
  LogOut,
  X,
  BarChart3,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import Logo from "../assets/Logo.png";

const Sidebar = ({ isOpen = true, onClose = () => {} }) => {
  const sidebarItems = [
    { icon: LayoutDashboard, label: "Agent Dashboard", path: "/agentdashboard" },
    { icon: Car, label: "AgentVehicles", path: "/agent" },
   { icon: User, label: "AgentDrivers", path: "/agentdriver" },
    { icon: Calendar, label: "AgentReservations", path: "/agentreservations" },
    { icon: User, label: "Customer", path: "/user" },
    { icon: BarChart3, label: "AgentChart", path: "/agentchart" },
     { icon: User, label: "Notification", path: "/agentnotification" },
    { icon: User, label: "AgentProfile", path: "/agentprofile" },
    //{ icon: LogOut, label: "Logout", path: "/logout" },
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
          <img
            src={Logo}
            alt="Logo"
            className="w-16 h-16 object-contain"
          />

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
                className={({ isActive }) =>
                  `group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-colors duration-150
                  ${
                    isActive
                      ? "bg-[#1EA2E4] text-white shadow-md"
                      : "text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/15"
                  }`
                }
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
              >
                <IconComponent className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer with auto year */}
        <div className="px-6 py-4 border-t border-gray-200 text-center text-xs text-gray-500">
          © {currentYear} Morental
        </div>
      </div>
    </>
  );
};

export default Sidebar;
