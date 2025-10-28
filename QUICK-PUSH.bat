@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo 🚀 Быстрый Push на GitHub...
echo.

git add .
git commit -m "Fix: vercel.json configuration"
git push

echo.
echo ✅ Готово! Vercel автоматически подхватит изменения
echo.
pause

