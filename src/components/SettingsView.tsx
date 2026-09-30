"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { useToast } from "@/context/ToastContext";
import { useCurrency, CurrencyUnit } from "@/context/CurrencyContext";
import { toPersianDigits, formatCurrency } from "@/lib/banks";
import {
  Lock,
  Database,
  Smartphone,
  ShieldCheck,
  HardDrive,
  Info,
  Check,
  ChevronLeft,
  KeyRound,
  FileCode,
  DollarSign,
  Coins,
} from "lucide-react";

interface SettingsViewProps {
  onOpenBackup: () => void;
  onOpenPinChange: () => void;
  cardsCount: number;
  peopleCount: number;
  docsCount: number;
  notesCount: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenBackup,
  onOpenPinChange,
  cardsCount,
  peopleCount,
  docsCount,
  notesCount,
}) => {
  const { showToast } = useToast();
  const { currencyUnit, setCurrencyUnit } = useCurrency();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [showApkGuide, setShowApkGuide] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const setting = await db.settings.get("pin_lock");
      if (setting && setting.value) {
        setPinEnabled(!!setting.value.enabled);
        setPinCode(setting.value.pin || "");
      }
    }
    loadSettings();
  }, []);

  const handleTogglePin = async () => {
    if (!pinEnabled) {
      // Need to configure pin first
      onOpenPinChange();
    } else {
      await db.settings.put({
        key: "pin_lock",
        value: { enabled: false, pin: "" },
      });
      setPinEnabled(false);
      setPinCode("");
      showToast("قفل برنامه غیرفعال شد", "info");
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">تنظیمات و امنیت</h2>
          <p className="text-xs text-slate-400 mt-0.5">مدیریت امنیت، پشتیبان‌گیری و خروجی برنامه</p>
        </div>
      </div>

      {/* Currency Display Setting Section */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">واحد نمایش مبالغ (تومان / ریال)</h3>
            <p className="text-xs text-slate-400">
              انتخاب شیوه نمایش موجودی، تراکنش‌ها و ارقام در سراسر برنامه
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Toman Option */}
          <div
            onClick={async () => {
              if (currencyUnit !== "toman") {
                await setCurrencyUnit("toman");
                showToast("واحد نمایش به «تومان» تغییر یافت", "success");
              }
            }}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
              currencyUnit === "toman"
                ? "bg-blue-600/10 border-blue-500 shadow-sm shadow-blue-500/10 text-white"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold ${currencyUnit === "toman" ? "text-blue-400" : "text-slate-300"}`}>
                تومان (رایج)
              </span>
              {currencyUnit === "toman" && (
                <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 leading-relaxed">
              مثال: ۱۰۰,۰۰۰ تومان
            </span>
          </div>

          {/* Rial Option */}
          <div
            onClick={async () => {
              if (currencyUnit !== "rial") {
                await setCurrencyUnit("rial");
                showToast("واحد نمایش به «ریال» تغییر یافت", "success");
              }
            }}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
              currencyUnit === "rial"
                ? "bg-blue-600/10 border-blue-500 shadow-sm shadow-blue-500/10 text-white"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold ${currencyUnit === "rial" ? "text-blue-400" : "text-slate-300"}`}>
                ریال (بانکی)
              </span>
              {currencyUnit === "rial" && (
                <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 leading-relaxed">
              مثال: ۱,۰۰۰,۰۰۰ ریال
            </span>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 px-1 leading-relaxed">
          💡 نکته: ذخیره اطلاعات به‌صورت استاندارد انجام می‌شود و با تغییر این تنظیم، فقط نحوه نمایش ارقام در برنامه به‌صورت خودکار بین ریال و تومان تغییر می‌کند.
        </p>
      </div>

      {/* Security Section */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">قفل ورود به برنامه (PIN)</h3>
            <p className="text-xs text-slate-400">محافظت از اطلاعات حساب‌ها هنگام باز شدن برنامه</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <span className="text-xs text-slate-300">وضعیت رمز عبور ۴ رقمی</span>
          <div className="flex items-center gap-2">
            {pinEnabled && (
              <button
                onClick={onOpenPinChange}
                className="text-xs px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 transition-colors"
              >
                تغییر رمز
              </button>
            )}
            <button
              onClick={handleTogglePin}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pinEnabled
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
              }`}
            >
              {pinEnabled ? "فعال است (لمس برای غیرفعال)" : "غیرفعال (لمس برای فعال‌سازی)"}
            </button>
          </div>
        </div>
      </div>

      {/* Backup & Data Section */}
      <div
        onClick={onOpenBackup}
        className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-2 group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                پشتیبان‌گیری و بازیابی داده‌ها
              </h3>
              <p className="text-xs text-slate-400">
                دریافت خروجی JSON کامل یا بازگردانی بکاپ قبلی
              </p>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
        </div>
      </div>

      {/* Database Statistics */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">آمار پایگاه داده محلی (IndexedDB)</h3>
            <p className="text-xs text-slate-400">تمام داده‌ها در حافظه اختصاصی دستگاه شماست</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
            <span className="text-slate-400">کارت‌های بانکی:</span>
            <span className="font-bold text-white font-mono">{toPersianDigits(cardsCount)}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
            <span className="text-slate-400">اشخاص ثبت‌شده:</span>
            <span className="font-bold text-white font-mono">{toPersianDigits(peopleCount)}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
            <span className="text-slate-400">مدارک و عکس‌ها:</span>
            <span className="font-bold text-white font-mono">{toPersianDigits(docsCount)}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
            <span className="text-slate-400">یادداشت‌ها:</span>
            <span className="font-bold text-white font-mono">{toPersianDigits(notesCount)}</span>
          </div>
        </div>
      </div>

      {/* APK & Mobile Instructions */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">خروجی اندروید و فایل APK</h3>
              <p className="text-xs text-slate-400">تبدیل به اپلیکیشن بومی با Capacitor</p>
            </div>
          </div>
          <button
            onClick={() => setShowApkGuide(!showApkGuide)}
            className="text-xs text-amber-400 hover:underline font-semibold"
          >
            {showApkGuide ? "بستن راهنما" : "مشاهده راهنما"}
          </button>
        </div>

        {showApkGuide && (
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed animate-in fade-in">
            <p className="font-semibold text-amber-400">
              دستورات ایجاد و بیلد خودکار فایل APK اندروید:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
              <li>
                اجرای دستور <code className="bg-slate-800 px-1 py-0.5 rounded font-mono text-white">npm run build:mobile</code>
              </li>
              <li>
                باز کردن در اندروید استودیو با <code className="bg-slate-800 px-1 py-0.5 rounded font-mono text-white">npx cap open android</code>
              </li>
              <li>
                یا اجرای بیلد مستقیم با گرادل: <code className="bg-slate-800 px-1 py-0.5 rounded font-mono text-white">cd android && ./gradlew assembleDebug</code>
              </li>
              <li>
                فایل APK آماده در مسیر <code className="bg-slate-800 px-1 py-0.5 rounded font-mono text-white">android/app/build/outputs/apk/debug/app-debug.apk</code> تولید می‌شود!
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* App Info Footer */}
      <div className="text-center pt-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">حساب‌یار و گاوصندوق شخصی • نسخه ۱.۰.۰</p>
        <p>۱۰۰٪ آفلاین • بدون نیاز به سرور و اینترنت • تمام داده‌ها محلی و ایمن</p>
      </div>
    </div>
  );
};
