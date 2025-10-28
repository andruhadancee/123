@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add .
git commit -m "Fix team API to not require captain and date fields"
git push

echo ГОТОВО! Теперь иди в Vercel Settings и поставь:
echo Build Command: пустое
echo Output Directory: . (точка)
pause

