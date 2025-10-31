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

    // Цвета для дисциплин
    function getDisciplineColor(discipline) {
        const colors = {
            'Dota 2': '#e64c3c',
            'CS 2': '#ff6b00',
            'Valorant': '#fa4454',
            'Overwatch 2': '#ff9c00',
            'League of Legends': '#c89b3c'
        };
        return colors[discipline] || '#8b5abf';
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
        loadFilters();
        render();
    }

    function loadFilters() {
        if (!filtersContainer) return;
        const disciplinesInEvents = [...new Set(events.map(e => e.discipline).filter(d => d))];
        
        // Сортируем дисциплины по порядку из списка всех дисциплин
        const sortedDisciplines = disciplines.filter(d => disciplinesInEvents.includes(d));
        
        filtersContainer.innerHTML = `
            <h3>Фильтр по дисциплинам</h3>
            <button class="filter-btn ${selectedDiscipline === 'all' ? 'active' : ''}" data-discipline="all">Все</button>
            ${sortedDisciplines.map(d => `
                <button class="filter-btn ${selectedDiscipline === d ? 'active' : ''}" 
                        data-discipline="${d}" 
                        style="background: ${getDisciplineColor(d)}; border-color: ${getDisciplineColor(d)};">
                    ${d}
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
            eventTitle.textContent = `События — ${dateStr}`;
            eventBody.innerHTML = `
                <div class="calendar-events-wrap">
                    ${dayEvents.map(e => `
                        <div class="calendar-event-card">
                            ${e.image_url || e.imageUrl ? `<img class="calendar-event-img" src="${e.image_url || e.imageUrl}" alt="${e.title}">` : ''}
                            <div class="calendar-event-content">
                                <h3>${e.title}</h3>
                                ${e.discipline ? `<div class="calendar-event-discipline" style="color: ${getDisciplineColor(e.discipline)}">${e.discipline}</div>` : ''}
                                ${e.prize ? `<div class="calendar-event-prize">Призовой фонд: ${e.prize}</div>` : ''}
                                ${e.description ? `<div class="calendar-event-desc">${e.description}</div>` : ''}
                                ${e.max_teams || e.maxTeams ? `<div class="calendar-event-teams">Команд: ${e.max_teams || e.maxTeams}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
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
