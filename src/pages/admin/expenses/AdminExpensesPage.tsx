import React, { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../../../components/Sidebar";
import { supabase } from "../../../helpers/supa_base_client";
import {
  fetchExpenses,
  fetchExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense,
  submitExpense,
  approveExpense,
  rejectExpense,
  fetchBranches,
  fetchVehicleUnits,
  parseAmount,
  formatAmount,
  formatDate,
  getCategoryLabel,
  getCategoryIcon,
  EXPENSE_CATEGORIES,
  type IExpense,
  type IExpenseSummary,
  type IBranch,
  type IVehicleUnit,
  type ExpenseCategory,
  type ExpenseCurrency,
  type ExpenseStatus,
} from "../../../Services/adminAndManager/expenses_service";
import {
  LayoutDashboard,
  Plus,
  Search,
  Filter,
  ChevronDown,
  X,
  Check,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Upload,
  Trash2,
  Eye,
  RefreshCw,
  FileText,
  Building2,
  Car,
  User,
  Menu,
  Edit2,
  Send,
  XCircle,
  MoreVertical,
  Tag,
  Calendar,
  Banknote,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface StoredUser {
  _id?: string;
  id?: string;
  roles?: string[];
  full_name?: string;
  email?: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const STATUS_CONFIG: Record<
  ExpenseStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  draft: {
    label: "Draft",
    color: "text-gray-600",
    bg: "bg-gray-100",
    icon: <FileText className="w-3 h-3" />,
  },
  pending_approval: {
    label: "Pending Approval",
    color: "text-amber-700",
    bg: "bg-amber-100",
    icon: <Clock className="w-3 h-3" />,
  },
  approved: {
    label: "Approved",
    color: "text-green-700",
    bg: "bg-green-100",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  rejected: {
    label: "Rejected",
    color: "text-red-700",
    bg: "bg-red-100",
    icon: <XCircle className="w-3 h-3" />,
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  fuel: "text-orange-700 bg-orange-100",
  maintenance: "text-blue-700 bg-blue-100",
  insurance: "text-purple-700 bg-purple-100",
  cleaning: "text-teal-700 bg-teal-100",
  salaries: "text-indigo-700 bg-indigo-100",
  rent: "text-pink-700 bg-pink-100",
  utilities: "text-yellow-700 bg-yellow-100",
  fines: "text-red-700 bg-red-100",
  parking: "text-gray-600 bg-gray-100",
  licensing: "text-gray-600 bg-gray-100",
  marketing: "text-gray-600 bg-gray-100",
  office_supplies: "text-gray-600 bg-gray-100",
  bank_charges: "text-gray-600 bg-gray-100",
  tyres_parts: "text-gray-600 bg-gray-100",
  security: "text-gray-600 bg-gray-100",
  it_software: "text-gray-600 bg-gray-100",
  travel: "text-gray-600 bg-gray-100",
  meals: "text-gray-600 bg-gray-100",
  vehicle_acquisition: "text-gray-600 bg-gray-100",
  other: "text-gray-600 bg-gray-100",
};

function getBranchName(branch_id: IExpense["branch_id"]): string {
  if (!branch_id) return "-";
  if (typeof branch_id === "object" && branch_id !== null) {
    return (branch_id as { name?: string }).name ?? "-";
  }
  return "-";
}

function getSubmittedByName(submitted_by: IExpense["submitted_by"]): string {
  if (!submitted_by) return "-";
  if (typeof submitted_by === "object") {
    return (submitted_by as { full_name?: string; email?: string }).full_name ??
      (submitted_by as { email?: string }).email ?? "-";
  }
  return "-";
}

function getSubmittedById(submitted_by: IExpense["submitted_by"]): string {
  if (!submitted_by) return "";
  if (typeof submitted_by === "object") {
    return (submitted_by as { _id: string })._id ?? "";
  }
  return submitted_by as string;
}

// ─────────────────────────────────────────────
// Supabase Upload
// ─────────────────────────────────────────────
async function uploadReceipt(file: File): Promise<string> {
  const fileName = `receipts/${Date.now()}-${Math.random().toString(36).substr(2, 8)}-${file.name}`;
  const { error } = await supabase.storage
    .from("topics")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("topics").getPublicUrl(fileName);
  return data.publicUrl;
}

// ─────────────────────────────────────────────
// Default form state
// ─────────────────────────────────────────────
interface ExpenseForm {
  title: string;
  category: ExpenseCategory | "";
  amount: string;
  currency: ExpenseCurrency;
  date: string;
  description: string;
  branch_id: string;
  vehicle_id: string;
  tags: string;
  notes: string;
  receipt_images: string[];
  submitImmediately: boolean;
}

const DEFAULT_FORM: ExpenseForm = {
  title: "",
  category: "",
  amount: "",
  currency: "USD",
  date: new Date().toISOString().split("T")[0],
  description: "",
  branch_id: "",
  vehicle_id: "",
  tags: "",
  notes: "",
  receipt_images: [],
  submitImmediately: false,
};

// ─────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────
const AdminExpensesPage: React.FC = () => {
  const _auth = JSON.parse(localStorage.getItem("car_rental_auth") || "{}");
  const token: string = _auth?.token || "";
  const storedUser: StoredUser = _auth?.user || {};
  const userRole = storedUser.roles?.[0] || "";
  const userId = storedUser._id || storedUser.id || "";

  // ─── UI state ───
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // ─── Data state ───
  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [summary, setSummary] = useState<IExpenseSummary | null>(null);
  const [branches, setBranches] = useState<IBranch[]>([]);
  const [vehicles, setVehicles] = useState<IVehicleUnit[]>([]);

  // ─── Filters ───
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterBranchId, setFilterBranchId] = useState("");

  // ─── Modals ───
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<IExpense | null>(null);
  const [form, setForm] = useState<ExpenseForm>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSaving, setFormSaving] = useState(false);

  // ─── Reject modal ───
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  // ─── Detail drawer ───
  const [detailExpense, setDetailExpense] = useState<IExpense | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // ─── Snackbar ───
  const [snackbar, setSnackbar] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Upload state ───
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  const showSnack = useCallback((msg: string, type: "success" | "error" = "success") => {
    setSnackbar({ msg, type });
    if (snackTimer.current) clearTimeout(snackTimer.current);
    snackTimer.current = setTimeout(() => setSnackbar(null), 4000);
  }, []);

  const canApprove = ["admin", "manager"].includes(userRole);

  // ─────────────────────────────────────────────
  // Fetch data
  // ─────────────────────────────────────────────
  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;
      if (filterBranchId) params.branch_id = filterBranchId;
      const data = await fetchExpenses(token, params);
      setExpenses(data);
    } catch {
      showSnack("Failed to load expenses", "error");
    } finally {
      setLoading(false);
    }
  }, [token, search, filterStatus, filterCategory, filterDateFrom, filterDateTo, filterBranchId, showSnack]);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await fetchExpenseSummary(token, filterBranchId || undefined);
      setSummary(data);
    } catch {
      // silent
    } finally {
      setSummaryLoading(false);
    }
  }, [token, filterBranchId]);

  const loadBranches = useCallback(async () => {
    try {
      const data = await fetchBranches(token);
      setBranches(Array.isArray(data) ? data : []);
    } catch {
      // silent
    }
  }, [token]);

  const loadVehicles = useCallback(async () => {
    try {
      const data = await fetchVehicleUnits(token);
      setVehicles(Array.isArray(data) ? data : []);
    } catch {
      // silent
    }
  }, [token]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    loadSummary();
    loadBranches();
    loadVehicles();
  }, [loadSummary, loadBranches, loadVehicles]);

  // ─────────────────────────────────────────────
  // Form handlers
  // ─────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingExpense(null);
    setForm(DEFAULT_FORM);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (expense: IExpense) => {
    setEditingExpense(expense);
    const branchId =
      expense.branch_id && typeof expense.branch_id === "object"
        ? (expense.branch_id as { _id: string })._id
        : (expense.branch_id as string) || "";
    const vehicleId =
      expense.vehicle_id && typeof expense.vehicle_id === "object"
        ? (expense.vehicle_id as { _id: string })._id
        : (expense.vehicle_id as string) || "";
    setForm({
      title: expense.title,
      category: expense.category,
      amount: String(parseAmount(expense.amount)),
      currency: expense.currency,
      date: expense.date ? expense.date.split("T")[0] : "",
      description: expense.description || "",
      branch_id: branchId,
      vehicle_id: vehicleId,
      tags: (expense.tags || []).join(", "),
      notes: expense.notes || "",
      receipt_images: expense.receipt_images || [],
      submitImmediately: false,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Title is required";
    if (!form.category) errors.category = "Category is required";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      errors.amount = "Valid amount is required";
    if (!form.date) errors.date = "Date is required";
    if (!form.branch_id) errors.branch_id = "Branch is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveExpense = async () => {
    if (!validateForm()) return;
    setFormSaving(true);
    try {
      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const payload: Partial<IExpense> = {
        title: form.title.trim(),
        category: form.category as ExpenseCategory,
        amount: Number(form.amount) as unknown as IExpense["amount"],
        currency: form.currency,
        date: new Date(form.date).toISOString(),
        description: form.description,
        branch_id: form.branch_id,
        vehicle_id: form.vehicle_id || undefined,
        receipt_images: form.receipt_images,
        tags,
        notes: form.notes,
        status: form.submitImmediately ? "pending_approval" : "draft",
      };

      if (editingExpense) {
        await updateExpense(token, editingExpense._id, payload);
        showSnack("Expense updated successfully");
      } else {
        await createExpense(token, payload);
        showSnack("Expense created successfully");
      }
      setShowModal(false);
      loadExpenses();
      loadSummary();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to save expense";
      showSnack(msg, "error");
    } finally {
      setFormSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────
  const handleSubmitExpense = async (expense: IExpense) => {
    try {
      await submitExpense(token, expense._id);
      showSnack("Expense submitted for approval");
      loadExpenses();
      loadSummary();
    } catch {
      showSnack("Failed to submit expense", "error");
    }
  };

  const handleApprove = async (expense: IExpense) => {
    try {
      await approveExpense(token, expense._id);
      showSnack("Expense approved");
      loadExpenses();
      loadSummary();
      if (detailExpense?._id === expense._id) setShowDetail(false);
    } catch {
      showSnack("Failed to approve expense", "error");
    }
  };

  const handleOpenReject = (id: string) => {
    setRejectingId(id);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      showSnack("Please provide a rejection reason", "error");
      return;
    }
    setRejectLoading(true);
    try {
      await rejectExpense(token, rejectingId, rejectReason.trim());
      showSnack("Expense rejected");
      setShowRejectModal(false);
      loadExpenses();
      loadSummary();
      if (detailExpense?._id === rejectingId) setShowDetail(false);
    } catch {
      showSnack("Failed to reject expense", "error");
    } finally {
      setRejectLoading(false);
    }
  };

  const handleDelete = async (expense: IExpense) => {
    if (!window.confirm(`Delete expense "${expense.title}"? This cannot be undone.`)) return;
    try {
      await deleteExpense(token, expense._id);
      showSnack("Expense deleted");
      loadExpenses();
      loadSummary();
    } catch {
      showSnack("Failed to delete expense", "error");
    }
  };

  const handleViewDetail = (expense: IExpense) => {
    setDetailExpense(expense);
    setShowDetail(true);
  };

  const resetFilters = () => {
    setSearch("");
    setFilterStatus("");
    setFilterCategory("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterBranchId("");
  };

  // ─────────────────────────────────────────────
  // File upload handlers
  // ─────────────────────────────────────────────
  const handleFilesSelected = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    for (const file of fileArr) {
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") continue;
      const tempId = `uploading-${Date.now()}-${Math.random()}`;
      setUploadingFiles((prev) => [...prev, tempId]);
      try {
        const url = await uploadReceipt(file);
        setForm((prev) => ({
          ...prev,
          receipt_images: [...prev.receipt_images, url],
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        showSnack(msg, "error");
      } finally {
        setUploadingFiles((prev) => prev.filter((id) => id !== tempId));
      }
    }
  };

  const handleDropZoneDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files);
  };

  const removeReceiptImage = (url: string) => {
    setForm((prev) => ({
      ...prev,
      receipt_images: prev.receipt_images.filter((u) => u !== url),
    }));
  };

  // ─────────────────────────────────────────────
  // Permission helpers for table rows
  // ─────────────────────────────────────────────
  const canEdit = (expense: IExpense) => {
    if (expense.status !== "draft") return false;
    const isAdmin = userRole === "admin";
    const isSubmitter = getSubmittedById(expense.submitted_by) === userId;
    return isAdmin || isSubmitter;
  };

  const canSubmit = (expense: IExpense) => {
    return expense.status === "draft" && getSubmittedById(expense.submitted_by) === userId;
  };

  const canDelete = (expense: IExpense) => {
    const isAdmin = userRole === "admin";
    const isSubmitter = getSubmittedById(expense.submitted_by) === userId;
    return isAdmin || (isSubmitter && expense.status === "draft");
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#F0F6FF]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Header ── */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#0A1628] flex items-center gap-2">
                <Receipt className="w-6 h-6 text-[#00AEEF]" />
                Expense Management
              </h1>
              <p className="text-sm text-gray-500">Track and manage company expenses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { loadExpenses(); loadSummary(); }}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#0A1628] text-white rounded-xl hover:bg-[#1A5FA8] transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              New Expense
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* ── Stats Row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Approved This Month */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Approved (This Month)
                </p>
                <div className="p-2 bg-green-100 rounded-xl">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {summaryLoading ? (
                  <span className="animate-pulse bg-gray-200 rounded h-8 w-24 inline-block" />
                ) : (
                  `$${(summary?.total_approved_this_month ?? 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}`
                )}
              </p>
              <p className="text-xs text-green-600 mt-1 font-medium">USD</p>
            </div>

            {/* Pending Approval */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Pending Approval
                </p>
                <div className="p-2 bg-amber-100 rounded-xl">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {summaryLoading ? (
                  <span className="animate-pulse bg-gray-200 rounded h-8 w-24 inline-block" />
                ) : (
                  `${summary?.total_pending_count ?? 0}`
                )}
              </p>
              <p className="text-xs text-amber-600 mt-1 font-medium">
                $
                {(summary?.total_pending ?? 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}{" "}
                total value
              </p>
            </div>

            {/* All Time Approved */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  All-Time Approved
                </p>
                <div className="p-2 bg-[#00AEEF]/10 rounded-xl">
                  <DollarSign className="w-4 h-4 text-[#00AEEF]" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {summaryLoading ? (
                  <span className="animate-pulse bg-gray-200 rounded h-8 w-24 inline-block" />
                ) : (
                  `$${(summary?.total_approved_all_time ?? 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}`
                )}
              </p>
              <p className="text-xs text-[#00AEEF] mt-1 font-medium">Cumulative</p>
            </div>

            {/* Rejected This Month */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Rejected (This Month)
                </p>
                <div className="p-2 bg-red-100 rounded-xl">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {summaryLoading ? (
                  <span className="animate-pulse bg-gray-200 rounded h-8 w-24 inline-block" />
                ) : (
                  `${summary?.total_rejected_count_this_month ?? 0}`
                )}
              </p>
              <p className="text-xs text-red-600 mt-1 font-medium">
                $
                {(summary?.total_rejected_this_month ?? 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}{" "}
                total value
              </p>
            </div>
          </div>

          {/* ── Filters Bar ── */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or reference..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
                />
              </div>

              {/* Status */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] bg-white"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Category */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] bg-white"
              >
                <option value="">All Categories</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>

              {/* Date From */}
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
              />

              {/* Date To */}
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
              />

              {/* Branch filter — admin only */}
              <select
                value={filterBranchId}
                onChange={(e) => setFilterBranchId(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] bg-white"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}{b.code ? ` (${b.code})` : ""}</option>
                ))}
              </select>

              {/* Reset */}
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-[#0A1628]">
                Expense Ledger
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({expenses.length} records)
                </span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                      Reference
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                      Title
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                      Branch
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                      Submitted By
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        {Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-gray-100 animate-pulse rounded" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center">
                        <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No expenses found</p>
                        <p className="text-gray-300 text-xs mt-1">
                          Create your first expense to get started
                        </p>
                        <button
                          onClick={openCreateModal}
                          className="mt-4 px-4 py-2 bg-[#0A1628] text-white rounded-xl text-sm hover:bg-[#1A5FA8] transition-colors"
                        >
                          Create Expense
                        </button>
                      </td>
                    </tr>
                  ) : (
                    expenses.map((expense, idx) => {
                      const statusCfg = STATUS_CONFIG[expense.status];
                      const catColor =
                        CATEGORY_COLORS[expense.category] || "text-gray-600 bg-gray-100";
                      return (
                        <tr
                          key={expense._id}
                          className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors ${
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                          }`}
                        >
                          {/* Reference */}
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-[#00AEEF] font-semibold">
                              {expense.reference}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {formatDate(expense.date)}
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${catColor}`}
                            >
                              <span>{getCategoryIcon(expense.category)}</span>
                              <span className="hidden xl:inline">
                                {getCategoryLabel(expense.category)}
                              </span>
                            </span>
                          </td>

                          {/* Title */}
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800 truncate max-w-[160px]">
                              {expense.title}
                            </p>
                          </td>

                          {/* Branch */}
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {getBranchName(expense.branch_id)}
                          </td>

                          {/* Amount */}
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-gray-900 font-mono">
                              {formatAmount(expense.amount, expense.currency)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}
                            >
                              {statusCfg.icon}
                              {statusCfg.label}
                            </span>
                          </td>

                          {/* Submitted By */}
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {getSubmittedByName(expense.submitted_by)}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {/* View */}
                              <button
                                onClick={() => handleViewDetail(expense)}
                                className="p-1.5 rounded-lg hover:bg-[#00AEEF]/10 text-gray-400 hover:text-[#00AEEF] transition-colors"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit */}
                              {canEdit(expense) && (
                                <button
                                  onClick={() => openEditModal(expense)}
                                  className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}

                              {/* Submit */}
                              {canSubmit(expense) && (
                                <button
                                  onClick={() => handleSubmitExpense(expense)}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Submit for approval"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              )}

                              {/* Approve */}
                              {canApprove && expense.status === "pending_approval" && (
                                <button
                                  onClick={() => handleApprove(expense)}
                                  className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}

                              {/* Reject */}
                              {canApprove && expense.status === "pending_approval" && (
                                <button
                                  onClick={() => handleOpenReject(expense._id)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete */}
                              {canDelete(expense) && (
                                <button
                                  onClick={() => handleDelete(expense)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ─────────────────────────────────────────────
       * Create / Edit Modal
       * ───────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !formSaving && setShowModal(false)}
          />
          <div className="relative bg-white h-full w-full max-w-2xl flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className="shrink-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0A1628] rounded-xl">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0A1628]">
                    {editingExpense ? "Edit Expense" : "New Expense Entry"}
                  </h2>
                  {editingExpense && (
                    <p className="text-xs font-mono text-[#00AEEF]">
                      {editingExpense.reference}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => !formSaving && setShowModal(false)}
                className="p-2 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Auto reference note */}
              {!editingExpense && (
                <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <FileText className="w-4 h-4 text-[#00AEEF] flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Reference number will be auto-generated upon save (e.g., EXP-202601-XXXXXX)
                  </p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Expense Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Monthly vehicle maintenance — Toyota Hilux"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] ${
                    formErrors.title ? "border-red-400" : "border-gray-200"
                  }`}
                />
                {formErrors.title && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
                )}
              </div>

              {/* Category + Amount + Currency row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, category: e.target.value as ExpenseCategory }))
                    }
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] bg-white ${
                      formErrors.category ? "border-red-400" : "border-gray-200"
                    }`}
                  >
                    <option value="">Select category...</option>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>
                  )}
                </div>

                {/* Amount + Currency */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                        placeholder="0.00"
                        className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] ${
                          formErrors.amount ? "border-red-400" : "border-gray-200"
                        }`}
                      />
                    </div>
                    <select
                      value={form.currency}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, currency: e.target.value as ExpenseCurrency }))
                      }
                      className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] bg-white font-medium"
                    >
                      <option value="USD">USD</option>
                      <option value="ZWL">ZWL</option>
                    </select>
                  </div>
                  {formErrors.amount && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.amount}</p>
                  )}
                </div>
              </div>

              {/* Date + Branch row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Expense Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                      className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] ${
                        formErrors.date ? "border-red-400" : "border-gray-200"
                      }`}
                    />
                  </div>
                  {formErrors.date && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.date}</p>
                  )}
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={form.branch_id}
                      onChange={(e) => setForm((p) => ({ ...p, branch_id: e.target.value }))}
                      className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] bg-white ${
                        formErrors.branch_id ? "border-red-400" : "border-gray-200"
                      }`}
                    >
                      <option value="">Select branch...</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name} {b.code ? `(${b.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formErrors.branch_id && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.branch_id}</p>
                  )}
                </div>
              </div>

              {/* Vehicle (optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Vehicle{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={form.vehicle_id}
                    onChange={(e) => setForm((p) => ({ ...p, vehicle_id: e.target.value }))}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] bg-white"
                  >
                    <option value="">No specific vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.plate_number} {v.vin ? `— ${v.vin}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Briefly describe what this expense covers..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] resize-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Internal Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Any internal notes for accounting purposes..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tags{" "}
                  <span className="text-gray-400 font-normal">(comma-separated)</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                    placeholder="e.g., Q1-2026, branch-harare, emergency"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
                  />
                </div>
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Receipt Images
                </label>
                <div
                  ref={dropZoneRef}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropZoneDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#00AEEF] hover:bg-blue-50/30 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Drag & drop receipt images here, or{" "}
                    <span className="text-[#00AEEF] font-medium">click to browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 10MB each</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
                  />
                </div>

                {/* Upload progress indicators */}
                {uploadingFiles.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Uploading {uploadingFiles.length} file(s)...
                  </div>
                )}

                {/* Uploaded images */}
                {form.receipt_images.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {form.receipt_images.map((url) => (
                      <div
                        key={url}
                        className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200"
                      >
                        <img
                          src={url}
                          alt="Receipt"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23999' font-size='12'%3EPDF%3C/text%3E%3C/svg%3E";
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeReceiptImage(url);
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit immediately toggle */}
              {!editingExpense && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <input
                    type="checkbox"
                    id="submitImmediately"
                    checked={form.submitImmediately}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, submitImmediately: e.target.checked }))
                    }
                    className="w-4 h-4 accent-[#0A1628]"
                  />
                  <label htmlFor="submitImmediately" className="text-sm text-amber-800 font-medium cursor-pointer">
                    Submit for approval immediately
                    <span className="text-amber-600 font-normal block text-xs">
                      If unchecked, expense will be saved as draft
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="shrink-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => !formSaving && setShowModal(false)}
                disabled={formSaving}
                className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveExpense}
                disabled={formSaving || uploadingFiles.length > 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0A1628] text-white rounded-xl hover:bg-[#1A5FA8] transition-colors font-medium text-sm disabled:opacity-50"
              >
                {formSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editingExpense ? "Save Changes" : "Create Expense"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
       * Reject Modal
       * ───────────────────────────────────────────── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !rejectLoading && setShowRejectModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-xl">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Reject Expense</h3>
                  <p className="text-xs text-gray-500">Provide a reason for rejection</p>
                </div>
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this expense is being rejected..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={rejectLoading}
                  className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={rejectLoading || !rejectReason.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium text-sm disabled:opacity-50"
                >
                  {rejectLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
       * Detail Drawer
       * ───────────────────────────────────────────── */}
      {showDetail && detailExpense && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDetail(false)}
          />
          <div className="relative w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl">
            {/* Drawer header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <p className="font-mono text-lg font-bold text-[#00AEEF]">
                  {detailExpense.reference}
                </p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium mt-1 ${
                    STATUS_CONFIG[detailExpense.status].bg
                  } ${STATUS_CONFIG[detailExpense.status].color}`}
                >
                  {STATUS_CONFIG[detailExpense.status].icon}
                  {STATUS_CONFIG[detailExpense.status].label}
                </span>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="p-2 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Title + Amount */}
              <div>
                <h2 className="text-xl font-bold text-[#0A1628]">{detailExpense.title}</h2>
                <p className="text-3xl font-bold text-[#00AEEF] mt-1">
                  {formatAmount(detailExpense.amount, detailExpense.currency)}
                </p>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                    Category
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {getCategoryIcon(detailExpense.category)}{" "}
                    {getCategoryLabel(detailExpense.category)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                    Date
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {formatDate(detailExpense.date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                    Branch
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {getBranchName(detailExpense.branch_id)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                    Currency
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {detailExpense.currency}
                  </p>
                </div>
                {detailExpense.vehicle_id && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                      Vehicle
                    </p>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {typeof detailExpense.vehicle_id === "object"
                        ? (detailExpense.vehicle_id as { plate_number?: string }).plate_number ?? "-"
                        : detailExpense.vehicle_id}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {detailExpense.description && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">
                    Description
                  </p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">
                    {detailExpense.description}
                  </p>
                </div>
              )}

              {/* Notes */}
              {detailExpense.notes && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">
                    Internal Notes
                  </p>
                  <p className="text-sm text-gray-700 bg-amber-50 rounded-xl p-3 border border-amber-100">
                    {detailExpense.notes}
                  </p>
                </div>
              )}

              {/* Tags */}
              {detailExpense.tags && detailExpense.tags.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {detailExpense.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-[#0A1628]/5 text-[#0A1628] rounded-full text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-3">
                  Timeline
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Created</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(detailExpense.created_at)} by{" "}
                        {getSubmittedByName(detailExpense.submitted_by)}
                      </p>
                    </div>
                  </div>
                  {detailExpense.submitted_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Send className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Submitted for Approval</p>
                        <p className="text-xs text-gray-400">
                          {formatDate(detailExpense.submitted_at)}
                        </p>
                      </div>
                    </div>
                  )}
                  {detailExpense.approved_at && (
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          detailExpense.status === "approved"
                            ? "bg-green-100"
                            : "bg-red-100"
                        }`}
                      >
                        {detailExpense.status === "approved" ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {detailExpense.status === "approved" ? "Approved" : "Rejected"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(detailExpense.approved_at)} by{" "}
                          {typeof detailExpense.approved_by === "object" && detailExpense.approved_by
                            ? (detailExpense.approved_by as { full_name?: string }).full_name ?? "-"
                            : "-"}
                        </p>
                        {detailExpense.rejection_reason && (
                          <p className="text-xs text-red-600 mt-1 bg-red-50 px-3 py-2 rounded-lg">
                            Reason: {detailExpense.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Receipt images gallery */}
              {detailExpense.receipt_images && detailExpense.receipt_images.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">
                    Receipt Images ({detailExpense.receipt_images.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {detailExpense.receipt_images.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-xl overflow-hidden border border-gray-200 block hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={url}
                          alt="Receipt"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                {canSubmit(detailExpense) && (
                  <button
                    onClick={() => {
                      handleSubmitExpense(detailExpense);
                      setShowDetail(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#0A1628] text-white rounded-xl hover:bg-[#1A5FA8] text-sm font-medium"
                  >
                    <Send className="w-4 h-4" />
                    Submit for Approval
                  </button>
                )}
                {canApprove && detailExpense.status === "pending_approval" && (
                  <>
                    <button
                      onClick={() => handleApprove(detailExpense)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setShowDetail(false);
                        handleOpenReject(detailExpense._id);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
                {canEdit(detailExpense) && (
                  <button
                    onClick={() => {
                      setShowDetail(false);
                      openEditModal(detailExpense);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Snackbar ── */}
      {snackbar && (
        <div
          className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white font-medium text-sm transition-all ${
            snackbar.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {snackbar.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {snackbar.msg}
        </div>
      )}
    </div>
  );
};

export default AdminExpensesPage;
