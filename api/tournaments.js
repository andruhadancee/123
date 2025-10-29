// API для работы с турнирами
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
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
            const { title, discipline, date, prize, maxTeams, customLink, status, winner, watchUrl } = req.body;
            
            const result = await pool.query(
                `INSERT INTO tournaments 
                (title, discipline, date, prize, max_teams, custom_link, status, winner, teams, watch_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9)
                RETURNING *`,
                [title, discipline, date, prize, maxTeams, customLink || null, status || 'active', winner || null, watchUrl || null]
            );
            
            return res.status(201).json(result.rows[0]);
        }
        
        // PUT - обновить турнир
        if (req.method === 'PUT') {
            const { id, title, discipline, date, prize, maxTeams, customLink, status, winner, watchUrl } = req.body;
            
            const result = await pool.query(
                `UPDATE tournaments 
                SET title = $1, discipline = $2, date = $3, prize = $4, 
                    max_teams = $5, custom_link = $6, status = $7, winner = $8, watch_url = $9, updated_at = CURRENT_TIMESTAMP
                WHERE id = $10
                RETURNING *`,
                [title, discipline, date, prize, maxTeams, customLink || null, status, winner || null, watchUrl || null, id]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Турнир не найден' });
            }
            
            return res.status(200).json(result.rows[0]);
        }
        
        // DELETE - удалить турнир
        if (req.method === 'DELETE') {
            const { id } = req.query;
            
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

