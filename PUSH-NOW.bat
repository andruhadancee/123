@echo off
chcp 65001 >nul 2>&1
cls
echo ====================================================
echo   ЗАГРУЗКА ФАЙЛОВ + ИНСТРУКЦИИ
echo ====================================================
echo.

cd /d "%~dp0"

echo [1/3] Добавляем файлы...
git add -A

echo.
echo [2/3] Коммит...
git commit -m "Add: CLEAR-AND-RESTART.html для очистки localStorage"

echo.
echo [3/3] Отправка...
git push origin main --force

echo.
echo ====================================================
echo    ✅ ЗАГРУЖЕНО! 
echo ====================================================
echo.
echo СЕЙЧАС СДЕЛАЙ ТАК (через 1-2 минуты):
echo.
echo 1️⃣  Открой файл CLEAR-AND-RESTART.html
echo     (локально - двойной клик)
echo.
echo 2️⃣  Нажми "Очистить localStorage"
echo.
echo 3️⃣  Открой админку (кнопка в файле)
echo.
echo 4️⃣  Настрой ЗАНОВО:
echo     - Ссылки на формы (РЕАЛЬНЫЕ ссылки!)
echo     - Социальные кнопки
echo     - Турниры
echo.
echo 5️⃣  Обнови сайт (Ctrl+Shift+R)
echo.
echo ====================================================
pause

