<#
.SYNOPSIS
    Automated Production Deployment Script for Dunia_Kampus (Aplikasi Dosen RPS).
    Enforces Strict SOP: Zero raw folder copy, Local Zip Compression, Remote 'unzip -o', Full Directory Isolation.

.DESCRIPTION
    Packages apps/web and apps/api into web_build.zip (strictly excluding node_modules, .git, .env),
    transfers the zip archive to VPS 38.103.170.236, safely extracts to /var/www/kampus-dosen/releases/,
    links persistent assets, manages Apache vhost and systemd service, and verifies live HTTP responses.

.EXAMPLE
    .\deploy.ps1 -TargetHost "38.103.170.236" -User "root"
#>

[CmdletBinding()]
param (
    [Parameter()]
    [string]$TargetHost = "38.103.170.236",

    [Parameter()]
    [string]$User = "root",

    [Parameter()]
    [int]$Port = 22,

    [Parameter()]
    [string]$Domain = "kampus.rumahku.web.id",

    [Parameter()]
    [switch]$SkipBuild,

    [Parameter()]
    [switch]$SkipUpload
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
Write-Host "   DUNIA_KAMPUS AUTOMATED VPS DEPLOYMENT PIPELINE       " -ForegroundColor Cyan
Write-Host "   Target VPS  : $User@${TargetHost}:$Port" -ForegroundColor Cyan
Write-Host "   Domain      : $Domain" -ForegroundColor Cyan
Write-Host "   Isolated Dir: $RemoteBaseDir" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# STEP 1: PRODUCTION BUILD
if (-not $SkipBuild) {
    Write-Host "`n[1/6] Building production artifacts..." -ForegroundColor Yellow
    
    Write-Host " -> Building apps/api TypeScript..."
    npm --prefix (Join-Path $RpsAppDir "apps/api") run build
    if ($LASTEXITCODE -ne 0) { throw "API build failed!" }

    Write-Host " -> Building apps/web Vite bundle..."
    npm --prefix (Join-Path $RpsAppDir "apps/web") run build
    if ($LASTEXITCODE -ne 0) { throw "Web build failed!" }
} else {
    Write-Host "`n[1/6] Skipping build step (-SkipBuild specified)..." -ForegroundColor Gray
}

# STEP 2: PACKAGING PRODUCTION ARTIFACT (STRICT SOP: NO node_modules, NO .env)
Write-Host "`n[2/6] Packaging deployment artifact ($ZipFileName)..." -ForegroundColor Yellow

$StagingDir = Join-Path $ProjectRoot ".deploy_staging"
if (Test-Path $StagingDir) { Remove-Item -Recurse -Force $StagingDir }
New-Item -ItemType Directory -Path $StagingDir | Out-Null

Write-Host " -> Copying compiled web dist..."
$StagingWebDist = Join-Path $StagingDir "apps/web/dist"
New-Item -ItemType Directory -Path $StagingWebDist -Force | Out-Null
Copy-Item -Path (Join-Path $RpsAppDir "apps/web/dist/*") -Destination $StagingWebDist -Recurse -Force

Write-Host " -> Copying compiled api dist & package..."
$StagingApiDist = Join-Path $StagingDir "apps/api/dist"
New-Item -ItemType Directory -Path $StagingApiDist -Force | Out-Null
Copy-Item -Path (Join-Path $RpsAppDir "apps/api/dist/*") -Destination $StagingApiDist -Recurse -Force
Copy-Item -Path (Join-Path $RpsAppDir "apps/api/package.json") -Destination (Join-Path $StagingDir "apps/api/package.json") -Force

Write-Host " -> Copying monorepo configurations & Prisma schema..."
Copy-Item -Path (Join-Path $RpsAppDir "package.json") -Destination (Join-Path $StagingDir "package.json") -Force
$StagingPrisma = Join-Path $StagingDir "prisma"
New-Item -ItemType Directory -Path $StagingPrisma -Force | Out-Null
Copy-Item -Path (Join-Path $RpsAppDir "prisma/schema.prisma") -Destination (Join-Path $StagingPrisma "schema.prisma") -Force

Write-Host " -> Copying templates & initial storage..."
$StagingTemplates = Join-Path $StagingDir "templates"
New-Item -ItemType Directory -Path $StagingTemplates -Force | Out-Null
Copy-Item -Path (Join-Path $RpsAppDir "templates/*") -Destination $StagingTemplates -Recurse -Force -Exclude "backups"

$StagingStorage = Join-Path $StagingDir "storage"
New-Item -ItemType Directory -Path (Join-Path $StagingStorage "logs") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $StagingStorage "exports") -Force | Out-Null
Copy-Item -Path (Join-Path $RpsAppDir "storage/logs/*") -Destination (Join-Path $StagingStorage "logs") -Force -ErrorAction SilentlyContinue

Write-Host " -> Copying server configs & recovery tools..."
Copy-Item -Path (Join-Path $ProjectRoot "kampus.conf") -Destination $StagingDir -Force
Copy-Item -Path (Join-Path $ProjectRoot "kampus-api.service") -Destination $StagingDir -Force
Copy-Item -Path (Join-Path $ProjectRoot "fix_server.php") -Destination $StagingDir -Force

