-- Добавление поля времени начала турнира по МСК
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS start_time TIME;

ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS start_time TIME;

