"use client";

import React, { useState, useEffect } from "react";
import { DebtItem, BankCard, Person, db, settleDebtWithCard } from "@/lib/db";
import { formatCurrency, toEnglishDigits } from "@/lib/banks";
import { useToast } from "@/context/ToastContext";
import { useCurrency, CurrencyUnit } from "@/context/CurrencyContext";
import { CurrencyInputField } from "@/components/ui/CurrencyInputField";
import { AppDrawer } from "@/components/ui/AppDrawer";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  RotateCcw,
  FileText,
  Wallet,
} from "lucide-react";

interface SettleDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: DebtItem | null;
  cardsList: BankCard[];
  peopleList: Person[];
  onSettled: () => void;
}

export const SettleDebtModal: React.FC<SettleDebtModalProps> = ({
  isOpen,
  onClose,
  debt,
  cardsList,
  peopleList,
  onSettled,
}) => {
  const { showToast } = useToast();
  const { currencyUnit, toTomans, formatAmount } = useCurrency();

  const [settleAmountStr, setSettleAmountStr] = useState("");
  const [inputUnit, setInputUnit] = useState<CurrencyUnit>(currencyUnit);
  const [syncWithCard, setSyncWithCard] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<number | undefined>();
  const [settleNote, setSettleNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setInputUnit(currencyUnit);
    if (debt) {
      const disp = currencyUnit === "rial" ? debt.amount * 10 : debt.amount;
      setSettleAmountStr(disp.toString());
      setSyncWithCard(cardsList.length > 0);
      setSelectedCardId(debt.linkedCardId || cardsList[0]?.id);
      setSettleNote("");
    }
  }, [debt, cardsList, currencyUnit]);

  if (!debt || !isOpen) return null;

  const person = peopleList.find((p) => p.id === debt.personId);
  const personName = person?.name || "طرف حساب";
  const isCreditor = debt.type === "creditor";

  const numericAmount = parseFloat(toEnglishDigits(settleAmountStr).replace(/\D/g, "")) || 0;
  const numericAmountInTomans = toTomans(numericAmount, inputUnit);
  const isPartial = numericAmountInTomans > 0 && numericAmountInTomans < debt.amount;
  const selectedCard = cardsList.find((c) => c.id === selectedCardId);

  const handleSettle = async () => {
    if (numericAmountInTomans <= 0) {
      showToast("مبلغ تسویه باید بیشتر از صفر باشد", "error");
      return;
    }
    if (numericAmountInTomans > debt.amount) {
      showToast("مبلغ تسویه نمی‌تواند بیشتر از کل طلب/بدهی باشد", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (syncWithCard && selectedCardId) {
        // Atomic settlement with card balance adjustment
        await settleDebtWithCard(
          debt.id!,
          selectedCardId,
          numericAmountInTomans,
          settleNote.trim() || undefined
        );
        showToast(
          isCreditor
            ? `مبلغ ${formatAmount(numericAmountInTomans)} به کارت ${selectedCard?.bankName || ""} واریز و طلب تسویه شد`
            : `مبلغ ${formatAmount(numericAmountInTomans)} از کارت ${selectedCard?.bankName || ""} کسر و بدهی پرداخت شد`,
          "success"
        );
      } else {
        // Direct settlement without card balance change
        if (isPartial) {
          await db.debts.update(debt.id!, {
            amount: debt.amount - numericAmountInTomans,
          });
          showToast(
            `مبلغ ${formatAmount(numericAmountInTomans)} تسویه شد (باقیمانده: ${formatAmount(debt.amount - numericAmountInTomans)})`,
            "success"
          );
        } else {
          await db.debts.update(debt.id!, {
            isSettled: true,
            settledAt: Date.now(),
          });
          showToast("طلب / بدهی به طور کامل تسویه شد", "success");
        }
      }

      onSettled();
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "خطا در ثبت تسویه حساب", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopen = async () => {
    try {
      await db.debts.update(debt.id!, {
        isSettled: false,
        settledAt: undefined,
      });
      showToast("وضعیت به «در جریان» بازگردانده شد", "info");
      onSettled();
      onClose();
    } catch (err) {
      console.error(err);
      showToast("خطا در بازگردانی وضعیت", "error");
    }
  };

  return (
    <AppDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={debt.isSettled ? "مدیریت تسویه حساب" : isCreditor ? "تسویه و وصول طلب" : "تسویه و پرداخت بدهی"}
      icon={
        <div
          className={`p-1.5 rounded-xl ${
            isCreditor ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
          }`}
        >
          {isCreditor ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Info Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">طرف حساب:</span>
            <span className="font-bold text-sm text-white">{personName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">نوع حساب:</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                isCreditor
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/20 text-rose-400"
              }`}
            >
              {isCreditor ? "شما طلبکارید (دریافت پول)" : "شما بدهکارید (پرداخت پول)"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400">کل مبلغ طلب / بدهی:</span>
            <span className="text-base font-bold font-mono text-white">
              {formatAmount(debt.amount)}
            </span>
          </div>

          {debt.description && (
            <p className="text-xs text-slate-400 italic pt-1">
              توضیح: {debt.description}
            </p>
          )}
        </div>

        {/* If already settled, show revert option */}
        {debt.isSettled ? (
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-900/40 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              این حساب قبلاً تسویه شده است
            </div>
            <p className="text-xs text-slate-400">
              اگر این تسویه اشتباهاً ثبت شده است، می‌توانید آن را به وضعیت در جریان بازگردانید.
            </p>
            <button
              onClick={handleReopen}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              بازگرداندن به وضعیت در جریان
            </button>
          </div>
        ) : (
          /* Settlement Form */
          <div className="space-y-4">
            {/* Settle Amount with Toman/Rial switcher */}
            <div>
              <CurrencyInputField
                label="مبلغ تسویه"
                value={settleAmountStr}
                onChange={setSettleAmountStr}
                unit={inputUnit}
                onUnitChange={setInputUnit}
                placeholder="مبلغ پرداختی یا دریافتی..."
                required
              />

              {/* Quick settlement chips */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    const disp = inputUnit === "rial" ? debt.amount * 10 : debt.amount;
                    setSettleAmountStr(disp.toString());
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[11px] font-medium border border-blue-500/20 transition-colors"
                >
                  کل طلب ({formatAmount(debt.amount)})
                </button>
                {debt.amount > 10000 && (
                  <button
                    type="button"
                    onClick={() => {
                      const half = Math.round(debt.amount / 2);
                      const disp = inputUnit === "rial" ? half * 10 : half;
                      setSettleAmountStr(disp.toString());
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-[11px] font-medium transition-colors"
                  >
                    نصف مبلغ (۵۰٪)
                  </button>
                )}
              </div>
            </div>

            {/* Bank Card Sync Option */}
            {cardsList.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {isCreditor ? "واریز مستقیم به کارت بانکی" : "کسر مستقیم از کارت بانکی"}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        موجودی کارت به‌صورت خودکار به‌روزرسانی شده و تراکنش ثبت می‌شود
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={syncWithCard}
                    onChange={(e) => setSyncWithCard(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
                  />
                </label>

                {syncWithCard && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-[11px] text-slate-400 block font-medium">
                      {isCreditor ? "انتخاب کارت مقصد برای واریز وجه:" : "انتخاب کارت مبدا برای پرداخت:"}
                    </span>
                    <select
                      value={selectedCardId || ""}
                      onChange={(e) => setSelectedCardId(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {cardsList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.bankName} - {c.title} (موجودی: {formatAmount(c.balance || 0)})
                        </option>
                      ))}
                    </select>

                    {selectedCard && (
                      <div className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded-lg bg-slate-950/60 text-slate-300">
                        <span>موجودی پس از تسویه:</span>
                        <span className="font-bold font-mono text-emerald-400">
                          {formatAmount(
                            isCreditor
                              ? (selectedCard.balance || 0) + numericAmountInTomans
                              : (selectedCard.balance || 0) - numericAmountInTomans
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Note */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                توضیح یا یادداشت تسویه (اختیاری)
              </label>
              <input
                type="text"
                value={settleNote}
                onChange={(e) => setSettleNote(e.target.value)}
                placeholder="مثلاً: واریز از طریق پایا، دریافت دستی..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSettle}
                disabled={isSubmitting || numericAmountInTomans <= 0}
                className={`w-full py-3 rounded-2xl text-xs font-bold text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                  isCreditor
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                    : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                } disabled:opacity-50`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting
                  ? "در حال ثبت..."
                  : isPartial
                  ? `ثبت تسویه بخشی (${formatAmount(numericAmountInTomans)})`
                  : "تایید و ثبت تسویه کامل"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppDrawer>
  );
};
