# RMV2 Server Durdurma Script'i

Write-Host "RMV2 Server durduruluyor..." -ForegroundColor Red

# Tüm Node.js process'lerini durdur
taskkill /F /IM node.exe

Write-Host "Server durduruldu!" -ForegroundColor Green

