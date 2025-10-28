@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add .
git commit -m "Add regulations, filters, timers, animations and all requested features"
git push

echo ГОТОВО! Теперь иди в Vercel Settings и поставь:
echo Build Command: пустое
echo Output Directory: . (точка)
pause

