@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add .
git commit -m "Fix timer to support Russian date format (e.g. 9 ноября 2025 г.)"
git push

echo ГОТОВО! Теперь иди в Vercel Settings и поставь:
echo Build Command: пустое
echo Output Directory: . (точка)
pause

