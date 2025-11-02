// Календарь с фильтром по дисциплинам и отображением событий в квадратиках
(function(){
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('month-title');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    const modal = document.getElementById('event-modal');
    const modalClose = document.getElementById('event-modal-close');
    const eventTitle = document.getElementById('event-title');
    const eventBody = document.getElementById('event-body');
    const filtersInner = document.getElementById('calendar-filters');

    let current = new Date();
    let currentlyOpenedDate = null; // Для автообновления
    let allEventsCache = []; // Кеш всех событий
    // Восстанавливаем сохраненный месяц из localStorage
    const savedMonth = localStorage.getItem('calendarCurrentMonth');
    if (savedMonth) {
        try {
            const saved = JSON.parse(savedMonth);
            current = new Date(saved.year, saved.month, 1);
        } catch (e) {
            console.warn('Не удалось восстановить месяц календаря:', e);
            current.setDate(1);
        }
    } else {
        current.setDate(1);
    }
    let events = [];
    let selectedDiscipline = 'all';
    let disciplines = [];
    let registrationLinks = {}; // Кеш ссылок на регистрацию

    // Цвета для дисциплин - смягчённые тона
    function getDisciplineColor(discipline) {
        const colors = {
            'Dota 2': '#b83d2d',           // приглушённый красный
            'CS 2': '#cc8844',             // приглушённый оранжевый
            'Valorant': '#c85565',         // приглушённый розовый
            'Overwatch 2': '#cc8844',      // приглушённый оранжевый
            'League of Legends': '#a0853a', // приглушённый золотой
            'PUBG': '#5a7aa5',             // приглушённый синий
            'Mobile Legends': '#5a9a5a',   // приглушённый зелёный
            'MLBB': '#5a9a5a',             // приглушённый зелёный
            'CS:GO': '#cc8844',            // приглушённый оранжевый
            'Counter-Strike 2': '#cc8844'  // приглушённый оранжевый
        };
        // Если дисциплина не найдена, генерируем приглушённый цвет
        if (!colors[discipline]) {
            let hash = 0;
            for (let i = 0; i < discipline.length; i++) {
                hash = discipline.charCodeAt(i) + ((hash << 5) - hash);
            }
            const hue = hash % 360;
            return `hsl(${hue}, 45%, 50%)`; // Более приглушённые цвета
        }
        return colors[discipline];
    }
    
    // Функция проверки, идёт ли турнир
    function isTournamentActive(event) {
        if (!event.start_time) return false;
        
        try {
            // Парсим дату события
            const eventDateStr = (event.event_date || event.eventDate).slice(0, 10); // YYYY-MM-DD
            const [year, month, day] = eventDateStr.split('-').map(n => parseInt(n));
            
            // Парсим время
            const timeMatch = event.start_time.match(/(\d{1,2}):(\d{2})/);
            if (!timeMatch) return false;
            
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            
            // Создаём Date объект начала турнира
            const startDateTime = new Date(year, month - 1, day, hours, minutes, 0);
            
            // Проверяем, прошло ли время старта
            const now = new Date();
            return now >= startDateTime;
        } catch (error) {
            console.error('Ошибка проверки статуса турнира:', error);
            return false;
        }
    }

    function fmtMonth(d){
        const y = d.getFullYear();
        const m = String(d.getMonth()+1).padStart(2,'0');
        return `${y}-${m}`;
    }

    async function load(){
        const monthKey = fmtMonth(current);
        events = await API.calendar.getAll(monthKey);
        allEventsCache = events; // Сохраняем в кеш
        disciplines = await API.disciplines.getAll();
        registrationLinks = await API.links.getAll(); // Загружаем ссылки для кнопки "Подать заявку"
        loadFilters();
        render();
        hideLoader();
    }
    
    function hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.style.display = 'none', 300);
        }
    }

    function loadFilters() {
        if (!filtersInner) return;
        
        // Показываем ВСЕ дисциплины из базы, не только те что в событиях
        const existingH3 = filtersInner.querySelector('h3');
        filtersInner.innerHTML = `
            ${existingH3 ? existingH3.outerHTML : '<h3>Фильтры дисциплин</h3>'}
            <button class="filter-btn ${selectedDiscipline === 'all' ? 'active' : ''}" data-discipline="all">Все</button>
            ${disciplines.map(d => `
                <button class="filter-btn ${selectedDiscipline === d ? 'active' : ''}" 
                        data-discipline="${d}" 
                        style="background: ${getDisciplineColor(d)}; border-color: ${getDisciplineColor(d)};">
                    ${window.getDisciplineIcon ? window.getDisciplineIcon(d) : ''} ${d}
                </button>
            `).join('')}
        `;
        
        filtersInner.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedDiscipline = btn.dataset.discipline;
                filtersInner.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                render();
            });
        });
    }

    function render(){
        const month = current.getMonth();
        const year = current.getFullYear();
        title.textContent = current.toLocaleString('ru-RU', { month:'long', year:'numeric' });

        grid.classList.add('calendar-grid');
        grid.innerHTML = '';
        const weekdays = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
        weekdays.forEach(w => {
            const h = document.createElement('div');
            h.textContent = w;
            h.style.color = 'var(--color-text-secondary)';
            h.style.fontWeight = '700';
            grid.appendChild(h);
        });

        const firstDay = new Date(year, month, 1);
        const startOffset = (firstDay.getDay()+6)%7;
        const daysInMonth = new Date(year, month+1, 0).getDate();

        for(let i=0;i<startOffset;i++){
            const empty = document.createElement('div');
            empty.className = 'calendar-cell calendar-empty';
            grid.appendChild(empty);
        }

        function fmtLocal(y,m,d){
            return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        }

        // Фильтруем события по дисциплине и убираем дубликаты по tournament_id
        let filteredEvents = events;
        if (selectedDiscipline !== 'all') {
            filteredEvents = events.filter(e => e.discipline === selectedDiscipline);
        }
        
        // Убираем дубликаты по tournament_id - если есть tournament_id, оставляем только одно событие
        const uniqueEvents = [];
        const seenTournamentIds = new Set();
        filteredEvents.forEach(e => {
            if (e.tournament_id) {
                if (!seenTournamentIds.has(e.tournament_id)) {
                    seenTournamentIds.add(e.tournament_id);
                    uniqueEvents.push(e);
                }
            } else {
                // Для событий без tournament_id проверяем по title + date
                const key = `${e.title}_${(e.event_date || e.eventDate).slice(0,10)}`;
                if (!seenTournamentIds.has(key)) {
                    seenTournamentIds.add(key);
                    uniqueEvents.push(e);
                }
            }
        });
        filteredEvents = uniqueEvents;

        for(let day=1; day<=daysInMonth; day++){
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';

            const date = new Date(year, month, day);
            const dateStr = fmtLocal(year, month, day);
            const dayEventsFiltered = filteredEvents.filter(e => (e.event_date || e.eventDate).slice(0,10) === dateStr);
            
            // Убираем дубликаты из всех событий тоже
            const dayEventsAllRaw = events.filter(e => (e.event_date || e.eventDate).slice(0,10) === dateStr);
            const dayEventsAll = [];
            const seenAll = new Set();
            dayEventsAllRaw.forEach(e => {
                const key = e.tournament_id ? `tournament_${e.tournament_id}` : `${e.title}_${dateStr}`;
                if (!seenAll.has(key)) {
                    seenAll.add(key);
                    dayEventsAll.push(e);
                }
            });

            const head = document.createElement('div');
            head.textContent = String(day);
            head.className = 'calendar-date-num';
            cell.appendChild(head);

            if (dayEventsFiltered.length > 0){
                cell.classList.add('calendar-has-events');
                
                // Определяем цвет по первой дисциплине
                const firstEvent = dayEventsFiltered[0];
                const firstDiscipline = firstEvent.discipline;
                if (firstDiscipline) {
                    const color = getDisciplineColor(firstDiscipline);
                    cell.style.borderColor = color;
                    cell.style.borderWidth = '2px';
                }
                
                // Проверяем, идёт ли турнир (зелёный фон)
                if (isTournamentActive(firstEvent)) {
                    cell.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                }
                
                // Показываем логотип дисциплины вместо цифры
                const disciplineIcon = document.createElement('div');
                disciplineIcon.className = 'calendar-discipline-icon';
                if (firstDiscipline && window.getDisciplineIcon) {
                    disciplineIcon.innerHTML = window.getDisciplineIcon(firstDiscipline);
                } else {
                    disciplineIcon.innerHTML = '<span class="discipline-icon discipline-icon-emoji">🎮</span>';
                }
                cell.appendChild(disciplineIcon);

                // Отображаем текст событий сразу в квадратике
                const eventsText = document.createElement('div');
                eventsText.className = 'calendar-events-text';
                eventsText.innerHTML = dayEventsFiltered.slice(0, 2).map(e => {
                    const shortTitle = e.title.length > 15 ? e.title.substring(0, 15) + '...' : e.title;
                    return `<div class="calendar-event-item" style="color: ${firstDiscipline ? getDisciplineColor(firstDiscipline) : '#8b5abf'}">${shortTitle}</div>`;
                }).join('');
                if (dayEventsFiltered.length > 2) {
                    eventsText.innerHTML += `<div class="calendar-event-more">+${dayEventsFiltered.length - 2}</div>`;
                }
                cell.appendChild(eventsText);
            }

            // При клике показываем все события этого дня (не только отфильтрованные)
            cell.onclick = () => {
                currentlyOpenedDate = dateStr;
                openDay(dayEventsAll, dateStr);
            };
            grid.appendChild(cell);
        }
    }

    function openDay(dayEvents, dateStr){
        eventTitle.className = 'calendar-modal-title';
        if (!dayEvents || dayEvents.length === 0){
            eventTitle.textContent = `Событий нет — ${dateStr}`;
            eventBody.innerHTML = '<p style="color:var(--color-text-secondary)">На этот день пока ничего не запланировано.</p>';
        } else {
            // Убираем дубликаты по tournament_id или по комбинации title + date
            const uniqueEvents = [];
            const seen = new Set();
            
            dayEvents.forEach(e => {
                const key = e.tournament_id ? `tournament_${e.tournament_id}` : `${e.title}_${dateStr}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueEvents.push(e);
                }
            });
            
            eventTitle.textContent = `События — ${dateStr}`;
            eventBody.innerHTML = `
                <div class="calendar-events-wrap">
                    ${uniqueEvents.map(e => {
                        // Определяем ссылку для регистрации (приоритет: custom_link > registration_link > links[discipline])
                        let regLink = '#';
                        if (e.custom_link && e.custom_link.trim()) {
                            regLink = e.custom_link.trim();
                        } else if (e.registration_link && e.registration_link.trim()) {
                            regLink = e.registration_link.trim();
                        } else if (e.discipline && registrationLinks && registrationLinks[e.discipline]) {
                            regLink = registrationLinks[e.discipline];
                        }
                        
                        // Генерируем правильную кнопку
                        const buttonHtml = getCalendarEventButton(e, regLink);
                        
                        return `
                        <div class="calendar-event-card">
                            ${e.image_url || e.imageUrl ? `<img class="calendar-event-img" src="${e.image_url || e.imageUrl}" alt="${e.title}">` : ''}
                            <div class="calendar-event-content">
                                <h3>${e.title}</h3>
                                ${e.discipline ? `<div class="calendar-event-discipline" style="color: ${getDisciplineColor(e.discipline)}">${e.discipline}</div>` : ''}
                                ${e.prize ? `<div class="calendar-event-prize">Призовой фонд: ${e.prize}</div>` : ''}
                                ${e.start_time ? `<div class="calendar-event-time">Время старта: ${e.start_time} МСК</div>` : ''}
                                ${e.description ? `<div class="calendar-event-desc">${e.description}</div>` : ''}
                                ${e.max_teams || e.maxTeams ? `<div class="calendar-event-teams">Команд: ${e.max_teams || e.maxTeams}</div>` : ''}
                                ${buttonHtml}
                            </div>
                        </div>
                    `;
                    }).join('')}
                </div>`;
        }
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    }
    
    // Функция для генерации кнопки события календаря
    function getCalendarEventButton(event, regLink) {
        if (!event.start_time) {
            // Если время не указано, всегда показываем кнопку регистрации
            return `<a href="${regLink}" target="_blank" class="btn-submit calendar-apply-btn" ${regLink === '#' ? 'onclick="alert(\'Ссылка на регистрацию не настроена в админке\'); return false;"' : ''}>
                Подать заявку
            </a>`;
        }
        
        const isActive = isTournamentActive(event);
        
        if (isActive) {
            // Турнир начался - показываем кнопку "Смотреть" или "Регистрация закрыта"
            const watchUrl = event.watch_url;
            if (watchUrl && watchUrl.trim()) {
                return `<a href="${watchUrl.trim()}" target="_blank" class="btn-submit calendar-apply-btn" style="background: linear-gradient(90deg, #10b981 0%, #059669 100%);">
                    Смотреть турнир
                </a>`;
            } else {
                return `<div class="btn-submit calendar-apply-btn" style="background: rgba(107, 114, 128, 0.6); cursor: not-allowed;">
                    Регистрация закрыта
                </div>`;
            }
        } else {
            // До старта - показываем кнопку регистрации
            return `<a href="${regLink}" target="_blank" class="btn-submit calendar-apply-btn" ${regLink === '#' ? 'onclick="alert(\'Ссылка на регистрацию не настроена в админке\'); return false;"' : ''}>
                Подать заявку
            </a>`;
        }
    }
    
    function closeModal(){
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
    
    modalClose.addEventListener('click', closeModal);
    window.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });
    modal.addEventListener('click', (e)=>{ if (e.target === modal) closeModal(); });
    function saveCurrentMonth() {
        localStorage.setItem('calendarCurrentMonth', JSON.stringify({
            year: current.getFullYear(),
            month: current.getMonth()
        }));
    }
    
    prevBtn.addEventListener('click', ()=>{ 
        current.setMonth(current.getMonth()-1); 
        saveCurrentMonth();
        load(); 
    });
    nextBtn.addEventListener('click', ()=>{ 
        current.setMonth(current.getMonth()+1); 
        saveCurrentMonth();
        load(); 
    });

    // Загружаем социальные ссылки
    async function loadSocialLinks() {
        try {
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
        } catch (err) {
            console.error('Ошибка загрузки социальных ссылок:', err);
        }
    }

    loadSocialLinks();
    load();
    
    // Автоматическое обновление кнопок каждую минуту для проверки времени старта
    setInterval(() => {
        const modal = document.getElementById('event-modal');
        if (modal && modal.classList.contains('active') && currentlyOpenedDate) {
            // Если модалка открыта - перерендерим события
            const dayEventsForDate = allEventsCache.filter(e => (e.event_date || e.eventDate).slice(0, 10) === currentlyOpenedDate);
            openDay(dayEventsForDate, currentlyOpenedDate);
        }
    }, 60000); // Каждую минуту
})();
