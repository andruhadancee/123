@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add -A
git commit -m "Restore smooth particle animation + add subtle decorative images"
git push

echo ГОТОВО! Изменения запушены.
pause

