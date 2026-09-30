import moment from "jalali-moment";
import { toPersianDigits } from "./banks";

/**
 * Returns current Jalali date formatted as YYYY/MM/DD with Persian digits
 */
export function getTodayJalali(): string {
  const m = moment();
  m.locale("fa");
  return toPersianDigits(m.format("YYYY/MM/DD"));
}

/**
 * Returns current Jalali year (e.g. 1403 or 1405)
 */
export function getCurrentJalaliYear(): number {
  return parseInt(moment().locale("fa").format("YYYY"), 10);
}

/**
 * Formats a timestamp or Date object to Jalali date string
 */
export function formatToJalali(timestamp?: number | Date | string): string {
  if (!timestamp) return "";
  try {
    const m = moment(timestamp);
    m.locale("fa");
    return toPersianDigits(m.format("YYYY/MM/DD"));
  } catch {
    return "";
  }
}

/**
 * Formats a timestamp with day of the week and month name
 * e.g.: چهارشنبه، ۹ مهر ۱۴۰۳
 */
export function formatJalaliFull(timestamp?: number | Date | string): string {
  if (!timestamp) return "";
  try {
    const m = moment(timestamp);
    m.locale("fa");
    return toPersianDigits(m.format("dddd، D MMMM YYYY"));
  } catch {
    return "";
  }
}

/**
 * Formats a timestamp with time
 * e.g.: ۱۴:۳۰ - ۱۴۰۳/۰۷/۰۹
 */
export function formatJalaliWithTime(timestamp?: number | Date | string): string {
  if (!timestamp) return "";
  try {
    const m = moment(timestamp);
    m.locale("fa");
    return toPersianDigits(m.format("HH:mm - YYYY/MM/DD"));
  } catch {
    return "";
  }
}
