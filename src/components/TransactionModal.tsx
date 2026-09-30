"use client";

import React, { useState, useEffect } from "react";
import {
  BankCard,
  Person,
  CardTransaction,
  addCardTransaction,
  transferBetweenCards,
} from "@/lib/db";
import { formatCurrency, toEnglishDigits, toPersianDigits, formatCardNumber } from "@/lib/banks";
import { useToast } from "@/context/ToastContext";
import { useCurrency, CurrencyUnit } from "@/context/CurrencyContext";
import { CurrencyInputField } from "@/components/ui/CurrencyInputField";
import { AppDrawer } from "@/components/ui/AppDrawer";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CreditCard,
  Tag,
  Calendar,
  User,
  DollarSign,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCardId?: number;
  defaultType?: "expense" | "income" | "transfer";
  cardsList: BankCard[];
  peopleList: Person[];
  onSaved?: () => void;
}

const CATEGORIES: { id: CardTransaction["category"]; label: string; icon: string }[] = [
  { id: "food", label: "خوراک و سوپرمارکت", icon: "🍔" },
  { id: "shopping", label: "خرید و بازار", icon: "🛍️" },
  { id: "transport", label: "حمل و نقل و بنزین", icon: "🚗" },
  { id: "bills", label: "قبوض و اجاره", icon: "📄" },
  { id: "health", label: "پزشکی و دارو", icon: "💊" },
  { id: "salary", label: "حقوق و درآمد", icon: "💰" },
  { id: "other", label: "سایر هزینه‌ها", icon: "📦" },
];

const QUICK_EXPENSE_TITLES = [
  { label: "بستنی و تنقلات 🍦", title: "خرید بستنی و تنقلات", category: "food" as const },
  { label: "سوپرمارکت 🛒", title: "خرید سوپرمارکت", category: "food" as const },
  { label: "میوه و تره‌بار 🍎", title: "خرید میوه و تره‌بار", category: "food" as const },
  { label: "بنزین ⛽", title: "بنزین و سوخت", category: "transport" as const },
  { label: "اسنپ و تاکسی 🚗", title: "کرایه اسنپ/تاکسی", category: "transport" as const },
  { label: "نانوایی 🥖", title: "خرید نان", category: "food" as const },
  { label: "رستوران و غذا 🍕", title: "رستوران و غذا", category: "food" as const },
  { label: "قبوض و شارژ 📄", title: "پرداخت قبض و شارژ", category: "bills" as const },
  { label: "دارو و درمان 💊", title: "پزشکی و دارو", category: "health" as const },
  { label: "قسط وام 🏦", title: "پرداخت قسط وام", category: "bills" as const },
];

