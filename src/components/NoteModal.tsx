"use client";

import React, { useState, useEffect } from "react";
import { NoteItem, Person, BankCard, db } from "@/lib/db";
import { useToast } from "@/context/ToastContext";
import { AppDrawer } from "@/components/ui/AppDrawer";
import { FileText, Pin, Tag, Sparkles } from "lucide-react";

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: NoteItem | null;
  onSaved: () => void;
  peopleList: Person[];
  cardsList: BankCard[];
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  noteToEdit,
  onSaved,
  peopleList,
  cardsList,
}) => {
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoteItem["category"]>("personal");
  const [isPinned, setIsPinned] = useState(false);
  const [linkedPersonId, setLinkedPersonId] = useState<number | undefined>();
  const [linkedCardId, setLinkedCardId] = useState<number | undefined>();
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content);
      setCategory(noteToEdit.category || "personal");
      setIsPinned(!!noteToEdit.isPinned);
      setLinkedPersonId(noteToEdit.linkedPersonId);
      setLinkedCardId(noteToEdit.linkedCardId);
      setTags(noteToEdit.tags || []);
    } else {
      setTitle("");
      setContent("");
      setCategory("personal");
      setIsPinned(false);
      setLinkedPersonId(undefined);
      setLinkedCardId(undefined);
      setTags([]);
    }
  }, [noteToEdit, isOpen]);

  if (!isOpen) return null;

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
    if (!title.trim() && !content.trim()) {
      showToast("لطفاً حداقل عنوان یا متن یادداشت را وارد کنید", "error");
      return;
    }

    const noteData: Omit<NoteItem, "id"> = {
      title: title.trim() || "یادداشت بدون عنوان",
      content: content.trim(),
      category,
      isPinned,
      linkedPersonId: linkedPersonId ? Number(linkedPersonId) : undefined,
      linkedCardId: linkedCardId ? Number(linkedCardId) : undefined,
      tags,
      createdAt: noteToEdit?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    try {
      if (noteToEdit?.id) {
        await db.notes.update(noteToEdit.id, noteData);
        showToast("یادداشت با موفقیت به‌روزرسانی شد", "success");
      } else {
        await db.notes.add(noteData as NoteItem);
        showToast("یادداشت جدید ثبت شد", "success");
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      showToast("خطا در ذخیره یادداشت", "error");
    }
  };

  return (
    <AppDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={noteToEdit ? "ویرایش یادداشت" : "ثبت یادداشت جدید"}
      icon={<FileText className="w-5 h-5 text-amber-400" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              عنوان یادداشت *
            </label>
            <input
              type="text"
              placeholder="مثلاً: ایده‌های ماه آینده، شماره پرونده بیمه، اطلاعات سفر"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              متن کامل یادداشت
            </label>
            <textarea
              rows={5}
              placeholder="متن، جزئیات، چک‌لیست یا توضیحات مورد نظر خود را بنویسید..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors leading-relaxed"
            />
          </div>

          {/* Category & Pin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                دسته‌بندی
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="personal">شخصی</option>
                <option value="work">کاری</option>
                <option value="finance">مالی و حسابی</option>
                <option value="important">مهم و فوری</option>
                <option value="ideas">ایده‌ها و برنامه‌ها</option>
                <option value="other">سایر</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-xs font-semibold text-slate-300">سنجاق در بالای لیست</span>
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`p-2 rounded-xl border transition-all ${
                  isPinned
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    : "bg-slate-700 text-slate-400 border-slate-600"
                }`}
              >
                <Pin className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Link to person & card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                اتصال به شخص (اختیاری)
              </label>
              <select
                value={linkedPersonId || ""}
                onChange={(e) =>
                  setLinkedPersonId(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="">بدون اتصال به شخص</option>
                {peopleList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                اتصال به کارت بانکی (اختیاری)
              </label>
              <select
                value={linkedCardId || ""}
                onChange={(e) =>
                  setLinkedCardId(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="">بدون اتصال به کارت</option>
                {cardsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.bankName} - {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              برچسب‌ها (تگ)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="مثلاً: سفر، جلسه، تسویه"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-medium text-white transition-colors"
              >
                افزودن
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs"
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
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-sm font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              {noteToEdit ? "ذخیره تغییرات" : "ثبت یادداشت"}
            </button>
          </div>
        </form>
    </AppDrawer>
  );
};
