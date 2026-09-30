"use client";

import React, { useState, useEffect } from "react";
import { Person, db } from "@/lib/db";
import { isValidIranianNationalCode, toEnglishDigits, toPersianDigits } from "@/lib/banks";
import { compressImage } from "@/lib/imageUtils";
import { useToast } from "@/context/ToastContext";
import { X, User, Camera, ShieldCheck, AlertCircle, Phone, MapPin, Briefcase } from "lucide-react";

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  personToEdit?: Person | null;
  onSaved: () => void;
}

export const PersonModal: React.FC<PersonModalProps> = ({
  isOpen,
  onClose,
  personToEdit,
  onSaved,
}) => {
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [relation, setRelation] = useState("دوست");
  const [isMe, setIsMe] = useState(false);
  const [nationalCode, setNationalCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [job, setJob] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (personToEdit) {
      setName(personToEdit.name);
      setRelation(personToEdit.relation || "دوست");
      setIsMe(!!personToEdit.isMe);
      setNationalCode(personToEdit.nationalCode || "");
      setPhoneNumber(personToEdit.phoneNumber || "");
      setBirthDate(personToEdit.birthDate || "");
      setJob(personToEdit.job || "");
      setAddress(personToEdit.address || "");
      setNotes(personToEdit.notes || "");
      setAvatar(personToEdit.avatar);
    } else {
      setName("");
      setRelation("دوست");
      setIsMe(false);
      setNationalCode("");
      setPhoneNumber("");
      setBirthDate("");
      setJob("");
      setAddress("");
      setNotes("");
      setAvatar(undefined);
    }
  }, [personToEdit, isOpen]);

  if (!isOpen) return null;

  const isNationalCodeValid = nationalCode ? isValidIranianNationalCode(nationalCode) : true;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { base64 } = await compressImage(file, 400, 400, 0.85);
      setAvatar(base64);
    } catch (err) {
      showToast("خطا در پردازش تصویر پروفایل", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("لطفاً نام شخص را وارد کنید", "error");
      return;
    }

    if (nationalCode && !isValidIranianNationalCode(nationalCode)) {
      showToast("کد ملی وارد شده با الگوریتم استاندارد همخوانی ندارد (اختیاری است ولی بررسی کنید)", "info");
    }

    const personData: Omit<Person, "id"> = {
      name: name.trim(),
      relation: isMe ? "خودم" : relation,
      isMe,
      nationalCode: nationalCode.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      birthDate: birthDate.trim() || undefined,
      job: job.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      avatar,
      createdAt: personToEdit?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    try {
      if (personToEdit?.id) {
        await db.people.update(personToEdit.id, personData);
        showToast("اطلاعات شخص با موفقیت به‌روزرسانی شد", "success");
      } else {
        await db.people.add(personData as Person);
        showToast("شخص جدید با موفقیت اضافه شد", "success");
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      showToast("خطا در ذخیره اطلاعات شخص", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">
              {personToEdit ? `ویرایش اطلاعات (${personToEdit.name})` : "افزودن شخص جدید"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
              {avatar ? (
                <img src={avatar} alt="پروفایل" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-slate-500" />
              )}
              <label className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center cursor-pointer transition-colors opacity-80 hover:opacity-100">
                <Camera className="w-5 h-5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <div className="text-xs text-slate-400">
              <span className="block font-medium text-slate-200">تصویر یا عکس پرسنلی</span>
              <span>لمس کنید تا عکس پروفایل را بارگذاری نمایید</span>
            </div>
          </div>

          {/* Is Me Toggle */}
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="text-xs">
              <span className="font-semibold text-slate-200 block">پروفایل کاربری من</span>
              <span className="text-slate-400">آیا این اطلاعات مربوط به خود شماست؟</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isMe}
                onChange={(e) => setIsMe(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Name & Relation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                نام و نام خانوادگی *
              </label>
              <input
                type="text"
                placeholder="مثلاً: علی رضایی"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                نسبت یا ارتباط
              </label>
              <select
                disabled={isMe}
                value={isMe ? "خودم" : relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
              >
                <option value="خودم">خودم</option>
                <option value="همسر">همسر</option>
                <option value="فرزند">فرزند</option>
                <option value="پدر">پدر</option>
                <option value="مادر">مادر</option>
                <option value="برادر">برادر</option>
                <option value="خواهر">خواهر</option>
                <option value="دوست">دوست</option>
                <option value="همکار">همکار</option>
                <option value="شریک">شریک تجاری</option>
                <option value="مشتری">مشتری</option>
                <option value="فروشنده">فروشنده / تامین‌کننده</option>
                <option value="صاحبخانه">صاحب‌خانه</option>
                <option value="سایر">سایر</option>
              </select>
            </div>
          </div>

          {/* National Code & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  کد ملی (۱۰ رقم)
                </label>
                {nationalCode && (
                  <span
                    className={`text-[10px] flex items-center gap-1 ${
                      isNationalCodeValid ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {isNationalCodeValid ? (
                      <>
                        <ShieldCheck className="w-3 h-3" /> معتبر
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" /> نامعتبر
                      </>
                    )}
                  </span>
                )}
              </div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="مثلاً ۰۰۱۲۳۴۵۶۷۸"
                maxLength={10}
                value={toPersianDigits(nationalCode)}
                onChange={(e) =>
                  setNationalCode(toEnglishDigits(e.target.value).replace(/\D/g, ""))
                }
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white font-mono text-center text-sm focus:outline-none focus:border-emerald-500 transition-colors dir-ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                شماره موبایل
              </label>
              <input
                type="tel"
                inputMode="tel"
                placeholder="۰۹۱۲..."
                maxLength={11}
                value={toPersianDigits(phoneNumber)}
                onChange={(e) =>
                  setPhoneNumber(toEnglishDigits(e.target.value).replace(/\D/g, ""))
                }
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white font-mono text-center text-sm focus:outline-none focus:border-emerald-500 transition-colors dir-ltr"
              />
            </div>
          </div>

          {/* Job & Birth date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                شغل یا سمت
              </label>
              <input
                type="text"
                placeholder="مثلاً: کارمند، حسابدار، پزشک"
                value={job}
                onChange={(e) => setJob(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                تاریخ تولد (شمسی)
              </label>
              <input
                type="text"
                placeholder="مثلاً: ۱۳۷۰/۰۵/۱۵"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors text-center"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              آدرس یا نشانی
            </label>
            <input
              type="text"
              placeholder="آدرس منزل یا محل کار..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              یادداشت یا توضیحات درباره این شخص
            </label>
            <textarea
              rows={2}
              placeholder="هرگونه اطلاعات دیگر، کدهای اختصاصی، شماره پرونده یا یادداشت..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
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
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              {personToEdit ? "ذخیره تغییرات" : "ثبت شخص"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
