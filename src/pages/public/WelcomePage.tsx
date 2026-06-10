import React from "react";
import {
  ArrowRight,
  Car,
  MapPin,
  Clock,
  Shield,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../../components/ThemeProvider";

const Welcome = () => {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const { isDarkMode, setIsDarkMode, themeClasses } = useTheme();

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const handleMouseMove = (e: { clientX: any; clientY: any }) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      className={`min-h-screen ${themeClasses.bg} overflow-hidden transition-colors duration-300`}
    >
      {/* Animated Background */}
      <div
        className={`fixed inset-0 ${themeClasses.backgroundGradient} transition-all duration-300`}
      >
        <div
          className={`absolute inset-0 ${
            isDarkMode
              ? "bg-[radial-gradient(circle_at_50%_50%,rgba(127,255,212,0.15),transparent_50%)]"
              : "bg-[radial-gradient(circle_at_50%_50%,rgba(127,255,212,0.08),transparent_50%)]"
          }`}
        ></div>
        <div
          className={`absolute inset-0 ${
            isDarkMode
              ? "bg-[radial-gradient(circle_at_80%_20%,rgba(127,255,212,0.2),transparent_50%)]"
              : "bg-[radial-gradient(circle_at_80%_20%,rgba(127,255,212,0.12),transparent_50%)]"
          }`}
        ></div>
        <div
          className={`absolute w-96 h-96 bg-gradient-to-r ${
            isDarkMode
              ? "from-cyan-400/20 to-emerald-300/20"
              : "from-cyan-400/15 to-emerald-300/15"
          } rounded-full blur-3xl transition-all duration-1000 ease-out`}
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        ></div>
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed top-8 right-8 z-50 w-14 h-14 rounded-2xl ${
          isDarkMode
            ? "bg-gray-800 hover:bg-gray-700 border-gray-700"
            : "bg-white hover:bg-gray-50 border-gray-200"
        } border-2 backdrop-blur-sm transition-all transform hover:scale-110 flex items-center justify-center shadow-lg`}
      >
        {isDarkMode ? (
          <Sun className="w-6 h-6 text-cyan-400" />
        ) : (
          <Moon className="w-6 h-6 text-cyan-600" />
        )}
      </button>

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* Background Images */}
        <div className="absolute inset-0">
          {/* Slide 1 Background */}
          <div
            className={`w-full h-full transition-opacity duration-1000 ${
              currentSlide === 0 ? "opacity-100" : "opacity-0"
            } absolute inset-0`}
          >
            <div
              className={`w-full h-full ${
                isDarkMode
                  ? "bg-gradient-to-r from-gray-900/90 via-gray-800/80 to-gray-900/90"
                  : "bg-gradient-to-r from-white/85 via-cyan-50/70 to-white/85"
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1920&h=1080&fit=crop"
                alt="Luxury Car"
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className={`absolute inset-0 ${
                isDarkMode
                  ? "bg-gradient-to-r from-black/75 via-black/60 to-black/75"
                  : "bg-gradient-to-r from-white/80 via-white/60 to-white/80"
              }`}
            ></div>
          </div>

          {/* Slide 2 Background */}
          <div
            className={`w-full h-full transition-opacity duration-1000 ${
              currentSlide === 1 ? "opacity-100" : "opacity-0"
            } absolute inset-0`}
          >
            <div
              className={`w-full h-full ${
                isDarkMode
                  ? "bg-gradient-to-r from-gray-900/90 via-gray-800/80 to-gray-900/90"
                  : "bg-gradient-to-r from-white/85 via-cyan-50/70 to-white/85"
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1920&h=1080&fit=crop"
                alt="Modern Car"
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className={`absolute inset-0 ${
                isDarkMode
                  ? "bg-gradient-to-r from-black/75 via-black/60 to-black/75"
                  : "bg-gradient-to-r from-white/80 via-white/60 to-white/80"
              }`}
            ></div>
          </div>

          {/* Slide 3 Background */}
          <div
            className={`w-full h-full transition-opacity duration-1000 ${
              currentSlide === 2 ? "opacity-100" : "opacity-0"
            } absolute inset-0`}
          >
            <div
              className={`w-full h-full ${
                isDarkMode
                  ? "bg-gradient-to-r from-gray-900/90 via-gray-800/80 to-gray-900/90"
                  : "bg-gradient-to-r from-white/85 via-cyan-50/70 to-white/85"
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1920&h=1080&fit=crop"
                alt="Electric Car"
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className={`absolute inset-0 ${
                isDarkMode
                  ? "bg-gradient-to-r from-black/75 via-black/60 to-black/75"
                  : "bg-gradient-to-r from-white/80 via-white/60 to-white/80"
              }`}
            ></div>
          </div>
        </div>

        {/* Slides Container */}
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            {/* Slide 1 */}
            <div
              className={`text-center transition-all duration-1000 ${
                currentSlide === 0
                  ? "opacity-100 transform translate-x-0"
                  : "opacity-0 transform translate-x-full absolute inset-0 flex items-center justify-center"
              }`}
            >
              <div className="max-w-4xl">
                <div
                  className={`inline-flex items-center px-5 py-2 bg-gradient-to-r ${
                    isDarkMode
                      ? "from-cyan-500/20 to-emerald-500/20 border-cyan-400/40"
                      : "from-cyan-500/15 to-emerald-500/15 border-cyan-400/30"
                  } rounded-full border backdrop-blur-sm mb-8`}
                >
                  <Car className="w-4 h-4 mr-2 text-cyan-400" />
                  <span className="text-sm font-semibold text-cyan-400 tracking-wide uppercase">
                    Admin Dashboard
                  </span>
                </div>

                <h1 className="text-6xl lg:text-7xl font-bold leading-tight mb-8">
                  <span className={themeClasses.text}>Manage your fleet</span>
                  <br />
                  <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-500 bg-clip-text text-transparent animate-pulse">
                    with confidence
                  </span>
                </h1>

                <p
                  className={`text-xl ${themeClasses.textSecondary} mb-10 leading-relaxed max-w-3xl mx-auto`}
                >
                  Take control of your car rental business with powerful admin
                  tools. Monitor bookings, manage vehicles, track revenue, and
                  deliver exceptional service all from one place.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <button
                onClick={() => (window.location.href = "/roles")}
              className="relative bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white px-10 py-4 rounded-2xl text-lg font-bold transition-all transform hover:scale-110 shadow-2xl hover:shadow-cyan-300 overflow-hidden group"
                  >
                <span className="relative z-10 flex items-center justify-center">
                     Login
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                       </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </button>


                  <button
                    onClick={() => (window.location.href = "/signup")} className={`border-2 ${
                      isDarkMode
                        ? "border-white/20 hover:border-cyan-400/50 text-white hover:bg-white/10"
                        : "border-gray-300 hover:border-cyan-500 text-gray-900 hover:bg-cyan-50/50"
                    } px-10 py-4 rounded-2xl text-lg font-semibold transition-all backdrop-blur-sm flex items-center justify-center`}
                  >
                    <MapPin className="mr-2 w-5 h-5" />
                    Sign Up
                  </button>
                </div>
              </div>
            </div>

            {/* Slide 2 */}
            <div
              className={`text-center transition-all duration-1000 ${
                currentSlide === 1
                  ? "opacity-100 transform translate-x-0"
                  : "opacity-0 transform translate-x-full absolute inset-0 flex items-center justify-center"
              }`}
            >
              <div className="max-w-4xl">
                <div
                  className={`inline-flex items-center px-5 py-2 bg-gradient-to-r ${
                    isDarkMode
                      ? "from-cyan-500/20 to-emerald-500/20 border-cyan-400/40"
                      : "from-cyan-500/15 to-emerald-500/15 border-cyan-400/30"
                  } rounded-full border backdrop-blur-sm mb-8`}
                >
                  <Clock className="w-4 h-4 mr-2 text-cyan-400" />
                  <span className="text-sm font-semibold text-cyan-400 tracking-wide uppercase">
                    Real-Time Tracking
                  </span>
                </div>

                <h1 className="text-6xl lg:text-7xl font-bold leading-tight mb-8">
                  <span className={themeClasses.text}>Monitor bookings</span>
                  <br />
                  <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-500 bg-clip-text text-transparent animate-pulse">
                    in real-time
                  </span>
                </h1>

                <p
                  className={`text-xl ${themeClasses.textSecondary} mb-10 leading-relaxed max-w-3xl mx-auto`}
                >
                  Stay on top of every reservation with live updates. Track
                  vehicle availability, manage customer requests, and optimize
                  your fleet utilization effortlessly.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <button className="relative bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white px-10 py-4 rounded-2xl text-lg font-bold transition-all transform hover:scale-110 shadow-2xl hover:shadow-cyan-300 overflow-hidden group">
                    <span className="relative z-10 flex items-center justify-center">
                      View Bookings
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </button>

                  <button
                    className={`border-2 ${
                      isDarkMode
                        ? "border-white/20 hover:border-cyan-400/50 text-white hover:bg-white/10"
                        : "border-gray-300 hover:border-cyan-500 text-gray-900 hover:bg-cyan-50/50"
                    } px-10 py-4 rounded-2xl text-lg font-semibold transition-all backdrop-blur-sm flex items-center justify-center`}
                  >
                    <Clock className="mr-2 w-5 h-5" />
                    Check Analytics
                  </button>
                </div>
              </div>
            </div>

            {/* Slide 3 */}
            <div
              className={`text-center transition-all duration-1000 ${
                currentSlide === 2
                  ? "opacity-100 transform translate-x-0"
                  : "opacity-0 transform translate-x-full absolute inset-0 flex items-center justify-center"
              }`}
            >
              <div className="max-w-4xl">
                <div
                  className={`inline-flex items-center px-5 py-2 bg-gradient-to-r ${
                    isDarkMode
                      ? "from-cyan-500/20 to-emerald-500/20 border-cyan-400/40"
                      : "from-cyan-500/15 to-emerald-500/15 border-cyan-400/30"
                  } rounded-full border backdrop-blur-sm mb-8`}
                >
                  <Shield className="w-4 h-4 mr-2 text-cyan-400" />
                  <span className="text-sm font-semibold text-cyan-400 tracking-wide uppercase">
                    Secure & Reliable
                  </span>
                </div>

                <h1 className="text-6xl lg:text-7xl font-bold leading-tight mb-8">
                  <span className={themeClasses.text}>Complete control</span>
                  <br />
                  <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-500 bg-clip-text text-transparent animate-pulse">
                    at your fingertips
                  </span>
                </h1>

                <p
                  className={`text-xl ${themeClasses.textSecondary} mb-10 leading-relaxed max-w-3xl mx-auto`}
                >
                  Comprehensive admin tools with enterprise-grade security.
                  Manage users, generate reports, and make data-driven decisions
                  to grow your business.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <button className="relative bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white px-10 py-4 rounded-2xl text-lg font-bold transition-all transform hover:scale-110 shadow-2xl hover:shadow-cyan-300 overflow-hidden group">
                    <span className="relative z-10 flex items-center justify-center">
                      Get Started
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </button>

                  <button
                    className={`border-2 ${
                      isDarkMode
                        ? "border-white/20 hover:border-cyan-400/50 text-white hover:bg-white/10"
                        : "border-gray-300 hover:border-cyan-500 text-gray-900 hover:bg-cyan-50/50"
                    } px-10 py-4 rounded-2xl text-lg font-semibold transition-all backdrop-blur-sm`}
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {[0, 1, 2].map((slide) => (
            <button
              key={slide}
              onClick={() => setCurrentSlide(slide)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentSlide === slide
                  ? "bg-gradient-to-r from-cyan-400 to-emerald-400 w-8"
                  : isDarkMode
                  ? "bg-white/30 hover:bg-white/50"
                  : "bg-gray-400/50 hover:bg-gray-600/70"
              }`}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + 3) % 3)}
          className={`absolute left-8 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full ${
            isDarkMode
              ? "bg-gray-800/50 hover:bg-gray-700/70 border-gray-700"
              : "bg-white/40 hover:bg-white/60 border-gray-200"
          } backdrop-blur-sm border hover:border-cyan-400 transition-all duration-300 flex items-center justify-center z-20 group`}
        >
          <ArrowRight
            className={`w-5 h-5 rotate-180 group-hover:scale-110 transition-transform ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          />
        </button>

        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % 3)}
          className={`absolute right-8 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full ${
            isDarkMode
              ? "bg-gray-800/50 hover:bg-gray-700/70 border-gray-700"
              : "bg-white/40 hover:bg-white/60 border-gray-200"
          } backdrop-blur-sm border hover:border-cyan-400 transition-all duration-300 flex items-center justify-center z-20 group`}
        >
          <ArrowRight
            className={`w-5 h-5 group-hover:scale-110 transition-transform ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          />
        </button>
      </section>
    </div>
  );
};

export default Welcome;
