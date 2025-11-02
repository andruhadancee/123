// API для работы с дисциплинами
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

// Автоматическое добавление полей color и logo_url если их нет
async function ensureColumns() {
    try {
        await pool.query(`ALTER TABLE disciplines ADD COLUMN IF NOT EXISTS color VARCHAR(7)`);
        await pool.query(`ALTER TABLE disciplines ADD COLUMN IF NOT EXISTS logo_url TEXT`);
        await pool.query(`ALTER TABLE disciplines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    } catch (e) {
        // Колонки уже существуют
    }
}

module.exports = async (req, res) => {
    // Автоматическая миграция при первом запросе
    await ensureColumns();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - получить все дисциплины
        if (req.method === 'GET') {
            const result = await pool.query('SELECT id, name, color, logo_url FROM disciplines ORDER BY name');
            return res.status(200).json(result.rows);
        }
        
        // POST - добавить дисциплину
        if (req.method === 'POST') {
            const { name, color, logo_url } = req.body;
            
            if (!name || !name.trim()) {
                return res.status(400).json({ error: 'Название дисциплины обязательно' });
            }
            
            try {
                const result = await pool.query(
                    'INSERT INTO disciplines (name, color, logo_url) VALUES ($1, $2, $3) RETURNING *',
                    [name.trim(), color || null, logo_url || null]
                );
                return res.status(201).json(result.rows[0]);
            } catch (error) {
                if (error.code === '23505') { // duplicate key
                    return res.status(409).json({ error: 'Дисциплина уже существует' });
                }
                throw error;
            }
        }
        
        // PUT - обновить дисциплину
        if (req.method === 'PUT') {
            const { id, name, color, logo_url } = req.body;
            
            if (!id) {
                return res.status(400).json({ error: 'ID дисциплины обязателен' });
            }
            
            const updates = [];
            const values = [];
            let paramIndex = 1;
            
            if (name !== undefined) {
                updates.push(`name = $${paramIndex++}`);
                values.push(name.trim());
            }
            if (color !== undefined) {
                updates.push(`color = $${paramIndex++}`);
                values.push(color || null);
            }
            if (logo_url !== undefined) {
                updates.push(`logo_url = $${paramIndex++}`);
                values.push(logo_url || null);
            }
            
            if (updates.length === 0) {
                return res.status(400).json({ error: 'Нет данных для обновления' });
            }
            
            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(id);
            
            const result = await pool.query(
                `UPDATE disciplines SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
                values
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Дисциплина не найдена' });
            }
            
            return res.status(200).json(result.rows[0]);
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

