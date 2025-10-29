// Страница зарегистрированных команд (с API)

let allTeamsData = {};
let selectedDisciplineTeams = 'all';

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Инициализация страницы команд...');
    await loadRegisteredTeams();
    await loadDisciplineFilters();
    await loadSocialLinks();
    hideLoader();
    console.log('✅ Страница команд загружена');
});

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.style.display = 'none', 300);
    }
}

async function loadRegisteredTeams() {
    const container = document.getElementById('teams-container');
    
    const tournaments = await API.tournaments.getAll('active');
    allTeamsData = await API.teams.getAll();
    
    if (tournaments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Активных турниров пока нет</h3>
                <p>Зарегистрированные команды появятся здесь после создания турниров</p>
            </div>
        `;
        return;
    }
    
    displayFilteredTeams();
}

function displayFilteredTeams() {
    const container = document.getElementById('teams-container');
    
    const tournaments = Object.values(allTeamsData).flat();
    const uniqueTournaments = [...new Set(tournaments.map(t => t.tournament_id))];
    
    let filtered = uniqueTournaments;
    if (selectedDisciplineTeams !== 'all') {
        // Фильтруем по дисциплине
        filtered = uniqueTournaments.filter(id => {
            const tournamentTeams = tournaments.filter(t => t.tournament_id === id);
            return tournamentTeams.some(t => t.discipline === selectedDisciplineTeams);
        });
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Команд по выбранной дисциплине нет</h3>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(tournamentId => {
        const tournament = allTeamsData[tournamentId]?.[0];
        if (!tournament) return '';
        return createTournamentTeamsSection(tournament, allTeamsData[tournamentId] || []);
    }).join('');
}

async function loadDisciplineFilters() {
    const filtersContainer = document.getElementById('teams-discipline-filters');
    if (!filtersContainer) return;
    
    const disciplines = await API.disciplines.getAll();
    const availableDisciplines = [...new Set(Object.values(allTeamsData).flat().map(t => t.discipline))];
    
    filtersContainer.innerHTML = `
        <button class="filter-btn active" data-discipline="all" onclick="filterTeamsByDiscipline('all')">
            Все
        </button>
        ${availableDisciplines.map(d => `
            <button class="filter-btn" data-discipline="${d}" onclick="filterTeamsByDiscipline('${d}')">
                ${getDisciplineIcon(d)} ${d}
            </button>
        `).join('')}
    `;
}

function filterTeamsByDiscipline(discipline) {
    selectedDisciplineTeams = discipline;
    
    document.querySelectorAll('#teams-discipline-filters .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.discipline === discipline) {
            btn.classList.add('active');
        }
    });
    
    displayFilteredTeams();
}

window.filterTeamsByDiscipline = filterTeamsByDiscipline;

function createTournamentTeamsSection(tournament, teams) {
    const teamsHTML = teams.length > 0 
        ? teams.map(team => createTeamCard(team, tournament)).join('')
        : '<div class="empty-state"><p>Команды еще не зарегистрировались</p></div>';
    
    return `
        <div class="tournament-section">
            <h2>
                <span class="tournament-discipline-line">
                    <span class="tournament-header-icon">${getDisciplineIcon(tournament.discipline)}</span>
                    <span class="tournament-header-discipline">${tournament.discipline}</span>
                </span>
                <span class="tournament-title-line">${tournament.title}</span>
            </h2>
            <div class="teams-list">
                ${teamsHTML}
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

