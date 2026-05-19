import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../../components/Sidebar";
import {
    fetchBranches,
    createBranch,
    updateBranch,
    deleteBranch,
    getBranchErrorDisplay,
    type IBranch,
    type IBranchesListResponse,
    type CreateBranchPayload,
    type UpdateBranchPayload,
    type IBranchAddress,
    type IBranchGeo,
    type IOpeningHourSlot,
    type OpeningHours,
    type DayKey,
} from "../../../Services/adminAndManager/admin_branch_service";
import {
    Search,
    Trash2,
    Eye,
    Edit,
    Plus,
    ChevronLeft,
    ChevronRight,
    Filter,
    X,
    AlertCircle,
    CheckCircle,
    MoreVertical,
    MapPin,
    Phone,
    Mail,
    Clock,
    Globe,
    Building,
    Save,
    Navigation,
    Calendar,
    Check,
    XCircle,
    RefreshCw,
} from "lucide-react";

const BranchManagementScreen: React.FC = () => {
    // State
    const [branches, setBranches] = useState<IBranch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [cityFilter, setCityFilter] = useState<string>("all");

    // Modal states
    const [selectedBranch, setSelectedBranch] = useState<IBranch | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [branchToDelete, setBranchToDelete] = useState<string | null>(null);

    // Initial form state
    const initialFormData: CreateBranchPayload = {
        name: "",
        code: "",
        address: {
            line1: "",
            line2: "",
            city: "",
            region: "",
            postal_code: "",
            country: "United States",
        },
        phone: "",
        email: "",
        imageLoc: "",
        active: true,
        opening_hours: {},
    };

    // Form states
    const [formData, setFormData] = useState<CreateBranchPayload>(initialFormData);

    // Days of week
    const daysOfWeek: { key: DayKey; label: string }[] = [
        { key: "mon", label: "Monday" },
        { key: "tue", label: "Tuesday" },
        { key: "wed", label: "Wednesday" },
        { key: "thu", label: "Thursday" },
        { key: "fri", label: "Friday" },
        { key: "sat", label: "Saturday" },
        { key: "sun", label: "Sunday" },
    ];

    // Snackbar
    const [snackbar, setSnackbar] = useState<{
        show: boolean;
        message: string;
        type: "success" | "error" | "info";
    }>({ show: false, message: "", type: "info" });

    // Sidebar state for mobile
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Load branches
    const loadBranches = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response: IBranchesListResponse = await fetchBranches();
            setBranches(response.data);
        } catch (err) {
            const errorDisplay = getBranchErrorDisplay(err);
            setError(errorDisplay.message || "Failed to load branches");
            showSnackbar(errorDisplay.message, "error");
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadBranches();
    }, [loadBranches]);

    // Snackbar helper
    const showSnackbar = (message: string, type: "success" | "error" | "info") => {
        setSnackbar({ show: true, message, type });
        setTimeout(() => {
            setSnackbar((prev) => ({ ...prev, show: false }));
        }, 3000);
    };

    // Reset form
    const resetForm = () => {
        setFormData(initialFormData);
    };

    // Open add modal with empty form
    const openAddModal = () => {
        resetForm(); // Reset form to initial empty state
        setIsAddModalOpen(true);
    };

    // Open edit modal with branch data
    const openEditModal = (branch: IBranch) => {
        setSelectedBranch(branch);
        setFormData({
            name: branch.name,
            code: branch.code,
            address: branch.address,
            phone: branch.phone || "",
            email: branch.email || "",
            imageLoc: branch.imageLoc || "",
            active: branch.active || true,
            opening_hours: branch.opening_hours || {},
        });
        setIsEditModalOpen(true);
    };

    // Open view modal
    const openViewModal = (branch: IBranch) => {
        setSelectedBranch(branch);
        setIsViewModalOpen(true);
    };

    // Handle add branch
    const handleAddBranch = async () => {
        try {
            await createBranch(formData);
            showSnackbar("Branch created successfully", "success");
            setIsAddModalOpen(false);
            resetForm();
            loadBranches();
        } catch (err) {
            const errorDisplay = getBranchErrorDisplay(err);
            showSnackbar(errorDisplay.message, "error");
        }
    };

    // Handle update branch
    const handleUpdateBranch = async () => {
        if (!selectedBranch) return;

        try {
            await updateBranch(selectedBranch._id, formData);
            showSnackbar("Branch updated successfully", "success");
            setIsEditModalOpen(false);
            setSelectedBranch(null);
            loadBranches();
        } catch (err) {
            const errorDisplay = getBranchErrorDisplay(err);
            showSnackbar(errorDisplay.message, "error");
        }
    };

    // Handle delete branch
    const handleDeleteBranch = async (branchId: string) => {
        try {
            await deleteBranch(branchId);
            showSnackbar("Branch deleted successfully", "success");
            setBranchToDelete(null);
            loadBranches();
        } catch (err) {
            const errorDisplay = getBranchErrorDisplay(err);
            showSnackbar(errorDisplay.message, "error");
        }
    };

    // Handle opening hours change
    const handleOpeningHoursChange = (day: DayKey, index: number, field: "open" | "close", value: string) => {
        setFormData((prev) => {
            const currentHours = prev.opening_hours || {};
            const dayHours = currentHours[day] || [];

            if (!dayHours[index]) {
                dayHours[index] = { open: "09:00", close: "17:00" };
            }

            dayHours[index] = { ...dayHours[index], [field]: value };

            return {
                ...prev,
                opening_hours: { ...currentHours, [day]: dayHours },
            };
        });
    };

    // Add time slot for a day
    const addTimeSlot = (day: DayKey) => {
        setFormData((prev) => {
            const currentHours = prev.opening_hours || {};
            const dayHours = currentHours[day] || [];

            return {
                ...prev,
                opening_hours: {
                    ...currentHours,
                    [day]: [...dayHours, { open: "09:00", close: "17:00" }],
                },
            };
        });
    };

    // Remove time slot for a day
  
 const removeTimeSlot = (day: DayKey, index: number) => {
    setFormData((prev) => {
        const currentHours = prev.opening_hours || {};
        const dayHours = currentHours[day] || [];

        const updatedHours = dayHours.filter((_: { open: string; close: string }, i: number) => i !== index);

        return {
            ...prev,
            opening_hours: {
                ...currentHours,
                [day]: updatedHours.length > 0 ? updatedHours : undefined,
            },
        };
    });
};

    // Filter branches
    const filteredBranches = branches.filter((branch) => {
        const matchesSearch =
            searchTerm === "" ||
            branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.address.line1.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (branch.phone && branch.phone.includes(searchTerm)) ||
            (branch.email && branch.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && branch.active) ||
            (statusFilter === "inactive" && !branch.active);

        const matchesCity =
            cityFilter === "all" || branch.address.city === cityFilter;

        return matchesSearch && matchesStatus && matchesCity;
    });

    // Get unique cities for filter
    const uniqueCities = Array.from(new Set(branches.map((b) => b.address.city))).sort();

    // Format date
    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Format opening hours for display
    const formatOpeningHours = (hours?: OpeningHours) => {
        if (!hours) return "Not specified";

        return Object.entries(hours)
            .map(([day, slots]) => {
                if (!slots || slots.length === 0) return null;
                const dayLabel = daysOfWeek.find((d) => d.key === day)?.label || day;
                const times = slots.map((slot) => `${slot.open} - ${slot.close}`).join(", ");
                return `${dayLabel}: ${times}`;
            })
            .filter(Boolean)
            .join("; ");
    };

    // Render opening hours in a more readable way
    const renderOpeningHours = (hours?: OpeningHours) => {
        if (!hours) return <span className="text-gray-500">Not specified</span>;

        return (
            <div className="space-y-2">
                {daysOfWeek.map((day) => {
                    const slots = hours[day.key];
                    if (!slots || slots.length === 0) return null;

                    return (
                        <div key={day.key} className="flex items-center text-sm">
                            <span className="w-24 text-gray-600">{day.label}:</span>
                            <div className="flex-1">
                                {slots.map((slot, idx) => (
                                    <div key={idx} className="text-gray-800">
                                        {slot.open} - {slot.close}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
        {/* Sidebar - Fixed */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header - Fixed */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Branches Management</h1>
                            <p className="text-sm text-gray-600 mt-1">Manage rental branches and locations</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                            Total: <span className="font-semibold">{branches.length}</span> branches
                        </div>
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add Branch</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Filters & Search */}
                <div className="p-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search branches by name, code, city, or address..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-3">
                                <div className="relative">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>

                                <div className="relative">
                                    <select
                                        value={cityFilter}
                                        onChange={(e) => setCityFilter(e.target.value)}
                                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                                    >
                                        <option value="all">All Cities</option>
                                        {uniqueCities.map((city) => (
                                            <option key={city} value={city}>
                                                {city}
                                            </option>
                                        ))}
                                    </select>
                                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branches Grid/Table */}
                <div className="px-6 pb-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4"></div>
                                <p className="text-gray-600">Loading branches...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 p-6">
                            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                            <p className="text-red-600 text-center mb-4">{error}</p>
                            <button
                                onClick={loadBranches}
                                className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry
                            </button>
                        </div>
                    ) : filteredBranches.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 p-6">
                            <Building className="w-20 h-20 text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg mb-2">No branches found</p>
                            <p className="text-gray-400 text-center mb-6">
                                {searchTerm || statusFilter !== "all" || cityFilter !== "all"
                                    ? "Try adjusting your filters or search terms"
                                    : "Get started by adding your first branch"}
                            </p>
                            {!searchTerm && statusFilter === "all" && cityFilter === "all" && (
                                <button
                                    onClick={openAddModal}
                                    className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors"
                                >
                                    Add Branch
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop Grid */}
                            <div className="hidden lg:block">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredBranches.map((branch) => (
                                        <div
                                            key={branch._id}
                                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                                        >
                                            <div className="p-6">
                                                {/* Branch Header */}
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3 className="text-lg font-bold text-gray-900">{branch.name}</h3>
                                                            <span
                                                                className={`px-2 py-1 text-xs font-medium rounded-full ${branch.active
                                                                        ? "bg-green-100 text-green-800"
                                                                        : "bg-red-100 text-red-800"
                                                                    }`}
                                                            >
                                                                {branch.active ? "ACTIVE" : "INACTIVE"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Building className="w-4 h-4" />
                                                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                                                {branch.code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => openViewModal(branch)}
                                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        <Eye className="w-5 h-5 text-gray-600" />
                                                    </button>
                                                </div>

                                                {/* Address */}
                                                <div className="mb-4">
                                                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                                                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="font-medium text-gray-900">{branch.address.line1}</p>
                                                            {branch.address.line2 && (
                                                                <p className="text-gray-600">{branch.address.line2}</p>
                                                            )}
                                                            <p className="text-gray-600">
                                                                {branch.address.city}, {branch.address.region}{" "}
                                                                {branch.address.postal_code}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Contact Info */}
                                                <div className="space-y-2 mb-6">
                                                    {branch.phone && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Phone className="w-4 h-4" />
                                                            <span>{branch.phone}</span>
                                                        </div>
                                                    )}
                                                    {branch.email && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Mail className="w-4 h-4" />
                                                            <span className="truncate">{branch.email}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                                    <div className="text-xs text-gray-500">
                                                        {branch.createdAt && (
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {formatDate(branch.createdAt)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openEditModal(branch)}
                                                            className="p-2 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                                                            title="Edit Branch"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setBranchToDelete(branch._id)}
                                                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Branch"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Mobile Cards */}
                            <div className="lg:hidden space-y-4">
                                {filteredBranches.map((branch) => (
                                    <div
                                        key={branch._id}
                                        className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-gray-900">{branch.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-mono text-gray-600">{branch.code}</span>
                                                    <span
                                                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${branch.active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                            }`}
                                                    >
                                                        {branch.active ? "ACTIVE" : "INACTIVE"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openViewModal(branch)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                                                >
                                                    <Eye className="w-4 h-4 text-gray-600" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(branch)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                                                >
                                                    <Edit className="w-4 h-4 text-gray-600" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-start gap-2 text-sm">
                                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                                                <div>
                                                    <p className="text-gray-900">{branch.address.line1}</p>
                                                    <p className="text-gray-600">
                                                        {branch.address.city}, {branch.address.region}
                                                    </p>
                                                </div>
                                            </div>

                                            {branch.phone && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Phone className="w-4 h-4" />
                                                    <span>{branch.phone}</span>
                                                </div>
                                            )}

                                            {branch.email && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail className="w-4 h-4" />
                                                    <span className="truncate">{branch.email}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                            {branch.createdAt && (
                                                <div className="text-xs text-gray-500">
                                                    {formatDate(branch.createdAt)}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => setBranchToDelete(branch._id)}
                                                className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* View Branch Details Modal */}
        {isViewModalOpen && selectedBranch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsViewModalOpen(false)}
                />
                <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Branch Details</h2>
                            <p className="text-sm text-gray-600">View branch information</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setIsViewModalOpen(false);
                                    openEditModal(selectedBranch);
                                }}
                                className="px-3 py-1.5 text-sm bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 80px)" }}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column */}
                            <div className="space-y-6">
                                {/* Branch Info */}
                                <div className="bg-gray-50 rounded-lg p-5">
                                    <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                                        Branch Information
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Branch Name</p>
                                            <p className="text-lg font-bold text-gray-900">{selectedBranch.name}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500">Branch Code</p>
                                                <p className="text-sm font-mono text-gray-900 bg-gray-100 px-3 py-1.5 rounded inline-block">
                                                    {selectedBranch.code}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Status</p>
                                                <span
                                                    className={`px-3 py-1 text-sm font-medium rounded-full ${selectedBranch.active
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                        }`}
                                                >
                                                    {selectedBranch.active ? "ACTIVE" : "INACTIVE"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="bg-gray-50 rounded-lg p-5">
                                    <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                                        Contact Information
                                    </h4>
                                    <div className="space-y-4">
                                        {selectedBranch.phone && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <Phone className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Phone</p>
                                                    <p className="text-gray-900 font-medium">{selectedBranch.phone}</p>
                                                </div>
                                            </div>
                                        )}
                                        {selectedBranch.email && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <Mail className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Email</p>
                                                    <p className="text-gray-900 font-medium">{selectedBranch.email}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Meta Information */}
                                <div className="bg-gray-50 rounded-lg p-5">
                                    <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                                        Meta Information
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Branch ID</p>
                                            <p className="text-xs font-mono text-gray-600 break-all">
                                                {selectedBranch._id}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedBranch.createdAt && (
                                                <div>
                                                    <p className="text-xs text-gray-500">Created</p>
                                                    <p className="text-sm text-gray-900">{formatDate(selectedBranch.createdAt)}</p>
                                                </div>
                                            )}
                                            {selectedBranch.updatedAt && (
                                                <div>
                                                    <p className="text-xs text-gray-500">Last Updated</p>
                                                    <p className="text-sm text-gray-900">{formatDate(selectedBranch.updatedAt)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                {/* Address Information */}
                                <div className="bg-gray-50 rounded-lg p-5">
                                    <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                                        Address Information
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-1">
                                                <MapPin className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="space-y-2">
                                                <div>
                                                    <p className="text-xs text-gray-500">Address Line 1</p>
                                                    <p className="text-gray-900">{selectedBranch.address.line1}</p>
                                                </div>
                                                {selectedBranch.address.line2 && (
                                                    <div>
                                                        <p className="text-xs text-gray-500">Address Line 2</p>
                                                        <p className="text-gray-900">{selectedBranch.address.line2}</p>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500">City</p>
                                                        <p className="text-gray-900">{selectedBranch.address.city}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Region</p>
                                                        <p className="text-gray-900">{selectedBranch.address.region || "N/A"}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Postal Code</p>
                                                        <p className="text-gray-900">{selectedBranch.address.postal_code || "N/A"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Country</p>
                                                        <p className="text-gray-900">{selectedBranch.address.country}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {selectedBranch.geo && (
                                            <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                    <Navigation className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Coordinates</p>
                                                    <p className="text-sm font-mono text-gray-900">
                                                        {selectedBranch.geo.coordinates[1].toFixed(6)},{" "}
                                                        {selectedBranch.geo.coordinates[0].toFixed(6)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Opening Hours */}
                                <div className="bg-gray-50 rounded-lg p-5">
                                    <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                                        Opening Hours
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedBranch.opening_hours ? (
                                            renderOpeningHours(selectedBranch.opening_hours)
                                        ) : (
                                            <p className="text-gray-500">No opening hours specified</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                        <div className="flex justify-end">
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Add/Edit Branch Modal */}
        {(isAddModalOpen || isEditModalOpen) && (
            <div
                className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ease-in-out ${isAddModalOpen || isEditModalOpen
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                    }`}
            >
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isAddModalOpen || isEditModalOpen ? "opacity-100" : "opacity-0"
                        }`}
                    onClick={() => {
                        setIsAddModalOpen(false);
                        setIsEditModalOpen(false);
                    }}
                />

                {/* Side Panel */}
                <div
                    className={`absolute inset-y-0 right-0 flex max-w-full pl-10 transition-transform duration-300 ease-in-out ${isAddModalOpen || isEditModalOpen ? "translate-x-0" : "translate-x-full"
                        }`}
                >
                    <div className="relative w-screen max-w-2xl">
                        <div className="flex flex-col h-full bg-white shadow-xl">
                            {/* Header */}
                            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">
                                            {isEditModalOpen ? "Edit Branch" : "Add New Branch"}
                                        </h2>
                                        <p className="text-sm text-gray-600">
                                            {isEditModalOpen
                                                ? "Update branch information"
                                                : "Create a new branch location"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsAddModalOpen(false);
                                            setIsEditModalOpen(false);
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Form Content */}
                            <div className="flex-1 overflow-y-auto px-6 py-6">
                                <div className="space-y-6">
                                    {/* Basic Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                            Basic Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Branch Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                                    }
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="Downtown Branch"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Branch Code <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.code}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({ ...prev, code: e.target.value }))
                                                    }
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="DT-001"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                            Address Information
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Address Line 1 <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.address.line1}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            address: { ...prev.address, line1: e.target.value },
                                                        }))
                                                    }
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="123 Main Street"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Address Line 2
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.address.line2 || ""}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            address: { ...prev.address, line2: e.target.value },
                                                        }))
                                                    }
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="Suite 100"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        City <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.address.city}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                address: { ...prev.address, city: e.target.value },
                                                            }))
                                                        }
                                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                        placeholder="New York"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Region/State
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.address.region || ""}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                address: { ...prev.address, region: e.target.value },
                                                            }))
                                                        }
                                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                        placeholder="NY"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Postal Code
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.address.postal_code || ""}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                address: { ...prev.address, postal_code: e.target.value },
                                                            }))
                                                        }
                                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                        placeholder="10001"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Country <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.address.country}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            address: { ...prev.address, country: e.target.value },
                                                        }))
                                                    }
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="United States"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                            Contact Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Phone Number
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={formData.phone || ""}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({ ...prev, phone: e.target.value }))
                                                    }
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="+1 (555) 123-4567"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Email Address
                                                </label>
                                                <input
                                                    type="email"
                                                    value={formData.email || ""}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                                                    }
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="branch@example.com"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Opening Hours */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                            Opening Hours
                                        </h3>
                                        <div className="space-y-4">
                                            {daysOfWeek.map((day) => {
                                                const slots = formData.opening_hours?.[day.key] || [];
                                                return (
                                                    <div key={day.key} className="border border-gray-200 rounded-lg p-4">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <label className="font-medium text-gray-700">{day.label}</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => addTimeSlot(day.key)}
                                                                className="text-sm text-[#1EA2E4] hover:text-[#1A8BC9] font-medium"
                                                            >
                                                                + Add Time Slot
                                                            </button>
                                                        </div>
                                                        {slots.length === 0 ? (
                                                            <div className="text-gray-400 text-sm italic">
                                                                Closed or not specified
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {slots.map((slot: IOpeningHourSlot, index: number) => (
                                                                    <div
                                                                        key={index}
                                                                        className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"
                                                                    >
                                                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                                                            <div>
                                                                                <label className="block text-xs text-gray-500 mb-1">
                                                                                    Open
                                                                                </label>
                                                                                <input
                                                                                    type="time"
                                                                                    value={slot.open}
                                                                                    onChange={(e) =>
                                                                                        handleOpeningHoursChange(
                                                                                            day.key,
                                                                                            index,
                                                                                            "open",
                                                                                            e.target.value
                                                                                        )
                                                                                    }
                                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1EA2E4]"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-xs text-gray-500 mb-1">
                                                                                    Close
                                                                                </label>
                                                                                <input
                                                                                    type="time"
                                                                                    value={slot.close}
                                                                                    onChange={(e) =>
                                                                                        handleOpeningHoursChange(
                                                                                            day.key,
                                                                                            index,
                                                                                            "close",
                                                                                            e.target.value
                                                                                        )
                                                                                    }
                                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1EA2E4]"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeTimeSlot(day.key, index)}
                                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                                        >
                                                                            <XCircle className="w-4 h-4" />
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
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Status</h3>
                                        <div className="flex items-center gap-3">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.active}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({ ...prev, active: e.target.checked }))
                                                    }
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1EA2E4]"></div>
                                                <span className="ml-3 text-sm font-medium text-gray-700">
                                                    {formData.active ? "Active" : "Inactive"}
                                                </span>
                                            </label>
                                            <span className="text-sm text-gray-500">
                                                {formData.active
                                                    ? "This branch is active and visible"
                                                    : "This branch is inactive and hidden"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setIsAddModalOpen(false);
                                            setIsEditModalOpen(false);
                                        }}
                                        className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={isEditModalOpen ? handleUpdateBranch : handleAddBranch}
                                        disabled={!formData.name || !formData.code || !formData.address.line1 || !formData.address.city || !formData.address.country}
                                        className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {isEditModalOpen ? "Update Branch" : "Create Branch"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Delete Confirmation Modal */}
        {branchToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={() => setBranchToDelete(null)}
                />
                <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                    <div className="p-6">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Delete Branch</h3>
                                <p className="text-sm text-gray-600">This action cannot be undone</p>
                            </div>
                        </div>

                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this branch? This will remove all branch
                            information and cannot be recovered.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setBranchToDelete(null)}
                                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteBranch(branchToDelete)}
                                className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                                Delete Branch
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Snackbar */}
        {snackbar.show && (
            <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
                <div
                    className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] ${snackbar.type === "success"
                            ? "bg-green-50 border border-green-200 text-green-800"
                            : snackbar.type === "error"
                                ? "bg-red-50 border border-red-200 text-red-800"
                                : "bg-blue-50 border border-blue-200 text-blue-800"
                        }`}
                >
                    {snackbar.type === "success" && (
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    )}
                    {snackbar.type === "error" && (
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium flex-1">{snackbar.message}</span>
                    <button
                        onClick={() => setSnackbar((prev) => ({ ...prev, show: false }))}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}
    </div>
);
};

export default BranchManagementScreen;