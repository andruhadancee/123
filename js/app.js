// WB Cyber Club - SPA Controller
// Управление навигацией без перезагрузки страницы

// Флаги загрузки данных для каждой секции
const loadedSections = {
    tournaments: false,
    teams: false,
    archive: false
};

// Показать лоадер
function showLoader(text = 'Загрузка...') {
    const loader = document.getElementById('loader');
    const loaderText = loader.querySelector('.loader-text');
    if (loaderText) loaderText.textContent = text;
    loader.classList.add('active');
}

// Скрыть лоадер
function hideLoader() {
    const loader = document.getElementById('loader');
    loader.classList.remove('active');
}

// Переключение между секциями
function switchSection(sectionName) {
    // Скрыть все секции
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });

    // Показать нужную секцию
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Обновить активную ссылку в навигации
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.route === sectionName) {
            link.classList.add('active');
        }
    });

    // Обновить заголовок страницы
    const titles = {
        tournaments: 'WB Cyber Club - Турниры',
        teams: 'WB Cyber Club - Зарегистрированные команды',
        archive: 'WB Cyber Club - Прошедшие турниры'
    };
    document.title = titles[sectionName] || 'WB Cyber Club';

    // Загрузить данные секции, если еще не загружены
    if (!loadedSections[sectionName]) {
        loadSection(sectionName);
    }
}

// Загрузка данных секции
async function loadSection(sectionName) {
    try {
        switch(sectionName) {
            case 'tournaments':
                await loadTournaments();
                break;
            case 'teams':
                await loadTeams();
                break;
            case 'archive':
                await loadArchive();
                break;
        }
        loadedSections[sectionName] = true;
    } catch (error) {
        console.error(`Ошибка загрузки ${sectionName}:`, error);
    }
}

// ===== TOURNAMENTS =====
async function loadTournaments() {
    showLoader('Загрузка турниров...');
    try {
        const tournaments = await API.tournaments.getAll('active');
        const grid = document.getElementById('tournaments-grid');
        
        if (tournaments.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: 40px;">Нет активных турниров</p>';
            return;
        }

        grid.innerHTML = tournaments.map(tournament => createTournamentCard(tournament)).join('');
        await loadSocialLinks();
    } catch (error) {
        console.error('Ошибка загрузки турниров:', error);
        document.getElementById('tournaments-grid').innerHTML = '<p style="text-align: center; color: #ff6b6b; padding: 40px;">Ошибка загрузки турниров</p>';
    } finally {
        hideLoader();
    }
}

function createTournamentCard(tournament) {
    const registrationLinks = JSON.parse(localStorage.getItem('registration_links') || '{}');
    const registrationLink = registrationLinks[tournament.discipline] || '#';
    
    return `
        <div class="tournament-card">
            <div class="tournament-card-header">
                <h2>${tournament.name}</h2>
                <span class="tournament-number">#${tournament.id}</span>
            </div>
            <div class="tournament-info">
                <div class="info-item">
                    <span class="info-label">Дисциплина</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${API.getDisciplineIcon(tournament.discipline)}
                        <span class="info-value">${tournament.discipline}</span>
                    </div>
                </div>
                <div class="info-item">
                    <span class="info-label">Формат</span>
                    <span class="info-value">${tournament.format}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Дата</span>
                    <span class="info-value">${tournament.date}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Награда</span>
                    <span class="info-value">${tournament.prize}</span>
                </div>
            </div>
            <a href="${registrationLink}" class="btn-submit" target="_blank" rel="noopener noreferrer">Подать заявку</a>
        </div>
    `;
}

