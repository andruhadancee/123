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
    
    if (twitchBtn && socialLinks.twitch) {
        twitchBtn.href = socialLinks.twitch;
    }
    
    if (telegramBtn && socialLinks.telegram) {
        telegramBtn.href = socialLinks.telegram;
    }
    
    if (contactBtn && socialLinks.contact) {
        contactBtn.href = socialLinks.contact;
    }
}

