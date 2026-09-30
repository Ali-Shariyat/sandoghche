"use client";

import React, { useState } from "react";
import { DocumentItem, Person, db } from "@/lib/db";
import { compressImage } from "@/lib/imageUtils";
import { useToast } from "@/context/ToastContext";
import { X, Upload, FileImage, User, Tag, Sparkles } from "lucide-react";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  peopleList: Person[];
  defaultPersonId?: number;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  peopleList,
  defaultPersonId,
}) => {
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [personId, setPersonId] = useState<number | undefined>(defaultPersonId);
  const [category, setCategory] = useState<DocumentItem["category"]>("national_card");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const { base64, size } = await compressImage(file);
      setPreviewUrl(base64);
      setFileSize(size);

      // Auto-title if title is empty
      if (!title) {
        const catTitles: Record<string, string> = {
          national_card: "کارت ملی",
          birth_cert: "شناسنامه",
          driving_license: "گواهینامه رانندگی",
          passport: "گذرنامه (پاسپورت)",
          contract: "قرارداد",
          receipt: "رسید پرداخت / فاکتور",
          cheque_doc: "تصویر چک",
          other: file.name.split(".")[0] || "مدرک جدید",
        };
        setTitle(catTitles[category] || "مدرک جدید");
      }
    } catch (err) {
      console.error(err);
      showToast("خطا در پردازش تصویر مدرک", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) {
      showToast("لطفاً عکس یا تصویر مدرک را انتخاب کنید", "error");
      return;
    }

    try {
      await db.documents.add({
        title: title.trim() || "مدرک بدون عنوان",
        personId: personId ? Number(personId) : undefined,
        category,
        fileData: previewUrl,
        mimeType: "image/jpeg",
        fileSize,
        tags: [],
        notes: notes.trim() || undefined,
        createdAt: Date.now(),
      });

      showToast("مدرک با موفقیت ذخیره شد", "success");
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      showToast("خطا در ذخیره مدرک در حافظه", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <FileImage className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">افزودن مدرک / عکس جدید</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* File Picker / Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              انتخاب عکس سند یا کارت (کارت ملی، شناسنامه، رسید و...)
            </label>
            <div className="relative border-2 border-dashed border-slate-700 hover:border-purple-500/50 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-800/40">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />

              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="پیش‌نمایش مدرک"
                    className="max-h-48 mx-auto rounded-xl object-contain shadow-md border border-slate-700"
                  />
                  <div className="mt-2 text-xs text-purple-400 font-medium">
                    برای تغییر تصویر، دوباره کلیک یا لمس کنید (حجم بهینه: {Math.round(fileSize / 1024)} کیلوبایت)
                  </div>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Upload className="w-8 h-8 text-purple-400" />
                  <span className="text-sm font-medium">
                    {isProcessing ? "در حال فشرده‌سازی و پردازش..." : "لمس کنید برای انتخاب عکس از گالری یا دوربین"}
                  </span>
                  <span className="text-xs text-slate-500">
                    تصویر به صورت فشرده و امن فقط در خود گوشی ذخیره می‌شود
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              نوع مدرک
            </label>
            <select
              value={category}
              onChange={(e: any) => {
                setCategory(e.target.value);
                const catTitles: Record<string, string> = {
                  national_card: "کارت ملی",
                  birth_cert: "شناسنامه",
                  driving_license: "گواهینامه رانندگی",
                  passport: "گذرنامه (پاسپورت)",
                  contract: "قرارداد",
                  receipt: "رسید پرداخت / فاکتور",
                  cheque_doc: "تصویر چک",
                  other: "مدرک متفرقه",
                };
                if (!title || Object.values(catTitles).includes(title)) {
                  setTitle(catTitles[e.target.value] || "");
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="national_card">کارت ملی (روی کارت یا پشت کارت)</option>
              <option value="birth_cert">صفحات شناسنامه</option>
              <option value="driving_license">گواهینامه رانندگی</option>
              <option value="passport">گذرنامه (پاسپورت)</option>
              <option value="cheque_doc">چک بانکی / صیادی</option>
              <option value="contract">قرارداد / قولنامه / سند ملکی</option>
              <option value="receipt">رسید واریز / فاکتور خرید</option>
              <option value="other">سایر اسناد و مدارک</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              عنوان مدرک *
            </label>
            <input
              type="text"
              placeholder="مثلاً: کارت ملی علی، قرارداد شرکت، رسید اجاره"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Person assignment */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              مربوط به کدام شخص؟
            </label>
            <select
              value={personId || ""}
              onChange={(e) => setPersonId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="">انتخاب شخص...</option>
              {peopleList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isMe ? " (خودم)" : p.relation ? `(${p.relation})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              یادداشت یا شماره مرجع (اختیاری)
            </label>
            <input
              type="text"
              placeholder="مثلاً: تاریخ انقضا، شماره سریال یا توضیحات"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

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
              disabled={!previewUrl || isProcessing}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              ذخیره مدرک
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
