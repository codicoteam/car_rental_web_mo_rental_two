import React, { useState, useEffect, useCallback } from "react";
import ManagerSidebar from "../../../components/ManagerSideBar";
import {
  fetchAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getErrorDisplay,
  type IPromoCode,
  type CreatePromoCodePayload,
  type UpdatePromoCodePayload,
  type PromoCodeType,
  type IPromoConstraints,
  type VehicleClass,
} from "../../../Services/adminAndManager/promo_code_service";
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
 
  Calendar,
 
  Percent,
 
  RefreshCw,
 
  Save,
  Ticket,
 
  Hash,
  Copy,
 
} from "lucide-react";

const PromoCodesPage: React.FC = () => {
  // State
  const [promoCodes, setPromoCodes] = useState<IPromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");

  // Modal states
  const [selectedPromoCode, setSelectedPromoCode] = useState<IPromoCode | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [promoCodeToDelete, setPromoCodeToDelete] = useState<string | null>(null);

  // Dropdown data
  const [branches, setBranches] = useState<IBranch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

    const branchManagerId = localStorage.getItem('manager_branch_id');

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
  const initialFormData: CreatePromoCodePayload = {
    code: "",
    type: "percent",
    value: 0,
    currency: "USD",
    active: true,
    valid_from: "",
    valid_to: null,
    usage_limit: null,
    constraints: {
      allowed_classes: [],
      min_days: undefined,
      branch_ids: [],
    },
    notes: "",
  };

  // Form states
  const [formData, setFormData] = useState<CreatePromoCodePayload>(initialFormData);
  const [generatedCode, setGeneratedCode] = useState<string>("");

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Sidebar state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load promo codes
  const loadPromoCodes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAllPromoCodes();
      setPromoCodes(response.data);
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      setError(errorDisplay.message || "Failed to load promo codes");
      showSnackbar(errorDisplay.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load dropdown data
  const loadDropdownData = useCallback(async () => {
    try {
      const branchesResponse = await fetchBranches();
      setBranches(branchesResponse.data);
    } catch (err) {
      console.error("Failed to load dropdown data:", err);
      showSnackbar("Failed to load branches", "error");
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPromoCodes();
    loadDropdownData();
  }, [loadPromoCodes, loadDropdownData]);

  // Snackbar helper
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Generate promo code
  const generatePromoCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCode(code);
    setFormData((prev) => ({ ...prev, code }));
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSnackbar("Copied to clipboard", "success");
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setGeneratedCode("");
  };

  // Open add modal with empty form
  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  // Open edit modal with promo code data
  const openEditModal = (promoCode: IPromoCode) => {
    setSelectedPromoCode(promoCode);
    
    setFormData({
      code: promoCode.code,
      type: promoCode.type,
      value: promoCode.value,
      currency: promoCode.currency || "USD",
      active: promoCode.active || true,
      valid_from: promoCode.valid_from || "",
      valid_to: promoCode.valid_to || null,
      usage_limit: promoCode.usage_limit || null,
      constraints: {
        allowed_classes: promoCode.constraints?.allowed_classes || [],
        min_days: promoCode.constraints?.min_days || undefined,
        branch_ids: promoCode.constraints?.branch_ids || [],
      },
      notes: promoCode.notes || "",
    });
    
    setIsEditModalOpen(true);
  };

  // Open view modal
  const openViewModal = (promoCode: IPromoCode) => {
    setSelectedPromoCode(promoCode);
    setIsViewModalOpen(true);
  };



  // Handle add promo code
  // const handleAddPromoCode = async () => {
  //   try {
  //     setIsSubmitting(true);
  //     const payload: CreatePromoCodePayload = {
  //       ...formData,
  //       // Ensure currency is included for fixed type
  //       currency: formData.type === "fixed" ? (formData.currency || "USD") : undefined,
        
  //     };

  //     await createPromoCode(payload);
  //     showSnackbar("Promo code created successfully", "success");
  //     setIsAddModalOpen(false);
  //     resetForm();
  //     loadPromoCodes();
  //   } 
  //   catch (err) {
  //     const errorDisplay = getErrorDisplay(err);
  //     showSnackbar(errorDisplay.message, "error");
  //   }
  //   finally{
  //        setIsSubmitting(false);
  //   }
  // };

  // Handle add promo code
const handleAddPromoCode = async () => {
  try {
    setIsSubmitting(true);
    
   
    
    if (!branchManagerId) {
      showSnackbar("Branch manager ID not found. Please login again.", "error");
      setIsSubmitting(false);
      return;
    }
    
    const payload: CreatePromoCodePayload = {
      code: formData.code,
      type: formData.type,
      value: formData.value,
      currency: formData.type === "fixed" ? (formData.currency || "USD") : undefined,
      active: formData.active,
      valid_from: formData.valid_from || undefined,
      valid_to: formData.valid_to,
      usage_limit: formData.usage_limit,
      constraints: {
        allowed_classes: formData.constraints?.allowed_classes || [],
        min_days: formData.constraints?.min_days,
        
        branch_ids: [branchManagerId], // branchManagerId is guaranteed to be string here
      },
      notes: formData.notes,
    };

    await createPromoCode(payload);
    showSnackbar("Promo code created successfully", "success");
    setIsAddModalOpen(false);
    resetForm();
    loadPromoCodes();
  } 
  catch (err) {
    const errorDisplay = getErrorDisplay(err);
    showSnackbar(errorDisplay.message, "error");
  }
  finally {
    setIsSubmitting(false);
  }
};

  // Handle update promo code
  // const handleUpdatePromoCode = async () => {
  //   if (!selectedPromoCode) return;

  //   try {
  //     setIsSubmitting(true);
  //     const payload: UpdatePromoCodePayload = {
  //       ...formData,
  //       currency: formData.type === "fixed" ? (formData.currency || "USD") : undefined,
  //     };

  //     await updatePromoCode(selectedPromoCode._id, payload);
  //     showSnackbar("Promo code updated successfully", "success");
  //     setIsEditModalOpen(false);
  //     setSelectedPromoCode(null);
  //     loadPromoCodes();
  //   }
  //    catch (err) {
  //     const errorDisplay = getErrorDisplay(err);
  //     showSnackbar(errorDisplay.message, "error");
  //   }
  //   finally{
  //        setIsSubmitting(false);
  //   }
  // };

  // Handle update promo code
const handleUpdatePromoCode = async () => {
  if (!selectedPromoCode) return;

  try {
    setIsSubmitting(true);
    
       
    if (!branchManagerId) {
      showSnackbar("Branch manager ID not found. Please login again.", "error");
      setIsSubmitting(false);
      return;
    }
    
    const payload: UpdatePromoCodePayload = {
      code: formData.code,
      type: formData.type,
      value: formData.value,
      currency: formData.type === "fixed" ? (formData.currency || "USD") : undefined,
      active: formData.active,
      valid_from: formData.valid_from || undefined,
      valid_to: formData.valid_to,
      usage_limit: formData.usage_limit,
      constraints: {
        allowed_classes: formData.constraints?.allowed_classes || [],
        min_days: formData.constraints?.min_days,
        
        branch_ids: [branchManagerId], 
      },
      notes: formData.notes,
    };

    await updatePromoCode(selectedPromoCode._id, payload);
    showSnackbar("Promo code updated successfully", "success");
    setIsEditModalOpen(false);
    setSelectedPromoCode(null);
    loadPromoCodes();
  }
  catch (err) {
    const errorDisplay = getErrorDisplay(err);
    showSnackbar(errorDisplay.message, "error");
  }
  finally {
    setIsSubmitting(false);
  }
};

  // Handle delete promo code
  const handleDeletePromoCode = async (promoCodeId: string) => {
    try {
      await deletePromoCode(promoCodeId);
      showSnackbar("Promo code deleted successfully", "success");
      setPromoCodeToDelete(null);
      loadPromoCodes();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Handle constraint changes
  const handleConstraintChange = (
    field: keyof IPromoConstraints,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      constraints: {
        ...prev.constraints,
        [field]: value,
      },
    }));
  };

  // Toggle vehicle class in constraints
  const toggleVehicleClass = (vehicleClass: VehicleClass) => {
    setFormData((prev) => {
      const currentClasses = prev.constraints?.allowed_classes || [];
      const newClasses = currentClasses.includes(vehicleClass)
        ? currentClasses.filter((c) => c !== vehicleClass)
        : [...currentClasses, vehicleClass];

      return {
        ...prev,
        constraints: {
          ...prev.constraints,
          allowed_classes: newClasses,
        },
      };
    });
  };

  // Toggle branch in constraints
  const toggleBranch = (branchId: string) => {
    setFormData((prev) => {
      const currentBranches = prev.constraints?.branch_ids || [];
      const newBranches = currentBranches.includes(branchId)
        ? currentBranches.filter((id) => id !== branchId)
        : [...currentBranches, branchId];

      return {
        ...prev,
        constraints: {
          ...prev.constraints,
          branch_ids: newBranches,
        },
      };
    });
  };

  // Filter promo codes
  const filteredPromoCodes = promoCodes.filter((code) => {
    const matchesSearch =
      searchTerm === "" ||
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (code.notes && code.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && code.active) ||
      (statusFilter === "inactive" && !code.active);

    const matchesType =
      typeFilter === "all" ||
      code.type === typeFilter;

    const matchesBranch = 
      branchFilter === "all" ||
      (code.constraints?.branch_ids && code.constraints.branch_ids.includes(branchFilter)) ||
      (!code.constraints?.branch_ids || code.constraints.branch_ids.length === 0);

    return matchesSearch && matchesStatus && matchesType && matchesBranch;
  });

  // Get unique branches for filter
  const uniqueBranches = branches.filter(branch => 
    promoCodes.some(code => 
      code.constraints?.branch_ids?.includes(branch._id) ||
      !code.constraints?.branch_ids ||
      code.constraints.branch_ids.length === 0
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
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate usage percentage
  const getUsagePercentage = (code: IPromoCode) => {
    if (!code.usage_limit || code.usage_limit <= 0) return null;
    const used = code.used_count || 0;
    return Math.min(100, (used / code.usage_limit) * 100);
  };

  // Check if promo code is valid now
  const isValidNow = (code: IPromoCode) => {
    if (!code.active) return false;
    
    const now = new Date();
    if (code.valid_from) {
      const validFrom = new Date(code.valid_from);
      if (now < validFrom) return false;
    }
    
    if (code.valid_to) {
      const validTo = new Date(code.valid_to);
      if (now > validTo) return false;
    }
    
    if (code.usage_limit && code.usage_limit > 0) {
      const used = code.used_count || 0;
      if (used >= code.usage_limit) return false;
    }
    
    return true;
  };

  // Get display value for promo code
  const getDisplayValue = (code: IPromoCode) => {
    if (code.type === "percent") {
      return `${code.value}% OFF`;
    } else {
      return `${formatCurrency(code.value, code.currency || "USD")} OFF`;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content - Scrollable Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
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
                <h1 className="text-2xl font-bold text-gray-800">Promo Codes Management</h1>
                <p className="text-sm text-gray-600 mt-1">Manage promotional codes and discounts</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                Total: <span className="font-semibold">{promoCodes.length}</span> codes
              </div>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Add Promo Code</span>
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
                      placeholder="Search promo codes by code or notes..."
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
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                    >
                      <option value="all">All Types</option>
                      <option value="percent">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                    <Tag className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Promo Codes Grid/Table */}
          <div className="px-6 pb-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4"></div>
                  <p className="text-gray-600">Loading promo codes...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-red-600 text-center mb-4">{error}</p>
                <button
                  onClick={loadPromoCodes}
                  className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            ) : filteredPromoCodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <Ticket className="w-20 h-20 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No promo codes found</p>
                <p className="text-gray-400 text-center mb-6">
                  {searchTerm || statusFilter !== "all" || typeFilter !== "all" || branchFilter !== "all"
                    ? "Try adjusting your filters or search terms"
                    : "Get started by adding your first promo code"}
                </p>
                {!searchTerm && statusFilter === "all" && typeFilter === "all" && branchFilter === "all" && (
                  <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors"
                  >
                    Add Promo Code
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Grid */}
                <div className="hidden lg:block">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPromoCodes.map((code) => (
                      <div
                        key={code._id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="p-6">
                          {/* Promo Code Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="relative">
                                  <h3 className="text-lg font-bold text-gray-900 font-mono">{code.code}</h3>
                                  {/* <button
                                    onClick={() => copyToClipboard(code.code)}
                                    className="absolute -right-8 top-0 p-1 text-gray-400 hover:text-[#1EA2E4] transition-colors"
                                    title="Copy code"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button> */}
                                </div>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${code.active
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                    }`}
                                >
                                  {code.active ? "ACTIVE" : "INACTIVE"}
                                </span>
                                {isValidNow(code) && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                    VALID NOW
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Tag className="w-4 h-4" />
                                <span className="font-medium capitalize">{code.type}</span>
                                <span className="text-gray-400">•</span>
                                <span className="font-bold text-[#1EA2E4]">
                                  {getDisplayValue(code)}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => openViewModal(code)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-5 h-5 text-gray-600" />
                            </button>
                          </div>

                          {/* Usage Stats */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-500">Usage</span>
                              <span className="text-xs font-medium text-gray-700">
                                {code.used_count || 0} / {code.usage_limit || "∞"}
                              </span>
                            </div>
                            {code.usage_limit && code.usage_limit > 0 && (
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-[#1EA2E4] h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${getUsagePercentage(code)}%` }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Validity Period */}
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {code.valid_from ? formatDate(code.valid_from) : "Immediately"}
                                {code.valid_to && ` - ${formatDate(code.valid_to)}`}
                              </span>
                            </div>
                            
                            {/* Constraints Summary */}
                            <div className="flex flex-wrap gap-2">
                              {code.constraints?.allowed_classes && code.constraints.allowed_classes.length > 0 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                  {code.constraints.allowed_classes.length} vehicle classes
                                </span>
                              )}
                              {code.constraints?.min_days && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                  Min {code.constraints.min_days} days
                                </span>
                              )}
                              {code.constraints?.branch_ids && code.constraints.branch_ids.length > 0 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                  {code.constraints.branch_ids.length} branches
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div className="text-xs text-gray-500">
                              {code.createdAt && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(code.createdAt)}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(code)}
                                className="p-2 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                                title="Edit Promo Code"
                              >
                                <Edit className="w-4 h-4" />
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
                  {filteredPromoCodes.map((code) => (
                    <div
                      key={code._id}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 font-mono">{code.code}</h3>
                            <button
                              onClick={() => copyToClipboard(code.code)}
                              className="p-1 text-gray-400 hover:text-[#1EA2E4]"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#1EA2E4]">
                              {getDisplayValue(code)}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${code.active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                                }`}
                            >
                              {code.active ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openViewModal(code)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => openEditModal(code)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {code.valid_from ? formatDate(code.valid_from) : "Always valid"}
                            </span>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600">
                          <div className="flex items-center justify-between">
                            <span>Usage:</span>
                            <span className="font-medium">
                              {code.used_count || 0} / {code.usage_limit || "∞"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        {code.createdAt && (
                          <div className="text-xs text-gray-500">
                            {formatDate(code.createdAt)}
                          </div>
                        )}
                        <button
                          onClick={() => setPromoCodeToDelete(code._id)}
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

      {/* View Promo Code Details Modal */}
      {isViewModalOpen && selectedPromoCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Promo Code Details</h2>
                <p className="text-sm text-gray-600">View promo code information</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedPromoCode);
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
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Basic Information
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Promo Code</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-gray-900 font-mono">{selectedPromoCode.code}</p>
                          <button
                            onClick={() => copyToClipboard(selectedPromoCode.code)}
                            className="p-1 text-gray-400 hover:text-[#1EA2E4]"
                            title="Copy code"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <span
                          className={`px-3 py-1 text-sm font-medium rounded-full ${selectedPromoCode.active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                            }`}
                        >
                          {selectedPromoCode.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{selectedPromoCode.type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Value</p>
                        <p className="text-lg font-bold text-[#1EA2E4]">
                          {getDisplayValue(selectedPromoCode)}
                        </p>
                      </div>
                    </div>

                    {selectedPromoCode.notes && (
                      <div>
                        <p className="text-xs text-gray-500">Notes</p>
                        <p className="text-sm text-gray-700 mt-1">{selectedPromoCode.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Usage Information */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Usage Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Used Count</p>
                      <p className="text-xl font-bold text-gray-900">{selectedPromoCode.used_count || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Usage Limit</p>
                      <p className="text-xl font-bold text-gray-900">
                        {selectedPromoCode.usage_limit || "Unlimited"}
                      </p>
                    </div>
                  </div>
                  
                  {selectedPromoCode.usage_limit && selectedPromoCode.usage_limit > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500">Usage Progress</span>
                        <span className="text-xs font-medium text-gray-700">
                          {Math.round(getUsagePercentage(selectedPromoCode) || 0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#1EA2E4] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getUsagePercentage(selectedPromoCode)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

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
                          {selectedPromoCode.valid_from ? formatDate(selectedPromoCode.valid_from) : "Immediately"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Valid To</p>
                        <p className="text-gray-900">
                          {selectedPromoCode.valid_to ? formatDate(selectedPromoCode.valid_to) : "No expiration"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        {isValidNow(selectedPromoCode) ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-medium text-green-700">
                              This promo code is currently valid
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <span className="text-sm font-medium text-red-700">
                              This promo code is not currently valid
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Constraints */}
                {selectedPromoCode.constraints && (
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                      Constraints & Restrictions
                    </h4>
                    <div className="space-y-4">
                      {selectedPromoCode.constraints.allowed_classes && 
                       selectedPromoCode.constraints.allowed_classes.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Allowed Vehicle Classes</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedPromoCode.constraints.allowed_classes.map((vehicleClass) => (
                              <span
                                key={vehicleClass}
                                className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                              >
                                {vehicleClass}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedPromoCode.constraints.min_days && (
                        <div>
                          <p className="text-xs text-gray-500">Minimum Rental Days</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedPromoCode.constraints.min_days} days
                          </p>
                        </div>
                      )}

                      {selectedPromoCode.constraints.branch_ids && 
                       selectedPromoCode.constraints.branch_ids.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Allowed Branches</p>
                          <div className="space-y-2">
                            {branches
                              .filter(branch => selectedPromoCode.constraints?.branch_ids?.includes(branch._id))
                              .map((branch) => (
                                <div key={branch._id} className="flex items-center gap-2 text-sm text-gray-700">
                                  <Building className="w-4 h-4" />
                                  <span>{branch.name} - {branch.code}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {(!selectedPromoCode.constraints.allowed_classes || 
                        selectedPromoCode.constraints.allowed_classes.length === 0) &&
                       (!selectedPromoCode.constraints.min_days) &&
                       (!selectedPromoCode.constraints.branch_ids || 
                        selectedPromoCode.constraints.branch_ids.length === 0) && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No constraints applied - valid for all vehicles and branches
                        </p>
                      )}
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
                      <p className="text-xs text-gray-500">Promo Code ID</p>
                      <p className="text-xs font-mono text-gray-600 break-all">
                        {selectedPromoCode._id}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedPromoCode.createdAt && (
                        <div>
                          <p className="text-xs text-gray-500">Created</p>
                          <p className="text-sm text-gray-900">{formatDate(selectedPromoCode.createdAt)}</p>
                        </div>
                      )}
                      {selectedPromoCode.updatedAt && (
                        <div>
                          <p className="text-xs text-gray-500">Last Updated</p>
                          <p className="text-sm text-gray-900">{formatDate(selectedPromoCode.updatedAt)}</p>
                        </div>
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

      {/* Add/Edit Promo Code Modal */}
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
            className={`absolute inset-y-0 right-0 flex max-w-full transition-transform duration-300 ease-in-out ${isAddModalOpen || isEditModalOpen ? "translate-x-0" : "translate-x-full"
              }`}
          >
            <div className="relative w-screen max-w-4xl">
              <div className="flex flex-col h-full bg-white shadow-xl">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {isEditModalOpen ? "Edit Promo Code" : "Add New Promo Code"}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {isEditModalOpen
                          ? "Update promo code information"
                          : "Create a new promotional code"}
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
                            Promo Code <span className="text-red-500">*</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={formData.code}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                              }
                              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent font-mono"
                              placeholder="WELCOME10"
                              required
                            />
                            <button
                              type="button"
                              onClick={generatePromoCode}
                              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
                            >
                              Generate
                            </button>
                          </div>
                          {generatedCode && (
                            <p className="text-xs text-gray-500 mt-2">
                              Generated code: <span className="font-mono">{generatedCode}</span>
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.type}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, type: e.target.value as PromoCodeType }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          >
                            <option value="percent">Percentage Discount</option>
                            <option value="fixed">Fixed Amount Discount</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {formData.type === "percent" ? "Discount Percentage" : "Discount Amount"} 
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            {formData.type === "percent" ? (
                              <>
                                <input
                                  type="number"
                                  min="0"
                                  max={formData.type === "percent" ? "100" : undefined}
                                  step="0.01"
                                  value={formData.value}
                                  onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))
                                  }
                                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                  placeholder="10"
                                  required
                                />
                                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              </>
                            ) : (
                              <>
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                  {formData.currency === 'USD' ? '$' : 
                                   formData.currency === 'EUR' ? '€' : 
                                   formData.currency === 'GBP' ? '£' : '$'}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={formData.value}
                                  onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))
                                  }
                                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                  placeholder="50.00"
                                  required
                                />
                              </>
                            )}
                          </div>
                        </div>
                        
                        {formData.type === "fixed" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Currency <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={formData.currency || "USD"}
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
                        )}
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
                          placeholder="Description or purpose of this promo code"
                          rows={2}
                        />
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
                            value={formData.valid_from || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, valid_from: e.target.value || undefined }))
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

                    {/* Usage Limit */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Usage Limit
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Usage Count (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.usage_limit || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({ 
                                ...prev, 
                                usage_limit: e.target.value ? parseInt(e.target.value) : null 
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                            placeholder="Leave empty for unlimited usage"
                          />
                          <Hash className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Leave empty for unlimited usage. Set a number to limit total redemptions.
                        </p>
                      </div>
                    </div>

                    {/* Constraints & Restrictions */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Constraints & Restrictions
                      </h3>
                      
                      {/* Vehicle Class Restrictions */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Allowed Vehicle Classes
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {vehicleClasses.map((vehicleClass) => (
                            <button
                              key={vehicleClass}
                              type="button"
                              onClick={() => toggleVehicleClass(vehicleClass)}
                              className={`px-4 py-2 rounded-lg border transition-colors ${formData.constraints?.allowed_classes?.includes(vehicleClass)
                                  ? "bg-[#1EA2E4] text-white border-[#1EA2E4]"
                                  : "bg-gray-100 text-gray-700 border-gray-300 hover:border-gray-400"
                                }`}
                            >
                              {vehicleClass.charAt(0).toUpperCase() + vehicleClass.slice(1)}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {formData.constraints?.allowed_classes?.length === 0 
                            ? "All vehicle classes allowed (leave empty for no restriction)"
                            : `Selected ${formData.constraints?.allowed_classes?.length} vehicle classes`
                          }
                        </p>
                      </div>
                      
                      {/* Minimum Days */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Rental Days (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.constraints?.min_days || ""}
                            onChange={(e) =>
                              handleConstraintChange("min_days", e.target.value ? parseInt(e.target.value) : undefined)
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                            placeholder="Leave empty for no minimum"
                          />
                          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* Branch Restrictions */}
                      {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Allowed Branches
                        </label>
                        {branches.length === 0 ? (
                          <p className="text-gray-500 text-sm">Loading branches...</p>
                        ) : (
                          <>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {branches.map((branch) => (
                                <button
                                  key={branch._id}
                                  type="button"
                                  onClick={() => toggleBranch(branch._id)}
                                  className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${formData.constraints?.branch_ids?.includes(branch._id)
                                      ? "bg-[#1EA2E4] text-white border-[#1EA2E4]"
                                      : "bg-gray-100 text-gray-700 border-gray-300 hover:border-gray-400"
                                    }`}
                                >
                                  <Building className="w-4 h-4" />
                                  {branch.name}
                                </button>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500">
                              {formData.constraints?.branch_ids?.length === 0 
                                ? "All branches allowed (leave empty for no restriction)"
                                : `Selected ${formData.constraints?.branch_ids?.length} branches`
                              }
                            </p>
                          </>
                        )}
                      </div> */}
                      {/* Branch Restrictions - REMOVED - Branch manager ID will be automatically included */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Branch (Auto-assigned from your profile)
                        </label>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span>This promo code will be automatically assigned to your branch</span>
                          </div>
                        </div>
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
                            ? "This promo code is active and available"
                            : "This promo code is inactive and hidden"}
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
                    {/* <button
                      onClick={isEditModalOpen ? handleUpdatePromoCode : handleAddPromoCode}
                      disabled={!formData.code || formData.value <= 0}
                      className="px-5 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isEditModalOpen ? "Update Promo Code" : "Create Promo Code"}
                    </button> */}
                    <button
                        onClick={isEditModalOpen ? handleUpdatePromoCode : handleAddPromoCode}
                        disabled={!formData.code || formData.value <= 0 || isSubmitting}
                        className="px-5 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[180px] justify-center"
                        >
                        {isSubmitting ? (
                            <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>{isEditModalOpen ? "Updating..." : "Creating..."}</span>
                            </>
                        ) : (
                            <>
                            <Save className="w-4 h-4" />
                            <span>{isEditModalOpen ? "Update Promo Code" : "Create Promo Code"}</span>
                            </>
                        )}
                        </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {promoCodeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setPromoCodeToDelete(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Promo Code</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this promo code? This will remove all promo code
                information and cannot be recovered.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPromoCodeToDelete(null)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePromoCode(promoCodeToDelete)}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Promo Code
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

export default PromoCodesPage;