import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../helpers/supa_base_client";
import Sidebar from "../../../components/Sidebar";
import { BranchMapPicker, type BranchLocation } from "../../../components/BranchMapPicker";
import {
    fetchBranches, updateBranch, deleteBranch, getBranchErrorDisplay,
    type IBranch, type UpdateBranchPayload,
    type IOpeningHourSlot, type OpeningHours, type DayKey,
    type CreateBranchPayload,
} from "../../../Services/adminAndManager/admin_branch_service";
import {
    createVehicleUnit, type CreateVehiclePayload,
    type VehicleStatus, type AvailabilityState,
} from "../../../Services/adminAndManager/vehicle_units_services";
import { fetchVehicleModels } from "../../../Services/adminAndManager/vehicle_model_service";
import {
    ArrowLeft, Edit, Trash2, Car, MapPin, Phone, Mail, Clock, Building,
    Navigation, Plus, X, Save, AlertCircle, CheckCircle, Loader2,
    XCircle, Hash, Map, RefreshCw, Upload, Image, MoreVertical,
    Palette, Gauge, Users, DoorOpen, Settings, Shield, ChevronDown,
} from "lucide-react";


const sanitizeFilename = (n: string) => n.replace(/[^a-zA-Z0-9.\-_]/g, "_");

const uploadFileToSupabase = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}_${sanitizeFilename(file.name)}`;
    const { error } = await supabase.storage.from("topics").upload(fileName, file, {
        cacheControl: "3600", upsert: false, contentType: file.type,
    });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("topics").getPublicUrl(fileName);
    if (!data?.publicUrl) throw new Error("Failed to get public URL");
    return data.publicUrl;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_OPTIONS: VehicleStatus[] = ["active", "inactive", "pending"];
const AVAILABILITY_OPTIONS: AvailabilityState[] = ["available", "reserved", "rented", "out_of_service"];
const COLOR_OPTIONS = [
    "Black", "White", "Silver", "Gray", "Red", "Blue", "Green", "Yellow",
    "Orange", "Purple", "Brown", "Beige", "Gold", "Navy", "Burgundy", "Teal",
];
const FEATURE_OPTIONS = [
    "GPS Tracking", "Bluetooth Audio", "Backup Camera", "Parking Sensors", "Sunroof",
    "Leather Seats", "Heated Seats", "Navigation System", "Keyless Entry", "Remote Start",
    "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning",
    "Adaptive Cruise Control", "Premium Sound System", "Third Row Seating",
    "Towing Package", "All-Wheel Drive", "Four-Wheel Drive",
];
const DAYS: { key: DayKey; label: string; short: string }[] = [
    { key: "mon", label: "Monday", short: "Mon" },
    { key: "tue", label: "Tuesday", short: "Tue" },
    { key: "wed", label: "Wednesday", short: "Wed" },
    { key: "thu", label: "Thursday", short: "Thu" },
    { key: "fri", label: "Friday", short: "Fri" },
    { key: "sat", label: "Saturday", short: "Sat" },
    { key: "sun", label: "Sunday", short: "Sun" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (s?: string) =>
    s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "N/A";

const inp = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all bg-white";
const inpSm = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all bg-white";

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

// ── Add Vehicle Form defaults ─────────────────────────────────────────────────
const INIT_VEHICLE: CreateVehiclePayload = {
    vin: "", plate_number: "", vehicle_model_id: "", branch_id: "",
    odometer_km: 0, color: "White", status: "active", availability_state: "available",
    photos: [],
    metadata: { gps_device_id: "", notes: "", seats: 5, doors: 4, features: [] },
};

// ── Edit Branch Form defaults ─────────────────────────────────────────────────
const INIT_BRANCH_FORM: CreateBranchPayload = {
    name: "", code: "",
    address: { line1: "", line2: "", city: "", region: "", postal_code: "", country: "Zimbabwe" },
    phone: "", email: "", imageLoc: "", active: true, opening_hours: {},
};

// ─────────────────────────────────────────────────────────────────────────────
const BranchDetailPage: React.FC = () => {
    const { branchId } = useParams<{ branchId: string }>();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [branch, setBranch] = useState<IBranch | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"info" | "map" | "hours">("info");

    // Edit branch panel
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState<CreateBranchPayload>(INIT_BRANCH_FORM);
    const [editGeo, setEditGeo] = useState<BranchLocation | null>(null);
    const [saving, setSaving] = useState(false);

    // Add vehicle panel
    const [vehicleOpen, setVehicleOpen] = useState(false);
    const [vehicleForm, setVehicleForm] = useState<CreateVehiclePayload>(INIT_VEHICLE);
    const [vehicleModels, setVehicleModels] = useState<any[]>([]);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [vehicleSaving, setVehicleSaving] = useState(false);

    // Photo upload
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Delete confirm
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Snackbar
    const [snackbar, setSnackbar] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({
        show: false, message: "", type: "info",
    });
    const showSnackbar = (message: string, type: "success" | "error" | "info") => {
        setSnackbar({ show: true, message, type });
        setTimeout(() => setSnackbar(p => ({ ...p, show: false })), 3500);
    };

    // ── Load branch ──
    const loadBranch = useCallback(async () => {
        if (!branchId) return;
        setLoading(true); setError(null);
        try {
            const r = await fetchBranches();
            const found = (r.data as IBranch[]).find(b => b._id === branchId);
            if (!found) { setError("Branch not found"); return; }
            setBranch(found);
        } catch {
            setError("Failed to load branch details");
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => { loadBranch(); }, [loadBranch]);

    // ── Load vehicle models ──
    const loadModels = async () => {
        if (vehicleModels.length > 0) return;
        setModelsLoading(true);
        try {
            const r = await fetchVehicleModels();
            setVehicleModels(r.data?.items || r.data || []);
        } catch { /* silent */ } finally { setModelsLoading(false); }
    };

    // ── Open edit panel ──
    const openEdit = () => {
        if (!branch) return;
        setEditForm({
            name: branch.name, code: branch.code,
            address: { ...branch.address },
            phone: branch.phone || "", email: branch.email || "",
            imageLoc: branch.imageLoc || "", active: branch.active ?? true,
            opening_hours: branch.opening_hours || {},
        });
        setEditGeo(branch.geo?.coordinates
            ? { lat: branch.geo.coordinates[1], lng: branch.geo.coordinates[0] }
            : null
        );
        setEditOpen(true);
    };

    // ── Save edit ──
    const handleSaveBranch = async () => {
        if (!branch) return;
        setSaving(true);
        try {
            const payload: UpdateBranchPayload = {
                ...editForm,
                geo: editGeo?.lat && editGeo?.lng
                    ? { type: "Point", coordinates: [editGeo.lng, editGeo.lat] }
                    : undefined,
            };
            await updateBranch(branch._id, payload);
            showSnackbar("Branch updated successfully", "success");
            setEditOpen(false);
            await loadBranch();
        } catch (err) {
            showSnackbar(getBranchErrorDisplay(err).message, "error");
        } finally { setSaving(false); }
    };

    // ── Delete ──
    const handleDelete = async () => {
        if (!branch) return;
        setDeleting(true);
        try {
            await deleteBranch(branch._id);
            showSnackbar("Branch deleted", "success");
            setTimeout(() => navigate("/admin-branches"), 1200);
        } catch (err) {
            showSnackbar(getBranchErrorDisplay(err).message, "error");
        } finally { setDeleting(false); setDeleteOpen(false); }
    };

    // ── Open vehicle panel ──
    const openVehiclePanel = () => {
        if (!branch) return;
        setVehicleForm({ ...INIT_VEHICLE, branch_id: branch._id });
        setPhotoFiles([]);
        setPhotoPreviews([]);
        setUploadProgress(0);
        setVehicleOpen(true);
        loadModels();
    };

    // ── Photo file selection ──
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            if (!file.type.startsWith("image/")) { showSnackbar(`${file.name}: not an image`, "error"); return; }
            if (file.size > 5 * 1024 * 1024) { showSnackbar(`${file.name}: exceeds 5MB`, "error"); return; }
            setPhotoFiles(p => [...p, file]);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreviews(p => [...p, reader.result as string]);
            reader.readAsDataURL(file);
        });
        e.target.value = "";
    };

    const removePhoto = (idx: number) => {
        setPhotoFiles(p => p.filter((_, i) => i !== idx));
        setPhotoPreviews(p => p.filter((_, i) => i !== idx));
    };

    // ── Drag/drop ──
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => {
            if (!file.type.startsWith("image/")) return;
            if (file.size > 5 * 1024 * 1024) return;
            setPhotoFiles(p => [...p, file]);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreviews(p => [...p, reader.result as string]);
            reader.readAsDataURL(file);
        });
    };

    // ── Submit vehicle ──
    const handleAddVehicle = async () => {
        if (!vehicleForm.vin || !vehicleForm.plate_number || !vehicleForm.vehicle_model_id) return;
        setVehicleSaving(true);
        try {
            let uploadedUrls: string[] = [];
            if (photoFiles.length > 0) {
                setIsUploading(true);
                for (let i = 0; i < photoFiles.length; i++) {
                    const url = await uploadFileToSupabase(photoFiles[i]);
                    uploadedUrls.push(url);
                    setUploadProgress(Math.round(((i + 1) / photoFiles.length) * 100));
                }
                setIsUploading(false);
            }
            await createVehicleUnit({ ...vehicleForm, photos: uploadedUrls });
            showSnackbar("Vehicle added to branch", "success");
            setVehicleOpen(false);
        } catch (err: any) {
            setIsUploading(false);
            showSnackbar(err?.message || "Failed to add vehicle", "error");
        } finally { setVehicleSaving(false); }
    };

    // ── Opening hours helpers ──
    const handleHoursChange = (day: DayKey, idx: number, field: "open" | "close", val: string) => {
        setEditForm(p => {
            const hrs = { ...p.opening_hours } as OpeningHours;
            const slots = [...(hrs[day] || [])];
            slots[idx] = { ...slots[idx], [field]: val };
            return { ...p, opening_hours: { ...hrs, [day]: slots } };
        });
    };
    const addSlot = (day: DayKey) => {
        setEditForm(p => {
            const hrs = { ...p.opening_hours } as OpeningHours;
            return { ...p, opening_hours: { ...hrs, [day]: [...(hrs[day] || []), { open: "08:00", close: "17:00" }] } };
        });
    };
    const removeSlot = (day: DayKey, idx: number) => {
        setEditForm(p => {
            const hrs = { ...p.opening_hours } as OpeningHours;
            const slots = (hrs[day] || []).filter((_, i) => i !== idx);
            return { ...p, opening_hours: { ...hrs, [day]: slots.length > 0 ? slots : undefined as any } };
        });
    };

    // ── Render hours ──
    const renderHours = (hours?: OpeningHours) => {
        if (!hours || Object.keys(hours).length === 0)
            return <p className="text-gray-400 text-sm italic">No hours specified</p>;
        return (
            <div className="space-y-2">
                {DAYS.map(d => {
                    const slots = (hours as any)[d.key] as IOpeningHourSlot[] | undefined;
                    return (
                        <div key={d.key} className="flex items-center gap-3">
                            <span className={`w-10 text-xs font-bold uppercase ${slots?.length ? "text-[#0A1628]" : "text-gray-300"}`}>{d.short}</span>
                            {slots?.length ? (
                                <div className="flex flex-wrap gap-2">
                                    {slots.map((s, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-[#00AEEF]/10 text-[#00AEEF] rounded-lg text-xs font-medium">
                                            {s.open}–{s.close}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-xs text-gray-300 italic">Closed</span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-[#00AEEF] animate-spin" />
                        <p className="text-gray-500 text-sm">Loading branch details…</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !branch) {
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <AlertCircle className="w-12 h-12 text-red-400" />
                        <p className="text-red-600">{error || "Branch not found"}</p>
                        <button onClick={() => navigate("/admin-branches")}
                            className="flex items-center gap-2 px-4 py-2 bg-[#0A1628] text-white rounded-xl text-sm">
                            <ArrowLeft className="w-4 h-4" /> Back to Branches
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const hasGeo = Boolean(branch.geo?.coordinates?.length);

    return (
        <div className="flex h-screen bg-[#F0F6FF] font-sans overflow-hidden">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* ── Top Bar ── */}
                <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-6 py-4 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100">
                                <MoreVertical className="w-5 h-5 text-gray-600" />
                            </button>
                            <button onClick={() => navigate("/admin-branches")}
                                className="flex items-center gap-2 p-2 text-gray-500 hover:text-[#0A1628] hover:bg-gray-100 rounded-xl transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="text-sm font-medium hidden sm:inline">Branches</span>
                            </button>
                            <div className="w-px h-5 bg-gray-200" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-[#0A1628]">{branch.name}</h1>
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${branch.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                                        {branch.active ? "ACTIVE" : "INACTIVE"}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">{branch.code}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={loadBranch}
                                className="p-2.5 text-gray-500 hover:text-[#00AEEF] hover:bg-[#00AEEF]/10 rounded-xl border border-gray-100 transition-colors">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button onClick={openVehiclePanel}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#00AEEF] hover:bg-[#0099D6] text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                                <Car className="w-4 h-4" /> Add Vehicle
                            </button>
                            <button onClick={openEdit}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0A1628] to-[#1A5FA8] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-sm">
                                <Edit className="w-4 h-4" /> Edit Branch
                            </button>
                            <button onClick={() => setDeleteOpen(true)}
                                className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-100 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="bg-white border-b border-gray-100 px-6">
                    <div className="flex gap-1">
                        {(["info", "map", "hours"] as const).map(t => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className={`px-5 py-3.5 text-sm font-medium transition-all border-b-2 -mb-px capitalize ${activeTab === t
                                    ? "text-[#00AEEF] border-[#00AEEF]"
                                    : "text-gray-400 border-transparent hover:text-gray-600"}`}>
                                {t === "info" ? "Branch Info" : t === "map" ? "Map & Location" : "Opening Hours"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* ── INFO TAB ── */}
                    {activeTab === "info" && (
                        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Branch Hero Card */}
                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="h-2 bg-gradient-to-r from-[#0A1628] to-[#00AEEF]" />
                                <div className="p-6 flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0A1628] to-[#1A5FA8] flex items-center justify-center flex-shrink-0 shadow-lg">
                                        <Building className="w-9 h-9 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-2xl font-bold text-[#0A1628]">{branch.name}</h2>
                                        <p className="text-sm text-gray-400 font-mono mt-0.5">#{branch.code}</p>
                                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                                            {branch.phone && (
                                                <a href={`tel:${branch.phone}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#00AEEF] transition-colors">
                                                    <Phone className="w-3.5 h-3.5" /> {branch.phone}
                                                </a>
                                            )}
                                            {branch.email && (
                                                <a href={`mailto:${branch.email}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#00AEEF] transition-colors">
                                                    <Mail className="w-3.5 h-3.5" /> {branch.email}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 hidden sm:block">
                                        <p className="text-xs text-gray-400">Created</p>
                                        <p className="text-sm font-medium text-[#0A1628] mt-0.5">{fmtDate(branch.createdAt)}</p>
                                        {branch.updatedAt && (
                                            <>
                                                <p className="text-xs text-gray-400 mt-2">Last Updated</p>
                                                <p className="text-sm font-medium text-[#0A1628] mt-0.5">{fmtDate(branch.updatedAt)}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Address Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-[#00AEEF]/10 flex items-center justify-center">
                                        <MapPin className="w-4 h-4 text-[#00AEEF]" />
                                    </div>
                                    <h3 className="text-sm font-bold text-[#0A1628] uppercase tracking-wider">Address</h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <p className="font-semibold text-[#0A1628]">{branch.address.line1}</p>
                                    {branch.address.line2 && <p className="text-gray-500">{branch.address.line2}</p>}
                                    <p className="text-gray-600">{branch.address.city}{branch.address.region ? `, ${branch.address.region}` : ""}</p>
                                    {branch.address.postal_code && <p className="text-gray-500">{branch.address.postal_code}</p>}
                                    <p className="text-gray-400 text-xs font-medium uppercase">{branch.address.country}</p>
                                </div>
                                {hasGeo && (
                                    <div className="mt-4 pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">
                                            <Navigation className="w-3.5 h-3.5" />
                                            <span className="font-mono">
                                                {branch.geo!.coordinates[1].toFixed(6)}, {branch.geo!.coordinates[0].toFixed(6)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Contact & Status */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                                        <Hash className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <h3 className="text-sm font-bold text-[#0A1628] uppercase tracking-wider">Details</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400">Status</span>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${branch.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                                            {branch.active ? "ACTIVE" : "INACTIVE"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400">Branch Code</span>
                                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded-lg text-gray-700">{branch.code}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400">GPS Location</span>
                                        <span className={`text-xs font-medium ${hasGeo ? "text-emerald-600" : "text-gray-400"}`}>
                                            {hasGeo ? "Set" : "Not Set"}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-50">
                                        <p className="text-xs text-gray-400 mb-1">Branch ID</p>
                                        <p className="text-xs font-mono text-gray-500 break-all">{branch._id}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Opening Hours preview */}
                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                                            <Clock className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <h3 className="text-sm font-bold text-[#0A1628] uppercase tracking-wider">Opening Hours</h3>
                                    </div>
                                    <button onClick={() => setActiveTab("hours")}
                                        className="text-xs text-[#00AEEF] hover:underline font-medium">View full →</button>
                                </div>
                                {renderHours(branch.opening_hours)}
                            </div>
                        </div>
                    )}

                    {/* ── MAP TAB ── */}
                    {activeTab === "map" && (
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-5 border-b border-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Map className="w-5 h-5 text-[#00AEEF]" />
                                            <h3 className="font-bold text-[#0A1628]">Branch Location</h3>
                                        </div>
                                        {!hasGeo && (
                                            <button onClick={openEdit}
                                                className="text-xs text-[#00AEEF] hover:underline font-medium">Set Location →</button>
                                        )}
                                    </div>
                                </div>
                                <div className="p-5">
                                    {hasGeo ? (
                                        <BranchMapPicker
                                            readOnly
                                            value={{
                                                lat: branch.geo!.coordinates[1],
                                                lng: branch.geo!.coordinates[0],
                                                address: `${branch.address.line1}, ${branch.address.city}`,
                                            }}
                                            onChange={() => {}}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                            <Map className="w-14 h-14 text-gray-200 mb-4" />
                                            <p className="text-gray-400 font-medium">No location set for this branch</p>
                                            <p className="text-gray-300 text-sm mt-1 mb-5">Edit the branch to add GPS coordinates</p>
                                            <button onClick={openEdit}
                                                className="px-5 py-2.5 bg-gradient-to-r from-[#0A1628] to-[#1A5FA8] text-white rounded-xl text-sm font-medium">
                                                Set Location
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {hasGeo && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                    <h4 className="text-sm font-bold text-[#0A1628] mb-3">GPS Coordinates</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <p className="text-xs text-gray-400 mb-1">Latitude</p>
                                            <p className="font-mono text-sm font-bold text-[#0A1628]">{branch.geo!.coordinates[1].toFixed(7)}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <p className="text-xs text-gray-400 mb-1">Longitude</p>
                                            <p className="font-mono text-sm font-bold text-[#0A1628]">{branch.geo!.coordinates[0].toFixed(7)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── HOURS TAB ── */}
                    {activeTab === "hours" && (
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-amber-500" />
                                        <h3 className="font-bold text-[#0A1628]">Operating Hours</h3>
                                    </div>
                                    <button onClick={openEdit}
                                        className="flex items-center gap-1.5 text-xs text-[#00AEEF] hover:underline font-medium">
                                        <Edit className="w-3.5 h-3.5" /> Edit
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {DAYS.map(d => {
                                        const slots = (branch.opening_hours as any)?.[d.key] as IOpeningHourSlot[] | undefined;
                                        return (
                                            <div key={d.key} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                                                <span className="w-24 text-sm font-semibold text-[#0A1628]">{d.label}</span>
                                                {slots?.length ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {slots.map((s, i) => (
                                                            <span key={i} className="px-3 py-1 bg-[#00AEEF]/10 text-[#00AEEF] rounded-lg text-xs font-medium">
                                                                {s.open} – {s.close}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-300 italic">Closed</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2 text-xs text-blue-600">
                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                    All times are in local branch time (Zimbabwe CAT, UTC+2)
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                EDIT BRANCH SIDE PANEL
            ══════════════════════════════════════════════════════════════════ */}
            <div className={`fixed inset-0 z-40 overflow-hidden transition-all duration-300 ${editOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                <div className="absolute inset-0 bg-[#0A1628]/50 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
                <div className={`absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col transition-transform duration-300 ${editOpen ? "translate-x-0" : "translate-x-full"}`}>
                    <div className="bg-gradient-to-r from-[#0A1628] to-[#1A3A5C] px-6 py-5 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-white">Edit Branch</h2>
                                <p className="text-white/50 text-sm">Update branch information and location</p>
                            </div>
                            <button onClick={() => setEditOpen(false)} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                        {/* Basic info */}
                        <div>
                            <p className="text-sm font-bold text-[#0A1628] mb-3 flex items-center gap-2">
                                <Hash className="w-4 h-4 text-[#00AEEF]" /> Basic Information
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Branch Name" required>
                                    <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Harare City Branch" className={inp} />
                                </Field>
                                <Field label="Branch Code" required>
                                    <input value={editForm.code} onChange={e => setEditForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                        placeholder="HRE-001" className={inp} />
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
                                    <input value={editForm.address.line1}
                                        onChange={e => setEditForm(p => ({ ...p, address: { ...p.address, line1: e.target.value } }))}
                                        placeholder="123 Main Street" className={inp} />
                                </Field>
                                <Field label="Address Line 2">
                                    <input value={editForm.address.line2 || ""}
                                        onChange={e => setEditForm(p => ({ ...p, address: { ...p.address, line2: e.target.value } }))}
                                        placeholder="Suite 100" className={inp} />
                                </Field>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="City" required>
                                        <input value={editForm.address.city}
                                            onChange={e => setEditForm(p => ({ ...p, address: { ...p.address, city: e.target.value } }))}
                                            placeholder="Harare" className={inp} />
                                    </Field>
                                    <Field label="Region">
                                        <input value={editForm.address.region || ""}
                                            onChange={e => setEditForm(p => ({ ...p, address: { ...p.address, region: e.target.value } }))}
                                            placeholder="Mashonaland East" className={inp} />
                                    </Field>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Postal Code">
                                        <input value={editForm.address.postal_code || ""}
                                            onChange={e => setEditForm(p => ({ ...p, address: { ...p.address, postal_code: e.target.value } }))}
                                            placeholder="00263" className={inp} />
                                    </Field>
                                    <Field label="Country" required>
                                        <input value={editForm.address.country}
                                            onChange={e => setEditForm(p => ({ ...p, address: { ...p.address, country: e.target.value } }))}
                                            placeholder="Zimbabwe" className={inp} />
                                    </Field>
                                </div>
                            </div>
                        </div>

                        {/* Map Location Picker */}
                        <div>
                            <p className="text-sm font-bold text-[#0A1628] mb-3 flex items-center gap-2">
                                <Map className="w-4 h-4 text-[#00AEEF]" /> Map Location
                                <span className="text-xs font-normal text-gray-400">(optional)</span>
                            </p>
                            <BranchMapPicker value={editGeo} onChange={loc => setEditGeo(loc)} />
                        </div>

                        {/* Contact */}
                        <div>
                            <p className="text-sm font-bold text-[#0A1628] mb-3 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-[#00AEEF]" /> Contact
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Phone">
                                    <input type="tel" value={editForm.phone || ""}
                                        onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                                        placeholder="+263 77 123 4567" className={inp} />
                                </Field>
                                <Field label="Email">
                                    <input type="email" value={editForm.email || ""}
                                        onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                                        placeholder="branch@morental.co.zw" className={inp} />
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
                                    const slots: IOpeningHourSlot[] = (editForm.opening_hours as any)?.[day.key] || [];
                                    return (
                                        <div key={day.key} className="border border-gray-100 rounded-xl p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-semibold text-[#0A1628]">{day.label}</span>
                                                <button type="button" onClick={() => addSlot(day.key)}
                                                    className="text-xs text-[#00AEEF] hover:text-[#0099D6] font-medium">
                                                    + Add slot
                                                </button>
                                            </div>
                                            {slots.length === 0 ? (
                                                <p className="text-xs text-gray-300 italic">Closed</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {slots.map((s, i) => (
                                                        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                                                            <div className="flex gap-2 flex-1">
                                                                <input type="time" value={s.open}
                                                                    onChange={e => handleHoursChange(day.key, i, "open", e.target.value)}
                                                                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00AEEF]" />
                                                                <span className="text-gray-300 self-center">–</span>
                                                                <input type="time" value={s.close}
                                                                    onChange={e => handleHoursChange(day.key, i, "close", e.target.value)}
                                                                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00AEEF]" />
                                                            </div>
                                                            <button type="button" onClick={() => removeSlot(day.key, i)}
                                                                className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
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

                        {/* Status toggle */}
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                            <div>
                                <p className="text-sm font-semibold text-[#0A1628]">Branch Status</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {editForm.active ? "Branch is active and visible to customers" : "Branch is inactive and hidden"}
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={editForm.active}
                                    onChange={e => setEditForm(p => ({ ...p, active: e.target.checked }))}
                                    className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#00AEEF] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                            </label>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 px-6 py-4 flex gap-3 flex-shrink-0">
                        <button onClick={() => setEditOpen(false)}
                            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSaveBranch}
                            disabled={saving || !editForm.name || !editForm.code || !editForm.address.line1 || !editForm.address.city}
                            className="flex-1 py-2.5 bg-gradient-to-r from-[#0A1628] to-[#1A5FA8] text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? "Saving…" : "Update Branch"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                ADD VEHICLE SIDE MODAL (large)
            ══════════════════════════════════════════════════════════════════ */}
            <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${vehicleOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                <div className="absolute inset-0 bg-[#0A1628]/60 backdrop-blur-sm" onClick={() => setVehicleOpen(false)} />
                <div className={`absolute inset-y-0 right-0 w-full max-w-4xl bg-white shadow-2xl flex flex-col transition-transform duration-300 ${vehicleOpen ? "translate-x-0" : "translate-x-full"}`}>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#0A1628] to-[#1A3A5C] px-8 py-6 flex-shrink-0">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-9 h-9 rounded-xl bg-[#00AEEF]/20 flex items-center justify-center">
                                        <Car className="w-5 h-5 text-[#00AEEF]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Add Vehicle Unit</h2>
                                </div>
                                <p className="text-white/50 text-sm ml-12">Adding to branch: <span className="text-white/70 font-medium">{branch.name}</span></p>
                            </div>
                            <button onClick={() => setVehicleOpen(false)}
                                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors mt-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Form Body */}
                    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
                        {/* ── Section 1: Core Identity ── */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-5 rounded-full bg-[#00AEEF]" />
                                <h3 className="text-sm font-bold text-[#0A1628] uppercase tracking-wider">Core Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Vehicle Model" required>
                                    {modelsLoading ? (
                                        <div className="flex items-center gap-2 py-3 text-gray-400 text-sm">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Loading models…
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <select value={vehicleForm.vehicle_model_id}
                                                onChange={e => setVehicleForm(p => ({ ...p, vehicle_model_id: e.target.value }))}
                                                className={inp + " appearance-none pr-9"}>
                                                <option value="">Select vehicle model</option>
                                                {vehicleModels.map((m: any) => (
                                                    <option key={m._id} value={m._id}>{m.make} {m.model} ({m.year})</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    )}
                                </Field>
                                <Field label="Assigned Branch">
                                    <input value={branch.name} disabled
                                        className={inp + " bg-gray-50 text-gray-500 cursor-not-allowed"} />
                                </Field>
                                <Field label="VIN (Vehicle ID Number)" required>
                                    <input value={vehicleForm.vin}
                                        onChange={e => setVehicleForm(p => ({ ...p, vin: e.target.value }))}
                                        placeholder="e.g. 1HGCM82633A004352" className={inp} />
                                </Field>
                                <Field label="Plate Number" required>
                                    <input value={vehicleForm.plate_number}
                                        onChange={e => setVehicleForm(p => ({ ...p, plate_number: e.target.value }))}
                                        placeholder="e.g. ABC 1234" className={inp} />
                                </Field>
                            </div>
                        </div>

                        {/* ── Section 2: Specifications ── */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-5 rounded-full bg-[#00AEEF]" />
                                <h3 className="text-sm font-bold text-[#0A1628] uppercase tracking-wider">Specifications</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Field label="Color">
                                    <div className="relative">
                                        <select value={vehicleForm.color}
                                            onChange={e => setVehicleForm(p => ({ ...p, color: e.target.value }))}
                                            className={inp + " appearance-none pr-9"}>
                                            <option value="">Select color</option>
                                            {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </Field>
                                <Field label="Odometer (km)">
                                    <input type="number" min="0" value={vehicleForm.odometer_km}
                                        onChange={e => setVehicleForm(p => ({ ...p, odometer_km: Number(e.target.value) }))}
                                        placeholder="0" className={inp} />
                                </Field>
                                <Field label="Seats">
                                    <input type="number" min="1" max="20"
                                        value={vehicleForm.metadata?.seats ?? 5}
                                        onChange={e => setVehicleForm(p => ({ ...p, metadata: { ...p.metadata!, seats: Number(e.target.value) } }))}
                                        className={inp} />
                                </Field>
                                <Field label="Doors">
                                    <input type="number" min="2" max="6"
                                        value={vehicleForm.metadata?.doors ?? 4}
                                        onChange={e => setVehicleForm(p => ({ ...p, metadata: { ...p.metadata!, doors: Number(e.target.value) } }))}
                                        className={inp} />
                                </Field>
                            </div>
                        </div>

                        {/* ── Section 3: Status & Availability ── */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-5 rounded-full bg-[#00AEEF]" />
                                <h3 className="text-sm font-bold text-[#0A1628] uppercase tracking-wider">Status & Availability</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Vehicle Status">
                                    <div className="relative">
                                        <select value={vehicleForm.status}
                                            onChange={e => setVehicleForm(p => ({ ...p, status: e.target.value as VehicleStatus }))}
                                            className={inp + " appearance-none pr-9"}>
                                            {STATUS_OPTIONS.map(s => (
                                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </Field>
                                <Field label="Availability State">
                                    <div className="relative">
                                        <select value={vehicleForm.availability_state}
                                            onChange={e => setVehicleForm(p => ({ ...p, availability_state: e.target.value as AvailabilityState }))}
                                            className={inp + " appearance-none pr-9"}>
                                            {AVAILABILITY_OPTIONS.map(a => (
                                                <option key={a} value={a}>{a.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </Field>
                            </div>
                        </div>

                        {/* ── Section 4: Features ── */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-5 rounded-full bg-[#00AEEF]" />
                                <h3 className="text-sm font-bold text-[#0A1628] uppercase tracking-wider">Features & Amenities</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {FEATURE_OPTIONS.map(feat => {
                                    const selected = (vehicleForm.metadata?.features || []).includes(feat);
                                    return (
                                        <button key={feat} type="button"
                                            onClick={() => setVehicleForm(p => {
                                                const cur = p.metadata?.features || [];
                                                return {
                                                    ...p,
                                                    metadata: {
                                                        ...p.metadata!,
                                                        features: selected ? cur.filter(f => f !== feat) : [...cur, feat],
                                                    },
                                                };
                                            })}
                                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${selected
                                                ? "bg-[#00AEEF] text-white shadow-sm"
                                                : "bg-gray-50 text-gray-600 hover:bg-[#00AEEF]/10 hover:text-[#00AEEF]"}`}>
                                            {feat}
                                        </button>
                                    );
                                })}
                            </div>
                            {(vehicleForm.metadata?.features || []).length > 0 && (
                                <p className="text-xs text-gray-400 mt-2">
                                    {(vehicleForm.metadata?.features || []).length} feature{(vehicleForm.metadata?.features || []).length !== 1 ? "s" : ""} selected
                                </p>
                            )}
                        </div>

                        {/* ── Section 5: Metadata ── */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-5 rounded-full bg-[#00AEEF]" />
                                <h3 className="text-sm font-bold text-[#0A1628] uppercase tracking-wider">Additional Info</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="GPS Device ID">
                                    <input value={vehicleForm.metadata?.gps_device_id || ""}
                                        onChange={e => setVehicleForm(p => ({ ...p, metadata: { ...p.metadata!, gps_device_id: e.target.value } }))}
                                        placeholder="e.g. GPS-001" className={inp} />
                                </Field>
                                <div className="md:col-span-1" />
                                <div className="md:col-span-2">
                                    <Field label="Notes">
                                        <textarea value={vehicleForm.metadata?.notes || ""}
                                            onChange={e => setVehicleForm(p => ({ ...p, metadata: { ...p.metadata!, notes: e.target.value } }))}
                                            placeholder="Any additional notes about this vehicle…"
                                            rows={3}
                                            className={inp + " resize-none"} />
                                    </Field>
                                </div>
                            </div>
                        </div>

                        {/* ── Section 6: Photos ── */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-5 rounded-full bg-[#00AEEF]" />
                                <h3 className="text-sm font-bold text-[#0A1628] uppercase tracking-wider">Vehicle Photos</h3>
                            </div>

                            {/* Drop Zone */}
                            <div
                                onDragOver={e => e.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-200 hover:border-[#00AEEF] rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-[#00AEEF]/5 group">
                                <div className="w-14 h-14 rounded-2xl bg-gray-100 group-hover:bg-[#00AEEF]/10 flex items-center justify-center mx-auto mb-3 transition-colors">
                                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#00AEEF] transition-colors" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600 group-hover:text-[#0A1628] transition-colors">
                                    Click to upload or drag & drop
                                </p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB each</p>
                                <input ref={fileInputRef} type="file" multiple accept="image/*"
                                    onChange={handleFileSelect} className="hidden" />
                            </div>

                            {/* Preview Grid */}
                            {photoPreviews.length > 0 && (
                                <div className="mt-4 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {photoPreviews.map((src, idx) => (
                                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                            <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button onClick={() => removePhoto(idx)}
                                                    className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-md">
                                                {idx + 1}
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-[#00AEEF] flex flex-col items-center justify-center text-gray-300 hover:text-[#00AEEF] transition-all">
                                        <Plus className="w-6 h-6" />
                                        <span className="text-xs mt-1">Add</span>
                                    </button>
                                </div>
                            )}

                            {/* Upload Progress */}
                            {isUploading && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs text-gray-500">Uploading photos…</span>
                                        <span className="text-xs font-bold text-[#00AEEF]">{uploadProgress}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#00AEEF] rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 px-8 py-5 flex gap-3 flex-shrink-0 bg-white">
                        <button onClick={() => setVehicleOpen(false)}
                            className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleAddVehicle}
                            disabled={vehicleSaving || isUploading || !vehicleForm.vin || !vehicleForm.plate_number || !vehicleForm.vehicle_model_id}
                            className="flex-[2] py-3 bg-gradient-to-r from-[#0A1628] to-[#1A5FA8] text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm">
                            {vehicleSaving || isUploading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> {isUploading ? `Uploading ${uploadProgress}%…` : "Adding Vehicle…"}</>
                            ) : (
                                <><Car className="w-4 h-4" /> Add Vehicle to Branch</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                DELETE CONFIRM
            ══════════════════════════════════════════════════════════════════ */}
            {deleteOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteOpen(false)} />
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
                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to delete <strong>{branch.name}</strong>? All associated data will be permanently removed.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteOpen(false)}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {deleting ? "Deleting…" : "Delete Branch"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Snackbar ── */}
            {snackbar.show && (
                <div className="fixed bottom-5 right-5 z-[70] animate-in slide-in-from-bottom-2 duration-300">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl min-w-[280px] border ${snackbar.type === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : snackbar.type === "error"
                            ? "bg-red-50 border-red-200 text-red-800"
                            : "bg-blue-50 border-blue-200 text-blue-800"}`}>
                        {snackbar.type === "success"
                            ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
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

export default BranchDetailPage;
