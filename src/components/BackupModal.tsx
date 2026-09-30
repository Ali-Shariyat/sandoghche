"use client";

import React, { useState } from "react";
import { exportAllData, importAllData, clearEntireDatabase, ExportDataPayload, db } from "@/lib/db";
import { formatToJalali, getTodayJalali } from "@/lib/date";
import { toPersianDigits } from "@/lib/banks";
import { useToast } from "@/context/ToastContext";
import {
  X,
  Download,
  Upload,
  Database,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Shield,
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

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<ExportDataPayload | null>(null);
  const [importJsonText, setImportJsonText] = useState<string>("");
  const [importMode, setImportMode] = useState<"overwrite" | "merge">("overwrite");

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const jsonString = await exportAllData();
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `Hesabyar_Backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("فایل پشتیبان با موفقیت صادر و دانلود شد", "success");
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

    if (
      importMode === "overwrite" &&
      !confirm("توجه: در حالت جایگزینی، داده‌های فعلی پاک شده و فایل بکاپ جایگزین می‌شود. آیا ادامه می‌دهید؟")
    ) {
      return;
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
    if (
      confirm("هشدار جدی: آیا از حذف کامل تمامی کارت‌ها، اسناد و اشخاص اطمینان دارید؟ این عمل غیرقابل برگشت است!")
    ) {
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">پشتیبان‌گیری و بازیابی داده‌ها</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 mt-4">
          {/* Export Box */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">خروجی گرفتن از تمام داده‌ها (Export)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تمام اطلاعات کارت‌ها، عکس مدارک و اشخاص در قالب یک فایل ذخیره می‌شود.
                </p>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] font-bold text-xs text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isExporting ? "در حال آماده‌سازی فایل..." : "دانلود فایل پشتیبان کامل (.json)"}
            </button>
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
                  فایل پشتیبانی که قبلاً از برنامه دریافت کرده‌اید را انتخاب کنید.
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
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold border-b border-slate-800 pb-2">
                  <span>اطلاعات فایل پشتیبان:</span>
                  <span className="text-blue-400 font-mono">
                    {formatToJalali(importPreview.timestamp)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div>• کارت‌های بانکی: {toPersianDigits(importPreview.data.bankCards?.length || 0)}</div>
                  <div>• مدارک و عکس‌ها: {toPersianDigits(importPreview.data.documents?.length || 0)}</div>
                  <div>• اشخاص ثبت‌شده: {toPersianDigits(importPreview.data.people?.length || 0)}</div>
                  <div>• یادداشت‌ها: {toPersianDigits(importPreview.data.notes?.length || 0)}</div>
                </div>

                {/* Import Mode selection */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-300 block mb-1.5">نحوه اعمال:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setImportMode("overwrite")}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
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
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
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
                  className="w-full mt-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow transition-all"
                >
                  {isImporting ? "در حال بازیابی..." : "شروع بازیابی اطلاعات"}
                </button>
              </div>
            )}
          </div>

          {/* Reset All Database */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>پاک‌سازی تمام اطلاعات برنامه</span>
            </div>
            <button
              onClick={handleResetDatabase}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors"
            >
              ریست پایگاه داده
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
