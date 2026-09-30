"use client";

import React, { useState, useEffect } from "react";
import { Lock, Delete, Shield, Check } from "lucide-react";
import { toPersianDigits } from "@/lib/banks";

interface PinLockScreenProps {
  correctPin: string;
  onUnlocked: () => void;
  title?: string;
  subtitle?: string;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  correctPin,
  onUnlocked,
  title = "ورود امن به برنامه",
  subtitle = "رمز عبور ۴ رقمی خود را وارد نمایید",
}) => {
  const [pin, setPin] = useState("");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === correctPin) {
        onUnlocked();
      } else {
        setHasError(true);
        if (navigator.vibrate) navigator.vibrate(200);
        setTimeout(() => {
          setPin("");
          setHasError(false);
        }, 600);
      }
    }
  }, [pin, correctPin, onUnlocked]);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-slate-950 text-white select-none">
      {/* Top Header */}
      <div className="flex flex-col items-center mt-12 space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-xl">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-xs text-slate-400">{subtitle}</p>

        {/* 4-dot PIN indicator */}
        <div
          className={`flex items-center gap-4 mt-6 transition-transform ${
            hasError ? "animate-bounce text-rose-500" : ""
          }`}
        >
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                pin.length > idx
                  ? hasError
                    ? "bg-rose-500 scale-110"
                    : "bg-blue-500 scale-110 shadow-lg shadow-blue-500/50"
                  : "bg-slate-800 border border-slate-700"
              }`}
            />
          ))}
        </div>

        {hasError && (
          <span className="text-xs text-rose-400 mt-2 font-medium">رمز عبور نادرست است</span>
        )}
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-3 mb-10">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleKeyPress(digit)}
            className="h-16 rounded-2xl bg-slate-900 border border-slate-800/80 hover:bg-slate-800 active:scale-95 text-xl font-bold text-slate-100 flex items-center justify-center shadow transition-all font-mono"
          >
            {toPersianDigits(digit)}
          </button>
        ))}

        <div />

        <button
          type="button"
          onClick={() => handleKeyPress("0")}
          className="h-16 rounded-2xl bg-slate-900 border border-slate-800/80 hover:bg-slate-800 active:scale-95 text-xl font-bold text-slate-100 flex items-center justify-center shadow transition-all font-mono"
        >
          {toPersianDigits("0")}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="h-16 rounded-2xl bg-slate-900 border border-slate-800/80 hover:bg-slate-800 active:scale-95 text-slate-300 flex items-center justify-center transition-all"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
