"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/banks";

export type CurrencyUnit = "toman" | "rial";

interface CurrencyContextType {
  currencyUnit: CurrencyUnit;
  setCurrencyUnit: (unit: CurrencyUnit) => Promise<void>;
  formatAmount: (amountInTomans: number | undefined | null, showUnit?: boolean) => string;
  getUnitLabel: () => string;
  toDisplayAmount: (amountInTomans: number) => number;
  toTomans: (amount: number, fromUnit: CurrencyUnit) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencyUnit, setCurrencyUnitState] = useState<CurrencyUnit>("toman");

  useEffect(() => {
    async function loadCurrencySetting() {
      try {
        const setting = await db.settings.get("currency_unit");
        if (setting?.value === "rial" || setting?.value === "toman") {
          setCurrencyUnitState(setting.value);
        }
      } catch (err) {
        console.error("Failed to load currency setting", err);
      }
    }
    loadCurrencySetting();
  }, []);

  const setCurrencyUnit = async (unit: CurrencyUnit) => {
    setCurrencyUnitState(unit);
    try {
      await db.settings.put({
        key: "currency_unit",
        value: unit,
      });
    } catch (err) {
      console.error("Failed to save currency setting", err);
    }
  };

  const getUnitLabel = () => {
    return currencyUnit === "rial" ? "ریال" : "تومان";
  };

  const toDisplayAmount = (amountInTomans: number): number => {
    if (!amountInTomans || isNaN(amountInTomans)) return 0;
    return currencyUnit === "rial" ? amountInTomans * 10 : amountInTomans;
  };

  const toTomans = (amount: number, fromUnit: CurrencyUnit): number => {
    if (!amount || isNaN(amount)) return 0;
    return fromUnit === "rial" ? Math.round(amount / 10) : amount;
  };

  const formatAmount = (
    amountInTomans: number | undefined | null,
    showUnit: boolean = true
  ): string => {
    if (amountInTomans === undefined || amountInTomans === null || isNaN(amountInTomans)) {
      return showUnit ? `۰ ${getUnitLabel()}` : "۰";
    }

    const disp = currencyUnit === "rial" ? amountInTomans * 10 : amountInTomans;
    const formatted = formatCurrency(disp);
    return showUnit ? `${formatted} ${getUnitLabel()}` : formatted;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currencyUnit,
        setCurrencyUnit,
        formatAmount,
        getUnitLabel,
        toDisplayAmount,
        toTomans,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
