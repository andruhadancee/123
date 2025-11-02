// API Client для работы с backend

// Определяем базовый URL для API
// В production это будет ваш домен на Vercel, в разработке - localhost
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : ''; // В production Vercel автоматически обрабатывает /api

// Система кеширования для быстрой загрузки
const CACHE_DURATION = 2 * 60 * 1000; // 2 минуты

function getCachedData(key) {
    try {
        const cached = localStorage.getItem(`cache_${key}`);
        if (!cached) return null;
        
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        // Проверяем, не устарел ли кеш
        if (now - timestamp < CACHE_DURATION) {
            console.log(`✅ Данные загружены из кеша: ${key}`);
            return data;
        }
        
        // Кеш устарел, удаляем его
        localStorage.removeItem(`cache_${key}`);
        return null;
    } catch (error) {
        return null;
    }
}

function setCachedData(key, data) {
    try {
        localStorage.setItem(`cache_${key}`, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (error) {
        console.warn('Не удалось сохранить в кеш:', error);
    }
}

function clearCache(pattern) {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(`cache_${pattern}`)) {
                localStorage.removeItem(key);
            }
        });
        console.log(`🗑️ Кеш очищен: ${pattern}`);
    } catch (error) {
        console.warn('Не удалось очистить кеш:', error);
    }
}

const API = {
    // Календарь
    calendar: {
        async getAll(month = null) {
            try {
                let url = `${API_BASE_URL}/api/calendar`;
                if (month) url += `?month=${encodeURIComponent(month)}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('Ошибка загрузки календаря');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка получения календаря:', error);
                return [];
            }
        },
        async create(eventData) {
            const resp = await fetch(`${API_BASE_URL}/api/calendar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });
            if (!resp.ok) throw new Error('Ошибка создания события');
            return await resp.json();
        },
        async update(eventData) {
            const resp = await fetch(`${API_BASE_URL}/api/calendar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });
            if (!resp.ok) throw new Error('Ошибка обновления события');
            return await resp.json();
        },
        async delete(id) {
            const resp = await fetch(`${API_BASE_URL}/api/calendar?id=${id}`, { method: 'DELETE' });
            if (!resp.ok) throw new Error('Ошибка удаления события');
            return await resp.json();
        }
    },
    // Турниры
    tournaments: {
        // Получить все турниры (можно фильтровать по статусу)
        async getAll(status = null, forceReload = false) {
            try {
                const cacheKey = `tournaments_${status || 'all'}`;
                
                // Если не требуется принудительная перезагрузка, пытаемся получить из кеша
                if (!forceReload) {
                    const cached = getCachedData(cacheKey);
                    if (cached) return cached;
                }
                
                // Если в кеше нет или требуется перезагрузка, загружаем с сервера
                let url = `${API_BASE_URL}/api/tournaments`;
                if (status) {
                    url += `?status=${status}`;
                }
                const response = await fetch(url);
                if (!response.ok) throw new Error('Ошибка загрузки турниров');
                const data = await response.json();
                
                // Сохраняем в кеш
                setCachedData(cacheKey, data);
                return data;
            } catch (error) {
                console.error('❌ Ошибка получения турниров:', error);
                // Возвращаем кеш, даже если устарел
                const cacheKey = `tournaments_${status || 'all'}`;
                const oldCache = localStorage.getItem(`cache_${cacheKey}`);
                if (oldCache) {
                    try {
                        return JSON.parse(oldCache).data;
                    } catch {}
                }
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
                clearCache('tournaments'); // Очищаем кеш турниров
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
                clearCache('tournaments'); // Очищаем кеш турниров
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
                clearCache('tournaments'); // Очищаем кеш турниров
                clearCache('teams'); // Очищаем кеш команд
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
                clearCache('teams'); // Очищаем кеш команд
                clearCache('tournaments'); // Очищаем кеш турниров чтобы обновился счетчик команд
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
                clearCache('teams'); // Очищаем кеш команд
                clearCache('tournaments'); // Очищаем кеш турниров чтобы обновился счетчик команд
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
                clearCache('teams'); // Очищаем кеш команд
                clearCache('tournaments'); // Очищаем кеш турниров чтобы обновился счетчик команд
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка удаления команды:', error);
                throw error;
            }
        }
    },
    
    // Регламенты
    regulations: {
        // Получить все регламенты
        async getAll() {
            try {
                const response = await fetch(`${API_BASE_URL}/api/regulations`);
                if (!response.ok) throw new Error('Ошибка загрузки регламентов');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка получения регламентов:', error);
                return [];
            }
        },
        
        // Получить регламент по дисциплине
        async getByDiscipline(discipline) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/regulations?discipline=${encodeURIComponent(discipline)}`);
                if (!response.ok) throw new Error('Ошибка загрузки регламента');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка получения регламента:', error);
                throw error;
            }
        },
        
        // Создать регламент
        async create(regulationData) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/regulations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(regulationData)
                });
                if (!response.ok) throw new Error('Ошибка создания регламента');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка создания регламента:', error);
                throw error;
            }
        },
        
        // Обновить регламент
        async update(id, regulationData) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/regulations?id=${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(regulationData)
                });
                if (!response.ok) throw new Error('Ошибка обновления регламента');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка обновления регламента:', error);
                throw error;
            }
        },
        
        // Удалить регламент
        async delete(id) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/regulations?id=${id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error('Ошибка удаления регламента');
                return await response.json();
            } catch (error) {
                console.error('❌ Ошибка удаления регламента:', error);
                throw error;
            }
        }
    }
};

// Функция для получения иконки дисциплины
function getDisciplineIcon(discipline) {
    const icons = {
        'Dota 2': 'pngwing.com 1.png',
        'CS 2': 'Group 29.png',
        'CS:GO': 'Group 29.png',
        'Counter-Strike 2': 'Group 29.png',
        'Mobile Legends': 'mobile_legends_new_logo_update_white_by_newjer53_df45cyq-pre 1.png',
        'MLBB': 'mobile_legends_new_logo_update_white_by_newjer53_df45cyq-pre 1.png'
    };
    
    // Если есть логотип - используем картинку, иначе смайлик джойстика
    if (icons[discipline]) {
        return `<img src="${icons[discipline]}" class="discipline-icon" alt="${discipline}">`;
    } else {
        return `<span class="discipline-icon discipline-icon-emoji">🎮</span>`;
    }
}

// Функция для обёртки дисциплины с иконкой
function formatDisciplineWithIcon(discipline) {
    return `<span class="discipline-with-icon">${getDisciplineIcon(discipline)}<span>${discipline}</span></span>`;
}

// Экспортируем для использования в других файлах
window.API = API;
window.getDisciplineIcon = getDisciplineIcon;
window.formatDisciplineWithIcon = formatDisciplineWithIcon;

console.log('✅ API Client загружен и готов к работе');

