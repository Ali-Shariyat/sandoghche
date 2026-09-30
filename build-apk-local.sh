#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 شروع بیلد اپلیکیشن حساب‌یار و گاوصندوق من (نسخه اندروید)"
echo "=========================================================="

echo "۱. بیلد نسخه استاتیک Next.js..."
npm run build

echo "۲. همگام‌سازی دارایی‌ها با پروژه بومی اندروید (Capacitor Sync)..."
npx cap sync android

echo "۳. بررسی ابزارهای بیلد اندروید..."
if command -v java >/dev/null 2>&1; then
    echo "جاوا یافت شد. در حال اجرای Gradle..."
    cd android
    chmod +x gradlew
    ./gradlew assembleDebug
    echo "=========================================================="
    echo "✅ فایل APK با موفقیت ساخته شد:"
    echo "android/app/build/outputs/apk/debug/app-debug.apk"
    echo "=========================================================="
else
    echo "⚠️ ابزار Java یا Android SDK روی سیستم محلی نصب نیست."
    echo "برای بیلد فایل APK می‌توانید یکی از روش‌های زیر را انتخاب کنید:"
    echo "الف) پروژه را در Android Studio باز کنید: npx cap open android"
    echo "ب) کد را روی GitHub قرار دهید تا فایل .github/workflows/build-apk.yml به طور خودکار APK آماده را برای شما بسازد."
fi
