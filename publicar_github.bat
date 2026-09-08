@echo off
chcp 65001 > nul
echo Publicar analizador-s21 en GitHub
echo.
where gh >nul 2>&1
if errorlevel 1 (
    echo GitHub CLI no instalado. Instale desde: https://cli.github.com/
    echo Luego: gh auth login
    echo        gh repo create analizador-s21 --public --source=. --remote=origin --push
    pause
    exit /b 1
)
gh auth status
if errorlevel 1 (
    echo Ejecute: gh auth login
    pause
    exit /b 1
)
gh repo create analizador-s21 --public --source=. --remote=origin --push
echo.
echo Repositorio publicado.
pause
