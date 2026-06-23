// StaffCreateReservationPage.tsx — full-page reservation creation for all staff roles
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Mail, Phone, CreditCard, AlertTriangle,
  Building2, Car, Calendar, DollarSign, FileText, CheckCircle,
  Plus, ChevronDown, ImageOff, Loader2, X,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import ManagerSidebar from "../../components/ManagerSideBar";
import ReceptionistSideBar from "../../components/ReceptionistSideBar";
import AgentSidebar from "../../components/agentsidebar";
import {
  createReservation,
  type CreateReservationPayload,
} from "../../Services/adminAndManager/reservations_service";
import { fetchBranches, type IBranch } from "../../Services/adminAndManager/admin_branch_service";
import {
  fetchVehicleUnits,
  type IVehicleUnit,
  type IVehicleModelSummary,
  type IBranchSummary,
} from "../../Services/adminAndManager/vehicle_units_services";
import {
  fetchAllUsers,
  fetchProfilesByUserId,
  type IUser,
} from "../../Services/adminAndManager/admi_users_service";
import {
  fetchRatePlanByVehicle,
  fetchRatePlanByModel,
  fetchRatePlanByClass,
  normalizeDecimal,
  type IRatePlan,
} from "../../Services/adminAndManager/rate_plan_service";

/* ── helpers ── */
const AUTH_KEY = "car_rental_auth";

function getStoredRoles(): string[] {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return [];
    return JSON.parse(raw)?.user?.roles || [];
  } catch { return []; }
}

function getPrimaryRole(): "admin" | "manager" | "branch_receptionist" | "agent" | "unknown" {
  const roles = getStoredRoles();
  if (roles.includes("admin")) return "admin";
  if (roles.includes("manager")) return "manager";
  if (roles.includes("branch_receptionist")) return "branch_receptionist";
  if (roles.includes("agent")) return "agent";
  return "unknown";
}

function getBackUrl(role: string): string {
  switch (role) {
    case "admin": return "/admin-reservations";
    case "manager": return "/manager-reservations";
    case "branch_receptionist": return "/receptionist-reservations";
    case "agent": return "/agentreservations";
    default: return "/";
  }
}

function getUsersRoute(role: string): string {
  switch (role) {
    case "admin": return "/admin-users";
    case "manager": return "/manager-users";
    case "branch_receptionist": return "/receptionist-users";
    default: return "/user";
  }
}

function getVehicleBranchId(v: IVehicleUnit): string {
  if (!v.branch_id) return "";
  return typeof v.branch_id === "object" ? (v.branch_id as IBranchSummary)._id || "" : v.branch_id as string;
}

function getVehicleLabel(v: IVehicleUnit): string {
  if (!v.vehicle_model_id) return v.plate_number;
  if (typeof v.vehicle_model_id === "object") {
    const m = v.vehicle_model_id as IVehicleModelSummary;
    return `${m.make || ""} ${m.model || ""} (${m.year || ""}) – ${v.plate_number}`;
  }
  return v.plate_number;
}

function getVehicleImage(v: IVehicleUnit): string | null {
  if (v.photos && v.photos.length > 0) return v.photos[0];
  if (typeof v.vehicle_model_id === "object") {
    const m = v.vehicle_model_id as IVehicleModelSummary;
    if (m.images && m.images.length > 0) return m.images[0];
  }
  return null;
}

