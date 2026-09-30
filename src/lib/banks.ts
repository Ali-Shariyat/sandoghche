// Iranian Banks Database and Helper Functions

export interface BankInfo {
  key: string;
  name: string;
  shortName: string;
  prefixes: string[];
  gradient: string;
  textColor: string;
  accentColor: string;
  logoBg: string;
}

export const IRANIAN_BANKS: BankInfo[] = [
  {
    key: "melli",
    name: "بانک ملی ایران",
    shortName: "ملی",
    prefixes: ["603799", "639217"],
    gradient: "from-amber-600 via-yellow-600 to-amber-700",
    textColor: "text-amber-100",
    accentColor: "#d97706",
    logoBg: "bg-amber-500",
  },
  {
    key: "mellat",
    name: "بانک ملت",
    shortName: "ملت",
    prefixes: ["610433", "991975"],
    gradient: "from-rose-700 via-red-600 to-rose-900",
    textColor: "text-rose-100",
    accentColor: "#e11d48",
    logoBg: "bg-red-600",
  },
  {
    key: "tejarat",
    name: "بانک تجارت",
    shortName: "تجارت",
    prefixes: ["627353", "585983"],
    gradient: "from-blue-700 via-indigo-700 to-blue-900",
    textColor: "text-blue-100",
    accentColor: "#2563eb",
    logoBg: "bg-blue-600",
  },
  {
    key: "saderat",
    name: "بانک صادرات ایران",
    shortName: "صادرات",
    prefixes: ["603769"],
    gradient: "from-sky-800 via-blue-900 to-slate-900",
    textColor: "text-sky-100",
    accentColor: "#0284c7",
    logoBg: "bg-sky-700",
  },
  {
    key: "sepah",
    name: "بانک سپه",
    shortName: "سپه",
    prefixes: ["589210", "627381", "505801", "639599", "636949"],
    gradient: "from-emerald-700 via-teal-700 to-emerald-900",
    textColor: "text-emerald-100",
    accentColor: "#059669",
    logoBg: "bg-emerald-600",
  },
  {
    key: "keshavarzi",
    name: "بانک کشاورزی",
    shortName: "کشاورزی",
    prefixes: ["603770", "639217"],
    gradient: "from-emerald-600 via-green-700 to-teal-800",
    textColor: "text-emerald-100",
    accentColor: "#10b981",
    logoBg: "bg-green-600",
  },
  {
    key: "masken",
    name: "بانک مسکن",
    shortName: "مسکن",
    prefixes: ["628023"],
    gradient: "from-amber-600 via-orange-600 to-orange-800",
    textColor: "text-orange-100",
    accentColor: "#ea580c",
    logoBg: "bg-orange-500",
  },
  {
    key: "blubank",
    name: "بلوبانک (سامان)",
    shortName: "بلوبانک",
    prefixes: ["621986", "8619"],
    gradient: "from-blue-600 via-cyan-500 to-blue-700",
    textColor: "text-white",
    accentColor: "#0ea5e9",
    logoBg: "bg-cyan-500",
  },
  {
    key: "saman",
    name: "بانک سامان",
    shortName: "سامان",
    prefixes: ["621986"],
    gradient: "from-sky-600 via-blue-600 to-indigo-800",
    textColor: "text-sky-100",
    accentColor: "#0284c7",
    logoBg: "bg-sky-600",
  },
  {
    key: "pasargad",
    name: "بانک پاسارگاد",
    shortName: "پاسارگاد",
    prefixes: ["502229", "639347"],
    gradient: "from-yellow-700 via-amber-700 to-stone-900",
    textColor: "text-amber-100",
    accentColor: "#b45309",
    logoBg: "bg-yellow-600",
  },
  {
    key: "parsian",
    name: "بانک پارسیان",
    shortName: "پارسیان",
    prefixes: ["622106", "639194", "627884"],
    gradient: "from-red-800 via-rose-800 to-stone-900",
    textColor: "text-rose-100",
    accentColor: "#991b1b",
    logoBg: "bg-red-800",
  },
  {
    key: "refah",
    name: "بانک رفاه کارگران",
    shortName: "رفاه",
    prefixes: ["589463"],
    gradient: "from-blue-800 via-indigo-900 to-slate-950",
    textColor: "text-blue-100",
    accentColor: "#1e40af",
    logoBg: "bg-blue-800",
  },
  {
    key: "resalat",
    name: "قرض‌الحسنه رسالت",
    shortName: "رسالت",
    prefixes: ["504172"],
    gradient: "from-blue-700 via-teal-700 to-slate-800",
    textColor: "text-blue-100",
    accentColor: "#0f766e",
    logoBg: "bg-teal-600",
  },
  {
    key: "mehr",
    name: "قرض‌الحسنه مهر ایران",
    shortName: "مهر ایران",
    prefixes: ["606373"],
    gradient: "from-emerald-700 via-teal-800 to-green-950",
    textColor: "text-emerald-100",
    accentColor: "#047857",
    logoBg: "bg-emerald-700",
  },
  {
    key: "shahr",
    name: "بانک شهر",
    shortName: "شهر",
    prefixes: ["502806"],
    gradient: "from-rose-600 via-orange-600 to-rose-800",
    textColor: "text-rose-100",
    accentColor: "#e11d48",
    logoBg: "bg-rose-500",
  },
  {
    key: "ayandeh",
    name: "بانک آینده",
    shortName: "آینده",
    prefixes: ["636214"],
    gradient: "from-amber-700 via-stone-800 to-zinc-900",
    textColor: "text-amber-100",
    accentColor: "#d97706",
    logoBg: "bg-amber-600",
  },
  {
    key: "sina",
    name: "بانک سینا",
    shortName: "سینا",
    prefixes: ["639346"],
    gradient: "from-blue-700 via-sky-800 to-indigo-900",
    textColor: "text-blue-100",
    accentColor: "#1d4ed8",
    logoBg: "bg-blue-700",
  },
  {
    key: "dey",
    name: "بانک دی",
    shortName: "دی",
    prefixes: ["502938"],
    gradient: "from-blue-600 via-indigo-700 to-blue-900",
    textColor: "text-blue-100",
    accentColor: "#3b82f6",
    logoBg: "bg-blue-600",
  },
  {
    key: "postbank",
    name: "پست بانک ایران",
    shortName: "پست بانک",
    prefixes: ["627760"],
    gradient: "from-emerald-700 via-teal-700 to-slate-900",
    textColor: "text-emerald-100",
    accentColor: "#059669",
    logoBg: "bg-emerald-600",
  },
  {
    key: "eghtesad",
    name: "بانک اقتصاد نوین",
    shortName: "اقتصاد نوین",
    prefixes: ["627412"],
    gradient: "from-purple-800 via-violet-800 to-slate-900",
    textColor: "text-purple-100",
    accentColor: "#7c3aed",
    logoBg: "bg-purple-700",
  },
  {
    key: "karafarin",
    name: "بانک کارآفرین",
    shortName: "کارآفرین",
    prefixes: ["627488"],
    gradient: "from-teal-800 via-emerald-900 to-slate-900",
    textColor: "text-teal-100",
    accentColor: "#0d9488",
    logoBg: "bg-teal-700",
  },
  {
    key: "gardeshgari",
    name: "بانک گردشگری",
    shortName: "گردشگری",
    prefixes: ["505416"],
    gradient: "from-stone-700 via-amber-800 to-stone-900",
    textColor: "text-amber-100",
    accentColor: "#b45309",
    logoBg: "bg-stone-600",
  },
  {
    key: "tosee_taavon",
    name: "بانک توسعه تعاون",
    shortName: "توسعه تعاون",
    prefixes: ["502908"],
    gradient: "from-blue-700 via-cyan-800 to-slate-900",
    textColor: "text-blue-100",
    accentColor: "#0284c7",
    logoBg: "bg-blue-700",
  },
  {
    key: "sarmayeh",
    name: "بانک سرمایه",
    shortName: "سرمایه",
    prefixes: ["639607"],
    gradient: "from-cyan-800 via-blue-900 to-slate-900",
    textColor: "text-cyan-100",
    accentColor: "#0891b2",
    logoBg: "bg-cyan-700",
  },
  {
    key: "iranzamin",
    name: "بانک ایران زمین",
    shortName: "ایران زمین",
    prefixes: ["505785"],
    gradient: "from-violet-800 via-purple-900 to-slate-950",
    textColor: "text-purple-100",
    accentColor: "#8b5cf6",
    logoBg: "bg-violet-700",
  },
];

