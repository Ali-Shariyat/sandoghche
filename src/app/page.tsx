"use client";

import React, { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  initializeDatabase,
  Person,
  BankCard,
  DocumentItem,
  NoteItem,
  DebtItem,
} from "@/lib/db";
import { formatJalaliFull, getTodayJalali, formatToJalali } from "@/lib/date";
import { toPersianDigits, formatCurrency, formatCardNumber } from "@/lib/banks";
import { useToast } from "@/context/ToastContext";
import { AppNavigation, NavTab } from "@/components/AppNavigation";
import { BankCardVisual } from "@/components/BankCardVisual";
import { BankCardModal } from "@/components/BankCardModal";
import { PersonModal } from "@/components/PersonModal";
import { PersonDetailView } from "@/components/PersonDetailView";
import { DocumentUploadModal } from "@/components/DocumentUploadModal";
import { DocumentViewerModal } from "@/components/DocumentViewerModal";
import { NoteModal } from "@/components/NoteModal";
import { DebtModal } from "@/components/DebtModal";
import { BackupModal } from "@/components/BackupModal";
import { SettingsView } from "@/components/SettingsView";
import { PinLockScreen } from "@/components/PinLockScreen";
import { PinSetupModal } from "@/components/PinSetupModal";
import {
  CreditCard,
  Users,
  FileText,
  ArrowLeftRight,
  Plus,
  Search,
  Database,
  Shield,
  Sparkles,
  User,
  Phone,
  FileImage,
  Pin,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Lock,
  Layers,
  Calendar,
  X,
  Share2,
  Copy,
} from "lucide-react";

