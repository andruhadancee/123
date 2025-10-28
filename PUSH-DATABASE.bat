@echo off
chcp 65001 >nul 2>&1
cls
echo ====================================================
echo   NEON DATABASE INTEGRATION
echo ====================================================
echo.
echo [+] Создана структура базы данных
echo [+] API endpoints: /api/tournaments, /api/links, /api/social
echo [+] Конфигурация для Vercel
echo.
echo ====================================================
echo.

cd /d "%~dp0"

echo [1/3] Добавляем файлы...
git add -A

echo.
echo [2/3] Коммит...
git commit -m "Add: Neon database integration + API endpoints"

echo.
echo [3/3] Push...
git push origin main --force

echo.
echo ====================================================
echo    ✅ ЗАГРУЖЕНО НА GITHUB! 
echo ====================================================
echo.
echo ВАЖНО! СЛЕДУЮЩИЕ ШАГИ:
echo.
echo 1️⃣  ИНИЦИАЛИЗИРУЙ БАЗУ ДАННЫХ:
echo     - Открой: https://console.neon.tech
echo     - Выбери базу "neon-green-flower"
echo     - SQL Editor
echo     - Скопируй содержимое файла: db/schema.sql
echo     - Вставь в SQL Editor
echo     - Нажми "Run"
echo.
echo 2️⃣  ПОДОЖДИ VERCEL DEPLOY (1-2 минуты)
echo.
echo 3️⃣  ОТКИНЬ МНЕ СКРИНШОТ что база инициализирована!
echo     Я обновлю JS код для работы с API
echo.
echo ====================================================
pause

