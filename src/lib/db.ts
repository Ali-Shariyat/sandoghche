import Dexie, { type Table } from "dexie";

export interface CustomField {
  id: string;
  label: string; // e.g. "دور کمر", "تلفن دوم", "تاریخ میلادی", "آدرس انبار", "ایمیل"
  value: string; // e.g. "۸۵ سانتی‌متر", "۰۹۱۲۳۴۵۶۷۸۹", "1995/04/12"
}

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
  customFields?: CustomField[];
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
  balance?: number; // موجودی کارت به تومان
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CardTransaction {
  id?: number;
  cardId: number; // شناسه کارت متصل
  type: "expense" | "income"; // expense: برداشت / خرج | income: واریز / شارژ
  amount: number; // تومان
  title: string; // بابت چه چیزی؟ مثلاً خرید بستنی، بنزین، حقوق
  category?: "food" | "shopping" | "transport" | "bills" | "health" | "salary" | "other";
  date: number; // زمان ثبت
  note?: string;
  personId?: number; // شناسه شخص متصل (اختیاری)
  targetCardId?: number; // شناسه کارت مقصد در صورت انتقال بین کارت‌ها
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
  linkedCardId?: number; // شناسه کارت بانکی متصل جهت واریز/کسر خودکار
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
  cardTransactions!: Table<CardTransaction, number>;
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
    this.version(2).stores({
      cardTransactions: "++id, cardId, type, date, category",
    });
  }
}

export const db = new PersonalVaultDB();

/**
 * Adds a transaction to a card and automatically updates the card balance
 */
export async function addCardTransaction(
  cardId: number,
  type: "expense" | "income",
  amount: number,
  title: string,
  category?: CardTransaction["category"],
  note?: string,
  date: number = Date.now(),
  personId?: number,
  targetCardId?: number
): Promise<number> {
  return await db.transaction("rw", [db.bankCards, db.cardTransactions], async () => {
    const card = await db.bankCards.get(cardId);
    if (!card) throw new Error("Card not found");

    const currentBalance = card.balance || 0;
    const newBalance = type === "expense" ? currentBalance - amount : currentBalance + amount;

    await db.bankCards.update(cardId, {
      balance: newBalance,
      updatedAt: Date.now(),
    });

    const txId = await db.cardTransactions.add({
      cardId,
      type,
      amount,
      title: title.trim(),
      category: category || "other",
      date,
      note: note?.trim(),
      personId,
      targetCardId,
    });

    return txId;
  });
}

/**
 * Transfers money between two user cards atomically
 */
export async function transferBetweenCards(
  fromCardId: number,
  toCardId: number,
  amount: number,
  title: string = "انتقال بین کارت‌ها",
  note?: string,
  date: number = Date.now()
): Promise<{ expenseTxId: number; incomeTxId: number }> {
  return await db.transaction("rw", [db.bankCards, db.cardTransactions], async () => {
    const fromCard = await db.bankCards.get(fromCardId);
    const toCard = await db.bankCards.get(toCardId);
    if (!fromCard || !toCard) throw new Error("کارت مبدا یا مقصد یافت نشد");

    // Deduct from source card
    const fromBal = fromCard.balance || 0;
    await db.bankCards.update(fromCardId, {
      balance: fromBal - amount,
      updatedAt: Date.now(),
    });

    // Add to target card
    const toBal = toCard.balance || 0;
    await db.bankCards.update(toCardId, {
      balance: toBal + amount,
      updatedAt: Date.now(),
    });

    const fromTitle = title ? `${title} (به کارت ${toCard.bankName})` : `انتقال به کارت ${toCard.bankName}`;
    const toTitle = title ? `${title} (از کارت ${fromCard.bankName})` : `شارژ از کارت ${fromCard.bankName}`;

    const expenseTxId = await db.cardTransactions.add({
      cardId: fromCardId,
      type: "expense",
      amount,
      title: fromTitle,
      category: "other",
      date,
      note,
      targetCardId: toCardId,
    });

    const incomeTxId = await db.cardTransactions.add({
      cardId: toCardId,
      type: "income",
      amount,
      title: toTitle,
      category: "other",
      date,
      note,
      targetCardId: fromCardId,
    });

    return { expenseTxId, incomeTxId };
  });
}

/**
 * Settles a debt and records corresponding deposit/withdrawal to a bank card
 */
