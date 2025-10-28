// Загрузка социальных ссылок на главной странице

document.addEventListener('DOMContentLoaded', function() {
    loadSocialLinksToPage();
});

function loadSocialLinksToPage() {
    const socialLinks = JSON.parse(localStorage.getItem('wbcyber_social_links') || '{}');
    
    // Обновляем ссылки на всех кнопках
    const twitchBtn = document.querySelector('.social-btn.twitch');
    const telegramBtn = document.querySelector('.social-btn.telegram');
    const contactBtn = document.querySelector('.btn-contact');
    
    // Применяем ЛЮБЫЕ ссылки которые ввел пользователь
    if (twitchBtn) {
        if (socialLinks.twitch && socialLinks.twitch.trim()) {
            twitchBtn.href = socialLinks.twitch.trim();
        } else {
            twitchBtn.href = '#'; // Если пусто, ставим #
        }
    }
    
    if (telegramBtn) {
        if (socialLinks.telegram && socialLinks.telegram.trim()) {
            telegramBtn.href = socialLinks.telegram.trim();
        } else {
            telegramBtn.href = '#';
        }
    }
    
    if (contactBtn) {
        if (socialLinks.contact && socialLinks.contact.trim()) {
            contactBtn.href = socialLinks.contact.trim();
        } else {
            contactBtn.href = '#';
        }
    }
}

