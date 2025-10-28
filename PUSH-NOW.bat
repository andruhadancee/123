@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add .
git commit -m "Fix navigation: fit 3 buttons in one row on mobile, align header on desktop"
git push

echo ГОТОВО! Теперь иди в Vercel Settings и поставь:
echo Build Command: пустое
echo Output Directory: . (точка)
pause

