// Календарь турниров
let calendarOpen = false;

function openCalendar() {
    const modal = document.getElementById('calendar-modal');
    calendarOpen = true;
    loadCalendarData();
    modal.classList.add('active');
}

function closeCalendar() {
    const modal = document.getElementById('calendar-modal');
    calendarOpen = false;
    modal.classList.remove('active');
}

async function loadCalendarData() {
    const container = document.getElementById('calendar-container');
    const tournaments = await API.tournaments.getAll('active');
    
    if (tournaments.length === 0) {
        container.innerHTML = '<p>Нет активных турниров</p>';
        return;
    }
    
    // Группируем турниры по месяцам
    const tournamentsByMonth = {};
    tournaments.forEach(t => {
        try {
            const parts = t.date.split(/[.-]/);
            if (parts.length !== 3) return;
            
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            
            const date = new Date(year, month - 1, day);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!tournamentsByMonth[monthKey]) {
                tournamentsByMonth[monthKey] = [];
            }
            tournamentsByMonth[monthKey].push({
                ...t,
                parsedDate: date
            });
        } catch (error) {
            console.error('Error parsing date:', error);
        }
    });
    
    // Создаём карточки для каждого месяца
    container.innerHTML = Object.keys(tournamentsByMonth)
        .sort()
        .map(monthKey => {
            const date = new Date(monthKey + '-01');
            const monthName = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
            const monthTours = tournamentsByMonth[monthKey].sort((a, b) => a.parsedDate - b.parsedDate);
            
            return `
                <div class="calendar-month">
                    <h3 class="calendar-month-title">${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</h3>
                    <div class="calendar-month-tournaments">
                        ${monthTours.map(t => `
                            <div class="calendar-tournament-card">
                                <div class="calendar-date">
                                    <span class="calendar-day">${t.parsedDate.getDate()}</span>
                                    <span class="calendar-month-day">${t.parsedDate.toLocaleDateString('ru-RU', { weekday: 'short' })}</span>
                                </div>
                                <div class="calendar-tournament-info">
                                    <h4>${t.title}</h4>
                                    <div class="calendar-tournament-details">
                                        <span>${formatDisciplineWithIcon(t.discipline)}</span>
                                        <span>${t.prize}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
}

window.openCalendar = openCalendar;
window.closeCalendar = closeCalendar;

