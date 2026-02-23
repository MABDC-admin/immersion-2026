# PowerShell script to automatically pull updates from GitHub
# Usage: npm run sync

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Immersion Auto-Sync Monitor Active   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Monitoring 'main' branch for changes every 5 minutes..." -ForegroundColor Gray

while ($true) {
    try {
        # Check for remote changes
        git fetch origin main 2>$null
        
        $local = git rev-parse HEAD
        $remote = git rev-parse origin/main
        
        if ($local -ne $remote) {
            Write-Host "$(Get-Date -Format 'HH:mm:ss') - New updates detected! Syncing..." -ForegroundColor Green
            git pull origin main
        }
    } catch {
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - Error during sync check. Retrying in 5 mins..." -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 300
}
