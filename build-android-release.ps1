# OneOff - Android Release Build (AAB fuer Play Console + optional Test-APK)
#
# Verwendung:
#   powershell -ExecutionPolicy Bypass -File .\build-android-release.ps1            # nur AAB
#   powershell -ExecutionPolicy Bypass -File .\build-android-release.ps1 -WithApk   # AAB + universelle APK
#
# Ergebnis:
#   oneoff-v<versionName>-release.aab  (Upload nach Play Console)
#   oneoff-v<versionName>-release.apk  (Sideload/Test, nur mit -WithApk)
param(
    [switch]$WithApk
)

$ErrorActionPreference = 'Stop'
$root    = $PSScriptRoot
$client  = Join-Path $root 'client'
$android = Join-Path $client 'android'

# --- JDK 21 ---
$jdk = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'User')
if (-not $jdk -or -not (Test-Path (Join-Path $jdk 'bin\java.exe'))) {
    $candidate = Get-ChildItem 'C:\Users\Timo\android-build' -Directory -EA SilentlyContinue |
        Where-Object { $_.Name -like 'jdk-21*' -and (Test-Path (Join-Path $_.FullName 'bin\java.exe')) } |
        Select-Object -First 1
    if ($candidate) { $jdk = $candidate.FullName }
}
if (-not $jdk -or -not (Test-Path (Join-Path $jdk 'bin\java.exe'))) {
    throw 'JDK 21 nicht gefunden. Setze JAVA_HOME auf eine JDK-21-Installation.'
}

# --- Android SDK ---
$sdk = [Environment]::GetEnvironmentVariable('ANDROID_HOME', 'User')
if (-not $sdk) { $sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if (-not (Test-Path (Join-Path $sdk 'platforms\android-36\android.jar'))) {
    throw "Android SDK Platform 36 nicht gefunden unter $sdk. Installiere sie via sdkmanager `"platforms;android-36`"."
}

$env:JAVA_HOME       = $jdk
$env:ANDROID_HOME    = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:Path            = "$jdk\bin;$sdk\platform-tools;$env:Path"

Write-Host "JDK:      $jdk" -ForegroundColor Cyan
Write-Host "SDK:      $sdk" -ForegroundColor Cyan

# --- Versionsinformationen aus app/build.gradle lesen ---
$gradleFile = Join-Path $android 'app\build.gradle'
$gradleText = Get-Content $gradleFile -Raw
$versionCode = [regex]::Match($gradleText, '(?m)^\s*versionCode\s*=?\s*(\d+)').Groups[1].Value
$versionName = [regex]::Match($gradleText, '(?m)^\s*versionName\s*=?\s*"([^"]+)"').Groups[1].Value
if (-not $versionCode -or -not $versionName) { throw 'versionCode/versionName konnten nicht aus app/build.gradle gelesen werden.' }
Write-Host "Version:  $versionName (versionCode $versionCode)" -ForegroundColor Cyan

# --- 1. Web-Build ---
Write-Host "`n[1/3] Web-Build..." -ForegroundColor Yellow
Push-Location $client
& npm.cmd run build:mobile
if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'npm run build:mobile fehlgeschlagen.' }

Write-Host "`n[2/3] Capacitor Sync..." -ForegroundColor Yellow
& npx.cmd cap sync android
if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'npx cap sync android fehlgeschlagen.' }
Pop-Location

# --- 3. Gradle Build ---
Write-Host "`n[3/3] Gradle Bundle (signierter AAB)..." -ForegroundColor Yellow
Push-Location $android
& .\gradlew.bat bundleRelease --console=plain
if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'gradlew bundleRelease fehlgeschlagen.' }

$aabSource = Join-Path $android 'app\build\outputs\bundle\release\app-release.aab'
if (-not (Test-Path $aabSource)) { Pop-Location; throw 'AAB wurde nicht erzeugt.' }
$aabTarget = Join-Path $root "oneoff-v$versionName-release.aab"
Copy-Item $aabSource $aabTarget -Force

if ($WithApk) {
    Write-Host "`n[Zusatz] Universelle Release-APK fuer Tests..." -ForegroundColor Yellow
    & .\gradlew.bat assembleRelease --console=plain
    if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'gradlew assembleRelease fehlgeschlagen.' }
    $apkSource = Join-Path $android 'app\build\outputs\apk\release\app-universal-release.apk'
    if (Test-Path $apkSource) {
        $apkTarget = Join-Path $root "oneoff-v$versionName-release.apk"
        Copy-Item $apkSource $apkTarget -Force
        Write-Host "APK:      $apkTarget" -ForegroundColor Green
    } else {
        Write-Warning 'Universelle APK nicht gefunden - ABI-Splits pruefen.'
    }
}
Pop-Location

# --- Signatur pruefen ---
Write-Host "`nSignaturpruefung..." -ForegroundColor Yellow
& "$jdk\bin\jarsigner.exe" -verify $aabTarget | Select-String -Pattern 'verified|verifiziert' | ForEach-Object { Write-Host $_.Line -ForegroundColor Green }

Write-Host "`nFertig." -ForegroundColor Green
Write-Host "AAB:      $aabTarget" -ForegroundColor Green
Write-Host ("Groesse:  {0:N2} MB" -f ((Get-Item $aabTarget).Length / 1MB))
Write-Host ("SHA-256:  {0}" -f (Get-FileHash $aabTarget -Algorithm SHA256).Hash)
Write-Host 'Diesen AAB in der Play Console unter "App-Bundle" hochladen.' -ForegroundColor Green
