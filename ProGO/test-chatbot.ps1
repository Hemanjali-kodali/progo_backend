# Test Quick Actions
Write-Host "Testing Chatbot Quick Actions" -ForegroundColor Cyan
Write-Host "==============================`n" -ForegroundColor Cyan

# Login first
$loginBody = @{
    registrationNumber = "REG001"
    password = "password123"
    role = "student"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -UseBasicParsing `
        -SessionVariable session

    $user = ($loginResponse.Content | ConvertFrom-Json).user
    Write-Host "✓ Login successful: $($user.firstName) $($user.lastName)" -ForegroundColor Green
    Write-Host ""

    # Test quick action - Attendance
    Write-Host "Testing Quick Action: Check Attendance" -ForegroundColor Yellow
    $chatBody = @{
        message = "What is my attendance?"
        sessionId = "test123"
    } | ConvertTo-Json

    $chatResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/chatbot/message" `
        -Method POST `
        -Body $chatBody `
        -ContentType "application/json" `
        -WebSession $session `
        -UseBasicParsing

    $chatData = ($chatResponse.Content | ConvertFrom-Json).data
    Write-Host "`nBot Response:" -ForegroundColor Green
    Write-Host $chatData.message
    Write-Host "`nIntent: $($chatData.intent)" -ForegroundColor Cyan

} catch {
    $errorMsg = $_.Exception.Message
    Write-Host "Error: $errorMsg" -ForegroundColor Red
}
