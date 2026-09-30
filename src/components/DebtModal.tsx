"use client";

import React, { useState, useEffect } from "react";
import { DebtItem, Person, db } from "@/lib/db";
import { formatCurrency, toEnglishDigits, toPersianDigits } from "@/lib/banks";
import { getTodayJalali } from "@/lib/date";
import { useToast } from "@/context/ToastContext";
import { X, ArrowUpRight, ArrowDownLeft, Calendar, User, DollarSign } from "lucide-react";

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtToEdit?: DebtItem | null;
  onSaved: () => void;
  peopleList: Person[];
  defaultPersonId?: number;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  isOpen,
  onClose,
  debtToEdit,
  onSaved,
  peopleList,
  defaultPersonId,
}) => {
  const { showToast } = useToast();

  const [type, setType] = useState<"creditor" | "debtor">("creditor");
  const [personId, setPersonId] = useState<number | undefined>(defaultPersonId);
  const [amountStr, setAmountStr] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSettled, setIsSettled] = useState(false);

  useEffect(() => {
    if (debtToEdit) {
      setType(debtToEdit.type);
      setPersonId(debtToEdit.personId);
      setAmountStr(debtToEdit.amount.toString());
      setDescription(debtToEdit.description);
      setDueDate(debtToEdit.dueDate || "");
      setIsSettled(debtToEdit.isSettled);
    } else {
      setType("creditor");
      setPersonId(defaultPersonId || peopleList.filter((p) => !p.isMe)[0]?.id || peopleList[0]?.id);
      setAmountStr("");
      setDescription("");
      setDueDate("");
      setIsSettled(false);
    }
  }, [debtToEdit, isOpen, defaultPersonId, peopleList]);

  if (!isOpen) return null;

  const numericAmount = parseFloat(toEnglishDigits(amountStr).replace(/\D/g, "")) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId) {
      showToast("لطفاً طرف حساب (شخص) را مشخص کنید", "error");
      return;
    }
    if (numericAmount <= 0) {
      showToast("مبلغ باید بیشتر از صفر باشد", "error");
      return;
    }

    const debtData: Omit<DebtItem, "id"> = {
      personId: Number(personId),
      type,
      amount: numericAmount,
      description: description.trim() || (type === "creditor" ? "طلب نقدی" : "بدهی نقدی"),
      dueDate: dueDate.trim() || undefined,
      isSettled,
      settledAt: isSettled ? Date.now() : undefined,
      createdAt: debtToEdit?.createdAt || Date.now(),
    };

    try {
      if (debtToEdit?.id) {
        await db.debts.update(debtToEdit.id, debtData);
        showToast("تراکنش با موفقیت ویرایش شد", "success");
      } else {
        await db.debts.add(debtData as DebtItem);
        showToast("تراکنش جدید در دفتر ثبت شد", "success");
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      showToast("خطا در ثبت اطلاعات حساب", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl ${
                type === "creditor"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/20 text-rose-400"
              }`}
            >
              {type === "creditor" ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <h2 className="text-lg font-bold">
              {debtToEdit ? "ویرایش طلب / بدهی" : "ثبت طلب یا بدهی جدید"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Type selector (Creditor vs Debtor) */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-800/80 rounded-2xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => setType("creditor")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                type === "creditor"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              من طلبکارم (قرض دادم)
            </button>
            <button
              type="button"
              onClick={() => setType("debtor")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                type === "debtor"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              من بدهکارم (قرض گرفتم)
            </button>
          </div>

          {/* Person Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              طرف حساب (شخص) *
            </label>
            <select
              value={personId || ""}
              onChange={(e) => setPersonId(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">انتخاب شخص...</option>
              {peopleList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isMe ? " (من)" : p.relation ? `(${p.relation})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Amount in Tomans */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">مبلغ (تومان) *</label>
              {numericAmount > 0 && (
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {formatCurrency(numericAmount)} تومان
                </span>
              )}
            </div>
            <input
              type="text"
              inputMode="numeric"
              placeholder="مثلاً ۵۰۰,۰۰۰"
              value={amountStr ? formatCurrency(amountStr) : ""}
              onChange={(e) =>
                setAmountStr(toEnglishDigits(e.target.value).replace(/\D/g, ""))
              }
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-white font-mono text-center text-lg font-bold focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              شرح یا بابت
            </label>
            <input
              type="text"
              placeholder="مثلاً: هزینه ناهار، قرض دستی، خرید قطعه، کرایه"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              موعد بازپرداخت (شمسی اختیاری)
            </label>
            <input
              type="text"
              placeholder="مثلاً ۱۴۰۳/۰۸/۰۱"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors text-center"
            />
          </div>

          {/* Settled Checkbox */}
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="text-xs">
              <span className="font-semibold text-slate-200 block">وضعیت تسویه</span>
              <span className="text-slate-400">آیا این مبلغ پرداخت و تسویه شده است؟</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSettled}
                onChange={(e) => setIsSettled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-2xl text-white text-sm font-bold shadow-lg active:scale-95 transition-all ${
                type === "creditor"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/20"
                  : "bg-gradient-to-r from-rose-600 to-pink-600 shadow-rose-500/20"
              }`}
            >
              {debtToEdit ? "ذخیره تغییرات" : "ثبت در دفتر"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
