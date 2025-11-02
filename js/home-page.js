// Главная страница - обзорная информация

let stats = {
    activeTournaments: 0,
    totalTeams: 0,
    upcomingTournaments: 0,
    disciplines: 0
};

// Функция инициализации главной страницы
async function initializeHomePage() {
    console.log('🚀 Инициализация главной страницы...');
    await loadStatistics();
    await loadNextTournament();
    await loadFeaturedTournaments();
    await loadSocialLinks();
    hideLoader();
    console.log('✅ Главная страница загружена');
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.style.display = 'none', 300);
    }
}

// Загрузка статистики
async function loadStatistics() {
    try {
        const [tournaments, teams, disciplines] = await Promise.all([
            API.tournaments.getAll('active'),
            API.teams.getAll(),
            API.disciplines.getAll()
        ]);
        
        // Подсчитываем статистику
        stats.activeTournaments = tournaments.length;
        
        // Считаем общее количество команд
        let totalTeamsCount = 0;
        Object.values(teams).forEach(tournamentTeams => {
            totalTeamsCount += tournamentTeams.length;
        });
        stats.totalTeams = totalTeamsCount;
        
        // Считаем ближайшие турниры (с датой в будущем)
        const now = new Date();
        stats.upcomingTournaments = tournaments.filter(t => {
            const tournamentDate = parseTournamentDate(t.date);
            return tournamentDate && tournamentDate > now;
        }).length;
        
        stats.disciplines = disciplines.length;
        
        // Обновляем DOM
        document.getElementById('active-tournaments-count').textContent = stats.activeTournaments;
        document.getElementById('total-teams-count').textContent = stats.totalTeams;
        document.getElementById('upcoming-tournaments-count').textContent = stats.upcomingTournaments;
        document.getElementById('disciplines-count').textContent = stats.disciplines;
        
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Загрузка ближайшего турнира
async function loadNextTournament() {
    try {
        const tournaments = await API.tournaments.getAll('active');
        const links = await API.links.getAll();
        
        if (tournaments.length === 0) {
            return; // Нет турниров
        }
        
        // Находим ближайший турнир
        const now = new Date();
        let nextTournament = null;
        let nextDate = null;
        
        for (const tournament of tournaments) {
            const tournamentDate = parseTournamentDateTime(tournament.date, tournament.start_time);
            if (tournamentDate && tournamentDate > now) {
                if (!nextDate || tournamentDate < nextDate) {
                    nextDate = tournamentDate;
                    nextTournament = tournament;
                }
            }
        }
        
        if (nextTournament) {
            displayNextTournament(nextTournament, links);
        }
    } catch (error) {
        console.error('Ошибка загрузки ближайшего турнира:', error);
    }
}

// Отображение ближайшего турнира
function displayNextTournament(tournament, links) {
    const section = document.getElementById('next-tournament-section');
    const card = document.getElementById('next-tournament-card');
    
    // Приоритет: custom_link > links[discipline] > '#'
    let regLink = '#';
    if (tournament.custom_link && tournament.custom_link.trim()) {
        regLink = tournament.custom_link.trim();
    } else if (links && links[tournament.discipline]) {
        regLink = links[tournament.discipline];
    }
    
    const formattedDate = formatDateForDisplay(tournament.date);
    const timerId = `next-timer-${tournament.id}`;
    
    card.innerHTML = `
        <div class="next-tournament-content">
            <div class="next-tournament-info">
                <h3>${tournament.title}</h3>
                <div class="next-tournament-details">
                    <div class="detail-item">
                        <span class="detail-label">Дисциплина:</span>
                        <span class="detail-value">${window.formatDisciplineWithIconSync ? window.formatDisciplineWithIconSync(tournament.discipline) : tournament.discipline}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Дата:</span>
                        <span class="detail-value">${formattedDate}</span>
                    </div>
                    ${tournament.start_time ? `
                    <div class="detail-item">
                        <span class="detail-label">Время старта:</span>
                        <span class="detail-value">${tournament.start_time.split(':').slice(0, 2).join(':')} МСК</span>
                    </div>
                    ` : ''}
                    <div class="detail-item">
                        <span class="detail-label">Призовой фонд:</span>
                        <span class="detail-value">${tournament.prize}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Команд:</span>
                        <span class="detail-value">${tournament.teams || 0} / ${tournament.max_teams}</span>
                    </div>
                </div>
                <div class="timer-container" id="${timerId}" data-date="${tournament.date}" data-start-time="${tournament.start_time || ''}"></div>
            </div>
            <div class="next-tournament-action">
                <a href="${regLink}" target="_blank" class="btn-submit btn-large" ${regLink === '#' ? 'onclick="alert(\'Ссылка на регистрацию не настроена в админке\'); return false;"' : ''}>
                    Подать заявку
                </a>
            </div>
        </div>
    `;
    
    section.style.display = 'block';
    
    // Инициализируем таймер
    if (tournament.date) {
        initCountdown(timerId, tournament.date, tournament.start_time || '');
    }
}

// Загрузка избранных турниров (первые 3-6)
async function loadFeaturedTournaments() {
    try {
        const tournaments = await API.tournaments.getAll('active');
        const links = await API.links.getAll();
        
        const previewGrid = document.getElementById('tournaments-preview-grid');
        
        if (tournaments.length === 0) {
            previewGrid.innerHTML = `
                <div class="empty-state">
                    <p>Пока нет активных турниров</p>
                    <a href="tournaments.html" class="btn-submit" style="margin-top: 20px;">Смотреть календарь</a>
                </div>
            `;
            return;
        }
        
        // Берем первые 6 турниров
        const featured = tournaments.slice(0, 6);
        
        previewGrid.innerHTML = featured.map(tournament => {
            return createTournamentPreviewCard(tournament, links);
        }).join('');
        
        // Инициализируем таймеры
        setTimeout(() => {
            featured.forEach(tournament => {
                const timerId = `preview-timer-${tournament.id}`;
                const timerEl = document.getElementById(timerId);
                if (timerEl && tournament.date) {
                    initCountdown(timerId, tournament.date, tournament.start_time || '');
                }
            });
        }, 100);
        
    } catch (error) {
        console.error('Ошибка загрузки избранных турниров:', error);
    }
}

// Создание карточки турнира для превью
function createTournamentPreviewCard(tournament, links) {
    // Приоритет: custom_link > links[discipline] > '#'
    let regLink = '#';
    if (tournament.custom_link && tournament.custom_link.trim()) {
        regLink = tournament.custom_link.trim();
    } else if (links && links[tournament.discipline]) {
        regLink = links[tournament.discipline];
    }
    
    const formattedDate = formatDateForDisplay(tournament.date);
    const timerId = `preview-timer-${tournament.id}`;
    
    return `
        <div class="tournament-preview-card">
            <div class="tournament-preview-header">
                <h4>${tournament.title}</h4>
                <span class="tournament-preview-discipline">
                    ${window.formatDisciplineWithIconSync ? window.formatDisciplineWithIconSync(tournament.discipline) : tournament.discipline}
                </span>
            </div>
            <div class="tournament-preview-info">
                <div class="info-row">
                    <span>📅 ${formattedDate}</span>
                    ${tournament.start_time ? `<span>🕐 ${tournament.start_time.split(':').slice(0, 2).join(':')} МСК</span>` : ''}
                </div>
                <div class="info-row">
                    <span>💰 ${tournament.prize}</span>
                    <span>👥 ${tournament.teams || 0}/${tournament.max_teams}</span>
                </div>
            </div>
            <div class="timer-container" id="${timerId}" data-date="${tournament.date}" data-start-time="${tournament.start_time || ''}"></div>
            <a href="${regLink}" target="_blank" class="btn-submit btn-small" ${regLink === '#' ? 'onclick="alert(\'Ссылка на регистрацию не настроена в админке\'); return false;"' : ''}>
                Подать заявку
            </a>
        </div>
    `;
}

// Функции для работы с датами (взяты из main-api.js)
function formatDateForDisplay(dateStr) {
    try {
        if (dateStr.match(/\d+\s+\w+\s+\d+/)) {
            return dateStr;
        }
        
        const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (parts) {
            const [, year, month, day] = parts;
            const months = [
                'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
            ];
            return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year} г.`;
        }
        
        return dateStr;
    } catch (e) {
        return dateStr;
    }
}

function parseTournamentDate(dateStr) {
    try {
        let day, month, year;
        
        const dotsFormat = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        const dashesFormat = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
        const russianFormat = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s+г\.)?/);
        
        if (dotsFormat) {
            day = parseInt(dotsFormat[1]);
            month = parseInt(dotsFormat[2]) - 1;
            year = parseInt(dotsFormat[3]);
        } else if (dashesFormat) {
            year = parseInt(dashesFormat[1]);
            month = parseInt(dashesFormat[2]) - 1;
            day = parseInt(dashesFormat[3]);
        } else if (russianFormat) {
            const months = {
                'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
                'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
                'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
            };
            day = parseInt(russianFormat[1]);
            month = months[russianFormat[2].toLowerCase()];
            year = parseInt(russianFormat[3]);
        } else {
            return null;
        }
        
        if (month === undefined || isNaN(year) || isNaN(month) || isNaN(day)) {
            return null;
        }
        
        return new Date(year, month, day);
    } catch (error) {
        return null;
    }
}

function parseTournamentDateTime(dateStr, timeStr) {
    try {
        const date = parseTournamentDate(dateStr);
        if (!date || !timeStr) return date;
        
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
        if (timeMatch) {
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            date.setHours(hours, minutes, 0, 0);
        }
        
        return date;
    } catch (error) {
        return null;
    }
}

// Таймер обратного отсчета (взят из main-api.js)
function initCountdown(timerId, dateString, startTime = '') {
    const container = document.getElementById(timerId);
    if (!container) return;
    
    function updateTimer() {
        try {
            let targetDate = parseTournamentDate(dateString);
            
            if (!targetDate || isNaN(targetDate.getTime())) {
                container.innerHTML = '';
                return;
            }
            
            if (startTime && startTime.trim()) {
                const timeMatch = startTime.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
                if (timeMatch) {
                    const hours = parseInt(timeMatch[1]);
                    const minutes = parseInt(timeMatch[2]);
                    targetDate.setHours(hours, minutes, 0, 0);
                }
            }
            
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
            console.error('Ошибка таймера:', error);
            container.innerHTML = '';
        }
    }
    
    updateTimer();
    setInterval(updateTimer, 60000); // Обновляем каждую минуту
}

// Загрузка социальных ссылок
async function loadSocialLinks() {
    try {
        const socialLinks = await API.social.getAll();
        
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
    } catch (error) {
        console.error('Ошибка загрузки социальных ссылок:', error);
    }
}

// Запускаем при загрузке страницы
document.addEventListener('DOMContentLoaded', initializeHomePage);

