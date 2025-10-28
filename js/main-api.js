// Главная страница - отображение активных турниров (с API)

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Инициализация главной страницы...');
    await loadActiveTournaments();
    await loadSocialLinks();
    console.log('✅ Главная страница загружена');
});

async function loadActiveTournaments() {
    const grid = document.getElementById('tournaments-grid');
    grid.innerHTML = '<div class="loading">Загрузка турниров...</div>';
    
    const tournaments = await API.tournaments.getAll('active');
    const links = await API.links.getAll();
    
    if (tournaments.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Активных турниров пока нет</h3>
                <p>Следите за обновлениями в наших социальных сетях</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = tournaments.map(tournament => createTournamentCard(tournament, links)).join('');
}

function createTournamentCard(tournament, links) {
    // Приоритет: custom_link > links[discipline] > '#'
    let regLink = '#';
    if (tournament.custom_link && tournament.custom_link.trim()) {
        regLink = tournament.custom_link.trim();
    } else if (links[tournament.discipline]) {
        regLink = links[tournament.discipline];
    }
    
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
                    <span class="info-value">${tournament.teams || 0} / ${tournament.max_teams}</span>
                </div>
            </div>
            
            <a href="${regLink}" target="_blank" class="btn-submit" ${regLink === '#' ? 'onclick="alert(\'Ссылка на регистрацию не настроена в админке\'); return false;"' : ''}>
                Подать заявку
            </a>
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

