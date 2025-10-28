@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ====================================
echo   REDEPLOY - Принудительный деплой
echo ====================================
echo.

echo Создаём пустой коммит для редеплоя...
git commit --allow-empty -m "Redeploy: Force Vercel to rebuild"
echo.

echo Push на GitHub...
git push origin main
echo.

echo ====================================
echo   ГОТОВО! Vercel начнёт деплой через 5 сек!
echo ====================================
pause

