"use client";

import React, { useState } from "react";
import { BankCard, Person } from "@/lib/db";
import {
  detectBank,
  formatCardNumber,
  formatShabaNumber,
  toPersianDigits,
  formatCurrency,
  BankInfo,
} from "@/lib/banks";
import { useToast } from "@/context/ToastContext";
import { useCurrency } from "@/context/CurrencyContext";
import {
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Share2,
  Trash2,
  Edit2,
  Receipt,
  User,
  Check,
  Tag,
} from "lucide-react";

interface BankCardVisualProps {
  card: BankCard;
  person?: Person;
  onEdit?: (card: BankCard) => void;
  onDelete?: (id: number) => void;
  onOpenTransactions?: (card: BankCard) => void;
  compact?: boolean;
}

export const BankCardVisual: React.FC<BankCardVisualProps> = ({
  card,
  person,
  onEdit,
  onDelete,
  onOpenTransactions,
  compact = false,
}) => {
  const { showToast } = useToast();
  const { formatAmount } = useCurrency();
  const [showSensitive, setShowSensitive] = useState(false);
  const [copiedType, setCopiedType] = useState<"card" | "shaba" | null>(null);

  const bankInfo: BankInfo = detectBank(card.cardNumber);

  const handleCopy = (text: string, type: "card" | "shaba", label: string) => {
    if (!text) return;
    const cleanText = text.replace(/\s+/g, "").replace(/-/g, "");
    navigator.clipboard.writeText(cleanText).then(() => {
      setCopiedType(type);
      showToast(`${label} کپی شد`, "success");
      setTimeout(() => setCopiedType(null), 2000);
    }).catch(() => {
      showToast("خطا در کپی متن", "error");
    });
  };

  const handleShare = async () => {
    const textToShare = `${card.bankName} - ${card.title}\nشماره کارت:\n${card.cardNumber}\n${
      card.shabaNumber ? `شماره شبا:\n${card.shabaNumber}\n` : ""
    }${person?.name ? `به نام: ${person.name}` : ""}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: card.title,
          text: textToShare,
        });
      } catch (err) {
        // user cancelled or share unsupported
      }
    } else {
      handleCopy(textToShare, "card", "مشخصات کامل کارت");
    }
  };

  // Use single space so 16 digits fit perfectly on narrow mobile screens (19 chars total)
  const formattedCardNumber = formatCardNumber(card.cardNumber, " ");
  const formattedShaba = card.shabaNumber ? formatShabaNumber(card.shabaNumber) : "";

  return (
    <div className="relative group w-full select-none transition-all duration-300">
      {/* 3D Bank Card Container */}
      <div
        className={`relative w-full rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-xl overflow-hidden bg-gradient-to-br ${
          card.colorTheme || bankInfo.gradient
        } border border-white/20 backdrop-blur-md transition-transform duration-200 active:scale-[0.99]`}
        style={{
          boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
        }}
      >
        {/* Decorative Card Background Patterns */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-black/20 blur-xl pointer-events-none" />

        {/* Card Header: Bank Logo/Name & Title */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 font-bold text-xs shadow-inner shrink-0">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base tracking-wide drop-shadow-sm truncate">
                {card.bankName || bankInfo.name}
              </h3>
              <p className="text-[11px] text-white/80 font-medium truncate">{card.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleShare}
              title="اشتراک‌گذاری"
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white/90"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(card)}
                title="ویرایش کارت"
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white/90"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && card.id && (
              <button
                onClick={() => onDelete(card.id!)}
                title="حذف کارت"
                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Card Chip & Contactless Indicator */}
        <div className="relative z-10 flex items-center justify-between my-2.5">
          {/* Smart Chip SVG */}
          <div className="w-9 h-6 sm:w-10 sm:h-7 rounded bg-gradient-to-tr from-amber-300 via-amber-200 to-yellow-400 border border-amber-500/50 shadow-sm flex flex-col justify-around p-0.5 opacity-90">
            <div className="w-full h-[1px] bg-amber-700/40" />
            <div className="flex justify-between">
              <div className="w-2 h-[1px] bg-amber-700/40" />
              <div className="w-2 h-[1px] bg-amber-700/40" />
            </div>
            <div className="w-full h-[1px] bg-amber-700/40" />
          </div>

          {/* Contactless waves */}
          <div className="text-white/75 rotate-90">
            <svg
              className="w-4 h-4 text-white/75"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.5 7.5a6.5 6.5 0 010 9m3.5-12a10.5 10.5 0 010 15m3.5-15a14.5 14.5 0 010 18"
              />
            </svg>
          </div>
        </div>

        {/* 16-Digit Card Number with Copy Action (Now strictly non-breaking) */}
        <div className="relative z-10 my-1.5">
          <div
            onClick={() => handleCopy(card.cardNumber, "card", "شماره کارت")}
            className="flex items-center justify-between bg-black/20 hover:bg-black/30 active:scale-[0.99] cursor-pointer px-3 py-2 rounded-xl sm:rounded-2xl border border-white/10 transition-colors group/btn gap-2"
          >
            <div className="font-mono text-sm sm:text-base md:text-lg font-bold tracking-wider text-white drop-shadow dir-ltr text-center flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {toPersianDigits(formattedCardNumber)}
            </div>
            <div className="text-white/80 group-hover/btn:text-white transition-colors shrink-0">
              {copiedType === "card" ? (
                <Check className="w-4 h-4 text-emerald-300" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>

        {/* Card Footer: Owner Name, CVV2, Expire Date */}
        <div className="relative z-10 flex items-end justify-between mt-2.5 text-xs gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-white/75 font-light">دارنده کارت</span>
            <span className="font-bold text-xs sm:text-sm tracking-wide text-white drop-shadow-sm flex items-center gap-1 truncate">
              <User className="w-3 h-3 text-white/70 shrink-0 inline" />
              <span className="truncate">{person?.name || "من"}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 dir-ltr font-mono shrink-0">
            {card.cvv2 && (
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-white/75 font-sans">CVV2</span>
                <span className="font-bold text-[11px] sm:text-xs text-white">
                  {showSensitive ? toPersianDigits(card.cvv2) : "•••"}
                </span>
              </div>
            )}

            {(card.expireMonth || card.expireYear) && (
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-white/75 font-sans">انقضا</span>
                <span className="font-bold text-[11px] sm:text-xs text-white">
                  {showSensitive
                    ? `${toPersianDigits(card.expireMonth || "۰۰")}/${toPersianDigits(
                        card.expireYear || "۰۰"
                      )}`
                    : "••/••"}
                </span>
              </div>
            )}

            <button
              onClick={() => setShowSensitive(!showSensitive)}
              className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
              title={showSensitive ? "مخفی کردن اطلاعات" : "نمایش اطلاعات"}
            >
              {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Card Balance & Transactions Strip */}
        <div className="relative z-10 flex items-center justify-between mt-3 pt-2.5 border-t border-white/20 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] text-white/80 font-light">موجودی:</span>
            <span className="font-mono font-bold text-xs sm:text-sm text-white drop-shadow truncate">
              {showSensitive
                ? formatAmount(card.balance !== undefined ? card.balance : 0)
                : "••••••••"}
            </span>
          </div>

          {onOpenTransactions && (
            <button
              type="button"
              onClick={() => onOpenTransactions(card)}
              className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-[11px] font-bold text-white transition-all flex items-center gap-1.5 shadow-sm backdrop-blur-md shrink-0"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-300" />
              <span>ثبت خرج / تراکنش</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Card Details Drawer: Shaba, Account Number, Tags */}
      {(card.shabaNumber || card.accountNumber || (card.tags && card.tags.length > 0)) && (
        <div className="mt-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 sm:p-3 text-xs space-y-2 text-slate-300">
          {/* Shaba Number */}
          {card.shabaNumber && (
            <div
              onClick={() => handleCopy(card.shabaNumber!, "shaba", "شماره شبا")}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 cursor-pointer border border-slate-700/50 transition-colors gap-2"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-semibold text-emerald-400 shrink-0 text-[11px]">شبا:</span>
                <span className="font-mono text-[11px] text-slate-200 dir-ltr truncate">
                  {formattedShaba}
                </span>
              </div>
              <div className="text-slate-400 hover:text-white shrink-0">
                {copiedType === "shaba" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
          )}

          {/* Account Number & Category */}
          <div className="flex items-center justify-between px-1 text-[11px]">
            {card.accountNumber && (
              <div className="flex items-center gap-1 truncate">
                <span className="text-slate-400 shrink-0">شماره حساب:</span>
                <span className="font-mono text-slate-200 truncate">
                  {toPersianDigits(card.accountNumber)}
                </span>
              </div>
            )}
            {card.category && (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] shrink-0 mr-auto">
                {card.category === "personal"
                  ? "شخصی"
                  : card.category === "business"
                  ? "کاری"
                  : card.category === "savings"
                  ? "پس‌انداز"
                  : card.category === "family"
                  ? "خانوادگی"
                  : "سایر"}
              </span>
            )}
          </div>

          {/* Tags */}
          {card.tags && card.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/80">
              <Tag className="w-3 h-3 text-slate-500 shrink-0" />
              {card.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