/* ── component ── */
const StaffCreateReservationPage: React.FC = () => {
  const navigate = useNavigate();
  const role = getPrimaryRole();
  const backUrl = getBackUrl(role);
  const usersRoute = getUsersRoute(role);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* data */
  const [branches, setBranches] = useState<IBranch[]>([]);
  const [vehicleUnits, setVehicleUnits] = useState<IVehicleUnit[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  /* customer section */
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userDropOpen, setUserDropOpen] = useState(false);
  const userDropRef = useRef<HTMLDivElement>(null);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  /* profile auto-population */
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [proceedWithoutProfile, setProceedWithoutProfile] = useState(false);
  /* licence (walk-in manual, or auto from profile) */
  const [licNumber, setLicNumber] = useState("");
  const [licClass, setLicClass] = useState("");
  const [licCountry, setLicCountry] = useState("ZW");
  const [licExpiry, setLicExpiry] = useState("");
  const [licVerified, setLicVerified] = useState(false);

  /* rate plan */
  const [activePlan, setActivePlan] = useState<IRatePlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  /* vehicle section */
  const [pickupBranchId, setPickupBranchId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  /* dates & pricing */
  const [dropoffBranchId, setDropoffBranchId] = useState("");
  const [pickupAt, setPickupAt] = useState("");
  const [dropoffAt, setDropoffAt] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [pricingCurrency, setPricingCurrency] = useState("USD");
  const [notes, setNotes] = useState("");

  /* submit */
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* computed */
  const vehiclesForBranch = vehicleUnits.filter(
    v => pickupBranchId && getVehicleBranchId(v) === pickupBranchId
  );
  const selectedVehicle = vehicleUnits.find(v => v._id === selectedVehicleId) || null;
  const filteredUsers = users
    .filter(u => {
      const q = userSearch.toLowerCase();
      return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q);
    })
    .slice(0, 20);

  const days = pickupAt && dropoffAt
    ? Math.max(1, Math.ceil((new Date(dropoffAt).getTime() - new Date(pickupAt).getTime()) / 86400000))
    : 1;
  const grandTotal = parseFloat(totalAmount) || 0;

  function calcFromPlan(plan: IRatePlan, numDays: number) {
    const dailyRate = parseFloat(normalizeDecimal(plan.daily_rate) || "0") || 0;
    const subtotal = +(dailyRate * numDays).toFixed(2);
    const taxAmount = +((plan.taxes || []).reduce((s, t) => s + subtotal * (t.rate || 0), 0)).toFixed(2);
    const feeAmount = +((plan.fees || []).reduce((s, f) => s + (parseFloat(normalizeDecimal(f.amount) || "0") || 0), 0)).toFixed(2);
    const total = +(subtotal + taxAmount + feeAmount).toFixed(2);
    return { dailyRate, subtotal, taxAmount, feeAmount, total };
  }

  const planCalc = activePlan ? calcFromPlan(activePlan, days) : null;

  /* load data on mount */
  useEffect(() => {
    fetchBranches().then(r => setBranches(r.data || [])).catch(() => {});
    fetchVehicleUnits(1, 200).then(r => setVehicleUnits(r.data?.items || [])).catch(() => {});
    setUsersLoading(true);
    fetchAllUsers(1, 300)
      .then(r => setUsers(r.data?.users || []))
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  }, []);

  /* close user dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userDropRef.current && !userDropRef.current.contains(e.target as Node))
        setUserDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* clear error/success banners */
  useEffect(() => {
    if (errorMsg) { const t = setTimeout(() => setErrorMsg(null), 5000); return () => clearTimeout(t); }
  }, [errorMsg]);
  useEffect(() => {
    if (successMsg) { const t = setTimeout(() => setSuccessMsg(null), 3000); return () => clearTimeout(t); }
  }, [successMsg]);

  /* fetch rate plan when vehicle changes */
  useEffect(() => {
    if (!selectedVehicleId || !selectedVehicle) {
      setActivePlan(null);
      setPlanError(null);
      setPlanLoading(false);
      return;
    }
    setPlanLoading(true);
    setActivePlan(null);
    setPlanError(null);

    const vm = selectedVehicle.vehicle_model_id;
    const vehicleModelId = vm ? (typeof vm === "object" ? (vm as IVehicleModelSummary)._id : vm as string) : null;
    const vehicleClass = vm && typeof vm === "object" ? (vm as any).vehicle_class as string | undefined : undefined;

    (async () => {
      try {
        let plan: IRatePlan | null = null;
        plan = await fetchRatePlanByVehicle(selectedVehicleId);
        if (!plan && vehicleModelId) plan = await fetchRatePlanByModel(vehicleModelId);
        if (!plan && vehicleClass) plan = await fetchRatePlanByClass(vehicleClass);
        setActivePlan(plan);
        if (plan) {
          setPricingCurrency(plan.currency || "USD");
        } else {
          setPlanError("No rate plan found for this vehicle — enter total manually.");
        }
      } catch {
        setPlanError("Failed to load rate plan — enter total manually.");
      } finally {
        setPlanLoading(false);
      }
    })();
  }, [selectedVehicleId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* recalculate total when plan or duration changes */
  useEffect(() => {
    if (activePlan?.daily_rate) {
      const { total } = calcFromPlan(activePlan, days);
      setTotalAmount(String(total));
    }
  }, [activePlan, days]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── user selection ── */
  const resetProfileState = useCallback(() => {
    setCustomerProfile(null);
    setProfileNotFound(false);
    setProceedWithoutProfile(false);
    setLicNumber(""); setLicClass(""); setLicCountry("ZW"); setLicExpiry(""); setLicVerified(false);
  }, []);

  const selectUser = useCallback((u: IUser) => {
    setSelectedUserId(u._id);
    setCustName(u.full_name || "");
    setCustPhone(u.phone || "");
    setCustEmail(u.email || "");
    setUserSearch(u.full_name || u.email || "");
    setUserDropOpen(false);
    resetProfileState();
    setProfileLoading(true);
    fetchProfilesByUserId(u._id)
      .then(res => {
        const profiles: any[] = res.data?.profiles || [];
        const custProf = profiles.find((p: any) => p.role === "customer") || null;
        if (custProf) {
          setCustomerProfile(custProf);
          if (custProf.full_name) setCustName(custProf.full_name);
          const lic = custProf.driver_license;
          if (lic) {
            setLicNumber(lic.number || "");
            setLicClass(lic.class || "");
            setLicCountry(lic.country || "ZW");
            setLicExpiry(lic.expires_at ? lic.expires_at.slice(0, 10) : "");
            setLicVerified(lic.verified || false);
          }
        } else {
          setProfileNotFound(true);
        }
      })
      .catch(() => setProfileNotFound(true))
      .finally(() => setProfileLoading(false));
  }, [resetProfileState]);

  /* ── validation ── */
  function isCustomerValid() {
    if (!custName.trim() || !custPhone.trim() || !custEmail.trim()) return false;
    if (!isWalkIn) {
      if (!selectedUserId) return false;
      if (profileLoading) return false;
      if (profileNotFound && !proceedWithoutProfile) return false;
    }
    return true;
  }
  const isVehicleValid = () => !!(pickupBranchId && selectedVehicleId);
  const isDatesValid = () => {
    if (!dropoffBranchId || !pickupAt || !dropoffAt || grandTotal <= 0) return false;
    if (planLoading) return false;
    return new Date(dropoffAt) > new Date(pickupAt);
  };
  const isFormValid = () => isCustomerValid() && isVehicleValid() && isDatesValid();

  /* ── submit ── */
  async function handleSubmit() {
    if (!selectedVehicle || !isFormValid()) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      let vmId: string | undefined;
      const vm = selectedVehicle.vehicle_model_id;
      if (vm) vmId = typeof vm === "object" ? (vm as IVehicleModelSummary)._id : vm as string;

      const calc = activePlan ? calcFromPlan(activePlan, days) : null;
      const unitPrice = calc ? calc.dailyRate : grandTotal / days;
      const subtotal = calc ? calc.subtotal : grandTotal;

      const breakdownItems: any[] = [{
        label: "Daily rental rate",
        quantity: days,
        unit_amount: unitPrice,
        total: subtotal,
      }];
      if (calc && activePlan?.taxes?.length) {
        activePlan.taxes.forEach(t => {
          const amt = +(subtotal * (t.rate || 0)).toFixed(2);
          if (amt > 0) breakdownItems.push({ label: t.code, quantity: 1, unit_amount: amt, total: amt });
        });
      }
      if (calc && activePlan?.fees?.length) {
        activePlan.fees.forEach(f => {
          const amt = parseFloat(normalizeDecimal(f.amount) || "0") || 0;
          if (amt > 0) breakdownItems.push({ label: f.code, quantity: 1, unit_amount: amt, total: amt });
        });
      }

      const payload: CreateReservationPayload = {
        vehicle_id: selectedVehicle._id,
        ...(vmId ? { vehicle_model_id: vmId } : {}),
        pickup: { branch_id: pickupBranchId, at: new Date(pickupAt).toISOString() },
        dropoff: { branch_id: dropoffBranchId, at: new Date(dropoffAt).toISOString() },
        user_id: isWalkIn ? undefined : (selectedUserId || undefined),
        created_channel: "web",
        pricing: {
          currency: pricingCurrency,
          breakdown: breakdownItems,
          grand_total: grandTotal as any,
          computed_at: new Date().toISOString(),
        },
        driver_snapshot: {
          full_name: custName,
          phone: custPhone,
          email: custEmail,
          driver_license: {
            number: licNumber || "N/A",
            country: licCountry || "ZW",
            class: licClass || "4",
            expires_at: licExpiry
              ? new Date(licExpiry).toISOString()
              : new Date(Date.now() + 365 * 86400000).toISOString(),
            verified: licVerified,
          },
        },
        notes: notes || undefined,
      };

      const created = await createReservation(payload);
      setSuccessMsg(`Reservation ${created.code} created successfully!`);
      setTimeout(() => navigate(backUrl), 1500);
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to create reservation");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── sidebar ── */
  function renderSidebar() {
    switch (role) {
      case "admin": return <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />;
      case "manager": return <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />;
      case "branch_receptionist": return <ReceptionistSideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />;
      case "agent": return <AgentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />;
      default: return null;
    }
  }

  /* ── render ── */
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {renderSidebar()}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => navigate(backUrl)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">New Reservation</h1>
            <p className="text-xs text-gray-500 mt-0.5">Create a reservation on behalf of a customer</p>
          </div>
        </div>

        {/* Toast banners */}
        {errorMsg && (
          <div className="mx-6 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)}><X className="w-4 h-4" /></button>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── Left column: form ── */}
              <div className="lg:col-span-2 space-y-6">

                {/* ── Section 1: Customer ── */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#1EA2E4]" />
                    <h2 className="font-semibold text-gray-800 text-sm">Customer Details</h2>
                    {isCustomerValid() && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />}
                  </div>
                  <div className="p-6 space-y-5">
                    {/* Walk-in / Registered toggle */}
                    <div className="flex gap-3">
                      {[{ v: true, label: "Walk-in" }, { v: false, label: "Registered Customer" }].map(opt => (
                        <button
                          key={String(opt.v)}
                          onClick={() => {
                            setIsWalkIn(opt.v);
                            setSelectedUserId(""); setUserSearch("");
                            resetProfileState();
                            setCustName(""); setCustPhone(""); setCustEmail("");
                          }}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${isWalkIn === opt.v ? "border-[#1EA2E4] bg-[#1EA2E4]/5 text-[#1EA2E4]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* ── Registered customer: user search + profile ── */}
                    {!isWalkIn && (
                      <div className="space-y-4">
                        <div ref={userDropRef} className="relative">
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Search Customer</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Name, email or phone..."
                              value={userSearch}
                              onChange={e => {
                                setUserSearch(e.target.value);
                                setUserDropOpen(true);
                                setSelectedUserId("");
                                resetProfileState();
                                setCustName(""); setCustPhone(""); setCustEmail("");
                              }}
                              onFocus={() => setUserDropOpen(true)}
                              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]"
                            />
                          </div>
                          {userDropOpen && (
                            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                              {usersLoading ? (
                                <div className="py-4 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                                </div>
                              ) : filteredUsers.length === 0 ? (
                                <div className="py-4 text-center text-sm text-gray-400">No customers found</div>
                              ) : filteredUsers.map(u => (
                                <button key={u._id} onClick={() => selectUser(u)} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0">
                                  <div className="w-8 h-8 rounded-full bg-[#1EA2E4]/10 flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-[#1EA2E4]" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{u.full_name}</p>
                                    <p className="text-xs text-gray-500">{u.email} {u.phone ? `· ${u.phone}` : ""}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(usersRoute)}
                          className="text-xs text-[#1EA2E4] hover:underline font-medium flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> New customer? Add them first →
                        </button>

                        {/* Profile loading */}
                        {selectedUserId && profileLoading && (
                          <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin text-[#1EA2E4]" />
                            Loading customer profile...
                          </div>
                        )}

                        {/* No profile warning */}
                        {selectedUserId && !profileLoading && profileNotFound && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-amber-800">No customer profile found</p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                  <span className="font-medium">{custName}</span> doesn't have a customer profile yet. Driver's licence info won't be available.
                                </p>
                              </div>
                            </div>
                            {!proceedWithoutProfile ? (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setProceedWithoutProfile(true)}
                                  className="flex-1 py-2 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors"
                                >
                                  Proceed without profile
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navigate(usersRoute)}
                                  className="flex-1 py-2 text-xs font-semibold bg-white border border-amber-300 hover:bg-amber-50 text-amber-700 rounded-lg transition-colors"
                                >
                                  Add profile first
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-amber-700 bg-white border border-amber-200 rounded-lg px-3 py-2">
                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                Proceeding without customer profile — no licence info captured.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Customer profile card */}
                        {selectedUserId && !profileLoading && customerProfile && (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Customer Profile (auto-populated)</p>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <User className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                <span className="font-medium">{custName}</span>
                              </div>
                              {custEmail && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  <span>{custEmail}</span>
                                </div>
                              )}
                              {custPhone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  <span>{custPhone}</span>
                                </div>
                              )}
                            </div>
                            {customerProfile.driver_license ? (
                              <div className="border-t border-emerald-200 pt-3 space-y-1">
                                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                                  <CreditCard className="w-3.5 h-3.5" /> Driver's Licence
                                  {licVerified && <span className="ml-auto text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full text-xs font-medium">Verified</span>}
                                </p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 mt-1.5">
                                  {licNumber && <span><span className="font-medium text-gray-700">No.</span> {licNumber}</span>}
                                  {licClass && <span><span className="font-medium text-gray-700">Class</span> {licClass}</span>}
                                  {licCountry && <span><span className="font-medium text-gray-700">Country</span> {licCountry}</span>}
                                  {licExpiry && <span><span className="font-medium text-gray-700">Expires</span> {licExpiry}</span>}
                                </div>
                              </div>
                            ) : (
                              <div className="border-t border-amber-200 pt-2 flex items-center gap-1.5 text-xs text-amber-700">
                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                No driver's licence on file for this customer.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Walk-in: manual fields ── */}
                    {isWalkIn && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                            <input type="text" placeholder="John Doe" value={custName} onChange={e => setCustName(e.target.value)}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone *</label>
                            <input type="text" placeholder="+263..." value={custPhone} onChange={e => setCustPhone(e.target.value)}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email *</label>
                            <input type="email" placeholder="john@example.com" value={custEmail} onChange={e => setCustEmail(e.target.value)}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]" />
                          </div>
                        </div>
                        <div className="border-t border-gray-100 pt-4">
                          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" /> Driver's Licence
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Licence No.</label>
                              <input type="text" placeholder="e.g. ZW123456" value={licNumber} onChange={e => setLicNumber(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Class</label>
                              <input type="text" placeholder="e.g. 4" value={licClass} onChange={e => setLicClass(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Country</label>
                              <input type="text" value={licCountry} onChange={e => setLicCountry(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Expiry</label>
                              <input type="date" value={licExpiry} onChange={e => setLicExpiry(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* ── Section 2: Vehicle ── */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#1EA2E4]" />
                    <h2 className="font-semibold text-gray-800 text-sm">Vehicle Selection</h2>
                    {isVehicleValid() && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />}
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        <Building2 className="inline w-3.5 h-3.5 mr-1" />Pickup Branch *
                      </label>
                      <div className="relative">
                        <select
                          value={pickupBranchId}
                          onChange={e => { setPickupBranchId(e.target.value); setSelectedVehicleId(""); }}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4] appearance-none bg-white pr-8"
                        >
                          <option value="">Select branch...</option>
                          {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {pickupBranchId && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                          Select Vehicle * <span className="font-normal text-gray-400">({vehiclesForBranch.length} available)</span>
                        </label>
                        {vehiclesForBranch.length === 0 ? (
                          <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
                            <Car className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">No vehicles at this branch</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                            {vehiclesForBranch.map(v => {
                              const img = getVehicleImage(v);
                              const isSelected = selectedVehicleId === v._id;
                              return (
                                <button
                                  key={v._id}
                                  onClick={() => setSelectedVehicleId(v._id)}
                                  className={`text-left rounded-xl border-2 overflow-hidden transition-all ${isSelected ? "border-[#1EA2E4] ring-2 ring-[#1EA2E4]/20" : "border-gray-200 hover:border-gray-300"}`}
                                >
                                  {/* Vehicle image */}
                                  <div className="h-32 bg-gray-100 relative overflow-hidden">
                                    {img ? (
                                      <img
                                        src={img}
                                        alt={getVehicleLabel(v)}
                                        className="w-full h-full object-cover"
                                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                        <ImageOff className="w-8 h-8 mb-1" />
                                        <span className="text-xs">No image</span>
                                      </div>
                                    )}
                                    {isSelected && (
                                      <div className="absolute top-2 right-2 w-6 h-6 bg-[#1EA2E4] rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                      </div>
                                    )}
                                    <div className={`absolute bottom-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full ${v.availability_state === "available" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                      {v.availability_state || "available"}
                                    </div>
                                  </div>
                                  {/* Vehicle info */}
                                  <div className="p-3">
                                    <p className="text-sm font-semibold text-gray-800 leading-tight">{getVehicleLabel(v)}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{v.color} · {v.plate_number}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* ── Section 3: Dates & Pricing ── */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#1EA2E4]" />
                    <h2 className="font-semibold text-gray-800 text-sm">Dates & Pricing</h2>
                    {isDatesValid() && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />}
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pickup Date & Time *</label>
                        <input
                          type="datetime-local"
                          value={pickupAt}
                          onChange={e => { setPickupAt(e.target.value); if (dropoffAt && e.target.value >= dropoffAt) setDropoffAt(""); }}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dropoff Date & Time *</label>
                        <input
                          type="datetime-local"
                          value={dropoffAt}
                          min={pickupAt || undefined}
                          onChange={e => setDropoffAt(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dropoff Branch *</label>
                      <div className="relative">
                        <select
                          value={dropoffBranchId}
                          onChange={e => setDropoffBranchId(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4] appearance-none bg-white pr-8"
                        >
                          <option value="">Select branch...</option>
                          {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Rate plan card */}
                    {selectedVehicleId && (
                      <div>
                        {planLoading && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                            <Loader2 className="w-4 h-4 animate-spin text-[#1EA2E4]" />
                            Finding rate plan for this vehicle...
                          </div>
                        )}
                        {planError && !planLoading && (
                          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700">{planError}</p>
                          </div>
                        )}
                        {activePlan && !planLoading && (
                          <div className="bg-[#1EA2E4]/5 border border-[#1EA2E4]/20 rounded-xl p-4 space-y-2">
                            <p className="text-xs font-semibold text-[#1EA2E4] uppercase tracking-wide flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5" /> Rate Plan — {activePlan.name}
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
                              <span><span className="font-medium">Daily rate:</span> {activePlan.currency} {normalizeDecimal(activePlan.daily_rate)}</span>
                              {activePlan.weekly_rate && <span><span className="font-medium">Weekly:</span> {activePlan.currency} {normalizeDecimal(activePlan.weekly_rate)}</span>}
                              {activePlan.monthly_rate && <span><span className="font-medium">Monthly:</span> {activePlan.currency} {normalizeDecimal(activePlan.monthly_rate)}</span>}
                            </div>
                            {((activePlan.taxes?.length ?? 0) > 0 || (activePlan.fees?.length ?? 0) > 0) && (
                              <div className="border-t border-[#1EA2E4]/20 pt-2 space-y-0.5">
                                {activePlan.taxes?.map(t => (
                                  <p key={t.code} className="text-xs text-gray-600">
                                    <span className="font-medium">{t.code}:</span> {(t.rate * 100).toFixed(0)}%
                                  </p>
                                ))}
                                {activePlan.fees?.map(f => (
                                  <p key={f.code} className="text-xs text-gray-600">
                                    <span className="font-medium">{f.code}:</span> {activePlan.currency} {normalizeDecimal(f.amount)}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Total Amount *
                          {activePlan && <span className="ml-2 text-[10px] font-normal text-[#1EA2E4] bg-[#1EA2E4]/10 px-1.5 py-0.5 rounded-full">Auto-calculated</span>}
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={totalAmount}
                            onChange={e => setTotalAmount(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Currency</label>
                        <div className="relative">
                          <select
                            value={pricingCurrency}
                            onChange={e => setPricingCurrency(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4] appearance-none bg-white"
                          >
                            <option value="USD">USD</option>
                            <option value="ZWL">ZWL</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        <FileText className="inline w-3.5 h-3.5 mr-1" />Notes (optional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Any special requests or instructions..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4] resize-none"
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* ── Right column: summary + submit ── */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800 text-sm">Booking Summary</h3>
                  </div>
                  <div className="p-5 space-y-3 text-sm">
                    {/* Customer */}
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Customer</p>
                        <p className="text-gray-800 font-medium">{custName || <span className="text-gray-300 italic">Not set</span>}</p>
                        {custEmail && <p className="text-xs text-gray-500">{custEmail}</p>}
                        {custPhone && <p className="text-xs text-gray-500">{custPhone}</p>}
                      </div>
                    </div>

                    {/* Vehicle */}
                    {selectedVehicle && (
                      <>
                        <div className="border-t border-gray-50 pt-3 flex items-start gap-2">
                          <Car className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 font-medium">Vehicle</p>
                            <p className="text-gray-800 font-medium text-xs leading-tight">{getVehicleLabel(selectedVehicle)}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{selectedVehicle.color} · {selectedVehicle.plate_number}</p>
                          </div>
                          {getVehicleImage(selectedVehicle) && (
                            <img src={getVehicleImage(selectedVehicle)!} alt="" className="w-12 h-10 object-cover rounded-lg flex-shrink-0" />
                          )}
                        </div>
                      </>
                    )}

                    {/* Dates */}
                    {(pickupAt || dropoffAt) && (
                      <div className="border-t border-gray-50 pt-3 flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Duration</p>
                          {pickupAt && <p className="text-xs text-gray-700">From: {new Date(pickupAt).toLocaleString()}</p>}
                          {dropoffAt && <p className="text-xs text-gray-700">To: {new Date(dropoffAt).toLocaleString()}</p>}
                          {pickupAt && dropoffAt && (
                            <p className="text-xs font-medium text-gray-800 mt-0.5">{days} day{days !== 1 ? "s" : ""}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    {grandTotal > 0 && (
                      <div className="border-t border-gray-100 pt-3 space-y-1">
                        {planCalc ? (
                          <>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span>{pricingCurrency} {planCalc.dailyRate.toFixed(2)}/day × {days}d</span>
                              <span>{pricingCurrency} {planCalc.subtotal.toFixed(2)}</span>
                            </div>
                            {planCalc.taxAmount > 0 && (
                              <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>Taxes</span>
                                <span>{pricingCurrency} {planCalc.taxAmount.toFixed(2)}</span>
                              </div>
                            )}
                            {planCalc.feeAmount > 0 && (
                              <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>Fees</span>
                                <span>{pricingCurrency} {planCalc.feeAmount.toFixed(2)}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Daily rate</span>
                            <span>{pricingCurrency} {(grandTotal / days).toFixed(2)}/day</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                          <span className="text-sm font-bold text-gray-800">Total</span>
                          <span className="text-base font-bold text-[#1EA2E4]">{pricingCurrency} {grandTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {/* Type */}
                    <div className="border-t border-gray-50 pt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500">Booking type</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isWalkIn ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {isWalkIn ? "Walk-in" : "Registered"}
                      </span>
                    </div>

                    {/* Validation checklist */}
                    <div className="border-t border-gray-50 pt-3 space-y-1.5">
                      {[
                        { label: "Customer details", ok: isCustomerValid() },
                        { label: "Vehicle selected", ok: isVehicleValid() },
                        { label: "Dates & pricing", ok: isDatesValid() },
                      ].map(({ label, ok }) => (
                        <div key={label} className="flex items-center gap-2 text-xs">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? "bg-emerald-100" : "bg-gray-100"}`}>
                            {ok ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />}
                          </div>
                          <span className={ok ? "text-gray-700" : "text-gray-400"}>{label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !isFormValid()}
                      className="w-full mt-2 py-3 bg-gradient-to-r from-[#0A1628] to-[#1A5FA8] text-white rounded-xl hover:opacity-90 font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                      ) : "Create Reservation"}
                    </button>
                    <button
                      onClick={() => navigate(backUrl)}
                      disabled={submitting}
                      className="w-full py-2.5 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 font-medium text-sm transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffCreateReservationPage;
