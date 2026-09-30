"use client";

import React, { useState, useEffect } from "react";
import { BankCard, Person, db } from "@/lib/db";
import {
  detectBank,
  formatCardNumber,
  formatShabaNumber,
  toEnglishDigits,
  toPersianDigits,
  IRANIAN_BANKS,
} from "@/lib/banks";
import { useToast } from "@/context/ToastContext";
import { X, CreditCard, User, Sparkles, Tag, Check, Calendar } from "lucide-react";

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

  const [title, setTitle] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [shabaNumber, setShabaNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [cvv2, setCvv2] = useState("");
  const [expireMonth, setExpireMonth] = useState("");
  const [expireYear, setExpireYear] = useState("");
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
      setPersonId(defaultPersonId || peopleList.find((p) => p.isMe)?.id || peopleList[0]?.id);
      setCategory("personal");
      setTags([]);
      setNote("");
      setSelectedColor("");
    }
  }, [cardToEdit, isOpen, defaultPersonId, peopleList]);

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || cardNumber.length < 16) {
      showToast("لطفاً شماره کارت ۱۶ رقمی را کامل وارد کنید", "error");
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
        showToast("کارت بانکی با موفقیت به‌روزرسانی شد", "success");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 my-8 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">
              {cardToEdit ? "ویرایش کارت بانکی" : "افزودن کارت بانکی جدید"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Bank Preview Badge */}
        <div className="my-4 p-3 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-800/60 border border-slate-700/60 flex items-center justify-between">
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              شماره ۱۶ رقمی کارت *
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="۶۰۳۷-۹۹۱۸-xxxx-xxxx"
              value={formatCardNumber(cardNumber)}
              onChange={handleCardNumberChange}
              maxLength={23}
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-white font-mono text-center text-lg tracking-wider focus:outline-none focus:border-blue-500 transition-colors dir-ltr"
            />
          </div>

          {/* Title & Person Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                عنوان کارت
              </label>
              <input
                type="text"
                placeholder="مثلاً کارت حقوق، خرید، اصلی"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                متعلق به چه کسی؟
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
                افزودن برچسب (تگ)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مثلاً قسط، حقوق"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-medium text-white transition-colors"
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

          {/* Extra Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              یادداشت یا توضیحات (محرمانه در دستگاه)
            </label>
            <textarea
              rows={2}
              placeholder="مثلاً سقف انتقال، شماره مشتری یا نکات مهم..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Action buttons */}
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
              {cardToEdit ? "ذخیره تغییرات" : "ثبت کارت"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
