"use client";

import React, { useState } from "react";
import { db } from "@/lib/db";
import { useToast } from "@/context/ToastContext";
import { toEnglishDigits, toPersianDigits } from "@/lib/banks";
import { X, Lock, Check } from "lucide-react";

interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { showToast } = useToast();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      showToast("رمز عبور باید دقیقاً ۴ رقم باشد", "error");
      return;
    }
    if (pin !== confirmPin) {
      showToast("رمز عبور و تکرار آن یکسان نیستند", "error");
      return;
    }

    try {
      await db.settings.put({
        key: "pin_lock",
        value: { enabled: true, pin },
      });
      showToast("رمز عبور برنامه با موفقیت ذخیره و فعال شد", "success");
      onSaved();
      onClose();
    } catch (err) {
      showToast("خطا در ذخیره رمز", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold">تنظیم رمز عبور ۴ رقمی</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              رمز ۴ رقمی جدید
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(toEnglishDigits(e.target.value).replace(/\D/g, ""))}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-white font-mono text-center text-xl tracking-widest focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              تکرار رمز ۴ رقمی
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={confirmPin}
              onChange={(e) => setConfirmPin(toEnglishDigits(e.target.value).replace(/\D/g, ""))}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-white font-mono text-center text-xl tracking-widest focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20"
            >
              فعال‌سازی رمز
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
