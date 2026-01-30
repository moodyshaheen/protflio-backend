# Start Backend Server Script
# This script kills any process on port 3001 and starts the server

Write-Host "🛑 Stopping any process on port 3001..." -ForegroundColor Yellow

# Find and kill process on port 3001
$processes = netstat -ano | findstr :3001 | findstr LISTENING
if ($processes) {
    $processes | ForEach-Object {
        $pid = ($_ -split '\s+')[-1]
        if ($pid -and $pid -ne '0') {
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "✅ Stopped process $pid" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  Could not stop process $pid" -ForegroundColor Yellow
            }
        }
    }
    Start-Sleep -Seconds 2
}

Write-Host "`n🚀 Starting backend server..." -ForegroundColor Cyan
npm run dev

