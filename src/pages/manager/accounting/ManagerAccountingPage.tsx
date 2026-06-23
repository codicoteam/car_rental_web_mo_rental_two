import { useState, useEffect, useCallback } from "react";
import ManagerSidebar from "../../../components/ManagerSideBar";
import FixedAssetsTab from "../../admin/accounting/components/FixedAssetsTab";
import BalanceSheetTab from "../../admin/accounting/components/BalanceSheetTab";
import CashFlowTab from "../../admin/accounting/components/CashFlowTab";
import DataHealthTab from "../../admin/accounting/components/DataHealthTab";
import {
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Receipt,
  RefreshCw,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  Search,
  Car,
  Scale,
  Activity,
  ShieldCheck,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  fetchAccountingOverview,
  fetchTradingAccount,
  fetchIncomeStatement,
  fetchLedger,
  fetchRevenueAnalysis,
  fetchAuditTrail,
  type OverviewData,
  type TradingAccountData,
  type IncomeStatementData,
  type LedgerData,
  type LedgerEntry,
  type AuditExpense,
  type AuditPayment,
  type CategoryLine,
} from "../../../Services/adminAndManager/accounting_service";

// ── Formatting helpers ─────────────────────────────────────────────────────────

function fmtMoney(n: number): string {
  if (isNaN(n) || n === null || n === undefined) return "0.00";
  if (n < 0)
    return `(${Math.abs(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })})`;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtPct(n: number): string {
  return `${(n || 0).toFixed(1)}%`;
}

function getMoneyClass(n: number): string {
  if (n < 0) return "text-red-600";
  if (n > 0) return "text-emerald-600";
  return "text-gray-900";
}

function fmtVariance(current: number, prior: number) {
  if (!prior) return null;
  const diff = current - prior;
  const pct = ((diff / prior) * 100).toFixed(1);
  return { diff, pct, positive: diff >= 0 };
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type Preset = "this_month" | "last_month" | "this_quarter" | "this_year" | "last_year" | "custom";

function computePresetDates(preset: Preset): { from: Date; to: Date } {
  const now = new Date();
  switch (preset) {
    case "this_month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    case "last_month": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: first, to: last };
    }
    case "this_quarter": {
      const q = Math.floor(now.getMonth() / 3);
      return { from: new Date(now.getFullYear(), q * 3, 1), to: now };
    }
    case "this_year":
      return { from: new Date(now.getFullYear(), 0, 1), to: now };
    case "last_year":
      return {
        from: new Date(now.getFullYear() - 1, 0, 1),
        to: new Date(now.getFullYear() - 1, 11, 31),
      };
    default:
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  }
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className || ""}`} />;
}

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "trading", label: "Trading Account", icon: TrendingUp },
  { id: "income", label: "Income Statement", icon: Receipt },
  { id: "ledger", label: "Transaction Ledger", icon: BookOpen },
  { id: "revenue", label: "Revenue Analysis", icon: DollarSign },
  { id: "audit", label: "Audit Trail", icon: AlertTriangle },
  { id: "fixed_assets", label: "Fixed Assets", icon: Car },
  { id: "balance_sheet", label: "Balance Sheet", icon: Scale },
  { id: "cash_flow", label: "Cash Flow", icon: Activity },
  { id: "data_health", label: "Data Health", icon: ShieldCheck },
] as const;

type TabId = typeof TABS[number]["id"];

const FLAG_INFO: Record<string, { label: string; color: string; bg: string }> = {
  SELF_APPROVAL: { label: "Self Approval", color: "text-red-700", bg: "bg-red-100" },
  NO_RECEIPT_LARGE: { label: "No Receipt (>$500)", color: "text-orange-700", bg: "bg-orange-100" },
  RAPID_APPROVAL: { label: "Rapid Approval (<10min)", color: "text-yellow-700", bg: "bg-yellow-100" },
  AFTER_HOURS: { label: "After Hours Approval", color: "text-purple-700", bg: "bg-purple-100" },
  ROUND_NUMBER: { label: "Round Number Amount", color: "text-gray-700", bg: "bg-gray-200" },
  WEEKEND: { label: "Weekend Submission", color: "text-blue-700", bg: "bg-blue-100" },
  FAILED_ATTEMPT: { label: "Failed/Cancelled", color: "text-red-700", bg: "bg-red-100" },
  LARGE_PAYMENT: { label: "Large Payment (>$2000)", color: "text-amber-700", bg: "bg-amber-100" },
  REFUND_ISSUED: { label: "Refund Issued", color: "text-blue-700", bg: "bg-blue-100" },
};

const PIE_COLORS = ["#1EA2E4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function downloadCSV(rows: string[][], filename: string) {
  const content = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ManagerAccountingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const [preset, setPreset] = useState<Preset>("this_month");
  const [fromDate, setFromDate] = useState<string>(
    fmtDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  );
  const [toDate, setToDate] = useState<string>(fmtDate(new Date()));
  const [compareOn, setCompareOn] = useState(false);
  const [compareFrom, setCompareFrom] = useState<string>(() => {
    const d = new Date();
    return fmtDate(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  });
  const [compareTo, setCompareTo] = useState<string>(() => {
    const d = new Date();
    return fmtDate(new Date(d.getFullYear(), d.getMonth(), 0));
  });

  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [tradingData, setTradingData] = useState<TradingAccountData | null>(null);
  const [incomeData, setIncomeData] = useState<IncomeStatementData | null>(null);
  const [ledgerData, setLedgerData] = useState<LedgerData | null>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [auditData, setAuditData] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ledgerType, setLedgerType] = useState<string>("all");
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerLimit, setLedgerLimit] = useState(50);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCategory, setDrawerCategory] = useState<CategoryLine | null>(null);
  const [drawerExpenses, setDrawerExpenses] = useState<any[]>([]);

  const [auditFlagLegendOpen, setAuditFlagLegendOpen] = useState(false);
  const [expandedExpenseRow, setExpandedExpenseRow] = useState<string | null>(null);

  useEffect(() => {
    if (preset !== "custom") {
      const { from, to } = computePresetDates(preset);
      setFromDate(fmtDate(from));
      setToDate(fmtDate(to));
    }
  }, [preset]);

  const buildQuery = useCallback(() => {
    const q: Record<string, string | number> = { from: fromDate, to: toDate };
    if (compareOn && compareFrom && compareTo) {
      q.compare_from = compareFrom;
      q.compare_to = compareTo;
    }
    return q;
  }, [fromDate, toDate, compareOn, compareFrom, compareTo]);

  const loadTab = useCallback(
    async (tab: TabId) => {
      setLoading(true);
      setError(null);
      try {
        const q = buildQuery();
        if (tab === "overview") {
          const d = await fetchAccountingOverview(q as any);
          setOverviewData(d);
        } else if (tab === "trading") {
          const d = await fetchTradingAccount(q as any);
          setTradingData(d);
        } else if (tab === "income") {
          const d = await fetchIncomeStatement(q as any);
          setIncomeData(d);
        } else if (tab === "ledger") {
          const d = await fetchLedger({ ...q, page: ledgerPage, limit: ledgerLimit } as any);
          setLedgerData(d);
        } else if (tab === "revenue") {
          const d = await fetchRevenueAnalysis(q as any);
          setRevenueData(d);
        } else if (tab === "audit") {
          const d = await fetchAuditTrail(q as any);
          setAuditData(d);
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    },
    [buildQuery, ledgerPage, ledgerLimit]
  );

  useEffect(() => {
    loadTab(activeTab);
  }, [activeTab, fromDate, toDate, compareOn, compareFrom, compareTo]);

  useEffect(() => {
    if (activeTab === "ledger") loadTab("ledger");
  }, [ledgerPage, ledgerLimit]);

  const handleRefresh = () => loadTab(activeTab);

  function renderKPICard(label: string, value: number, icon: React.ReactNode, iconBg: string, prior?: number | null, isPct?: boolean) {
    const variance = prior != null ? fmtVariance(value, prior) : null;
    const displayVal = isPct ? fmtPct(value) : `$${fmtMoney(value)}`;
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
        </div>
        <div className={`text-2xl font-bold tabular-nums ${getMoneyClass(value)}`}>{displayVal}</div>
        {prior != null && (
          <div className="mt-1.5 text-xs text-gray-500">
            Prior: <span className="font-medium">{isPct ? fmtPct(prior) : `$${fmtMoney(prior)}`}</span>
            {variance && (
              <span className={`ml-2 font-semibold ${variance.positive ? "text-emerald-600" : "text-red-600"}`}>
                {variance.positive ? "+" : ""}{variance.pct}%
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderOverview() {
    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorState message={error} onRetry={handleRefresh} />;
    if (!overviewData) return null;
    const { kpis, prior_kpis, revenue_trend, expense_trend } = overviewData;
    const pk = prior_kpis;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {renderKPICard("Net Revenue", kpis.net_revenue, <DollarSign className="w-4 h-4 text-blue-600" />, "bg-blue-100", pk?.net_revenue)}
          {renderKPICard("Gross Profit", kpis.gross_profit, <TrendingUp className="w-4 h-4 text-emerald-600" />, "bg-emerald-100", pk?.gross_profit)}
          {renderKPICard("Net Profit / Loss", kpis.net_profit, kpis.net_profit >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />, kpis.net_profit >= 0 ? "bg-emerald-100" : "bg-red-100", pk?.net_profit)}
          {renderKPICard("Gross Margin", kpis.gross_margin_pct, <BarChart3 className="w-4 h-4 text-blue-600" />, "bg-blue-100", pk?.gross_margin_pct, true)}
          {renderKPICard("Net Margin", kpis.net_margin_pct, <BarChart3 className="w-4 h-4 text-indigo-600" />, "bg-indigo-100", pk?.net_margin_pct, true)}
          {renderKPICard("Cost of Revenue", kpis.total_cos, <Receipt className="w-4 h-4 text-orange-600" />, "bg-orange-100", pk?.total_cos)}
          {renderKPICard("Operating Expenses", kpis.total_opex, <Receipt className="w-4 h-4 text-purple-600" />, "bg-purple-100", pk?.total_opex)}
          {renderKPICard("Gross Revenue", kpis.gross_revenue, <DollarSign className="w-4 h-4 text-teal-600" />, "bg-teal-100", pk?.gross_revenue)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenue_trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1EA2E4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1EA2E4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`$${fmtMoney(v)}`, "Revenue"]} />
                <Area type="monotone" dataKey="amount" stroke="#1EA2E4" strokeWidth={2} fill="url(#mRevGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Expense Trend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={expense_trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mExpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`$${fmtMoney(v)}`, "Expenses"]} />
                <Area type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={2} fill="url(#mExpGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm max-w-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">P&L Summary</h3>
          <div className="space-y-1 text-sm font-mono">
            <PLRow label="Revenue" value={kpis.net_revenue} />
            <PLRow label="Cost of Revenue" value={-kpis.total_cos} />
            <div className="border-t border-gray-300 my-1" />
            <PLRow label="Gross Profit" value={kpis.gross_profit} pct={kpis.gross_margin_pct} bold />
            <PLRow label="Operating Expenses" value={-kpis.total_opex} />
            <div className="border-t border-gray-300 my-1" />
            <PLRow label="Net Profit" value={kpis.net_profit} pct={kpis.net_margin_pct} bold large />
          </div>
        </div>
      </div>
    );
  }

  function renderTradingAccount() {
    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorState message={error} onRetry={handleRefresh} />;
    if (!tradingData) return null;
    const { revenue, cost_of_revenue, gross_profit, gross_margin_pct, prior, period } = tradingData;
    const hasPrior = !!prior;

    return (
      <div className="space-y-4">
        <style>{`@media print { .no-print { display: none !important; } .print-full { width: 100% !important; } }`}</style>
        <div className="flex gap-2 no-print flex-wrap">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={() => exportTradingCSV(tradingData)} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm print-full max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-gray-900">MoRental Zimbabwe</h2>
            <h3 className="text-lg font-semibold text-gray-700 mt-1">Trading Account</h3>
            <p className="text-sm text-gray-500 mt-1">For the period: {period.from.slice(0, 10)} to {period.to.slice(0, 10)}</p>
          </div>
          {hasPrior && (
            <div className="flex justify-end gap-6 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide pr-2">
              <span className="w-28 text-right">Current</span>
              <span className="w-28 text-right">Prior</span>
              <span className="w-24 text-right">Variance</span>
            </div>
          )}
          <StatSection title="REVENUE" />
          <StatLine label="Rental Income" value={revenue.rental_income} prior={hasPrior ? prior.revenue.rental_income : undefined} />
          <StatLine label="Driver Income" value={revenue.driver_income} prior={hasPrior ? prior.revenue.driver_income : undefined} />
          <StatLine label="Less: Promo Discounts" value={-revenue.promo_discounts} prior={hasPrior ? -prior.revenue.promo_discounts : undefined} indent />
          <StatLine label="Less: Refunds" value={-revenue.refunds} prior={hasPrior ? -prior.revenue.refunds : undefined} indent />
          <StatSubtotal label="Net Revenue" value={revenue.net_revenue} prior={hasPrior ? prior.revenue.net_revenue : undefined} />
          <div className="my-4" />
          <StatSection title="COST OF REVENUE" />
          {cost_of_revenue.by_category.map((cat) => (
            <StatLine key={cat.category} label={cat.label} value={cat.total} prior={hasPrior ? prior.cost_of_revenue.by_category.find((c) => c.category === cat.category)?.total : undefined} clickable onClick={() => openDrawer(cat)} />
          ))}
          <StatLine label="Service Orders" value={cost_of_revenue.service_orders} prior={hasPrior ? prior.cost_of_revenue.service_orders : undefined} />
          <StatLine label="Vehicle Incidents (net)" value={cost_of_revenue.incidents_net} prior={hasPrior ? prior.cost_of_revenue.incidents_net : undefined} />
          <StatSubtotal label="Total Cost of Revenue" value={cost_of_revenue.total} prior={hasPrior ? prior.cost_of_revenue.total : undefined} />
          <div className="border-t-2 border-gray-300 my-4" />
          <div className="flex items-center justify-between py-2">
            <span className="text-base font-bold text-gray-900">GROSS PROFIT</span>
            <div className="flex gap-6">
              <span className={`text-base font-bold tabular-nums w-28 text-right ${getMoneyClass(gross_profit)}`}>${fmtMoney(gross_profit)}</span>
              {hasPrior && (
                <>
                  <span className={`text-sm font-semibold tabular-nums w-28 text-right ${getMoneyClass(prior.gross_profit)}`}>${fmtMoney(prior.gross_profit)}</span>
                  <VarianceBadge current={gross_profit} prior={prior.gross_profit} />
                </>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-500 text-right pr-2">
            Margin: {fmtPct(gross_margin_pct)}
            {hasPrior && <span className="ml-4">Prior: {fmtPct(prior.gross_margin_pct)}</span>}
          </div>
        </div>
        {drawerOpen && drawerCategory && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDrawerOpen(false)} />
            <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div>
                  <h3 className="font-semibold text-gray-900">{drawerCategory.label}</h3>
                  <p className="text-xs text-gray-500">{drawerCategory.count} expense(s)</p>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto flex-1 p-4">
                <div className="text-lg font-bold text-gray-900 mb-4">Total: ${fmtMoney(drawerCategory.total)}</div>
                {drawerExpenses.length === 0 ? (
                  <p className="text-sm text-gray-400">No details available.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead><tr className="text-left text-gray-500 border-b border-gray-200"><th className="pb-2">Date</th><th className="pb-2">Title</th><th className="pb-2 text-right">Amount</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {drawerExpenses.map((e: any) => (
                        <tr key={e._id}><td className="py-1.5 text-gray-600">{e.date?.slice(0, 10)}</td><td className="py-1.5 text-gray-700">{e.title}</td><td className="py-1.5 text-right font-mono tabular-nums">${fmtMoney(e.amount)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  function renderIncomeStatement() {
    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorState message={error} onRetry={handleRefresh} />;
    if (!incomeData) return null;
    const { revenue, cost_of_revenue, gross_profit, gross_margin_pct, operating_expenses, net_profit, net_margin_pct, prior, period } = incomeData;
    const hasPrior = !!prior;

    return (
      <div className="space-y-4">
        <style>{`@media print { .no-print { display: none !important; } .print-full { width: 100% !important; } }`}</style>
        <div className="flex gap-2 no-print flex-wrap">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><Printer className="w-4 h-4" /> Print</button>
          <button onClick={() => exportIncomeCSV(incomeData)} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><Download className="w-4 h-4" /> Export CSV</button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm print-full max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-gray-900">MoRental Zimbabwe</h2>
            <h3 className="text-lg font-semibold text-gray-700 mt-1">Income Statement</h3>
            <p className="text-sm text-gray-500 mt-1">For the period: {period.from.slice(0, 10)} to {period.to.slice(0, 10)}</p>
          </div>
          {hasPrior && (
            <div className="flex justify-end gap-6 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide pr-2">
              <span className="w-28 text-right">Current</span><span className="w-28 text-right">Prior</span><span className="w-24 text-right">Variance</span>
            </div>
          )}
          <StatSection title="REVENUE" />
          <StatLine label="Rental Income" value={revenue.rental_income} prior={hasPrior ? prior.revenue.rental_income : undefined} />
          <StatLine label="Driver Income" value={revenue.driver_income} prior={hasPrior ? prior.revenue.driver_income : undefined} />
          <StatLine label="Less: Promo Discounts" value={-revenue.promo_discounts} prior={hasPrior ? -prior.revenue.promo_discounts : undefined} indent />
          <StatLine label="Less: Refunds" value={-revenue.refunds} prior={hasPrior ? -prior.revenue.refunds : undefined} indent />
          <StatSubtotal label="Net Revenue" value={revenue.net_revenue} prior={hasPrior ? prior.revenue.net_revenue : undefined} />
          <div className="my-4" />
          <StatSection title="COST OF REVENUE" />
          {cost_of_revenue.by_category.map((cat) => (
            <StatLine key={cat.category} label={cat.label} value={cat.total} prior={hasPrior ? prior.cost_of_revenue.by_category.find((c) => c.category === cat.category)?.total : undefined} />
          ))}
          <StatLine label="Service Orders" value={cost_of_revenue.service_orders} prior={hasPrior ? prior.cost_of_revenue.service_orders : undefined} />
          <StatLine label="Vehicle Incidents (net)" value={cost_of_revenue.incidents_net} prior={hasPrior ? prior.cost_of_revenue.incidents_net : undefined} />
          <StatSubtotal label="Total Cost of Revenue" value={cost_of_revenue.total} prior={hasPrior ? prior.cost_of_revenue.total : undefined} />
          <StatSubtotal label="Gross Profit" value={gross_profit} prior={hasPrior ? prior.gross_profit : undefined} pct={gross_margin_pct} />
          <div className="my-4" />
          <StatSection title="OPERATING EXPENSES" />
          {operating_expenses.by_category.map((cat) => (
            <StatLine key={cat.category} label={cat.label} value={cat.total} prior={hasPrior ? prior.operating_expenses.by_category.find((c) => c.category === cat.category)?.total : undefined} />
          ))}
          <StatSubtotal label="Total Operating Expenses" value={operating_expenses.total} prior={hasPrior ? prior.operating_expenses.total : undefined} />
          <div className="border-t-2 border-gray-300 my-4" />
          <div className="flex items-center justify-between py-2">
            <span className="text-base font-bold text-gray-900">NET PROFIT / LOSS</span>
            <div className="flex gap-6">
              <span className={`text-base font-bold tabular-nums w-28 text-right ${getMoneyClass(net_profit)}`}>${fmtMoney(net_profit)}</span>
              {hasPrior && (
                <>
                  <span className={`text-sm font-semibold tabular-nums w-28 text-right ${getMoneyClass(prior.net_profit)}`}>${fmtMoney(prior.net_profit)}</span>
                  <VarianceBadge current={net_profit} prior={prior.net_profit} />
                </>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-500 text-right pr-2">
            Net Margin: {fmtPct(net_margin_pct)}
            {hasPrior && <span className="ml-4">Prior: {fmtPct(prior.net_margin_pct)}</span>}
          </div>
        </div>
      </div>
    );
  }

  function renderLedger() {
    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorState message={error} onRetry={handleRefresh} />;
    if (!ledgerData) return null;
    const { rows, total } = ledgerData;

    let filtered = rows;
    if (ledgerType !== "all") filtered = filtered.filter((r) => r.type === ledgerType);
    if (ledgerSearch.trim()) {
      const s = ledgerSearch.toLowerCase();
      filtered = filtered.filter((r) => r.description.toLowerCase().includes(s) || r.ref.toLowerCase().includes(s) || r.category.toLowerCase().includes(s));
    }

    const totalIn = filtered.reduce((s, r) => s + (r.amount_in || 0), 0);
    const totalOut = filtered.reduce((s, r) => s + (r.amount_out || 0), 0);
    const netFlow = totalIn - totalOut;
    const totalPages = Math.ceil(total / ledgerLimit);

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {["all", "revenue", "expense", "service_cost"].map((t) => (
              <button key={t} onClick={() => setLedgerType(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${ledgerType === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
                {t === "all" ? "All" : t === "service_cost" ? "Service Cost" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={ledgerSearch} onChange={(e) => setLedgerSearch(e.target.value)} placeholder="Search transactions..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]" />
          </div>
          <select value={ledgerLimit} onChange={(e) => { setLedgerLimit(Number(e.target.value)); setLedgerPage(1); }} className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]">
            <option value={25}>25/page</option><option value={50}>50/page</option><option value={100}>100/page</option>
          </select>
          <button onClick={() => exportLedgerCSV(rows)} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><Download className="w-4 h-4" /> Export</button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-right">Money In</th>
                  <th className="px-4 py-3 text-right">Money Out</th>
                  <th className="px-4 py-3 text-left">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">No transactions found</td></tr>
                ) : (
                  filtered.map((row, idx) => (
                    <tr key={idx} className={`hover:bg-gray-50 transition-colors ${row.type === "revenue" ? "border-l-2 border-emerald-400" : row.type === "expense" ? "border-l-2 border-red-400" : "border-l-2 border-orange-400"}`}>
                      <td className="px-4 py-3 text-gray-600 tabular-nums">{row.date}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{row.ref}</td>
                      <td className="px-4 py-3 text-gray-800 max-w-xs truncate">{row.description}</td>
                      <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${row.type === "revenue" ? "bg-emerald-100 text-emerald-700" : row.type === "expense" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>{row.type.replace("_", " ")}</span></td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{row.category.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-emerald-600">{row.amount_in > 0 ? `$${fmtMoney(row.amount_in)}` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-red-600">{row.amount_out > 0 ? `$${fmtMoney(row.amount_out)}` : "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{row.source}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-6 text-sm font-semibold">
            <span>Total In: <span className="text-emerald-600 tabular-nums">${fmtMoney(totalIn)}</span></span>
            <span>Total Out: <span className="text-red-600 tabular-nums">${fmtMoney(totalOut)}</span></span>
            <span>Net Flow: <span className={`tabular-nums ${getMoneyClass(netFlow)}`}>${fmtMoney(netFlow)}</span></span>
            <span className="ml-auto text-gray-400 font-normal">{total} total records</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Page {ledgerPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={ledgerPage <= 1} onClick={() => setLedgerPage((p) => p - 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
            <button disabled={ledgerPage >= totalPages} onClick={() => setLedgerPage((p) => p + 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    );
  }

  function renderRevenueAnalysis() {
    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorState message={error} onRetry={handleRefresh} />;
    if (!revenueData) return null;
    const { by_source, trend, metrics } = revenueData;
    const pieData = [
      { name: "Rental Income", value: by_source.rental_income },
      { name: "Driver Income", value: by_source.driver_income },
    ].filter((d) => d.value > 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"><p className="text-xs text-gray-500 mb-1">Avg Daily Revenue</p><p className="text-xl font-bold text-gray-900 tabular-nums">${fmtMoney(metrics.avg_daily_revenue)}</p></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"><p className="text-xs text-gray-500 mb-1">Peak Day</p><p className="text-xl font-bold text-gray-900 tabular-nums">${fmtMoney(metrics.peak_day?.amount || 0)}</p><p className="text-xs text-gray-400">{metrics.peak_day?.date || "—"}</p></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"><p className="text-xs text-gray-500 mb-1">Total Transactions</p><p className="text-xl font-bold text-gray-900 tabular-nums">{metrics.total_transactions}</p></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"><p className="text-xs text-gray-500 mb-1">Avg Transaction Value</p><p className="text-xl font-bold text-gray-900 tabular-nums">${fmtMoney(metrics.avg_transaction_value)}</p></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue by Source</h3>
            {pieData.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No data</p> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={true}>
                    {pieData.map((_entry, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`$${fmtMoney(v)}`, ""]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mRevGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1EA2E4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1EA2E4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`$${fmtMoney(v)}`, "Revenue"]} />
                <Area type="monotone" dataKey="amount" stroke="#1EA2E4" strokeWidth={2} fill="url(#mRevGrad2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Source Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xs text-gray-500">Rental Income</p><p className="text-lg font-bold text-gray-900 tabular-nums">${fmtMoney(by_source.rental_income)}</p><p className="text-xs text-gray-400">{by_source.rental_count} rentals</p></div>
            <div><p className="text-xs text-gray-500">Driver Income</p><p className="text-lg font-bold text-gray-900 tabular-nums">${fmtMoney(by_source.driver_income)}</p><p className="text-xs text-gray-400">{by_source.driver_count} bookings</p></div>
          </div>
        </div>
      </div>
    );
  }

  function renderAuditTrail() {
    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorState message={error} onRetry={handleRefresh} />;
    if (!auditData) return null;
    const { expenses, payments, summary } = auditData;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Expenses Reviewed" value={summary.expenses_reviewed} color="blue" />
          <SummaryCard label="Flagged Expenses" value={summary.expenses_flagged} color="amber" />
          <SummaryCard label="Payments Reviewed" value={summary.payments_reviewed} color="blue" />
          <SummaryCard label="Flagged Payments" value={summary.payments_flagged} color="red" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <button onClick={() => setAuditFlagLegendOpen((o) => !o)} className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <span>Flag Legend</span>
            {auditFlagLegendOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {auditFlagLegendOpen && (
            <div className="px-5 pb-4 flex flex-wrap gap-2">
              {Object.entries(FLAG_INFO).map(([key, info]) => (
                <div key={key} className={`px-2.5 py-1 rounded-full text-xs font-medium ${info.color} ${info.bg}`}>{key}: {info.label}</div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end no-print">
          <button onClick={() => exportAuditCSV(auditData)} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><Download className="w-4 h-4" /> Export Audit Report</button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200"><h3 className="font-semibold text-gray-800">Expense Audit</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <tr><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Ref</th><th className="px-4 py-3 text-left">Title</th><th className="px-4 py-3 text-left">Category</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Submitted By</th><th className="px-4 py-3 text-left">Approved By</th><th className="px-4 py-3 text-left">Flags</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.length === 0 ? <tr><td colSpan={9} className="text-center py-12 text-gray-400">No expenses in period</td></tr> : (
                  expenses.map((e: AuditExpense) => (
                    <>
                      <tr key={e._id} onClick={() => setExpandedExpenseRow(expandedExpenseRow === e._id ? null : e._id)} className={`cursor-pointer hover:bg-gray-50 transition-colors ${e.flags.includes("SELF_APPROVAL") ? "bg-red-50" : e.flags.length > 0 ? "bg-amber-50" : ""}`}>
                        <td className="px-4 py-3 text-gray-600 tabular-nums">{e.date?.slice(0, 10)}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{e.reference}</td>
                        <td className="px-4 py-3 text-gray-800 font-medium">{e.title}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs capitalize">{e.category.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">${fmtMoney(typeof e.amount === "number" ? e.amount : parseFloat(String(e.amount)) || 0)}</td>
                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${e.status === "approved" ? "bg-emerald-100 text-emerald-700" : e.status === "rejected" ? "bg-red-100 text-red-700" : e.status === "pending_approval" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>{e.status.replace(/_/g, " ")}</span></td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{e.submitted_by?.full_name || "—"}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{e.approved_by?.full_name || "—"}</td>
                        <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{e.flags.map((flag) => { const info = FLAG_INFO[flag]; return <span key={flag} className={`px-1.5 py-0.5 rounded text-xs font-medium ${info?.color || "text-gray-700"} ${info?.bg || "bg-gray-100"}`}>{flag}</span>; })}</div></td>
                      </tr>
                      {expandedExpenseRow === e._id && (
                        <tr key={`${e._id}-exp`} className="bg-gray-50">
                          <td colSpan={9} className="px-6 py-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600">
                              <div><span className="font-medium">Submitted:</span> {e.submitted_at ? new Date(e.submitted_at).toLocaleString() : "—"}</div>
                              <div><span className="font-medium">Approved:</span> {e.approved_at ? new Date(e.approved_at).toLocaleString() : "—"}</div>
                              <div><span className="font-medium">Receipts:</span> {e.receipt_images?.length || 0}</div>
                              <div><span className="font-medium">Branch:</span> {(e.branch_id as any)?.name || "—"}</div>
                              {e.rejection_reason && <div className="col-span-4 text-red-600"><span className="font-medium">Rejection Reason:</span> {e.rejection_reason}</div>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200"><h3 className="font-semibold text-gray-800">Payment Audit</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <tr><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Provider</th><th className="px-4 py-3 text-left">Method</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-left">User</th><th className="px-4 py-3 text-left">Flags</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">No payments in period</td></tr> : (
                  payments.map((p: AuditPayment) => (
                    <tr key={p._id} className={p.flags.includes("FAILED_ATTEMPT") ? "bg-red-50" : p.flags.includes("LARGE_PAYMENT") ? "bg-amber-50" : p.flags.includes("REFUND_ISSUED") ? "bg-blue-50" : ""}>
                      <td className="px-4 py-3 text-gray-600 tabular-nums">{p.boughtAt?.slice(0, 10)}</td>
                      <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : p.paymentStatus === "failed" || p.paymentStatus === "cancelled" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{p.paymentStatus}</span></td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{p.provider}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{p.method}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">${fmtMoney(p.pricePaid || 0)}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{(p as any).user?.full_name || "—"}</td>
                      <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{p.flags.map((flag) => { const info = FLAG_INFO[flag]; return <span key={flag} className={`px-1.5 py-0.5 rounded text-xs font-medium ${info?.color || "text-gray-700"} ${info?.bg || "bg-gray-100"}`}>{flag}</span>; })}</div></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function openDrawer(cat: CategoryLine) {
    setDrawerCategory(cat);
    setDrawerExpenses([]);
    setDrawerOpen(true);
    const raw = localStorage.getItem("car_rental_auth");
    const token = raw ? JSON.parse(raw)?.token : null;
    const params = new URLSearchParams({ status: "approved", category: cat.category, date_from: fromDate, date_to: toDate });
    fetch(`http://13.61.185.238:5050/api/v1/expenses?${params.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((data) => setDrawerExpenses(data.data || []))
      .catch(() => {});
  }

  function exportTradingCSV(data: TradingAccountData) {
    const rows: string[][] = [["MoRental Zimbabwe - Trading Account"], [`Period: ${data.period.from.slice(0, 10)} to ${data.period.to.slice(0, 10)}`], [], ["Section", "Item", "Amount"], ["Revenue", "Rental Income", String(data.revenue.rental_income)], ["Revenue", "Net Revenue", String(data.revenue.net_revenue)], ...data.cost_of_revenue.by_category.map((c) => ["Cost of Revenue", c.label, String(c.total)]), ["Cost of Revenue", "Total", String(data.cost_of_revenue.total)], ["", "Gross Profit", String(data.gross_profit)], ["", "Gross Margin %", `${data.gross_margin_pct.toFixed(1)}%`]];
    downloadCSV(rows, `trading_account_${data.period.from.slice(0, 10)}.csv`);
  }

  function exportIncomeCSV(data: IncomeStatementData) {
    const rows: string[][] = [["MoRental Zimbabwe - Income Statement"], [`Period: ${data.period.from.slice(0, 10)} to ${data.period.to.slice(0, 10)}`], [], ["Section", "Item", "Amount"], ["Revenue", "Net Revenue", String(data.revenue.net_revenue)], ...data.cost_of_revenue.by_category.map((c) => ["Cost of Revenue", c.label, String(c.total)]), ["Cost of Revenue", "Total", String(data.cost_of_revenue.total)], ["", "Gross Profit", String(data.gross_profit)], ...data.operating_expenses.by_category.map((c) => ["Operating Expenses", c.label, String(c.total)]), ["Operating Expenses", "Total", String(data.operating_expenses.total)], ["", "Net Profit", String(data.net_profit)]];
    downloadCSV(rows, `income_statement_${data.period.from.slice(0, 10)}.csv`);
  }

  function exportLedgerCSV(rows: LedgerEntry[]) {
    const csvRows: string[][] = [["Date", "Reference", "Description", "Type", "Category", "Money In", "Money Out", "Source", "Branch", "Recorded By"], ...rows.map((r) => [r.date, r.ref, r.description, r.type, r.category, String(r.amount_in), String(r.amount_out), r.source, r.branch_name, r.recorded_by])];
    downloadCSV(csvRows, `ledger_export.csv`);
  }

  function exportAuditCSV(data: any) {
    const rows: string[][] = [["=== FLAGGED EXPENSES ==="], ["Date", "Ref", "Title", "Category", "Amount", "Status", "Submitted By", "Approved By", "Flags"], ...data.expenses.filter((e: any) => e.flags.length > 0).map((e: any) => [e.date?.slice(0, 10) || "", e.reference || "", e.title, e.category, String(e.amount), e.status, e.submitted_by?.full_name || "", e.approved_by?.full_name || "", e.flags.join(", ")]), [], ["=== FLAGGED PAYMENTS ==="], ["Date", "Status", "Provider", "Method", "Amount", "User", "Flags"], ...data.payments.filter((p: any) => p.flags.length > 0).map((p: any) => [p.boughtAt?.slice(0, 10) || "", p.paymentStatus, p.provider, p.method, String(p.pricePaid), p.user?.full_name || "", p.flags.join(", ")])];
    downloadCSV(rows, `audit_report.csv`);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm no-print">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <div className="w-9 h-9 rounded-xl bg-[#1EA2E4]/10 flex items-center justify-center"><BookOpen className="w-5 h-5 text-[#1EA2E4]" /></div>
                <div><h1 className="text-lg font-bold text-gray-900">Accounting</h1><p className="text-xs text-gray-500">Financial Reports & Analysis</p></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">USD</span>
                <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1EA2E4]/90 transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {(["this_month", "last_month", "this_quarter", "this_year", "last_year", "custom"] as Preset[]).map((p) => (
                  <button key={p} onClick={() => setPreset(p)} className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${preset === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
                    {p === "this_month" ? "This Month" : p === "last_month" ? "Last Month" : p === "this_quarter" ? "This Quarter" : p === "this_year" ? "This Year" : p === "last_year" ? "Last Year" : "Custom"}
                  </button>
                ))}
              </div>
              {preset === "custom" && (
                <div className="flex gap-2 items-center">
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]" />
                  <span className="text-gray-400 text-sm">to</span>
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]" />
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={compareOn} onChange={(e) => setCompareOn(e.target.checked)} className="w-4 h-4 rounded text-[#1EA2E4]" />
                <span className="text-sm text-gray-600">Compare to Prior Period</span>
              </label>
              {compareOn && (
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-gray-500">Compare:</span>
                  <input type="date" value={compareFrom} onChange={(e) => setCompareFrom(e.target.value)} className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]" />
                  <span className="text-gray-400 text-sm">to</span>
                  <input type="date" value={compareTo} onChange={(e) => setCompareTo(e.target.value)} className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]" />
                </div>
              )}
            </div>
          </div>
          <div className="px-6 flex gap-0.5 border-t border-gray-100 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isTier2 = ["fixed_assets","balance_sheet","cash_flow","data_health"].includes(tab.id);
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${activeTab === tab.id ? (isTier2 ? "border-emerald-500 text-emerald-600" : "border-[#1EA2E4] text-[#1EA2E4]") : "border-transparent text-gray-600 hover:text-gray-900"}`}>
                  <Icon size={13} />{tab.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "trading" && renderTradingAccount()}
          {activeTab === "income" && renderIncomeStatement()}
          {activeTab === "ledger" && renderLedger()}
          {activeTab === "revenue" && renderRevenueAnalysis()}
          {activeTab === "audit" && renderAuditTrail()}
          {activeTab === "fixed_assets" && <FixedAssetsTab query={{ branch_id: undefined }} canEdit={true} />}
          {activeTab === "balance_sheet" && <BalanceSheetTab query={{}} canEdit={true} />}
          {activeTab === "cash_flow" && <CashFlowTab query={{}} />}
          {activeTab === "data_health" && <DataHealthTab query={{}} />}
        </div>
      </div>
    </div>
  );
}

// ── Shared Sub-components ─────────────────────────────────────────────────────

function PLRow({ label, value, pct, bold, large }: { label: string; value: number; pct?: number; bold?: boolean; large?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-0.5 ${bold ? "font-semibold" : ""} ${large ? "text-base" : "text-sm"}`}>
      <span className="text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        {pct !== undefined && <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>}
        <span className={`tabular-nums ${getMoneyClass(value)}`}>{value < 0 ? `($${fmtMoney(Math.abs(value))})` : `$${fmtMoney(value)}`}</span>
      </div>
    </div>
  );
}

