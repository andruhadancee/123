// Главная страница - отображение активных турниров (с API)

let allTournaments = [];
let selectedDiscipline = 'all';

// Функция инициализации страницы
async function initializeMainPage() {
    console.log('🚀 Инициализация главной страницы...');
    await loadActiveTournaments();
    await loadSocialLinks();
    await loadDisciplineFilters();
    hideLoader();
    console.log('✅ Главная страница загружена');
}

// Запускаем при загрузке страницы
document.addEventListener('DOMContentLoaded', initializeMainPage);

// Экспортируем для SPA
window.initializeMainPage = initializeMainPage;

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.style.display = 'none', 300);
    }
}

async function loadActiveTournaments() {
    const grid = document.getElementById('tournaments-grid');
    
    allTournaments = await API.tournaments.getAll('active');
    const links = await API.links.getAll();
    
    if (allTournaments.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Активных турниров пока нет</h3>
                <p>Следите за обновлениями в наших социальных сетях</p>
            </div>
        `;
        return;
    }
    
    displayFilteredTournaments();
}

function displayFilteredTournaments() {
    const grid = document.getElementById('tournaments-grid');
    const links = API.links.getAll ? null : {}; // To be loaded if needed
    
    let filtered = allTournaments;
    if (selectedDiscipline !== 'all') {
        filtered = allTournaments.filter(t => t.discipline === selectedDiscipline);
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Турниров по выбранной дисциплине нет</h3>
            </div>
        `;
        return;
    }
    
    API.links.getAll().then(links => {
        grid.innerHTML = filtered.map(tournament => createTournamentCard(tournament, links)).join('');
        // Переинициализируем таймеры после отрисовки
        setTimeout(initTimers, 100);
        // Переинициализируем анимации
        setTimeout(() => {
            if (window.initScrollAnimations) {
                initScrollAnimations();
            }
        }, 150);
    });
}

async function loadDisciplineFilters() {
    const filtersContainer = document.getElementById('discipline-filters');
    if (!filtersContainer) return;
    
    const disciplines = await API.disciplines.getAll();
    const disciplinesSet = new Set(allTournaments.map(t => t.discipline));
    const availableDisciplines = [...new Set(disciplines.filter(d => disciplinesSet.has(d)))];
    
    filtersContainer.innerHTML = `
        <button class="filter-btn active" data-discipline="all" onclick="filterByDiscipline('all')">
            Все
        </button>
        ${availableDisciplines.map(d => `
            <button class="filter-btn" data-discipline="${d}" onclick="filterByDiscipline('${d}')">
                ${getDisciplineIcon(d)} ${d}
            </button>
        `).join('')}
    `;
}

function filterByDiscipline(discipline) {
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

window.filterByDiscipline = filterByDiscipline;

function createTournamentCard(tournament, links) {
    // Приоритет: custom_link > links[discipline] > '#'
    let regLink = '#';
    if (tournament.custom_link && tournament.custom_link.trim()) {
        regLink = tournament.custom_link.trim();
    } else if (links && links[tournament.discipline]) {
        regLink = links[tournament.discipline];
    }
    
    console.log(`🎮 Карточка турнира "${tournament.title}": ${regLink}`);
    
    // Парсим дату для таймера
    const timerId = `timer-${tournament.id}`;
    const dateParts = tournament.date.split(/[.-]/);
    const hasTimer = dateParts.length === 3;
    
    return `
        <div class="tournament-card" data-discipline="${tournament.discipline}">
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
                    <span class="info-label">Команд</span>
                    <span class="info-value">${tournament.teams || 0} / ${tournament.max_teams}</span>
                </div>
            </div>
            
            <div class="timer-container" id="${timerId}" data-date="${tournament.date}"></div>
            
            <a href="${regLink}" target="_blank" class="btn-submit" ${regLink === '#' ? 'onclick="alert(\'Ссылка на регистрацию не настроена в админке\'); return false;"' : ''}>
                Подать заявку
            </a>
        </div>
    `;
}

// Инициализация таймеров после отображения
function initTimers() {
    console.log('⏰ Инициализация таймеров...');
    const containers = document.querySelectorAll('.timer-container');
    console.log(`Найдено ${containers.length} таймеров`);
    
    containers.forEach(container => {
        const dateText = container.getAttribute('data-date');
        console.log(`Таймер ${container.id}: дата = ${dateText}`);
        if (dateText) {
            initCountdown(container.id, dateText);
        }
    });
}

async function loadActiveTournaments() {
    const grid = document.getElementById('tournaments-grid');
    
    allTournaments = await API.tournaments.getAll('active');
    const links = await API.links.getAll();
    
    if (allTournaments.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Активных турниров пока нет</h3>
                <p>Следите за обновлениями в наших социальных сетях</p>
            </div>
        `;
        return;
    }
    
    displayFilteredTournaments();
    setTimeout(initTimers, 100);
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

// Функция таймера обратного отсчета
function initCountdown(timerId, dateString) {
    const container = document.getElementById(timerId);
    if (!container) return;
    
    function updateTimer() {
        try {
            let targetDate;
            
            // Парсим разные форматы дат
            const dotsFormat = dateString.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
            const dashesFormat = dateString.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
            const russianFormat = dateString.match(/(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})/i);
            
            console.log(`Парсинг даты: "${dateString}"`);
            
            if (dotsFormat) {
                const [, day, month, year] = dotsFormat;
                targetDate = new Date(year, parseInt(month) - 1, parseInt(day));
                console.log('Формат с точками:', day, month, year);
            } else if (dashesFormat) {
                const [, day, month, year] = dashesFormat;
                targetDate = new Date(year, parseInt(month) - 1, parseInt(day));
                console.log('Формат с тире:', day, month, year);
            } else if (russianFormat) {
                const [, day, monthName, year] = russianFormat;
                const months = {
                    'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
                    'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
                };
                targetDate = new Date(year, months[monthName.toLowerCase()], parseInt(day));
                console.log('Русский формат:', day, monthName, year);
            } else {
                console.log('Не удалось распарсить дату, пробуем стандартный парсинг');
                targetDate = new Date(dateString);
                if (isNaN(targetDate.getTime())) {
                    console.log('Невалидная дата');
                    container.innerHTML = '';
                    return;
                }
            }
            
            console.log('Целевая дата:', targetDate);
            
            const now = new Date();
            const diff = targetDate - now;
            
            console.log('Разница:', diff);
            
            if (diff <= 0) {
                container.innerHTML = '<div class="timer-badge timer-ended">Турнир начался</div>';
                return;
            }
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            console.log(`Таймер: ${days}д ${hours}ч ${minutes}м`);
            
            container.innerHTML = `
                <div class="timer-badge">
                    <span class="timer-label">До начала:</span>
                    ${days > 0 ? `<span class="timer-value">${days}д</span>` : ''}
                    <span class="timer-value">${hours}ч</span>
                    ${minutes > 0 ? `<span class="timer-value">${minutes}м</span>` : ''}
                </div>
            `;
        } catch (error) {
            console.error('Ошибка таймера:', error);
            container.innerHTML = '';
        }
    }
    
    updateTimer();
    setInterval(updateTimer, 60000); // Обновляем каждую минуту
}

