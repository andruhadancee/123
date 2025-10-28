// API для работы с регламентами (Vercel serverless format)
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
        const { id, discipline } = req.query;
        
        if (req.method === 'GET') {
            if (discipline) {
                // GET /api/regulations?discipline=CS+2
                const result = await pool.query(`
                    SELECT r.id, r.discipline_name, r.pdf_url, r.created_at, r.updated_at
                    FROM regulations r
                    WHERE LOWER(r.discipline_name) = LOWER($1)
                `, [discipline]);
                
                if (result.rows.length === 0) {
                    return res.status(404).json({ error: 'Regulation not found' });
                }
                
                return res.json(result.rows[0]);
            } else {
                // GET /api/regulations - все регламенты
                const result = await pool.query(`
                    SELECT r.id, r.discipline_name, r.pdf_url, r.created_at, r.updated_at
                    FROM regulations r
                    ORDER BY r.discipline_name
                `);
                
                return res.json(result.rows);
            }
        }
        
        if (req.method === 'POST') {
            // POST /api/regulations
            const { discipline_name, pdf_url } = req.body;
            
            if (!discipline_name || !pdf_url) {
                return res.status(400).json({ error: 'discipline_name and pdf_url are required' });
            }
            
            const result = await pool.query(`
                INSERT INTO regulations (discipline_name, pdf_url)
                VALUES ($1, $2)
                RETURNING *
            `, [discipline_name, pdf_url]);
            
            return res.status(201).json(result.rows[0]);
        }
        
        if (req.method === 'PUT') {
            // PUT /api/regulations?id=123
            const { id } = req.query;
            const { pdf_url, discipline_name } = req.body;
            
            if (!id || !pdf_url) {
                return res.status(400).json({ error: 'id and pdf_url are required' });
            }
            
            const result = await pool.query(`
                UPDATE regulations 
                SET pdf_url = $1, updated_at = CURRENT_TIMESTAMP, discipline_name = COALESCE($2, discipline_name)
                WHERE id = $3
                RETURNING *
            `, [pdf_url, discipline_name, id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Regulation not found' });
            }
            
            return res.json(result.rows[0]);
        }
        
        if (req.method === 'DELETE') {
            // DELETE /api/regulations?id=123
            const { id } = req.query;
            
            if (!id) {
                return res.status(400).json({ error: 'id is required' });
            }
            
            const result = await pool.query(`
                DELETE FROM regulations WHERE id = $1 RETURNING *
            `, [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Regulation not found' });
            }
            
            return res.json({ message: 'Regulation deleted successfully' });
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        await pool.end();
    }
};

