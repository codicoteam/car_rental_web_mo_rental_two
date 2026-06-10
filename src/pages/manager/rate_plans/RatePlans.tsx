import React, { useState, useEffect, useCallback } from "react";
import ManagerSidebar from "../../../components/ManagerSideBar";
import {
    fetchAllRatePlans,
    createRatePlan,
    updateRatePlan,
    deleteRatePlan,
    getErrorDisplay,
    normalizeDecimal,
    type IRatePlan,
    type CreateRatePlanPayload,
    type UpdateRatePlanPayload,
    type VehicleClass,
    type IRatePlanSeasonalOverride,
    type IRatePlanTax,
    type IRatePlanFee,
} from "../../../Services/adminAndManager/rate_plan_service";
import {
    fetchVehicleUnits,
    type IVehicleUnit,
} from "../../../Services/adminAndManager/vehicle_units_services";
import {
    fetchVehicleModels,
    type IVehicleModel,
} from "../../../Services/adminAndManager/vehicle_model_service";
import {
    fetchBranches,
    type IBranch,
} from "../../../Services/adminAndManager/admin_branch_service";
import {
    Search,
    Trash2,
    Eye,
    Edit,
    Plus,
    Filter,
    X,
    AlertCircle,
    CheckCircle,
    MoreVertical,
    Building,
    Tag,
    DollarSign,
    Calendar,
   
    XCircle,
    RefreshCw,
   
    Layers,
    Car,
   
    Package,
    Save,
} from "lucide-react";

