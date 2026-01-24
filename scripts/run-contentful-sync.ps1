param(
  [string]$WorkingDir = (Get-Location).Path
)

Set-Location $WorkingDir

$ErrorActionPreference = "Stop"

Write-Host "[Contentful Sync] Starting..."
& npm run contentful:sync
