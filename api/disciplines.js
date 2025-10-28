// API для работы с дисциплинами
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
        // GET - получить все дисциплины
        if (req.method === 'GET') {
            const result = await pool.query('SELECT name FROM disciplines ORDER BY name');
            const disciplines = result.rows.map(row => row.name);
            return res.status(200).json(disciplines);
        }
        
        // POST - добавить дисциплину
        if (req.method === 'POST') {
            const { name } = req.body;
            
            if (!name || !name.trim()) {
                return res.status(400).json({ error: 'Название дисциплины обязательно' });
            }
            
            try {
                await pool.query('INSERT INTO disciplines (name) VALUES ($1)', [name.trim()]);
                return res.status(201).json({ message: 'Дисциплина добавлена', name: name.trim() });
            } catch (error) {
                if (error.code === '23505') { // duplicate key
                    return res.status(409).json({ error: 'Дисциплина уже существует' });
                }
                throw error;
            }
        }
        
        // DELETE - удалить дисциплину
        if (req.method === 'DELETE') {
            const { name } = req.query;
            
            const result = await pool.query('DELETE FROM disciplines WHERE name = $1 RETURNING *', [name]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Дисциплина не найдена' });
            }
            
            return res.status(200).json({ message: 'Дисциплина удалена' });
        }
        
        return res.status(405).json({ error: 'Метод не поддерживается' });
        
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
};

