# ============================================================
# setup-scheduler.ps1 — Daftarkan auto-git.ps1 ke Windows
#                        Task Scheduler (jalankan 1x saja)
# Jalankan sebagai Administrator: .\setup-scheduler.ps1
# ============================================================

$TaskName    = "AutoGit-AplikasiDosen"
$ScriptPath  = "c:\xampp\htdocs\Aplikasi_Dosen\auto-git.ps1"
$Description = "Auto-commit perubahan kode Aplikasi Dosen ke git setiap 30 menit"

# Hapus task lama jika ada
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

# Definisikan aksi: jalankan PowerShell dengan script
$Action  = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NonInteractive -NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""

# Trigger: setiap 30 menit, mulai sekarang, selamanya
$Trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 30) -Once -At (Get-Date)

# Setting: jalankan meski user tidak login, prioritas normal
$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5) `
    -RestartCount 1 `
    -RestartInterval (New-TimeSpan -Minutes 2) `
    -StartWhenAvailable

# Daftarkan task
Register-ScheduledTask `
    -TaskName    $TaskName `
    -Action      $Action `
    -Trigger     $Trigger `
    -Settings    $Settings `
    -Description $Description `
    -RunLevel    Limited `
    -Force

Write-Host ""
Write-Host "✅ Task Scheduler berhasil didaftarkan!" -ForegroundColor Green
Write-Host "   Nama task : $TaskName" -ForegroundColor Cyan
Write-Host "   Script    : $ScriptPath" -ForegroundColor Cyan
Write-Host "   Interval  : Setiap 30 menit" -ForegroundColor Cyan
Write-Host ""
Write-Host "Untuk cek/matikan: buka 'Task Scheduler' di Windows" -ForegroundColor Gray
Write-Host "Atau jalankan   : Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false" -ForegroundColor Gray
