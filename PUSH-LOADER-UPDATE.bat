@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add -A
git commit -m "Update loader: remove pulse, add same animations as main background, fix colors"
git push

echo ГОТОВО! Изменения запушены.
echo Теперь загрузчик использует те же анимации, что и основной фон.
pause

