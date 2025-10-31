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
    const filtersContainer = document.getElementById('calendar-filters');

    let current = new Date();
    current.setDate(1);
    let events = [];
    let selectedDiscipline = 'all';
    let disciplines = [];
    let registrationLinks = {}; // Кеш ссылок на регистрацию

    // Цвета для дисциплин
    function getDisciplineColor(discipline) {
        const colors = {
            'Dota 2': '#e64c3c',           // светло-красный
            'CS 2': '#ff6b00',             // оранжевый
            'Valorant': '#fa4454',         // красно-розовый
            'Overwatch 2': '#ff9c00',      // оранжевый
            'League of Legends': '#c89b3c', // золотой
            'PUBG': '#4A90E2',             // светло-синий
            'Mobile Legends': '#32CD32',   // лайм
            'MLBB': '#32CD32',             // лайм
            'CS:GO': '#ff6b00',            // оранжевый
            'Counter-Strike 2': '#ff6b00'  // оранжевый
        };
        // Если дисциплина не найдена, генерируем цвет на основе хеша строки
        if (!colors[discipline]) {
            let hash = 0;
            for (let i = 0; i < discipline.length; i++) {
                hash = discipline.charCodeAt(i) + ((hash << 5) - hash);
            }
            const hue = hash % 360;
            return `hsl(${hue}, 65%, 60%)`; // Генерируем случайный цвет
        }
        return colors[discipline];
    }

    function fmtMonth(d){
        const y = d.getFullYear();
        const m = String(d.getMonth()+1).padStart(2,'0');
        return `${y}-${m}`;
    }

    async function load(){
        const monthKey = fmtMonth(current);
        events = await API.calendar.getAll(monthKey);
        disciplines = await API.disciplines.getAll();
        registrationLinks = await API.links.getAll(); // Загружаем ссылки для кнопки "Подать заявку"
        loadFilters();
        render();
    }

    function loadFilters() {
        if (!filtersContainer) return;
        
        // Показываем ВСЕ дисциплины из базы, не только те что в событиях
        filtersContainer.innerHTML = `
            <h3>Фильтр по дисциплинам</h3>
            <button class="filter-btn ${selectedDiscipline === 'all' ? 'active' : ''}" data-discipline="all">Все</button>
            ${disciplines.map(d => `
                <button class="filter-btn ${selectedDiscipline === d ? 'active' : ''}" 
                        data-discipline="${d}" 
                        style="background: ${getDisciplineColor(d)}; border-color: ${getDisciplineColor(d)};">
                    ${window.getDisciplineIcon ? window.getDisciplineIcon(d) : ''} ${d}
                </button>
            `).join('')}
        `;
        
        filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedDiscipline = btn.dataset.discipline;
                filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
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

        // Фильтруем события по дисциплине
        let filteredEvents = events;
        if (selectedDiscipline !== 'all') {
            filteredEvents = events.filter(e => e.discipline === selectedDiscipline);
        }

        for(let day=1; day<=daysInMonth; day++){
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';

            const date = new Date(year, month, day);
            const dateStr = fmtLocal(year, month, day);
            const dayEventsFiltered = filteredEvents.filter(e => (e.event_date || e.eventDate).slice(0,10) === dateStr);
            const dayEventsAll = events.filter(e => (e.event_date || e.eventDate).slice(0,10) === dateStr);

            const head = document.createElement('div');
            head.textContent = String(day);
            head.className = 'calendar-day-number';
            cell.appendChild(head);

            if (dayEventsFiltered.length > 0){
                const badge = document.createElement('div');
                badge.className = 'calendar-badge';
                badge.textContent = dayEventsAll.length;
                cell.appendChild(badge);
                cell.classList.add('calendar-has-events');
                
                // Определяем цвет по первой дисциплине
                const firstDiscipline = dayEventsFiltered[0].discipline;
                if (firstDiscipline) {
                    const color = getDisciplineColor(firstDiscipline);
                    cell.style.borderColor = color;
                    cell.style.borderWidth = '2px';
                }

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
            cell.onclick = () => openDay(dayEventsAll, dateStr);
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
                        
                        return `
                        <div class="calendar-event-card">
                            ${e.image_url || e.imageUrl ? `<img class="calendar-event-img" src="${e.image_url || e.imageUrl}" alt="${e.title}">` : ''}
                            <div class="calendar-event-content">
                                <h3>${e.title}</h3>
                                ${e.discipline ? `<div class="calendar-event-discipline" style="color: ${getDisciplineColor(e.discipline)}">${e.discipline}</div>` : ''}
                                ${e.prize ? `<div class="calendar-event-prize">Призовой фонд: ${e.prize}</div>` : ''}
                                ${e.description ? `<div class="calendar-event-desc">${e.description}</div>` : ''}
                                ${e.max_teams || e.maxTeams ? `<div class="calendar-event-teams">Команд: ${e.max_teams || e.maxTeams}</div>` : ''}
                                <a href="${regLink}" target="_blank" class="btn-submit calendar-apply-btn" ${regLink === '#' ? 'onclick="alert(\'Ссылка на регистрацию не настроена в админке\'); return false;"' : ''}>
                                    Подать заявку
                                </a>
                            </div>
                        </div>
                    `;
                    }).join('')}
                </div>`;
        }
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    }
    
    function closeModal(){
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
    
    modalClose.addEventListener('click', closeModal);
    window.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });
    modal.addEventListener('click', (e)=>{ if (e.target === modal) closeModal(); });
    prevBtn.addEventListener('click', ()=>{ current.setMonth(current.getMonth()-1); load(); });
    nextBtn.addEventListener('click', ()=>{ current.setMonth(current.getMonth()+1); load(); });

    load();
})();
