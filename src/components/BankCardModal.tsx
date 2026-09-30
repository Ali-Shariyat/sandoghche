"use client";

import React, { useState, useEffect } from "react";
import { BankCard, Person, db } from "@/lib/db";
import {
  detectBank,
  formatCardNumber,
  formatShabaNumber,
  formatCurrency,
  toEnglishDigits,
  toPersianDigits,
  IRANIAN_BANKS,
} from "@/lib/banks";
import { useToast } from "@/context/ToastContext";
import { useCurrency, CurrencyUnit } from "@/context/CurrencyContext";
import { CurrencyInputField } from "@/components/ui/CurrencyInputField";
import { AppDrawer } from "@/components/ui/AppDrawer";
import { CreditCard, Sparkles, Tag, Check, Calendar } from "lucide-react";

interface BankCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardToEdit?: BankCard | null;
  onSaved: () => void;
  peopleList: Person[];
  defaultPersonId?: number;
}

export const BankCardModal: React.FC<BankCardModalProps> = ({
  isOpen,
  onClose,
  cardToEdit,
  onSaved,
  peopleList,
  defaultPersonId,
}) => {
  const { showToast } = useToast();
  const { currencyUnit, toTomans } = useCurrency();

  const [title, setTitle] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [shabaNumber, setShabaNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [cvv2, setCvv2] = useState("");
  const [expireMonth, setExpireMonth] = useState("");
  const [expireYear, setExpireYear] = useState("");
  const [balanceStr, setBalanceStr] = useState("");
  const [balanceUnit, setBalanceUnit] = useState<CurrencyUnit>(currencyUnit);
  const [personId, setPersonId] = useState<number | undefined>(defaultPersonId);
  const [category, setCategory] = useState<"personal" | "business" | "savings" | "family" | "other">("personal");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  useEffect(() => {
    if (cardToEdit) {
      setTitle(cardToEdit.title);
      setCardNumber(cardToEdit.cardNumber);
      setShabaNumber(cardToEdit.shabaNumber || "");
      setAccountNumber(cardToEdit.accountNumber || "");
      setCvv2(cardToEdit.cvv2 || "");
      setExpireMonth(cardToEdit.expireMonth || "");
      setExpireYear(cardToEdit.expireYear || "");
      setBalanceUnit(currencyUnit);
      const disp =
        currencyUnit === "rial" && cardToEdit.balance !== undefined
          ? cardToEdit.balance * 10
          : cardToEdit.balance;
      setBalanceStr(disp !== undefined ? disp.toString() : "");
      setPersonId(cardToEdit.personId);
      setCategory(cardToEdit.category || "personal");
      setTags(cardToEdit.tags || []);
      setNote(cardToEdit.note || "");
      setSelectedColor(cardToEdit.colorTheme || "");
    } else {
      setTitle("");
      setCardNumber("");
      setShabaNumber("");
      setAccountNumber("");
      setCvv2("");
      setExpireMonth("");
      setExpireYear("");
      setBalanceUnit(currencyUnit);
      setBalanceStr("");
      setPersonId(defaultPersonId || peopleList.find((p) => p.isMe)?.id || peopleList[0]?.id);
      setCategory("personal");
      setTags([]);
      setNote("");
      setSelectedColor("");
    }
  }, [cardToEdit, isOpen, defaultPersonId, peopleList, currencyUnit]);

  const detectedBank = detectBank(cardNumber);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toEnglishDigits(e.target.value).replace(/\D/g, "").slice(0, 16);
    setCardNumber(raw);

    // Auto-fill bank title if title is empty
    if (!title && raw.length >= 6) {
      const bank = detectBank(raw);
      if (bank.key !== "other") {
        setTitle(`کارت ${bank.shortName}`);
      }
    }
  };

  const handleShabaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = toEnglishDigits(e.target.value).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!raw.startsWith("IR") && raw.length > 0) {
      raw = "IR" + raw;
    }
    raw = raw.slice(0, 26);
    setShabaNumber(raw);
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const rawBalanceNum = balanceStr ? parseFloat(toEnglishDigits(balanceStr).replace(/\D/g, "")) : undefined;
  const balanceInTomans = rawBalanceNum !== undefined ? toTomans(rawBalanceNum, balanceUnit) : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.length !== 16) {
      showToast("شماره کارت باید دقیقاً ۱۶ رقم باشد", "error");
      return;
    }

    const bank = detectBank(cardNumber);

    const cardData: Omit<BankCard, "id"> = {
      title: title.trim() || `کارت ${bank.shortName}`,
      bankName: bank.name,
      bankKey: bank.key,
      cardNumber,
      shabaNumber: shabaNumber || undefined,
      accountNumber: accountNumber || undefined,
      cvv2: cvv2 || undefined,
      expireMonth: expireMonth || undefined,
      expireYear: expireYear || undefined,
      balance: balanceInTomans !== undefined ? balanceInTomans : (cardToEdit?.balance || 0),
      personId: personId ? Number(personId) : undefined,
      category,
      tags,
      note: note.trim() || undefined,
      colorTheme: selectedColor || bank.gradient,
      createdAt: cardToEdit?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    try {
      if (cardToEdit?.id) {
        await db.bankCards.update(cardToEdit.id, cardData);
        showToast("کارت بانکی با موفقیت ویرایش شد", "success");
      } else {
        await db.bankCards.add(cardData as BankCard);
        showToast("کارت بانکی جدید ذخیره شد", "success");
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      showToast("خطا در ذخیره اطلاعات", "error");
    }
  };

  return (
    <AppDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={cardToEdit ? "ویرایش کارت بانکی" : "افزودن کارت بانکی جدید"}
      description="تشخیص خودکار بانک، شبا، تاریخ انقضا و موجودی"
      icon={
        <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
          <CreditCard className="w-5 h-5" />
        </div>
      }
    >
      <div className="space-y-4">
        {/* Live Bank Preview Badge */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-800/60 border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                detectedBank.key !== "other" ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
              }`}
            />
            <div>
              <span className="text-xs text-slate-400">بانک شناسایی‌شده:</span>
              <div className="font-bold text-sm text-slate-200">{detectedBank.name}</div>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700/70 text-slate-300">
            {detectedBank.shortName}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Number */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                شماره ۱۶ رقمی کارت *
              </label>
              <span
                className={`text-[11px] font-mono ${
                  cardNumber.length === 16 ? "text-emerald-400 font-bold" : "text-slate-400"
                }`}
              >
                {toPersianDigits(cardNumber.length)} / ۱۶ رقم
              </span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              placeholder="۶۰۳۷ ۹۹۱۸ ۱۲۳۴ ۵۶۷۸"
              value={formatCardNumber(cardNumber, " ")}
              onChange={handleCardNumberChange}
              maxLength={24}
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-white font-mono text-center text-lg tracking-wider focus:outline-none focus:border-blue-500 transition-colors dir-ltr"
            />
          </div>

          {/* Title & Person Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                عنوان یا نام کارت
              </label>
              <input
                type="text"
                placeholder="مثلاً: کارت حقوق، کارت ملی، سپه خرید"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                متعلق به کدام شخص؟
              </label>
              <select
                value={personId || ""}
                onChange={(e) => setPersonId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">انتخاب شخص...</option>
                {peopleList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isMe ? " (خودم)" : p.relation ? `(${p.relation})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Balance (موجودی اولیه کارت با قابلیت انتخاب ریال / تومان) */}
          <CurrencyInputField
            label="موجودی اولیه کارت (اختیاری)"
            value={balanceStr}
            onChange={setBalanceStr}
            unit={balanceUnit}
            onUnitChange={setBalanceUnit}
            placeholder="مثلاً: ۲,۵۰۰,۰۰۰"
            quickAmounts={[500000, 1000000, 2000000, 5000000]}
          />

          {/* Shaba & Account Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                شماره شبا (با IR)
              </label>
              <input
                type="text"
                placeholder="IR..."
                value={formatShabaNumber(shabaNumber)}
                onChange={handleShabaChange}
                maxLength={32}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition-colors dir-ltr text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                شماره حساب (اختیاری)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="شماره حساب بانکی"
                value={accountNumber}
                onChange={(e) => setAccountNumber(toEnglishDigits(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors dir-ltr text-center"
              />
            </div>
          </div>

          {/* CVV2 & Expiration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                CVV2
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="۳ یا ۴ رقم"
                maxLength={4}
                value={cvv2}
                onChange={(e) => setCvv2(toEnglishDigits(e.target.value).replace(/\D/g, ""))}
                className="w-full px-3 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white font-mono text-center text-sm focus:outline-none focus:border-blue-500 transition-colors dir-ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ماه انقضا (۰۱-۱۲)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="مثلاً ۰۸"
                maxLength={2}
                value={expireMonth}
                onChange={(e) => setExpireMonth(toEnglishDigits(e.target.value).replace(/\D/g, ""))}
                className="w-full px-3 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white font-mono text-center text-sm focus:outline-none focus:border-blue-500 transition-colors dir-ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                سال انقضا (دو رقم)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="مثلاً ۰۶"
                maxLength={2}
                value={expireYear}
                onChange={(e) => setExpireYear(toEnglishDigits(e.target.value).replace(/\D/g, ""))}
                className="w-full px-3 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white font-mono text-center text-sm focus:outline-none focus:border-blue-500 transition-colors dir-ltr"
              />
            </div>
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                دسته‌بندی
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="personal">شخصی</option>
                <option value="business">کاری و تجاری</option>
                <option value="savings">پس‌انداز و سرمایه‌گذاری</option>
                <option value="family">خانوادگی</option>
                <option value="other">سایر</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                برچسب‌ها (تگ)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مثلاً: حقوق، قسط، بیمه"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-medium text-white transition-colors"
                >
                  افزودن
                </button>
              </div>
            </div>
          </div>

          {/* Tags list */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              یادداشت یا توضیحات کارت
            </label>
            <input
              type="text"
              placeholder="توضیحات اختیاری، رمز دوم، نام شعبه و..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Actions */}
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
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              {cardToEdit ? "ذخیره تغییرات" : "ذخیره کارت"}
            </button>
          </div>
        </form>
      </div>
    </AppDrawer>
  );
};
