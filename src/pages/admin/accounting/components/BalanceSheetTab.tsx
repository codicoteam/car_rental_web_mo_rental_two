import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Save, AlertTriangle, CheckCircle } from "lucide-react";
import {
  fetchBalanceSheet, fetchBalanceEntries, createBalanceEntry, updateBalanceEntry, deleteBalanceEntry,
} from "../../../../Services/adminAndManager/accounting_service";
import type { BalanceSheetData, BalanceEntryItem } from "../../../../Services/adminAndManager/accounting_service";

const fmtM = (n: number, showSign = false) => {
  const abs = Math.abs(n);
  const str = `$${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n < 0) return <span className="text-red-600">({str})</span>;
  if (showSign && n > 0) return <span className="text-green-700">{str}</span>;
  return <span>{str}</span>;
};

const CATEGORY_LABELS: Record<string, string> = {
  cash_bank: "Cash & Bank", accounts_receivable: "Accounts Receivable",
  prepayments: "Prepayments", deposits: "Deposits", other_current_asset: "Other Current Assets",
  property_equipment: "Property & Equipment", intangibles: "Intangible Assets",
  investments: "Investments", other_noncurrent_asset: "Other Non-Current Assets",
  accounts_payable: "Accounts Payable", accrued_expenses: "Accrued Expenses",
  tax_payable: "Tax Payable", short_term_loan: "Short-Term Loan",
  vehicle_loan: "Vehicle Finance / Loan", bank_loan: "Bank Loan",
  lease_obligation: "Lease Obligation", other_liability: "Other Liability",
  share_capital: "Share Capital", retained_earnings: "Retained Earnings",
  drawings: "Drawings / Distributions", revaluation_reserve: "Revaluation Reserve",
  other_equity: "Other Equity",
};

const TYPE_CATEGORIES: Record<string, string[]> = {
  asset: ["cash_bank", "accounts_receivable", "prepayments", "deposits", "other_current_asset", "property_equipment", "intangibles", "investments", "other_noncurrent_asset"],
  liability: ["accounts_payable", "accrued_expenses", "tax_payable", "short_term_loan", "vehicle_loan", "bank_loan", "lease_obligation", "other_liability"],
  equity: ["share_capital", "retained_earnings", "drawings", "revaluation_reserve", "other_equity"],
};

interface Props {
  query: { from?: string; to?: string; branch_id?: string };
  canEdit: boolean;
  branchId?: string;
}

interface EntryForm {
  type: "asset" | "liability" | "equity";
  category: string;
  description: string;
  amount: string;
  effective_date: string;
  reference: string;
  notes: string;
  change_reason: string;
}

const emptyForm = (): EntryForm => ({
  type: "liability", category: "vehicle_loan", description: "", amount: "",
  effective_date: new Date().toISOString().slice(0, 10), reference: "", notes: "", change_reason: "",
});

function BSLine({ label, value, bold = false, indent = false, sub = false }: { label: string; value: number; bold?: boolean; indent?: boolean; sub?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-1 ${indent ? "pl-8" : sub ? "pl-12" : ""} ${bold ? "font-semibold border-t border-gray-200 mt-1 pt-2" : ""}`}>
      <span className={`text-sm ${bold ? "text-gray-900" : "text-gray-600"}`}>{label}</span>
      <span className={`text-sm font-mono tabular-nums ${bold ? "font-bold" : ""}`}>{fmtM(value)}</span>
    </div>
  );
}

