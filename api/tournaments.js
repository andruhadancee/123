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

module.exports = async (req, res) => {
    // Автоматическая миграция при первом запросе
    await ensureStartTimeColumn();
    
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
            
            query += ' ORDER BY created_at DESC';
            
            const result = await pool.query(query, params);
            return res.status(200).json(result.rows);
        }
        
        // POST - создать турнир
        if (req.method === 'POST') {
            const { title, discipline, date, prize, maxTeams, customLink, status, winner, watchUrl, description, imageUrl, startTime } = req.body;
            
            const result = await pool.query(
                `INSERT INTO tournaments 
                (title, discipline, date, prize, max_teams, custom_link, status, winner, teams, watch_url, start_time)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10)
                RETURNING *`,
                [title, discipline, date, prize, maxTeams, customLink || null, status || 'active', winner || null, watchUrl || null, startTime || null]
            );
            
            const tournament = result.rows[0];
            
            // Автоматически создаём событие календаря для активных турниров
            if (tournament.status === 'active' && date) {
                try {
                    await pool.query(
                        `INSERT INTO calendar_events (title, description, event_date, image_url, discipline, prize, max_teams, registration_link, custom_link, tournament_id, start_time)
                         VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, $11)
                         ON CONFLICT DO NOTHING`,
                        [title, description || null, date, imageUrl || null, discipline || null, prize || null, maxTeams || null, null, customLink || null, tournament.id, startTime || null]
                    );
                } catch (err) {
                    console.error('Ошибка создания события календаря:', err);
                }
            }
            
            return res.status(201).json(tournament);
        }
        
        // PUT - обновить турнир
        if (req.method === 'PUT') {
            const { id, title, discipline, date, prize, maxTeams, customLink, status, winner, watchUrl, startTime } = req.body;
            
            const result = await pool.query(
                `UPDATE tournaments 
                SET title = $1, discipline = $2, date = $3, prize = $4, 
                    max_teams = $5, custom_link = $6, status = $7, winner = $8, watch_url = $9, start_time = $10, updated_at = CURRENT_TIMESTAMP
                WHERE id = $11
                RETURNING *`,
                [title, discipline, date, prize, maxTeams, customLink || null, status, winner || null, watchUrl || null, startTime || null, id]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Турнир не найден' });
            }
            
            const tournament = result.rows[0];
            
            // Обновляем связанное событие календаря
            if (tournament.status === 'active' && date) {
                try {
                    await pool.query(
                        `UPDATE calendar_events 
                         SET title = $1, description = $2, event_date = $3::date, image_url = $4, discipline = $5, prize = $6, max_teams = $7, custom_link = $8, start_time = $9, updated_at = CURRENT_TIMESTAMP
                         WHERE tournament_id = $10`,
                        [title, req.body.description || null, date, req.body.imageUrl || null, discipline || null, prize || null, maxTeams || null, customLink || null, startTime || null, id]
                    );
                } catch (err) {
                    console.error('Ошибка обновления события календаря:', err);
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

