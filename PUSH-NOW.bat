@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add .
git commit -m "Remove delete buttons from links form + add dark purple input styling"
git push

echo ГОТОВО! Теперь иди в Vercel Settings и поставь:
echo Build Command: пустое
echo Output Directory: . (точка)
pause

