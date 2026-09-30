"use client";

import React, { useState } from "react";
import { Person, BankCard, DocumentItem, DebtItem, NoteItem, db } from "@/lib/db";
import { toPersianDigits, formatCurrency } from "@/lib/banks";
import { formatToJalali } from "@/lib/date";
import { BankCardVisual } from "./BankCardVisual";
import { useToast } from "@/context/ToastContext";
import {
  X,
  User,
  Phone,
  CreditCard,
  FileImage,
  Plus,
  Copy,
  Edit2,
  Trash2,
  Calendar,
  Briefcase,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
} from "lucide-react";

interface PersonDetailViewProps {
  person: Person;
  onClose: () => void;
  cards: BankCard[];
  documents: DocumentItem[];
  debts: DebtItem[];
  notes: NoteItem[];
  onAddCard: (personId: number) => void;
  onAddDocument: (personId: number) => void;
  onEditCard: (card: BankCard) => void;
  onDeleteCard: (id: number) => void;
  onViewDocument: (doc: DocumentItem) => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson?: (id: number) => void;
}

export const PersonDetailView: React.FC<PersonDetailViewProps> = ({
  person,
  onClose,
  cards,
  documents,
  debts,
  notes,
  onAddCard,
  onAddDocument,
  onEditCard,
  onDeleteCard,
  onViewDocument,
  onEditPerson,
  onDeletePerson,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"cards" | "docs" | "debts" | "notes">("cards");

  const copyText = (text?: string, label = "متن") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} کپی شد`, "success");
  };

  // Calculate debt balance
  const creditorTotal = debts
    .filter((d) => d.type === "creditor" && !d.isSettled)
    .reduce((sum, d) => sum + d.amount, 0);

  const debtorTotal = debts
    .filter((d) => d.type === "debtor" && !d.isSettled)
    .reduce((sum, d) => sum + d.amount, 0);

  const netBalance = creditorTotal - debtorTotal; // positive: they owe me, negative: I owe them

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Profile Summary */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-slate-800/90 to-slate-900 border-b border-slate-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xl font-bold shadow-lg overflow-hidden shrink-0">
                {person.avatar ? (
                  <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                ) : (
                  person.name.charAt(0)
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{person.name}</h2>
                  {person.isMe && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                      پروفایل من
                    </span>
                  )}
                  {!person.isMe && person.relation && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-xs">
                      {person.relation}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                  {person.phoneNumber && (
                    <a
                      href={`tel:${person.phoneNumber}`}
                      className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="dir-ltr font-mono">{toPersianDigits(person.phoneNumber)}</span>
                    </a>
                  )}
                  {person.nationalCode && (
                    <div
                      onClick={() => copyText(person.nationalCode, "کد ملی")}
                      className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors"
                    >
                      <span className="text-slate-500">کد ملی:</span>
                      <span className="font-mono text-slate-300">{toPersianDigits(person.nationalCode)}</span>
                      <Copy className="w-3 h-3 text-slate-500 hover:text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onEditPerson(person)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="ویرایش مشخصات"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {onDeletePerson && !person.isMe && (
                <button
                  onClick={() => {
                    if (confirm(`آیا از حذف اطلاعات «${person.name}» مطمئن هستید؟`)) {
                      onDeletePerson(person.id!);
                      onClose();
                    }
                  }}
                  className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
                  title="حذف شخص"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors mr-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Extended info pills (Job, Address, Notes) */}
          {(person.job || person.birthDate || person.address) && (
            <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
              {person.job && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/70 border border-slate-700/50">
                  <Briefcase className="w-3 h-3 text-slate-400" />
                  {person.job}
                </span>
              )}
              {person.birthDate && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/70 border border-slate-700/50">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  تولد: {toPersianDigits(person.birthDate)}
                </span>
              )}
              {person.address && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/70 border border-slate-700/50">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {person.address}
                </span>
              )}
            </div>
          )}

          {/* Debt Summary Pill if exists */}
          {!person.isMe && debts.length > 0 && (
            <div className="mt-3 p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">وضعیت تراز حساب:</span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  netBalance > 0
                    ? "text-emerald-400"
                    : netBalance < 0
                    ? "text-rose-400"
                    : "text-slate-300"
                }`}
              >
                {netBalance > 0 && `طلبکارید: ${formatCurrency(netBalance)} تومان`}
                {netBalance < 0 && `بدهکارید: ${formatCurrency(Math.abs(netBalance))} تومان`}
                {netBalance === 0 && "تسویه شده"}
              </span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-around border-b border-slate-800 bg-slate-900 px-2 py-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("cards")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
              activeTab === "cards"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>کارت‌های بانکی ({cards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
              activeTab === "docs"
                ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileImage className="w-4 h-4" />
            <span>عکس و مدارک ({documents.length})</span>
          </button>

          {!person.isMe && (
            <button
              onClick={() => setActiveTab("debts")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === "debts"
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>طلب و بدهی ({debts.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
              activeTab === "notes"
                ? "bg-amber-600/20 text-amber-400 border border-amber-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>یادداشت‌ها ({notes.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: Bank Cards */}
          {activeTab === "cards" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400">
                  کارت‌های بانکی متعلق به {person.name}
                </span>
                <button
                  onClick={() => onAddCard(person.id!)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  افزودن کارت برای این شخص
                </button>
              </div>

              {cards.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded-3xl p-6">
                  <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">هنوز هیچ کارت بانکی برای این شخص ثبت نشده است.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cards.map((c) => (
                    <BankCardVisual
                      key={c.id}
                      card={c}
                      person={person}
                      onEdit={onEditCard}
                      onDelete={onDeleteCard}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Documents & Photos */}
          {activeTab === "docs" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400">
                  مدارک هویتی و عکس‌های {person.name}
                </span>
                <button
                  onClick={() => onAddDocument(person.id!)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  بارگذاری عکس یا مدرک جدید
                </button>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded-3xl p-6">
                  <FileImage className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">
                    تصویر کارت ملی، شناسنامه یا اسناد دیگر برای این شخص ثبت نشده است.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => onViewDocument(doc)}
                      className="group cursor-pointer relative bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-md hover:border-purple-500/50 transition-all hover:scale-[1.02]"
                    >
                      <div className="aspect-[4/3] bg-black/40 relative overflow-hidden">
                        <img
                          src={doc.fileData}
                          alt={doc.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                        <span className="absolute bottom-2 right-2 left-2 text-xs font-bold text-white truncate drop-shadow">
                          {doc.title}
                        </span>
                      </div>
                      <div className="p-2 text-[10px] text-slate-400 flex items-center justify-between bg-slate-900/90">
                        <span>{formatToJalali(doc.createdAt)}</span>
                        <span className="text-purple-400">مشاهده</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Debts & Ledger */}
          {activeTab === "debts" && !person.isMe && (
            <div className="space-y-3">
              {debts.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded-3xl p-6">
                  <ArrowUpRight className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">هیچ تراکنش یا طلب/بدهی ثبت نشده است.</p>
                </div>
              ) : (
                debts.map((debt) => (
                  <div
                    key={debt.id}
                    className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl ${
                          debt.type === "creditor"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {debt.type === "creditor" ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-white">{debt.description}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{formatToJalali(debt.createdAt)}</span>
                          {debt.dueDate && <span>• موعد: {toPersianDigits(debt.dueDate)}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-left">
                      <div
                        className={`font-bold text-sm ${
                          debt.type === "creditor" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {formatCurrency(debt.amount)} تومان
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 ${
                          debt.isSettled
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {debt.isSettled ? "تسویه شده" : "در جریان"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: Notes */}
          {activeTab === "notes" && (
            <div className="space-y-3">
              {notes.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded-3xl p-6">
                  <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">یادداشتی برای این شخص ثبت نشده است.</p>
                </div>
              ) : (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1.5"
                  >
                    <h4 className="font-bold text-sm text-white">{n.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {n.content}
                    </p>
                    <div className="text-[10px] text-slate-500 pt-1">
                      {formatToJalali(n.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
