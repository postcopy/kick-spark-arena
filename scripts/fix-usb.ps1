# Script para resetar dispositivo USB com erro
# Precisa rodar como Administrador

Write-Host "=== Tentando resetar dispositivo USB com erro 43 ===" -ForegroundColor Yellow

# Encontrar o dispositivo com erro
$device = Get-PnpDevice | Where-Object {
    $_.InstanceId -match "USB\\VID_0000" -and $_.Status -ne "OK"
}

if ($device) {
    Write-Host "Dispositivo encontrado: $($device.FriendlyName)" -ForegroundColor Cyan
    Write-Host "InstanceId: $($device.InstanceId)" -ForegroundColor Cyan
    Write-Host "Status: $($device.Status)" -ForegroundColor Red

    Write-Host ""
    Write-Host "Desabilitando dispositivo..." -ForegroundColor Yellow
    Disable-PnpDevice -InstanceId $device.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2

    Write-Host "Reabilitando dispositivo..." -ForegroundColor Yellow
    Enable-PnpDevice -InstanceId $device.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3

    # Verificar novamente
    $deviceAfter = Get-PnpDevice -InstanceId $device.InstanceId
    Write-Host ""
    Write-Host "Status apos reset: $($deviceAfter.Status)" -ForegroundColor $(if($deviceAfter.Status -eq "OK"){"Green"}else{"Red"})
    Write-Host "Nome: $($deviceAfter.FriendlyName)" -ForegroundColor Cyan
} else {
    Write-Host "Nenhum dispositivo com VID_0000 encontrado" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Verificando portas COM ==="
try {
    $comPorts = Get-ItemProperty -Path "HKLM:\HARDWARE\DEVICEMAP\SERIALCOMM" -ErrorAction Stop
    $comPorts | Format-List
} catch {
    Write-Host "Nenhuma porta COM registrada" -ForegroundColor Red
}

Write-Host ""
Write-Host "Pressione Enter para sair..."
$null = Read-Host
