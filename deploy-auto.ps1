<#
.SYNOPSIS
    deploy-auto.ps1 — 100% Unattended Automated Deployment for Dunia_Kampus
.DESCRIPTION
    Uses Windows native npm for building (avoiding WSL Rollup binary mismatch),
    packages web_build.zip locally, and delegates remote SSH/SCP execution to WSL
    where user's SSH keys are already configured passwordless for root@38.103.170.236.
#>

param(
    [string]$TargetHost = "38.103.170.236",
    [string]$User = "root",
    [int]$Port = 22,
    [string]$Domain = "kampus.rumahku.web.id",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$RpsAppDir = Join-Path $ProjectRoot "rps-form-app"
$ZipFileName = "web_build.zip"
$ZipFilePath = Join-Path $ProjectRoot $ZipFileName
$RemoteBaseDir = "/var/www/kampus-dosen"
$ReleaseTimestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$RemoteReleaseDir = "$RemoteBaseDir/releases/$ReleaseTimestamp"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   DUNIA_KAMPUS FULLY AUTOMATED UNATTENDED DEPLOYMENT   " -ForegroundColor Cyan
Write-Host "   Target VPS  : $User@${TargetHost}:$Port" -ForegroundColor Cyan
Write-Host "   Domain      : $Domain" -ForegroundColor Cyan
Write-Host "   Isolated Dir: $RemoteBaseDir" -ForegroundColor Cyan
Write-Host "   SSH Auth    : WSL Keyring (Zero Password Required)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# STEP 1: PRODUCTION BUILD (Native Windows Node/npm)
if (-not $SkipBuild) {
    Write-Host "`n[1/5] Building production artifacts (Windows native)..." -ForegroundColor Yellow
    
    Write-Host " -> Building apps/api TypeScript..."
    npm --prefix (Join-Path $RpsAppDir "apps/api") run build
    if ($LASTEXITCODE -ne 0) { throw "API build failed!" }

    Write-Host " -> Building apps/web Vite bundle..."
    npm --prefix (Join-Path $RpsAppDir "apps/web") run build
    if ($LASTEXITCODE -ne 0) { throw "Web build failed!" }
} else {
    Write-Host "`n[1/5] Skipping build step (-SkipBuild specified)..." -ForegroundColor Gray
}

# STEP 2: PACKAGING PRODUCTION ARTIFACT (STRICT SOP: NO node_modules, NO .env)
Write-Host "`n[2/5] Packaging deployment artifact ($ZipFileName)..." -ForegroundColor Yellow

$StagingDir = Join-Path $ProjectRoot ".deploy_staging_auto"
if (Test-Path $StagingDir) { Remove-Item -Recurse -Force $StagingDir }
New-Item -ItemType Directory -Path $StagingDir | Out-Null

$StagingWebDist = Join-Path $StagingDir "apps/web/dist"
New-Item -ItemType Directory -Path $StagingWebDist -Force | Out-Null
Copy-Item -Path (Join-Path $RpsAppDir "apps/web/dist/*") -Destination $StagingWebDist -Recurse -Force

$StagingApiDist = Join-Path $StagingDir "apps/api/dist"
New-Item -ItemType Directory -Path $StagingApiDist -Force | Out-Null
Copy-Item -Path (Join-Path $RpsAppDir "apps/api/dist/*") -Destination $StagingApiDist -Recurse -Force
Copy-Item -Path (Join-Path $RpsAppDir "apps/api/package.json") -Destination (Join-Path $StagingDir "apps/api/package.json") -Force

Copy-Item -Path (Join-Path $RpsAppDir "package.json") -Destination (Join-Path $StagingDir "package.json") -Force
$StagingPrisma = Join-Path $StagingDir "prisma"
New-Item -ItemType Directory -Path $StagingPrisma -Force | Out-Null
Copy-Item -Path (Join-Path $RpsAppDir "prisma/schema.prisma") -Destination (Join-Path $StagingPrisma "schema.prisma") -Force

$StagingTemplates = Join-Path $StagingDir "templates"
New-Item -ItemType Directory -Path $StagingTemplates -Force | Out-Null
Copy-Item -Path (Join-Path $RpsAppDir "templates/*") -Destination $StagingTemplates -Recurse -Force -Exclude "backups"

$StagingStorage = Join-Path $StagingDir "storage"
New-Item -ItemType Directory -Path (Join-Path $StagingStorage "logs") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $StagingStorage "exports") -Force | Out-Null
Copy-Item -Path (Join-Path $RpsAppDir "storage/logs/*") -Destination (Join-Path $StagingStorage "logs") -Force -ErrorAction SilentlyContinue

