@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add -A
git commit -m "Replace dots with animated chubriki images on background"
git push

echo ГОТОВО! Изменения запушены.
pause

