// Инициализация базы данных
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initDatabase() {
    try {
        console.log('🔄 Инициализация базы данных...');
        
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await pool.query(schema);
        
        console.log('✅ База данных успешно инициализирована!');
        console.log('📊 Созданы таблицы:');
        console.log('  - tournaments');
        console.log('  - registration_links');
        console.log('  - social_links');
        console.log('  - disciplines');
        console.log('  - registered_teams');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        process.exit(1);
    }
}

initDatabase();