// ===== TEAMS =====
async function loadTeams() {
    showLoader('Загрузка команд...');
    try {
        const [teams, tournaments] = await Promise.all([
            API.teams.getAll(),
            API.tournaments.getAll('active')
        ]);
        
        const container = document.getElementById('teams-container');
        
        if (teams.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: 40px;">Нет зарегистрированных команд</p>';
            return;
        }

        const teamsByTournament = {};
        teams.forEach(team => {
            if (!teamsByTournament[team.tournament_id]) {
                teamsByTournament[team.tournament_id] = [];
            }
            teamsByTournament[team.tournament_id].push(team);
        });

        container.innerHTML = Object.keys(teamsByTournament).map(tournamentId => {
            const tournament = tournaments.find(t => t.id == tournamentId);
            if (!tournament) return '';
            return createTournamentTeamsSection(tournament, teamsByTournament[tournamentId]);
        }).join('');

        await loadSocialLinks();
    } catch (error) {
        console.error('Ошибка загрузки команд:', error);
        document.getElementById('teams-container').innerHTML = '<p style="text-align: center; color: #ff6b6b; padding: 40px;">Ошибка загрузки команд</p>';
    } finally {
        hideLoader();
    }
}

function createTournamentTeamsSection(tournament, teams) {
    return `
        <div class="tournament-section">
            <h2 style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px;">
                ${API.getDisciplineIcon(tournament.discipline)}
                <span style="color: var(--color-purple);">${tournament.discipline}</span>
                <span style="flex: 0 0 auto;">— ${tournament.name}</span>
            </h2>
            <div class="teams-list">
                ${teams.map(team => createTeamCard(team, tournament)).join('')}
            </div>
        </div>
    `;
}

function createTeamCard(team, tournament) {
    return `
        <div class="team-card">
            <div class="team-name">${team.name}</div>
            <div class="team-info">
                <span>👥 ${team.players} игроков</span>
            </div>
        </div>
    `;
}

// ===== ARCHIVE =====
async function loadArchive() {
    showLoader('Загрузка архива...');
    try {
        const tournaments = await API.tournaments.getAll('past');
        const grid = document.getElementById('archive-grid');
        
        if (tournaments.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: 40px;">Нет прошедших турниров</p>';
            return;
        }

        grid.innerHTML = tournaments.map(tournament => createArchiveTournamentCard(tournament)).join('');
        await loadSocialLinks();
    } catch (error) {
        console.error('Ошибка загрузки архива:', error);
        document.getElementById('archive-grid').innerHTML = '<p style="text-align: center; color: #ff6b6b; padding: 40px;">Ошибка загрузки архива</p>';
    } finally {
        hideLoader();
    }
}

function createArchiveTournamentCard(tournament) {
    return `
        <div class="tournament-card">
            <div class="tournament-card-header">
                <h2>${tournament.name}</h2>
                <span class="tournament-number">#${tournament.id}</span>
            </div>
            <div class="tournament-info">
                <div class="info-item">
                    <span class="info-label">Дисциплина</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${API.getDisciplineIcon(tournament.discipline)}
                        <span class="info-value">${tournament.discipline}</span>
                    </div>
                </div>
                <div class="info-item">
                    <span class="info-label">Формат</span>
                    <span class="info-value">${tournament.format}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Дата</span>
                    <span class="info-value">${tournament.date}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Победитель</span>
                    <span class="info-value">${tournament.winner || 'Не определен'}</span>
                </div>
            </div>
        </div>
    `;
}

// ===== SOCIAL LINKS =====
async function loadSocialLinks() {
    try {
        const socialLinks = await API.social.get();
        
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
        console.error('Ошибка загрузки соц. ссылок:', error);
    }
}

// ===== NAVIGATION =====
function navigate(route) {
    const routes = {
        '/': 'tournaments',
        '/teams': 'teams',
        '/archive': 'archive'
    };

    const sectionName = routes[route] || 'tournaments';
    switchSection(sectionName);
}

// Обработка кликов по навигации
document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-route]');
    if (link && link.classList.contains('nav-link')) {
        e.preventDefault();
        const route = link.getAttribute('href');
        history.pushState({ route }, '', route);
        navigate(route);
    }
    
    // Для лого
    if (link && link.classList.contains('logo')) {
        e.preventDefault();
        history.pushState({ route: '/' }, '', '/');
        navigate('/');
    }
});

// Обработка кнопок браузера (назад/вперед)
window.addEventListener('popstate', (e) => {
    const route = e.state?.route || '/';
    navigate(route);
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    navigate(currentPath);
});

