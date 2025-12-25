# Deploy telegram-webhook function to Supabase
# Requires: Supabase Access Token

$projectRef = "ishzwulmiixtuouisdyw"
$functionName = "telegram-webhook"
$functionPath = "supabase/functions/telegram-webhook/index.ts"

# Read function code
$functionCode = Get-Content $functionPath -Raw

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Deploying telegram-webhook to Supabase" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project: $projectRef" -ForegroundColor Yellow
Write-Host "Function: $functionName" -ForegroundColor Yellow
Write-Host ""

# Instructions
Write-Host "To deploy this function, you need to:" -ForegroundColor Green
Write-Host "1. Get your Supabase Access Token from:" -ForegroundColor White
Write-Host "   https://supabase.com/dashboard/account/tokens" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Create a new token if needed" -ForegroundColor White
Write-Host ""
Write-Host "3. Run this command with your token:" -ForegroundColor White
Write-Host ""
Write-Host "curl -L -X POST 'https://api.supabase.com/v1/projects/$projectRef/functions/$functionName' \" -ForegroundColor Cyan
Write-Host "  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \" -ForegroundColor Cyan
Write-Host "  -H 'Content-Type: application/json' \" -ForegroundColor Cyan
Write-Host "  --data-raw '{" -ForegroundColor Cyan
Write-Host "    `"slug`": `"$functionName`"," -ForegroundColor Cyan
Write-Host "    `"name`": `"$functionName`"," -ForegroundColor Cyan
Write-Host "    `"verify_jwt`": false" -ForegroundColor Cyan
Write-Host "  }'" -ForegroundColor Cyan
Write-Host ""
Write-Host "Alternative: Use Supabase CLI" -ForegroundColor Green
Write-Host "If you have Supabase CLI installed, simply run:" -ForegroundColor White
Write-Host "supabase functions deploy telegram-webhook" -ForegroundColor Cyan
Write-Host ""
