// Страница зарегистрированных команд

document.addEventListener('DOMContentLoaded', function() {
    loadRegisteredTeams();
});

function loadRegisteredTeams() {
    const container = document.getElementById('teams-container');
    const tournaments = getActiveTournaments();
    const allTeams = getAllRegisteredTeams();
    
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
                <span>📅 ${team.registrationDate}</span>
            </div>
        </div>
    `;
}

