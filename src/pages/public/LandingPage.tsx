import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../../assets/Logo.png";
import {
  Car, MapPin, Clock, Shield, Users, Star, Phone, Mail,
  ArrowRight, Menu, X, CheckCircle, ChevronDown,
  Zap, Globe, Award, HeadphonesIcon, Key, BarChart3,
} from "lucide-react";

// ─── Brand colours ───────────────────────────────────────────────────────────
const C = {
  navy: "#0A1628",
  cyan: "#00AEEF",
  blue: "#1A5FA8",
  bg: "#F0F6FF",
};

// ─── Unsplash image helpers ────────────────────────────────────────────────
const UNS = (id: string, w = 1200, h = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

const HERO_IMG    = UNS("1492144534655-ae79c964c9d7", 1920, 1080);
const ABOUT_IMG   = UNS("1560958089-b8a1929cea89", 800, 600);

const FLEET = [
  { img: UNS("1549317661-bd32c8ce0db2", 600, 400), label: "Economy", name: "Toyota Vitz",     price: "$35", tag: "Most Popular" },
  { img: UNS("1519641471654-76ce0107ad1b", 600, 400), label: "SUV",     name: "Toyota Fortuner", price: "$85", tag: "Best for Families" },
  { img: UNS("1555215695-3004980ad54e", 600, 400), label: "Luxury",   name: "BMW 5-Series",    price: "$120", tag: "Executive" },
  { img: UNS("1544636331-e26879cd4d9b", 600, 400), label: "Sports",   name: "Mazda MX-5",      price: "$95", tag: "Weekend Special" },
  { img: UNS("1568605117036-5fe5e7bab0b7", 600, 400), label: "Sedan",   name: "Toyota Camry",    price: "$55", tag: "Business Class" },
  { img: UNS("1503376780353-7e6692767b70", 600, 400), label: "Premium", name: "Porsche 911",     price: "$180", tag: "Prestige" },
];

const SERVICES = [
  {
    icon: Key,
    title: "Self-Drive Rental",
    desc: "Choose from our wide fleet of well-maintained vehicles and drive at your own pace. Flexible daily, weekly, and monthly rates available.",
  },
  {
    icon: Users,
    title: "Chauffeur & Driver Hire",
    desc: "Sit back and relax with our professional, fully-vetted drivers. Perfect for airport transfers, corporate events, and city tours.",
  },
  {
    icon: BarChart3,
    title: "Fleet Management",
    desc: "Corporate clients benefit from dedicated fleet management — real-time tracking, maintenance scheduling, and consolidated billing.",
  },
  {
    icon: Globe,
    title: "Corporate Solutions",
    desc: "Tailored mobility packages for businesses. Monthly contracts, priority booking, and dedicated account management.",
  },
];

const FEATURES = [
  { icon: Zap, title: "Book in 60 Seconds", desc: "Our streamlined online booking flow gets you on the road fast — no paperwork, no queues." },
  { icon: Shield, title: "Fully Insured Fleet", desc: "Every vehicle on our platform carries comprehensive insurance for your complete peace of mind." },
  { icon: HeadphonesIcon, title: "24 / 7 Support", desc: "Our customer success team is available around the clock via chat, WhatsApp, and phone." },
  { icon: Award, title: "Quality Guaranteed", desc: "Each vehicle undergoes a 50-point inspection before every rental — spotless and road-ready." },
];

const TESTIMONIALS = [
  {
    name: "Tatenda Moyo",
    role: "Business Traveller, Harare",
    avatar: "TM",
    rating: 5,
    text: "MoRental completely changed how I manage my business travel. The booking process is effortless and the vehicles are always immaculate. I won't use anyone else.",
  },
  {
    name: "Chiedza Nyamande",
    role: "Wedding Planner, Bulawayo",
    avatar: "CN",
    rating: 5,
    text: "I hired three vehicles for a wedding last month. The team was incredibly professional, the cars arrived on time, and the online management portal made coordination a breeze.",
  },
  {
    name: "Farai Dube",
    role: "Tour Operator, Victoria Falls",
    avatar: "FD",
    rating: 5,
    text: "As a tour operator, reliability is everything. MoRental's fleet management tools and real-time tracking give me confidence that my clients are always in safe hands.",
  },
];

// ─── Scroll hook ──────────────────────────────────────────────────────────────
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const fn = () => setY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return y;
}

