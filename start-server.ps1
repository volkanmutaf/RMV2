# RMV2 Server Başlatma Script'i
# Bu script'i çalıştırarak projeyi arka planda başlatabilirsiniz

Write-Host "RMV2 Server başlatılıyor..." -ForegroundColor Green

# Proje dizinine git
Set-Location "C:\Users\volkan\Desktop\Projects\RMV2"

# Development server'ı başlat
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden

Write-Host "Server arka planda başlatıldı!" -ForegroundColor Green
Write-Host "Proje şu adreste çalışıyor: http://10.0.0.140:3000" -ForegroundColor Cyan
Write-Host "Durdurmak için: taskkill /F /IM node.exe" -ForegroundColor Yellow