function StatSection({ title }: { title: string }) {
  return <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-2 mb-1">{title}</div>;
}

function StatLine({ label, value, prior, indent, clickable, onClick }: { label: string; value: number; prior?: number; indent?: boolean; clickable?: boolean; onClick?: () => void }) {
  const hasPrior = prior !== undefined;
  return (
    <div className={`flex items-center justify-between py-1 text-sm ${indent ? "pl-4" : ""} ${clickable ? "cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1 transition-colors" : ""}`} onClick={onClick}>
      <span className={`text-gray-700 ${clickable ? "text-[#1EA2E4] hover:underline" : ""}`}>{label}</span>
      <div className="flex items-center gap-6">
        <span className={`tabular-nums w-28 text-right ${getMoneyClass(value)}`}>{value < 0 ? `($${fmtMoney(Math.abs(value))})` : `$${fmtMoney(value)}`}</span>
        {hasPrior && (
          <>
            <span className={`text-xs tabular-nums w-28 text-right ${getMoneyClass(prior!)}`}>{prior! < 0 ? `($${fmtMoney(Math.abs(prior!))})` : `$${fmtMoney(prior!)}`}</span>
            <VarianceBadge current={value} prior={prior!} />
          </>
        )}
      </div>
    </div>
  );
}

function StatSubtotal({ label, value, prior, pct }: { label: string; value: number; prior?: number; pct?: number }) {
  const hasPrior = prior !== undefined;
  return (
    <div className="flex items-center justify-between py-1.5 border-t border-gray-200 mt-1 text-sm font-semibold">
      <span className="text-gray-800">{label}{pct !== undefined ? ` (${pct.toFixed(1)}%)` : ""}</span>
      <div className="flex items-center gap-6">
        <span className={`tabular-nums w-28 text-right ${getMoneyClass(value)}`}>{value < 0 ? `($${fmtMoney(Math.abs(value))})` : `$${fmtMoney(value)}`}</span>
        {hasPrior && (
          <>
            <span className={`text-xs tabular-nums w-28 text-right ${getMoneyClass(prior!)}`}>{prior! < 0 ? `($${fmtMoney(Math.abs(prior!))})` : `$${fmtMoney(prior!)}`}</span>
            <VarianceBadge current={value} prior={prior!} />
          </>
        )}
      </div>
    </div>
  );
}

function VarianceBadge({ current, prior }: { current: number; prior: number }) {
  if (!prior) return <span className="w-24" />;
  const diff = current - prior;
  const pct = ((diff / prior) * 100).toFixed(1);
  const positive = diff >= 0;
  return <span className={`inline-flex items-center text-xs font-semibold w-24 justify-end tabular-nums ${positive ? "text-emerald-600" : "text-red-600"}`}>{positive ? "+" : ""}{pct}%</span>;
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: "blue" | "amber" | "red" | "emerald" }) {
  const colorMap = { blue: "bg-blue-50 text-blue-700 border-blue-200", amber: "bg-amber-50 text-amber-700 border-amber-200", red: "bg-red-50 text-red-700 border-red-200", emerald: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />)}</div>
      <div className="grid grid-cols-2 gap-4"><div className="h-64 rounded-xl bg-gray-200 animate-pulse" /><div className="h-64 rounded-xl bg-gray-200 animate-pulse" /></div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-7 h-7 text-red-500" /></div>
      <p className="text-gray-600 font-medium">{message}</p>
      <button onClick={onRetry} className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg text-sm hover:bg-[#1EA2E4]/90 transition-colors">Retry</button>
    </div>
  );
}
