# ============================================================
# git-save.ps1 — Manual Quick Save & Push ke GitHub
# Jalankan: .\git-save.ps1
# Atau dengan pesan custom: .\git-save.ps1 "pesan commit"
# ============================================================

param(
    [string]$Message = ""
)

$ProjectRoot = "c:\xampp\htdocs\Aplikasi_Dosen"
Set-Location $ProjectRoot

# Cek ada perubahan atau tidak
$status = git status --porcelain 2>&1
if (-not $status) {
    Write-Host "[git-save] Tidak ada perubahan. Sudah up-to-date." -ForegroundColor Yellow
    exit 0
}

# Buat pesan commit
if ($Message -eq "") {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $Message = "save: manual checkpoint ($timestamp)"
}

# Stage semua
git add .

# Commit
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    Write-Host "[git-save] ❌ Commit gagal." -ForegroundColor Red
    exit 1
}

# Push ke GitHub
Write-Host "[git-save] Pushing ke GitHub..." -ForegroundColor Cyan
git push origin master
if ($LASTEXITCODE -eq 0) {
    Write-Host "[git-save] ✅ Tersimpan dan ter-push ke GitHub!" -ForegroundColor Green
} else {
    Write-Host "[git-save] ⚠️  Commit OK tapi push gagal. Cek koneksi internet." -ForegroundColor Yellow
}
