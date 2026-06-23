import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { fetchCashFlowStatement } from "../../../../Services/adminAndManager/accounting_service";
import type { CashFlowData } from "../../../../Services/adminAndManager/accounting_service";

interface Props {
  query: { from?: string; to?: string; branch_id?: string };
}

function CFLine({ label, value, indent = false, note = "" }: { label: string; value: number; indent?: boolean; note?: string }) {
  const isPos = value > 0;
  const isNeg = value < 0;
  return (
    <div className={`flex justify-between items-center py-1.5 ${indent ? "pl-8" : ""}`}>
      <span className="text-sm text-gray-600 flex items-center gap-2">
        {label}
        {note && <span className="text-[10px] text-gray-400">({note})</span>}
      </span>
      <span className={`text-sm font-mono tabular-nums ${isPos ? "text-green-700" : isNeg ? "text-red-600" : "text-gray-500"}`}>
        {isNeg
          ? `($${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
          : `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      </span>
    </div>
  );
}

function SectionTotal({ label, value }: { label: string; value: number }) {
  return (
    <div className={`flex justify-between items-center py-2 border-t border-gray-200 mt-1`}>
      <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
        {value > 0 ? <TrendingUp size={14} className="text-green-500" /> : value < 0 ? <TrendingDown size={14} className="text-red-500" /> : <Minus size={14} className="text-gray-400" />}
        {label}
      </span>
      <span className={`text-sm font-bold font-mono tabular-nums ${value > 0 ? "text-green-700" : value < 0 ? "text-red-600" : "text-gray-500"}`}>
        {value < 0
          ? `($${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
          : `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      </span>
    </div>
  );
}

export default function CashFlowTab({ query }: Props) {
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchCashFlowStatement(query)
      .then(setData)
      .catch(() => setError("Failed to load cash flow data."))
      .finally(() => setLoading(false));
  }, [query.from, query.to, query.branch_id]);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading cash flow statement…</div>;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;
  if (!data) return null;

  const { operating: op, investing: inv, financing: fin } = data;
  const netChange = data.net_change_in_cash;

  return (
    <div className="space-y-6">
      {/* Header KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Operating Activities", value: op.net_cash },
          { label: "Investing Activities", value: inv.net_cash },
          { label: "Financing Activities", value: fin.net_cash },
          { label: "Net Change in Cash", value: netChange },
        ].map(({ label, value }) => (
          <div key={label} className={`rounded-xl border shadow-sm p-4 ${value >= 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
            <div className="text-xs text-gray-500 font-medium mb-1">{label}</div>
            <div className={`text-xl font-bold ${value >= 0 ? "text-green-700" : "text-red-600"}`}>
              {value < 0
                ? `($${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                : `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Operating */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
            <TrendingUp size={15} className="text-blue-500" />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Operating Activities</h3>
          </div>
          <p className="text-[10px] text-gray-400 mb-3">Indirect Method</p>
          <CFLine label="Net Profit for Period" value={op.net_profit} />
          <CFLine label="Add: Depreciation (non-cash)" value={op.add_depreciation} note="add-back" />
          <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Working Capital Changes</div>
            <CFLine label="(Increase)/Decrease in Receivables" value={op.receivables_change} indent />
          </div>
          <SectionTotal label="Net Cash from Operating" value={op.net_cash} />
        </div>

        {/* Investing */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
            <TrendingDown size={15} className="text-amber-500" />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Investing Activities</h3>
          </div>
          <p className="text-[10px] text-gray-400 mb-3">Capital expenditure & disposals</p>
          <CFLine label="Purchase of Vehicles" value={inv.vehicle_acquisitions} note="outflow" />
          <CFLine label="Proceeds from Vehicle Disposals" value={inv.disposal_proceeds} note="inflow" />
          <SectionTotal label="Net Cash from Investing" value={inv.net_cash} />

          {inv.vehicle_acquisitions === 0 && inv.disposal_proceeds === 0 && (
            <p className="text-xs text-gray-400 mt-3">No investing transactions in this period. Vehicle acquisitions are tracked via Expenses (category: Vehicle Acquisition).</p>
          )}
        </div>

        {/* Financing */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
            <TrendingUp size={15} className="text-purple-500" />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Financing Activities</h3>
          </div>
          <p className="text-[10px] text-gray-400 mb-3">From balance entries in this period</p>
          <CFLine label="Loan Proceeds" value={fin.loan_proceeds} />
          <CFLine label="Loan Repayments" value={fin.loan_repayments} />
          <CFLine label="Capital Injections" value={fin.capital_injections} />
          <CFLine label="Drawings / Distributions" value={fin.drawings} />
          <SectionTotal label="Net Cash from Financing" value={fin.net_cash} />

          {fin.loan_proceeds === 0 && fin.capital_injections === 0 && fin.drawings === 0 && (
            <p className="text-xs text-gray-400 mt-3">No financing entries in this period. Record loans and capital in the Balance Sheet → Balance Entries tab.</p>
          )}
        </div>
      </div>

      {/* Net change summary */}
      <div className={`rounded-xl border-2 p-5 flex justify-between items-center ${netChange >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
        <div>
          <div className="text-sm font-bold text-gray-800">Net Change in Cash for Period</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {new Date(data.period.from).toLocaleDateString()} – {new Date(data.period.to).toLocaleDateString()}
          </div>
        </div>
        <div className={`text-2xl font-bold font-mono ${netChange >= 0 ? "text-green-700" : "text-red-600"}`}>
          {netChange < 0
            ? `($${Math.abs(netChange).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
            : `$${netChange.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </div>
      </div>
    </div>
  );
}
