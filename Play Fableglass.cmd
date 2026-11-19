@echo off
setlocal
set "FABLEGLASS_APP_DIR=%~dp0Fableglass"
if not exist "%FABLEGLASS_APP_DIR%\fableglass-q8.gguf" goto setup
if not exist "%FABLEGLASS_APP_DIR%\runtime\llama-server.exe" goto setup
powershell.exe -NoProfile -Command "$ErrorActionPreference = 'Stop'; $p = Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList 'server.mjs' -WorkingDirectory $env:FABLEGLASS_APP_DIR -WindowStyle Hidden -PassThru; if ($p.WaitForExit(2000)) { exit $p.ExitCode }"
if errorlevel 1 (
    echo Fableglass could not start. Run node Fableglass\server.mjs --no-open in a terminal to see the error.
    pause
)
exit /b

:setup
echo Run Setup Fableglass.ps1 first.
pause
exit /b 1
