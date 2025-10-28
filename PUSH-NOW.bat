@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add .
git commit -m "Fix mobile navigation: reduce button size to fit in one row"
git push

echo ГОТОВО! Теперь иди в Vercel Settings и поставь:
echo Build Command: пустое
echo Output Directory: . (точка)
pause

