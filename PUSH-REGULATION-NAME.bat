@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add -A
git commit -m "Add regulation name field + remove calendar button and grid background"
git push

echo ГОТОВО! Изменения запушены.
echo.
echo ВАЖНО: Теперь нужно выполнить SQL скрипт в Neon SQL Editor:
echo db/add-regulation-name.sql
echo.
pause

