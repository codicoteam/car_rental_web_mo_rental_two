import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Sidebar from "../../../components/Sidebar";
import { BranchMapPicker, type BranchLocation } from "../../../components/BranchMapPicker";
import {
    fetchBranches, createBranch, updateBranch, deleteBranch,
    getBranchErrorDisplay,
    type IBranch, type IBranchesListResponse, type CreateBranchPayload, type UpdateBranchPayload,
    type IOpeningHourSlot, type OpeningHours, type DayKey,
} from "../../../Services/adminAndManager/admin_branch_service";
import { createVehicleUnit, type CreateVehiclePayload } from "../../../Services/adminAndManager/vehicle_units_services";
import { fetchVehicleModels } from "../../../Services/adminAndManager/vehicle_model_service";
import {
    Search, Trash2, Eye, Edit, Plus, Filter, X, AlertCircle, CheckCircle,
    MoreVertical, MapPin, Phone, Mail, Clock, Building, Save, Navigation,
    Calendar, XCircle, RefreshCw, Car, ChevronDown, Map, Loader2,
    Hash, Globe, Layers, List,
} from "lucide-react";

// ── Branch map marker icons ───────────────────────────────────────────────────
const activeMarkerIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const inactiveMarkerIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

// ── Shimmer ──────────────────────────────────────────────────────────────────
const Shimmer = ({ className = "" }: { className?: string }) => (
    <div className={`rounded-lg animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 ${className}`} />
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (s?: string) => {
    if (!s) return "N/A";
    return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const DAYS: { key: DayKey; label: string; short: string }[] = [
    { key: "mon", label: "Monday", short: "Mon" },
    { key: "tue", label: "Tuesday", short: "Tue" },
    { key: "wed", label: "Wednesday", short: "Wed" },
    { key: "thu", label: "Thursday", short: "Thu" },
    { key: "fri", label: "Friday", short: "Fri" },
    { key: "sat", label: "Saturday", short: "Sat" },
    { key: "sun", label: "Sunday", short: "Sun" },
];

// ── Main Component ─────────────────────────────────────────────────────────────
const BranchManagementScreen: React.FC = () => {
    const navigate = useNavigate();
    const [branches, setBranches] = useState<IBranch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [cityFilter, setCityFilter] = useState("all");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "map">("list");

    // Detail panel
    const [detailBranch, setDetailBranch] = useState<IBranch | null>(null);
    const [detailTab, setDetailTab] = useState<"info" | "map" | "hours">("info");

    // Add / Edit panel
    const [editMode, setEditMode] = useState<"add" | "edit" | null>(null);
    const [editBranch, setEditBranch] = useState<IBranch | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const INIT_FORM: CreateBranchPayload = {
        name: "", code: "",
        address: { line1: "", line2: "", city: "", region: "", postal_code: "", country: "Zimbabwe" },
        phone: "", email: "", imageLoc: "", active: true, opening_hours: {},
    };
    const [form, setForm] = useState<CreateBranchPayload>(INIT_FORM);
    const [formGeo, setFormGeo] = useState<BranchLocation | null>(null);

    // Add vehicle unit panel
    const [vehiclePanel, setVehiclePanel] = useState(false);
    const [vehicleModels, setVehicleModels] = useState<any[]>([]);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [vehicleForm, setVehicleForm] = useState({ vin: "", plate_number: "", vehicle_model_id: "", color: "", odometer_km: "" });
    const [vehicleSaving, setVehicleSaving] = useState(false);

    // Delete
    const [branchToDelete, setBranchToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Snackbar
    const [snackbar, setSnackbar] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({ show: false, message: "", type: "info" });
    const showSnackbar = (message: string, type: "success" | "error" | "info") => {
        setSnackbar({ show: true, message, type });
        setTimeout(() => setSnackbar(p => ({ ...p, show: false })), 3500);
    };

    // ── Load branches ──
    const loadBranches = useCallback(async () => {
        try {
            setLoading(true); setError(null);
            const r: IBranchesListResponse = await fetchBranches();
            setBranches(r.data);
        } catch (err) {
            setError(getBranchErrorDisplay(err).message || "Failed to load branches");
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadBranches(); }, [loadBranches]);

    // ── Load vehicle models ──
    const loadVehicleModels = async () => {
        if (vehicleModels.length > 0) return;
        setModelsLoading(true);
        try {
            const r = await fetchVehicleModels();
            setVehicleModels(r.data?.items || r.data || []);
        } catch { /* silent */ } finally { setModelsLoading(false); }
    };

    // ── Filters ──
    const uniqueCities = Array.from(new Set(branches.map(b => b.address.city))).sort();
    const filtered = branches.filter(b => {
        const q = searchTerm.toLowerCase();
        const matchQ = !q || b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q)
            || b.address.city.toLowerCase().includes(q) || b.address.line1.toLowerCase().includes(q)
            || (b.phone || "").includes(q) || (b.email || "").toLowerCase().includes(q);
        const matchStatus = statusFilter === "all" || (statusFilter === "active" ? b.active : !b.active);
        const matchCity = cityFilter === "all" || b.address.city === cityFilter;
        return matchQ && matchStatus && matchCity;
    });

    // ── Opening hours helpers ──
    const handleOpenHoursChange = (day: DayKey, idx: number, field: "open" | "close", val: string) => {
        setForm(p => {
            const hrs = { ...p.opening_hours } as OpeningHours;
            const slots = [...(hrs[day] || [])];
            slots[idx] = { ...slots[idx], [field]: val };
            return { ...p, opening_hours: { ...hrs, [day]: slots } };
        });
    };
    const addSlot = (day: DayKey) => {
        setForm(p => {
            const hrs = { ...p.opening_hours } as OpeningHours;
            return { ...p, opening_hours: { ...hrs, [day]: [...(hrs[day] || []), { open: "08:00", close: "17:00" }] } };
        });
    };
    const removeSlot = (day: DayKey, idx: number) => {
        setForm(p => {
            const hrs = { ...p.opening_hours } as OpeningHours;
            const slots = (hrs[day] || []).filter((_, i) => i !== idx);
            return { ...p, opening_hours: { ...hrs, [day]: slots.length > 0 ? slots : undefined as any } };
        });
    };

    // ── Open add modal ──
    const openAdd = () => {
        setForm(INIT_FORM);
        setFormGeo(null);
        setEditBranch(null);
        setEditMode("add");
    };

    // ── Open edit modal ──
    const openEdit = (b: IBranch) => {
        setEditBranch(b);
        setForm({
            name: b.name, code: b.code, address: { ...b.address },
            phone: b.phone || "", email: b.email || "", imageLoc: b.imageLoc || "",
            active: b.active ?? true, opening_hours: b.opening_hours || {},
        });
        setFormGeo(
            b.geo?.coordinates ? { lat: b.geo.coordinates[1], lng: b.geo.coordinates[0] } : null
        );
        setEditMode("edit");
        setDetailBranch(null);
    };

    // ── Save ──
    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: CreateBranchPayload = {
                ...form,
                geo: formGeo?.lat && formGeo?.lng
                    ? { type: "Point", coordinates: [formGeo.lng, formGeo.lat] }
                    : undefined,
            };
            if (editMode === "edit" && editBranch) {
                await updateBranch(editBranch._id, payload as UpdateBranchPayload);
                showSnackbar("Branch updated successfully", "success");
            } else {
                await createBranch(payload);
                showSnackbar("Branch created successfully", "success");
            }
            setEditMode(null);
            setEditBranch(null);
            await loadBranches();
        } catch (err) {
            showSnackbar(getBranchErrorDisplay(err).message, "error");
        } finally { setSaving(false); }
    };

    // ── Delete ──
    const handleDelete = async () => {
        if (!branchToDelete) return;
        setDeleting(true);
        try {
            await deleteBranch(branchToDelete);
            showSnackbar("Branch deleted", "success");
            setBranchToDelete(null);
            if (detailBranch?._id === branchToDelete) setDetailBranch(null);
            await loadBranches();
        } catch (err) {
            showSnackbar(getBranchErrorDisplay(err).message, "error");
        } finally { setDeleting(false); }
    };

    // ── Add vehicle unit ──
    const openVehiclePanel = () => {
        setVehicleForm({ vin: "", plate_number: "", vehicle_model_id: "", color: "", odometer_km: "" });
        setVehiclePanel(true);
        loadVehicleModels();
    };

    const handleAddVehicle = async () => {
        if (!detailBranch || !vehicleForm.vin || !vehicleForm.plate_number || !vehicleForm.vehicle_model_id) return;
        setVehicleSaving(true);
        try {
            const payload: CreateVehiclePayload = {
                vin: vehicleForm.vin,
                plate_number: vehicleForm.plate_number,
                vehicle_model_id: vehicleForm.vehicle_model_id,
                branch_id: detailBranch._id,
                color: vehicleForm.color || undefined,
                odometer_km: vehicleForm.odometer_km ? Number(vehicleForm.odometer_km) : undefined,
            };
            await createVehicleUnit(payload);
            showSnackbar("Vehicle added to branch", "success");
            setVehiclePanel(false);
        } catch (err: any) {
            showSnackbar(err?.message || "Failed to add vehicle", "error");
        } finally { setVehicleSaving(false); }
    };

    // ── Render Opening Hours compact ──
    const renderHours = (hours?: OpeningHours) => {
        if (!hours || Object.keys(hours).length === 0)
            return <p className="text-gray-400 text-sm">No hours specified</p>;
        return (
            <div className="space-y-1.5">
                {DAYS.map(d => {
                    const slots = (hours as any)[d.key];
                    if (!slots?.length) return null;
                    return (
                        <div key={d.key} className="flex items-center gap-2 text-sm">
                            <span className="w-8 text-xs font-bold text-gray-400 uppercase">{d.short}</span>
                            <div className="flex gap-2 flex-wrap">
                                {(slots as IOpeningHourSlot[]).map((s, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-[#00AEEF]/10 text-[#00AEEF] rounded-lg text-xs font-medium">
                                        {s.open}–{s.close}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // ── Branch Card ───────────────────────────────────────────────────────────
    const BranchCard = ({ b }: { b: IBranch }) => (
        <div
            onClick={() => navigate(`/admin/branch/${b._id}`)}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#00AEEF]/30 transition-all duration-200 cursor-pointer overflow-hidden"
        >
            {/* Top accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#0A1628] to-[#00AEEF]" />

            <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-base font-bold text-[#0A1628] truncate">{b.name}</h3>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${b.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                                {b.active ? "ACTIVE" : "INACTIVE"}
                            </span>
                        </div>
                        <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg">{b.code}</span>
                    </div>
                    {b.geo?.coordinates && (
                        <div className="w-9 h-9 rounded-xl bg-[#00AEEF]/10 flex items-center justify-center flex-shrink-0">
                            <Map className="w-4 h-4 text-[#00AEEF]" />
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm text-gray-500">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
                        <span className="truncate">{b.address.line1}, {b.address.city}</span>
                    </div>
                    {b.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                            <span>{b.phone}</span>
                        </div>
                    )}
                    {b.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                            <span className="truncate">{b.email}</span>
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-300">{formatDate(b.createdAt)}</span>
                    <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); openEdit(b); }}
                            className="p-1.5 text-gray-400 hover:text-[#00AEEF] hover:bg-[#00AEEF]/10 rounded-lg transition-colors">
                            <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setBranchToDelete(b._id); }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // ── Form field shortcut ──────────────────────────────────────────────────
    const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
    const inp = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all bg-white";

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-6 py-4 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100">
                                <MoreVertical className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-[#0A1628]">Branch Management</h1>
                                <p className="text-xs text-gray-400 mt-0.5">{branches.length} branches total</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-center">
                            {/* List / Map toggle */}
                            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${viewMode === "list" ? "bg-[#0A1628] text-white" : "bg-white text-gray-500 hover:text-[#0A1628]"}`}
                                >
                                    <List className="w-4 h-4" /> List
                                </button>
                                <button
                                    onClick={() => setViewMode("map")}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${viewMode === "map" ? "bg-[#0A1628] text-white" : "bg-white text-gray-500 hover:text-[#0A1628]"}`}
                                >
                                    <Map className="w-4 h-4" /> Map
                                </button>
                            </div>
                            <button onClick={loadBranches} className="p-2.5 text-gray-500 hover:text-[#00AEEF] hover:bg-[#00AEEF]/10 rounded-xl border border-gray-100 transition-colors">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0A1628] to-[#1A5FA8] text-white rounded-xl hover:opacity-90 transition-all font-medium text-sm shadow-sm">
                                <Plus className="w-4 h-4" /> Add Branch
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 bg-white border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search by name, code, city..."
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all" />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                    className="pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30">
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
                                    className="pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30">
                                    <option value="all">All Cities</option>
                                    {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {viewMode === "map" ? (
                    /* ── Map View ── */
                    <div className="flex-1 relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                                <Loader2 className="w-10 h-10 text-[#00AEEF] animate-spin" />
                            </div>
                        ) : (
                            <MapContainer
                                center={[-19.0, 29.8]}
                                zoom={7}
                                style={{ height: "100%", width: "100%" }}
                                className="z-0"
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {filtered.filter(b => b.geo?.coordinates?.length === 2).map(b => {
                                    const [lng, lat] = b.geo!.coordinates;
                                    return (
                                        <Marker
                                            key={b._id}
                                            position={[lat, lng]}
                                            icon={b.active !== false ? activeMarkerIcon : inactiveMarkerIcon}
                                        >
                                            <Popup minWidth={200}>
                                                <div className="py-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-[#0A1628] text-sm">{b.name}</span>
                                                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${b.active !== false ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                                            {b.active !== false ? "Active" : "Inactive"}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-1">{b.address.line1}, {b.address.city}</p>
                                                    {b.phone && <p className="text-xs text-gray-400 mb-2">{b.phone}</p>}
                                                    <button
                                                        onClick={() => navigate(`/admin/branch/${b._id}`)}
                                                        className="w-full mt-1 px-3 py-1.5 bg-[#0A1628] text-white text-xs font-semibold rounded-lg hover:bg-[#1A3A5C] transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <Eye className="w-3 h-3" /> View Details
                                                    </button>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    );
                                })}
                            </MapContainer>
                        )}
                        {/* legend */}
                        <div className="absolute bottom-6 left-4 z-[1000] bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 text-xs space-y-1.5">
                            <p className="font-semibold text-gray-600 mb-1">Legend</p>
                            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#00AEEF]" /> Active branch</div>
                            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Inactive branch</div>
                            {filtered.filter(b => !b.geo?.coordinates).length > 0 && (
                                <p className="text-gray-400 mt-1">{filtered.filter(b => !b.geo?.coordinates).length} branch(es) have no location set</p>
                            )}
                        </div>
                    </div>
                ) : (
                    /* ── List View ── */
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                        <div className="h-1.5 bg-gray-100" />
                                        <div className="p-5 space-y-3">
                                            <Shimmer className="h-5 w-2/3" />
                                            <Shimmer className="h-4 w-1/3" />
                                            <Shimmer className="h-3 w-full" />
                                            <Shimmer className="h-3 w-3/4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-64">
                                <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                                <p className="text-red-600 mb-4">{error}</p>
                                <button onClick={loadBranches} className="flex items-center gap-2 px-4 py-2 bg-[#00AEEF] text-white rounded-xl text-sm">
                                    <RefreshCw className="w-4 h-4" /> Retry
                                </button>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64">
                                <Building className="w-16 h-16 text-gray-200 mb-4" />
                                <p className="text-gray-500 text-lg font-medium mb-2">No branches found</p>
                                <p className="text-gray-400 text-sm text-center mb-6">
                                    {searchTerm || statusFilter !== "all" || cityFilter !== "all"
                                        ? "Try adjusting your search filters" : "Add your first branch to get started"}
                                </p>
                                {!searchTerm && statusFilter === "all" && cityFilter === "all" && (
                                    <button onClick={openAdd} className="px-5 py-2.5 bg-gradient-to-r from-[#0A1628] to-[#1A5FA8] text-white rounded-xl text-sm font-medium">
                                        Add Branch
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {filtered.map(b => <BranchCard key={b._id} b={b} />)}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Branch Detail Side Panel ──────────────────────────────────── */}
            <div className={`fixed inset-0 z-40 overflow-hidden transition-all duration-300 ${detailBranch ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                <div className="absolute inset-0 bg-[#0A1628]/40 backdrop-blur-sm" onClick={() => setDetailBranch(null)} />
                <div className={`absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col transition-transform duration-300 ${detailBranch ? "translate-x-0" : "translate-x-full"}`}>
                    {detailBranch && (
                        <>
                            {/* Panel header */}
                            <div className="bg-gradient-to-r from-[#0A1628] to-[#1A3A5C] px-6 py-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h2 className="text-lg font-bold text-white truncate">{detailBranch.name}</h2>
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${detailBranch.active ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30" : "bg-red-400/20 text-red-300 border border-red-400/30"}`}>
                                                {detailBranch.active ? "ACTIVE" : "INACTIVE"}
                                            </span>
                                        </div>
                                        <p className="text-white/50 text-sm font-mono">{detailBranch.code}</p>
                                    </div>
                                    <button onClick={() => setDetailBranch(null)} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex-shrink-0">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Quick action buttons */}
                                <div className="mt-4 flex gap-2">
                                    <button onClick={() => openEdit(detailBranch)}
                                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00AEEF] hover:bg-[#0099D6] text-white rounded-xl text-sm font-medium transition-colors">
                                        <Edit className="w-3.5 h-3.5" /> Edit Branch
                                    </button>
                                    <button onClick={openVehiclePanel}
                                        className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors">
                                        <Car className="w-3.5 h-3.5" /> Add Vehicle
                                    </button>
                                    <button onClick={() => setBranchToDelete(detailBranch._id)}
                                        className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-sm font-medium transition-colors ml-auto">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="mt-4 flex gap-1 border-b border-white/10">
                                    {(["info", "map", "hours"] as const).map(t => (
                                        <button key={t} onClick={() => setDetailTab(t)}
                                            className={`px-4 py-2 text-sm font-medium rounded-t-xl transition-all capitalize ${detailTab === t ? "bg-white/10 text-white border-b-2 border-[#00AEEF]" : "text-white/40 hover:text-white/70"}`}>
                                            {t === "map" ? "📍 Map" : t === "hours" ? "🕐 Hours" : "ℹ️ Info"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Panel body */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {detailTab === "info" && (
                                    <div className="space-y-5">
                                        {/* Address */}
                                        <div className="bg-gray-50 rounded-2xl p-4">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Address</p>
                                            <div className="flex items-start gap-3">
                                                <div className="w-9 h-9 bg-[#00AEEF]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <MapPin className="w-4 h-4 text-[#00AEEF]" />
                                                </div>
                                                <div className="space-y-0.5 text-sm">
                                                    <p className="font-semibold text-[#0A1628]">{detailBranch.address.line1}</p>
                                                    {detailBranch.address.line2 && <p className="text-gray-500">{detailBranch.address.line2}</p>}
                                                    <p className="text-gray-500">{detailBranch.address.city}{detailBranch.address.region ? `, ${detailBranch.address.region}` : ""} {detailBranch.address.postal_code}</p>
                                                    <p className="text-gray-400 text-xs">{detailBranch.address.country}</p>
                                                </div>
                                            </div>
                                            {detailBranch.geo?.coordinates && (
                                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                                                    <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                                                    <span className="font-mono">{detailBranch.geo.coordinates[1].toFixed(5)}, {detailBranch.geo.coordinates[0].toFixed(5)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Contact */}
                                        <div className="bg-gray-50 rounded-2xl p-4">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact</p>
                                            <div className="space-y-2.5">
                                                {detailBranch.phone ? (
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                                                            <Phone className="w-3.5 h-3.5 text-blue-500" />
                                                        </div>
                                                        <span className="text-[#0A1628] font-medium">{detailBranch.phone}</span>
                                                    </div>
                                                ) : <p className="text-xs text-gray-300">No phone</p>}
                                                {detailBranch.email ? (
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
                                                            <Mail className="w-3.5 h-3.5 text-purple-500" />
                                                        </div>
                                                        <span className="text-[#0A1628] font-medium truncate">{detailBranch.email}</span>
                                                    </div>
                                                ) : <p className="text-xs text-gray-300">No email</p>}
                                            </div>
                                        </div>

                                        {/* Meta */}
                                        <div className="bg-gray-50 rounded-2xl p-4">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Details</p>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <p className="text-xs text-gray-400">Branch ID</p>
                                                    <p className="font-mono text-xs text-gray-600 break-all">{detailBranch._id}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400">Created</p>
                                                    <p className="text-[#0A1628]">{formatDate(detailBranch.createdAt)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {detailTab === "map" && (
                                    <div className="space-y-4">
                                        {detailBranch.geo?.coordinates ? (
                                            <BranchMapPicker
                                                readOnly
                                                value={{ lat: detailBranch.geo.coordinates[1], lng: detailBranch.geo.coordinates[0], address: detailBranch.address.line1 + ", " + detailBranch.address.city }}
                                                onChange={() => {}}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                                <Map className="w-12 h-12 text-gray-200 mb-3" />
                                                <p className="text-gray-400 text-sm font-medium">No location set</p>
                                                <p className="text-gray-300 text-xs mt-1">Edit the branch to add GPS coordinates</p>
                                                <button onClick={() => openEdit(detailBranch)}
                                                    className="mt-4 px-4 py-2 bg-[#00AEEF] text-white rounded-xl text-sm font-medium">
                                                    Set Location
                                                </button>
                                            </div>
                                        )}
                                        {detailBranch.geo?.coordinates && (
                                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                                                <Navigation className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-emerald-600 font-semibold">GPS Coordinates</p>
                                                    <p className="text-sm font-mono text-emerald-800">
                                                        {detailBranch.geo.coordinates[1].toFixed(6)}, {detailBranch.geo.coordinates[0].toFixed(6)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {detailTab === "hours" && (
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 rounded-2xl p-4">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Opening Hours</p>
                                            {renderHours(detailBranch.opening_hours)}
                                        </div>
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2 text-xs text-blue-600">
                                            <Clock className="w-4 h-4 flex-shrink-0" />
                                            <span>Hours are displayed in local branch time</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Add Vehicle Unit Panel ────────────────────────────────────── */}
            <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${vehiclePanel && detailBranch ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                <div className="absolute inset-0 bg-[#0A1628]/60 backdrop-blur-sm" onClick={() => setVehiclePanel(false)} />
                <div className={`absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl flex flex-col transition-transform duration-300 ${vehiclePanel ? "translate-x-0" : "translate-x-full"}`}>
                    <div className="bg-gradient-to-r from-[#0A1628] to-[#1A3A5C] px-6 py-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-white">Add Vehicle Unit</h2>
                                <p className="text-white/50 text-sm">Branch: {detailBranch?.name}</p>
                            </div>
                            <button onClick={() => setVehiclePanel(false)} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                        <Field label="Vehicle Model" required>
                            {modelsLoading ? (
                                <div className="flex items-center gap-2 py-2.5 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading models...</div>
                            ) : (
                                <select value={vehicleForm.vehicle_model_id}
                                    onChange={e => setVehicleForm(p => ({ ...p, vehicle_model_id: e.target.value }))}
                                    className={inp}>
                                    <option value="">Select vehicle model</option>
                                    {vehicleModels.map((m: any) => (
                                        <option key={m._id} value={m._id}>{m.make} {m.model} {m.year}</option>
                                    ))}
                                </select>
                            )}
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="VIN" required>
                                <input value={vehicleForm.vin} onChange={e => setVehicleForm(p => ({ ...p, vin: e.target.value }))}
                                    placeholder="Vehicle VIN" className={inp} />
                            </Field>
                            <Field label="Plate Number" required>
                                <input value={vehicleForm.plate_number} onChange={e => setVehicleForm(p => ({ ...p, plate_number: e.target.value }))}
                                    placeholder="ABC 1234" className={inp} />
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Color">
                                <input value={vehicleForm.color} onChange={e => setVehicleForm(p => ({ ...p, color: e.target.value }))}
                                    placeholder="e.g. Pearl White" className={inp} />
                            </Field>
                            <Field label="Odometer (km)">
                                <input type="number" value={vehicleForm.odometer_km} onChange={e => setVehicleForm(p => ({ ...p, odometer_km: e.target.value }))}
                                    placeholder="0" className={inp} />
                            </Field>
                        </div>

                        <div className="bg-[#00AEEF]/5 border border-[#00AEEF]/20 rounded-xl p-3 text-xs text-[#00AEEF] flex items-center gap-2">
                            <Building className="w-4 h-4 flex-shrink-0" />
                            Vehicle will be assigned to <strong>{detailBranch?.name}</strong> branch
                        </div>
                    </div>

                    <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
                        <button onClick={() => setVehiclePanel(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleAddVehicle} disabled={vehicleSaving || !vehicleForm.vin || !vehicleForm.plate_number || !vehicleForm.vehicle_model_id}
                            className="flex-1 py-2.5 bg-gradient-to-r from-[#0A1628] to-[#1A5FA8] text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                            {vehicleSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Car className="w-4 h-4" />}
                            {vehicleSaving ? "Adding..." : "Add Vehicle"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Add / Edit Branch Panel ───────────────────────────────────── */}
            <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${editMode ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                <div className="absolute inset-0 bg-[#0A1628]/60 backdrop-blur-sm" onClick={() => { setEditMode(null); setEditBranch(null); }} />
                <div className={`absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col transition-transform duration-300 ${editMode ? "translate-x-0" : "translate-x-full"}`}>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#0A1628] to-[#1A3A5C] px-6 py-5 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-white">{editMode === "edit" ? "Edit Branch" : "Add New Branch"}</h2>
                                <p className="text-white/50 text-sm">{editMode === "edit" ? "Update branch information" : "Create a new branch location"}</p>
                            </div>
                            <button onClick={() => { setEditMode(null); setEditBranch(null); }} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                        {/* Basic info */}
                        <div>
                            <p className="text-sm font-bold text-[#0A1628] mb-3 flex items-center gap-2">
                                <Hash className="w-4 h-4 text-[#00AEEF]" /> Basic Information
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Branch Name" required>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Harare City Branch" className={inp} />
                                </Field>
                                <Field label="Branch Code" required>
                                    <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="HRE-001" className={inp} />
                                </Field>
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <p className="text-sm font-bold text-[#0A1628] mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#00AEEF]" /> Address
                            </p>
                            <div className="space-y-3">
                                <Field label="Address Line 1" required>
                                    <input value={form.address.line1} onChange={e => setForm(p => ({ ...p, address: { ...p.address, line1: e.target.value } }))} placeholder="123 Main Street" className={inp} />
                                </Field>
                                <Field label="Address Line 2">
                                    <input value={form.address.line2 || ""} onChange={e => setForm(p => ({ ...p, address: { ...p.address, line2: e.target.value } }))} placeholder="Suite 100" className={inp} />
                                </Field>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="City" required>
                                        <input value={form.address.city} onChange={e => setForm(p => ({ ...p, address: { ...p.address, city: e.target.value } }))} placeholder="Harare" className={inp} />
                                    </Field>
                                    <Field label="Region">
                                        <input value={form.address.region || ""} onChange={e => setForm(p => ({ ...p, address: { ...p.address, region: e.target.value } }))} placeholder="Mashonaland East" className={inp} />
                                    </Field>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Postal Code">
                                        <input value={form.address.postal_code || ""} onChange={e => setForm(p => ({ ...p, address: { ...p.address, postal_code: e.target.value } }))} placeholder="00263" className={inp} />
                                    </Field>
                                    <Field label="Country" required>
                                        <input value={form.address.country} onChange={e => setForm(p => ({ ...p, address: { ...p.address, country: e.target.value } }))} placeholder="Zimbabwe" className={inp} />
                                    </Field>
                                </div>
                            </div>
                        </div>

                        {/* Location Picker */}
                        <div>
                            <p className="text-sm font-bold text-[#0A1628] mb-3 flex items-center gap-2">
                                <Map className="w-4 h-4 text-[#00AEEF]" /> Map Location <span className="text-xs font-normal text-gray-400">(optional)</span>
                            </p>
                            <BranchMapPicker value={formGeo} onChange={loc => setFormGeo(loc)} />
                        </div>

                        {/* Contact */}
                        <div>
                            <p className="text-sm font-bold text-[#0A1628] mb-3 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-[#00AEEF]" /> Contact
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Phone">
                                    <input type="tel" value={form.phone || ""} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+263 77 123 4567" className={inp} />
                                </Field>
                                <Field label="Email">
                                    <input type="email" value={form.email || ""} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="branch@morental.co.zw" className={inp} />
                                </Field>
                            </div>
                        </div>

                        {/* Opening Hours */}
                        <div>
                            <p className="text-sm font-bold text-[#0A1628] mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#00AEEF]" /> Opening Hours
                            </p>
                            <div className="space-y-2">
                                {DAYS.map(day => {
                                    const slots: IOpeningHourSlot[] = (form.opening_hours as any)?.[day.key] || [];
                                    return (
                                        <div key={day.key} className="border border-gray-100 rounded-xl p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-semibold text-[#0A1628]">{day.label}</span>
                                                <button type="button" onClick={() => addSlot(day.key)}
                                                    className="text-xs text-[#00AEEF] hover:text-[#0099D6] font-medium">+ Add slot</button>
                                            </div>
                                            {slots.length === 0 ? (
                                                <p className="text-xs text-gray-300 italic">Closed</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {slots.map((s, i) => (
                                                        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                                                            <div className="flex gap-2 flex-1">
                                                                <input type="time" value={s.open} onChange={e => handleOpenHoursChange(day.key, i, "open", e.target.value)}
                                                                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00AEEF]" />
                                                                <span className="text-gray-300 self-center">–</span>
                                                                <input type="time" value={s.close} onChange={e => handleOpenHoursChange(day.key, i, "close", e.target.value)}
                                                                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00AEEF]" />
                                                            </div>
                                                            <button type="button" onClick={() => removeSlot(day.key, i)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                                                                <XCircle className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                            <div>
                                <p className="text-sm font-semibold text-[#0A1628]">Branch Status</p>
                                <p className="text-xs text-gray-400 mt-0.5">{form.active ? "Branch is active and visible to customers" : "Branch is inactive and hidden"}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#00AEEF] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                            </label>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 px-6 py-4 flex gap-3 flex-shrink-0">
                        <button onClick={() => { setEditMode(null); setEditBranch(null); }}
                            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={saving || !form.name || !form.code || !form.address.line1 || !form.address.city}
                            className="flex-1 py-2.5 bg-gradient-to-r from-[#0A1628] to-[#1A5FA8] text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? "Saving..." : editMode === "edit" ? "Update Branch" : "Create Branch"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Delete Confirmation ───────────────────────────────────────── */}
            {branchToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBranchToDelete(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="font-bold text-[#0A1628]">Delete Branch</p>
                                <p className="text-sm text-gray-400">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this branch? All associated data will be permanently removed.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setBranchToDelete(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Snackbar ──────────────────────────────────────────────────── */}
            {snackbar.show && (
                <div className="fixed bottom-5 right-5 z-[70] animate-in slide-in-from-bottom-2 duration-300">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl min-w-[280px] border ${snackbar.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : snackbar.type === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-blue-50 border-blue-200 text-blue-800"}`}>
                        {snackbar.type === "success" ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                        <p className="text-sm font-medium flex-1">{snackbar.message}</p>
                        <button onClick={() => setSnackbar(p => ({ ...p, show: false }))} className="opacity-60 hover:opacity-100">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchManagementScreen;
