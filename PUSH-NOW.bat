@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add .
git commit -m "Complete feature set: regulations, filters, timers, animations, particles, skeleton loader"
git push

echo ГОТОВО! Теперь иди в Vercel Settings и поставь:
echo Build Command: пустое
echo Output Directory: . (точка)
pause