Copy-Item -Path (Join-Path $ProjectRoot "kampus.conf") -Destination $StagingDir -Force
Copy-Item -Path (Join-Path $ProjectRoot "kampus-api.service") -Destination $StagingDir -Force
Copy-Item -Path (Join-Path $ProjectRoot "fix_server.php") -Destination $StagingDir -Force

$ForbiddenItems = Get-ChildItem -Path $StagingDir -Recurse -Include "*node_modules*", "*.env*"
if ($ForbiddenItems.Count -gt 0) {
    throw "Security SOP Violation: Forbidden files found in staging: $($ForbiddenItems.FullName -join ', ')"
}

if (Test-Path $ZipFilePath) { Remove-Item -Force $ZipFilePath }
Compress-Archive -Path "$StagingDir/*" -DestinationPath $ZipFilePath -CompressionLevel Optimal
Remove-Item -Recurse -Force $StagingDir

$ZipSizeMb = [math]::Round((Get-Item $ZipFilePath).Length / 1MB, 2)
Write-Host " -> Created $ZipFileName ($ZipSizeMb MB)" -ForegroundColor Green

# STEP 3: REMOTE FOLDER PREP (via WSL SSH Key)
Write-Host "`n[3/5] Preparing isolated remote directory via WSL SSH key..." -ForegroundColor Yellow
$wslZipPath = (wsl -d Ubuntu wslpath -u ($ZipFilePath -replace '\\', '/')).Trim()

wsl -d Ubuntu ssh -p $Port "$User@$TargetHost" "mkdir -p $RemoteBaseDir/releases $RemoteBaseDir/shared/storage/logs $RemoteBaseDir/shared/storage/exports $RemoteBaseDir/shared/logs"

# STEP 4: SCP ZIP TO VPS
Write-Host "`n[4/5] Uploading $ZipFileName via WSL scp..." -ForegroundColor Yellow
wsl -d Ubuntu scp -P $Port "$wslZipPath" "$User@`${TargetHost}:$RemoteBaseDir/$ZipFileName"

# STEP 5: REMOTE EXTRACTION & ACTIVATION SCRIPT
Write-Host "`n[5/5] Extracting release & reloading daemon..." -ForegroundColor Yellow

$remoteScript = @"
set -e
echo '--- [1] Extracting release with unzip -o ---'
mkdir -p $RemoteReleaseDir
unzip -o -q $RemoteBaseDir/$ZipFileName -d $RemoteReleaseDir

echo '--- [2] Linking persistent shared database and storage ---'
if [ ! -f $RemoteBaseDir/shared/database.sqlite ]; then
    touch $RemoteBaseDir/shared/database.sqlite
    chmod 666 $RemoteBaseDir/shared/database.sqlite
fi
rm -rf $RemoteReleaseDir/storage
ln -sfn $RemoteBaseDir/shared/storage $RemoteReleaseDir/storage

echo '--- [3] Installing production dependencies ---'
cd $RemoteReleaseDir/apps/api
npm install --production --silent || true

echo '--- [4] Updating active release symlink ---'
ln -sfn $RemoteReleaseDir $RemoteBaseDir/current

echo '--- [5] Installing Apache VirtualHost for kampus.rumahku.web.id ---'
cp $RemoteReleaseDir/kampus.conf /etc/apache2/sites-available/kampus.conf
a2enmod proxy proxy_http rewrite headers > /dev/null 2>&1 || true
a2ensite kampus.conf > /dev/null 2>&1 || true
systemctl reload apache2 || systemctl restart apache2

echo '--- [6] Installing systemd daemon kampus-api.service (Port 3005) ---'
cp $RemoteReleaseDir/kampus-api.service /etc/systemd/system/kampus-api.service
systemctl daemon-reload
systemctl enable kampus-api.service > /dev/null 2>&1 || true
systemctl restart kampus-api.service

echo '--- [7] Setting safe permissions ---'
chown -R www-data:www-data $RemoteBaseDir
chmod -R 755 $RemoteBaseDir

echo '--- [8] Checking daemon status ---'
systemctl status kampus-api.service --no-pager || true
"@

# Execute via WSL SSH
$remoteScriptEscaped = $remoteScript -replace '"', '\"'
wsl -d Ubuntu ssh -p $Port "$User@$TargetHost" "bash -c `"$remoteScriptEscaped`""

Write-Host "`n[Verification] Probing live endpoints..." -ForegroundColor Yellow
wsl -d Ubuntu /usr/bin/ssh -p $Port "$User@$TargetHost" "/usr/bin/curl -s -I http://127.0.0.1:3005/api/rps"
wsl -d Ubuntu /usr/bin/ssh -p $Port "$User@$TargetHost" "/usr/bin/curl -s -I http://$Domain/"

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   DEPLOYMENT TO VPS 38.103.170.236 COMPLETED!           " -ForegroundColor Green
Write-Host "   Site URL: http://$Domain                              " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
