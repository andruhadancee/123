-- Добавление поля названия регламента
ALTER TABLE regulations 
ADD COLUMN IF NOT EXISTS regulation_name VARCHAR(255);

-- Если хотите, чтобы название было обязательным для новых записей:
-- ALTER TABLE regulations 
-- ALTER COLUMN regulation_name SET NOT NULL;

-- Если нужно добавить значение по умолчанию для существующих записей:
-- UPDATE regulations 
-- SET regulation_name = discipline_name 
-- WHERE regulation_name IS NULL OR regulation_name = '';

