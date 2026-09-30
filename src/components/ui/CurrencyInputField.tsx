"use client";

import React from "react";
import { formatCurrency, toEnglishDigits } from "@/lib/banks";
import { DollarSign, ArrowLeftRight } from "lucide-react";
import { CurrencyUnit } from "@/context/CurrencyContext";

interface CurrencyInputFieldProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  unit: CurrencyUnit;
  onUnitChange: (unit: CurrencyUnit) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  quickAmounts?: number[]; // always provided in Tomans
}

export const CurrencyInputField: React.FC<CurrencyInputFieldProps> = ({
  label = "مبلغ",
  value,
  onChange,
  unit,
  onUnitChange,
  placeholder = "۰",
  required = false,
  className = "",
  quickAmounts,
}) => {
  const numeric = parseFloat(toEnglishDigits(value).replace(/\D/g, "")) || 0;

  const handleUnitSwitch = (newUnit: CurrencyUnit) => {
    if (newUnit === unit) return;

    if (numeric > 0) {
      if (newUnit === "rial" && unit === "toman") {
        // Toman to Rial -> multiply by 10
        onChange((numeric * 10).toString());
      } else if (newUnit === "toman" && unit === "rial") {
        // Rial to Toman -> divide by 10
        onChange(Math.round(numeric / 10).toString());
      }
    }
    onUnitChange(newUnit);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toEnglishDigits(e.target.value).replace(/\D/g, "");
    onChange(raw);
  };

  // Convert quick chip (given in Tomans) to currently selected unit
  const handleQuickChipClick = (amountInTomans: number) => {
    const targetAmount = unit === "rial" ? amountInTomans * 10 : amountInTomans;
    const current = parseFloat(toEnglishDigits(value).replace(/\D/g, "")) || 0;
    onChange((current + targetAmount).toString());
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Header with Label and Unit Switcher */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-blue-400" />
          {label} {required && <span className="text-rose-400">*</span>}
        </label>

        {/* Toman / Rial Segmented Toggle */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-slate-900 border border-slate-700/80 shadow-inner">
          <button
            type="button"
            onClick={() => handleUnitSwitch("toman")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              unit === "toman"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            تومان
          </button>
          <button
            type="button"
            onClick={() => handleUnitSwitch("rial")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              unit === "rial"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ریال
          </button>
        </div>
      </div>

      {/* Main Input Box */}
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          required={required}
          placeholder={placeholder}
          value={value ? formatCurrency(numeric) : ""}
          onChange={handleInputChange}
          className="w-full px-4 py-2.5 pr-4 pl-14 rounded-2xl bg-slate-800/80 border border-slate-700 text-white font-mono text-center text-lg font-bold focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
        />

        {/* Unit Badge inside Input */}
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-sans pointer-events-none">
          {unit === "toman" ? "تومان" : "ریال"}
        </span>
      </div>

      {/* Realtime Equivalent Info Note */}
      {numeric > 0 && (
        <div className="flex items-center justify-between px-2 pt-0.5 text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <ArrowLeftRight className="w-3 h-3 text-slate-500" />
            {unit === "rial" ? "معادل به تومان:" : "معادل به ریال:"}
          </span>
          <span className="font-mono font-bold text-emerald-400">
            {unit === "rial"
              ? `${formatCurrency(Math.round(numeric / 10))} تومان`
              : `${formatCurrency(numeric * 10)} ریال`}
          </span>
        </div>
      )}

      {/* Quick Amount Chips */}
      {quickAmounts && quickAmounts.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
          {quickAmounts.map((amt) => {
            const displayAmt = unit === "rial" ? amt * 10 : amt;
            const unitLabel = unit === "rial" ? "ریال" : "تومان";
            return (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickChipClick(amt)}
                className="px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[10px] font-mono font-semibold border border-slate-700/80 shrink-0 transition-colors active:scale-95"
              >
                +{formatCurrency(displayAmt)} {unitLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
