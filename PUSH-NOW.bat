@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add .
git commit -m "Fix teams page: add discipline info and make cards lighter"
git push

echo ГОТОВО! Теперь иди в Vercel Settings и поставь:
echo Build Command: пустое
echo Output Directory: . (точка)
pause

