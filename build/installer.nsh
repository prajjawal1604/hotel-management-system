!macro customInit
  nsExec::Exec 'netsh advfirewall firewall add rule name="Hotel Management System" dir=in action=allow program="$INSTDIR\Hotel Management System.exe" enable=yes'
  nsExec::Exec 'netsh advfirewall firewall add rule name="Hotel Management System" dir=out action=allow program="$INSTDIR\Hotel Management System.exe" enable=yes'
!macroend