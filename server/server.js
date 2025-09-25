require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.log('❌ MONGODB_URI not found in environment variables');
}

mongoose.connect(MONGODB_URI || 'mongodb://localhost:27017/teamfinder')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Простые маршруты для тестирования
app.get('/', (req, res) => {
  res.json({ 
    message: 'Team Finder API is running!',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API test endpoint works!' });
});

// Маршрут для сохранения пользователя
app.post('/api/users', async (req, res) => {
  try {
    console.log('Received user data:', req.body);
    
    // Пока просто возвращаем данные для теста
    // Позже добавим сохранение в базу данных
    res.json({ 
      success: true, 
      message: 'User saved successfully',
      user: req.body,
      savedToDatabase: false // Пока false, потом станет true
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Маршрут для поиска пользователей
app.get('/api/users/search', async (req, res) => {
  try {
    console.log('Search request with filters:', req.query);
    
    // Тестовые данные для демонстрации
    const testUsers = [
      {
        name: "Иван Петров",
        telegramUsername: "ivan_petrov",
        mmr: 4500,
        position: 1,
        about: "Ищу команду для турниров"
      },
      {
        name: "Алексей Сидоров", 
        telegramUsername: "alexey_sidorov",
        mmr: 3200,
        position: 2,
        about: "Опытный игрок, хорошая коммуникация"
      },
      {
        name: "Дмитрий Иванов",
        telegramUsername: "dmitry_ivanov", 
        mmr: 7800,
        position: 3,
        about: "Люблю контролировать темп игры"
      }
    ];
    
    res.json({ 
      success: true, 
      users: testUsers,
      message: 'Это тестовые данные. Позже здесь будет реальный поиск по базе данных.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 MongoDB URI: ${MONGODB_URI ? 'Configured' : 'Not configured'}`);
  console.log(`🔗 Test URL: http://localhost:${PORT}`);
  console.log(`🔗 API Test URL: http://localhost:${PORT}/api/test`);
});
