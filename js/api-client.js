// API Client для работы с backend

// Определяем базовый URL для API
// В production это будет ваш домен на Vercel, в разработке - localhost
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : ''; // В production Vercel автоматически обрабатывает /api

const API = {
    // Турниры
    tournaments: {
        // Получить все турниры (можно фильтровать по статусу)
        async getAll(status = null) {
            try {
                let url = `${API_BASE_URL}/api/tournaments`;
                if (status) {
                    url += `?status=${status}`;
                }
                const response = await fetch(url);
                if (!response.ok) throw new Error('Ошибка загрузки турниров');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка получения турниров:', error);
                return [];
            }
        },
        
        // Создать турнир
        async create(tournamentData) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/tournaments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(tournamentData)
                });
                if (!response.ok) throw new Error('Ошибка создания турнира');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка создания турнира:', error);
                throw error;
            }
        },
        
        // Обновить турнир
        async update(tournamentData) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/tournaments`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(tournamentData)
                });
                if (!response.ok) throw new Error('Ошибка обновления турнира');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка обновления турнира:', error);
                throw error;
            }
        },
        
        // Удалить турнир
        async delete(id) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/tournaments?id=${id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error('Ошибка удаления турнира');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка удаления турнира:', error);
                throw error;
            }
        }
    },
    
    // Дисциплины
    disciplines: {
        // Получить все дисциплины
        async getAll() {
            try {
                const response = await fetch(`${API_BASE_URL}/api/disciplines`);
                if (!response.ok) throw new Error('Ошибка загрузки дисциплин');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка получения дисциплин:', error);
                return ['CS 2', 'Dota 2', 'Valorant', 'Overwatch 2', 'League of Legends']; // Fallback
            }
        },
        
        // Добавить дисциплину
        async create(name) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/disciplines`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Ошибка добавления дисциплины');
                }
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка добавления дисциплины:', error);
                throw error;
            }
        },
        
        // Удалить дисциплину
        async delete(name) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/disciplines?name=${encodeURIComponent(name)}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error('Ошибка удаления дисциплины');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка удаления дисциплины:', error);
                throw error;
            }
        }
    },
    
    // Ссылки на регистрацию
    links: {
        // Получить все ссылки
        async getAll() {
            try {
                const response = await fetch(`${API_BASE_URL}/api/links`);
                if (!response.ok) throw new Error('Ошибка загрузки ссылок');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка получения ссылок:', error);
                return {};
            }
        },
        
        // Сохранить ссылки
        async save(links) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/links`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(links)
                });
                if (!response.ok) throw new Error('Ошибка сохранения ссылок');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка сохранения ссылок:', error);
                throw error;
            }
        }
    },
    
    // Социальные ссылки
    social: {
        // Получить социальные ссылки
        async getAll() {
            try {
                const response = await fetch(`${API_BASE_URL}/api/social`);
                if (!response.ok) throw new Error('Ошибка загрузки социальных ссылок');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка получения социальных ссылок:', error);
                return {};
            }
        },
        
        // Сохранить социальные ссылки
        async save(socialData) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/social`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(socialData)
                });
                if (!response.ok) throw new Error('Ошибка сохранения социальных ссылок');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка сохранения социальных ссылок:', error);
                throw error;
            }
        }
    },
    
    // Команды
    teams: {
        // Получить все команды (по всем турнирам или по конкретному)
        async getAll(tournamentId = null) {
            try {
                let url = `${API_BASE_URL}/api/teams`;
                if (tournamentId) {
                    url += `?tournamentId=${tournamentId}`;
                }
                const response = await fetch(url);
                if (!response.ok) throw new Error('Ошибка загрузки команд');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка получения команд:', error);
                return {};
            }
        },
        
        // Добавить команду
        async create(teamData) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/teams`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(teamData)
                });
                if (!response.ok) throw new Error('Ошибка добавления команды');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка добавления команды:', error);
                throw error;
            }
        },
        
        // Обновить команду
        async update(teamData) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/teams`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(teamData)
                });
                if (!response.ok) throw new Error('Ошибка обновления команды');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка обновления команды:', error);
                throw error;
            }
        },
        
        // Удалить команду
        async delete(id) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/teams?id=${id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error('Ошибка удаления команды');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка удаления команды:', error);
                throw error;
            }
        }
    }
};

// Экспортируем для использования в других файлах
window.API = API;

console.log('✅ API Client загружен и готов к работе');

