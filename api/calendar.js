// API для работы с календарём активностей
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            const { month } = req.query; // YYYY-MM
            let query = 'SELECT * FROM calendar_events';
            const params = [];
            if (month) {
                query += ' WHERE to_char(event_date, "YYYY-MM") = $1';
                params.push(month);
            }
            query += ' ORDER BY event_date ASC, created_at DESC';
            const result = await pool.query(query, params);
            return res.status(200).json(result.rows);
        }

        if (req.method === 'POST') {
            const { title, description, eventDate, imageUrl } = req.body;
            if (!title || !eventDate) {
                return res.status(400).json({ error: 'title и eventDate обязательны' });
            }
            const result = await pool.query(
                `INSERT INTO calendar_events (title, description, event_date, image_url)
                 VALUES ($1, $2, $3::date, $4)
                 RETURNING *`,
                [title, description || null, eventDate, imageUrl || null]
            );
            return res.status(201).json(result.rows[0]);
        }

        if (req.method === 'PUT') {
            const { id, title, description, eventDate, imageUrl } = req.body;
            const result = await pool.query(
                `UPDATE calendar_events
                 SET title = $1, description = $2, event_date = $3::date, image_url = $4, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $5
                 RETURNING *`,
                [title, description || null, eventDate, imageUrl || null, id]
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


