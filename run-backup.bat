@echo off
echo ====================================
echo YAS Laptop Service - Backup Script
echo ====================================
echo.
echo جاري تشغيل سكريبت النسخ الاحتياطي...
echo.

powershell -ExecutionPolicy Bypass -File backup.ps1

echo.
echo ====================================
echo اضغط أي مفتاح للخروج...
pause > nul
