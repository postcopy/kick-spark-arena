!macro customInstall
  ; Install CP210x USB-to-UART driver for S-FIGHT sensor receiver
  MessageBox MB_YESNO "Deseja instalar o driver CP210x para a placa receptora dos sensores?$\r$\n$\r$\n(Necessário para conectar os equipamentos de Taekwondo)" IDYES installDriver IDNO skipDriver

  installDriver:
    DetailPrint "Instalando driver CP210x..."
    nsExec::ExecToLog '"$INSTDIR\resources\CP210_Drivers\CP210xVCPInstaller_x64.exe" /S'
    Pop $0
    ${If} $0 != 0
      DetailPrint "Driver CP210x já instalado ou instalação concluída."
    ${EndIf}
    Goto driverDone

  skipDriver:
    DetailPrint "Instalação do driver CP210x ignorada pelo usuário."

  driverDone:
!macroend
