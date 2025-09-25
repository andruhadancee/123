const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Простейший сервер для теста
app.get('/', (req, res) => {
  res.json({ 
    message: '✅ Server is working!',
    status: 'OK'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API test endpoint works!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log('✅ Basic server is working');
});
