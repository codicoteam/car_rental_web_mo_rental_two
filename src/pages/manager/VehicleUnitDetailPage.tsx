import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ManagerSidebar from "../../components/ManagerSideBar";
import {
  fetchVehicleUnitById, type IVehicleUnit, type IVehicleModelSummary, type IBranchSummary,
} from "../../Services/adminAndManager/vehicle_units_services";
import {
  fetchAllRatePlansByVehicle,
  normalizeDecimal,
  type IRatePlan,
} from "../../Services/adminAndManager/rate_plan_service";
import {
  ArrowLeft, Car, MoreVertical, AlertCircle, RefreshCw, CheckCircle,
  X, Fuel, Settings, Users, Hash, MapPin, Calendar, Activity,
  Shield, Gauge, Palette, ChevronLeft, ChevronRight, Image,
  TrendingUp, Plus, ExternalLink,
} from "lucide-react";

const AVAILABILITY_META: Record<string, { label: string; color: string; dot: string }> = {
  available: { label: "Available", color: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  reserved: { label: "Reserved", color: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  rented: { label: "Rented", color: "text-blue-700 bg-blue-50 border-blue-200", dot: "bg-blue-500" },
  out_of_service: { label: "Out of Service", color: "text-red-700 bg-red-50 border-red-200", dot: "bg-red-500" },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  inactive: { label: "Inactive", color: "text-gray-600 bg-gray-50 border-gray-200" },
  pending: { label: "Pending", color: "text-amber-700 bg-amber-50 border-amber-200" },
};

const ManagerVehicleUnitDetailPage: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<IVehicleUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ratePlans, setRatePlans] = useState<IRatePlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  useEffect(() => {
    if (!vehicleId) return;
    load();
  }, [vehicleId]);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchVehicleUnitById(vehicleId!);
      setVehicle(data);
      setPlansLoading(true);
      fetchAllRatePlansByVehicle(vehicleId!)
        .then(plans => setRatePlans(plans))
        .catch(() => {})
        .finally(() => setPlansLoading(false));
    } catch {
      setError("Failed to load vehicle details");
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (d?: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1EA2E4]" />
          <p className="text-gray-500 text-sm">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="flex h-screen bg-gray-50">
        <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-red-600">{error || "Vehicle not found"}</p>
          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-[#1EA2E4] text-white rounded-lg text-sm">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const model = typeof vehicle.vehicle_model_id === "object" ? vehicle.vehicle_model_id as IVehicleModelSummary : null;
  const branch = typeof vehicle.branch_id === "object" ? vehicle.branch_id as IBranchSummary : null;
  const photos = vehicle.photos || [];
  const avail = vehicle.availability_state || "available";
  const availMeta = AVAILABILITY_META[avail] || { label: avail, color: "text-gray-600 bg-gray-50 border-gray-200", dot: "bg-gray-400" };
  const statusStr = vehicle.status || "active";
  const statusMeta = STATUS_META[statusStr] || { label: statusStr, color: "text-gray-600 bg-gray-50 border-gray-200" };
  const vehicleTitle = model ? `${model.make || ""} ${model.model || ""} ${model.year || ""}`.trim() : vehicle.vin;

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <span className="text-gray-300">/</span>
              <span className="text-gray-800 font-semibold text-sm">{vehicle.plate_number}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${statusMeta.color}`}>
                {statusMeta.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${availMeta.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${availMeta.dot}`} />
                {availMeta.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              {/* Photo Gallery */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {photos.length > 0 ? (
                  <div>
                    <div className="relative w-full h-72 bg-gray-100">
                      <img src={photos[photoIndex]} alt={vehicleTitle} className="w-full h-full object-cover" />
                      {photos.length > 1 && (
                        <>
                          <button onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white">
                            <ChevronLeft className="w-4 h-4 text-gray-700" />
                          </button>
                          <button onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white">
                            <ChevronRight className="w-4 h-4 text-gray-700" />
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {photos.map((_, i) => (
                              <button key={i} onClick={() => setPhotoIndex(i)}
                                className={`w-2 h-2 rounded-full ${i === photoIndex ? "bg-white" : "bg-white/50"}`} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    {photos.length > 1 && (
                      <div className="p-3 flex gap-2 overflow-x-auto">
                        {photos.map((p, i) => (
                          <button key={i} onClick={() => setPhotoIndex(i)}
                            className={`w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 ${i === photoIndex ? "border-[#1EA2E4]" : "border-transparent"}`}>
                            <img src={p} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-56 bg-gray-100 flex flex-col items-center justify-center">
                    <Image className="w-12 h-12 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">No photos available</p>
                  </div>
                )}
              </div>

              {/* Unit Details */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Vehicle Unit Details</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "VIN", value: vehicle.vin, icon: Hash },
                    { label: "Plate Number", value: vehicle.plate_number, icon: Shield },
                    { label: "Color", value: vehicle.color || "—", icon: Palette },
                    { label: "Odometer", value: vehicle.odometer_km ? `${vehicle.odometer_km.toLocaleString()} km` : "—", icon: Gauge },
                    { label: "Last Service", value: fmtDate(vehicle.last_service_at), icon: Settings },
                    { label: "Last Service KM", value: vehicle.last_service_odometer_km ? `${vehicle.last_service_odometer_km.toLocaleString()} km` : "—", icon: Gauge },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="font-semibold text-gray-800 text-sm truncate capitalize">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {vehicle.metadata && Object.keys(vehicle.metadata).some(k => vehicle.metadata![k] != null) && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Additional Info</p>
                  <div className="grid grid-cols-2 gap-4">
                    {vehicle.metadata.seats && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><Users className="w-4 h-4 text-gray-500" /></div>
                        <div><p className="text-xs text-gray-400">Seats</p><p className="font-semibold text-gray-800 text-sm">{vehicle.metadata.seats}</p></div>
                      </div>
                    )}
                    {vehicle.metadata.doors && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><Activity className="w-4 h-4 text-gray-500" /></div>
                        <div><p className="text-xs text-gray-400">Doors</p><p className="font-semibold text-gray-800 text-sm">{vehicle.metadata.doors}</p></div>
                      </div>
                    )}
                    {vehicle.metadata.notes && (
                      <div className="col-span-2"><p className="text-xs text-gray-400 mb-1">Notes</p><p className="text-sm text-gray-700">{vehicle.metadata.notes}</p></div>
                    )}
                  </div>
                  {(vehicle.metadata.features?.length ?? 0) > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-2">Features</p>
                      <div className="flex flex-wrap gap-1.5">
                        {vehicle.metadata.features!.map((f: string) => (
                          <span key={f} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div className="space-y-5">
              {model && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Model Information</p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Car className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{model.make} {model.model}</p>
                      <p className="text-sm text-gray-500">{model.year}</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: "Class", value: model.class, icon: Activity },
                      { label: "Transmission", value: model.transmission, icon: Settings },
                      { label: "Fuel Type", value: model.fuel_type, icon: Fuel },
                      { label: "Seats", value: model.seats ? `${model.seats} seats` : null, icon: Users },
                      { label: "Doors", value: model.doors ? `${model.doors} doors` : null, icon: Car },
                    ].filter(r => r.value).map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-center gap-2.5">
                        <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</span>
                        <span className="text-sm font-medium text-gray-800 capitalize">{value}</span>
                      </div>
                    ))}
                  </div>
                  {(model.features?.length ?? 0) > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-2">Features</p>
                      <div className="flex flex-wrap gap-1">
                        {model.features!.map(f => (
                          <span key={f} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {branch && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Branch</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{branch.name}</p>
                      {branch.code && <p className="text-xs text-gray-400">{branch.code}</p>}
                    </div>
                  </div>
                  {branch.address && (
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {[branch.address.line1, branch.address.city, branch.address.region, branch.address.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {branch.phone && <p className="text-xs text-gray-500 mt-1">{branch.phone}</p>}
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Timeline</p>
                <div className="space-y-2.5">
                  {[
                    { label: "Added", value: fmtDate(vehicle.created_at), icon: Calendar },
                    { label: "Updated", value: fmtDate(vehicle.updated_at), icon: RefreshCw },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-500 w-16">{label}</span>
                      <span className="text-sm font-medium text-gray-700">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rate Plans */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Rate Plans
                  </p>
                  <button
                    onClick={() => {
                      const label = vehicle ? [
                        typeof vehicle.vehicle_model_id === "object"
                          ? `${(vehicle.vehicle_model_id as IVehicleModelSummary).make || ""} ${(vehicle.vehicle_model_id as IVehicleModelSummary).model || ""}`.trim()
                          : "",
                        vehicle.plate_number,
                      ].filter(Boolean).join(" · ") : vehicleId;
                      navigate(`/manager-rate-plans?vehicleId=${vehicleId}&vehicleName=${encodeURIComponent(label || "")}`);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-[#1EA2E4] hover:bg-[#1EA2E4]/5 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Plan
                  </button>
                </div>

                {plansLoading ? (
                  <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
                    <div className="w-4 h-4 border-2 border-gray-200 border-t-[#1EA2E4] rounded-full animate-spin" />
                    Loading...
                  </div>
                ) : ratePlans.length === 0 ? (
                  <div className="py-4 text-center border-2 border-dashed border-gray-100 rounded-xl">
                    <TrendingUp className="w-7 h-7 text-gray-200 mx-auto mb-1.5" />
                    <p className="text-xs text-gray-400">No rate plans for this unit</p>
                    <button
                      onClick={() => navigate(`/manager-rate-plans?vehicleId=${vehicleId}&vehicleName=${encodeURIComponent(vehicle.plate_number)}`)}
                      className="mt-2 text-xs font-semibold text-[#1EA2E4] hover:underline"
                    >
                      Add a rate plan →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ratePlans.map(plan => (
                      <div key={plan._id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{plan.name}</p>
                          <p className="text-xs text-gray-500">
                            {plan.currency} {normalizeDecimal(plan.daily_rate)}/day
                            {plan.valid_to ? ` · until ${new Date(plan.valid_to).toLocaleDateString()}` : " · no expiry"}
                          </p>
                        </div>
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${plan.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"}`}>
                          {plan.active ? "Active" : "Off"}
                        </span>
                      </div>
                    ))}
                    <button
                      onClick={() => navigate("/manager-rate-plans")}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#1EA2E4] py-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Manage all rate plans
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerVehicleUnitDetailPage;
