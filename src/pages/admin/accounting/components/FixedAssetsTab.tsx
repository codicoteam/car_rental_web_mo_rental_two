import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car, Plus, Edit2, AlertTriangle, CheckCircle, Info,
  ChevronDown, ChevronUp, X, Save, History, ExternalLink,
} from "lucide-react";
import {
  fetchFixedAssets, createFixedAsset, updateFixedAsset, fetchBranchVehicles,
} from "../../../../Services/adminAndManager/accounting_service";
import type { FixedAssetsData, FixedAssetRow, AssetRecord } from "../../../../Services/adminAndManager/accounting_service";

const fmtMoney = (n: number) => {
  if (n < 0) return <span className="text-red-600">({Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

const METHOD_LABELS: Record<string, string> = {
  straight_line: "Straight Line",
  declining_balance: "Declining Balance",
  units_of_production: "Units of Production",
};

const FLAG_STYLE: Record<string, string> = {
  FULLY_DEP_ACTIVE: "bg-red-100 text-red-700",
  NO_ASSET_RECORD: "bg-red-100 text-red-700",
  NEAR_END_OF_LIFE: "bg-amber-100 text-amber-700",
  DISPOSAL_GAIN: "bg-green-100 text-green-700",
  DISPOSAL_LOSS: "bg-red-100 text-red-700",
};

interface Props {
  query: { from?: string; to?: string; branch_id?: string };
  canEdit: boolean;
}

interface FormState {
  isVehicleAsset: boolean;
  vehicle_id: string;
  asset_name: string;
  branch_id: string;
  acquisition_cost: string;
  acquisition_date: string;
  useful_life_years: string;
  salvage_value: string;
  depreciation_method: "straight_line" | "declining_balance" | "units_of_production";
  declining_rate_pct: string;
  total_expected_km: string;
  notes: string;
  change_reason: string;
  disposal_date: string;
  disposal_amount: string;
  disposal_notes: string;
}

const emptyForm = (): FormState => ({
  isVehicleAsset: true, vehicle_id: "", asset_name: "", branch_id: "",
  acquisition_cost: "", acquisition_date: "",
  useful_life_years: "5", salvage_value: "0", depreciation_method: "straight_line",
  declining_rate_pct: "25", total_expected_km: "150000", notes: "",
  change_reason: "", disposal_date: "", disposal_amount: "", disposal_notes: "",
});

export default function FixedAssetsTab({ query, canEdit }: Props) {
  const navigate = useNavigate();
  const [data, setData] = useState<FixedAssetsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{ mode: "create" | "edit"; asset?: AssetRecord; row?: FixedAssetRow } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [vehicles, setVehicles] = useState<Array<{ _id: string; plate_number: string; vehicle_model_id?: { make: string; model: string; year: number }; branch_id?: { _id: string; name: string } }>>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const d = await fetchFixedAssets(query);
      setData(d);
    } catch {
      setError("Failed to load fixed assets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [query.from, query.to, query.branch_id]);

  const openCreate = async (preselectedVehicleId?: string) => {
    const vs = await fetchBranchVehicles(query.branch_id);
    const registeredIds = new Set(
      (data?.rows ?? []).filter((r) => r.has_asset_record && r.is_vehicle !== false && r.vehicle_id).map((r) => r.vehicle_id)
    );
    const available = vs.filter((v) => !registeredIds.has(v._id));
    setVehicles(available);
    const base = emptyForm();
    if (preselectedVehicleId) {
      const v = vs.find((x) => x._id === preselectedVehicleId);
      base.vehicle_id = preselectedVehicleId;
      base.branch_id = v?.branch_id?._id || "";
    }
    setForm(base);
    setFormError("");
    setModal({ mode: "create" });
  };

  const openEdit = (row: FixedAssetRow) => {
    if (!row.asset) return;
    const a = row.asset;
    setForm({
      isVehicleAsset: row.is_vehicle !== false,
      asset_name: row.asset_name || "",
      vehicle_id: row.vehicle_id || "",
      branch_id: row.branch_id || "",
      acquisition_cost: String(a.acquisition_cost),
      acquisition_date: a.acquisition_date ? a.acquisition_date.slice(0, 10) : "",
      useful_life_years: String(a.useful_life_years),
      salvage_value: String(a.salvage_value),
      depreciation_method: a.depreciation_method,
      declining_rate_pct: String(a.declining_rate_pct || 25),
      total_expected_km: String(a.total_expected_km || 150000),
      notes: a.notes,
      change_reason: "",
      disposal_date: a.disposal_date ? a.disposal_date.slice(0, 10) : "",
      disposal_amount: a.disposal_amount ? String(a.disposal_amount) : "",
      disposal_notes: a.disposal_notes || "",
    });
    setFormError("");
    setModal({ mode: "edit", asset: a, row });
  };

  const handleSave = async () => {
    setFormError("");
    setSaving(true);
    try {
      if (modal?.mode === "create") {
        await createFixedAsset({
          is_vehicle: form.isVehicleAsset,
          vehicle_id: form.isVehicleAsset ? form.vehicle_id : undefined,
          asset_name: form.isVehicleAsset ? undefined : form.asset_name,
          branch_id: form.branch_id,
          acquisition_cost: parseFloat(form.acquisition_cost),
          acquisition_date: form.acquisition_date,
          useful_life_years: parseInt(form.useful_life_years),
          salvage_value: parseFloat(form.salvage_value || "0"),
          depreciation_method: form.depreciation_method,
          declining_rate_pct: form.depreciation_method === "declining_balance" ? parseFloat(form.declining_rate_pct) : null,
          total_expected_km: form.depreciation_method === "units_of_production" ? parseInt(form.total_expected_km) : null,
          notes: form.notes,
        });
      } else if (modal?.mode === "edit" && modal.asset) {
        await updateFixedAsset(modal.asset._id, {
          acquisition_cost: parseFloat(form.acquisition_cost),
          acquisition_date: form.acquisition_date,
          useful_life_years: parseInt(form.useful_life_years),
          salvage_value: parseFloat(form.salvage_value || "0"),
          depreciation_method: form.depreciation_method,
          declining_rate_pct: form.depreciation_method === "declining_balance" ? parseFloat(form.declining_rate_pct) : null,
          total_expected_km: form.depreciation_method === "units_of_production" ? parseInt(form.total_expected_km) : null,
          disposal_date: form.disposal_date || null,
          disposal_amount: form.disposal_amount ? parseFloat(form.disposal_amount) : null,
          disposal_notes: form.disposal_notes,
          notes: form.notes,
          change_reason: form.change_reason,
        });
      }
      setModal(null);
      load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  if (loading) return <div className="text-center py-16 text-gray-400">Loading fixed assets…</div>;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;
  if (!data) return null;

  const { totals, rows } = data;

  return (
    <div className="space-y-6">
      {/* KPI bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Fleet at Cost", value: totals.cost, icon: Car, color: "text-blue-600" },
          { label: "Accum. Depreciation", value: -totals.accumulated_depreciation, icon: ChevronDown, color: "text-red-500" },
          { label: "Net Book Value", value: totals.net_book_value, icon: CheckCircle, color: "text-green-600" },
          { label: "Annual Depreciation", value: totals.annual_depreciation, icon: History, color: "text-amber-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 font-medium">{label}</span>
              <Icon size={14} className={color} />
            </div>
            <div className={`text-xl font-bold ${value < 0 ? "text-red-600" : "text-gray-900"}`}>
              {value < 0 ? `($${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
          </div>
        ))}
      </div>

      {/* Header + register button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Depreciation Schedule</h3>
          <p className="text-xs text-gray-500 mt-0.5">{data.registered} registered · {data.unregistered} unregistered of {data.vehicles_in_scope} vehicles</p>
        </div>
        {canEdit && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <Plus size={14} /> Register Asset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Asset</th>
              <th className="px-4 py-3 text-left">Branch</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3 text-right">Accum. Dep.</th>
              <th className="px-4 py-3 text-right">NBV</th>
              <th className="px-4 py-3 text-right">%</th>
              <th className="px-4 py-3 text-center">Method</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowKey = row.vehicle_id || row.asset?._id || row.asset_name || "";
              const dep = row.depreciation;
              const isExp = expanded.has(rowKey);
              return (
                <React.Fragment key={rowKey}>
                  <tr className={`border-b border-gray-50 hover:bg-gray-50 transition ${!row.has_asset_record ? "bg-red-50/40" : ""}`}>
                    <td className="px-4 py-3">
                      {row.is_vehicle !== false ? (
                        <>
                          <div className="font-medium text-gray-900">{row.plate_number}</div>
                          <div className="text-xs text-gray-400">{row.make} {row.model} {row.year}</div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium text-gray-900">{row.asset_name}</div>
                          <div className="text-xs text-gray-400">Non-Vehicle Asset</div>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{row.branch || "—"}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-900">
                      {dep ? fmtMoney(dep.cost) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-red-600">
                      {dep ? `($${dep.accumulated_depreciation.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {dep ? (
                        <span className={dep.net_book_value <= dep.salvage + 0.01 ? "text-red-600" : dep.pct_depreciated > 80 ? "text-amber-600" : "text-green-700"}>
                          {fmtMoney(dep.net_book_value)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">
                      {dep ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <span>{fmtPct(dep.pct_depreciated)}</span>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${dep.pct_depreciated >= 100 ? "bg-red-500" : dep.pct_depreciated > 80 ? "bg-amber-400" : "bg-blue-500"}`} style={{ width: `${Math.min(dep.pct_depreciated, 100)}%` }} />
                          </div>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {row.asset ? METHOD_LABELS[row.asset.depreciation_method] : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.flags.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {row.flags.map((f) => (
                            <span key={f} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${FLAG_STYLE[f] || "bg-gray-100 text-gray-600"}`}>{f.replace(/_/g, " ")}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded font-medium">OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {row.has_asset_record && (
                          <button onClick={() => toggleRow(rowKey)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                            {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                        {canEdit && (
                          <button onClick={() => row.has_asset_record ? openEdit(row) : openCreate(row.vehicle_id || undefined)} className="p-1 text-blue-400 hover:text-blue-600 rounded" title={row.has_asset_record ? "Edit" : "Register"}>
                            {row.has_asset_record ? <Edit2 size={14} /> : <Plus size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {isExp && row.asset && (
                    <tr className="bg-blue-50/30 border-b border-gray-100">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div><span className="text-gray-400 block">Acquisition Date</span><span className="font-medium text-gray-700">{row.asset.acquisition_date ? new Date(row.asset.acquisition_date).toLocaleDateString() : "—"}</span></div>
                          <div><span className="text-gray-400 block">Useful Life</span><span className="font-medium text-gray-700">{row.asset.useful_life_years} years ({row.depreciation?.years_remaining.toFixed(1)} remaining)</span></div>
                          <div><span className="text-gray-400 block">Salvage Value</span><span className="font-medium text-gray-700">{fmtMoney(row.asset.salvage_value)}</span></div>
                          <div><span className="text-gray-400 block">Annual Depreciation</span><span className="font-medium text-gray-700">{row.depreciation?.annual_depreciation ? fmtMoney(row.depreciation.annual_depreciation) : "Variable"}</span></div>
                          <div><span className="text-gray-400 block">Registered By</span><span className="font-medium text-gray-700">{row.asset.created_by?.full_name || "—"}</span></div>
                          <div><span className="text-gray-400 block">Registered On</span><span className="font-medium text-gray-700">{row.asset.created_at ? new Date(row.asset.created_at).toLocaleDateString() : "—"}</span></div>
                          {row.asset.updated_by && <div><span className="text-gray-400 block">Last Modified By</span><span className="font-medium text-gray-700">{row.asset.updated_by.full_name} ({new Date(row.asset.updated_at).toLocaleDateString()})</span></div>}
                          {row.asset.disposal_date && <div><span className="text-gray-400 block">Disposed</span><span className="font-medium text-gray-700">{new Date(row.asset.disposal_date).toLocaleDateString()} · {row.depreciation?.disposal_gain_loss != null ? (row.depreciation.disposal_gain_loss >= 0 ? "Gain " : "Loss ") + fmtMoney(Math.abs(row.depreciation.disposal_gain_loss)) : "—"}</span></div>}
                        </div>
                        {row.asset.change_log && row.asset.change_log.length > 0 && (
                          <div className="mt-3 border-t border-gray-100 pt-3">
                            <div className="text-[10px] text-gray-400 font-medium uppercase mb-1.5">Change History</div>
                            <div className="space-y-1">
                              {row.asset.change_log.map((c, i) => (
                                <div key={i} className="text-xs text-gray-600 flex gap-2">
                                  <span className="text-gray-400">{new Date(c.changed_at).toLocaleDateString()}</span>
                                  <span className="font-medium">{c.changed_by?.full_name || "Unknown"}</span>
                                  <span>changed <em>{c.field}</em> from <code className="bg-gray-100 px-1 rounded">{String(c.old_value)}</code> to <code className="bg-gray-100 px-1 rounded">{String(c.new_value)}</code></span>
                                  {c.reason && <span className="text-gray-400">— {c.reason}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">{modal.mode === "create" ? "Register Fixed Asset" : "Edit Fixed Asset"}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {formError && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{formError}</div>}

              {modal.mode === "create" && (
                <div className="space-y-3">
                  {/* Asset type toggle */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Asset Type *</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, isVehicleAsset: true, asset_name: "" }))}
                        className={`flex-1 py-2 text-sm rounded-lg border font-medium transition ${form.isVehicleAsset ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
                      >
                        Vehicle
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, isVehicleAsset: false, vehicle_id: "", branch_id: "" }))}
                        className={`flex-1 py-2 text-sm rounded-lg border font-medium transition ${!form.isVehicleAsset ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
                      >
                        Other Asset
                      </button>
                    </div>
                  </div>

                  {form.isVehicleAsset ? (
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Vehicle *</label>
                      <select value={form.vehicle_id} onChange={(e) => {
                        const v = vehicles.find(v => v._id === e.target.value);
                        setForm(f => ({ ...f, vehicle_id: e.target.value, branch_id: v?.branch_id?._id || "" }));
                      }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select vehicle…</option>
                        {vehicles.map((v) => (
                          <option key={v._id} value={v._id}>
                            {v.plate_number} — {v.vehicle_model_id?.make} {v.vehicle_model_id?.model} {v.vehicle_model_id?.year ? `(${v.vehicle_model_id.year})` : ""}
                          </option>
                        ))}
                      </select>
                      {vehicles.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">All vehicles in scope already have a fixed asset record.</p>
                      )}
                      <button
                        type="button"
                        onClick={() => { setModal(null); navigate("/admin-vehicles"); }}
                        className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <ExternalLink size={11} /> Add a new vehicle first
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Asset Name *</label>
                      <input
                        type="text"
                        value={form.asset_name}
                        onChange={(e) => setForm(f => ({ ...f, asset_name: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="E.g. Generator, Office Furniture, Computer Equipment…"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Acquisition Cost (USD) *</label>
                  <input type="number" step="0.01" value={form.acquisition_cost} onChange={(e) => setForm(f => ({ ...f, acquisition_cost: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Acquisition Date *</label>
                  <input type="date" value={form.acquisition_date} onChange={(e) => setForm(f => ({ ...f, acquisition_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Useful Life (years) *</label>
                  <input type="number" min="1" max="30" value={form.useful_life_years} onChange={(e) => setForm(f => ({ ...f, useful_life_years: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Salvage Value (USD)</label>
                  <input type="number" step="0.01" min="0" value={form.salvage_value} onChange={(e) => setForm(f => ({ ...f, salvage_value: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Depreciation Method *</label>
                <select value={form.depreciation_method} onChange={(e) => setForm(f => ({ ...f, depreciation_method: e.target.value as FormState["depreciation_method"] }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="straight_line">Straight Line — equal charge each year</option>
                  <option value="declining_balance">Declining Balance — higher charge early years</option>
                  {(modal?.mode === "edit" ? modal.row?.is_vehicle !== false : form.isVehicleAsset) && (
                    <option value="units_of_production">Units of Production — based on KM driven</option>
                  )}
                </select>
              </div>

              {form.depreciation_method === "declining_balance" && (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Annual Declining Rate (%)</label>
                  <input type="number" min="1" max="99" value={form.declining_rate_pct} onChange={(e) => setForm(f => ({ ...f, declining_rate_pct: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <p className="text-[10px] text-gray-400 mt-0.5">Typical vehicles: 25–33%</p>
                </div>
              )}
              {form.depreciation_method === "units_of_production" && (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Total Expected KM</label>
                  <input type="number" min="1" value={form.total_expected_km} onChange={(e) => setForm(f => ({ ...f, total_expected_km: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}

              {modal.mode === "edit" && (
                <>
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Disposal (optional)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Disposal Date</label>
                        <input type="date" value={form.disposal_date} onChange={(e) => setForm(f => ({ ...f, disposal_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Disposal Proceeds (USD)</label>
                        <input type="number" step="0.01" min="0" value={form.disposal_amount} onChange={(e) => setForm(f => ({ ...f, disposal_amount: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Reason for Change *</label>
                    <input type="text" value={form.change_reason} onChange={(e) => setForm(f => ({ ...f, change_reason: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="E.g. Revaluation after market assessment" />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                <Save size={14} /> {saving ? "Saving…" : "Save Asset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
