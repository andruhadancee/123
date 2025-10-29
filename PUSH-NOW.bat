@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add .
git commit -m "Simplify card animation - smooth slide up, shorter delays"
git push

echo ГОТОВО! Теперь иди в Vercel Settings и поставь:
echo Build Command: пустое
echo Output Directory: . (точка)
pause

