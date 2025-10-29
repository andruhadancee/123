// SPA Navigation - как на Orchid
(function() {
    'use strict';
    
    // Инициализация страницы при навигации
    async function initializePage(url) {
        console.log('Initializing page:', url);
        
        // Запускаем скрипты в зависимости от страницы
        if (url.includes('index.html') || url === '' || !url || url.includes('/index')) {
            // Турниры
            if (typeof window.initializeMainPage === 'function') {
                window.initializeMainPage();
            }
        } else if (url.includes('teams.html') || url.includes('teams')) {
            // Команды
            if (typeof window.initializeTeamsPage === 'function') {
                window.initializeTeamsPage();
            }
        } else if (url.includes('archive.html') || url.includes('archive')) {
            // Архив
            if (typeof window.initializeArchivePage === 'function') {
                window.initializeArchivePage();
            }
        }
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
    
    // Event listeners для навигации - просто переключаем URL
    document.addEventListener('click', function(e) {
        const link = e.target.closest('nav a');
        if (link && link.dataset.page) {
            e.preventDefault();
            const url = link.dataset.page;
            
            // Обновляем URL через History API
            window.history.pushState({}, '', url);
            
            // Обновляем активную кнопку
            document.querySelectorAll('nav a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Запускаем инициализацию
            initializePage(url);
        }
    });
    
    // Обработка browser back/forward buttons
    window.addEventListener('popstate', function(e) {
        const url = window.location.pathname;
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === url) {
                link.classList.add('active');
            }
        });
        initializePage(url);
    });
    
    console.log('✅ SPA Navigation loaded');
})();

