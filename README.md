# NaderVPN Panel

پنل مدیریت VPN مبتنی بر Cloudflare Workers

## 📁 ساختار فایل‌ها

```
nadervpn/
├── index.html          # صفحه اصلی
├── noADMIN.html        # صفحه خطای عدم تنظیم ADMIN
├── worker.js           # Worker اصلی
├── wrangler.toml.example # تنظیمات Worker
├── README.md           # این فایل
└── admin/
    ├── index.html      # پنل مدیریت اصلی
    └── login.html      # صفحه ورود
```

## 🚀 نصب

### ۱. ساخت KV Namespace

1. وارد [Cloudflare Dashboard](https://dash.cloudflare.com/) شوید
2. به **Workers & Pages** → **KV** بروید
3. یک **Create namespace** بسازید
4. یک **نام** بذارید (مثلاً `NaderVPN_Config`)
5. **ID** رو کپی کنید

### ۲. آپلود فایل‌ها به Cloudflare Pages

1. به **Workers & Pages** بروید
2. **Create application** → **Pages** → **Upload assets**
3. فولدر `nadervpn` رو آپلود کنید
4. آدرس Pages رو کپی کنید (مثلاً `https://nadervpn.pages.dev`)

### ۳. ساخت Worker

```bash
# نصب Wrangler
npm install -g wrangler

# ورود به حساب
wrangler login

# کپی فایل تنظیمات
cp wrangler.toml.example wrangler.toml

# ویرایش wrangler.toml
# - KV_NAMESPACE_ID رو با ID از مرحله 1 تنظیم کنید
# - ADMIN و KEY رو تنظیم کنید
# - PAGES_STATIC رو با آدرس Pages از مرحله 2 تنظیم کنید

# دیپلوی
wrangler deploy
```

### ۴. متغیرهای محیطی

| متغیر | توضیحات | الزامی |
|-------|---------|--------|
| `ADMIN` | رمز عبور پنل مدیریت | ✅ |
| `KEY` | کلید رمزگذاری | ✅ |
| `HOST` | دامنه Worker | ✅ |
| `UUID` | شناسه کاربر (اختیاری) | ❌ |
| `PROXYIP` | آی‌پی پروکسی (اختیاری) | ❌ |
| `PAGES_STATIC` | آدرس Pages | ✅ |
| `DEBUG` | فعال‌سازی دیباگ (`true`) | ❌ |
| `BEST_SUB` | اشتراک بهینه (`true`) | ❌ |

### ۵. متغیر KV

در `wrangler.toml` تنظیم کنید:

```toml
[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID"
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