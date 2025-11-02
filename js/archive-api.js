// Страница прошедших турниров (с API)

let allPastTournaments = [];
let selectedDiscipline = 'all';

// Функция для нормализации даты к формату "день месяц год"
function formatDateForDisplay(dateStr) {
    try {
        // Проверяем, уже ли это русский формат
        if (dateStr.match(/\d+\s+\w+\s+\d+/)) {
            return dateStr;
        }
        
        // Парсим YYYY-MM-DD
        const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (parts) {
            const [, year, month, day] = parts;
            const months = [
                'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
            ];
            return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year} г.`;
        }
        
        return dateStr; // Если не удалось распарсить, возвращаем как есть
    } catch (e) {
        return dateStr;
    }
}

// Функция очистки кеша (берем из API client)
function clearArchiveCache() {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('cache_tournaments')) {
                localStorage.removeItem(key);
            }
        });
        console.log('🗑️ Кеш архива очищен');
    } catch (error) {
        console.warn('Не удалось очистить кеш:', error);
    }
}

// Функция инициализации страницы
async function initializeArchivePage() {
    console.log('🚀 Инициализация страницы архива...');
    await loadPastTournaments();
    await loadDisciplineFilters();
    await loadSocialLinks();
    hideLoader();
    console.log('✅ Страница архива загружена');
}

// Запускаем при загрузке страницы
document.addEventListener('DOMContentLoaded', initializeArchivePage);

// Экспортируем для SPA
window.initializeArchivePage = initializeArchivePage;

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.style.display = 'none', 300);
    }
}

async function loadPastTournaments() {
    // Очищаем кеш для получения свежих данных
    clearArchiveCache();
    allPastTournaments = await API.tournaments.getAll('finished');
    
    // Турниры загружены
    
    displayFilteredTournaments();
}

function displayFilteredTournaments() {
    const grid = document.getElementById('archive-grid');
    
    let filtered = allPastTournaments;
    if (selectedDiscipline !== 'all') {
        filtered = allPastTournaments.filter(t => t.discipline === selectedDiscipline);
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>${selectedDiscipline === 'all' ? 'Прошедших турниров пока нет' : 'Турниров по выбранной дисциплине нет'}</h3>
                <p>${selectedDiscipline === 'all' ? 'История турниров появится здесь после их завершения' : 'Попробуйте выбрать другую дисциплину'}</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filtered.map(tournament => createPastTournamentCard(tournament)).join('');
}

async function loadDisciplineFilters() {
    const filtersContainer = document.getElementById('discipline-filters');
    if (!filtersContainer) return;
    
    const disciplines = await API.disciplines.getAll();
    const disciplinesSet = new Set(allPastTournaments.map(t => t.discipline));
    const availableDisciplines = [...new Set(disciplines.filter(d => disciplinesSet.has(d)))];
    
    filtersContainer.innerHTML = `
        <button class="filter-btn active" data-discipline="all" onclick="filterArchiveByDiscipline('all')">
            Все
        </button>
        ${availableDisciplines.map(d => `
            <button class="filter-btn" data-discipline="${d}" onclick="filterArchiveByDiscipline('${d}')">
                ${getDisciplineIcon(d)} ${d}
            </button>
        `).join('')}
    `;
}

function filterArchiveByDiscipline(discipline) {
    selectedDiscipline = discipline;
    
    // Update active state
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.discipline === discipline) {
            btn.classList.add('active');
        }
    });
    
    displayFilteredTournaments();
}

window.filterArchiveByDiscipline = filterArchiveByDiscipline;

function createPastTournamentCard(tournament) {
    // Проверяем оба варианта названия поля (watch_url и watchUrl)
    let watchUrl = tournament.watch_url || tournament.watchUrl || null;
    
    // Преобразуем пустую строку в null
    if (watchUrl === '' || (typeof watchUrl === 'string' && watchUrl.trim() === '')) {
        watchUrl = null;
    }
    
    // Отладка убрана - кнопка работает
    
    // Проверяем наличие валидной ссылки
    const hasWatchUrl = watchUrl && typeof watchUrl === 'string' && watchUrl.trim() !== '';
    
    return `
        <div class="tournament-card">
            <div class="tournament-card-header">
                <h2>${tournament.title}</h2>
            </div>
            
            <div class="tournament-info">
                <div class="info-item">
                    <span class="info-label">Дисциплина</span>
                    <span class="info-value">${window.formatDisciplineWithIconSync ? window.formatDisciplineWithIconSync(tournament.discipline) : tournament.discipline}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Дата</span>
                    <span class="info-value">${formatDateForDisplay(tournament.date)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Призовой фонд</span>
                    <span class="info-value">${tournament.prize}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Участников</span>
                    <span class="info-value">${tournament.teams || 0} команд</span>
                </div>
                ${tournament.winner ? `
                <div class="info-item" style="grid-column: 1 / -1;">
                    <span class="info-label">🏆 Победитель</span>
                    <span class="info-value">${tournament.winner}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="tournament-watch-button-container" style="margin-top: 16px; min-height: 42px; display: flex; align-items: center; justify-content: center;">
                ${hasWatchUrl ? `
                <a href="${watchUrl.trim()}" target="_blank" class="btn-submit" style="text-align: center; display: block; text-decoration: none; width: 100%;">
                    Смотреть
                </a>
                ` : `
                <span style="display: none;"></span>
                `}
            </div>
        </div>
    `;
}

async function loadSocialLinks() {
    const socialLinks = await API.social.getAll();
    
    // Обновляем ссылки в header
    if (socialLinks.twitch) {
        const twitchBtn = document.querySelector('.social-btn.twitch');
        if (twitchBtn) twitchBtn.href = socialLinks.twitch;
    }
    if (socialLinks.telegram) {
        const telegramBtn = document.querySelector('.social-btn.telegram');
        if (telegramBtn) telegramBtn.href = socialLinks.telegram;
    }
    if (socialLinks.discord) {
        const discordBtn = document.querySelector('.social-btn.discord');
        if (discordBtn) discordBtn.href = socialLinks.discord;
    }
    if (socialLinks.contact) {
        const contactBtn = document.querySelector('.btn-contact');
        if (contactBtn) contactBtn.href = socialLinks.contact;
    }
}

