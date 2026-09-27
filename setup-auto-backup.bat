@echo off
REM Setup Script for Automatic Backup Every 5 Commits
REM سكريبت إعداد النسخ الاحتياطي التلقائي بعد كل 5 تعديلات

echo ====================================
echo Setup Automatic Backup System
echo ====================================
echo.
echo This will configure Git to automatically create a backup
echo after every 5 commits (edits).
echo.

REM Check if .git/hooks directory exists
if not exist ".git\hooks" (
    echo Creating .git\hooks directory...
    mkdir .git\hooks
)

REM Copy the hook file
echo Configuring Git hook...
copy ".git\hooks\post-commit.bat" ".git\hooks\post-commit.bat" /Y > nul

REM Make the hook executable
attrib +x .git\hooks\post-commit.bat

echo.
echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo How it works:
echo - After every 5 commits, a backup will be created automatically
echo - Backups will be saved in: C:\Users\yas\backups\laptop-service\
echo - Each backup includes: code, .env file, and log
echo.
echo To disable this feature:
echo   Delete .git\hooks\post-commit.bat
echo.
echo ====================================
echo Press any key to exit...
pause > nul
