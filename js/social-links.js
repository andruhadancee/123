// Загрузка социальных ссылок на главной странице

document.addEventListener('DOMContentLoaded', function() {
    loadSocialLinksToPage();
});

function loadSocialLinksToPage() {
    console.log('🔗 Загрузка социальных ссылок...');
    const socialLinks = JSON.parse(localStorage.getItem('wbcyber_social_links') || '{}');
    console.log('📋 Социальные ссылки:', socialLinks);
    
    // Обновляем ссылки на всех кнопках
    const twitchBtn = document.querySelector('.social-btn.twitch');
    const telegramBtn = document.querySelector('.social-btn.telegram');
    const contactBtn = document.querySelector('.btn-contact');
    
    // Применяем ЛЮБЫЕ ссылки которые ввел пользователь
    if (twitchBtn) {
        if (socialLinks.twitch && socialLinks.twitch.trim()) {
            twitchBtn.href = socialLinks.twitch.trim();
            console.log('✅ Twitch:', twitchBtn.href);
        } else {
            twitchBtn.href = '#';
            console.log('⚠️ Twitch: нет ссылки');
        }
    }
    
    if (telegramBtn) {
        if (socialLinks.telegram && socialLinks.telegram.trim()) {
            telegramBtn.href = socialLinks.telegram.trim();
            console.log('✅ Telegram:', telegramBtn.href);
        } else {
            telegramBtn.href = '#';
            console.log('⚠️ Telegram: нет ссылки');
        }
    }
    
    if (contactBtn) {
        if (socialLinks.contact && socialLinks.contact.trim()) {
            contactBtn.href = socialLinks.contact.trim();
            console.log('✅ Связаться:', contactBtn.href);
        } else {
            contactBtn.href = '#';
            console.log('⚠️ Связаться: нет ссылки');
        }
    }
}

