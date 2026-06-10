import { useState, useEffect } from 'react';
import { UserCircle, Building2, Users, Headphones, Truck, ChevronRight, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const roles = [
    {
      id: 'admin',
      title: 'Admin',
      icon: UserCircle,
      description: 'Full system access and management',
      color: 'from-purple-500 via-purple-600 to-indigo-600',
      shadowColor: 'shadow-purple-500/50',
      badge: 'Master Control',
    },
    {
      id: 'branch-manager',
      title: 'Branch Manager',
      icon: Building2,
      description: 'Manage branch operations',
      color: 'from-blue-500 via-blue-600 to-cyan-600',
      shadowColor: 'shadow-blue-500/50',
      badge: 'Leadership',
    },
    {
      id: 'customer',
      title: 'Customer',
      icon: Users,
      description: 'Book and manage rides',
      color: 'from-green-500 via-emerald-600 to-teal-600',
      shadowColor: 'shadow-green-500/50',
      badge: 'Premium',
    },
    {
      id: 'agent',
      title: 'Agent',
      icon: Headphones,
      description: 'Customer support and service',
      color: 'from-orange-500 via-amber-600 to-yellow-600',
      shadowColor: 'shadow-orange-500/50',
      badge: 'Support Pro',
    },
    {
      id: 'driver',
      title: 'Driver',
      icon: Truck,
      description: 'Accept and complete rides',
      color: 'from-red-500 via-rose-600 to-pink-600',
      shadowColor: 'shadow-red-500/50',
      badge: 'On Road',
    }
  ];

  const handleContinue = () => {
    if (selectedRole) {
      // Navigate to login with selected role as query parameter
      navigate(`/login?role=${selectedRole}`);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-blue-900/10 to-pink-900/10" />
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1621135802920-133df287f89c?w=1920&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">

        {/* Header */}
        <div className={`mb-16 text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent drop-shadow-2xl">
            Welcome Aboard
          </h1>
          <p className="text-xl md:text-2xl font-light text-gray-100 drop-shadow-lg tracking-wide mt-4">
            Select your role to begin your journey
          </p>
        </div>

        {/* Roles Grid */}
        <div className="
          grid grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          lg:grid-cols-4
          xl:grid-cols-5
          gap-8
          max-w-[1600px]
          w-full
          place-items-center
        ">
          {roles.map((role, index) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            const isHovered = hoveredRole === role.id;

            return (
              <div key={role.id} className="w-full flex flex-col items-center">
                <button
                  onClick={() => setSelectedRole(role.id)}
                  onMouseEnter={() => setHoveredRole(role.id)}
                  onMouseLeave={() => setHoveredRole(null)}
                  className={`
                    group relative flex flex-col items-center p-8 rounded-3xl
                    backdrop-blur-xl bg-white/10
                    border-2 transition-all duration-500 transform
                    w-full max-w-xs
                    ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
                    ${isSelected 
                      ? `border-white scale-105 md:scale-110 ${role.shadowColor} shadow-2xl` 
                      : 'border-white/30 hover:scale-105 hover:border-white/60 hover:shadow-2xl'
                    }
                    ${isHovered ? role.shadowColor + ' shadow-2xl' : ''}
                  `}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >

                  {/* Gradient Hover BG */}
                  <div className={`
                    absolute inset-0 rounded-3xl bg-gradient-to-br ${role.color}
                    opacity-0 transition-opacity duration-500
                    ${isSelected || isHovered ? 'opacity-30' : ''}
                  `} />

                  {/* Glow */}
                  {(isSelected || isHovered) && (
                    <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${role.color} blur-xl opacity-40 animate-pulse`} />
                  )}

                  {/* Badge */}
                  <div className={`
                    absolute -top-3 left-1/2 transform -translate-x-1/2
                    px-4 py-1 rounded-full text-xs font-bold
                    bg-gradient-to-r ${role.color} text-white
                    shadow-lg border border-white/30
                  `}>
                    {role.badge}
                  </div>

                  {/* Icon */}
                  <div className="relative mb-6 mt-4">
                    <div className={`
                      relative rounded-full p-5 bg-gradient-to-br ${role.color}
                      transition-transform duration-500
                      ${isSelected || isHovered ? 'scale-125 rotate-12' : 'scale-100 rotate-0'}
                      shadow-2xl border-4 border-white/30
                    `}>
                      <Icon className="w-14 h-14 text-white drop-shadow-lg" strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-3xl font-extrabold text-white text-center drop-shadow-lg">
                    {role.title}
                  </h3>

                  {/* Description */}
                  <p className="text-base text-gray-100 text-center font-medium leading-relaxed px-2">
                    {role.description}
                  </p>

                  {/* Selected Shield */}
                  {isSelected && (
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl animate-bounce border-2 border-white">
                      <Shield className="w-6 h-6 text-white" fill="currentColor" />
                    </div>
                  )}
                </button>

                {/* MOBILE CONTINUE BUTTON UNDER SELECTED ROLE */}
                {isSelected && (
                  <button
                    onClick={handleContinue}
                    className="
                      block md:hidden mt-4 w-full max-w-xs 
                      px-6 py-3
                      bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600
                      text-white text-lg font-bold rounded-full
                      hover:from-blue-700 hover:via-purple-700 hover:to-pink-700
                      transform hover:scale-105 transition-all duration-500
                      shadow-xl hover:shadow-purple-500/50
                      border-2 border-white/30
                      flex items-center justify-center gap-3
                    "
                  >
                    Continue as {role.title}
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* DESKTOP CONTINUE BUTTON */}
        {selectedRole && (
          <button
            onClick={handleContinue}
            className="
              hidden md:flex mt-16 px-16 py-5 
              bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600
              text-white text-2xl font-bold rounded-full
              hover:from-blue-700 hover:via-purple-700 hover:to-pink-700
              transform hover:scale-110 transition-all duration-500
              shadow-2xl hover:shadow-purple-500/50
              border-2 border-white/30
              items-center gap-4
              relative overflow-hidden group
            "
          >
            Continue as {roles.find(r => r.id === selectedRole)?.title}
            <ChevronRight className="w-7 h-7 relative group-hover:translate-x-2 transition-transform duration-300" />
          </button>
        )}

        <div className="mt-12 text-center text-gray-400 text-sm">
          <p className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Secure & encrypted connection
          </p>
        </div>

      </div>
    </div>
  );
}