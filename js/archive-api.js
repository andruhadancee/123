// Страница прошедших турниров (с API)

let allPastTournaments = [];
let selectedDiscipline = 'all';

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
    
    // Отладка - посмотрим, что приходит из API
    console.log('📦 Все прошедшие турниры загружены:', allPastTournaments.length);
    allPastTournaments.forEach((t, idx) => {
        console.log(`🔍 Турнир ${idx + 1}:`, {
            title: t.title,
            watch_url: t.watch_url,
            watchUrl: t.watchUrl,
            all_fields: Object.keys(t)
        });
    });
    
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
    const watchUrl = tournament.watch_url || tournament.watchUrl || null;
    
    // Отладка
    console.log('🎯 Создание карточки турнира:', tournament.title, {
        watch_url: tournament.watch_url,
        watchUrl: tournament.watchUrl,
        final_watchUrl: watchUrl,
        all_keys: Object.keys(tournament)
    });
    
    // Проверяем также пустую строку
    const hasWatchUrl = watchUrl && watchUrl.trim() !== '';
    
    return `
        <div class="tournament-card">
            <div class="tournament-card-header">
                <h2>${tournament.title}</h2>
            </div>
            
            <div class="tournament-info">
                <div class="info-item">
                    <span class="info-label">Дисциплина</span>
                    <span class="info-value">${formatDisciplineWithIcon(tournament.discipline)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Дата</span>
                    <span class="info-value">${tournament.date}</span>
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
            
            ${hasWatchUrl ? `
            <a href="${watchUrl.trim()}" target="_blank" class="btn-submit" style="margin-top: 16px; text-align: center; display: block; text-decoration: none;">
                Смотреть
            </a>
            ` : ''}
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

