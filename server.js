// Простой HTTP сервер для WB Cyber Club
const http = require('http');
const fs = require('fs');
const path = require('path');

// Veroid передает порт через переменную окружения
const PORT = process.env.PORT || process.env.SERVER_PORT || 19010;

// MIME типы для разных файлов
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Определяем путь к файлу
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    // Получаем расширение файла
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // Читаем и отдаем файл
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Файл не найден - отдаем 404
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 - Страница не найдена</h1><p>Вернитесь на <a href="/">главную страницу</a></p>', 'utf-8');
            } else {
                // Другая ошибка сервера
                res.writeHead(500);
                res.end('Ошибка сервера: ' + error.code, 'utf-8');
            }
        } else {
            // Успешно - отдаем файл
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const HOST = '0.0.0.0'; // Слушаем на всех интерфейсах для внешних подключений

server.listen(PORT, HOST, () => {
    console.log('=================================');
    console.log('🎮 WB Cyber Club Server запущен!');
    console.log(`🌐 Сервер доступен по адресу: http://localhost:${PORT}`);
    console.log(`🌍 Внешний доступ: http://${HOST}:${PORT}`);
    console.log('=================================');
});

// Обработка ошибок
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Порт ${PORT} уже занят!`);
        process.exit(1);
    } else {
        console.error('❌ Ошибка сервера:', error);
    }
});

// Корректное завершение при Ctrl+C
process.on('SIGTERM', () => {
    console.log('\n👋 Сервер останавливается...');
    server.close(() => {
        console.log('✅ Сервер остановлен');
        process.exit(0);
    });
});

