Write-Host "=== Portas COM registradas ==="
try {
    $comPorts = Get-ItemProperty -Path "HKLM:\HARDWARE\DEVICEMAP\SERIALCOMM" -ErrorAction Stop
    $comPorts | Format-List
} catch {
    Write-Host "NENHUMA porta COM registrada no Windows"
}

Write-Host ""
Write-Host "=== Dispositivos com 'Serial' ou 'CP210' ou 'COM' no nome ==="
Get-WmiObject Win32_PnPEntity | Where-Object {
    $_.Name -match "CP210|Silicon|Serial|COM\d|CH340|FTDI|USB-SERIAL"
} | ForEach-Object {
    Write-Host ("  " + $_.Name + " | Status: " + $_.Status + " | ID: " + $_.DeviceID)
}

Write-Host ""
Write-Host "=== Dispositivos USB conectados ==="
Get-WmiObject Win32_PnPEntity | Where-Object {
    $_.DeviceID -match "^USB\\" -and $_.Status -eq "OK"
} | ForEach-Object {
    Write-Host ("  " + $_.Name + " | " + $_.DeviceID)
}

Write-Host ""
Write-Host "=== Dispositivos com problema (driver faltando) ==="
Get-WmiObject Win32_PnPEntity | Where-Object {
    $_.ConfigManagerErrorCode -ne 0
} | ForEach-Object {
    Write-Host ("  " + $_.Name + " | Erro: " + $_.ConfigManagerErrorCode + " | " + $_.DeviceID)
}
