// Страница зарегистрированных команд (с API)

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Инициализация страницы команд...');
    await loadRegisteredTeams();
    await loadSocialLinks();
    console.log('✅ Страница команд загружена');
});

async function loadRegisteredTeams() {
    const container = document.getElementById('teams-container');
    container.innerHTML = '<div class="loading">Загрузка команд...</div>';
    
    const tournaments = await API.tournaments.getAll('active');
    const allTeams = await API.teams.getAll();
    
    if (tournaments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Активных турниров пока нет</h3>
                <p>Зарегистрированные команды появятся здесь после создания турниров</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = tournaments.map(tournament => {
        const teams = allTeams[tournament.id] || [];
        return createTournamentTeamsSection(tournament, teams);
    }).join('');
}

function createTournamentTeamsSection(tournament, teams) {
    const teamsHTML = teams.length > 0 
        ? teams.map(team => createTeamCard(team)).join('')
        : '<div class="empty-state"><p>Команды еще не зарегистрировались</p></div>';
    
    return `
        <div class="tournament-section">
            <h2>${tournament.title}</h2>
            <div class="teams-list">
                ${teamsHTML}
            </div>
        </div>
    `;
}

function createTeamCard(team) {
    return `
        <div class="team-card">
            <div class="team-name">${team.name}</div>
            <div class="team-info">
                <span>👤 ${team.captain}</span>
                <span>👥 ${team.players} игроков</span>
                <span>📅 ${team.registration_date}</span>
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
    if (socialLinks.contact) {
        const contactBtn = document.querySelector('.btn-contact');
        if (contactBtn) contactBtn.href = socialLinks.contact;
    }
}

