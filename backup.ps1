# سكريبت النسخ الاحتياطي التلقائي - YAS Laptop Service
# PowerShell Script for Windows

# الحصول على المسار الحالي (مشروع)
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptPath

# الحصول على التاريخ الحالي
$Date = Get-Date -Format "yyyy-MM-dd"
$Time = Get-Date -Format "HH-mm-ss"

# إعداد مجلد النسخ الاحتياطي
$BackupDir = "C:\Users\yas\backups\laptop-service"
$BackupPath = "$BackupDir\$Date-$Time"

# إنشاء مجلد النسخ الاحتياطي
Write-Host "📁 إنشاء مجلد النسخ الاحتياطي: $BackupPath" -ForegroundColor Green
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

# نسخ ملف .env
if (Test-Path ".env") {
    Write-Host "🔑 نسخ ملف .env..." -ForegroundColor Yellow
    Copy-Item ".env" "$BackupPath\.env"
    Write-Host "✅ تم نسخ ملف .env" -ForegroundColor Green
} else {
    Write-Host "⚠️  ملف .env غير موجود" -ForegroundColor Red
}

# نسخ مجلد المشروع
Write-Host "💾 نسخ مجلد المشروع..." -ForegroundColor Yellow
Copy-Item "." "$BackupPath\code" -Recurse -Exclude "node_modules", ".git", "backups"
Write-Host "✅ تم نسخ مجلد المشروع" -ForegroundColor Green

# إنشاء ملف سجل
$LogFile = "$BackupPath\backup-log.txt"
$LogContent = @"
نسخة احتياطية - YAS Laptop Service
=====================================
التاريخ: $Date
الوقت: $Time
المسار: $BackupPath

الملفات المنسوخة:
- .env
- مجلد المشروع (ما عدا node_modules, .git, backups)

الحالة: تم بنجاح
"@

Set-Content -Path $LogFile -Value $LogContent
Write-Host "📝 تم إنشاء ملف السجل: $LogFile" -ForegroundColor Green

# عرض ملخص
Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "🎉 تم إنشاء النسخ الاحتياطية بنجاح!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "📍 المسار: $BackupPath" -ForegroundColor Yellow
Write-Host "📝 السجل: $LogFile" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 نصيحة: احتفظ بنسخة إضافية على Google Drive أو Dropbox" -ForegroundColor Cyan
Write-Host ""

# فتح مجلد النسخ الاحتياطي
Start-Process $BackupPath