const DEFAULT_BANK: BankInfo = {
  key: "other",
  name: "بانک نامشخص",
  shortName: "کارت بانکی",
  prefixes: [],
  gradient: "from-slate-700 via-zinc-800 to-slate-900",
  textColor: "text-slate-100",
  accentColor: "#64748b",
  logoBg: "bg-slate-600",
};

/**
 * Detect bank information from 16-digit card number or 6-digit prefix
 */
export function detectBank(cardNumber: string): BankInfo {
  if (!cardNumber) return DEFAULT_BANK;
  const cleaned = cardNumber.replace(/\D/g, "");
  if (cleaned.length < 6) return DEFAULT_BANK;

  const prefix6 = cleaned.substring(0, 6);
  for (const bank of IRANIAN_BANKS) {
    if (bank.prefixes.includes(prefix6)) {
      return bank;
    }
  }
  return DEFAULT_BANK;
}

/**
 * Format 16 digit card number to 4-4-4-4 with spaces
 */
export function formatCardNumber(num: string): string {
  const cleaned = (num || "").replace(/\D/g, "").slice(0, 16);
  const parts = cleaned.match(/.{1,4}/g);
  return parts ? parts.join(" - ") : cleaned;
}

/**
 * Format Sheba number (IR + 24 digits in groups of 4)
 */
