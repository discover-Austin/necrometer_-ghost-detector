param(
  [string]$AndroidSdkPath = $null,
  [string]$DeviceSerial = $null
)

function Exit-WithError($msg) {
  Write-Error $msg
  exit 1
}

function Check-Command($cmd) {
  $which = Get-Command $cmd -ErrorAction SilentlyContinue
  return $which -ne $null
}

Write-Output "Starting Android build+install script"

# Resolve SDK path
if ($AndroidSdkPath) {
  if (-Not (Test-Path $AndroidSdkPath)) {
    Exit-WithError "Provided AndroidSdkPath '$AndroidSdkPath' does not exist"
  }
  $sdk = (Resolve-Path $AndroidSdkPath).ProviderPath
  Write-Output "Using provided Android SDK path: $sdk"
} else {
  if ($env:ANDROID_SDK_ROOT) { $sdk = $env:ANDROID_SDK_ROOT }
  elseif ($env:ANDROID_HOME) { $sdk = $env:ANDROID_HOME }
  else { $sdk = $null }
  if (-Not $sdk) {
    Write-Warning "Android SDK path not found in environment. You can pass -AndroidSdkPath 'C:\Path\To\Sdk' to this script. Will try local.properties if present."
  } else {
    Write-Output "Detected Android SDK path from env: $sdk"
  }
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Push-Location $repoRoot

# Ensure web build (Angular)
Write-Output "Building web assets (Angular production)..."
$npx = if (Test-Path (Join-Path $env:APPDATA 'npm\npx.cmd')) { 'npx' } else { 'npx' }
$buildCmd = "$npx -p @angular/cli@^20 ng build --configuration production"
Write-Output "Running: $buildCmd"
$buildRes = Invoke-Expression $buildCmd

# Ensure the Android platform exists and sync
Write-Output "Syncing Capacitor Android platform..."
Invoke-Expression "$npx cap sync android"

# If user provided SDK path, write local.properties
if ($sdk) {
  $localPropsPath = Join-Path $repoRoot 'android\local.properties'
  $sdkEscaped = $sdk -replace '\\','\\\\'
  $content = "sdk.dir=$sdkEscaped"
  Write-Output "Writing local.properties to $localPropsPath"
  Set-Content -Path $localPropsPath -Value $content -Encoding ASCII
}

# Build the Android debug APK using Gradle wrapper
$androidDir = Join-Path $repoRoot 'android'
Push-Location $androidDir
Write-Output "Building Android (Gradle assembleDebug)..."
$gradleCmd = '.\gradlew.bat assembleDebug'
$gradleRes = Invoke-Expression $gradleCmd

# Find APK
$apkPath = Join-Path $androidDir 'app\build\outputs\apk\debug\app-debug.apk'
if (-Not (Test-Path $apkPath)) {
  Exit-WithError "APK not found at expected path: $apkPath"
}
Write-Output "Built APK: $apkPath"

# Install to device if adb available
if (-Not (Check-Command 'adb')) {
  Write-Warning "adb not found on PATH. Skipping install. You can install adb or copy the APK to device manually."
  Pop-Location; Pop-Location
  exit 0
}

# If DeviceSerial provided, use -s
$adbArgs = "install -r `"$apkPath`""
if ($DeviceSerial) { $adbArgs = "-s $DeviceSerial $adbArgs" }
Write-Output "Installing APK to device... (adb $adbArgs)"
$installCmd = "adb $adbArgs"
$installRes = Invoke-Expression $installCmd
Write-Output $installRes

Pop-Location
Pop-Location
Write-Output "Done. If installation succeeded, look for the app on your device." 
