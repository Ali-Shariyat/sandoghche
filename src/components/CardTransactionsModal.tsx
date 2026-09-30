"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { BankCard, CardTransaction, db, addCardTransaction, deleteCardTransaction } from "@/lib/db";
import { formatCurrency, toEnglishDigits, toPersianDigits } from "@/lib/banks";
import { formatToJalali } from "@/lib/date";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import { AppDrawer } from "@/components/ui/AppDrawer";
import {
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Trash2,
  Calendar,
  Tag,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Receipt,
  Eye,
  EyeOff,
} from "lucide-react";

interface CardTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: BankCard | null;
  onUpdated?: () => void;
}

const CATEGORIES: { id: CardTransaction["category"]; label: string; icon: string }[] = [
  { id: "shopping", label: "خرید و بازار", icon: "🛍️" },
  { id: "food", label: "خوراک و سوپرمارکت", icon: "🍔" },
  { id: "transport", label: "حمل و نقل و بنزین", icon: "🚗" },
  { id: "bills", label: "قبوض و اجاره", icon: "📄" },
  { id: "health", label: "پزشکی و دارو", icon: "💊" },
  { id: "salary", label: "حقوق و درآمد", icon: "💰" },
  { id: "other", label: "سایر هزینه‌ها", icon: "📦" },
];

export const CardTransactionsModal: React.FC<CardTransactionsModalProps> = ({
  isOpen,
  onClose,
  card,
  onUpdated,
}) => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [amountStr, setAmountStr] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CardTransaction["category"]>("shopping");
  const [showSensitive, setShowSensitive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live query for transactions of this card
  const transactions =
    useLiveQuery(async () => {
      if (!card?.id) return [];
      return await db.cardTransactions
        .where("cardId")
        .equals(card.id)
        .reverse()
        .sortBy("date");
    }, [card?.id]) || [];

  if (!card) return null;

  const currentBalance = card.balance || 0;
  const numericAmount = parseFloat(toEnglishDigits(amountStr).replace(/\D/g, "")) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) {
      showToast("مبلغ تراکنش باید بیشتر از صفر باشد", "error");
      return;
    }
    if (!title.trim()) {
      showToast("لطفاً شرح یا بابت تراکنش را مشخص کنید", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await addCardTransaction(
        card.id!,
        txType,
        numericAmount,
        title.trim(),
        category,
        undefined,
        Date.now()
      );

      showToast(
        txType === "expense"
          ? `مبلغ ${formatCurrency(numericAmount)} تومان از کارت کسر شد`
          : `مبلغ ${formatCurrency(numericAmount)} تومان به موجودی اضافه شد`,
        "success"
      );

      setAmountStr("");
      setTitle("");
      onUpdated?.();
    } catch (err) {
      console.error(err);
      showToast("خطا در ثبت تراکنش کارت", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tx: CardTransaction) => {
    const ok = await confirm({
      title: "حذف تراکنش",
      message: `آیا از حذف تراکنش «${tx.title}» به مبلغ ${formatCurrency(
        tx.amount
      )} تومان اطمینان دارید؟ موجودی کارت به وضعیت قبل برخواهد گشت.`,
      confirmText: "بله، حذف شود",
      isDanger: true,
    });

    if (ok && tx.id) {
      try {
        await deleteCardTransaction(tx.id);
        showToast("تراکنش حذف شد و موجودی به‌روزرسانی گردید", "info");
        onUpdated?.();
      } catch (err) {
        showToast("خطا در حذف تراکنش", "error");
      }
    }
  };

  return (
    <AppDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`تراکنش‌ها و موجودی (${card.title})`}
      description={`${card.bankName} • ${toPersianDigits(card.cardNumber.slice(0, 4))}...`}
      icon={
        <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
          <Receipt className="w-5 h-5" />
        </div>
      }
    >
      <div className="space-y-4">
        {/* Balance Card Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <CreditCard className="w-4 h-4 text-blue-400" />
              موجودی فعلی کارت
            </span>
            <button
              type="button"
              onClick={() => setShowSensitive(!showSensitive)}
              className="p-1 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-[11px]"
            >
              {showSensitive ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  مخفی‌سازی
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  نمایش
                </>
              )}
            </button>
          </div>

          <div className="text-center py-2">
            <span className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {showSensitive ? formatCurrency(currentBalance) : "••••••••"}
            </span>
            <span className="text-xs text-slate-400 mr-2">تومان</span>
          </div>
        </div>

        {/* Transaction Type Selector (Expense vs Income) */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-800/80 rounded-2xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => setTxType("expense")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              txType === "expense"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            کسر از کارت (خرج‌کرد)
          </button>
          <button
            type="button"
            onClick={() => setTxType("income")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              txType === "income"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            واریز به کارت (درآمد)
          </button>
        </div>

        {/* Fast Add Form */}
        <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-3xl bg-slate-800/40 border border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">مبلغ (تومان) *</label>
                {numericAmount > 0 && (
                  <span className="text-[11px] font-mono font-bold text-blue-400">
                    {formatCurrency(numericAmount)} تومان
                  </span>
                )}
              </div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="مثلاً: ۵۰,۰۰۰"
                value={amountStr ? formatCurrency(amountStr) : ""}
                onChange={(e) =>
                  setAmountStr(toEnglishDigits(e.target.value).replace(/\D/g, ""))
                }
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-base font-bold focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Title / Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                بابت چه چیزی؟ (شرح) *
              </label>
              <input
                type="text"
                placeholder={txType === "expense" ? "مثلاً خرید سوپرمارکت، بنزین، ناهار" : "مثلاً واریز حقوق، طلب، پس‌انداز"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
              دسته‌بندی خرج‌کرد:
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl shrink-0 transition-all font-medium flex items-center gap-1 ${
                    category === cat.id
                      ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || numericAmount <= 0}
            className={`w-full py-3 rounded-2xl text-white text-xs font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
              txType === "expense"
                ? "bg-gradient-to-r from-rose-600 to-pink-600 shadow-rose-600/20 hover:from-rose-500 hover:to-pink-500"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500"
            } disabled:opacity-50`}
          >
            <Plus className="w-4 h-4" />
            {txType === "expense" ? "ثبت کسر از موجودی کارت" : "ثبت افزایش موجودی کارت"}
          </button>
        </form>

        {/* Transactions History List */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-blue-400" />
              تاریخچه تراکنش‌های این کارت
            </h4>
            <span className="text-[11px] text-slate-400">
              {toPersianDigits(transactions.length)} تراکنش
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8 rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
              <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">هنوز هیچ تراکنشی برای این کارت ثبت نشده است.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                با فرم بالا اولین خرج یا واریز خود را ثبت کنید.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        tx.type === "expense"
                          ? "bg-rose-500/20 text-rose-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {tx.type === "expense" ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">{tx.title}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{formatToJalali(tx.date)}</span>
                        <span>•</span>
                        <span>
                          {CATEGORIES.find((c) => c.id === tx.category)?.label || "سایر"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-bold text-xs sm:text-sm ${
                        tx.type === "expense" ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {tx.type === "expense" ? "−" : "+"} {formatCurrency(tx.amount)} تومان
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(tx)}
                      title="حذف تراکنش"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppDrawer>
  );
};
