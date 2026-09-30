"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  BankCard,
  Person,
  CardTransaction,
  db,
  deleteCardTransaction,
} from "@/lib/db";
import { formatCurrency, toPersianDigits } from "@/lib/banks";
import { formatToJalali, formatJalaliFull } from "@/lib/date";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import { useCurrency } from "@/context/CurrencyContext";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CreditCard,
  Search,
  X,
  Trash2,
  Calendar,
  Tag,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
  Receipt,
  Eye,
  EyeOff,
  User,
  Plus,
  Filter,
} from "lucide-react";

interface TransactionsViewProps {
  onOpenNewTransaction: (type?: "expense" | "income" | "transfer") => void;
  cardsList: BankCard[];
  peopleList: Person[];
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenNewTransaction,
  cardsList,
  peopleList,
}) => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { formatAmount } = useCurrency();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">("all");
  const [selectedCardFilter, setSelectedCardFilter] = useState<string>("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [showSensitive, setShowSensitive] = useState(true);

  // Live query for all card transactions
  const allTransactions =
    useLiveQuery(async () => {
      return await db.cardTransactions.orderBy("date").reverse().toArray();
    }) || [];

  // Total balance of all cards
  const totalBalance = cardsList.reduce((sum, c) => sum + (c.balance || 0), 0);

  // Total deposits (income) and withdrawals (expenses)
  const totalIncome = allTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = allTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashflow = totalIncome - totalExpense;

  // Filtered transactions
  const filteredTransactions = allTransactions.filter((tx) => {
    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    const matchesCard =
      selectedCardFilter === "all" || tx.cardId === Number(selectedCardFilter);
    const matchesCategory =
      selectedCategoryFilter === "all" || tx.category === selectedCategoryFilter;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      tx.title.toLowerCase().includes(q) ||
      (tx.note && tx.note.toLowerCase().includes(q)) ||
      tx.amount.toString().includes(q);

    return matchesType && matchesCard && matchesCategory && matchesSearch;
  });

  const handleDelete = async (tx: CardTransaction) => {
    const ok = await confirm({
      title: "حذف تراکنش",
      message: `آیا از حذف تراکنش «${tx.title}» به مبلغ ${formatAmount(
        tx.amount
      )} اطمینان دارید؟ در صورت حذف، موجودی کارت بانکی به حالت قبل برمی‌گردد.`,
      confirmText: "بله، حذف شود",
      isDanger: true,
    });

    if (ok && tx.id) {
      try {
        await deleteCardTransaction(tx.id);
        showToast("تراکنش حذف شد و موجودی کارت به‌روزرسانی گردید", "info");
      } catch (err) {
        showToast("خطا در حذف تراکنش", "error");
      }
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "food":
        return "🍔";
      case "shopping":
        return "🛍️";
      case "transport":
        return "🚗";
      case "bills":
        return "📄";
      case "health":
        return "💊";
      case "salary":
        return "💰";
      default:
        return "📦";
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            واریز و برداشت (گردش حساب‌ها)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ثبت مخارج روزمره، خریدها، شارژ کارت و دریافت حقوق
          </p>
        </div>

        <button
          onClick={() => setShowSensitive((prev) => !prev)}
          title={showSensitive ? "مخفی کردن ارقام" : "نمایش ارقام"}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {showSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Summary Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Total Available Balance */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-blue-400" />
              مجموع موجودی کارت‌ها
            </span>
            <span className="text-[10px] text-blue-400 font-mono">
              {toPersianDigits(cardsList.length)} حساب
            </span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
            {showSensitive ? formatAmount(totalBalance) : "••••••••"}
          </div>
        </div>

        {/* Total Income / Deposits */}
        <div className="p-4 rounded-3xl bg-emerald-950/30 border border-emerald-900/40 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              کل واریزی‌ها (شارژ / درآمد)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              ورودی
            </span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-300 mt-1">
            {showSensitive ? `+ ${formatAmount(totalIncome)}` : "••••••••"}
          </div>
        </div>

        {/* Total Expenses / Withdrawals */}
        <div className="p-4 rounded-3xl bg-rose-950/30 border border-rose-900/40 shadow-md">
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
              کل برداشت‌ها (خرج‌کرد / خرید)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
              خروجی
            </span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-rose-300 mt-1">
            {showSensitive ? `- ${formatAmount(totalExpense)}` : "••••••••"}
          </div>
        </div>
      </div>

      {/* Primary Action Buttons: Deposit, Withdrawal, Transfer */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onOpenNewTransaction("expense")}
          className="py-3 px-2 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>- ثبت برداشت (خرج)</span>
        </button>

        <button
          onClick={() => onOpenNewTransaction("income")}
          className="py-3 px-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>+ ثبت واریز (شارژ)</span>
        </button>

        <button
          onClick={() => onOpenNewTransaction("transfer")}
          className="py-3 px-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <ArrowLeftRight className="w-4 h-4 text-blue-400" />
          <span>انتقال کارت‌ها</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="p-3.5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="جستجو در عنوان یا مبلغ (مثلاً بستنی، بنزین، حقوق)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-8 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 text-slate-400 hover:text-white absolute left-2 top-1.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Type filters */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                typeFilter === "all"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              همه ({toPersianDigits(allTransactions.length)})
            </button>
            <button
              onClick={() => setTypeFilter("expense")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                typeFilter === "expense"
                  ? "bg-rose-600 text-white shadow"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <ArrowUpRight className="w-3 h-3 text-rose-400" />
              برداشت‌ها
            </button>
            <button
              onClick={() => setTypeFilter("income")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                typeFilter === "income"
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
              واریزی‌ها
            </button>
          </div>

          {/* Filter by Card dropdown */}
          {cardsList.length > 0 && (
            <select
              value={selectedCardFilter}
              onChange={(e) => setSelectedCardFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">همه کارت‌ها</option>
              {cardsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.bankName} - {c.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Transactions Feed List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl p-6">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-300">هیچ تراکنشی یافت نشد</h4>
          <p className="text-xs text-slate-500 mt-1">
            با دکمه‌های بالا اولین واریز یا برداشت خود را ثبت کنید.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTransactions.map((tx) => {
            const card = cardsList.find((c) => c.id === tx.cardId);
            const person = tx.personId ? peopleList.find((p) => p.id === tx.personId) : null;
            const isExpense = tx.type === "expense";

            return (
              <div
                key={tx.id}
                className="p-3.5 sm:p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all flex items-center justify-between gap-3 group"
              >
                {/* Left side: Icon & Title & Card details */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow ${
                      isExpense
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    <span>{getCategoryIcon(tx.category)}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white truncate">{tx.title}</h4>
                      {person && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] shrink-0 flex items-center gap-1">
                          <User className="w-2.5 h-2.5" />
                          {person.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                      {card && (
                        <span className="flex items-center gap-1 font-medium text-slate-300">
                          <CreditCard className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{card.bankName}</span>
                          <span className="text-slate-500">({card.title})</span>
                        </span>
                      )}
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {formatToJalali(tx.date)}
                      </span>
                    </div>

                    {tx.note && (
                      <p className="text-[11px] text-slate-500 mt-1 truncate">{tx.note}</p>
                    )}
                  </div>
                </div>

                {/* Right side: Amount and Delete button */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-left dir-ltr">
                    <span
                      className={`text-sm sm:text-base font-bold font-mono block drop-shadow-sm ${
                        isExpense ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {isExpense ? "-" : "+"} {formatAmount(tx.amount)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(tx)}
                    title="حذف تراکنش"
                    className="p-2 rounded-xl text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
