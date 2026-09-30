"use client";

import React, { useState } from "react";
import { exportAllData, importAllData, clearEntireDatabase, ExportDataPayload, db } from "@/lib/db";
import { formatToJalali, getTodayJalali } from "@/lib/date";
import { toPersianDigits } from "@/lib/banks";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import { AppDrawer } from "@/components/ui/AppDrawer";
import {
  Download,
  Upload,
  Database,
  FileCheck,
  AlertTriangle,
  FolderOpen,
  Share2,
  Info,
  CheckCircle2,
} from "lucide-react";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<ExportDataPayload | null>(null);
  const [importJsonText, setImportJsonText] = useState<string>("");
  const [importMode, setImportMode] = useState<"overwrite" | "merge">("overwrite");

  const triggerDirectDownload = (jsonString: string, fileName?: string) => {
    const dateStr = new Date().toISOString().split("T")[0];
    const name = fileName || `Sandoghche_Backup_${dateStr}.json`;
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("فایل در پوشه Downloads (دانلودها) ذخیره شد", "success");
  };

  const handleExportWithPicker = async () => {
    setIsExporting(true);
    try {
      const jsonString = await exportAllData();
      const dateStr = new Date().toISOString().split("T")[0];
      const fileName = `Sandoghche_Backup_${dateStr}.json`;

      // 1. Try File System Access API (showSaveFilePicker) on Chromium/Desktop
      if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: "فایل پشتیبان صندوقچه (JSON)",
                accept: { "application/json": [".json"] },
              },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(jsonString);
          await writable.close();
          showToast("فایل پشتیبان در پوشه انتخابی شما با موفقیت ذخیره شد", "success");
          return;
        } catch (pickerErr: any) {
          if (pickerErr?.name === "AbortError") {
            // User cancelled picker dialog
            return;
          }
          console.warn("showSaveFilePicker error:", pickerErr);
        }
      }

      // 2. Try Web Share API with File (Mobile / Android)
      const blob = new Blob([jsonString], { type: "application/json" });
      const file = new File([blob], fileName, { type: "application/json" });
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "پشتیبان داده‌های صندوقچه",
            text: `فایل بکاپ صندوقچه - تاریخ ${dateStr}`,
          });
          showToast("فایل پشتیبان با موفقیت ذخیره یا به اشتراک گذاشته شد", "success");
          return;
        } catch (shareErr: any) {
          if (shareErr?.name === "AbortError") return;
          console.warn("navigator.share error:", shareErr);
        }
      }

      // 3. Fallback: Trigger standard download
      triggerDirectDownload(jsonString, fileName);
    } catch (err) {
      console.error(err);
      showToast("خطا در ایجاد یا ذخیره فایل پشتیبان", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDirect = async () => {
    setIsExporting(true);
    try {
      const jsonString = await exportAllData();
      triggerDirectDownload(jsonString);
    } catch (err) {
      console.error(err);
      showToast("خطا در ایجاد فایل پشتیبان", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as ExportDataPayload;
        if (!parsed.data || typeof parsed.data !== "object") {
          showToast("فرمت فایل انتخاب شده نامعتبر است", "error");
          return;
        }
        setImportJsonText(text);
        setImportPreview(parsed);
      } catch (err) {
        showToast("فایل انتخاب شده JSON معتبر نیست", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!importJsonText) return;

    if (importMode === "overwrite") {
      const ok = await confirm({
        title: "جایگزینی داده‌ها",
        message: "توجه: در حالت جایگزینی، داده‌های فعلی به طور کامل پاک شده و فایل بکاپ جایگزین می‌شود. آیا ادامه می‌دهید؟",
        confirmText: "بله، جایگزین شود",
        isDanger: true,
      });
      if (!ok) return;
    }

    setIsImporting(true);
    try {
      const res = await importAllData(importJsonText, importMode);
      if (res.success) {
        showToast("اطلاعات پشتیبان با موفقیت بازیابی شد", "success");
        onDataChanged();
        setImportPreview(null);
        setImportJsonText("");
        onClose();
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast(`خطا در بازیابی: ${err?.message}`, "error");
    } finally {
      setIsImporting(false);
    }
  };

  const handleResetDatabase = async () => {
    const ok = await confirm({
      title: "پاک‌سازی کامل پایگاه داده",
      message: "هشدار جدی: آیا از حذف کامل تمامی کارت‌ها، اسناد، تراکنش‌ها و اشخاص اطمینان دارید؟ این عمل غیرقابل بازگشت است!",
      confirmText: "بله، همه داده‌ها پاک شوند",
      isDanger: true,
    });
    if (ok) {
      try {
        await clearEntireDatabase();
        showToast("تمامی داده‌ها پاک‌سازی شدند", "info");
        onDataChanged();
        onClose();
      } catch (err) {
        showToast("خطا در پاک‌سازی داده‌ها", "error");
      }
    }
  };

  return (
    <AppDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="پشتیبان‌گیری و بازیابی داده‌ها"
      icon={<Database className="w-5 h-5 text-blue-400" />}
    >
      <div className="space-y-6">
        {/* Info Box: Where do files go */}
        <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-blue-200">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>فایل پشتیبان دانلود شده کجا می‌رود؟</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">
            • <strong>دانلود مستقیم:</strong> فایل به صورت خودکار در پوشه <code>Downloads</code> (دانلودها) گوشی یا رایانه ذخیره می‌شود.
          </p>
          <p className="text-[11px] leading-relaxed text-slate-300">
            • <strong>انتخاب محل دلخواه:</strong> پنجره سیستم‌عامل باز می‌شود و می‌توانید پوشه دلخواه خود (مثلاً اسناد، فلش مموری یا پوشه دلخواه در حافظه گوشی) را انتخاب کنید.
          </p>
        </div>

        {/* Export Box */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">خروجی گرفتن از تمام داده‌ها (Export)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                شامل کارت‌ها، تراکنش‌ها، موجودی، عکس مدارک و اشخاص
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleExportWithPicker}
              disabled={isExporting}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] font-bold text-xs text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              <FolderOpen className="w-4 h-4 text-emerald-100" />
              <span>{isExporting ? "در حال آماده‌سازی..." : "انتخاب پوشه دلخواه برای ذخیره"}</span>
            </button>

            <button
              onClick={handleExportDirect}
              disabled={isExporting}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.99] font-bold text-xs text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>دانلود در پوشه Downloads</span>
            </button>
          </div>
        </div>

        {/* Import Box */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">بازیابی اطلاعات از فایل (Import)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                فایل پشتیبانی که قبلاً ذخیره کرده‌اید را انتخاب کنید.
              </p>
            </div>
          </div>

          <label className="border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-2xl p-4 text-center cursor-pointer transition-colors block bg-slate-800/40">
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <FileCheck className="w-6 h-6 text-blue-400 mx-auto mb-1.5" />
            <span className="text-xs font-semibold text-slate-300 block">
              لمس کنید برای انتخاب فایل پشتیبان (.json)
            </span>
          </label>

          {/* Preview Selected File */}
          {importPreview && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold border-b border-slate-800 pb-2">
                <span>اطلاعات فایل پشتیبان:</span>
                <span className="text-blue-400 font-mono">
                  {formatToJalali(importPreview.timestamp)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div>• کارت‌های بانکی: {toPersianDigits(importPreview.data.bankCards?.length || 0)}</div>
                <div>• تراکنش‌های کارت‌ها: {toPersianDigits(importPreview.data.cardTransactions?.length || 0)}</div>
                <div>• مدارک و عکس‌ها: {toPersianDigits(importPreview.data.documents?.length || 0)}</div>
                <div>• اشخاص ثبت‌شده: {toPersianDigits(importPreview.data.people?.length || 0)}</div>
                <div>• یادداشت‌ها: {toPersianDigits(importPreview.data.notes?.length || 0)}</div>
                <div>• طلب و بدهی‌ها: {toPersianDigits(importPreview.data.debts?.length || 0)}</div>
              </div>

              {/* Import Mode selection */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-300 block mb-1.5 font-medium">نحوه اعمال:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode("overwrite")}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                      importMode === "overwrite"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    جایگزینی کامل (پاک کردن قبلی)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode("merge")}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                      importMode === "merge"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    ادغام با داده‌های فعلی
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting}
                className="w-full mt-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isImporting ? "در حال بازیابی..." : "شروع بازیابی اطلاعات"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Reset All Database */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>پاک‌سازی کامل اطلاعات برنامه</span>
          </div>
          <button
            onClick={handleResetDatabase}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors"
          >
            ریست داده‌ها
          </button>
        </div>
      </div>
    </AppDrawer>
  );
};
