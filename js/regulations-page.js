// Страница регламента

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Инициализация страницы регламента...');
    
    await loadRegulations();
    await loadSocialLinks();
    hideLoader();
    console.log('✅ Страница регламента загружена');
});

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.style.display = 'none', 300);
    }
}

async function loadRegulations() {
    const grid = document.getElementById('regulations-grid');
    if (!grid) return;
    
    const regulations = await API.regulations.getAll();
    
    if (!regulations || regulations.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Регламенты пока не добавлены</h3>
                <p>Регламенты появятся здесь после их добавления администратором</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = regulations.map(reg => `
        <a href="${reg.pdf_url}" target="_blank" class="regulation-card">
            ${getDisciplineIcon(reg.discipline_name)} 
            <div class="regulation-info">
                <h3>${reg.discipline_name}</h3>
                <span class="regulation-badge">PDF</span>
            </div>
        </a>
    `).join('');
}

async function loadSocialLinks() {
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
}

