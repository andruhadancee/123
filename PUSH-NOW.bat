@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add .
git commit -m "Increase mobile navigation buttons size (font + padding)"
git push

echo ГОТОВО! Теперь иди в Vercel Settings и поставь:
echo Build Command: пустое
echo Output Directory: . (точка)
pause

