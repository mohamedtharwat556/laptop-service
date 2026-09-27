# دليل النسخ الاحتياطي - YAS Laptop Service

## 📋 نظرة عامة

هذا الدليل يشرح كيفية عمل نسخة احتياطية من البرنامج والبيانات لضمان عدم فقدان أي معلومات.

## 🗄️ النسخ الاحتياطي لقاعدة البيانات (Supabase)

### الطريقة 1: تصدير البيانات من Supabase Dashboard

1. **سجل الدخول إلى Supabase Dashboard**
   - اذهب إلى: https://supabase.com/dashboard
   - سجل الدخول بحسابك

2. **اختر المشروع**
   - اختر مشروع laptop-service

3. **تصدير البيانات**
   - اذهب إلى قسم "Database"
   - اضغط على "Export"
   - اختر "CSV" أو "SQL"
   - اضغط "Download"

4. **حفظ الملف**
   - احفظ الملف في مجلد `backups/`
   - سمِّ الملف باسم التاريخ: `backup_YYYY-MM-DD.sql`

### الطريقة 2: استخدام pg_dump (متقدم)

```bash
# تثبيت pg_dump إذا لم يكن مثبتاً
# Windows: قم بتثبيت PostgreSQL

# تصدير قاعدة البيانات
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup_YYYY-MM-DD.sql

# استعادة قاعدة البيانات
psql -h db.xxx.supabase.co -U postgres -d postgres < backup_YYYY-MM-DD.sql
```

## 💾 النسخ الاحتياطي للكود (GitHub)

الكود محفوظ بالفعل على GitHub، لكن يمكنك عمل نسخة احتياطية محلية:

### إنشاء نسخة احتياطية محلية

```bash
# الانتقال إلى مجلد المشروع
cd C:\Users\yas\Downloads\laptop-service-main

# إنشاء نسخة احتياطية
git clone https://github.com/mohamedtharwat556/laptop-service.git laptop-service-backup-YYYY-MM-DD
```

### استخدام Git Tags للنسخ الاحتياطية

```bash
# إنشاء tag للنسخة الحالية
git tag backup-YYYY-MM-DD

# رفع الـ tag إلى GitHub
git push origin backup-YYYY-MM-DD

# عرض جميع الـ tags
git tag
```

## 🔄 جدول النسخ الاحتياطي

### النسخ الاحتياطي اليومي (تلقائي)
- البيانات: Supabase (نسخ احتياطي تلقائي - ممكن في الإصدار المدفوع)
- الكود: GitHub (محفوظ تلقائياً)

### النسخ الاحتياطي الأسبوعي (يدوي)
- البيانات: تصدير من Supabase Dashboard
- الكود: إنشاء Git tag أسبوعي

### النسخ الاحتياطي الشهري (يدوي)
- البيانات: تصدير شامل من Supabase
- الكود: إنشاء Git tag شهري + نسخة محلية

## 📁 هيكل المجلدات المقترح

```
laptop-service-main/
├── backups/
│   ├── database/
│   │   ├── backup_2026-09-27.sql
│   │   ├── backup_2026-10-01.sql
│   │   └── ...
│   └── code/
│       ├── laptop-service-backup-2026-09-27/
│       └── ...
├── .env (ملف البيئة - لا ترفعه للـ GitHub)
└── ...
```

## 🔑 النسخ الاحتياطي لملف .env

**هام جداً:** ملف `.env` يحتوي على معلومات حساسة ولا يجب رفعه للـ GitHub.

### إنشاء نسخة احتياطية لـ .env

```bash
# نسخ ملف .env
cp .env .env.backup_YYYY-MM-DD

# تخزين النسخة الاحتياطية في مكان آمن
```

### استعادة .env

```bash
# استعادة النسخة الاحتياطية
cp .env.backup_YYYY-MM-DD .env
```

## 🛠️ إنشاء سكريبت للنسخ الاحتياطي التلقائي

### سكريبت PowerShell للويندوز

```powershell
# backup.ps1
$Date = Get-Date -Format "yyyy-MM-dd"
$BackupDir = "C:\Users\yas\backups\laptop-service"

# إنشاء مجلد النسخ الاحتياطي
New-Item -ItemType Directory -Force -Path $BackupDir\$Date

# نسخ ملف .env
Copy-Item .env $BackupDir\$Date\.env

# نسخ مجلد المشروع
Copy-Item . $BackupDir\$Date\code -Recurse

Write-Host "تم إنشاء النسخ الاحتياطية بنجاح: $BackupDir\$Date"
```

### تشغيل السكريبت

```powershell
# في PowerShell
.\backup.ps1
```

## 📤 استعادة البيانات

### استعادة قاعدة البيانات من Supabase

1. **سجل الدخول إلى Supabase Dashboard**
2. **اذهب إلى قسم "Database"**
3. **اضغط على "Import"**
4. **اختر ملف النسخ الاحتياطية**
5. **اضغط "Import"**

### استعادة الكود من GitHub

```bash
# استنساخ النسخة الاحتياطية
git clone https://github.com/mohamedtharwat556/laptop-service.git

# أو استخدام tag معين
git checkout backup-YYYY-MM-DD
```

## ⚠️ نصائح مهمة

1. **احتفظ بـ 3 نسخ احتياطية:**
   - نسخة محلية (على جهازك)
   - نسخة على GitHub
   - نسخة على خدمة سحابية (Google Drive, Dropbox)

2. **اختبر النسخ الاحتياطية:**
   - تأكد من إمكانية استعادة البيانات
   - اختبر العملية مرة كل شهر

3. **شفر النسخ الاحتياطية الحساسة:**
   - استخدم تشفير للملفات الحساسة
   - احتفظ بمفاتيح التشفير في مكان آمن

4. **توثيق العملية:**
   - احتفظ بسجل لجميع النسخ الاحتياطية
   دوّن تاريخ كل نسخة احتياطية

## 🚀 أتمتة النسخ الاحتياطي (متقدم)

### استخدام GitHub Actions للنسخ الاحتياطي التلقائي

يمكنك إنشاء workflow في GitHub Actions لعمل نسخ احتياطي تلقائي للكود والبيانات.

### استخدام Vercel للنسخ الاحتياطي

Vercel يحتفظ تلقائياً بنسخ من التطبيق المنشور.

## 📞 الدعم

إذا واجهت أي مشكلة في النسخ الاحتياطي أو الاستعادة:
- راجع وثائق Supabase: https://supabase.com/docs
- راجع وثائق GitHub: https://docs.github.com
- تواصل مع فريق الدعم

---

**آخر تحديث:** 2026-09-27