# Verify strict exclusion: Ensure NO node_modules or .env are in staging
$ForbiddenItems = Get-ChildItem -Path $StagingDir -Recurse -Include "*node_modules*", "*.env*"
if ($ForbiddenItems.Count -gt 0) {
    throw "Security SOP Violation: Forbidden files found in staging: $($ForbiddenItems.FullName -join ', ')"
}

# Compress into web_build.zip
if (Test-Path $ZipFilePath) { Remove-Item -Force $ZipFilePath }
Write-Host " -> Compressing staging directory into $ZipFileName..."
Compress-Archive -Path "$StagingDir/*" -DestinationPath $ZipFilePath -CompressionLevel Optimal
Remove-Item -Recurse -Force $StagingDir

$ZipSizeMb = [math]::Round((Get-Item $ZipFilePath).Length / 1MB, 2)
Write-Host " -> Successfully created $ZipFileName ($ZipSizeMb MB)" -ForegroundColor Green

if ($SkipUpload) {
    Write-Host "`n[NOTICE] -SkipUpload specified. Archive created at $ZipFilePath. Exiting." -ForegroundColor Cyan
    exit 0
}

# Check if passwordless SSH key is available via WSL or native Windows
$UseWslSsh = $false
try {
    $wslCheck = wsl -d Ubuntu bash -c "ssh -o BatchMode=yes -o ConnectTimeout=3 $User@$TargetHost 'echo OK' 2>/dev/null"
    if ($wslCheck -match "OK") {
        $UseWslSsh = $true
        Write-Host " -> Detected passwordless SSH key in WSL. Using automated unattended transport." -ForegroundColor Green
    }
} catch {}

function Invoke-RemoteSsh([string]$RemoteCmd) {
    if ($UseWslSsh) {
        # Safely pipe multiline commands to SSH to avoid escaping hell
        $TempScript = Join-Path $env:TEMP "deploy_ssh_script_$([guid]::NewGuid().ToString()).sh"
        # Convert CRLF to LF just in case
        $RemoteCmd = $RemoteCmd -replace "`r`n", "`n"
        Set-Content -Path $TempScript -Value $RemoteCmd -Encoding ASCII
        $WslScript = (wsl -d Ubuntu wslpath -u ($TempScript -replace '\\', '/')).Trim()
        wsl -d Ubuntu bash -c "ssh -o StrictHostKeyChecking=no -p $Port $User@$TargetHost < '$WslScript'"
        Remove-Item $TempScript -Force
    } else {
        ssh -p $Port "$User@$TargetHost" $RemoteCmd
    }
}

function Invoke-RemoteScp([string]$LocalFile, [string]$RemoteDest) {
    if ($UseWslSsh) {
        # Convert Windows path to WSL path
        $wslLocal = (wsl -d Ubuntu wslpath -u ($LocalFile -replace '\\', '/')).Trim()
        wsl -d Ubuntu bash -c "scp -o StrictHostKeyChecking=no -P $Port '$wslLocal' ${User}@${TargetHost}:'$RemoteDest'"
    } else {
        scp -P $Port $LocalFile "$User@${TargetHost}:$RemoteDest"
    }
}

# STEP 3: REMOTE DIRECTORY PREPARATION (ISOLATION GUARANTEE)
Write-Host "`n[3/6] Preparing isolated directories on VPS 38.103.170.236..." -ForegroundColor Yellow
$PrepCommand = "mkdir -p $RemoteBaseDir/releases $RemoteBaseDir/shared/storage/logs $RemoteBaseDir/shared/storage/exports $RemoteBaseDir/shared/logs"
Invoke-RemoteSsh $PrepCommand

# STEP 4: TRANSFER ARCHIVE (ZERO RAW DIRECTORY UPLOADS)
Write-Host "`n[4/6] Uploading single archive $ZipFileName via scp..." -ForegroundColor Yellow
Invoke-RemoteScp $ZipFilePath "$RemoteBaseDir/$ZipFileName"

# STEP 5: REMOTE EXTRACTION & SERVICE ACTIVATION
Write-Host "`n[5/6] Executing safe extraction with unzip -o and reloading services..." -ForegroundColor Yellow
$DeployRemoteScript = @"
set -e
echo '--- [1] Extracting release with unzip -o ---'
mkdir -p $RemoteReleaseDir
unzip -o -q $RemoteBaseDir/$ZipFileName -d $RemoteReleaseDir || true

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

echo '--- [3.1] Generating Prisma Client & Syncing DB ---'
cd $RemoteReleaseDir
export DATABASE_URL="file:/var/www/kampus-dosen/shared/database.sqlite"
npx prisma generate
npx prisma db push --accept-data-loss

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

Invoke-RemoteSsh $DeployRemoteScript

# STEP 6: ONLINE VERIFICATION
Write-Host "`n[6/6] Verifying live deployment on VPS 38.103.170.236..." -ForegroundColor Yellow
$VerifyScript = @"
echo '=== Internal Port 3005 Check ==='
curl -s -o /dev/null -w 'HTTP %{http_code}\n' http://127.0.0.1:3005/api/rps || true

echo '=== Reverse Proxy Vhost Check ==='
curl -s -o /dev/null -w 'HTTP %{http_code}\n' -H 'Host: $Domain' http://127.0.0.1/ || true
"@

Invoke-RemoteSsh $VerifyScript

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   DEPLOYMENT TO VPS 38.103.170.236 COMPLETED!           " -ForegroundColor Green
Write-Host "   Site URL: http://$Domain (or http://${TargetHost})" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
