@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add .
git commit -m "Add filters to teams page + redesign team cards + add animations to all pages"
git push

echo ГОТОВО! Теперь иди в Vercel Settings и поставь:
echo Build Command: пустое
echo Output Directory: . (точка)
pause

