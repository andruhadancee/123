// API для работы с календарём активностей
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function ensureTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS calendar_events (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            event_date DATE NOT NULL,
            image_url TEXT,
            discipline VARCHAR(100),
            prize VARCHAR(100),
            max_teams INTEGER,
            registration_link TEXT,
            custom_link TEXT,
            tournament_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    // Добавляем новые колонки, если их нет
    try {
        await pool.query(`ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS discipline VARCHAR(100)`);
        await pool.query(`ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS prize VARCHAR(100)`);
        await pool.query(`ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS max_teams INTEGER`);
        await pool.query(`ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS registration_link TEXT`);
        await pool.query(`ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS custom_link TEXT`);
        await pool.query(`ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS tournament_id INTEGER`);
    } catch (e) {
        // Колонки уже существуют
    }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        await ensureTable();
        if (req.method === 'GET') {
            const { month } = req.query; // YYYY-MM
            let query = 'SELECT * FROM calendar_events';
            const params = [];
            if (month) {
                query += " WHERE to_char(event_date, 'YYYY-MM') = $1";
                params.push(month);
            }
            query += ' ORDER BY event_date ASC, created_at DESC';
            const result = await pool.query(query, params);
            return res.status(200).json(result.rows);
        }

        if (req.method === 'POST') {
            const { title, description, eventDate, imageUrl, discipline, prize, maxTeams, registrationLink, customLink } = req.body;
            if (!title || !eventDate) {
                return res.status(400).json({ error: 'title и eventDate обязательны' });
            }
            
            let tournamentId = null;
            // Автоматически создаём турнир, если указаны обязательные поля
            if (discipline && prize && maxTeams) {
                try {
                    const tournamentResult = await pool.query(
                        `INSERT INTO tournaments (title, discipline, date, prize, max_teams, custom_link, status, teams)
                         VALUES ($1, $2, $3, $4, $5, $6, 'active', 0)
                         RETURNING id`,
                        [title, discipline, eventDate, prize, maxTeams, customLink || registrationLink || null]
                    );
                    tournamentId = tournamentResult.rows[0].id;
                } catch (err) {
                    console.error('Ошибка создания турнира:', err);
                }
            }
            
            const result = await pool.query(
                `INSERT INTO calendar_events (title, description, event_date, image_url, discipline, prize, max_teams, registration_link, custom_link, tournament_id)
                 VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10)
                 RETURNING *`,
                [title, description || null, eventDate, imageUrl || null, discipline || null, prize || null, maxTeams || null, registrationLink || null, customLink || null, tournamentId]
            );
            return res.status(201).json(result.rows[0]);
        }

        if (req.method === 'PUT') {
            const { id, title, description, eventDate, imageUrl, discipline, prize, maxTeams, registrationLink, customLink } = req.body;
            
            // Обновляем связанный турнир, если он существует
            const currentEvent = await pool.query('SELECT tournament_id FROM calendar_events WHERE id = $1', [id]);
            if (currentEvent.rows.length > 0 && currentEvent.rows[0].tournament_id) {
                try {
                    await pool.query(
                        `UPDATE tournaments 
                         SET title = $1, discipline = $2, date = $3, prize = $4, max_teams = $5, custom_link = $6, updated_at = CURRENT_TIMESTAMP
                         WHERE id = $7`,
                        [title, discipline || null, eventDate, prize || null, maxTeams || null, customLink || registrationLink || null, currentEvent.rows[0].tournament_id]
                    );
                } catch (err) {
                    console.error('Ошибка обновления турнира:', err);
                }
            }
            
            const result = await pool.query(
                `UPDATE calendar_events
                 SET title = $1, description = $2, event_date = $3::date, image_url = $4, discipline = $5, prize = $6, max_teams = $7, registration_link = $8, custom_link = $9, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $10
                 RETURNING *`,
                [title, description || null, eventDate, imageUrl || null, discipline || null, prize || null, maxTeams || null, registrationLink || null, customLink || null, id]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'Событие не найдено' });
            return res.status(200).json(result.rows[0]);
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            const result = await pool.query('DELETE FROM calendar_events WHERE id = $1 RETURNING *', [id]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Событие не найдено' });
            return res.status(200).json({ message: 'Удалено', event: result.rows[0] });
        }

        return res.status(405).json({ error: 'Метод не поддерживается' });
    } catch (error) {
        console.error('Calendar API error:', error);
        return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
};