const QUICK_INCOME_TITLES = [
  { label: "حقوق ماهانه 💰", title: "واریز حقوق ماهانه", category: "salary" as const },
  { label: "پاداش و عیدی 🎁", title: "پاداش و اضافه کار", category: "salary" as const },
  { label: "شارژ نقدی کارت 💳", title: "شارژ موجودی حساب", category: "other" as const },
  { label: "درآمد فروش 📦", title: "درآمد و فروش کالا", category: "other" as const },
  { label: "پس گرفتن طلب 🤝", title: "تسویه و وصول طلب", category: "other" as const },
  { label: "یارانه 🏛️", title: "واریز یارانه", category: "salary" as const },
  { label: "سود بانکی 📈", title: "سود سپرده بانکی", category: "other" as const },
];

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  defaultCardId,
  defaultType = "expense",
  cardsList,
  peopleList,
  onSaved,
}) => {
  const { showToast } = useToast();
  const { currencyUnit, toTomans, formatAmount } = useCurrency();

  const [mode, setMode] = useState<"expense" | "income" | "transfer">(defaultType);
  const [cardId, setCardId] = useState<number | undefined>(defaultCardId || cardsList[0]?.id);
  const [targetCardId, setTargetCardId] = useState<number | undefined>(
    cardsList.find((c) => c.id !== (defaultCardId || cardsList[0]?.id))?.id
  );
  const [amountStr, setAmountStr] = useState("");
  const [inputUnit, setInputUnit] = useState<CurrencyUnit>(currencyUnit);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CardTransaction["category"]>("food");
  const [personId, setPersonId] = useState<number | undefined>();
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(defaultType);
      const initialCardId = defaultCardId || cardsList[0]?.id;
      setCardId(initialCardId);
      setTargetCardId(cardsList.find((c) => c.id !== initialCardId)?.id);
      setAmountStr("");
      setInputUnit(currencyUnit);
      setTitle("");
      setCategory(defaultType === "income" ? "salary" : "food");
      setPersonId(undefined);
      setNote("");
    }
  }, [isOpen, defaultType, defaultCardId, cardsList, currencyUnit]);

  if (!isOpen) return null;

  const numericAmount = parseFloat(toEnglishDigits(amountStr).replace(/\D/g, "")) || 0;
  const selectedCard = cardsList.find((c) => c.id === cardId);
  const selectedTargetCard = cardsList.find((c) => c.id === targetCardId);

  const handleAddQuickAmount = (delta: number) => {
    const cur = parseFloat(toEnglishDigits(amountStr).replace(/\D/g, "")) || 0;
    const nextVal = cur + delta;
    setAmountStr(nextVal.toString());
  };

  const handleSelectQuickTitle = (item: { title: string; category: CardTransaction["category"] }) => {
    setTitle(item.title);
    setCategory(item.category);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardId) {
      showToast("لطفاً کارت بانکی را انتخاب کنید", "error");
      return;
    }
    const numericAmountInTomans = toTomans(numericAmount, inputUnit);
    if (numericAmountInTomans <= 0) {
      showToast("مبلغ تراکنش باید بیشتر از صفر باشد", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "transfer") {
        if (!targetCardId || targetCardId === cardId) {
          showToast("لطفاً کارت مقصد متفاوتی را انتخاب کنید", "error");
          setIsSubmitting(false);
          return;
        }
        await transferBetweenCards(
          cardId,
          targetCardId,
          numericAmountInTomans,
          title.trim() || "انتقال بین کارت‌ها",
          note.trim() || undefined
        );
        showToast(
          `مبلغ ${formatAmount(numericAmountInTomans)} بین کارت‌ها منتقل شد`,
          "success"
        );
      } else {
        if (!title.trim()) {
          showToast("لطفاً عنوان یا بابت تراکنش را مشخص کنید", "error");
          setIsSubmitting(false);
          return;
        }

        await addCardTransaction(
          cardId,
          mode,
          numericAmountInTomans,
          title.trim(),
          category,
          note.trim() || undefined,
          Date.now(),
          personId
        );

        showToast(
          mode === "expense"
            ? `مبلغ ${formatAmount(numericAmountInTomans)} با عنوان «${title}» از کارت کسر شد`
            : `مبلغ ${formatAmount(numericAmountInTomans)} با عنوان «${title}» به کارت واریز شد`,
          "success"
        );
      }

      onSaved?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast(`خطا در ثبت تراکنش: ${err?.message || "نامشخص"}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === "expense"
          ? "ثبت برداشت (خرج‌کرد / خرید)"
          : mode === "income"
          ? "ثبت واریز (شارژ حساب / درآمد)"
          : "انتقال وجه بین کارت‌های من"
      }
      icon={
        <div
          className={`p-1.5 rounded-xl ${
            mode === "expense"
              ? "bg-rose-500/20 text-rose-400"
              : mode === "income"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-blue-500/20 text-blue-400"
          }`}
        >
          {mode === "expense" ? (
            <TrendingDown className="w-5 h-5" />
          ) : mode === "income" ? (
            <TrendingUp className="w-5 h-5" />
          ) : (
            <ArrowLeftRight className="w-5 h-5" />
          )}
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 3 Main Tabs: Expense, Income, Transfer */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-800/90 rounded-2xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => {
              setMode("expense");
              setCategory("food");
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              mode === "expense"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>برداشت (خرج)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("income");
              setCategory("salary");
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              mode === "income"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>واریز (شارژ)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("transfer")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              mode === "transfer"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>انتقال کارت‌ها</span>
          </button>
        </div>

        {/* Card Selection */}
        {mode === "transfer" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                کارت مبدا (کسر از حساب) *
              </label>
              <select
                value={cardId}
                onChange={(e) => setCardId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
              >
                {cardsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.bankName} - {c.title} (موجودی: {formatAmount(c.balance || 0)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                کارت مقصد (شارژ به حساب) *
              </label>
              <select
                value={targetCardId}
                onChange={(e) => setTargetCardId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
              >
                {cardsList
                  .filter((c) => c.id !== cardId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.bankName} - {c.title} (موجودی: {formatAmount(c.balance || 0)})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                {mode === "expense" ? "کسر از کدام کارت بانکی؟ *" : "واریز به کدام کارت بانکی؟ *"}
              </label>
              {selectedCard && (
                <span className="text-[11px] text-slate-400 font-mono">
                  موجودی فعلی:{" "}
                  <strong className="text-white">
                    {formatAmount(selectedCard.balance || 0)}
                  </strong>
                </span>
              )}
            </div>

            <select
              value={cardId}
              onChange={(e) => setCardId(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
            >
              {cardsList.length === 0 ? (
                <option value="">ابتدا یک کارت بانکی ثبت کنید</option>
              ) : (
                cardsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.bankName} - {c.title} (موجودی: {formatAmount(c.balance || 0)})
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {/* Amount Input with Toman/Rial switcher */}
        <CurrencyInputField
          label="مبلغ تراکنش"
          value={amountStr}
          onChange={setAmountStr}
          unit={inputUnit}
          onUnitChange={setInputUnit}
          placeholder="مثلاً: ۲۵,۰۰۰"
          required
          quickAmounts={QUICK_AMOUNTS}
        />

        {/* Title Input & Quick Suggestions */}
        {mode !== "transfer" && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {mode === "expense"
                ? "بابت چه چیزی کم شده؟ (مثلاً: خرید بستنی، نان، بنزین...) *"
                : "بابت چه چیزی واریز شده؟ (مثلاً: حقوق، شارژ حساب...) *"}
            </label>
            <input
              type="text"
              placeholder={
                mode === "expense"
                  ? "مثلاً: خرید بستنی، بنزین، میوه، اسنپ"
                  : "مثلاً: حقوق ماهانه، واریزی مشتری، سود"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
            />

            {/* Quick title suggestions pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mt-2 no-scrollbar">
              {(mode === "expense" ? QUICK_EXPENSE_TITLES : QUICK_INCOME_TITLES).map(
                (item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectQuickTitle(item)}
                    className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/70 text-[11px] text-slate-300 shrink-0 active:scale-95 transition-all"
                  >
                    {item.label}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Category selector */}
        {mode !== "transfer" && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              دسته‌بندی تراکنش
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 border transition-all text-right ${
                    category === cat.id
                      ? "bg-blue-600/30 border-blue-500 text-white shadow-sm"
                      : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Connected Person (Optional) */}
        {mode !== "transfer" && peopleList.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              مربوط به کدام شخص است؟ (اختیاری)
            </label>
            <select
              value={personId || ""}
              onChange={(e) => setPersonId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="">بدون انتخاب شخص (مربوط به خودم)</option>
              {peopleList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.relation ? `(${p.relation})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Note / Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            یادداشت و توضیحات تکمیلی (اختیاری)
          </label>
          <input
            type="text"
            placeholder="مثلاً: بابت خرید از مغازه سر کوچه"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={isSubmitting || numericAmount <= 0}
            className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5 ${
              mode === "expense"
                ? "bg-gradient-to-r from-rose-600 to-pink-600 shadow-rose-600/25"
                : mode === "income"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/25"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-600/25"
            }`}
          >
            {mode === "expense" ? (
              <>
                <ArrowUpRight className="w-4 h-4" />
                <span>ثبت کسر هزینه و برداشت</span>
              </>
            ) : mode === "income" ? (
              <>
                <ArrowDownLeft className="w-4 h-4" />
                <span>ثبت واریز و شارژ حساب</span>
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-4 h-4" />
                <span>انتقال وجه بین کارت‌ها</span>
              </>
            )}
          </button>
        </div>
      </form>
    </AppDrawer>
  );
};
