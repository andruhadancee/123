// Главная страница - отображение активных турниров

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Инициализация главной страницы...');
    // ВАЖНО: Сначала загружаем ВСЕ данные из localStorage
    loadTournamentsFromStorage();
    // Потом отображаем турниры
    loadActiveTournaments();
    console.log('✅ Главная страница загружена');
});

function loadActiveTournaments() {
    const grid = document.getElementById('tournaments-grid');
    const tournaments = getActiveTournaments();
    
    if (tournaments.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Активных турниров пока нет</h3>
                <p>Следите за обновлениями в наших социальных сетях</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = tournaments.map(tournament => createTournamentCard(tournament)).join('');
}

function createTournamentCard(tournament) {
    const regLink = tournament.registrationLink || '#';
    console.log(`🎮 Карточка турнира "${tournament.title}": ${regLink}`);
    
    return `
        <div class="tournament-card">
            <div class="tournament-card-header">
                <h2>${tournament.title}</h2>
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
                    <span class="info-label">Команд</span>
                    <span class="info-value">${tournament.teams} / ${tournament.maxTeams}</span>
                </div>
            </div>
            
            <a href="${regLink}" target="_blank" class="btn-submit" ${regLink === '#' ? 'onclick="alert(\'Ссылка на регистрацию не настроена в админке\'); return false;"' : ''}>
                Подать заявку
            </a>
        </div>
    `;
}

