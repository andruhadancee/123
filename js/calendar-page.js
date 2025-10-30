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

        for(let day=1; day<=daysInMonth; day++){
            const cell = document.createElement('div');
            cell.style.padding = '12px';
            cell.style.border = '1px solid rgba(139,90,191,0.2)';
            cell.style.borderRadius = '10px';
            cell.style.background = 'rgba(45,27,61,0.25)';
            cell.style.cursor = 'pointer';
            cell.style.transition = 'transform .2s';
            cell.onmouseenter = ()=> cell.style.transform = 'translateY(-2px)';
            cell.onmouseleave = ()=> cell.style.transform = 'none';

            const date = new Date(year, month, day);
            const dateStr = date.toISOString().slice(0,10);
            const dayEvents = events.filter(e => (e.event_date || e.eventDate).slice(0,10) === dateStr);

            const head = document.createElement('div');
            head.textContent = String(day);
            head.style.fontWeight = '700';
            head.style.marginBottom = '6px';
            cell.appendChild(head);

            if (dayEvents.length > 0){
                const dot = document.createElement('div');
                dot.textContent = `${dayEvents.length} событ.`;
                dot.style.fontSize = '12px';
                dot.style.color = 'var(--color-pink)';
                dot.style.fontWeight = '700';
                cell.appendChild(dot);
                cell.classList.add('calendar-day-active');
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