export default function Home() {
  const { showToast } = useToast();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [searchQuery, setSearchQuery] = useState("");

  // Card filter
  const [cardCategoryFilter, setCardCategoryFilter] = useState<string>("all");

  // Note filter
  const [noteCategoryFilter, setNoteCategoryFilter] = useState<string>("all");

  // Debt filter
  const [debtStatusFilter, setDebtStatusFilter] = useState<string>("all");

  // Modal states
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<BankCard | null>(null);
  const [defaultCardPersonId, setDefaultCardPersonId] = useState<number | undefined>();

  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);

  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const [isDocUploadModalOpen, setIsDocUploadModalOpen] = useState(false);
  const [defaultDocPersonId, setDefaultDocPersonId] = useState<number | undefined>();

  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<NoteItem | null>(null);

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState<DebtItem | null>(null);

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isPinSetupOpen, setIsPinSetupOpen] = useState(false);

  // Security Lock
  const [isLocked, setIsLocked] = useState(false);
  const [configuredPin, setConfiguredPin] = useState("");

  // Initialize DB & load PIN settings
  useEffect(() => {
    async function init() {
      await initializeDatabase();
      const pinSetting = await db.settings.get("pin_lock");
      if (pinSetting && pinSetting.value && pinSetting.value.enabled && pinSetting.value.pin) {
        setConfiguredPin(pinSetting.value.pin);
        setIsLocked(true);
      }
    }
    init();
  }, []);

  // Reactive Live Queries
  const people = useLiveQuery(() => db.people.toArray()) || [];
  const cards = useLiveQuery(() => db.bankCards.toArray()) || [];
  const documents = useLiveQuery(() => db.documents.toArray()) || [];
  const notes = useLiveQuery(() => db.notes.toArray()) || [];
  const debts = useLiveQuery(() => db.debts.toArray()) || [];

  // Identify "Me" profile
  const meProfile = people.find((p) => p.isMe) || people[0];

  // Totals calculations
  const totalReceivable = debts
    .filter((d) => d.type === "creditor" && !d.isSettled)
    .reduce((sum, d) => sum + d.amount, 0);

  const totalPayable = debts
    .filter((d) => d.type === "debtor" && !d.isSettled)
    .reduce((sum, d) => sum + d.amount, 0);

  // Filtered Cards
  const filteredCards = cards.filter((c) => {
    const matchesCat = cardCategoryFilter === "all" || c.category === cardCategoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.bankName.toLowerCase().includes(q) ||
      c.cardNumber.includes(q) ||
      (c.shabaNumber && c.shabaNumber.toLowerCase().includes(q)) ||
      (c.tags && c.tags.some((t) => t.toLowerCase().includes(q)));
    return matchesCat && matchesSearch;
  });

  // Filtered People
  const filteredPeople = people.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.nationalCode && p.nationalCode.includes(q)) ||
      (p.phoneNumber && p.phoneNumber.includes(q)) ||
      (p.relation && p.relation.toLowerCase().includes(q))
    );
  });

  // Filtered Notes
  const filteredNotes = notes.filter((n) => {
    const matchesCat = noteCategoryFilter === "all" || n.category === noteCategoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.tags && n.tags.some((t) => t.toLowerCase().includes(q)));
    return matchesCat && matchesSearch;
  });

  // Filtered Debts
  const filteredDebts = debts.filter((d) => {
    const matchesStatus =
      debtStatusFilter === "all" ||
      (debtStatusFilter === "pending" && !d.isSettled) ||
      (debtStatusFilter === "settled" && d.isSettled);
    const person = people.find((p) => p.id === d.personId);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      d.description.toLowerCase().includes(q) ||
      (person && person.name.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  // Delete Card handler
  const handleDeleteCard = async (id: number) => {
    if (confirm("آیا از حذف این کارت بانکی مطمئن هستید؟")) {
      await db.bankCards.delete(id);
      showToast("کارت بانکی حذف شد", "info");
    }
  };

  // Delete Person handler
  const handleDeletePerson = async (id: number) => {
    await db.bankCards.where("personId").equals(id).modify({ personId: undefined });
    await db.documents.where("personId").equals(id).delete();
    await db.debts.where("personId").equals(id).delete();
    await db.people.delete(id);
    showToast("اطلاعات شخص و اسناد مربوطه حذف شد", "info");
  };

  // Delete Note handler
  const handleDeleteNote = async (id: number) => {
    if (confirm("آیا از حذف این یادداشت اطمینان دارید؟")) {
      await db.notes.delete(id);
      showToast("یادداشت حذف شد", "info");
    }
  };

  // Toggle Debt Settlement
  const handleToggleDebtSettled = async (debt: DebtItem) => {
    await db.debts.update(debt.id!, {
      isSettled: !debt.isSettled,
      settledAt: !debt.isSettled ? Date.now() : undefined,
    });
    showToast(debt.isSettled ? "به وضعیت در جریان برگشت" : "تراکنش تسویه شد", "success");
  };

  // If App is Locked with PIN
  if (isLocked) {
    return (
      <PinLockScreen
        correctPin={configuredPin}
        onUnlocked={() => setIsLocked(false)}
        title="حساب‌یار شخصی"
        subtitle="برای دسترسی به اطلاعات محرمانه، رمز ۴ رقمی را وارد کنید"
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-slate-950 text-slate-100 relative">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 pt-3 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                حساب‌یار و گاوصندوق
              </h1>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                {formatJalaliFull(Date.now())}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Backup button */}
            <button
              onClick={() => setIsBackupModalOpen(true)}
              title="پشتیبان‌گیری"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              <Database className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Quick Profile "من" Avatar Button */}
            {meProfile && (
              <button
                onClick={() => setSelectedPerson(meProfile)}
                title="پروفایل هویت من"
                className="flex items-center gap-1.5 p-1 pr-2.5 pl-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-xs font-semibold text-slate-200"
              >
                <span>من</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                  {meProfile.avatar ? (
                    <img src={meProfile.avatar} alt="من" className="w-full h-full object-cover" />
                  ) : (
                    "من"
                  )}
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative mt-3">
          <input
            type="text"
            placeholder="جستجو در کارت‌ها، مدارک، اشخاص و یادداشت‌ها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-9 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 text-slate-400 hover:text-white absolute left-2.5 top-2.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-28 overflow-y-auto">
        {/* TAB 1: DASHBOARD (HOME) */}
        {activeTab === "home" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Bento Grid Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setActiveTab("cards")}
                className="p-4 rounded-3xl bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-900/40 cursor-pointer hover:border-blue-700/60 transition-all shadow-md group"
              >
                <div className="flex items-center justify-between text-blue-400 mb-2">
                  <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                    فعال
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {toPersianDigits(cards.length)}
                </div>
                <span className="text-xs text-slate-400 font-medium">کارت‌های بانکی ثبت‌شده</span>
              </div>

              <div
                onClick={() => setActiveTab("people")}
                className="p-4 rounded-3xl bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-900/40 cursor-pointer hover:border-purple-700/60 transition-all shadow-md group"
              >
                <div className="flex items-center justify-between text-purple-400 mb-2">
                  <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                    مخاطبین
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {toPersianDigits(people.length)}
                </div>
                <span className="text-xs text-slate-400 font-medium">اشخاص و مدارک</span>
              </div>

              {/* Debt & Credit Balance Bar */}
              <div
                onClick={() => setActiveTab("debts")}
                className="col-span-2 p-4 rounded-3xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
                    خلاصه دفتر حساب و طلب‌ها
                  </span>
                  <span className="text-[11px] text-blue-400">مشاهده دفتر</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-medium block">
                      کل طلب شما (قرض داده‌اید):
                    </span>
                    <span className="text-sm font-bold text-emerald-300 font-mono">
                      {formatCurrency(totalReceivable)} تومان
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 font-medium block">
                      کل بدهی شما (قرض گرفته‌اید):
                    </span>
                    <span className="text-sm font-bold text-rose-300 font-mono">
                      {formatCurrency(totalPayable)} تومان
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Speed Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
              <button
                onClick={() => {
                  setCardToEdit(null);
                  setDefaultCardPersonId(undefined);
                  setIsCardModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shrink-0 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                کارت جدید
              </button>

              <button
                onClick={() => {
                  setPersonToEdit(null);
                  setIsPersonModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 shrink-0 active:scale-95 transition-all"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                شخص جدید
              </button>

              <button
                onClick={() => {
                  setDefaultDocPersonId(meProfile?.id);
                  setIsDocUploadModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 shrink-0 active:scale-95 transition-all"
              >
                <FileImage className="w-4 h-4 text-purple-400" />
                عکس مدرک / کارت ملی
              </button>

              <button
                onClick={() => {
                  setNoteToEdit(null);
                  setIsNoteModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 shrink-0 active:scale-95 transition-all"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                یادداشت
              </button>

              <button
                onClick={() => {
                  setDebtToEdit(null);
                  setIsDebtModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 shrink-0 active:scale-95 transition-all"
              >
                <ArrowLeftRight className="w-4 h-4 text-teal-400" />
                طلب / بدهی
              </button>
            </div>

            {/* Quick Access Bank Cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  کارت‌های سریع (با ۱ کلیک کپی کنید)
                </h3>
                <button
                  onClick={() => setActiveTab("cards")}
                  className="text-xs text-blue-400 hover:underline"
                >
                  همه ({toPersianDigits(cards.length)})
                </button>
              </div>

              {cards.length === 0 ? (
                <div
                  onClick={() => setIsCardModalOpen(true)}
                  className="p-6 text-center border-2 border-dashed border-slate-800 rounded-3xl cursor-pointer hover:border-slate-700 transition-colors"
                >
                  <CreditCard className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-300">اولین کارت بانکی خود را اضافه کنید</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    شماره کارت، شبا، تاریخ انقضا و اتصال به شخص
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cards.slice(0, 3).map((card) => {
                    const owner = people.find((p) => p.id === card.personId);
                    return (
                      <BankCardVisual
                        key={card.id}
                        card={card}
                        person={owner}
                        onEdit={(c) => {
                          setCardToEdit(c);
                          setIsCardModalOpen(true);
                        }}
                        onDelete={handleDeleteCard}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pinned Notes Preview */}
            {notes.filter((n) => n.isPinned).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Pin className="w-4 h-4 text-amber-400" />
                    یادداشت‌های سنجاق‌شده
                  </h3>
                  <button
                    onClick={() => setActiveTab("notes")}
                    className="text-xs text-amber-400 hover:underline"
                  >
                    مشاهده همه
                  </button>
                </div>
                <div className="space-y-2.5">
                  {notes
                    .filter((n) => n.isPinned)
                    .map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setNoteToEdit(n);
                          setIsNoteModalOpen(true);
                        }}
                        className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
                      >
                        <h4 className="font-bold text-xs text-white mb-1">{n.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {n.content}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BANK CARDS */}
        {activeTab === "cards" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">کارت‌ها و حساب‌های بانکی</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  مجموع: {toPersianDigits(filteredCards.length)} کارت
                </p>
              </div>

              <button
                onClick={() => {
                  setCardToEdit(null);
                  setDefaultCardPersonId(undefined);
                  setIsCardModalOpen(true);
                }}
                className="flex items-center gap-1 px-3.5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                کارت جدید
              </button>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {[
                { id: "all", label: "همه کارت‌ها" },
                { id: "personal", label: "شخصی" },
                { id: "business", label: "کاری" },
                { id: "savings", label: "پس‌انداز" },
                { id: "family", label: "خانوادگی" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCardCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl shrink-0 transition-all font-medium ${
                    cardCategoryFilter === cat.id
                      ? "bg-blue-600 text-white font-bold"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Cards List */}
            {filteredCards.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl p-6">
                <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-300">هیچ کارتی یافت نشد</h4>
                <p className="text-xs text-slate-500 mt-1">
                  می‌توانید با دکمه بالا یک کارت جدید اضافه کنید.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCards.map((card) => {
                  const owner = people.find((p) => p.id === card.personId);
                  return (
                    <BankCardVisual
                      key={card.id}
                      card={card}
                      person={owner}
                      onEdit={(c) => {
                        setCardToEdit(c);
                        setIsCardModalOpen(true);
                      }}
                      onDelete={handleDeleteCard}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PEOPLE & PROFILES */}
        {activeTab === "people" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">اشخاص، مدارک و کارت‌ها</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {toPersianDigits(people.length)} مخاطب و پروفایل
                </p>
              </div>

              <button
                onClick={() => {
                  setPersonToEdit(null);
                  setIsPersonModalOpen(true);
                }}
                className="flex items-center gap-1 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                شخص جدید
              </button>
            </div>

            {/* People List */}
            <div className="space-y-2.5">
              {filteredPeople.map((person) => {
                const personCards = cards.filter((c) => c.personId === person.id);
                const personDocs = documents.filter((d) => d.personId === person.id);
                const personDebts = debts.filter((d) => d.personId === person.id && !d.isSettled);

                return (
                  <div
                    key={person.id}
                    onClick={() => setSelectedPerson(person)}
                    className={`p-4 rounded-3xl border cursor-pointer transition-all hover:border-slate-600 group ${
                      person.isMe
                        ? "bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/40 shadow-md"
                        : "bg-slate-900 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow overflow-hidden ${
                            person.isMe
                              ? "bg-emerald-600 shadow-emerald-600/20"
                              : "bg-slate-800 border border-slate-700"
                          }`}
                        >
                          {person.avatar ? (
                            <img
                              src={person.avatar}
                              alt={person.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            person.name.charAt(0)
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                              {person.name}
                            </h3>
                            {person.isMe && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                من
                              </span>
                            )}
                            {!person.isMe && person.relation && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                                {person.relation}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            {person.nationalCode && (
                              <span>کد ملی: {toPersianDigits(person.nationalCode)}</span>
                            )}
                            {person.phoneNumber && (
                              <span className="dir-ltr font-mono">
                                {toPersianDigits(person.phoneNumber)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Badges for connected cards & docs */}
                      <div className="flex items-center gap-2 text-xs">
                        {personCards.length > 0 && (
                          <span className="px-2 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[11px] flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {toPersianDigits(personCards.length)}
                          </span>
                        )}

                        {personDocs.length > 0 && (
                          <span className="px-2 py-1 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono text-[11px] flex items-center gap-1">
                            <FileImage className="w-3 h-3" />
                            {toPersianDigits(personDocs.length)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: NOTES */}
        {activeTab === "notes" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">یادداشت‌ها و اسناد متنی</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {toPersianDigits(filteredNotes.length)} یادداشت
                </p>
              </div>

              <button
                onClick={() => {
                  setNoteToEdit(null);
                  setIsNoteModalOpen(true);
                }}
                className="flex items-center gap-1 px-3.5 py-2 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                یادداشت جدید
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {[
                { id: "all", label: "همه" },
                { id: "personal", label: "شخصی" },
                { id: "work", label: "کاری" },
                { id: "finance", label: "مالی" },
                { id: "important", label: "مهم" },
                { id: "ideas", label: "ایده‌ها" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setNoteCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl shrink-0 transition-all font-medium ${
                    noteCategoryFilter === cat.id
                      ? "bg-amber-600 text-white font-bold"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Notes List */}
            {filteredNotes.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl p-6">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-300">هیچ یادداشتی وجود ندارد</h4>
                <p className="text-xs text-slate-500 mt-1">یادداشت جدیدی ثبت کنید.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotes.map((n) => {
                  const linkedPerson = people.find((p) => p.id === n.linkedPersonId);
                  const linkedCard = cards.find((c) => c.id === n.linkedCardId);

                  return (
                    <div
                      key={n.id}
                      className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 relative"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {n.isPinned && <Pin className="w-4 h-4 text-amber-400" />}
                          <h3 className="font-bold text-sm text-white">{n.title}</h3>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setNoteToEdit(n);
                              setIsNoteModalOpen(true);
                            }}
                            className="text-xs px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDeleteNote(n.id!)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {n.content}
                      </p>

                      {/* Links to person or card */}
                      {(linkedPerson || linkedCard || (n.tags && n.tags.length > 0)) && (
                        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/80 text-[10px]">
                          {linkedPerson && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              شخص: {linkedPerson.name}
                            </span>
                          )}
                          {linkedCard && (
                            <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              کارت: {linkedCard.bankName}
                            </span>
                          )}
                          {n.tags?.map((t) => (
                            <span key={t} className="text-amber-400">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: DEBTS & LOANS LEDGER */}
        {activeTab === "debts" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">دفتر حساب، طلب و بدهی</h2>
                <p className="text-xs text-slate-400 mt-0.5">ثبت قرض‌ها و مطالبات با اشخاص</p>
              </div>

              <button
                onClick={() => {
                  setDebtToEdit(null);
                  setIsDebtModalOpen(true);
                }}
                className="flex items-center gap-1 px-3.5 py-2 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-600/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                تراکنش جدید
              </button>
            </div>

            {/* Balance Summary Card */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-3xl bg-slate-900 border border-slate-800">
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-900/40">
                <span className="text-[11px] text-emerald-400 font-semibold block">
                  طلب جاری (قرض داده‌اید):
                </span>
                <span className="text-base font-bold text-emerald-300 font-mono mt-1 block">
                  {formatCurrency(totalReceivable)} تومان
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-900/40">
                <span className="text-[11px] text-rose-400 font-semibold block">
                  بدهی جاری (قرض گرفته‌اید):
                </span>
                <span className="text-base font-bold text-rose-300 font-mono mt-1 block">
                  {formatCurrency(totalPayable)} تومان
                </span>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDebtStatusFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  debtStatusFilter === "all"
                    ? "bg-teal-600 text-white font-bold"
                    : "bg-slate-900 text-slate-400 border border-slate-800"
                }`}
              >
                همه ({toPersianDigits(debts.length)})
              </button>
              <button
                onClick={() => setDebtStatusFilter("pending")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  debtStatusFilter === "pending"
                    ? "bg-teal-600 text-white font-bold"
                    : "bg-slate-900 text-slate-400 border border-slate-800"
                }`}
              >
                در جریان ({toPersianDigits(debts.filter((d) => !d.isSettled).length)})
              </button>
              <button
                onClick={() => setDebtStatusFilter("settled")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  debtStatusFilter === "settled"
                    ? "bg-teal-600 text-white font-bold"
                    : "bg-slate-900 text-slate-400 border border-slate-800"
                }`}
              >
                تسویه شده ({toPersianDigits(debts.filter((d) => d.isSettled).length)})
              </button>
            </div>

            {/* Debts List */}
            {filteredDebts.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl p-6">
                <ArrowLeftRight className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-300">تراکنشی ثبت نشده است</h4>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDebts.map((d) => {
                  const targetPerson = people.find((p) => p.id === d.personId);
                  return (
                    <div
                      key={d.id}
                      className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-2xl ${
                            d.type === "creditor"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {d.type === "creditor" ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">
                              {targetPerson?.name || "طرف حساب نامشخص"}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full ${
                                d.type === "creditor"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-rose-500/10 text-rose-400"
                              }`}
                            >
                              {d.type === "creditor" ? "طلبکارید" : "بدهکارید"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{d.description}</p>
                          {d.dueDate && (
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              موعد: {toPersianDigits(d.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-left flex flex-col items-end gap-1.5">
                        <span
                          className={`text-sm font-bold font-mono ${
                            d.type === "creditor" ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {formatCurrency(d.amount)} تومان
                        </span>

                        <button
                          onClick={() => handleToggleDebtSettled(d)}
                          className={`text-[10px] px-2.5 py-1 rounded-xl font-semibold border transition-all ${
                            d.isSettled
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                          }`}
                        >
                          {d.isSettled ? "✓ تسویه شد" : "علامت تسویه"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === "settings" && (
          <SettingsView
            onOpenBackup={() => setIsBackupModalOpen(true)}
            onOpenPinChange={() => setIsPinSetupOpen(true)}
            cardsCount={cards.length}
            peopleCount={people.length}
            docsCount={documents.length}
            notesCount={notes.length}
          />
        )}
      </main>

      {/* Bottom Mobile Navigation */}
      <AppNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cardsCount={cards.length}
        peopleCount={people.length}
        notesCount={notes.length}
        debtsCount={debts.filter((d) => !d.isSettled).length}
      />

      {/* Modals Container */}
      <BankCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        cardToEdit={cardToEdit}
        peopleList={people}
        defaultPersonId={defaultCardPersonId}
        onSaved={() => {}}
      />

      <PersonModal
        isOpen={isPersonModalOpen}
        onClose={() => setIsPersonModalOpen(false)}
        personToEdit={personToEdit}
        onSaved={() => {}}
      />

      {selectedPerson && (
        <PersonDetailView
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
          cards={cards.filter((c) => c.personId === selectedPerson.id)}
          documents={documents.filter((d) => d.personId === selectedPerson.id)}
          debts={debts.filter((d) => d.personId === selectedPerson.id)}
          notes={notes.filter((n) => n.linkedPersonId === selectedPerson.id)}
          onAddCard={(pId) => {
            setDefaultCardPersonId(pId);
            setCardToEdit(null);
            setIsCardModalOpen(true);
          }}
          onAddDocument={(pId) => {
            setDefaultDocPersonId(pId);
            setIsDocUploadModalOpen(true);
          }}
          onEditCard={(c) => {
            setCardToEdit(c);
            setIsCardModalOpen(true);
          }}
          onDeleteCard={handleDeleteCard}
          onViewDocument={(doc) => setSelectedDoc(doc)}
          onEditPerson={(p) => {
            setPersonToEdit(p);
            setIsPersonModalOpen(true);
          }}
          onDeletePerson={handleDeletePerson}
        />
      )}

      <DocumentUploadModal
        isOpen={isDocUploadModalOpen}
        onClose={() => setIsDocUploadModalOpen(false)}
        peopleList={people}
        defaultPersonId={defaultDocPersonId}
        onSaved={() => {}}
      />

      <DocumentViewerModal
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onDeleted={() => setSelectedDoc(null)}
      />

      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        noteToEdit={noteToEdit}
        peopleList={people}
        cardsList={cards}
        onSaved={() => {}}
      />

      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        debtToEdit={debtToEdit}
        peopleList={people}
        onSaved={() => {}}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataChanged={() => {}}
      />

      <PinSetupModal
        isOpen={isPinSetupOpen}
        onClose={() => setIsPinSetupOpen(false)}
        onSaved={async () => {
          const setting = await db.settings.get("pin_lock");
          if (setting?.value?.pin) {
            setConfiguredPin(setting.value.pin);
          }
        }}
      />
    </div>
  );
}
