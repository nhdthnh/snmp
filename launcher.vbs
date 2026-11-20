Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
ScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

WshShell.Run "powershell.exe -WindowStyle Hidden -Command ""$p = Get-NetTCPConnection -LocalPort 8088-ErrorAction SilentlyContinue; if ($p) { Stop-Process -Id $p.OwningProcess -Force -ErrorAction SilentlyContinue }""", 0, True
WshShell.Run "powershell.exe -WindowStyle Hidden -Command ""Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'cmd.exe' -and $_.CommandLine -like '*run_app.bat*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }""", 0, True
WScript.Sleep 1500
WshShell.CurrentDirectory = ScriptDir
WshShell.Run "cmd /c """ & ScriptDir & "\run_app.bat""", 0
Set WshShell = Nothing