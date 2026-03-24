# Reset USB Host Controller - precisa rodar como Admin
Write-Host "=== Resetando controladores USB ===" -ForegroundColor Yellow

# Desabilitar e reabilitar todos os USB Root Hubs
$rootHubs = Get-PnpDevice | Where-Object { $_.FriendlyName -match "USB Root Hub" -and $_.Status -eq "OK" }

foreach ($hub in $rootHubs) {
    Write-Host "Resetando: $($hub.FriendlyName) ($($hub.InstanceId))" -ForegroundColor Cyan
    Disable-PnpDevice -InstanceId $hub.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Enable-PnpDevice -InstanceId $hub.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Aguardando re-enumeracao USB (5 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar resultado
Write-Host ""
Write-Host "=== Dispositivos com problema ===" -ForegroundColor Yellow
$problems = Get-PnpDevice | Where-Object { $_.ConfigManagerErrorCode -ne 0 -and $_.InstanceId -match "USB" }
if ($problems) {
    foreach ($p in $problems) {
        Write-Host "  ERRO: $($p.FriendlyName) | Code: $($p.ConfigManagerErrorCode) | $($p.InstanceId)" -ForegroundColor Red
    }
} else {
    Write-Host "  Nenhum dispositivo USB com erro!" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Portas COM ===" -ForegroundColor Yellow
try {
    $ports = Get-ItemProperty -Path "HKLM:\HARDWARE\DEVICEMAP\SERIALCOMM" -ErrorAction Stop
    $ports.PSObject.Properties | Where-Object { $_.Name -notmatch "PS" } | ForEach-Object {
        Write-Host "  $($_.Name) = $($_.Value)" -ForegroundColor Green
    }
} catch {
    Write-Host "  Nenhuma porta COM" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Dispositivos Serial/CP210/CH340 ===" -ForegroundColor Yellow
$serial = Get-PnpDevice | Where-Object { $_.FriendlyName -match "Serial|CP210|CH340|FTDI|COM\d" -and $_.Status -eq "OK" }
if ($serial) {
    foreach ($s in $serial) {
        Write-Host "  $($s.FriendlyName) | $($s.InstanceId)" -ForegroundColor Green
    }
} else {
    Write-Host "  Nenhum dispositivo serial encontrado" -ForegroundColor Red
}

Write-Host ""
Write-Host "Pressione Enter para fechar..."
$null = Read-Host
