// API для работы со ссылками на регистрацию
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - получить все ссылки
        if (req.method === 'GET') {
            const result = await pool.query('SELECT * FROM registration_links ORDER BY discipline');
            
            // Преобразуем в объект {discipline: link}
            const links = {};
            result.rows.forEach(row => {
                links[row.discipline] = row.link;
            });
            
            return res.status(200).json(links);
        }
        
        // POST - сохранить ссылки
        if (req.method === 'POST') {
            const links = req.body; // {discipline: link, discipline2: link2}
            
            // Удаляем старые ссылки
            await pool.query('DELETE FROM registration_links');
            
            // Вставляем новые
            for (const [discipline, link] of Object.entries(links)) {
                if (link && link.trim()) {
                    await pool.query(
                        'INSERT INTO registration_links (discipline, link) VALUES ($1, $2)',
                        [discipline, link.trim()]
                    );
                }
            }
            
            return res.status(200).json({ message: 'Ссылки сохранены', links });
        }
        
        return res.status(405).json({ error: 'Метод не поддерживается' });
        
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
};

