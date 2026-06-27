# NaderVPN Panel

پنل مدیریت VPN مبتنی بر Cloudflare Workers

## 📁 ساختار فایل‌ها

```
nadervpn/
├── index.html          # صفحه اصلی
├── noADMIN.html        # صفحه خطای عدم تنظیم ADMIN
├── README.md           # این فایل
└── admin/
    ├── index.html      # پنل مدیریت اصلی
    └── login.html      # صفحه ورود
```

## 🚀 نصب

### ۱. آپلود فایل‌ها به Cloudflare Pages

1. وارد پنل [Cloudflare Dashboard](https://dash.cloudflare.com/) شوید
2. به بخش **Workers & Pages** بروید
3. یک **New application** ایجاد کنید
4. **Pages** را انتخاب کرده و پروژه جدید بسازید
5. فولدر `nadervpn` را آپلود کنید

### ۲. تنظیم متغیرهای محیطی

در Worker خود این متغیرها را تنظیم کنید:

| متغیر | توضیحات |
|-------|---------|
| `ADMIN` | رمز عبور پنل مدیریت |
| `KEY` | کلید رمزگذاری |
| `UUID` | شناسه کاربر (اختیاری) |
| `HOST` | دامنه Worker |
| `PROXYIP` | آی‌پی پروکسی (اختیاری) |

### ۳. تنظیم متغیر Pages

در تنظیمات Pages، متغیر محیطی `PAGES_STATIC` را تنظیم کنید:

```
PAGES_STATIC = https://your-pages-project.pages.dev
```

## 📱 امکانات

- ✅ طراحی ریسپانسیو و مدرن
- ✅ پشتیبانی از زبان فارسی (RTL)
- ✅ مدیریت نودها
- ✅ مدیریت اشتراک (Clash, Sing-box, Surge)
- ✅ تنظیمات Cloudflare
- ✅ ادغام با ربات تلگرام
- ✅ نمایش لاگ‌ها

## 🎨 شخصی‌سازی

برای تغییر نام برند، عبارت `NaderVPN` را در فایل‌های HTML جستجو و جایگزین کنید.

## 📄 لایسنس

این پروژه رایگان و متن‌باز است.