export default function BalanceSheetTab({ query, canEdit, branchId }: Props) {
  const [bs, setBs] = useState<BalanceSheetData | null>(null);
  const [entries, setEntries] = useState<BalanceEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; entry?: BalanceEntryItem } | null>(null);
  const [form, setForm] = useState<EntryForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [activeTab, setActiveTab] = useState<"sheet" | "entries">("sheet");

  const load = async () => {
    setLoading(true);
    try {
      const [bsData, entData] = await Promise.all([
        fetchBalanceSheet(query),
        fetchBalanceEntries({ branch_id: branchId }),
      ]);
      setBs(bsData);
      setEntries(entData.entries);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [query.from, query.to, query.branch_id]);

  const openCreate = () => { setForm(emptyForm()); setFormError(""); setModal({ mode: "create" }); };
  const openEdit = (e: BalanceEntryItem) => {
    setForm({ type: e.type, category: e.category, description: e.description, amount: String(e.amount), effective_date: e.effective_date.slice(0, 10), reference: e.reference, notes: e.notes, change_reason: "" });
    setFormError("");
    setModal({ mode: "edit", entry: e });
  };

  const handleSave = async () => {
    setFormError(""); setSaving(true);
    try {
      if (modal?.mode === "create") {
        await createBalanceEntry({ ...form, amount: parseFloat(form.amount), branch_id: branchId || null });
      } else if (modal?.mode === "edit" && modal.entry) {
        await updateBalanceEntry(modal.entry._id, { amount: parseFloat(form.amount), description: form.description, effective_date: form.effective_date, reference: form.reference, notes: form.notes, change_reason: form.change_reason });
      }
      setModal(null); load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Save failed.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this balance entry? This action cannot be undone.")) return;
    await deleteBalanceEntry(id); load();
  };

  if (loading) return <div className="text-center py-16 text-gray-400">Loading balance sheet…</div>;
  if (!bs) return null;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(["sheet", "entries"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 text-sm rounded-md transition font-medium ${activeTab === t ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "sheet" ? "Balance Sheet" : "Balance Entries"}
          </button>
        ))}
      </div>

      {activeTab === "sheet" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ASSETS */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">ASSETS</h3>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-3 mb-1">Current Assets</div>
            <BSLine label="Cash & Bank Balances" value={bs.assets.current.cash_and_bank} indent />
            <BSLine label="Accounts Receivable" value={bs.assets.current.accounts_receivable} indent />
            {bs.assets.current.other.map((r) => <BSLine key={r.category} label={CATEGORY_LABELS[r.category] || r.category} value={r.total} indent />)}
            <BSLine label="Total Current Assets" value={bs.assets.current.total} bold />

            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-1">Non-Current Assets</div>
            <BSLine label="Vehicle Fleet — At Cost" value={bs.assets.non_current.fleet.at_cost} indent />
            <BSLine label="Less: Accumulated Depreciation" value={-bs.assets.non_current.fleet.accumulated_depreciation} indent />
            <BSLine label="Net Book Value of Fleet" value={bs.assets.non_current.fleet.net_book_value} sub />
            {bs.assets.non_current.other.map((r) => <BSLine key={r.category} label={CATEGORY_LABELS[r.category] || r.category} value={r.total} indent />)}
            <BSLine label="Total Non-Current Assets" value={bs.assets.non_current.total} bold />

            <div className="mt-3 pt-2 border-t-2 border-gray-800">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm">TOTAL ASSETS</span>
                <span className="font-bold text-gray-900 text-sm font-mono">${bs.assets.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* LIABILITIES + EQUITY */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">LIABILITIES</h3>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-3 mb-1">Current Liabilities</div>
              {bs.liabilities.current.rows.map((r) => <BSLine key={r.category} label={CATEGORY_LABELS[r.category] || r.category} value={r.total} indent />)}
              {bs.liabilities.current.rows.length === 0 && <div className="text-xs text-gray-400 pl-8 py-1">No current liabilities recorded</div>}
              <BSLine label="Total Current Liabilities" value={bs.liabilities.current.total} bold />

              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-1">Non-Current Liabilities</div>
              {bs.liabilities.non_current.rows.map((r) => <BSLine key={r.category} label={CATEGORY_LABELS[r.category] || r.category} value={r.total} indent />)}
              {bs.liabilities.non_current.rows.length === 0 && <div className="text-xs text-gray-400 pl-8 py-1">No non-current liabilities recorded</div>}
              <BSLine label="Total Non-Current Liabilities" value={bs.liabilities.non_current.total} bold />
              <BSLine label="TOTAL LIABILITIES" value={bs.liabilities.total} bold />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">EQUITY</h3>
              <BSLine label="Share Capital" value={bs.equity.share_capital} indent />
              <BSLine label="Retained Earnings" value={bs.equity.retained_earnings} indent />
              <BSLine label="Less: Drawings / Distributions" value={-bs.equity.drawings} indent />
              <BSLine label="Revaluation Reserve" value={bs.equity.revaluation_reserve} indent />
              <BSLine label="TOTAL EQUITY" value={bs.equity.total} bold />

              <div className="mt-3 pt-2 border-t-2 border-gray-800">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-sm">TOTAL LIABILITIES + EQUITY</span>
                  <span className="font-bold text-gray-900 text-sm font-mono">${bs.total_liabilities_and_equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className={`mt-2 flex items-center gap-2 text-sm ${bs.is_balanced ? "text-green-600" : "text-red-600"}`}>
                  {bs.is_balanced ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  {bs.is_balanced ? "Balanced" : `Out of balance by $${Math.abs(bs.balancing_difference).toFixed(2)}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "entries" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{entries.length} balance entries recorded</p>
            {canEdit && (
              <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                <Plus size={14} /> Add Entry
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Added By</th>
                  {canEdit && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No entries yet. Add loans, capital, or opening balances.</td></tr>
                ) : entries.map((e) => (
                  <tr key={e._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(e.effective_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${e.type === "asset" ? "bg-green-50 text-green-700" : e.type === "liability" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>{e.type}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{CATEGORY_LABELS[e.category] || e.category}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{e.description}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{e.reference || "—"}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{fmtM(e.amount)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <div>{e.created_by?.full_name || "—"}</div>
                      <div className="text-gray-400">{new Date(e.created_at).toLocaleDateString()}</div>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(e)} className="p-1 text-blue-400 hover:text-blue-600"><Edit2 size={13} /></button>
                          <button onClick={() => handleDelete(e._id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">{modal.mode === "create" ? "Add Balance Entry" : "Edit Balance Entry"}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {formError && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{formError}</div>}

              {modal.mode === "create" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Type *</label>
                    <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value as EntryForm["type"], category: TYPE_CATEGORIES[e.target.value][0] }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="asset">Asset</option>
                      <option value="liability">Liability</option>
                      <option value="equity">Equity</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Category *</label>
                    <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {TYPE_CATEGORIES[form.type].map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Description *</label>
                <input type="text" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="E.g. Vehicle loan — Toyota Hilux" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Amount (USD) *</label>
                  <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                  <p className="text-[10px] text-gray-400 mt-0.5">Use negative for repayments/drawings</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Effective Date *</label>
                  <input type="date" value={form.effective_date} onChange={(e) => setForm(f => ({ ...f, effective_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Reference Number</label>
                <input type="text" value={form.reference} onChange={(e) => setForm(f => ({ ...f, reference: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Loan agreement, invoice number…" />
              </div>

              {modal.mode === "edit" && (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Reason for Change</label>
                  <input type="text" value={form.change_reason} onChange={(e) => setForm(f => ({ ...f, change_reason: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                <Save size={14} /> {saving ? "Saving…" : "Save Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
