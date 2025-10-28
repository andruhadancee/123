@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add .
git commit -m "Shorten navigation text and add Regulations button"
git push

echo ГОТОВО! Теперь иди в Vercel Settings и поставь:
echo Build Command: пустое
echo Output Directory: . (точка)
pause

