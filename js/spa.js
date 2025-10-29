// SPA Navigation - как на Orchid
(function() {
    'use strict';
    
    // Загружаем страницу через AJAX
    async function loadPage(url) {
        try {
            console.log('Loading page:', url);
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to load page');
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Обновляем только основной контент
            const mainContent = doc.querySelector('main');
            if (mainContent) {
                document.querySelector('main').innerHTML = mainContent.innerHTML;
                console.log('Main content updated');
            }
            
            // Обновляем title
            document.title = doc.title;
            
            // Обновляем активную кнопку в навигации
            updateNavigation(url);
            
            // Запускаем инициализацию страницы
            initializePage(url);
            
        } catch (error) {
            console.error('Error loading page:', error);
            // Если AJAX не работает, перезагружаем страницу
            window.location.href = url;
        }
    }
    
    // Обновляем навигацию
    function updateNavigation(url) {
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
            const linkPage = link.dataset.page || link.getAttribute('href');
            if (linkPage === url || 
                (url.includes('index.html') && linkPage && (linkPage.includes('index.html') || linkPage === '#'))) {
                link.classList.add('active');
            }
        });
    }
    
    // Инициализация страницы
    function initializePage(url) {
        console.log('Initializing page:', url);
        
        // НЕ показываем загрузчик
        
        // Запускаем скрипты в зависимости от страницы сразу
        if (url.includes('index.html') || url === '' || !url || url.includes('/index')) {
            // Турниры
            console.log('Initializing tournaments page');
            if (typeof window.initializeMainPage === 'function') {
                window.initializeMainPage();
            }
        } else if (url.includes('teams.html') || url.includes('teams')) {
            // Команды
            console.log('Initializing teams page');
            if (typeof window.initializeTeamsPage === 'function') {
                window.initializeTeamsPage();
            }
        } else if (url.includes('archive.html') || url.includes('archive')) {
            // Архив
            console.log('Initializing archive page');
            if (typeof window.initializeArchivePage === 'function') {
                window.initializeArchivePage();
            }
        }
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
    
    // Event listeners для навигации
    document.addEventListener('click', function(e) {
        const link = e.target.closest('nav a');
        if (link && link.dataset.page) {
            e.preventDefault();
            const url = link.dataset.page;
            
            console.log('Navigation clicked:', url);
            
            // НЕ показываем загрузчик - как на Orchid
            loadPage(url);
        }
    });
    
    // Проверяем при загрузке страницы, нужно ли запустить инициализацию
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const currentUrl = window.location.href;
            if (!currentUrl.includes('#')) {
                initializePage(currentUrl);
            }
        });
    } else {
        const currentUrl = window.location.href;
        if (!currentUrl.includes('#')) {
            initializePage(currentUrl);
        }
    }
    
    console.log('✅ SPA Navigation loaded');
})();

