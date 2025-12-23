# Push-AllData.ps1
# Combined script to push both Backup and VM data to SD-Monitoring dashboard
#
# Usage:
#   .\Push-AllData.ps1 -BackupCsvPath "C:\Path\To\backup.csv" -VMCsvPath "C:\Path\To\vm.csv" -ApiUrl "https://your-dashboard.com" -ServiceKey "your-key"
#
# This script is designed to be run as a scheduled task from your PDQ/Automation server

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupCsvPath,
    
    [Parameter(Mandatory = $true)]
    [string]$VMCsvPath,
    
    [Parameter(Mandatory = $true)]
    [string]$ApiUrl,
    
    [Parameter(Mandatory = $true)]
    [string]$ServiceKey,
    
    [Parameter(Mandatory = $false)]
    [string]$Delimiter = ";",
    
    [Parameter(Mandatory = $false)]
    [switch]$StopOnError
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$overallSuccess = $true

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SD-Monitoring Data Push Script" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan

# Push Backup Data
Write-Host "`n[1/2] Pushing Backup Data..." -ForegroundColor Yellow

# Use LiteralPath for special characters like []
if (Test-Path -LiteralPath $BackupCsvPath) {
    try {
        & "$scriptDir\Push-BackupData.ps1" -CsvPath $BackupCsvPath -ApiUrl $ApiUrl -ServiceKey $ServiceKey -Delimiter $Delimiter
        if ($LASTEXITCODE -ne 0) {
            $overallSuccess = $false
            Write-Warning "Backup data push returned non-zero exit code"
        }
    }
    catch {
        $overallSuccess = $false
        Write-Error "Failed to push backup data: $($_.Exception.Message)"
        if ($StopOnError) { exit 1 }
    }
}
else {
    Write-Warning "Backup CSV not found: $BackupCsvPath"
    $overallSuccess = $false
    if ($StopOnError) { exit 1 }
}

# Push VM Data
Write-Host "`n[2/2] Pushing VM Failover Data..." -ForegroundColor Yellow

# Use LiteralPath for special characters like []
if (Test-Path -LiteralPath $VMCsvPath) {
    try {
        & "$scriptDir\Push-VMData.ps1" -CsvPath $VMCsvPath -ApiUrl $ApiUrl -ServiceKey $ServiceKey -Delimiter $Delimiter
        if ($LASTEXITCODE -ne 0) {
            $overallSuccess = $false
            Write-Warning "VM data push returned non-zero exit code"
        }
    }
    catch {
        $overallSuccess = $false
        Write-Error "Failed to push VM data: $($_.Exception.Message)"
        if ($StopOnError) { exit 1 }
    }
}
else {
    Write-Warning "VM CSV not found: $VMCsvPath"
    $overallSuccess = $false
    if ($StopOnError) { exit 1 }
}

# Summary
Write-Host "`n============================================" -ForegroundColor Cyan
if ($overallSuccess) {
    Write-Host "  All data pushed successfully!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "  Completed with some errors" -ForegroundColor Yellow
    exit 1
}
