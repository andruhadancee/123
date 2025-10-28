// API для работы с социальными ссылками
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - получить социальные ссылки
        if (req.method === 'GET') {
            const result = await pool.query('SELECT * FROM social_links');
            
            // Преобразуем в объект {platform: link}
            const links = {};
            result.rows.forEach(row => {
                links[row.platform] = row.link;
            });
            
            return res.status(200).json(links);
        }
        
        // POST - сохранить социальные ссылки
        if (req.method === 'POST') {
            const { twitch, telegram, contact } = req.body;
            
            // Удаляем старые
            await pool.query('DELETE FROM social_links');
            
            // Вставляем новые
            const platforms = [
                { platform: 'twitch', link: twitch },
                { platform: 'telegram', link: telegram },
                { platform: 'contact', link: contact }
            ];
            
            for (const { platform, link } of platforms) {
                if (link && link.trim()) {
                    await pool.query(
                        'INSERT INTO social_links (platform, link) VALUES ($1, $2)',
                        [platform, link.trim()]
                    );
                }
            }
            
            return res.status(200).json({ message: 'Социальные ссылки сохранены' });
        }
        
        return res.status(405).json({ error: 'Метод не поддерживается' });
        
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
};

