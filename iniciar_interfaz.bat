@echo off
title Analizador S-21 - Servidor de Interfaz Web
chcp 65001 > nul
echo ========================================================
echo         Iniciando Analizador de Tarjetas S-21
echo ========================================================
echo.

REM Cerrar servidores anteriores en puertos 8000-8009
for /L %%P in (8000,1,8009) do (
    for /f "tokens=5" %%A in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
        taskkill /F /PID %%A >nul 2>&1
    )
)

python "%~dp0server.py"
pause
