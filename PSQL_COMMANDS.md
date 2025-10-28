# 🗄️ Полезные команды PostgreSQL (psql)

## 🔌 Подключение

```bash
psql 'postgresql://neondb_owner:npg_8UamG3Noelwx@ep-lucky-unit-aeydxdjf-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'
```

---

## ✅ Проверка таблиц

### Показать все таблицы
```sql
\dt
```

Должно показать:
- tournaments
- disciplines
- registration_links
- social_links
- registered_teams

### Описание таблицы
```sql
\d tournaments
\d disciplines
\d registration_links
\d social_links
\d registered_teams
```

---

## 📊 Проверка данных

### Посмотреть все дисциплины (должны быть по умолчанию)
```sql
SELECT * FROM disciplines;
```

Должно показать:
- CS 2
- Dota 2
- Valorant
- Overwatch 2
- League of Legends

### Посмотреть все турниры
```sql
SELECT * FROM tournaments;
```

### Посмотреть только активные турниры
```sql
SELECT * FROM tournaments WHERE status = 'active';
```

### Посмотреть прошедшие турниры
```sql
SELECT * FROM tournaments WHERE status = 'finished';
```

### Посмотреть все команды
```sql
SELECT * FROM registered_teams;
```

### Посмотреть команды конкретного турнира
```sql
SELECT * FROM registered_teams WHERE tournament_id = 1;
```

---

## 🧪 Тестовые данные (для проверки)

### Добавить тестовый турнир
```sql
INSERT INTO tournaments (title, discipline, date, prize, max_teams, status, teams, custom_link)
VALUES ('Тестовый турнир CS2', 'CS 2', '15 декабря 2025 г.', '50 000 ₽', 32, 'active', 0, NULL);
```

### Добавить тестовую команду
```sql
-- Сначала узнайте ID турнира
SELECT id, title FROM tournaments WHERE status = 'active';

-- Затем добавьте команду (замените 1 на реальный ID)
INSERT INTO registered_teams (tournament_id, name, captain, players, registration_date)
VALUES (1, 'Test Team', 'Иванов И.И.', 5, '01.11.2025');
```

### Добавить ссылку на регистрацию
```sql
INSERT INTO registration_links (discipline, link)
VALUES ('CS 2', 'https://forms.gle/example')
ON CONFLICT (discipline) DO UPDATE SET link = EXCLUDED.link;
```

### Добавить социальную ссылку
```sql
INSERT INTO social_links (platform, link)
VALUES ('twitch', 'https://twitch.tv/wbcyberclub')
ON CONFLICT (platform) DO UPDATE SET link = EXCLUDED.link;
```

---

## 🗑️ Удаление данных (осторожно!)

### Удалить все турниры
```sql
DELETE FROM tournaments;
```

### Удалить все команды
```sql
DELETE FROM registered_teams;
```

### Удалить конкретный турнир
```sql
DELETE FROM tournaments WHERE id = 1;
```

---

## 🔄 Обновление данных

### Изменить турнир
```sql
UPDATE tournaments 
SET prize = '100 000 ₽', max_teams = 64 
WHERE id = 1;
```

### Переместить турнир в архив
```sql
UPDATE tournaments 
SET status = 'finished', winner = 'Team Spirit' 
WHERE id = 1;
```

---

## 📊 Статистика

### Подсчитать количество турниров
```sql
SELECT 
    status, 
    COUNT(*) as count 
FROM tournaments 
GROUP BY status;
```

### Подсчитать команды по турнирам
```sql
SELECT 
    t.title, 
    COUNT(rt.id) as teams_count 
FROM tournaments t
LEFT JOIN registered_teams rt ON t.id = rt.tournament_id
GROUP BY t.id, t.title;
```

### Топ дисциплин по количеству турниров
```sql
SELECT 
    discipline, 
    COUNT(*) as tournaments_count 
FROM tournaments 
GROUP BY discipline 
ORDER BY tournaments_count DESC;
```

---

## 🔧 Служебные команды

### Проверка подключения
```sql
SELECT NOW();
```

### Информация о версии PostgreSQL
```sql
SELECT version();
```

### Список всех баз данных
```sql
\l
```

### Выход из psql
```sql
\q
```
или просто Ctrl+D

---

## 📝 Примеры полезных запросов

### Получить все турниры с количеством команд
```sql
SELECT 
    t.id,
    t.title,
    t.discipline,
    t.date,
    t.status,
    COUNT(rt.id) as registered_teams
FROM tournaments t
LEFT JOIN registered_teams rt ON t.id = rt.tournament_id
GROUP BY t.id
ORDER BY t.created_at DESC;
```

### Получить турниры без зарегистрированных команд
```sql
SELECT t.*
FROM tournaments t
LEFT JOIN registered_teams rt ON t.id = rt.tournament_id
WHERE rt.id IS NULL AND t.status = 'active';
```

### Получить последние 5 добавленных турниров
```sql
SELECT * FROM tournaments 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 🧹 Полная очистка (сброс к начальному состоянию)

**⚠️ ВНИМАНИЕ: Удалит ВСЕ данные!**

```sql
-- Удалить все данные из всех таблиц
TRUNCATE TABLE registered_teams CASCADE;
TRUNCATE TABLE registration_links CASCADE;
TRUNCATE TABLE social_links CASCADE;
TRUNCATE TABLE tournaments CASCADE;

-- Дисциплины НЕ трогаем, они нужны!
-- Или можно пересоздать:
DELETE FROM disciplines;
INSERT INTO disciplines (name) VALUES 
    ('CS 2'),
    ('Dota 2'),
    ('Valorant'),
    ('Overwatch 2'),
    ('League of Legends');
```

---

## 🔐 Экспорт/Импорт данных

### Экспорт всех турниров в CSV
```sql
\copy (SELECT * FROM tournaments) TO '/path/to/tournaments.csv' CSV HEADER;
```

### Импорт из CSV
```sql
\copy tournaments FROM '/path/to/tournaments.csv' CSV HEADER;
```

---

## 💡 Подсказки

- В psql можно нажать **↑** для просмотра истории команд
- **Tab** для автодополнения
- **\?** для списка всех команд psql
- **\h SELECT** для справки по SQL командам
- Точка с запятой **;** обязательна в конце SQL команд
- Можно писать команды на нескольких строках

---

## 🎯 Быстрая проверка после инициализации

```sql
-- 1. Проверить таблицы
\dt

-- 2. Проверить дисциплины (должно быть 5)
SELECT COUNT(*) FROM disciplines;

-- 3. Проверить структуру tournaments
\d tournaments

-- 4. Готово!
\q
```

---

## 📞 Если нужна помощь

- Документация PostgreSQL: [postgresql.org/docs](https://www.postgresql.org/docs/)
- Документация Neon: [neon.tech/docs](https://neon.tech/docs)
- Ваша строка подключения сохранена в переменных окружения Vercel

**Успехов! 🚀**

