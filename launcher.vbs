Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\TOOL\AI"
WshShell.Run "python server.py", 0, False
Set WshShell = Nothing