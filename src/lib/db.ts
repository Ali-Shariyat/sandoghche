import Dexie, { type Table } from "dexie";

export interface Person {
  id?: number;
  name: string;
  isMe?: boolean;
  relation?: string; // خودم, همسر, فرزند, پدر, مادر, دوست, همکار, مشتری و...
  nationalCode?: string;
  phoneNumber?: string;
  birthDate?: string;
  job?: string;
  address?: string;
  avatar?: string; // Base64
  notes?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface BankCard {
  id?: number;
  personId?: number; // foreign key to Person.id
  title: string; // e.g. "کارت حقوق", "کارت خریدهای روزمره"
  bankName: string;
  bankKey: string;
  cardNumber: string; // 16 digits
  shabaNumber?: string; // IR...
  accountNumber?: string;
  cvv2?: string;
  expireMonth?: string; // "01" - "12"
  expireYear?: string; // "04", "05" ...
  colorTheme?: string;
  category: "personal" | "business" | "savings" | "family" | "other";
  tags: string[];
  isFavorite?: boolean;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentItem {
  id?: number;
  personId?: number; // foreign key to Person.id
  title: string; // e.g. "کارت ملی (روی کارت)"
  category:
    | "national_card"
    | "birth_cert"
    | "driving_license"
    | "passport"
    | "contract"
    | "receipt"
    | "cheque_doc"
    | "other";
  fileData: string; // Base64 data string
  mimeType: string;
  fileSize: number; // in bytes
  tags: string[];
  notes?: string;
  createdAt: number;
}

export interface NoteItem {
  id?: number;
  title: string;
  content: string;
  category?: "personal" | "work" | "finance" | "important" | "ideas" | "other";
  tags: string[];
  isPinned?: boolean;
  color?: string;
  linkedPersonId?: number;
  linkedCardId?: number;
  createdAt: number;
  updatedAt: number;
}

export interface DebtItem {
  id?: number;
  personId: number; // foreign key to Person.id
  type: "creditor" | "debtor"; // creditor: من طلبکارم | debtor: من بدهکارم
  amount: number; // تومان
  description: string;
  dueDate?: string; // تاریخ شمسی
  isSettled: boolean;
  settledAt?: number;
  createdAt: number;
}

export interface ChequeItem {
  id?: number;
  type: "payable" | "receivable"; // چک پرداختی من | چک دریافتی از دیگران
  personId?: number;
  bankName: string;
  sayadNumber: string; // شناسه صیادی ۱۶ رقمی
  amount: number; // تومان
  dueDate: string; // تاریخ شمسی سررسید
  status: "pending" | "passed" | "bounced" | "returned"; // در جریان | پاس شده | برگشت خورده | عودت
  description?: string;
  image?: string; // عکس چک
  createdAt: number;
}

export interface SecretItem {
  id?: number;
  title: string;
  category: "website" | "app" | "pin" | "other";
  username?: string;
  secretValue: string;
  url?: string;
  note?: string;
  createdAt: number;
}

export interface AppSetting {
  key: string;
  value: any;
}

export class PersonalVaultDB extends Dexie {
  people!: Table<Person, number>;
  bankCards!: Table<BankCard, number>;
  documents!: Table<DocumentItem, number>;
  notes!: Table<NoteItem, number>;
  debts!: Table<DebtItem, number>;
  cheques!: Table<ChequeItem, number>;
  secrets!: Table<SecretItem, number>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super("PersonalVaultDB");
    this.version(1).stores({
      people: "++id, name, isMe, nationalCode, phoneNumber, relation, createdAt",
      bankCards: "++id, personId, title, bankKey, cardNumber, isFavorite, category, createdAt",
      documents: "++id, personId, title, category, createdAt",
      notes: "++id, title, category, isPinned, linkedPersonId, linkedCardId, createdAt",
      debts: "++id, personId, type, isSettled, dueDate, createdAt",
      cheques: "++id, type, personId, sayadNumber, status, dueDate, createdAt",
      secrets: "++id, title, category, createdAt",
      settings: "key",
    });
  }
}

export const db = new PersonalVaultDB();

/**
 * Initializes the default profile for "Me" if the database is empty
 */
export async function initializeDatabase(): Promise<void> {
  try {
    const peopleCount = await db.people.count();
    if (peopleCount === 0) {
      await db.people.add({
        name: "من (کاربر اصلی)",
        isMe: true,
        relation: "خودم",
        nationalCode: "",
        phoneNumber: "",
        job: "",
        notes: "پروفایل هویت و مدارک شخصی من",
        tags: ["من", "اصلی"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Set default settings if not exists
    const pinSetting = await db.settings.get("pin_lock");
    if (!pinSetting) {
      await db.settings.put({
        key: "pin_lock",
        value: { enabled: false, pin: "" },
      });
    }
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}

export interface ExportDataPayload {
  version: number;
  appName: string;
  exportDate: string;
  timestamp: number;
  data: {
    people: Person[];
    bankCards: BankCard[];
    documents: DocumentItem[];
    notes: NoteItem[];
    debts: DebtItem[];
    cheques: ChequeItem[];
    secrets: SecretItem[];
    settings: AppSetting[];
  };
}

/**
 * Exports all data and files to a JSON string for offline backup
 */
export async function exportAllData(): Promise<string> {
  const people = await db.people.toArray();
  const bankCards = await db.bankCards.toArray();
  const documents = await db.documents.toArray();
  const notes = await db.notes.toArray();
  const debts = await db.debts.toArray();
  const cheques = await db.cheques.toArray();
  const secrets = await db.secrets.toArray();
  const settings = await db.settings.toArray();

  const payload: ExportDataPayload = {
    version: 1,
    appName: "PersonalVault",
    exportDate: new Date().toISOString(),
    timestamp: Date.now(),
    data: {
      people,
      bankCards,
      documents,
      notes,
      debts,
      cheques,
      secrets,
      settings,
    },
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Imports backup JSON data into the database
 */
export async function importAllData(
  jsonString: string,
  mode: "overwrite" | "merge" = "overwrite"
): Promise<{ success: boolean; message: string; counts?: Record<string, number> }> {
  try {
    const payload = JSON.parse(jsonString) as ExportDataPayload;

    if (!payload.data || typeof payload.data !== "object") {
      return { success: false, message: "ساختار فایل پشتیبان نامعتبر است." };
    }

    const { people = [], bankCards = [], documents = [], notes = [], debts = [], cheques = [], secrets = [], settings = [] } =
      payload.data;

    await db.transaction("rw", [db.people, db.bankCards, db.documents, db.notes, db.debts, db.cheques, db.secrets, db.settings], async () => {
      if (mode === "overwrite") {
        await db.people.clear();
        await db.bankCards.clear();
        await db.documents.clear();
        await db.notes.clear();
        await db.debts.clear();
        await db.cheques.clear();
        await db.secrets.clear();
        await db.settings.clear();
      }

      if (people.length > 0) await db.people.bulkAdd(people);
      if (bankCards.length > 0) await db.bankCards.bulkAdd(bankCards);
      if (documents.length > 0) await db.documents.bulkAdd(documents);
      if (notes.length > 0) await db.notes.bulkAdd(notes);
      if (debts.length > 0) await db.debts.bulkAdd(debts);
      if (cheques.length > 0) await db.cheques.bulkAdd(cheques);
      if (secrets.length > 0) await db.secrets.bulkAdd(secrets);
      if (settings.length > 0) await db.settings.bulkPut(settings);
    });

    return {
      success: true,
      message: "اطلاعات با موفقیت بازیابی شد.",
      counts: {
        people: people.length,
        bankCards: bankCards.length,
        documents: documents.length,
        notes: notes.length,
        debts: debts.length,
        cheques: cheques.length,
        secrets: secrets.length,
      },
    };
  } catch (error: any) {
    console.error("Import error:", error);
    return {
      success: false,
      message: `خطا در بازخوانی فایل پشتیبان: ${error?.message || "خطای ناشناخته"}`,
    };
  }
}

/**
 * Reset all database tables
 */
export async function clearEntireDatabase(): Promise<void> {
  await db.transaction("rw", [db.people, db.bankCards, db.documents, db.notes, db.debts, db.cheques, db.secrets, db.settings], async () => {
    await db.people.clear();
    await db.bankCards.clear();
    await db.documents.clear();
    await db.notes.clear();
    await db.debts.clear();
    await db.cheques.clear();
    await db.secrets.clear();
    await db.settings.clear();
  });
  await initializeDatabase();
}
