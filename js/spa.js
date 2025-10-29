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
        
        // Убираем загрузчик через секунду
        setTimeout(() => {
            const loader = document.getElementById('loader');
            if (loader) {
                loader.style.display = 'none';
            }
        }, 500);
        
        // Запускаем скрипты в зависимости от страницы
        if (url.includes('index.html') || url === '' || !url || url.includes('/index')) {
            // Турниры - используем функции из main-api.js
            console.log('Initializing tournaments page');
            // Инициализируем через небольшой таймаут, чтобы DOM успел обновиться
            setTimeout(() => {
                // Проверяем наличие кнопки фильтров
                const filterContainer = document.getElementById('discipline-filters');
                if (filterContainer) {
                    loadDisciplineFilters();
                }
                
                // Загружаем турниры
                if (typeof loadTournamentsData === 'function') {
                    loadTournamentsData();
                }
            }, 300);
        } else if (url.includes('teams.html') || url.includes('teams')) {
            // Команды - используем функции из teams-api.js
            console.log('Initializing teams page');
            setTimeout(() => {
                // Загружаем команды
                if (typeof loadRegisteredTeams === 'function') {
                    loadRegisteredTeams();
                }
            }, 300);
        } else if (url.includes('archive.html') || url.includes('archive')) {
            // Архив - используем функции из archive-api.js
            console.log('Initializing archive page');
            setTimeout(() => {
                // Загружаем архив
                if (typeof loadArchiveTournaments === 'function') {
                    loadArchiveTournaments();
                }
            }, 300);
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
            
            // Показываем загрузчик
            const loader = document.getElementById('loader');
            if (loader) {
                loader.style.display = 'flex';
            }
            
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

