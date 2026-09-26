# ============================================================
# auto-git.ps1 — Smart Auto-Commit untuk Aplikasi_Dosen
# Dijalankan oleh Windows Task Scheduler setiap 30 menit
# 100% lokal, tidak memerlukan AI atau VPS
# ============================================================

$ProjectRoot = "c:\xampp\htdocs\Aplikasi_Dosen"
$LogFile     = "$ProjectRoot\.git\auto-git.log"

function Write-Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts | $msg" | Add-Content -Path $LogFile -Encoding UTF8
}

Set-Location $ProjectRoot

# --- Cek apakah ada perubahan ---
$statusOutput = git status --porcelain 2>&1
if (-not $statusOutput) {
    Write-Log "Tidak ada perubahan. Skip."
    exit 0
}

# --- Kategorikan file yang berubah ---
$changed = git diff --name-only HEAD 2>$null
$untracked = git ls-files --others --exclude-standard 2>$null
$allFiles = ($changed + $untracked) | Where-Object { $_ -ne "" }

$categories = @()

# Deteksi kategori berdasarkan path
if ($allFiles | Where-Object { $_ -match "^rps-form-app/apps/api/src/" }) {
    $categories += "api"
}
if ($allFiles | Where-Object { $_ -match "^rps-form-app/apps/web/src/" }) {
    $categories += "frontend"
}
if ($allFiles | Where-Object { $_ -match "^rps-form-app/prisma/" }) {
    $categories += "db/schema"
}
if ($allFiles | Where-Object { $_ -match "^tests/" }) {
    $categories += "tests"
}
if ($allFiles | Where-Object { $_ -match "\.(md|txt)$" }) {
    $categories += "docs"
}
if ($allFiles | Where-Object { $_ -match "^\.agents/" }) {
    $categories += "agents"
}
if ($allFiles | Where-Object { $_ -match "(\.env|config|\.json|\.yaml|\.yml)$" -and $_ -notmatch "node_modules" }) {
    $categories += "config"
}
if ($allFiles | Where-Object { $_ -match "^(deploy|kampus|fix_server)" }) {
    $categories += "deploy"
}
if ($categories.Count -eq 0) {
    $categories += "misc"
}

# --- Bangun commit message otomatis ---
$scope    = ($categories | Select-Object -Unique) -join ", "
$fileCount = ($allFiles | Measure-Object).Count
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"

$commitMsg = "auto: save [$scope] — $fileCount file(s) changed ($timestamp)"

# --- Stage semua perubahan yang relevan ---
git add .

# --- Commit ---
$commitResult = git commit -m $commitMsg 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Log "COMMIT OK: $commitMsg"
    Write-Host "[auto-git] ✅ $commitMsg"
} else {
    Write-Log "COMMIT FAILED: $commitResult"
    Write-Host "[auto-git] ❌ Gagal commit: $commitResult"
    exit 1
}

exit 0
