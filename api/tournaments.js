// API для работы с турнирами
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

// Автоматическое добавление поля start_time если его нет
async function ensureStartTimeColumn() {
    try {
        await pool.query(`ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS start_time TIME`);
    } catch (e) {
        // Колонка уже существует
    }
}

// Автоматическое добавление поля image_url если его нет
async function ensureImageUrlColumn() {
    try {
        await pool.query(`ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS image_url TEXT`);
    } catch (e) {
        // Колонка уже существует
    }
}

module.exports = async (req, res) => {
    // Автоматическая миграция при первом запросе
    await ensureStartTimeColumn();
    await ensureImageUrlColumn();
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - получить все турниры
        if (req.method === 'GET') {
            const { status } = req.query;
            
            let query = 'SELECT * FROM tournaments';
            let params = [];
            
            if (status) {
                query += ' WHERE status = $1';
                params = [status];
            }
            
            query += ' ORDER BY date ASC';
            
            const result = await pool.query(query, params);
            
            // Сортируем результаты по дате (от ближайших к дальнейшим)
            // Парсим даты для корректной сортировки (поддерживаем разные форматы)
            result.rows.sort((a, b) => {
                const parseDate = (dateStr) => {
                    // Формат YYYY-MM-DD
                    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        return new Date(dateStr);
                    }
                    // Русский формат "день месяц год г."
                    const russianMatch = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
                    if (russianMatch) {
                        const months = {
                            'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
                            'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
                            'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
                        };
                        const day = parseInt(russianMatch[1]);
                        const month = months[russianMatch[2].toLowerCase()];
                        const year = parseInt(russianMatch[3]);
                        if (month !== undefined) {
                            return new Date(year, month, day);
                        }
                    }
                    // Fallback: пытаемся парсить как Date
                    return new Date(dateStr);
                };
                
                const dateA = parseDate(a.date);
                const dateB = parseDate(b.date);
                
                // Если есть start_time, учитываем его
                if (a.start_time && b.start_time) {
                    const timeA = a.start_time.match(/(\d{1,2}):(\d{2})/);
                    const timeB = b.start_time.match(/(\d{1,2}):(\d{2})/);
                    if (timeA && timeB) {
                        dateA.setHours(parseInt(timeA[1]), parseInt(timeA[2]), 0, 0);
                        dateB.setHours(parseInt(timeB[1]), parseInt(timeB[2]), 0, 0);
                    }
                }
                
                return dateA - dateB;
            });
            
            // Автоматически создаем события календаря для активных турниров без события
            for (const tournament of result.rows) {
                if (tournament.status === 'active' && tournament.date) {
                    try {
                        const existingEvent = await pool.query(
                            'SELECT id FROM calendar_events WHERE tournament_id = $1',
                            [tournament.id]
                        );
                        
                        if (existingEvent.rows.length === 0) {
                            // Преобразуем дату в YYYY-MM-DD для calendar_events
                            let eventDateStr = null;
                            try {
                                const months = {
                                    'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
                                    'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
                                    'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
                                };
                                const russianFormat = tournament.date.match(/(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s+г\.)?/);
                                if (russianFormat) {
                                    const day = russianFormat[1].padStart(2, '0');
                                    const month = months[russianFormat[2].toLowerCase()];
                                    const year = russianFormat[3];
                                    if (month) {
                                        eventDateStr = `${year}-${month}-${day}`;
                                    }
                                } else if (tournament.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                    eventDateStr = tournament.date;
                                }
                            } catch (e) {
                                console.error('Ошибка парсинга даты:', e);
                            }
                            
                            if (eventDateStr) {
                                await pool.query(
                                    `INSERT INTO calendar_events (title, description, event_date, image_url, discipline, prize, max_teams, registration_link, custom_link, tournament_id, start_time, watch_url)
                                     VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                                    [tournament.title, null, eventDateStr, null, tournament.discipline || null, tournament.prize || null, tournament.max_teams || null, null, tournament.custom_link || null, tournament.id, tournament.start_time || null, tournament.watch_url || null]
                                );
                                console.log(`✅ Создано событие календаря для турнира ${tournament.id}`);
                            }
                        }
                    } catch (err) {
                        console.error(`Ошибка миграции для турнира ${tournament.id}:`, err);
                    }
                }
            }
            
            return res.status(200).json(result.rows);
        }
        
        // POST - создать турнир
        if (req.method === 'POST') {
            const { title, discipline, date, prize, maxTeams, customLink, status, winner, watchUrl, description, imageUrl, startTime, teams } = req.body;
            
            // Для прошедших турниров используем указанное количество команд, для активных - 0
            const teamsCount = (status === 'finished' && teams !== undefined) ? teams : 0;
            
            const result = await pool.query(
                `INSERT INTO tournaments 
                (title, discipline, date, prize, max_teams, custom_link, status, winner, teams, watch_url, start_time, image_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *`,
                [title, discipline, date, prize, maxTeams, customLink || null, status || 'active', winner || null, teamsCount, watchUrl || null, startTime || null, imageUrl || null]
            );
            
            const tournament = result.rows[0];
            
            // Автоматически создаём событие календаря для активных турниров
            if (tournament.status === 'active' && date) {
                try {
                    // Проверяем, нет ли уже события для этого турнира
                    const existingEvent = await pool.query(
                        'SELECT id FROM calendar_events WHERE tournament_id = $1',
                        [tournament.id]
                    );
                    
                    if (existingEvent.rows.length === 0) {
                        // Преобразуем дату в YYYY-MM-DD для calendar_events
                        let eventDateStr = null;
                        try {
                            const months = {
                                'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
                                'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
                                'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
                            };
                            console.log(`📅 Создание события календаря для турнира ${tournament.id}, дата: "${date}"`);
                            // Парсим "день месяц год г."
                            const russianFormat = date.match(/(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s+г\.)?/);
                            if (russianFormat) {
                                const day = russianFormat[1].padStart(2, '0');
                                const month = months[russianFormat[2].toLowerCase()];
                                const year = russianFormat[3];
                                if (month) {
                                    eventDateStr = `${year}-${month}-${day}`;
                                    console.log(`✅ Преобразовано: ${eventDateStr}`);
                                } else {
                                    console.log(`❌ Неизвестный месяц: ${russianFormat[2]}`);
                                }
                            } else if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                // Уже в формате YYYY-MM-DD
                                eventDateStr = date;
                                console.log(`✅ Уже в формате YYYY-MM-DD: ${eventDateStr}`);
                            } else {
                                console.log(`❌ Не удалось распарсить дату: "${date}"`);
                            }
                        } catch (e) {
                            console.error('Ошибка парсинга даты:', e);
                        }
                        
                        if (eventDateStr) {
                            await pool.query(
                                `INSERT INTO calendar_events (title, description, event_date, image_url, discipline, prize, max_teams, registration_link, custom_link, tournament_id, start_time, watch_url)
                                 VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                                [title, description || null, eventDateStr, imageUrl || null, discipline || null, prize || null, maxTeams || null, null, customLink || null, tournament.id, startTime || null, watchUrl || null]
                            );
                            console.log(`✅ Создано событие календаря для турнира ${tournament.id}`);
                        } else {
                            console.log(`⚠️ Не создано событие календаря для турнира ${tournament.id} - не удалось распарсить дату`);
                        }
                    } else {
                        console.log(`⚠️ Событие календаря уже существует для турнира ${tournament.id}`);
                    }
                } catch (err) {
                    console.error('Ошибка создания события календаря:', err);
                }
            }
            
            return res.status(201).json(tournament);
        }
        
        // PUT - обновить турнир
        if (req.method === 'PUT') {
            const { id, title, discipline, date, prize, maxTeams, customLink, status, winner, watchUrl, startTime, imageUrl, teams } = req.body;
            
            // Если обновляется прошедший турнир и указано teams, обновляем его
            // Если статус меняется на finished и указано teams, обновляем
            // Иначе оставляем текущее значение teams (не обновляем для активных турниров)
            const values = [title, discipline, date, prize, maxTeams, customLink || null, status, winner || null, watchUrl || null, startTime || null, imageUrl || null];
            
            let updateQuery = `UPDATE tournaments 
                SET title = $1, discipline = $2, date = $3, prize = $4, 
                    max_teams = $5, custom_link = $6, status = $7, winner = $8, watch_url = $9, start_time = $10, image_url = $11`;
            
            // Если статус finished и указано teams, обновляем teams
            if (status === 'finished' && teams !== undefined) {
                updateQuery += `, teams = $12`;
                values.push(teams);
            }
            
            updateQuery += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length + 1} RETURNING *`;
            values.push(id);
            
            const result = await pool.query(updateQuery, values);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Турнир не найден' });
            }
            
            const tournament = result.rows[0];
            
            // Обновляем или удаляем связанное событие календаря
            if (tournament.status === 'active' && date) {
                try {
                    // Преобразуем дату в YYYY-MM-DD для calendar_events
                    let eventDateStr = null;
                    try {
                        const months = {
                            'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
                            'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
                            'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
                        };
                        // Парсим "день месяц год г."
                        const russianFormat = date.match(/(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s+г\.)?/);
                        if (russianFormat) {
                            const day = russianFormat[1].padStart(2, '0');
                            const month = months[russianFormat[2].toLowerCase()];
                            const year = russianFormat[3];
                            if (month) {
                                eventDateStr = `${year}-${month}-${day}`;
                            }
                        } else if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            // Уже в формате YYYY-MM-DD
                            eventDateStr = date;
                        }
                    } catch (e) {
                        console.error('Ошибка парсинга даты:', e);
                    }
                    
                    if (eventDateStr) {
                        await pool.query(
                            `UPDATE calendar_events 
                             SET title = $1, description = $2, event_date = $3::date, image_url = $4, discipline = $5, prize = $6, max_teams = $7, custom_link = $8, start_time = $9, watch_url = $10, updated_at = CURRENT_TIMESTAMP
                             WHERE tournament_id = $11`,
                            [title, req.body.description || null, eventDateStr, req.body.imageUrl || null, discipline || null, prize || null, maxTeams || null, customLink || null, startTime || null, watchUrl || null, id]
                        );
                    }
                } catch (err) {
                    console.error('Ошибка обновления события календаря:', err);
                }
            } else if (tournament.status === 'finished') {
                // Если турнир переносится в архив - удаляем событие календаря
                try {
                    await pool.query('DELETE FROM calendar_events WHERE tournament_id = $1', [id]);
                    console.log(`🗑️ Удалено событие календаря для турнира ${id}`);
                } catch (err) {
                    console.error('Ошибка удаления события календаря:', err);
                }
            }
            
            return res.status(200).json(tournament);
        }
        
        // DELETE - удалить турнир
        if (req.method === 'DELETE') {
            const { id } = req.query;
            
            // Удаляем связанное событие календаря
            try {
                await pool.query('DELETE FROM calendar_events WHERE tournament_id = $1', [id]);
            } catch (err) {
                console.error('Ошибка удаления события календаря:', err);
            }
            
            const result = await pool.query('DELETE FROM tournaments WHERE id = $1 RETURNING *', [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Турнир не найден' });
            }
            
            return res.status(200).json({ message: 'Турнир удалён', tournament: result.rows[0] });
        }
        
        return res.status(405).json({ error: 'Метод не поддерживается' });
        
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
};

