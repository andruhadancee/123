// SPA Navigation - как на Orchid
(function() {
    'use strict';
    
    // Загружаем страницу через AJAX
    async function loadPage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to load page');
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Обновляем только основной контент
            const mainContent = doc.querySelector('main');
            if (mainContent) {
                document.querySelector('main').innerHTML = mainContent.innerHTML;
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
            if (link.dataset.page === url || 
                (url.includes('index.html') && link.href.includes('index.html')) ||
                (url.includes('teams.html') && link.href.includes('teams.html')) ||
                (url.includes('archive.html') && link.href.includes('archive.html'))) {
                link.classList.add('active');
            }
        });
    }
    
    // Инициализация страницы
    function initializePage(url) {
        // Убираем загрузчик
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'none';
        }
        
        // Запускаем скрипты в зависимости от страницы
        if (url.includes('index.html') || url === '') {
            // Турниры
            if (typeof loadTournaments === 'function') {
                loadTournaments();
            }
        } else if (url.includes('teams.html')) {
            // Команды
            // Код в teams-api.js уже загрузится
        } else if (url.includes('archive.html')) {
            // Архив
            if (typeof loadArchive === 'function') {
                loadArchive();
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
            
            // Показываем загрузчик на мгновение
            const loader = document.getElementById('loader');
            if (loader) {
                loader.style.display = 'flex';
                setTimeout(() => loadPage(url), 100);
            } else {
                loadPage(url);
            }
        }
    });
    
    console.log('✅ SPA Navigation loaded');
})();

