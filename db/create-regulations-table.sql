-- Создание таблицы regulations для базы данных
CREATE TABLE IF NOT EXISTS regulations (
    id SERIAL PRIMARY KEY,
    discipline_name VARCHAR(100) NOT NULL,
    pdf_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_regulations_discipline ON regulations(discipline_name);