export async function settleDebtWithCard(
  debtId: number,
  cardId: number,
  settleAmount?: number,
  note?: string
): Promise<void> {
  return await db.transaction("rw", [db.debts, db.bankCards, db.cardTransactions, db.people], async () => {
    const debt = await db.debts.get(debtId);
    if (!debt) throw new Error("طلب یا بدهی یافت نشد");

    const amount = settleAmount && settleAmount > 0 ? settleAmount : debt.amount;
    const person = await db.people.get(debt.personId);
    const personName = person ? person.name : "طرف حساب";

    // creditor: I lent money, now receiving it back -> Income to my card
    // debtor: I borrowed money, now paying it back -> Expense from my card
    const txType: "income" | "expense" = debt.type === "creditor" ? "income" : "expense";
    const txTitle = debt.type === "creditor"
      ? `تسویه طلب از ${personName}`
      : `پرداخت بدهی به ${personName}`;

    await addCardTransaction(
      cardId,
      txType,
      amount,
      txTitle,
      "other",
      note || debt.description,
      Date.now(),
      debt.personId
    );

    if (!settleAmount || settleAmount >= debt.amount) {
      await db.debts.update(debtId, {
        isSettled: true,
        settledAt: Date.now(),
        linkedCardId: cardId,
      });
    } else {
      await db.debts.update(debtId, {
        amount: debt.amount - settleAmount,
        linkedCardId: cardId,
      });
    }
  });
}

/**
 * Deletes a card transaction and reverts its impact on the card balance
 */
export async function deleteCardTransaction(txId: number): Promise<void> {
  await db.transaction("rw", [db.bankCards, db.cardTransactions], async () => {
    const tx = await db.cardTransactions.get(txId);
    if (!tx) return;

    const card = await db.bankCards.get(tx.cardId);
    if (card) {
      const currentBalance = card.balance || 0;
      const revertedBalance = tx.type === "expense" ? currentBalance + tx.amount : currentBalance - tx.amount;
      await db.bankCards.update(tx.cardId, {
        balance: revertedBalance,
        updatedAt: Date.now(),
      });
    }

    await db.cardTransactions.delete(txId);
  });
}

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
    cardTransactions?: CardTransaction[];
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
  const cardTransactions = await db.cardTransactions.toArray();
  const documents = await db.documents.toArray();
  const notes = await db.notes.toArray();
  const debts = await db.debts.toArray();
  const cheques = await db.cheques.toArray();
  const secrets = await db.secrets.toArray();
  const settings = await db.settings.toArray();

  const payload: ExportDataPayload = {
    version: 2,
    appName: "PersonalVault",
    exportDate: new Date().toISOString(),
    timestamp: Date.now(),
    data: {
      people,
      bankCards,
      cardTransactions,
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

    const {
      people = [],
      bankCards = [],
      cardTransactions = [],
      documents = [],
      notes = [],
      debts = [],
      cheques = [],
      secrets = [],
      settings = [],
    } = payload.data;

    await db.transaction(
      "rw",
      [
        db.people,
        db.bankCards,
        db.cardTransactions,
        db.documents,
        db.notes,
        db.debts,
        db.cheques,
        db.secrets,
        db.settings,
      ],
      async () => {
        if (mode === "overwrite") {
          await db.people.clear();
          await db.bankCards.clear();
          await db.cardTransactions.clear();
          await db.documents.clear();
          await db.notes.clear();
          await db.debts.clear();
          await db.cheques.clear();
          await db.secrets.clear();
          await db.settings.clear();
        }

        if (people.length > 0) await db.people.bulkAdd(people);
        if (bankCards.length > 0) await db.bankCards.bulkAdd(bankCards);
        if (cardTransactions.length > 0) await db.cardTransactions.bulkAdd(cardTransactions);
        if (documents.length > 0) await db.documents.bulkAdd(documents);
        if (notes.length > 0) await db.notes.bulkAdd(notes);
        if (debts.length > 0) await db.debts.bulkAdd(debts);
        if (cheques.length > 0) await db.cheques.bulkAdd(cheques);
        if (secrets.length > 0) await db.secrets.bulkAdd(secrets);
        if (settings.length > 0) await db.settings.bulkPut(settings);
      }
    );

    return {
      success: true,
      message: "اطلاعات با موفقیت بازیابی شد.",
      counts: {
        people: people.length,
        bankCards: bankCards.length,
        cardTransactions: cardTransactions.length,
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
  await db.transaction(
    "rw",
    [
      db.people,
      db.bankCards,
      db.cardTransactions,
      db.documents,
      db.notes,
      db.debts,
      db.cheques,
      db.secrets,
      db.settings,
    ],
    async () => {
      await db.people.clear();
      await db.bankCards.clear();
      await db.cardTransactions.clear();
      await db.documents.clear();
      await db.notes.clear();
      await db.debts.clear();
      await db.cheques.clear();
      await db.secrets.clear();
      await db.settings.clear();
    }
  );
  await initializeDatabase();
}