// ─── Page component ──────────────────────────────────────────────────────────
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const scrollY = useScrollY();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const navScrolled = scrollY > 60;

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const NAV_LINKS = [
    { label: "Home",     id: "home" },
    { label: "Services", id: "services" },
    { label: "Fleet",    id: "fleet" },
    { label: "About",    id: "about" },
    { label: "Contact",  id: "contact" },
  ];

  return (
    <div className="font-sans antialiased text-gray-900 overflow-x-hidden">

      {/* ══════════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: navScrolled ? C.navy : "transparent",
          boxShadow: navScrolled ? "0 2px 24px rgba(0,0,0,0.3)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => scrollTo("home")} className="flex items-center gap-2">
            <img src={Logo} alt="MoRental" className="h-10 w-auto" />
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(l => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-sm font-semibold text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
              style={{ backgroundColor: C.cyan, color: C.navy }}
            >
              Get Started
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden px-6 pb-5 pt-2 flex flex-col gap-4" style={{ backgroundColor: C.navy }}>
            {NAV_LINKS.map(l => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="text-left text-sm font-medium text-white/80 hover:text-white"
              >
                {l.label}
              </button>
            ))}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate("/login")}
                className="flex-1 py-2 text-sm font-semibold text-white border border-white/30 rounded-lg"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="flex-1 py-2 text-sm font-semibold rounded-lg"
                style={{ backgroundColor: C.cyan, color: C.navy }}
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center text-white"
        style={{ backgroundColor: C.navy }}
      >
        {/* Background image */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={HERO_IMG}
            alt="Luxury car on open road"
            className="w-full h-full object-cover opacity-25"
          />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${C.navy}ee 0%, ${C.blue}99 50%, ${C.navy}cc 100%)` }}
          />
        </div>

        {/* Decorative cyan glow */}
        <div
          className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ backgroundColor: C.cyan }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest mb-6"
            style={{ backgroundColor: `${C.cyan}22`, border: `1px solid ${C.cyan}55`, color: C.cyan }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: C.cyan }} />
            Zimbabwe's Premier Car Rental Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            Drive Zimbabwe{" "}
            <span style={{ color: C.cyan }}>Forward</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Premium vehicle rentals, chauffeur services, and fleet management — all in one
            seamless digital platform. Your journey, your way.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/signup")}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base shadow-lg hover:opacity-90 transition-all"
              style={{ backgroundColor: C.cyan, color: C.navy }}
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollTo("fleet")}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base border hover:bg-white/10 transition-all"
              style={{ borderColor: "rgba(255,255,255,0.3)" }}
            >
              Browse Fleet <Car className="w-5 h-5" />
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-14 flex flex-wrap justify-center gap-6 text-white/50 text-sm">
            {["200+ Vehicles", "5 Branches", "10,000+ Bookings", "4.9 ★ Rating"].map(b => (
              <span key={b} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" style={{ color: C.cyan }} />
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={() => scrollTo("services")}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 hover:text-white/70 transition-colors"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </button>
      </section>

      {/* ══════════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════════ */}
      <div style={{ backgroundColor: C.blue }}>
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
          {[
            { val: "200+", label: "Vehicles Available" },
            { val: "5",    label: "Branches Nationwide" },
            { val: "10K+", label: "Happy Customers" },
            { val: "4.9★", label: "Average Rating" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-black" style={{ color: C.cyan }}>{s.val}</p>
              <p className="text-sm text-white/70 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          SERVICES
      ══════════════════════════════════════════════════ */}
      <section id="services" className="py-24" style={{ backgroundColor: C.bg }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: C.cyan }}>
              What We Offer
            </p>
            <h2 className="text-4xl font-black" style={{ color: C.navy }}>
              Complete Mobility Solutions
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              From a quick city run to month-long corporate contracts, MoRental covers every
              mobility need with the same premium experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow border border-gray-100 group"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${C.cyan}18` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: C.cyan }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: C.navy }}>{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FLEET SHOWCASE
      ══════════════════════════════════════════════════ */}
      <section id="fleet" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: C.cyan }}>
              Our Fleet
            </p>
            <h2 className="text-4xl font-black" style={{ color: C.navy }}>
              Find Your Perfect Ride
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              Every vehicle in our fleet is rigorously inspected, fully insured, and ready for
              the road. Browse by category and book instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FLEET.map((car, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={car.img}
                    alt={car.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <span
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: C.blue }}
                  >
                    {car.label}
                  </span>
                  <span
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: `${C.cyan}22`, color: C.navy }}
                  >
                    {car.tag}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-base" style={{ color: C.navy }}>{car.name}</h3>
                    <div className="text-right">
                      <span className="text-xl font-black" style={{ color: C.cyan }}>{car.price}</span>
                      <span className="text-xs text-gray-400">/day</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> All branches</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Instant booking</span>
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Insured</span>
                  </div>
                  <button
                    onClick={() => navigate("/signup")}
                    className="w-full py-2.5 rounded-xl text-sm font-bold transition-colors"
                    style={{ backgroundColor: `${C.navy}08`, color: C.navy }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.cyan;
                      (e.currentTarget as HTMLButtonElement).style.color = C.navy;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${C.navy}08`;
                      (e.currentTarget as HTMLButtonElement).style.color = C.navy;
                    }}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => navigate("/signup")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold border-2 transition-colors"
              style={{ borderColor: C.cyan, color: C.cyan }}
            >
              View Full Fleet <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          WHY CHOOSE US
      ══════════════════════════════════════════════════ */}
      <section className="py-24" style={{ backgroundColor: C.bg }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: C.cyan }}>
              The MoRental Difference
            </p>
            <h2 className="text-4xl font-black" style={{ color: C.navy }}>
              Why Thousands Choose Us
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: C.navy }}
                  >
                    <Icon className="w-6 h-6 text-white" style={{ color: C.cyan }} />
                  </div>
                  <h3 className="font-bold text-base mb-2" style={{ color: C.navy }}>{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          ABOUT
      ══════════════════════════════════════════════════ */}
      <section id="about" className="py-24 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <div className="relative order-2 lg:order-1">
              <div
                className="absolute -inset-4 rounded-3xl opacity-10"
                style={{ backgroundColor: C.cyan }}
              />
              <img
                src={ABOUT_IMG}
                alt="MoRental fleet management"
                className="relative rounded-2xl w-full h-80 object-cover shadow-xl"
              />
              {/* Floating card */}
              <div
                className="absolute -bottom-6 -right-4 bg-white rounded-2xl px-5 py-4 shadow-xl border border-gray-100"
              >
                <p className="text-xs text-gray-400 mb-0.5">Developed by</p>
                <p className="font-black text-sm" style={{ color: C.navy }}>Codico Software Solutions</p>
                <p className="text-xs mt-1" style={{ color: C.cyan }}>Zimbabwe ✦ Innovation-Driven</p>
              </div>
            </div>

            {/* Text */}
            <div className="order-1 lg:order-2">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: C.cyan }}>
                Our Story
              </p>
              <h2 className="text-4xl font-black mb-6 leading-tight" style={{ color: C.navy }}>
                Built in Zimbabwe,<br />Built for Zimbabwe
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-sm">
                <p>
                  <strong className="text-gray-800">MoRental</strong> is a cutting-edge car rental management
                  platform conceived and developed by{" "}
                  <strong className="text-gray-800">Codico Software Solutions</strong> — a Zimbabwean technology
                  studio with a passion for solving real-world problems through elegant digital products.
                </p>
                <p>
                  The platform began as a flagship MVP designed to modernise car rental operations across
                  Zimbabwe. Our goal was straightforward: give car rental operators a powerful, affordable,
                  and easy-to-use system that replaces manual processes with instant digital workflows —
                  from online bookings and driver management to fleet tracking and financial reporting.
                </p>
                <p>
                  As MoRental gains traction in the market, Codico Software Solutions holds an exciting
                  dual vision. Should operators embrace the platform, we become the trusted technology
                  backbone powering Zimbabwe's car rental industry. And should the opportunity arise,
                  we are fully prepared to leverage MoRental to launch our own car rental agency — putting
                  our own vehicles on the road and becoming agents ourselves.
                </p>
                <p>
                  Either way, MoRental represents our commitment to Zimbabwe's mobility future: smarter,
                  faster, and entirely digital.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {["Fleet Management", "Online Booking", "Driver Hire", "Real-Time Tracking", "Payments"].map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: `${C.cyan}15`, color: C.blue }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════ */}
      <section className="py-24" style={{ backgroundColor: C.navy }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: C.cyan }}>
              What Customers Say
            </p>
            <h2 className="text-4xl font-black text-white">
              Real Stories, Real Results
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 border"
                style={{ backgroundColor: `${C.blue}33`, borderColor: `${C.cyan}22` }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current" style={{ color: C.cyan }} />
                  ))}
                </div>

                <p className="text-white/80 text-sm leading-relaxed mb-6">"{t.text}"</p>

                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: C.cyan, color: C.navy }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{t.name}</p>
                    <p className="text-white/50 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CONTACT
      ══════════════════════════════════════════════════ */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: C.cyan }}>
              Get In Touch
            </p>
            <h2 className="text-4xl font-black" style={{ color: C.navy }}>
              Let's Talk Mobility
            </h2>
            <p className="text-gray-500 mt-4 max-w-lg mx-auto">
              Whether you're a car rental operator wanting to transform your business, or a
              customer with a question — we'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Info */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-4" style={{ color: C.navy }}>Contact Information</h3>
                <div className="space-y-4">
                  {[
                    { icon: Phone, label: "Phone",   val: "+263 77 123 4567" },
                    { icon: Mail,  label: "Email",   val: "hello@morental.co.zw" },
                    { icon: MapPin, label: "Address", val: "Harare Central Business District, Zimbabwe" },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-start gap-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${C.cyan}18` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: C.cyan }} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                          <p className="text-sm font-semibold text-gray-800">{item.val}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: C.bg, border: `1px solid ${C.cyan}30` }}
              >
                <h4 className="font-bold mb-2" style={{ color: C.navy }}>Are you a car rental business?</h4>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  MoRental is looking for forward-thinking car rental operators across Zimbabwe to
                  partner with. Get early access, dedicated onboarding, and preferred pricing.
                </p>
                <button
                  onClick={() => navigate("/signup")}
                  className="flex items-center gap-2 text-sm font-bold"
                  style={{ color: C.cyan }}
                >
                  Apply for partnership <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div>
              {submitted ? (
                <div
                  className="rounded-2xl p-10 text-center border"
                  style={{ borderColor: `${C.cyan}40`, backgroundColor: `${C.cyan}08` }}
                >
                  <CheckCircle className="w-14 h-14 mx-auto mb-4" style={{ color: C.cyan }} />
                  <h3 className="text-xl font-bold mb-2" style={{ color: C.navy }}>Message Received!</h3>
                  <p className="text-gray-500 text-sm">
                    Thanks for reaching out. Our team will get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContact} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Tatenda Moyo"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ "--tw-ring-color": C.cyan } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="tatenda@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={contactForm.message}
                      onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                      placeholder="Tell us about your business or enquiry..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
                    style={{ backgroundColor: C.navy, color: "white" }}
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════ */}
      <footer style={{ backgroundColor: C.navy }}>
        {/* CTA band */}
        <div style={{ backgroundColor: C.blue }}>
          <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
            <div>
              <h3 className="text-2xl font-black mb-1">Ready to hit the road?</h3>
              <p className="text-white/70 text-sm">Create your free account and book your first vehicle in minutes.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={() => navigate("/login")}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm border border-white/30 hover:bg-white/10 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-5 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: C.cyan, color: C.navy }}
              >
                Create Account
              </button>
            </div>
          </div>
        </div>

        {/* Main footer */}
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <img src={Logo} alt="MoRental" className="h-10 w-auto mb-4" />
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              MoRental is a next-generation car rental platform developed by{" "}
              <span className="text-white/80 font-medium">Codico Software Solutions</span>.
              Transforming Zimbabwe's mobility landscape — one booking at a time.
            </p>
            <p className="mt-4 text-xs text-white/30">
              A Codico Software Solutions product · Built in Zimbabwe 🇿🇼
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-3 text-sm text-white/50">
              {[
                { label: "Browse Fleet",      action: () => scrollTo("fleet") },
                { label: "Our Services",      action: () => scrollTo("services") },
                { label: "About MoRental",    action: () => scrollTo("about") },
                { label: "Contact Us",        action: () => scrollTo("contact") },
                { label: "Sign Up",           action: () => navigate("/signup") },
                { label: "Customer Login",    action: () => navigate("/login") },
              ].map(l => (
                <li key={l.label}>
                  <button
                    onClick={l.action}
                    className="hover:text-white transition-colors text-left"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Staff Portal */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Staff Portal</h4>
            <p className="text-white/50 text-xs leading-relaxed mb-5">
              Operators, managers, receptionists and drivers access the management
              platform through the dedicated staff portal.
            </p>
            <button
              onClick={() => navigate("/roles")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors"
              style={{ backgroundColor: `${C.cyan}20`, color: C.cyan, border: `1px solid ${C.cyan}40` }}
            >
              Access Staff Portal <ArrowRight className="w-4 h-4" />
            </button>
            <p className="mt-3 text-white/30 text-xs">
              Admin · Manager · Receptionist · Driver · Agent
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
            <p>© {new Date().getFullYear()} MoRental by Codico Software Solutions. All rights reserved.</p>
            <p>
              Designed & developed with ❤ in Zimbabwe by{" "}
              <span className="text-white/50 font-medium">Codico Software Solutions</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
