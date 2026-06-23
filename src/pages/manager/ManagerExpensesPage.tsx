import React, { useState, useEffect, useCallback, useRef } from "react";
import ManagerSidebar from "../../components/ManagerSideBar";
import { supabase } from "../../helpers/supa_base_client";
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
} from "../../Services/adminAndManager/expenses_service";
import {
  Plus,
  Search,
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
  Menu,
  Edit2,
  Send,
  XCircle,
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
  default: "text-gray-600 bg-gray-100",
};

function getCatColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.default;
}

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
  if (typeof submitted_by === "object") return (submitted_by as { _id: string })._id ?? "";
  return submitted_by as string;
}

async function uploadReceipt(file: File): Promise<string> {
  const fileName = `receipts/${Date.now()}-${Math.random().toString(36).substr(2, 8)}-${file.name}`;
  const { error } = await supabase.storage
    .from("topics")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("topics").getPublicUrl(fileName);
  return data.publicUrl;
}

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
// Component
// ─────────────────────────────────────────────
const ManagerExpensesPage: React.FC = () => {
  const _auth = JSON.parse(localStorage.getItem("car_rental_auth") || "{}");
  const token: string = _auth?.token || "";
  const storedUser: StoredUser = _auth?.user || {};
  const userRole = storedUser.roles?.[0] || "";
  const userId = storedUser._id || storedUser.id || "";
  const userBranchId = (storedUser as any).branch_id || localStorage.getItem("manager_branch_id") || "";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [summary, setSummary] = useState<IExpenseSummary | null>(null);
  const [branches, setBranches] = useState<IBranch[]>([]);
  const [vehicles, setVehicles] = useState<IVehicleUnit[]>([]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<IExpense | null>(null);
  const [form, setForm] = useState<ExpenseForm>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSaving, setFormSaving] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const [detailExpense, setDetailExpense] = useState<IExpense | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const [snackbar, setSnackbar] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manager can approve
  const canApprove = true;

  const showSnack = useCallback((msg: string, type: "success" | "error" = "success") => {
    setSnackbar({ msg, type });
    if (snackTimer.current) clearTimeout(snackTimer.current);
    snackTimer.current = setTimeout(() => setSnackbar(null), 4000);
  }, []);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;
      if (userBranchId) params.branch_id = userBranchId;
      const data = await fetchExpenses(token, params);
      setExpenses(data);
    } catch {
      showSnack("Failed to load expenses", "error");
    } finally {
      setLoading(false);
    }
  }, [token, userBranchId, search, filterStatus, filterCategory, filterDateFrom, filterDateTo, showSnack]);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await fetchExpenseSummary(token, userBranchId || undefined);
      setSummary(data);
    } catch {
      // silent
    } finally {
      setSummaryLoading(false);
    }
  }, [token, userBranchId]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);
  useEffect(() => {
    loadSummary();
    fetchBranches(token).then(d => setBranches(Array.isArray(d) ? d : [])).catch(() => {});
    fetchVehicleUnits(token).then(d => setVehicles(Array.isArray(d) ? d : [])).catch(() => {});
  }, [token, loadSummary]);

  const openCreateModal = () => {
    setEditingExpense(null);
    setForm({ ...DEFAULT_FORM, branch_id: userBranchId });
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
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveExpense = async () => {
    if (!validateForm()) return;
    setFormSaving(true);
    try {
      const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
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
      showSnack(err instanceof Error ? err.message : "Failed to save expense", "error");
    } finally {
      setFormSaving(false);
    }
  };

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
    if (!rejectReason.trim()) { showSnack("Please provide a rejection reason", "error"); return; }
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
    if (!window.confirm(`Delete expense "${expense.title}"?`)) return;
    try {
      await deleteExpense(token, expense._id);
      showSnack("Expense deleted");
      loadExpenses();
      loadSummary();
    } catch {
      showSnack("Failed to delete expense", "error");
    }
  };

  const handleFilesSelected = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") continue;
      const tempId = `uploading-${Date.now()}-${Math.random()}`;
      setUploadingFiles((prev) => [...prev, tempId]);
      try {
        const url = await uploadReceipt(file);
        setForm((prev) => ({ ...prev, receipt_images: [...prev.receipt_images, url] }));
      } catch (err: unknown) {
        showSnack(err instanceof Error ? err.message : "Upload failed", "error");
      } finally {
        setUploadingFiles((prev) => prev.filter((id) => id !== tempId));
      }
    }
  };

  const canEdit = (expense: IExpense) => {
    if (expense.status !== "draft") return false;
    return userRole === "manager" || getSubmittedById(expense.submitted_by) === userId;
  };
  const canSubmit = (expense: IExpense) =>
    expense.status === "draft" && getSubmittedById(expense.submitted_by) === userId;
  const canDelete = (expense: IExpense) =>
    userRole === "manager" || (getSubmittedById(expense.submitted_by) === userId && expense.status === "draft");

  return (
    <div className="flex min-h-screen bg-[#F0F6FF]">
      <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-xl bg-gray-100" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#0A1628] flex items-center gap-2">
                <Receipt className="w-6 h-6 text-[#00AEEF]" />
                Expense Management
              </h1>
              <p className="text-sm text-gray-500">Branch expense tracking and approvals</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { loadExpenses(); loadSummary(); }} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200">
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-[#0A1628] text-white rounded-xl hover:bg-[#1A5FA8] text-sm font-medium">
              <Plus className="w-4 h-4" />
              New Expense
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Approved (This Month)</p>
                <div className="p-2 bg-green-100 rounded-xl"><TrendingUp className="w-4 h-4 text-green-600" /></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {summaryLoading ? <span className="animate-pulse bg-gray-200 rounded h-8 w-24 inline-block" /> :
                  `$${(summary?.total_approved_this_month ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              </p>
              <p className="text-xs text-green-600 mt-1 font-medium">USD</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending Approval</p>
                <div className="p-2 bg-amber-100 rounded-xl"><Clock className="w-4 h-4 text-amber-600" /></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {summaryLoading ? <span className="animate-pulse bg-gray-200 rounded h-8 w-24 inline-block" /> :
                  `${summary?.total_pending_count ?? 0}`}
              </p>
              <p className="text-xs text-amber-600 mt-1 font-medium">
                ${(summary?.total_pending ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} total
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">All-Time Approved</p>
                <div className="p-2 bg-[#00AEEF]/10 rounded-xl"><DollarSign className="w-4 h-4 text-[#00AEEF]" /></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {summaryLoading ? <span className="animate-pulse bg-gray-200 rounded h-8 w-24 inline-block" /> :
                  `$${(summary?.total_approved_all_time ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              </p>
              <p className="text-xs text-[#00AEEF] mt-1 font-medium">Cumulative</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rejected (This Month)</p>
                <div className="p-2 bg-red-100 rounded-xl"><TrendingDown className="w-4 h-4 text-red-600" /></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {summaryLoading ? <span className="animate-pulse bg-gray-200 rounded h-8 w-24 inline-block" /> :
                  `${summary?.total_rejected_count_this_month ?? 0}`}
              </p>
              <p className="text-xs text-red-600 mt-1 font-medium">
                ${(summary?.total_rejected_this_month ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} total
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search by title or reference..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]" />
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] bg-white">
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] bg-white">
                <option value="">All Categories</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                ))}
              </select>
              <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]" />
              <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]" />
              <button onClick={() => { setSearch(""); setFilterStatus(""); setFilterCategory(""); setFilterDateFrom(""); setFilterDateTo(""); }}
                className="flex items-center gap-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                <X className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#0A1628]">
                Expense Ledger <span className="ml-2 text-sm font-normal text-gray-400">({expenses.length} records)</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Reference", "Date", "Category", "Title", "Branch", "Amount", "Status", "Submitted By", "Actions"].map((h) => (
                      <th key={h} className={`px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide ${h === "Amount" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        {Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 animate-pulse rounded" /></td>
                        ))}
                      </tr>
                    ))
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center">
                        <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No expenses found</p>
                        <button onClick={openCreateModal} className="mt-4 px-4 py-2 bg-[#0A1628] text-white rounded-xl text-sm hover:bg-[#1A5FA8]">Create Expense</button>
                      </td>
                    </tr>
                  ) : (
                    expenses.map((expense, idx) => {
                      const statusCfg = STATUS_CONFIG[expense.status];
                      return (
                        <tr key={expense._id} className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                          <td className="px-4 py-3"><span className="font-mono text-xs text-[#00AEEF] font-semibold">{expense.reference}</span></td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(expense.date)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getCatColor(expense.category)}`}>
                              <span>{getCategoryIcon(expense.category)}</span>
                              <span className="hidden xl:inline">{getCategoryLabel(expense.category)}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3"><p className="font-medium text-gray-800 truncate max-w-[160px]">{expense.title}</p></td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{getBranchName(expense.branch_id)}</td>
                          <td className="px-4 py-3 text-right"><span className="font-bold text-gray-900 font-mono">{formatAmount(expense.amount, expense.currency)}</span></td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                              {statusCfg.icon}{statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{getSubmittedByName(expense.submitted_by)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => { setDetailExpense(expense); setShowDetail(true); }} className="p-1.5 rounded-lg hover:bg-[#00AEEF]/10 text-gray-400 hover:text-[#00AEEF]" title="View">
                                <Eye className="w-4 h-4" />
                              </button>
                              {canEdit(expense) && (
                                <button onClick={() => openEditModal(expense)} className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600" title="Edit">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              {canSubmit(expense) && (
                                <button onClick={() => handleSubmitExpense(expense)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="Submit">
                                  <Send className="w-4 h-4" />
                                </button>
                              )}
                              {canApprove && expense.status === "pending_approval" && (
                                <>
                                  <button onClick={() => handleApprove(expense)} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600" title="Approve">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleOpenReject(expense._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600" title="Reject">
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {canDelete(expense) && (
                                <button onClick={() => handleDelete(expense)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500" title="Delete">
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !formSaving && setShowModal(false)} />
          <div className="relative bg-white h-full w-full max-w-2xl flex flex-col shadow-2xl">
            <div className="shrink-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0A1628] rounded-xl"><Receipt className="w-5 h-5 text-white" /></div>
                <div>
                  <h2 className="text-lg font-bold text-[#0A1628]">{editingExpense ? "Edit Expense" : "New Expense Entry"}</h2>
                  {editingExpense && <p className="text-xs font-mono text-[#00AEEF]">{editingExpense.reference}</p>}
                </div>
              </div>
              <button onClick={() => !formSaving && setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {!editingExpense && (
                <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <FileText className="w-4 h-4 text-[#00AEEF] flex-shrink-0" />
                  <p className="text-xs text-blue-700">Reference number will be auto-generated upon save</p>
                </div>
              )}
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expense Title <span className="text-red-500">*</span></label>
                <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g., Monthly fuel top-up"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] ${formErrors.title ? "border-red-400" : "border-gray-200"}`} />
                {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
              </div>
              {/* Category + Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                  <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as ExpenseCategory }))}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] bg-white ${formErrors.category ? "border-red-400" : "border-gray-200"}`}>
                    <option value="">Select category...</option>
                    {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                  </select>
                  {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="0.00"
                        className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] ${formErrors.amount ? "border-red-400" : "border-gray-200"}`} />
                    </div>
                    <select value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value as ExpenseCurrency }))}
                      className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white font-medium">
                      <option value="USD">USD</option>
                      <option value="ZWL">ZWL</option>
                    </select>
                  </div>
                  {formErrors.amount && <p className="text-red-500 text-xs mt-1">{formErrors.amount}</p>}
                </div>
              </div>
              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expense Date <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] ${formErrors.date ? "border-red-400" : "border-gray-200"}`} />
                </div>
                {formErrors.date && <p className="text-red-500 text-xs mt-1">{formErrors.date}</p>}
              </div>
              {/* Vehicle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vehicle <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select value={form.vehicle_id} onChange={(e) => setForm((p) => ({ ...p, vehicle_id: e.target.value }))}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] bg-white">
                    <option value="">No specific vehicle</option>
                    {vehicles.map((v) => <option key={v._id} value={v._id}>{v.plate_number} {v.vin ? `— ${v.vin}` : ""}</option>)}
                  </select>
                </div>
              </div>
              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe this expense..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] resize-none" />
              </div>
              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Internal Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Internal accounting notes..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] resize-none" />
              </div>
              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="e.g., Q1-2026, branch-harare"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]" />
                </div>
              </div>
              {/* Receipt Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Receipt Images</label>
                <div onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files); }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#00AEEF] hover:bg-blue-50/30 transition-colors">
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Drag & drop or <span className="text-[#00AEEF] font-medium">click to browse</span></p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF</p>
                  <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*,application/pdf"
                    onChange={(e) => e.target.files && handleFilesSelected(e.target.files)} />
                </div>
                {uploadingFiles.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Uploading {uploadingFiles.length} file(s)...
                  </div>
                )}
                {form.receipt_images.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {form.receipt_images.map((url) => (
                      <div key={url} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                        <img src={url} alt="Receipt" className="w-full h-full object-cover" />
                        <button onClick={(e) => { e.stopPropagation(); setForm((p) => ({ ...p, receipt_images: p.receipt_images.filter((u) => u !== url) })); }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!editingExpense && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <input type="checkbox" id="submitNow" checked={form.submitImmediately} onChange={(e) => setForm((p) => ({ ...p, submitImmediately: e.target.checked }))} className="w-4 h-4 accent-[#0A1628]" />
                  <label htmlFor="submitNow" className="text-sm text-amber-800 font-medium cursor-pointer">
                    Submit for approval immediately
                    <span className="text-amber-600 font-normal block text-xs">If unchecked, saved as draft</span>
                  </label>
                </div>
              )}
            </div>
            <div className="shrink-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => !formSaving && setShowModal(false)} disabled={formSaving} className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm disabled:opacity-50">Cancel</button>
              <button onClick={handleSaveExpense} disabled={formSaving || uploadingFiles.length > 0} className="flex items-center gap-2 px-5 py-2.5 bg-[#0A1628] text-white rounded-xl hover:bg-[#1A5FA8] font-medium text-sm disabled:opacity-50">
                {formSaving ? <><RefreshCw className="w-4 h-4 animate-spin" />Saving...</> : <><Check className="w-4 h-4" />{editingExpense ? "Save Changes" : "Create Expense"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !rejectLoading && setShowRejectModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-xl"><XCircle className="w-5 h-5 text-red-600" /></div>
              <div><h3 className="font-bold text-gray-900">Reject Expense</h3><p className="text-xs text-gray-500">Provide a reason for rejection</p></div>
            </div>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain why this expense is being rejected..." rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowRejectModal(false)} disabled={rejectLoading} className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm">Cancel</button>
              <button onClick={handleConfirmReject} disabled={rejectLoading || !rejectReason.trim()} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium text-sm disabled:opacity-50">
                {rejectLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {showDetail && detailExpense && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetail(false)} />
          <div className="relative w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <p className="font-mono text-lg font-bold text-[#00AEEF]">{detailExpense.reference}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium mt-1 ${STATUS_CONFIG[detailExpense.status].bg} ${STATUS_CONFIG[detailExpense.status].color}`}>
                  {STATUS_CONFIG[detailExpense.status].icon}{STATUS_CONFIG[detailExpense.status].label}
                </span>
              </div>
              <button onClick={() => setShowDetail(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#0A1628]">{detailExpense.title}</h2>
                <p className="text-3xl font-bold text-[#00AEEF] mt-1">{formatAmount(detailExpense.amount, detailExpense.currency)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Category</p><p className="text-sm font-medium text-gray-800 mt-1">{getCategoryIcon(detailExpense.category)} {getCategoryLabel(detailExpense.category)}</p></div>
                <div><p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Date</p><p className="text-sm font-medium text-gray-800 mt-1">{formatDate(detailExpense.date)}</p></div>
                <div><p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Branch</p><p className="text-sm font-medium text-gray-800 mt-1">{getBranchName(detailExpense.branch_id)}</p></div>
                <div><p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Submitted By</p><p className="text-sm font-medium text-gray-800 mt-1">{getSubmittedByName(detailExpense.submitted_by)}</p></div>
              </div>
              {detailExpense.description && (
                <div><p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Description</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{detailExpense.description}</p></div>
              )}
              {detailExpense.notes && (
                <div><p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Internal Notes</p>
                  <p className="text-sm text-gray-700 bg-amber-50 rounded-xl p-3 border border-amber-100">{detailExpense.notes}</p></div>
              )}
              {detailExpense.rejection_reason && (
                <div><p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700 bg-red-50 rounded-xl p-3 border border-red-100">{detailExpense.rejection_reason}</p></div>
              )}
              {detailExpense.receipt_images && detailExpense.receipt_images.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">Receipts ({detailExpense.receipt_images.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {detailExpense.receipt_images.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden border border-gray-200 block hover:opacity-80">
                        <img src={url} alt="Receipt" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                {canSubmit(detailExpense) && (
                  <button onClick={() => { handleSubmitExpense(detailExpense); setShowDetail(false); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#0A1628] text-white rounded-xl hover:bg-[#1A5FA8] text-sm font-medium">
                    <Send className="w-4 h-4" /> Submit for Approval
                  </button>
                )}
                {canApprove && detailExpense.status === "pending_approval" && (
                  <>
                    <button onClick={() => handleApprove(detailExpense)} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => { setShowDetail(false); handleOpenReject(detailExpense._id); }} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white font-medium text-sm ${snackbar.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {snackbar.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {snackbar.msg}
        </div>
      )}
    </div>
  );
};

export default ManagerExpensesPage;
