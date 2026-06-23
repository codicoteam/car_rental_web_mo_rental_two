import React, { useState, useEffect } from "react";
import { AlertTriangle, AlertCircle, Info, RefreshCw, Shield } from "lucide-react";
import { fetchDataHealth } from "../../../../Services/adminAndManager/accounting_service";
import type { DataHealthData, DataHealthFlag } from "../../../../Services/adminAndManager/accounting_service";

interface Props {
  query: { from?: string; to?: string; branch_id?: string };
}

const SEV_CONFIG = {
  critical: { icon: AlertCircle, bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700", icon_color: "text-red-500", label: "Critical" },
  warning:  { icon: AlertTriangle, bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", icon_color: "text-amber-500", label: "Warning" },
  info:     { icon: Info, bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", icon_color: "text-blue-500", label: "Info" },
};

const ENTITY_LABELS: Record<string, string> = {
  vehicle: "Vehicle",
  expense: "Expense",
  balance_sheet: "Balance Sheet",
  balance_entry: "Balance Entry",
};

function FlagCard({ flag }: { flag: DataHealthFlag }) {
  const cfg = SEV_CONFIG[flag.severity];
  const Icon = cfg.icon;
  return (
    <div className={`${cfg.bg} ${cfg.border} border rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <Icon size={16} className={`${cfg.icon_color} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${cfg.badge}`}>{cfg.label}</span>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium">{ENTITY_LABELS[flag.entity] || flag.entity}</span>
            <span className="text-[10px] text-gray-400 font-mono">{flag.code}</span>
            {flag.branch && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{flag.branch}</span>}
          </div>
          <p className="text-sm text-gray-800 font-medium">{flag.label}</p>
          <p className="text-sm text-gray-600 mt-0.5">{flag.message}</p>
          <div className="mt-2 flex items-start gap-1.5">
            <Shield size={11} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500 italic">{flag.action}</p>
          </div>
          {flag.added_by && (
            <p className="text-[11px] text-gray-400 mt-1.5">Recorded by: <span className="font-medium text-gray-500">{flag.added_by}</span></p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DataHealthTab({ query }: Props) {
  const [data, setData] = useState<DataHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");

  const load = () => {
    setLoading(true);
    fetchDataHealth(query)
      .then(setData)
      .catch(() => setError("Failed to run data health check."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [query.from, query.to, query.branch_id]);

  if (loading) return (
    <div className="text-center py-16">
      <div className="inline-flex items-center gap-2 text-gray-400">
        <RefreshCw size={16} className="animate-spin" />
        Running data health checks…
      </div>
    </div>
  );
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;
  if (!data) return null;

  const { summary, flags } = data;
  const filtered = filter === "all" ? flags : flags.filter((f) => f.severity === filter);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: "all" as const, label: "Total Issues", count: summary.total, color: "text-gray-900", bg: "bg-gray-50 border-gray-200" },
          { key: "critical" as const, label: "Critical", count: summary.critical, color: "text-red-600", bg: "bg-red-50 border-red-200" },
          { key: "warning" as const, label: "Warnings", count: summary.warning, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
          { key: "info" as const, label: "Info", count: summary.info, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
        ].map(({ key, label, count, color, bg }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`${bg} border rounded-xl p-4 text-left transition hover:shadow-sm ${filter === key ? "ring-2 ring-blue-400" : ""}`}>
            <div className="text-xs text-gray-500 font-medium mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{count}</div>
            {count === 0 && key !== "all" && <div className="text-[10px] text-green-600 mt-0.5">All clear</div>}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {filtered.length} of {summary.total} issues
          {data.generated_at && <span className="text-gray-400"> · Generated {new Date(data.generated_at).toLocaleTimeString()}</span>}
        </p>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
          <RefreshCw size={13} /> Re-run
        </button>
      </div>

      {/* Flags */}
      {filtered.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <Shield size={32} className="text-green-400 mx-auto mb-2" />
          <p className="text-green-700 font-medium">No {filter === "all" ? "" : filter} issues found</p>
          <p className="text-sm text-green-600 mt-1">Your data looks clean in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Group by severity */}
          {(["critical", "warning", "info"] as const).map((sev) => {
            const group = filtered.filter((f) => f.severity === sev);
            if (group.length === 0) return null;
            return (
              <div key={sev}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${SEV_CONFIG[sev].icon_color}`}>{SEV_CONFIG[sev].label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${SEV_CONFIG[sev].badge}`}>{group.length}</span>
                </div>
                <div className="space-y-2">
                  {group.map((flag, i) => <FlagCard key={`${flag.code}-${i}`} flag={flag} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
