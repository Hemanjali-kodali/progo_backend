# Test login endpoint
$body = @{
    registrationNumber = "REG001"
    password = "password123"
    role = "student"
} | ConvertTo-Json

Write-Host "Testing login with REG001..." -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri http://localhost:5000/api/auth/login `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing `
    -SessionVariable session

Write-Host "`nResponse:" -ForegroundColor Green
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

Write-Host "`n`nTesting session endpoint..." -ForegroundColor Cyan
$sessionResponse = Invoke-WebRequest -Uri http://localhost:5000/api/auth/session `
    -Method GET `
    -WebSession $session `
    -UseBasicParsing

Write-Host "`nSession Response:" -ForegroundColor Green
$sessionResponse.Content