const RatePlans: React.FC = () => {
    // State
    const [ratePlans, setRatePlans] = useState<IRatePlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [branchFilter, setBranchFilter] = useState<string>("all");
    const [vehicleClassFilter, setVehicleClassFilter] = useState<string>("all");

    // Modal states
    const [selectedRatePlan, setSelectedRatePlan] = useState<IRatePlan | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [ratePlanToDelete, setRatePlanToDelete] = useState<string | null>(null);

    // Dropdown data
    const [branches, setBranches] = useState<IBranch[]>([]);
    const [vehicleModels, setVehicleModels] = useState<IVehicleModel[]>([]);
    const [vehicleUnits, setVehicleUnits] = useState<IVehicleUnit[]>([]);

    // Rate plan types
    const ratePlanTypes = ["vehicle_class", "vehicle_model", "vehicle_unit"] as const;
    type RatePlanType = typeof ratePlanTypes[number];

    // Vehicle classes
    const vehicleClasses: VehicleClass[] = [
        "economy",
        "compact",
        "midsize",
        "standard",
        "fullsize",
        "suv",
        "luxury",
        "van",
        "premium",
        "sports"
    ];

    // Initial form state
    const initialFormData: CreateRatePlanPayload = {
        name: "",
        branch_id: "",
        vehicle_class: "economy",
        vehicle_model_id: null,
        vehicle_id: null,
        currency: "USD",
        daily_rate: "0.00",
        weekly_rate: "",
        monthly_rate: "",
        weekend_rate: "",
        seasonal_overrides: [],
        taxes: [],
        fees: [],
        active: true,
        valid_from: "",
        valid_to: null,
        notes: "",
    };

    // Form states
    const [formData, setFormData] = useState<CreateRatePlanPayload>(initialFormData);
    const [selectedRatePlanType, setSelectedRatePlanType] = useState<RatePlanType>("vehicle_class");

    // Snackbar
    const [snackbar, setSnackbar] = useState<{
        show: boolean;
        message: string;
        type: "success" | "error" | "info";
    }>({ show: false, message: "", type: "info" });

    // Sidebar state for mobile
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const managerBranchId = localStorage.getItem('manager_branch_id');
    const loadRatePlans = useCallback(async () => {
    try {
        setLoading(true);
        setError(null);
        const response = await fetchAllRatePlans();
        
        // Filter rate plans by manager's branch ID
        let filteredPlans = response.data;
        if (managerBranchId) {
            filteredPlans = response.data.filter((plan: IRatePlan) => {
                const planBranchId = typeof plan.branch_id === 'string' 
                    ? plan.branch_id 
                    : plan.branch_id?._id;
                return planBranchId === managerBranchId;
            });
        }
        
        setRatePlans(filteredPlans);
    } catch (err) {
        const errorDisplay = getErrorDisplay(err);
        setError(errorDisplay.message || "Failed to load rate plans");
        showSnackbar(errorDisplay.message, "error");
    } finally {
        setLoading(false);
    }
}, [managerBranchId]);

    // Load dropdown data
    const loadDropdownData = useCallback(async () => {
        try {
            // Load branches
            const branchesResponse = await fetchBranches();
            setBranches(branchesResponse.data);

            // Load vehicle models
            const modelsResponse = await fetchVehicleModels();
            setVehicleModels(modelsResponse.data.items || []);

            // Load vehicle units
            const unitsResponse = await fetchVehicleUnits();
            setVehicleUnits(unitsResponse.data.items || []);
        } catch (err) {
            console.error("Failed to load dropdown data:", err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadRatePlans();
        loadDropdownData();
    }, [loadRatePlans, loadDropdownData]);

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
        setSelectedRatePlanType("vehicle_class");
    };

    // Open add modal with empty form
    const openAddModal = () => {
        resetForm();
        setIsAddModalOpen(true);
    };

    // Open edit modal with rate plan data
    // const openEditModal = (ratePlan: IRatePlan) => {
    //     setSelectedRatePlan(ratePlan);
        
    //     // Determine rate plan type
    //     let type: RatePlanType = "vehicle_class";
    //     if (ratePlan.vehicle_id) type = "vehicle_unit";
    //     else if (ratePlan.vehicle_model_id) type = "vehicle_model";
        
    //     setSelectedRatePlanType(type);

    //     setFormData({
    //         name: ratePlan.name,
    //         branch_id: typeof ratePlan.branch_id === 'string' ? ratePlan.branch_id : ratePlan.branch_id?._id || "",
    //         vehicle_class: ratePlan.vehicle_class,
    //         vehicle_model_id: ratePlan.vehicle_model_id || null,
    //         vehicle_id: ratePlan.vehicle_id || null,
    //         currency: ratePlan.currency,
    //         daily_rate: normalizeDecimal(ratePlan.daily_rate) || "0.00",
    //         weekly_rate: normalizeDecimal(ratePlan.weekly_rate) || "",
    //         monthly_rate: normalizeDecimal(ratePlan.monthly_rate) || "",
    //         weekend_rate: normalizeDecimal(ratePlan.weekend_rate) || "",
    //         seasonal_overrides: ratePlan.seasonal_overrides?.map(override => ({
    //             season: override.season,
    //             daily_rate: normalizeDecimal(override.daily_rate) || "",
    //             weekly_rate: normalizeDecimal(override.weekly_rate) || "",
    //             monthly_rate: normalizeDecimal(override.monthly_rate) || "",
    //             weekend_rate: normalizeDecimal(override.weekend_rate) || "",
    //         })) || [],
    //         taxes: ratePlan.taxes || [],
    //         fees: ratePlan.fees || [],
    //         active: ratePlan.active || true,
    //         valid_from: ratePlan.valid_from || "",
    //         valid_to: ratePlan.valid_to || null,
    //         notes: ratePlan.notes || "",
    //     });
        
    //     setIsEditModalOpen(true);
    // };

    const openEditModal = (ratePlan: IRatePlan) => {
    setSelectedRatePlan(ratePlan);
    
    // Determine rate plan type
    let type: RatePlanType = "vehicle_class";
    if (ratePlan.vehicle_id) type = "vehicle_unit";
    else if (ratePlan.vehicle_model_id) type = "vehicle_model";
    
    setSelectedRatePlanType(type);

    // Extract vehicle_id as string or null
    let vehicleIdValue: string | null = null;
    if (ratePlan.vehicle_id) {
        vehicleIdValue = typeof ratePlan.vehicle_id === 'string' 
            ? ratePlan.vehicle_id 
            : ratePlan.vehicle_id?._id || null;
    }
     // Convert fees amount to string
    const convertedFees = ratePlan.fees?.map(fee => ({
        code: fee.code,
        amount: normalizeDecimal(fee.amount) || ""
    })) || [];

    setFormData({
        name: ratePlan.name,
        branch_id: typeof ratePlan.branch_id === 'string' ? ratePlan.branch_id : ratePlan.branch_id?._id || "",
        vehicle_class: ratePlan.vehicle_class,
        vehicle_model_id: ratePlan.vehicle_model_id || null,
        vehicle_id: vehicleIdValue,
        currency: ratePlan.currency,
        daily_rate: normalizeDecimal(ratePlan.daily_rate) || "0.00",
        weekly_rate: normalizeDecimal(ratePlan.weekly_rate) || "",
        monthly_rate: normalizeDecimal(ratePlan.monthly_rate) || "",
        weekend_rate: normalizeDecimal(ratePlan.weekend_rate) || "",
        seasonal_overrides: ratePlan.seasonal_overrides?.map(override => ({
            season: override.season,
            daily_rate: normalizeDecimal(override.daily_rate) || "",
            weekly_rate: normalizeDecimal(override.weekly_rate) || "",
            monthly_rate: normalizeDecimal(override.monthly_rate) || "",
            weekend_rate: normalizeDecimal(override.weekend_rate) || "",
        })) || [],
        taxes: ratePlan.taxes || [],
        fees: convertedFees,
        active: ratePlan.active || true,
        valid_from: ratePlan.valid_from || "",
        valid_to: ratePlan.valid_to || null,
        notes: ratePlan.notes || "",
    });
    
    setIsEditModalOpen(true);
};

    // Open view modal
    const openViewModal = (ratePlan: IRatePlan) => {
        setSelectedRatePlan(ratePlan);
        setIsViewModalOpen(true);
    };

    // Handle add rate plan
    const handleAddRatePlan = async () => {
        try {
            // Prepare data based on selected type
            const payload: CreateRatePlanPayload = {
                ...formData,
                vehicle_model_id: selectedRatePlanType === "vehicle_model" ? formData.vehicle_model_id : null,
                vehicle_id: selectedRatePlanType === "vehicle_unit" ? formData.vehicle_id : null,
                vehicle_class: selectedRatePlanType === "vehicle_class" ? formData.vehicle_class : "",
            };

            await createRatePlan(payload);
            showSnackbar("Rate plan created successfully", "success");
            setIsAddModalOpen(false);
            resetForm();
            loadRatePlans();
        } catch (err) {
            const errorDisplay = getErrorDisplay(err);
            showSnackbar(errorDisplay.message, "error");
        }
    };

    // Handle update rate plan
    const handleUpdateRatePlan = async () => {
        if (!selectedRatePlan) return;

        try {
            // Prepare data based on selected type
            const payload: UpdateRatePlanPayload = {
                ...formData,
                vehicle_model_id: selectedRatePlanType === "vehicle_model" ? formData.vehicle_model_id : null,
                vehicle_id: selectedRatePlanType === "vehicle_unit" ? formData.vehicle_id : null,
                vehicle_class: selectedRatePlanType === "vehicle_class" ? formData.vehicle_class : "",
            };

            await updateRatePlan(selectedRatePlan._id, payload);
            showSnackbar("Rate plan updated successfully", "success");
            setIsEditModalOpen(false);
            setSelectedRatePlan(null);
            loadRatePlans();
        } catch (err) {
            const errorDisplay = getErrorDisplay(err);
            showSnackbar(errorDisplay.message, "error");
        }
    };

    // Handle delete rate plan
    const handleDeleteRatePlan = async (ratePlanId: string) => {
        try {
            await deleteRatePlan(ratePlanId);
            showSnackbar("Rate plan deleted successfully", "success");
            setRatePlanToDelete(null);
            loadRatePlans();
        } catch (err) {
            const errorDisplay = getErrorDisplay(err);
            showSnackbar(errorDisplay.message, "error");
        }
    };

    // Handle seasonal override changes
    const handleSeasonalOverrideChange = (
        index: number,
        field: keyof IRatePlanSeasonalOverride,
        value: string
    ) => {
        setFormData((prev) => {
            const overrides = [...(prev.seasonal_overrides || [])];
            if (!overrides[index]) {
                overrides[index] = {
                    season: { name: "", start: "", end: "" },
                    daily_rate: "",
                    weekly_rate: "",
                    monthly_rate: "",
                    weekend_rate: "",
                };
            }

            if (field === 'season') {
                const [seasonField, seasonValue] = value.split('.');
                overrides[index] = {
                    ...overrides[index],
                    season: {
                        ...overrides[index].season!,
                        [seasonField]: seasonValue,
                    },
                };
            } else {
                overrides[index] = {
                    ...overrides[index],
                    [field]: value,
                };
            }

            return {
                ...prev,
                seasonal_overrides: overrides,
            };
        });
    };

    // Add seasonal override
    const addSeasonalOverride = () => {
        setFormData((prev) => ({
            ...prev,
            seasonal_overrides: [
                ...(prev.seasonal_overrides || []),
                {
                    season: { name: "", start: "", end: "" },
                    daily_rate: "",
                    weekly_rate: "",
                    monthly_rate: "",
                    weekend_rate: "",
                },
            ],
        }));
    };

    // Remove seasonal override
    const removeSeasonalOverride = (index: number) => {
        setFormData((prev) => {
            const overrides = [...(prev.seasonal_overrides || [])];
            overrides.splice(index, 1);
            return { ...prev, seasonal_overrides: overrides };
        });
    };

    // Handle tax changes
    const handleTaxChange = (index: number, field: keyof IRatePlanTax, value: string) => {
        setFormData((prev) => {
            const taxes = [...(prev.taxes || [])];
            if (!taxes[index]) {
                taxes[index] = { code: "", rate: 0 };
            }

            taxes[index] = {
                ...taxes[index],
                [field]: field === 'rate' ? parseFloat(value) || 0 : value,
            };

            return { ...prev, taxes };
        });
    };

    // Add tax
    const addTax = () => {
        setFormData((prev) => ({
            ...prev,
            taxes: [...(prev.taxes || []), { code: "", rate: 0 }],
        }));
    };

    // Remove tax
    const removeTax = (index: number) => {
        setFormData((prev) => {
            const taxes = [...(prev.taxes || [])];
            taxes.splice(index, 1);
            return { ...prev, taxes };
        });
    };

    // Handle fee changes
    const handleFeeChange = (index: number, field: keyof IRatePlanFee, value: string) => {
        setFormData((prev) => {
            const fees = [...(prev.fees || [])];
            if (!fees[index]) {
                fees[index] = { code: "", amount: "" };
            }

            fees[index] = {
                ...fees[index],
                [field]: value,
            };

            return { ...prev, fees };
        });
    };

    // Add fee
    const addFee = () => {
        setFormData((prev) => ({
            ...prev,
            fees: [...(prev.fees || []), { code: "", amount: "" }],
        }));
    };

    // Remove fee
    const removeFee = (index: number) => {
        setFormData((prev) => {
            const fees = [...(prev.fees || [])];
            fees.splice(index, 1);
            return { ...prev, fees };
        });
    };

    // Filter rate plans
    const filteredRatePlans = ratePlans.filter((plan) => {
        const matchesSearch =
            searchTerm === "" ||
            plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plan.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (plan.notes && plan.notes.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && plan.active) ||
            (statusFilter === "inactive" && !plan.active);

        const matchesBranch =
            branchFilter === "all" ||
            (typeof plan.branch_id === 'string' 
                ? plan.branch_id === branchFilter
                : plan.branch_id?._id === branchFilter);

        const matchesVehicleClass =
            vehicleClassFilter === "all" ||
            plan.vehicle_class === vehicleClassFilter;

        return matchesSearch && matchesStatus && matchesBranch && matchesVehicleClass;
    });

    // Get unique branches for filter
    const uniqueBranches = branches.filter(branch => 
        ratePlans.some(plan => 
            typeof plan.branch_id === 'string' 
                ? plan.branch_id === branch._id
                : plan.branch_id?._id === branch._id
        )
    );

    // Format date
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Format currency
    const formatCurrency = (amount: any, currency: string = "USD") => {
        const num = typeof amount === 'number' ? amount : 
                   typeof amount === 'string' ? parseFloat(amount) : 
                   amount?.$numberDecimal ? parseFloat(amount.$numberDecimal) : 0;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        }).format(num);
    };

    // Get display name for branch
    const getBranchName = (branch: string | { _id: string; name?: string } | null) => {
        if (!branch) return "N/A";
        if (typeof branch === 'string') {
            const found = branches.find(b => b._id === branch);
            return found?.name || branch;
        }
        return branch.name || branch._id;
    };

    // Get display name for vehicle model
    const getVehicleModelName = (modelId: string | null) => {
        if (!modelId) return "N/A";
        const model = vehicleModels.find(m => m._id === modelId);
        return model ? `${model.make} ${model.model} ${model.year}` : modelId;
    };
   
    // Get display name for vehicle unit - Using union type with optional properties
