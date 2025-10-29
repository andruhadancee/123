@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add .
git commit -m "Make tournament cards slide up from much further below (50px)"
git push

echo ГОТОВО! Теперь иди в Vercel Settings и поставь:
echo Build Command: пустое
echo Output Directory: . (точка)
pause

