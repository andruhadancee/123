@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add .
git commit -m "Use local game logos (Dota 2, CS 2, MLBB) and gamepad emoji for others"
git push

echo ГОТОВО! Теперь иди в Vercel Settings и поставь:
echo Build Command: пустое
echo Output Directory: . (точка)
pause

