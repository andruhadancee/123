// Страница прошедших турниров

document.addEventListener('DOMContentLoaded', function() {
    loadPastTournaments();
});

function loadPastTournaments() {
    const grid = document.getElementById('archive-grid');
    const tournaments = getPastTournaments();
    
    if (tournaments.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Прошедших турниров пока нет</h3>
                <p>История турниров появится здесь после их завершения</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = tournaments.map(tournament => createPastTournamentCard(tournament)).join('');
}

function createPastTournamentCard(tournament) {
    return `
        <div class="tournament-card">
            <div class="tournament-card-header">
                <h2>${tournament.title}</h2>
                <span class="tournament-number">#${tournament.number}</span>
            </div>
            
            <div class="tournament-info">
                <div class="info-item">
                    <span class="info-label">Дисциплина</span>
                    <span class="info-value">${tournament.discipline}</span>
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
                    <span class="info-value">${tournament.teams} команд</span>
                </div>
                ${tournament.winner ? `
                <div class="info-item" style="grid-column: 1 / -1;">
                    <span class="info-label">🏆 Победитель</span>
                    <span class="info-value">${tournament.winner}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

