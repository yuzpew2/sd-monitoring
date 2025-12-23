# Push-VMData.ps1
# Parses VM failover CSV and pushes data to SD-Monitoring dashboard via API
#
# Usage:
#   .\Push-VMData.ps1 -CsvPath "C:\Path\To\vm.csv" -ApiUrl "https://your-dashboard.com" -ServiceKey "your-key"
#
# CSV Format (semicolon-delimited):
#   Computer Name;PowerShell (VM Failover Check) FailoverStatus;PowerShell (VM Failover Check) VMName

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$CsvPath,
    
    [Parameter(Mandatory = $true)]
    [string]$ApiUrl,
    
    [Parameter(Mandatory = $true)]
    [string]$ServiceKey,
    
    [Parameter(Mandatory = $false)]
    [string]$Delimiter = ";"
)

# Validate CSV file exists (use LiteralPath for special characters like [])
if (-not (Test-Path -LiteralPath $CsvPath)) {
    Write-Error "CSV file not found: $CsvPath"
    exit 1
}

Write-Host "Reading CSV file: $CsvPath" -ForegroundColor Cyan

try {
    # Import CSV with semicolon delimiter (use LiteralPath for special characters)
    $csvData = Import-Csv -LiteralPath $CsvPath -Delimiter $Delimiter
    
    if ($csvData.Count -eq 0) {
        Write-Warning "CSV file is empty. No data to push."
        exit 0
    }
    
    Write-Host "Found $($csvData.Count) records in CSV" -ForegroundColor Green
    
    # Transform data to API format
    $payload = @{
        data = @(
            foreach ($row in $csvData) {
                @{
                    computerName   = $row.'Computer Name'
                    failoverStatus = $row.'PowerShell (VM Failover Check) FailoverStatus'
                    vmName         = $row.'PowerShell (VM Failover Check) VMName'
                }
            }
        )
    }
    
    # Convert to JSON
    $jsonBody = $payload | ConvertTo-Json -Depth 10 -Compress
    
    Write-Host "Pushing data to API..." -ForegroundColor Cyan
    
    # Build API URL
    $endpoint = "$($ApiUrl.TrimEnd('/'))/api/ingest/vm"
    
    # Make API request
    $headers = @{
        "Authorization" = "Bearer $ServiceKey"
        "Content-Type"  = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -Body $jsonBody -ErrorAction Stop
    
    if ($response.success) {
        Write-Host "SUCCESS: $($response.message)" -ForegroundColor Green
        Write-Host "Ingestion ID: $($response.ingestionId)" -ForegroundColor Gray
        Write-Host "Records pushed: $($response.recordsCount)" -ForegroundColor Gray
    }
    else {
        Write-Error "API returned error: $($response.message)"
        exit 1
    }
    
}
catch {
    Write-Error "Error: $($_.Exception.Message)"
    
    # Try to extract more details if available
    if ($_.ErrorDetails.Message) {
        $errorDetail = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorDetail.message) {
            Write-Error "API Error: $($errorDetail.message)"
        }
    }
    
    exit 1
}

Write-Host "VM failover data push completed successfully!" -ForegroundColor Green
