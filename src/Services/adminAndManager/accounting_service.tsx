import axios from "axios";

const BASE_URL = "http://13.61.185.238:5050/api/v1";

function getAuthHeader() {
  try {
    const raw = localStorage.getItem("car_rental_auth");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const token = parsed?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

// ── Interfaces ─────────────────────────────────────────────────────────────────

export interface AccountingQuery {
  from?: string;
  to?: string;
  branch_id?: string;
  compare_from?: string;
  compare_to?: string;
  page?: number;
  limit?: number;
}

export interface KPIs {
  gross_revenue: number;
  net_revenue: number;
  total_cos: number;
  gross_profit: number;
  gross_margin_pct: number;
  total_opex: number;
  net_profit: number;
  net_margin_pct: number;
}

export interface TrendPoint {
  date: string;
  amount: number;
}

export interface CategoryLine {
  category: string;
  label: string;
  total: number;
  count: number;
}

export interface RevenueData {
  rental_income: number;
  driver_income: number;
  gross_revenue: number;
  promo_discounts: number;
  refunds: number;
  net_revenue: number;
  rental_count: number;
  driver_count: number;
}

export interface CORData {
  by_category: CategoryLine[];
  service_orders: number;
  service_orders_count: number;
  incidents_gross: number;
  incidents_recovery: number;
  incidents_net: number;
  total: number;
}

export interface TradingAccountData {
  period: { from: string; to: string };
  revenue: RevenueData;
  cost_of_revenue: CORData;
  gross_profit: number;
  gross_margin_pct: number;
  prior: {
    revenue: RevenueData;
    cost_of_revenue: CORData;
    gross_profit: number;
    gross_margin_pct: number;
  } | null;
}

export interface IncomeStatementData extends TradingAccountData {
  operating_expenses: { by_category: CategoryLine[]; total: number };
  net_profit: number;
  net_margin_pct: number;
  prior: {
    revenue: RevenueData;
    cost_of_revenue: CORData;
    gross_profit: number;
    gross_margin_pct: number;
    operating_expenses: { by_category: CategoryLine[]; total: number };
    net_profit: number;
    net_margin_pct: number;
  } | null;
}

export interface OverviewData {
  period: { from: string; to: string };
  kpis: KPIs;
  prior_kpis: KPIs | null;
  revenue_trend: TrendPoint[];
  expense_trend: TrendPoint[];
}

export interface LedgerEntry {
  date: string;
  ref: string;
  description: string;
  type: "revenue" | "expense" | "service_cost";
  category: string;
  amount_in: number;
  amount_out: number;
  source: "payment" | "expense" | "service_order";
  source_id: string;
  branch_name: string;
  recorded_by: string;
}

export interface LedgerData {
  rows: LedgerEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditExpense {
  _id: string;
  reference: string;
  title: string;
  category: string;
  amount: number;
  status: string;
  date: string;
  submitted_by?: { _id: string; full_name: string; email: string };
  approved_by?: { _id: string; full_name: string; email: string };
  branch_id?: { _id: string; name: string };
  submitted_at?: string;
  approved_at?: string;
  receipt_images: string[];
  rejection_reason?: string;
  flags: string[];
}

export interface AuditPayment {
  _id: string;
  provider: string;
  method: string;
  pricePaid: number;
  paymentStatus: string;
  boughtAt: string;
  user?: { _id: string; full_name: string; email: string };
  refunds: Array<{ amount: number; at: string }>;
  flags: string[];
}

export interface AuditTrailData {
  expenses: AuditExpense[];
  payments: AuditPayment[];
  summary: {
    expenses_reviewed: number;
    expenses_flagged: number;
    payments_reviewed: number;
    payments_flagged: number;
    flag_breakdown: Record<string, number>;
  };
}

export interface BranchOption {
  _id: string;
  name: string;
  code: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

export async function fetchAccountingOverview(query: AccountingQuery): Promise<OverviewData> {
  const params = buildParams(query);
  const res = await axios.get(`${BASE_URL}/accounting/overview`, {
    headers: getAuthHeader(),
    params,
  });
  return res.data.data;
}

export async function fetchTradingAccount(query: AccountingQuery): Promise<TradingAccountData> {
  const params = buildParams(query);
  const res = await axios.get(`${BASE_URL}/accounting/trading-account`, {
    headers: getAuthHeader(),
    params,
  });
  return res.data.data;
}

export async function fetchIncomeStatement(query: AccountingQuery): Promise<IncomeStatementData> {
  const params = buildParams(query);
  const res = await axios.get(`${BASE_URL}/accounting/income-statement`, {
    headers: getAuthHeader(),
    params,
  });
  return res.data.data;
}

export async function fetchLedger(query: AccountingQuery): Promise<LedgerData> {
  const params = buildParams(query);
  const res = await axios.get(`${BASE_URL}/accounting/ledger`, {
    headers: getAuthHeader(),
    params,
  });
  return res.data.data;
}

export async function fetchRevenueAnalysis(query: AccountingQuery): Promise<{
  by_source: { rental_income: number; driver_income: number; rental_count: number; driver_count: number };
  by_branch: Array<{ branch_id: string; branch_name: string; total_revenue: number }>;
  trend: TrendPoint[];
  metrics: {
    avg_daily_revenue: number;
    peak_day: { date: string | null; amount: number };
    total_transactions: number;
    avg_transaction_value: number;
  };
}> {
  const params = buildParams(query);
  const res = await axios.get(`${BASE_URL}/accounting/revenue-analysis`, {
    headers: getAuthHeader(),
    params,
  });
  return res.data.data;
}

export async function fetchAuditTrail(query: AccountingQuery): Promise<AuditTrailData> {
  const params = buildParams(query);
  const res = await axios.get(`${BASE_URL}/accounting/audit-trail`, {
    headers: getAuthHeader(),
    params,
  });
  return res.data.data;
}

export async function fetchBranchesForAccounting(): Promise<BranchOption[]> {
  const res = await axios.get(`${BASE_URL}/branches`, {
    headers: getAuthHeader(),
  });
  const data = res.data.data || res.data;
  return Array.isArray(data) ? data : [];
}

export async function fetchBranchVehicles(branchId?: string): Promise<Array<{ _id: string; plate_number: string; vehicle_model_id?: { make: string; model: string; year: number }; branch_id?: { _id: string; name: string } }>> {
  const params: Record<string, string> = {};
  if (branchId) params.branch_id = branchId;
  const res = await axios.get(`${BASE_URL}/vehicles`, { headers: getAuthHeader(), params });
  const payload = res.data.data;
  // API returns { data: { items: [...], total: N } }
  const list = payload?.items ?? payload;
  return Array.isArray(list) ? list : [];
}

// ── Tier 2 Interfaces ─────────────────────────────────────────────────────────

export interface DepreciationCalc {
  cost: number;
  salvage: number;
  depreciable_amount: number;
  annual_depreciation: number;
  accumulated_depreciation: number;
  net_book_value: number;
  years_elapsed: number;
  years_remaining: number;
  pct_depreciated: number;
  is_fully_depreciated: boolean;
  disposal_gain_loss: number | null;
}

export interface AssetRecord {
  _id: string;
  acquisition_cost: number;
  acquisition_date: string;
  useful_life_years: number;
  salvage_value: number;
  depreciation_method: "straight_line" | "declining_balance" | "units_of_production";
  declining_rate_pct: number | null;
  total_expected_km: number | null;
  disposal_date: string | null;
  disposal_amount: number | null;
  disposal_notes: string;
  notes: string;
  created_by: { _id: string; full_name: string; email: string } | null;
  updated_by: { _id: string; full_name: string; email: string } | null;
  created_at: string;
  updated_at: string;
  change_log: Array<{
    field: string; old_value: unknown; new_value: unknown;
    reason: string; changed_at: string;
    changed_by?: { full_name: string };
  }>;
}

export interface FixedAssetRow {
  vehicle_id: string | null;
  is_vehicle?: boolean;
  asset_name?: string;
  plate_number: string | null;
  make?: string;
  model?: string;
  year?: number;
  branch?: string;
  branch_id?: string;
  vehicle_status: string | null;
  odometer_km: number;
  has_asset_record: boolean;
  asset: AssetRecord | null;
  depreciation: DepreciationCalc | null;
  flags: string[];
}

export interface FixedAssetsData {
  as_of: string;
  vehicles_in_scope: number;
  registered: number;
  unregistered: number;
  other_assets?: number;
  totals: { cost: number; accumulated_depreciation: number; net_book_value: number; annual_depreciation: number };
  rows: FixedAssetRow[];
}

export interface BalanceEntryItem {
  _id: string;
  type: "asset" | "liability" | "equity";
  category: string;
  description: string;
  amount: number;
  currency: string;
  effective_date: string;
  reference: string;
  branch_id?: { _id: string; name: string; code: string } | null;
  is_opening_balance: boolean;
  notes: string;
  created_by?: { _id: string; full_name: string; email: string } | null;
  updated_by?: { _id: string; full_name: string; email: string } | null;
  created_at: string;
  updated_at: string;
  change_log: Array<{
    old_amount?: number; new_amount?: number;
    old_description?: string; new_description?: string;
    reason: string; changed_at: string;
    changed_by?: { full_name: string };
  }>;
}

export interface BalanceSheetData {
  as_of: string;
  assets: {
    current: { cash_and_bank: number; accounts_receivable: number; other: Array<{ category: string; description: string; total: number }>; total: number };
    non_current: { fleet: { at_cost: number; accumulated_depreciation: number; net_book_value: number }; other: Array<{ category: string; description: string; total: number }>; total: number };
    total: number;
  };
  liabilities: {
    current: { rows: Array<{ category: string; description: string; total: number }>; total: number };
    non_current: { rows: Array<{ category: string; description: string; total: number }>; total: number };
    total: number;
  };
  equity: { share_capital: number; retained_earnings: number; drawings: number; revaluation_reserve: number; total: number };
  total_liabilities_and_equity: number;
  is_balanced: boolean;
  balancing_difference: number;
}

export interface CashFlowData {
  period: { from: string; to: string };
  operating: { net_profit: number; add_depreciation: number; receivables_change: number; net_cash: number };
  investing: { vehicle_acquisitions: number; disposal_proceeds: number; net_cash: number };
  financing: { loan_proceeds: number; loan_repayments: number; capital_injections: number; drawings: number; net_cash: number };
  net_change_in_cash: number;
}

export interface DataHealthFlag {
  severity: "critical" | "warning" | "info";
  code: string;
  entity: string;
  entity_id: string | null;
  label: string;
  message: string;
  action: string;
  branch?: string | null;
  added_by?: string | null;
}

export interface DataHealthData {
  generated_at: string;
  summary: { critical: number; warning: number; info: number; total: number };
  flags: DataHealthFlag[];
}

// ── Tier 2 API Calls ──────────────────────────────────────────────────────────

export async function fetchFixedAssets(query: AccountingQuery & { as_of?: string }): Promise<FixedAssetsData> {
  const params = buildParams(query);
  if (query.as_of) params.as_of = query.as_of;
  const res = await axios.get(`${BASE_URL}/accounting/fixed-assets`, { headers: getAuthHeader(), params });
  return res.data.data;
}

export async function createFixedAsset(body: {
  is_vehicle: boolean;
  vehicle_id?: string;
  asset_name?: string;
  branch_id: string; acquisition_cost: number; acquisition_date: string;
  useful_life_years: number; salvage_value?: number; depreciation_method: string;
  declining_rate_pct?: number | null; total_expected_km?: number | null; notes?: string;
}): Promise<AssetRecord> {
  const res = await axios.post(`${BASE_URL}/accounting/fixed-assets`, body, { headers: getAuthHeader() });
  return res.data.data;
}

export async function updateFixedAsset(id: string, body: Partial<{
  acquisition_cost: number; acquisition_date: string; useful_life_years: number;
  salvage_value: number; depreciation_method: string; declining_rate_pct: number | null;
  total_expected_km: number | null; disposal_date: string | null; disposal_amount: number | null;
  disposal_notes: string; notes: string; change_reason: string;
}>): Promise<AssetRecord> {
  const res = await axios.put(`${BASE_URL}/accounting/fixed-assets/${id}`, body, { headers: getAuthHeader() });
  return res.data.data;
}

export async function fetchBalanceSheet(query: AccountingQuery): Promise<BalanceSheetData> {
  const params = buildParams(query);
  const res = await axios.get(`${BASE_URL}/accounting/balance-sheet`, { headers: getAuthHeader(), params });
  return res.data.data;
}

export async function fetchCashFlowStatement(query: AccountingQuery): Promise<CashFlowData> {
  const params = buildParams(query);
  const res = await axios.get(`${BASE_URL}/accounting/cash-flow`, { headers: getAuthHeader(), params });
  return res.data.data;
}

export async function fetchDataHealth(query: AccountingQuery): Promise<DataHealthData> {
  const params = buildParams(query);
  const res = await axios.get(`${BASE_URL}/accounting/data-health`, { headers: getAuthHeader(), params });
  return res.data.data;
}

export async function fetchBalanceEntries(query: { type?: string; category?: string; branch_id?: string }): Promise<{ entries: BalanceEntryItem[]; total: number }> {
  const res = await axios.get(`${BASE_URL}/accounting/balance-entries`, { headers: getAuthHeader(), params: query });
  return res.data.data;
}

export async function createBalanceEntry(body: {
  type: string; category: string; description: string; amount: number;
  effective_date: string; reference?: string; branch_id?: string | null;
  is_opening_balance?: boolean; notes?: string;
}): Promise<BalanceEntryItem> {
  const res = await axios.post(`${BASE_URL}/accounting/balance-entries`, body, { headers: getAuthHeader() });
  return res.data.data;
}

export async function updateBalanceEntry(id: string, body: Partial<{ amount: number; description: string; effective_date: string; reference: string; notes: string; change_reason: string }>): Promise<BalanceEntryItem> {
  const res = await axios.put(`${BASE_URL}/accounting/balance-entries/${id}`, body, { headers: getAuthHeader() });
  return res.data.data;
}

export async function deleteBalanceEntry(id: string): Promise<void> {
  await axios.delete(`${BASE_URL}/accounting/balance-entries/${id}`, { headers: getAuthHeader() });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildParams(query: AccountingQuery): Record<string, string | number | undefined> {
  const p: Record<string, string | number | undefined> = {};
  if (query.from) p.from = query.from;
  if (query.to) p.to = query.to;
  if (query.branch_id) p.branch_id = query.branch_id;
  if (query.compare_from) p.compare_from = query.compare_from;
  if (query.compare_to) p.compare_to = query.compare_to;
  if (query.page) p.page = query.page;
  if (query.limit) p.limit = query.limit;
  return p;
}
