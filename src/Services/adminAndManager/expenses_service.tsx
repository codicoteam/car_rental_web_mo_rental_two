import axios from "axios";

const BASE_URL = "http://13.61.185.238:5050/api/v1";

export const EXPENSE_CATEGORIES = [
  { value: "fuel", label: "Fuel & Oil", icon: "⛽" },
  { value: "maintenance", label: "Vehicle Maintenance & Repairs", icon: "🔧" },
  { value: "insurance", label: "Insurance Premiums", icon: "🛡️" },
  { value: "cleaning", label: "Vehicle Cleaning & Detailing", icon: "🧹" },
  { value: "salaries", label: "Staff Salaries & Wages", icon: "👤" },
  { value: "rent", label: "Branch Rent & Lease", icon: "🏢" },
  { value: "utilities", label: "Utilities (Electricity, Water, Internet)", icon: "💡" },
  { value: "parking", label: "Parking Fees & Tolls", icon: "🅿️" },
  { value: "fines", label: "Traffic Fines & Penalties", icon: "⚠️" },
  { value: "licensing", label: "Vehicle Licensing & Registration", icon: "📋" },
  { value: "marketing", label: "Marketing & Advertising", icon: "📣" },
  { value: "office_supplies", label: "Office Supplies & Stationery", icon: "🖊️" },
  { value: "bank_charges", label: "Bank Charges & Fees", icon: "🏦" },
  { value: "tyres_parts", label: "Tyres & Spare Parts", icon: "🔩" },
  { value: "security", label: "Security Services", icon: "🔒" },
  { value: "it_software", label: "IT & Software", icon: "💻" },
  { value: "travel", label: "Travel & Accommodation", icon: "✈️" },
  { value: "meals", label: "Meals & Entertainment", icon: "🍽️" },
  { value: "vehicle_acquisition", label: "Vehicle Acquisition", icon: "🚗" },
  { value: "other", label: "Other", icon: "📁" },
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]["value"];
export type ExpenseStatus = "draft" | "pending_approval" | "approved" | "rejected";
export type ExpenseCurrency = "USD" | "ZWL";

export interface IUserRef {
  _id: string;
  full_name?: string;
  email?: string;
}

export interface IBranchRef {
  _id: string;
  name?: string;
  code?: string;
}

export interface IVehicleRef {
  _id: string;
  plate_number?: string;
  vin?: string;
}

export interface IExpense {
  _id: string;
  reference: string;
  title: string;
  category: ExpenseCategory;
  amount: { $numberDecimal: string } | number | string;
  currency: ExpenseCurrency;
  date: string;
  description?: string;
  branch_id: string | IBranchRef | null;
  vehicle_id?: string | IVehicleRef | null;
  receipt_images: string[];
  status: ExpenseStatus;
  submitted_by: string | IUserRef;
  submitted_at?: string | null;
  approved_by?: string | IUserRef | null;
  approved_at?: string | null;
  rejection_reason?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface IExpenseSummary {
  total_approved_this_month: number;
  total_pending: number;
  total_pending_count: number;
  total_rejected_this_month: number;
  total_rejected_count_this_month: number;
  total_approved_all_time: number;
  by_category: { category: string; total_amount: number; count: number }[];
  by_month: { month: string; total_amount: number; count: number }[];
}

export interface IBranch {
  _id: string;
  name: string;
  code?: string;
}

export interface IVehicleUnit {
  _id: string;
  plate_number: string;
  vin?: string;
}

export function parseAmount(amount: IExpense["amount"]): number {
  if (!amount) return 0;
  if (typeof amount === "number") return amount;
  if (typeof amount === "string") return parseFloat(amount) || 0;
  if (typeof amount === "object" && "$numberDecimal" in amount) {
    return parseFloat(amount.$numberDecimal) || 0;
  }
  return 0;
}

export function getCategoryLabel(value: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function getCategoryIcon(value: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.icon ?? "📁";
}

export function formatAmount(amount: IExpense["amount"], currency?: string): string {
  const num = parseAmount(amount);
  const symbol = currency === "ZWL" ? "ZWL " : "USD ";
  return `${symbol}${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchExpenses(
  token: string,
  params?: Record<string, string>
): Promise<IExpense[]> {
  const res = await axios.get(`${BASE_URL}/expenses`, {
    headers: authHeader(token),
    params,
  });
  return res.data.data;
}

export async function fetchExpenseById(token: string, id: string): Promise<IExpense> {
  const res = await axios.get(`${BASE_URL}/expenses/${id}`, {
    headers: authHeader(token),
  });
  return res.data.data;
}

export async function createExpense(
  token: string,
  payload: Partial<IExpense>
): Promise<IExpense> {
  const res = await axios.post(`${BASE_URL}/expenses`, payload, {
    headers: authHeader(token),
  });
  return res.data.data;
}

export async function updateExpense(
  token: string,
  id: string,
  payload: Partial<IExpense>
): Promise<IExpense> {
  const res = await axios.patch(`${BASE_URL}/expenses/${id}`, payload, {
    headers: authHeader(token),
  });
  return res.data.data;
}

export async function deleteExpense(token: string, id: string): Promise<void> {
  await axios.delete(`${BASE_URL}/expenses/${id}`, {
    headers: authHeader(token),
  });
}

export async function submitExpense(token: string, id: string): Promise<IExpense> {
  const res = await axios.post(
    `${BASE_URL}/expenses/${id}/submit`,
    {},
    { headers: authHeader(token) }
  );
  return res.data.data;
}

export async function approveExpense(token: string, id: string): Promise<IExpense> {
  const res = await axios.post(
    `${BASE_URL}/expenses/${id}/approve`,
    {},
    { headers: authHeader(token) }
  );
  return res.data.data;
}

export async function rejectExpense(
  token: string,
  id: string,
  reason: string
): Promise<IExpense> {
  const res = await axios.post(
    `${BASE_URL}/expenses/${id}/reject`,
    { reason },
    { headers: authHeader(token) }
  );
  return res.data.data;
}

export async function fetchExpenseSummary(
  token: string,
  branch_id?: string
): Promise<IExpenseSummary> {
  const res = await axios.get(`${BASE_URL}/expenses/summary`, {
    headers: authHeader(token),
    params: branch_id ? { branch_id } : {},
  });
  return res.data.data;
}

export async function fetchBranches(token: string): Promise<IBranch[]> {
  const res = await axios.get(`${BASE_URL}/branches`, {
    headers: authHeader(token),
  });
  return res.data.data ?? res.data ?? [];
}

export async function fetchVehicleUnits(token: string): Promise<IVehicleUnit[]> {
  const res = await axios.get(`${BASE_URL}/vehicles`, {
    headers: authHeader(token),
  });
  const payload = res.data?.data;
  if (Array.isArray(payload)) return payload;
  if (payload?.items && Array.isArray(payload.items)) return payload.items;
  return [];
}
