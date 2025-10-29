@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo     PUSH TO GITHUB AND VERCEL
echo ============================================
echo.

git add .
git commit -m "Make loader screen brighter with purple gradient and visible effects"
git push

echo.
echo ============================================
echo     ✅ ГОТОВО! Изменения запушены
echo ============================================
echo.
echo Подыскивается в Vercel... Подожди 1-2 минуты
echo и обнови страницу (F5 или Ctrl+F5)
echo.
pause

