-- Добавление поля watch_url в таблицу tournaments

ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS watch_url TEXT;

-- Проверка: посмотреть структуру таблицы
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'tournaments';

