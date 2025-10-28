@echo off
chcp 65001 >nul 2>&1
cls
echo ====================================
echo    WB Cyber Club - Wave Animation
echo ====================================
echo.

cd /d "%~dp0"

echo Добавляем все файлы...
git add -A

echo.
echo Создаём коммит...
git commit -m "Wave animation background"

echo.
echo Отправляем на GitHub...
git push origin main --force

echo.
echo ====================================
echo ГОТОВО! Обновления на Vercel через 1 мин
echo ====================================
echo.
pause

