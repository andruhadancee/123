@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add .
git commit -m "Change nav buttons to border style matching card outline"
git push

echo ГОТОВО! Теперь иди в Vercel Settings и поставь:
echo Build Command: пустое
echo Output Directory: . (точка)
pause