const getVehicleUnitName = (unitId: string | { _id?: string; vin?: string; plate_number?: string } | null) => {
    if (!unitId) return "N/A";
    // If it's an object with vin and plate_number
    if (typeof unitId === 'object' && unitId !== null) {
        const vin = unitId.vin || '';
        const plateNumber = unitId.plate_number || '';
        return `${vin} (${plateNumber})`;
    }
    // If it's a string ID, look it up in vehicleUnits array
    if (typeof unitId === 'string') {
        const unit = vehicleUnits.find(u => u._id === unitId);
        return unit ? `${unit.vin} (${unit.plate_number})` : unitId;
    }
    return "N/A";
};

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            {/* Sidebar */}
            <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content - Fixed layout with scrollable content area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header - Fixed at top */}
                <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <MoreVertical className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Rate Plans Management</h1>
                                <p className="text-sm text-gray-600 mt-1">Manage pricing and rate plans</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                                Total: <span className="font-semibold">{ratePlans.length}</span> plans
                            </div>
                            <button
                                onClick={openAddModal}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add Rate Plan</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
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
                                            placeholder="Search rate plans by name, currency, or notes..."
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
                                            value={branchFilter}
                                            onChange={(e) => setBranchFilter(e.target.value)}
                                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[160px]"
                                        >
                                            <option value="all">All Branches</option>
                                            {uniqueBranches.map((branch) => (
                                                <option key={branch._id} value={branch._id}>
                                                    {branch.name}
                                                </option>
                                            ))}
                                        </select>
                                        <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>

                                    <div className="relative">
                                        <select
                                            value={vehicleClassFilter}
                                            onChange={(e) => setVehicleClassFilter(e.target.value)}
                                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[160px]"
                                        >
                                            <option value="all">All Vehicle Classes</option>
                                            {vehicleClasses.map((vehicleClass) => (
                                                <option key={vehicleClass} value={vehicleClass}>
                                                    {vehicleClass.charAt(0).toUpperCase() + vehicleClass.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                        <Car className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rate Plans Grid/Table */}
                    <div className="px-6 pb-6">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4"></div>
                                    <p className="text-gray-600">Loading rate plans...</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-64 p-6">
                                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                                <p className="text-red-600 text-center mb-4">{error}</p>
                                <button
                                    onClick={loadRatePlans}
                                    className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry
                                </button>
                            </div>
                        ) : filteredRatePlans.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 p-6">
                                <Tag className="w-20 h-20 text-gray-300 mb-4" />
                                <p className="text-gray-500 text-lg mb-2">No rate plans found</p>
                                <p className="text-gray-400 text-center mb-6">
                                    {searchTerm || statusFilter !== "all" || branchFilter !== "all" || vehicleClassFilter !== "all"
                                        ? "Try adjusting your filters or search terms"
                                        : "Get started by adding your first rate plan"}
                                </p>
                                {!searchTerm && statusFilter === "all" && branchFilter === "all" && vehicleClassFilter === "all" && (
                                    <button
                                        onClick={openAddModal}
                                        className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors"
                                    >
                                        Add Rate Plan
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Desktop Grid */}
                                <div className="hidden lg:block">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredRatePlans.map((plan) => (
                                            <div
                                                key={plan._id}
                                                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                                            >
                                                <div className="p-6">
                                                    {/* Rate Plan Header */}
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                                                                <span
                                                                    className={`px-2 py-1 text-xs font-medium rounded-full ${plan.active
                                                                            ? "bg-green-100 text-green-800"
                                                                            : "bg-red-100 text-red-800"
                                                                        }`}
                                                                >
                                                                    {plan.active ? "ACTIVE" : "INACTIVE"}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Tag className="w-4 h-4" />
                                                                <span className="font-medium">{plan.vehicle_class}</span>
                                                                <span className="text-gray-400">•</span>
                                                                <span className="font-mono">{plan.currency}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => openViewModal(plan)}
                                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <Eye className="w-5 h-5 text-gray-600" />
                                                        </button>
                                                    </div>

                                                    {/* Rates */}
                                                    <div className="mb-4">
                                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                                <p className="text-xs text-gray-500">Daily Rate</p>
                                                                <p className="text-lg font-bold text-gray-900">
                                                                    {formatCurrency(plan.daily_rate, plan.currency)}
                                                                </p>
                                                            </div>
                                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                                <p className="text-xs text-gray-500">Weekly Rate</p>
                                                                <p className="text-lg font-bold text-gray-900">
                                                                    {plan.weekly_rate ? formatCurrency(plan.weekly_rate, plan.currency) : "N/A"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                                <p className="text-xs text-gray-500">Monthly Rate</p>
                                                                <p className="text-lg font-bold text-gray-900">
                                                                    {plan.monthly_rate ? formatCurrency(plan.monthly_rate, plan.currency) : "N/A"}
                                                                </p>
                                                            </div>
                                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                                <p className="text-xs text-gray-500">Weekend Rate</p>
                                                                <p className="text-lg font-bold text-gray-900">
                                                                    {plan.weekend_rate ? formatCurrency(plan.weekend_rate, plan.currency) : "N/A"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Branch & Validity */}
                                                    <div className="space-y-3 mb-6">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Building className="w-4 h-4" />
                                                            <span className="truncate">{getBranchName(plan.branch_id)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>
                                                                {plan.valid_from ? formatDate(plan.valid_from) : "Always"}
                                                                {plan.valid_to && ` - ${formatDate(plan.valid_to)}`}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                                        <div className="text-xs text-gray-500">
                                                            {plan.createdAt && (
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {formatDate(plan.createdAt)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => openEditModal(plan)}
                                                                className="p-2 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                                                                title="Edit Rate Plan"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setRatePlanToDelete(plan._id)}
                                                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete Rate Plan"
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
                                    {filteredRatePlans.map((plan) => (
                                        <div
                                            key={plan._id}
                                            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{plan.name}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                            {plan.vehicle_class}
                                                        </span>
                                                        <span
                                                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${plan.active
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-red-100 text-red-800"
                                                                }`}
                                                        >
                                                            {plan.active ? "ACTIVE" : "INACTIVE"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => openViewModal(plan)}
                                                        className="p-1.5 hover:bg-gray-100 rounded-lg"
                                                    >
                                                        <Eye className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(plan)}
                                                        className="p-1.5 hover:bg-gray-100 rounded-lg"
                                                    >
                                                        <Edit className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-3 mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <DollarSign className="w-4 h-4" />
                                                    <span className="font-bold">{formatCurrency(plan.daily_rate, plan.currency)}</span>
                                                    <span className="text-gray-400">/ day</span>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Building className="w-4 h-4" />
                                                    <span className="truncate">{getBranchName(plan.branch_id)}</span>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-xs">
                                                        {plan.valid_from ? formatDate(plan.valid_from) : "Always valid"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                                {plan.createdAt && (
                                                    <div className="text-xs text-gray-500">
                                                        {formatDate(plan.createdAt)}
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setRatePlanToDelete(plan._id)}
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

            {/* View Rate Plan Details Modal */}
            {isViewModalOpen && selectedRatePlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsViewModalOpen(false)}
                    />
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Rate Plan Details</h2>
                                <p className="text-sm text-gray-600">View rate plan information</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setIsViewModalOpen(false);
                                        openEditModal(selectedRatePlan);
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
                                    {/* Basic Information */}
                                    <div className="bg-gray-50 rounded-lg p-5">
                                        <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                                            Basic Information
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-gray-500">Rate Plan Name</p>
                                                <p className="text-lg font-bold text-gray-900">{selectedRatePlan.name}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-500">Status</p>
                                                    <span
                                                        className={`px-3 py-1 text-sm font-medium rounded-full ${selectedRatePlan.active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                            }`}
                                                    >
                                                        {selectedRatePlan.active ? "ACTIVE" : "INACTIVE"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Currency</p>
                                                    <p className="text-sm font-mono text-gray-900 bg-gray-100 px-3 py-1.5 rounded inline-block">
                                                        {selectedRatePlan.currency}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedRatePlan.notes && (
                                                <div>
                                                    <p className="text-xs text-gray-500">Notes</p>
                                                    <p className="text-sm text-gray-700 mt-1">{selectedRatePlan.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rates */}
                                    <div className="bg-gray-50 rounded-lg p-5">
                                        <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                                            Base Rates
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                <p className="text-xs text-gray-500">Daily Rate</p>
                                                <p className="text-xl font-bold text-gray-900">
                                                    {formatCurrency(selectedRatePlan.daily_rate, selectedRatePlan.currency)}
                                                </p>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                <p className="text-xs text-gray-500">Weekly Rate</p>
                                                <p className="text-xl font-bold text-gray-900">
                                                    {selectedRatePlan.weekly_rate 
                                                        ? formatCurrency(selectedRatePlan.weekly_rate, selectedRatePlan.currency)
                                                        : "N/A"}
                                                </p>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                <p className="text-xs text-gray-500">Monthly Rate</p>
                                                <p className="text-xl font-bold text-gray-900">
                                                    {selectedRatePlan.monthly_rate 
                                                        ? formatCurrency(selectedRatePlan.monthly_rate, selectedRatePlan.currency)
                                                        : "N/A"}
                                                </p>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                <p className="text-xs text-gray-500">Weekend Rate</p>
                                                <p className="text-xl font-bold text-gray-900">
                                                    {selectedRatePlan.weekend_rate 
                                                        ? formatCurrency(selectedRatePlan.weekend_rate, selectedRatePlan.currency)
                                                        : "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Applicability */}
                                    <div className="bg-gray-50 rounded-lg p-5">
                                        <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                                            Applicability
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-gray-500">Branch</p>
                                                <p className="text-gray-900 font-medium">{getBranchName(selectedRatePlan.branch_id)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Vehicle Class</p>
                                                <p className="text-gray-900 font-medium">{selectedRatePlan.vehicle_class}</p>
                                            </div>
                                            {selectedRatePlan.vehicle_model_id && (
                                                <div>
                                                    <p className="text-xs text-gray-500">Vehicle Model</p>
                                                    <p className="text-gray-900 font-medium">{getVehicleModelName(selectedRatePlan.vehicle_model_id)}</p>
                                                </div>
                                            )}
                                            {selectedRatePlan.vehicle_id && (
                                                <div>
                                                    <p className="text-xs text-gray-500">Vehicle Unit</p>
                                                    <p className="text-gray-900 font-medium">{getVehicleUnitName(selectedRatePlan.vehicle_id)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    {/* Validity Period */}
                                    <div className="bg-gray-50 rounded-lg p-5">
                                        <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                                            Validity Period
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-500">Valid From</p>
                                                    <p className="text-gray-900">
                                                        {selectedRatePlan.valid_from ? formatDate(selectedRatePlan.valid_from) : "Immediately"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Valid To</p>
                                                    <p className="text-gray-900">
                                                        {selectedRatePlan.valid_to ? formatDate(selectedRatePlan.valid_to) : "No expiration"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Seasonal Overrides */}
                                    {selectedRatePlan.seasonal_overrides && selectedRatePlan.seasonal_overrides.length > 0 && (
                                        <div className="bg-gray-50 rounded-lg p-5">
                                            <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                                                Seasonal Overrides
                                            </h4>
                                            <div className="space-y-4">
                                                {selectedRatePlan.seasonal_overrides.map((override, index) => (
                                                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h5 className="font-medium text-gray-900">{override.season.name}</h5>
                                                        </div>
                                                        <div className="text-sm text-gray-600 mb-3">
                                                            {formatDate(override.season.start)} - {formatDate(override.season.end)}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {override.daily_rate && (
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Daily Rate</p>
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        {formatCurrency(override.daily_rate, selectedRatePlan.currency)}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {override.weekly_rate && (
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Weekly Rate</p>
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        {formatCurrency(override.weekly_rate, selectedRatePlan.currency)}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {override.monthly_rate && (
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Monthly Rate</p>
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        {formatCurrency(override.monthly_rate, selectedRatePlan.currency)}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {override.weekend_rate && (
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Weekend Rate</p>
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        {formatCurrency(override.weekend_rate, selectedRatePlan.currency)}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Taxes */}
                                    {selectedRatePlan.taxes && selectedRatePlan.taxes.length > 0 && (
                                        <div className="bg-gray-50 rounded-lg p-5">
                                            <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                                                Taxes
                                            </h4>
                                            <div className="space-y-3">
                                                {selectedRatePlan.taxes.map((tax, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{tax.code}</p>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700">{tax.rate}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Fees */}
                                    {selectedRatePlan.fees && selectedRatePlan.fees.length > 0 && (
                                        <div className="bg-gray-50 rounded-lg p-5">
                                            <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                                                Fees
                                            </h4>
                                            <div className="space-y-3">
                                                {selectedRatePlan.fees.map((fee, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{fee.code}</p>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {formatCurrency(fee.amount, selectedRatePlan.currency)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Meta Information */}
                                    <div className="bg-gray-50 rounded-lg p-5">
                                        <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                                            Meta Information
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-500">Rate Plan ID</p>
                                                <p className="text-xs font-mono text-gray-600 break-all">
                                                    {selectedRatePlan._id}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                {selectedRatePlan.createdAt && (
                                                    <div>
                                                        <p className="text-xs text-gray-500">Created</p>
                                                        <p className="text-sm text-gray-900">{formatDate(selectedRatePlan.createdAt)}</p>
                                                    </div>
                                                )}
                                                {selectedRatePlan.updatedAt && (
                                                    <div>
                                                        <p className="text-xs text-gray-500">Last Updated</p>
                                                        <p className="text-sm text-gray-900">{formatDate(selectedRatePlan.updatedAt)}</p>
                                                    </div>
                                                )}
                                            </div>
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

            {/* Add/Edit Rate Plan Modal */}
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

                    {/* Side Panel - Widened for better UX */}
                    <div
                        className={`absolute inset-y-0 right-0 flex max-w-full transition-transform duration-300 ease-in-out ${isAddModalOpen || isEditModalOpen ? "translate-x-0" : "translate-x-full"
                            }`}
                    >
                        <div className="relative w-screen max-w-5xl">
                            <div className="flex flex-col h-full bg-white shadow-xl">
                                {/* Header */}
                                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800">
                                                {isEditModalOpen ? "Edit Rate Plan" : "Add New Rate Plan"}
                                            </h2>
                                            <p className="text-sm text-gray-600">
                                                {isEditModalOpen
                                                    ? "Update rate plan information"
                                                    : "Create a new rate plan"}
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
                                <div className="flex-1 overflow-y-auto px-8 py-6">
                                    <div className="space-y-8">
                                        {/* Basic Information */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                                Basic Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Rate Plan Name <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({ ...prev, name: e.target.value }))
                                                        }
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                        placeholder="Summer Special Rate"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Currency <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={formData.currency}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({ ...prev, currency: e.target.value }))
                                                        }
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    >
                                                        <option value="USD">USD ($)</option>
                                                        <option value="EUR">EUR (€)</option>
                                                        <option value="GBP">GBP (£)</option>
                                                        <option value="CAD">CAD ($)</option>
                                                        <option value="AUD">AUD ($)</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Notes
                                                </label>
                                                <textarea
                                                    value={formData.notes}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({ ...prev, notes: e.target.value }))
                                                    }
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="Additional information about this rate plan"
                                                    rows={3}
                                                />
                                            </div>
                                        </div>

                                        {/* Branch Selection */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                                Branch
                                            </h3>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Select Branch <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={formData.branch_id}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({ ...prev, branch_id: e.target.value }))
                                                    }
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    required
                                                >
                                                    <option value="">Select a branch</option>
                                                    {branches.map((branch) => (
                                                        <option key={branch._id} value={branch._id}>
                                                            {branch.name} - {branch.code}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Applicability Type */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                                Applicability Type
                                            </h3>
                                            <div className="grid grid-cols-3 gap-4">
                                                {ratePlanTypes.map((type) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedRatePlanType(type);
                                                            // Clear other fields when changing type
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                vehicle_class: type === "vehicle_class" ? prev.vehicle_class : "",
                                                                vehicle_model_id: type === "vehicle_model" ? prev.vehicle_model_id : null,
                                                                vehicle_id: type === "vehicle_unit" ? prev.vehicle_id : null,
                                                            }));
                                                        }}
                                                        className={`p-4 border rounded-lg transition-all ${selectedRatePlanType === type
                                                                ? "border-[#1EA2E4] bg-[#1EA2E4]/10"
                                                                : "border-gray-300 hover:border-gray-400"
                                                            }`}
                                                    >
                                                        <div className="flex flex-col items-center gap-2">
                                                            {type === "vehicle_class" && (
                                                                <Layers className="w-6 h-6 text-gray-600" />
                                                            )}
                                                            {type === "vehicle_model" && (
                                                                <Car className="w-6 h-6 text-gray-600" />
                                                            )}
                                                            {type === "vehicle_unit" && (
                                                                <Package className="w-6 h-6 text-gray-600" />
                                                            )}
                                                            <span className="text-sm font-medium capitalize">
                                                                {type.replace("_", " ")}
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Applicability Selection */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                                Applicability
                                            </h3>
                                            {selectedRatePlanType === "vehicle_class" && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Vehicle Class <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={formData.vehicle_class}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({ ...prev, vehicle_class: e.target.value }))
                                                        }
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    >
                                                        {vehicleClasses.map((vehicleClass) => (
                                                            <option key={vehicleClass} value={vehicleClass}>
                                                                {vehicleClass.charAt(0).toUpperCase() + vehicleClass.slice(1)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {selectedRatePlanType === "vehicle_model" && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Vehicle Model <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={formData.vehicle_model_id || ""}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({ ...prev, vehicle_model_id: e.target.value }))
                                                        }
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    >
                                                        <option value="">Select a vehicle model</option>
                                                        {vehicleModels.map((model) => (
                                                            <option key={model._id} value={model._id}>
                                                                {model.make} {model.model} {model.year} ({model.class})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {selectedRatePlanType === "vehicle_unit" && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Vehicle Unit <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={formData.vehicle_id || ""}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({ ...prev, vehicle_id: e.target.value }))
                                                        }
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    >
                                                        <option value="">Select a vehicle unit</option>
                                                        {vehicleUnits.map((unit) => (
                                                            <option key={unit._id} value={unit._id}>
                                                                {unit.vin} - {unit.plate_number}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Base Rates */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                                Base Rates
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Daily Rate <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                            {formData.currency === 'USD' ? '$' : 
                                                             formData.currency === 'EUR' ? '€' : 
                                                             formData.currency === 'GBP' ? '£' : '$'}
                                                        </span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={formData.daily_rate}
                                                            onChange={(e) =>
                                                                setFormData((prev) => ({ ...prev, daily_rate: e.target.value }))
                                                            }
                                                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                            placeholder="0.00"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Weekly Rate
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                            {formData.currency === 'USD' ? '$' : 
                                                             formData.currency === 'EUR' ? '€' : 
                                                             formData.currency === 'GBP' ? '£' : '$'}
                                                        </span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={formData.weekly_rate}
                                                            onChange={(e) =>
                                                                setFormData((prev) => ({ ...prev, weekly_rate: e.target.value }))
                                                            }
                                                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                            placeholder="Optional"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Monthly Rate
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                            {formData.currency === 'USD' ? '$' : 
                                                             formData.currency === 'EUR' ? '€' : 
                                                             formData.currency === 'GBP' ? '£' : '$'}
                                                        </span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={formData.monthly_rate}
                                                            onChange={(e) =>
                                                                setFormData((prev) => ({ ...prev, monthly_rate: e.target.value }))
                                                            }
                                                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                            placeholder="Optional"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Weekend Rate
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                            {formData.currency === 'USD' ? '$' : 
                                                             formData.currency === 'EUR' ? '€' : 
                                                             formData.currency === 'GBP' ? '£' : '$'}
                                                        </span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={formData.weekend_rate}
                                                            onChange={(e) =>
                                                                setFormData((prev) => ({ ...prev, weekend_rate: e.target.value }))
                                                            }
                                                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                            placeholder="Optional"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Validity Period */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                                Validity Period
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Valid From
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={formData.valid_from}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({ ...prev, valid_from: e.target.value }))
                                                        }
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Valid To (Optional)
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={formData.valid_to || ""}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({ ...prev, valid_to: e.target.value || null }))
                                                        }
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Seasonal Overrides */}
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    Seasonal Overrides
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={addSeasonalOverride}
                                                    className="text-sm text-[#1EA2E4] hover:text-[#1A8BC9] font-medium flex items-center gap-1"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add Override
                                                </button>
                                            </div>
                                            {formData.seasonal_overrides?.map((override, index) => (
                                                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <h4 className="font-medium text-gray-700">Seasonal Override #{index + 1}</h4>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSeasonalOverride(index)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Season Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={override.season.name}
                                                                onChange={(e) =>
                                                                    handleSeasonalOverrideChange(index, 'season', `name.${e.target.value}`)
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1EA2E4]"
                                                                placeholder="Summer, Winter, etc."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Start Date
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={override.season.start}
                                                                onChange={(e) =>
                                                                    handleSeasonalOverrideChange(index, 'season', `start.${e.target.value}`)
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1EA2E4]"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                End Date
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={override.season.end}
                                                                onChange={(e) =>
                                                                    handleSeasonalOverrideChange(index, 'season', `end.${e.target.value}`)
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1EA2E4]"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Daily Rate
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={override.daily_rate || ""}
                                                                onChange={(e) =>
                                                                    handleSeasonalOverrideChange(index, 'daily_rate', e.target.value)
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1EA2E4]"
                                                                placeholder="Override"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Weekly Rate
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={override.weekly_rate || ""}
                                                                onChange={(e) =>
                                                                    handleSeasonalOverrideChange(index, 'weekly_rate', e.target.value)
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1EA2E4]"
                                                                placeholder="Override"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Monthly Rate
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={override.monthly_rate || ""}
                                                                onChange={(e) =>
                                                                    handleSeasonalOverrideChange(index, 'monthly_rate', e.target.value)
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1EA2E4]"
                                                                placeholder="Override"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Weekend Rate
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={override.weekend_rate || ""}
                                                                onChange={(e) =>
                                                                    handleSeasonalOverrideChange(index, 'weekend_rate', e.target.value)
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1EA2E4]"
                                                                placeholder="Override"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!formData.seasonal_overrides || formData.seasonal_overrides.length === 0) && (
                                                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                                    <Tag className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-gray-500">No seasonal overrides added</p>
                                                    <p className="text-sm text-gray-400 mt-1">Click "Add Override" to add seasonal pricing</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Taxes */}
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    Taxes
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={addTax}
                                                    className="text-sm text-[#1EA2E4] hover:text-[#1A8BC9] font-medium flex items-center gap-1"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add Tax
                                                </button>
                                            </div>
                                            {formData.taxes?.map((tax, index) => (
                                                <div key={index} className="flex items-center gap-4 mb-3">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            value={tax.code}
                                                            onChange={(e) =>
                                                                handleTaxChange(index, 'code', e.target.value)
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1EA2E4]"
                                                            placeholder="Tax code (e.g., VAT, GST)"
                                                        />
                                                    </div>
                                                    <div className="relative w-32">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            max="100"
                                                            value={tax.rate}
                                                            onChange={(e) =>
                                                                handleTaxChange(index, 'rate', e.target.value)
                                                            }
                                                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1EA2E4]"
                                                            placeholder="Rate"
                                                        />
                                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTax(index)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            {(!formData.taxes || formData.taxes.length === 0) && (
                                                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                                                    <p className="text-gray-500">No taxes added</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Fees */}
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    Fees
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={addFee}
                                                    className="text-sm text-[#1EA2E4] hover:text-[#1A8BC9] font-medium flex items-center gap-1"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add Fee
                                                </button>
                                            </div>
                                            {formData.fees?.map((fee, index) => (
                                                <div key={index} className="flex items-center gap-4 mb-3">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            value={fee.code}
                                                            onChange={(e) =>
                                                                handleFeeChange(index, 'code', e.target.value)
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1EA2E4]"
                                                            placeholder="Fee code (e.g., Cleaning, Airport)"
                                                        />
                                                    </div>
                                                    <div className="relative w-48">
                                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                            {formData.currency === 'USD' ? '$' : 
                                                             formData.currency === 'EUR' ? '€' : 
                                                             formData.currency === 'GBP' ? '£' : '$'}
                                                        </span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={fee.amount}
                                                            onChange={(e) =>
                                                                handleFeeChange(index, 'amount', e.target.value)
                                                            }
                                                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1EA2E4]"
                                                            placeholder="Amount"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFee(index)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            {(!formData.fees || formData.fees.length === 0) && (
                                                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                                                    <p className="text-gray-500">No fees added</p>
                                                </div>
                                            )}
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
                                                        ? "This rate plan is active and available"
                                                        : "This rate plan is inactive and hidden"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-8 py-5">
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => {
                                                setIsAddModalOpen(false);
                                                setIsEditModalOpen(false);
                                            }}
                                            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={isEditModalOpen ? handleUpdateRatePlan : handleAddRatePlan}
                                            disabled={!formData.name || !formData.branch_id || !formData.daily_rate}
                                            className="px-5 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            {isEditModalOpen ? "Update Rate Plan" : "Create Rate Plan"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {ratePlanToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setRatePlanToDelete(null)}
                    />
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Delete Rate Plan</h3>
                                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                                </div>
                            </div>

                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete this rate plan? This will remove all rate plan
                                information and cannot be recovered.
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setRatePlanToDelete(null)}
                                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteRatePlan(ratePlanToDelete)}
                                    className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    Delete Rate Plan
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

export default RatePlans;