// API для автоматического переноса турниров в архив в 23:59
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
    try {
        console.log('🔄 Запуск автоматического архивирования турниров...');
        
        // Получаем все активные турниры
        const tournaments = await pool.query('SELECT * FROM tournaments WHERE status = $1', ['active']);
        
        if (tournaments.rows.length === 0) {
            console.log('ℹ️ Нет активных турниров для архивирования');
            return res.status(200).json({ message: 'Нет турниров для архивирования', archived: 0 });
        }
        
        const now = new Date();
        const todayDateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
        
        let archivedCount = 0;
        
        // Проверяем каждый турнир
        for (const tournament of tournaments.rows) {
            try {
                // Парсим дату турнира
                const dateMatch = tournament.date.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
                if (!dateMatch) continue;
                
                const months = {
                    'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
                    'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
                    'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
                };
                
                const day = dateMatch[1].padStart(2, '0');
                const month = months[dateMatch[2].toLowerCase()];
                const year = dateMatch[3];
                
                if (!month) continue;
                
                const tournamentDateStr = `${year}-${month}-${day}`;
                
                // Если дата турнира сегодня или вчера - архивируем
                if (tournamentDateStr <= todayDateStr) {
                    await pool.query(
                        'UPDATE tournaments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                        ['finished', tournament.id]
                    );
                    archivedCount++;
                    console.log(`✅ Турнир "${tournament.title}" (ID: ${tournament.id}) перенесён в архив`);
                }
            } catch (err) {
                console.error(`❌ Ошибка архивирования турнира ${tournament.id}:`, err);
            }
        }
        
        console.log(`✅ Архивировано турниров: ${archivedCount}`);
        return res.status(200).json({ message: 'Архивирование завершено', archived: archivedCount });
        
    } catch (error) {
        console.error('❌ Ошибка автоматического архивирования:', error);
        return res.status(500).json({ error: 'Ошибка архивирования', details: error.message });
    }
};

