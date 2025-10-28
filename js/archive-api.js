// Страница прошедших турниров (с API)

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Инициализация страницы архива...');
    await loadPastTournaments();
    await loadSocialLinks();
    console.log('✅ Страница архива загружена');
});

async function loadPastTournaments() {
    const grid = document.getElementById('archive-grid');
    grid.innerHTML = '<div class="loading">Загрузка архива...</div>';
    
    const tournaments = await API.tournaments.getAll('finished');
    
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
                    <span class="info-value">${tournament.teams || 0} команд</span>
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

