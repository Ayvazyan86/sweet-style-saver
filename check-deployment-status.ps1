#!/usr/bin/env pwsh
# Check deployment status on server

$server = "85.198.67.7"
$user = "root"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Checking Deployment Status" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if server is accessible
Write-Host "1. Checking server connectivity..." -ForegroundColor Yellow
$ping = Test-Connection -ComputerName $server -Count 2 -Quiet
if ($ping) {
    Write-Host "   ✓ Server is online" -ForegroundColor Green
} else {
    Write-Host "   ✗ Server is not reachable" -ForegroundColor Red
    exit 1
}

# Check HTTP access
Write-Host ""
Write-Host "2. Checking HTTP service..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$server" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✓ Website is accessible!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Content-Length: $($response.RawContentLength) bytes" -ForegroundColor Green
    Write-Host ""
    Write-Host "   🌐 Application URL: http://$server" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
} catch {
    Write-Host "   ⚠ Website not accessible yet" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Checking SSH and running diagnostics..." -ForegroundColor Yellow
    
    # Run SSH diagnostic commands
    $commands = @"
echo '--- Process Check ---'
ps aux | grep -E 'npm|node|nginx' | grep -v grep | head -10 || echo 'No processes found'
echo ''
echo '--- Nginx Status ---'
systemctl status nginx --no-pager -l || echo 'Nginx not installed/running'
echo ''
echo '--- App Directory ---'
ls -la /var/www/sweet-style-saver/ 2>/dev/null | head -15 || echo 'Directory not found'
echo ''
echo '--- Dist Directory ---'
ls -la /var/www/sweet-style-saver/dist/ 2>/dev/null | head -10 || echo 'Dist not found'
echo ''
echo '--- Recent Logs ---'
tail -20 /var/log/syslog 2>/dev/null | grep -iE 'nginx|error|failed' || echo 'No recent logs'
echo ''
echo '--- Disk Space ---'
df -h /var/www 2>/dev/null || echo 'Cannot check disk space'
"@
    
    $sshCommand = "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 $user@$server '$commands'"
    
    try {
        Write-Host "   Connecting via SSH..." -ForegroundColor Gray
        $result = Invoke-Expression $sshCommand 2>&1
        Write-Host ""
        Write-Host "   Server Diagnostics:" -ForegroundColor Cyan
        Write-Host "   -------------------" -ForegroundColor Cyan
        Write-Host $result
        Write-Host ""
        
        # Analyze results
        if ($result -match "nginx.*running") {
            Write-Host "   ✓ Nginx is running" -ForegroundColor Green
        } else {
            Write-Host "   ✗ Nginx may not be running properly" -ForegroundColor Red
        }
        
        if ($result -match "dist") {
            Write-Host "   ✓ Application files exist" -ForegroundColor Green
        } else {
            Write-Host "   ⚠ Application may not be built yet" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "   ✗ Cannot connect via SSH: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Manual check required:" -ForegroundColor Yellow
        Write-Host "   ssh $user@$server" -ForegroundColor White
        Write-Host "   Password: Il1oH0BlZ*r4" -ForegroundColor Gray
    }
}

Write-Host ""
