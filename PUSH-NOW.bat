@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add .
git commit -m "Fix add discipline button + replace all pink colors with dark purple (#8b5abf)"
git push

echo ГОТОВО! Теперь иди в Vercel Settings и поставь:
echo Build Command: пустое
echo Output Directory: . (точка)
pause

