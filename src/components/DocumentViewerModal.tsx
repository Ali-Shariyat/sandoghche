"use client";

import React from "react";
import { DocumentItem, db } from "@/lib/db";
import { formatToJalali } from "@/lib/date";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import { X, Download, Trash2, Calendar, FileText, Share2 } from "lucide-react";

interface DocumentViewerModalProps {
  document: DocumentItem | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  onClose,
  onDeleted,
}) => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  if (!document) return null;

  const handleDownload = () => {
    const link = window.document.createElement("a");
    link.href = document.fileData;
    link.download = `${document.title.replace(/\s+/g, "_")}.jpg`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    showToast("تصویر مدرک دانلود شد", "success");
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "حذف مدرک",
      message: `آیا از حذف مدرک «${document.title}» مطمئن هستید؟ این عمل غیرقابل بازگشت است.`,
      confirmText: "بله، حذف شود",
      isDanger: true,
    });
    if (ok) {
      try {
        await db.documents.delete(document.id!);
        showToast("مدرک با موفقیت حذف شد", "info");
        onDeleted?.();
        onClose();
      } catch (err) {
        showToast("خطا در حذف مدرک", "error");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 z-10">
          <div>
            <h3 className="font-bold text-base text-white">{document.title}</h3>
            <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {formatToJalali(document.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              title="دانلود فایل"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              title="حذف مدرک"
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="بستن"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40">
          <img
            src={document.fileData}
            alt={document.title}
            className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-lg border border-slate-800"
          />
        </div>

        {/* Notes Footer */}
        {document.notes && (
          <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-xs text-slate-300 flex items-start gap-2">
            <FileText className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-400 block mb-0.5">توضیحات:</span>
              <p className="leading-relaxed">{document.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