export function formatShabaNumber(shaba: string): string {
  if (!shaba) return "";
  let cleaned = shaba.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!cleaned.startsWith("IR") && cleaned.length > 0) {
    cleaned = "IR" + cleaned;
  }
  cleaned = cleaned.slice(0, 26);
  // Break into groups of 4 after IR
  const withoutIR = cleaned.slice(2);
  const parts = withoutIR.match(/.{1,4}/g);
  return "IR" + (parts ? " " + parts.join(" ") : "");
}

/**
 * Validate Iranian National Code (کد ملی)
 */
export function isValidIranianNationalCode(code: string): boolean {
  if (!code) return false;
  const cleanCode = code.trim();
  if (cleanCode.length !== 10 || !/^\d{10}$/.test(cleanCode)) return false;
  if (/^(\d)\1{9}$/.test(cleanCode)) return false;

  const check = parseInt(cleanCode[9], 10);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCode[i], 10) * (10 - i);
  }
  const rem = sum % 11;
  return (rem < 2 && check === rem) || (rem >= 2 && check === 11 - rem);
}

/**
 * Convert English digits to Persian digits
 */
export function toPersianDigits(n: string | number): string {
  if (n === null || n === undefined) return "";
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
}

/**
 * Convert Persian/Arabic digits to English digits
 */
export function toEnglishDigits(str: string): string {
  if (!str) return "";
  const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicNumbers = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  for (let i = 0; i < 10; i++) {
    str = str.replace(persianNumbers[i], i.toString()).replace(arabicNumbers[i], i.toString());
  }
  return str;
}

/**
 * Format currency amount with commas (ریال / تومان)
 */
export function formatCurrency(amount: number | string): string {
  if (amount === undefined || amount === null || amount === "") return "۰";
  const num = typeof amount === "number" ? amount : parseFloat(toEnglishDigits(amount.toString()));
  if (isNaN(num)) return "۰";
  return toPersianDigits(num.toLocaleString("en-US"));
}
