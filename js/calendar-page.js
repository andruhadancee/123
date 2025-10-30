// Простой календарь с подсветкой дней, где есть события
(function(){
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('month-title');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    const modal = document.getElementById('event-modal');
    const modalClose = document.getElementById('event-modal-close');
    const eventTitle = document.getElementById('event-title');
    const eventBody = document.getElementById('event-body');

    let current = new Date();
    current.setDate(1);
    let events = [];

    function fmtMonth(d){
        const y = d.getFullYear();
        const m = String(d.getMonth()+1).padStart(2,'0');
        return `${y}-${m}`;
    }

    async function load(){
        const monthKey = fmtMonth(current);
        events = await API.calendar.getAll(monthKey);
        render();
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
        const startOffset = (firstDay.getDay()+6)%7; // Пн=0
        const daysInMonth = new Date(year, month+1, 0).getDate();

        for(let i=0;i<startOffset;i++){
            const empty = document.createElement('div');
            empty.style.opacity = '0.3';
            grid.appendChild(empty);
        }

        function fmtLocal(y,m,d){
            return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        }

        for(let day=1; day<=daysInMonth; day++){
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';

            const date = new Date(year, month, day);
            const dateStr = fmtLocal(year, month, day); // локальная дата, без сдвига часового пояса
            const dayEvents = events.filter(e => (e.event_date || e.eventDate).slice(0,10) === dateStr);

            const head = document.createElement('div');
            head.textContent = String(day);
            head.className = 'calendar-day-number';
            cell.appendChild(head);

            if (dayEvents.length > 0){
                const badge = document.createElement('div');
                badge.className = 'calendar-badge';
                badge.textContent = dayEvents.length;
                cell.appendChild(badge);
                cell.classList.add('calendar-has-events');

                // превью
                const pop = document.createElement('div');
                pop.className = 'calendar-popover';
                pop.innerHTML = `
                    <div class="calendar-popover-title">События:</div>
                    ${dayEvents.slice(0,3).map(e => `<div class="calendar-popover-item">• ${e.title}</div>`).join('')}
                `;
                cell.appendChild(pop);
            }

            cell.onclick = () => openDay(dayEvents, dateStr);
            grid.appendChild(cell);
        }
    }

    function openDay(dayEvents, dateStr){
        if (!dayEvents || dayEvents.length === 0){
            eventTitle.textContent = `Событий нет — ${dateStr}`;
            eventBody.innerHTML = '<p style="color:var(--color-text-secondary)">На этот день пока ничего не запланировано.</p>';
        } else {
            eventTitle.textContent = `События — ${dateStr}`;
            eventBody.innerHTML = dayEvents.map(e => `
                <div class="tournament-card" style="margin-bottom:12px;">
                    <div class="tournament-card-header"><h2>${e.title}</h2></div>
                    <div class="info-value" style="margin-bottom:6px;">${e.description || ''}</div>
                    ${e.image_url ? `<img src="${e.image_url}" style="max-width:100%; border-radius:8px;">` : ''}
                </div>
            `).join('');
        }
        modal.classList.add('active');
    }

    modalClose.addEventListener('click', ()=> modal.classList.remove('active'));
    window.addEventListener('keydown', e=>{ if(e.key==='Escape') modal.classList.remove('active'); });
    prevBtn.addEventListener('click', ()=>{ current.setMonth(current.getMonth()-1); load(); });
    nextBtn.addEventListener('click', ()=>{ current.setMonth(current.getMonth()+1); load(); });

    load();
})();


