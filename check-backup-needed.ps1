# Check if backup is needed (every 5 commits)
# سكريبت للتحقق مما إذا كان النسخ الاحتياطي مطلوباً

# الحصول على عدد الـ commits الحالية
$CommitCount = git rev-list --count HEAD

# حساب الباقي للوصول إلى رقم مضاعف لـ 5
$Remainder = $CommitCount % 5

if ($Remainder -eq 0) {
    Write-Host "✅ Backup needed! Current commit: $CommitCount" -ForegroundColor Green
    Write-Host "Running backup script..." -ForegroundColor Yellow
    
    # تشغيل سكريبت النسخ الاحتياطي
    & .\backup.ps1
} else {
    $NextBackup = (([math]::Floor($CommitCount / 5) + 1) * 5)
    Write-Host "ℹ️  No backup needed. Current commit: $CommitCount" -ForegroundColor Cyan
    Write-Host "📅 Next backup at commit: $NextBackup" -ForegroundColor Yellow
    Write-Host "   (Current: $CommitCount, Need: $NextBackup - $CommitCount = $($NextBackup - $CommitCount) more commits)" -ForegroundColor Gray
}
