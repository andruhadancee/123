// API для работы с командами
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - получить все команды (или по турниру)
        if (req.method === 'GET') {
            const { tournamentId } = req.query;
            
            let query = 'SELECT * FROM registered_teams';
            let params = [];
            
            if (tournamentId) {
                query += ' WHERE tournament_id = $1';
                params = [tournamentId];
            }
            
            query += ' ORDER BY registration_date DESC';
            
            const result = await pool.query(query, params);
            
            // Группируем по турнирам
            const teamsByTournament = {};
            result.rows.forEach(team => {
                if (!teamsByTournament[team.tournament_id]) {
                    teamsByTournament[team.tournament_id] = [];
                }
                teamsByTournament[team.tournament_id].push(team);
            });
            
            return res.status(200).json(teamsByTournament);
        }
        
        // POST - добавить команду
        if (req.method === 'POST') {
            const { tournamentId, name, captain, players, registrationDate } = req.body;
            
            const result = await pool.query(
                `INSERT INTO registered_teams 
                (tournament_id, name, captain, players, registration_date)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *`,
                [tournamentId, name, captain, players, registrationDate]
            );
            
            // Обновляем счётчик команд в турнире
            await pool.query(
                `UPDATE tournaments 
                SET teams = (SELECT COUNT(*) FROM registered_teams WHERE tournament_id = $1)
                WHERE id = $1`,
                [tournamentId]
            );
            
            return res.status(201).json(result.rows[0]);
        }
        
        // DELETE - удалить команду
        if (req.method === 'DELETE') {
            const { id } = req.query;
            
            const result = await pool.query('DELETE FROM registered_teams WHERE id = $1 RETURNING *', [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Команда не найдена' });
            }
            
            // Обновляем счётчик команд в турнире
            const tournamentId = result.rows[0].tournament_id;
            await pool.query(
                `UPDATE tournaments 
                SET teams = (SELECT COUNT(*) FROM registered_teams WHERE tournament_id = $1)
                WHERE id = $1`,
                [tournamentId]
            );
            
            return res.status(200).json({ message: 'Команда удалена' });
        }
        
        return res.status(405).json({ error: 'Метод не поддерживается' });
        
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
};

