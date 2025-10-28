// Главная страница - отображение активных турниров (с API)

let allTournaments = [];
let selectedDiscipline = 'all';

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Инициализация главной страницы...');
    await loadActiveTournaments();
    await loadSocialLinks();
    await loadDisciplineFilters();
    hideLoader();
    console.log('✅ Главная страница загружена');
});

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
    });
}

async function loadDisciplineFilters() {
    const filtersContainer = document.getElementById('discipline-filters');
    if (!filtersContainer) return;
    
    const disciplines = await API.disciplines.getAll();
    const disciplinesSet = new Set(allTournaments.map(t => t.discipline));
    const availableDisciplines = [...new Set(disciplines.filter(d => disciplinesSet.has(d.name || d)).map(d => d.name || d))];
    
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
            
            ${hasTimer ? `<div class="timer-container" id="${timerId}"></div>` : ''}
            
            <a href="${regLink}" target="_blank" class="btn-submit" ${regLink === '#' ? 'onclick="alert(\'Ссылка на регистрацию не настроена в админке\'); return false;"' : ''}>
                Подать заявку
            </a>
        </div>
    `;
}

// Инициализация таймеров после отображения
function initTimers() {
    document.querySelectorAll('.timer-container').forEach(container => {
        const card = container.closest('.tournament-card');
        const dateText = card.querySelector('.info-item:nth-child(2) .info-value').textContent;
        initCountdown(container.id, dateText);
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
            // Парсим дату в формате ДД.ММ.ГГГГ или ДД-ММ-ГГГГ
            const parts = dateString.split(/[.-]/);
            if (parts.length !== 3) {
                container.innerHTML = '';
                return;
            }
            
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const year = parseInt(parts[2]);
            
            const targetDate = new Date(year, month, day);
            const now = new Date();
            const diff = targetDate - now;
            
            if (diff <= 0) {
                container.innerHTML = '<div class="timer-badge timer-ended">Турнир начался</div>';
                return;
            }
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            container.innerHTML = `
                <div class="timer-badge">
                    <span class="timer-label">До начала:</span>
                    ${days > 0 ? `<span class="timer-value">${days}д</span>` : ''}
                    <span class="timer-value">${hours}ч</span>
                    ${minutes > 0 ? `<span class="timer-value">${minutes}м</span>` : ''}
                </div>
            `;
        } catch (error) {
            container.innerHTML = '';
        }
    }
    
    updateTimer();
    setInterval(updateTimer, 60000); // Обновляем каждую минуту
}

