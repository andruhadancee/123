// Админ-панель с поддержкой API

let currentEditingId = null;
let currentEditingTeam = null;

// Для фильтрации
let allActiveTournaments = [];
let allPastTournaments = [];
let allTeamsData = [];
let selectedActiveDiscipline = 'all';
let selectedPastDiscipline = 'all';
let selectedTeamsDiscipline = 'all';

document.addEventListener('DOMContentLoaded', function() {
    initAdminPanel();
    loadAdminData();
    setupEventListeners();
    
    // Восстанавливаем последнюю активную вкладку
    const savedTab = localStorage.getItem('adminActiveTab');
    if (savedTab) {
        switchTab(savedTab);
        // Если сразу открыта вкладка календаря — принудительно подгружаем
        if (savedTab === 'calendar') {
            setTimeout(loadCalendarAdmin, 0);
        }
    }
    
    hideLoader();
});

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.style.display = 'none', 300);
    }
}

function initAdminPanel() {
    // Простая проверка авторизации (в реальном проекте использовать Firebase Auth)
    const isAdmin = localStorage.getItem('wbcyber_admin') === 'true';
    if (!isAdmin) {
        // Простая авторизация для демонстрации
        const password = prompt('Введите пароль администратора:');
        if (password === 'admin123') {
            localStorage.setItem('wbcyber_admin', 'true');
        } else {
            alert('Неверный пароль!');
            window.location.href = 'index.html';
        }
    }
}

function setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
    
    // Add tournament buttons
    document.getElementById('add-tournament-btn').addEventListener('click', openAddModal);
    document.getElementById('add-past-tournament-btn').addEventListener('click', openAddPastModal);
    
    // Modal
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    document.getElementById('tournament-modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Form submit
    document.getElementById('tournament-form').addEventListener('submit', handleFormSubmit);
    
    // Save links
    document.getElementById('save-links-btn').addEventListener('click', saveRegistrationLinks);
    
    // Save social links
    document.getElementById('save-social-btn').addEventListener('click', saveSocialLinks);
    
    // Add discipline (from disciplines tab)
    const addDisciplineBtn = document.getElementById('add-discipline-btn');
    const newDisciplineInput = document.getElementById('new-discipline-input');
    if (addDisciplineBtn) {
        addDisciplineBtn.addEventListener('click', addDiscipline);
    }
    if (newDisciplineInput) {
        newDisciplineInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addDiscipline();
            }
        });
    }
    
    // Team management
    document.getElementById('add-team-btn').addEventListener('click', openAddTeamModal);
    document.getElementById('close-team-modal').addEventListener('click', closeTeamModal);
    document.getElementById('cancel-team-btn').addEventListener('click', closeTeamModal);
    document.getElementById('team-modal').addEventListener('click', function(e) {
        if (e.target === this) closeTeamModal();
    });
    document.getElementById('team-form').addEventListener('submit', handleTeamFormSubmit);
    
    // Logout - убрано, так как кнопка удалена
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Сохраняем текущую вкладку в localStorage
    localStorage.setItem('adminActiveTab', tabName);
}

async function loadAdminData() {
    console.log('📥 Загрузка данных в админку...');
    await loadActiveTournaments();
    await loadPastTournaments();
    await loadTeamsAdmin();
    await loadDisciplinesList();
    await loadRegistrationLinksForm();
    await loadSocialLinksForm();
    await loadRegulationsList();
    // Загружаем календарь сразу (иначе после перезагрузки на вкладке календаря список пуст)
    await loadCalendarAdmin();
    console.log('✅ Админка загружена');
}

// ===== КАЛЕНДАРЬ (АДМИН) =====
// Календарь для админки
let adminCalendarCurrent = new Date();
adminCalendarCurrent.setDate(1);
let adminCalendarEvents = [];
let adminCalendarSelectedDiscipline = 'all';
let adminCalendarDisciplines = [];

function getAdminDisciplineColor(discipline) {
    const colors = {
        'Dota 2': '#b83d2d',
        'CS 2': '#cc8844',
        'Valorant': '#c85565',
        'Overwatch 2': '#cc8844',
        'League of Legends': '#a0853a',
        'PUBG': '#5a7aa5',
        'Mobile Legends': '#5a9a5a',
        'MLBB': '#5a9a5a',
        'CS:GO': '#cc8844',
        'Counter-Strike 2': '#cc8844'
    };
    if (!colors[discipline]) {
        let hash = 0;
        for (let i = 0; i < discipline.length; i++) {
            hash = discipline.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 45%, 50%)`;
    }
    return colors[discipline];
}

function fmtMonth(d){
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    return `${y}-${m}`;
}

async function loadCalendarAdmin() {
    const grid = document.getElementById('calendar-grid-admin');
    const title = document.getElementById('month-title-admin');
    if (!grid || !title) return;
    
    const monthKey = fmtMonth(adminCalendarCurrent);
    adminCalendarEvents = await API.calendar.getAll(monthKey);
    adminCalendarDisciplines = await API.disciplines.getAll();
    
    title.textContent = adminCalendarCurrent.toLocaleString('ru-RU', { month:'long', year:'numeric' });
    loadAdminCalendarFilters();
    renderAdminCalendar();
}

function loadAdminCalendarFilters() {
    const filtersContainer = document.getElementById('calendar-filters-admin');
    if (!filtersContainer) return;
    
    filtersContainer.innerHTML = `
        <h3>Фильтр по дисциплинам</h3>
        <button class="filter-btn ${adminCalendarSelectedDiscipline === 'all' ? 'active' : ''}" data-discipline="all">Все</button>
        ${adminCalendarDisciplines.map(d => `
            <button class="filter-btn ${adminCalendarSelectedDiscipline === d ? 'active' : ''}" 
                    data-discipline="${d}" 
                    style="background: ${getAdminDisciplineColor(d)}; border-color: ${getAdminDisciplineColor(d)}; opacity: 0.75; filter: brightness(0.85);">
                ${window.getDisciplineIcon ? window.getDisciplineIcon(d) : ''} ${d}
            </button>
        `).join('')}
    `;
    
    filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            adminCalendarSelectedDiscipline = btn.dataset.discipline;
            filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderAdminCalendar();
        });
    });
}

function renderAdminCalendar() {
    const grid = document.getElementById('calendar-grid-admin');
    if (!grid) return;
    
    const month = adminCalendarCurrent.getMonth();
    const year = adminCalendarCurrent.getFullYear();
    
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

    // Фильтруем события по дисциплине и убираем дубликаты
    let filteredEvents = adminCalendarEvents;
    if (adminCalendarSelectedDiscipline !== 'all') {
        filteredEvents = adminCalendarEvents.filter(e => e.discipline === adminCalendarSelectedDiscipline);
    }
    
    const uniqueEvents = [];
    const seenTournamentIds = new Set();
    filteredEvents.forEach(e => {
        if (e.tournament_id) {
            if (!seenTournamentIds.has(e.tournament_id)) {
                seenTournamentIds.add(e.tournament_id);
                uniqueEvents.push(e);
            }
        } else {
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
        const dateStr = fmtLocal(year, month, day);
        const dayEvents = filteredEvents.filter(e => (e.event_date || e.eventDate).slice(0,10) === dateStr);
        
        const dateNum = document.createElement('div');
        dateNum.className = 'calendar-date-num';
        dateNum.textContent = day;
        cell.appendChild(dateNum);
        
        // Показываем фотки вместо текста
        if (dayEvents.length > 0) {
            const eventImg = dayEvents[0];
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'calendar-event-image-wrapper';
            if (eventImg.image_url || eventImg.imageUrl) {
                const img = document.createElement('img');
                img.src = eventImg.image_url || eventImg.imageUrl;
                img.alt = eventImg.title || '';
                img.className = 'calendar-day-event-img';
                imgWrapper.appendChild(img);
            } else {
                const placeholder = document.createElement('div');
                placeholder.className = 'calendar-day-event-placeholder';
                placeholder.textContent = dayEvents.length > 1 ? `+${dayEvents.length}` : 'EV';
                imgWrapper.appendChild(placeholder);
            }
            
            // Цветная обводка по дисциплине
            if (eventImg.discipline) {
                cell.style.borderColor = getAdminDisciplineColor(eventImg.discipline);
                cell.style.borderWidth = '2px';
            }
            
            if (dayEvents.length > 1) {
                const badge = document.createElement('div');
                badge.className = 'calendar-event-badge';
                badge.textContent = dayEvents.length;
                cell.appendChild(badge);
            }
            
            cell.appendChild(imgWrapper);
        }
        
        // Клик на день
        cell.addEventListener('click', () => {
            handleAdminDayClick(dateStr, dayEvents);
        });
        
        grid.appendChild(cell);
    }
}

async function handleAdminDayClick(dateStr, dayEvents) {
    if (dayEvents.length === 0) {
        // Пустой день - добавляем событие
        await openCalendarModalWithDate(dateStr, null);
    } else {
        // Показываем модальное окно с событиями дня (как на обычной странице)
        await openAdminDayEventsModal(dateStr, dayEvents);
    }
}

async function openAdminDayEventsModal(dateStr, dayEvents) {
    const modal = document.getElementById('calendar-day-events-modal');
    const titleEl = document.getElementById('calendar-day-events-title');
    const bodyEl = document.getElementById('calendar-day-events-body');
    
    if (!modal || !titleEl || !bodyEl) return;
    
    // Убираем дубликаты
    const uniqueEvents = [];
    const seen = new Set();
    dayEvents.forEach(e => {
        const key = e.tournament_id ? `tournament_${e.tournament_id}` : `${e.title}_${dateStr}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueEvents.push(e);
        }
    });
    
    const dateInner = new Date(dateStr + 'T12:00:00');
    const dateFormatted = dateInner.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    titleEl.textContent = `События на ${dateFormatted}`;
    
    bodyEl.innerHTML = `
        <div class="calendar-events-wrap">
            ${uniqueEvents.map(e => {
                return `
                    <div class="calendar-event-card">
                        ${e.image_url || e.imageUrl ? `<img class="calendar-event-img" src="${e.image_url || e.imageUrl}" alt="${e.title}">` : ''}
                        <div class="calendar-event-content">
                            <h3>${e.title}</h3>
                            ${e.discipline ? `<div class="calendar-event-discipline" style="color: ${getAdminDisciplineColor(e.discipline)}">${e.discipline}</div>` : ''}
                            ${e.prize ? `<div class="calendar-event-prize">Призовой фонд: ${e.prize}</div>` : ''}
                            ${e.description ? `<div class="calendar-event-desc">${e.description}</div>` : ''}
                            ${e.max_teams || e.maxTeams ? `<div class="calendar-event-teams">Команд: ${e.max_teams || e.maxTeams}</div>` : ''}
                            <div style="display: flex; gap: 12px; margin-top: 16px;">
                                <button onclick="editAdminCalendarEvent(${e.id})" class="btn-primary" style="flex: 1;">Редактировать турнир</button>
                                <button onclick="deleteAdminCalendarEvent(${e.id})" class="btn-danger" style="flex: 1; background: rgba(220, 53, 69, 0.8); border-color: rgba(220, 53, 69, 0.8);">Удалить турнир</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    modal.classList.add('active');
    document.body.classList.add('modal-open');
}

function closeAdminDayEventsModal() {
    const modal = document.getElementById('calendar-day-events-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}

async function editAdminCalendarEvent(id) {
    closeAdminDayEventsModal();
    await editCalendarEvent(id);
}

async function deleteAdminCalendarEvent(id) {
    if (!confirm('Удалить это событие?')) return;
    await API.calendar.delete(id);
    closeAdminDayEventsModal();
    await loadCalendarAdmin();
}

window.editAdminCalendarEvent = editAdminCalendarEvent;
window.deleteAdminCalendarEvent = deleteAdminCalendarEvent;

async function openCalendarModalWithDate(dateStr, event) {
    if (event && event.id) {
        await openCalendarModal(event);
    } else {
        const newEvent = { eventDate: dateStr };
        await openCalendarModal(newEvent);
    }
}

async function clearCalendarMonth() {
    const year = adminCalendarCurrent.getFullYear();
    const month = adminCalendarCurrent.getMonth() + 1;
    const monthName = adminCalendarCurrent.toLocaleString('ru-RU', { month:'long', year:'numeric' });
    
    if (!confirm(`Удалить ВСЕ события календаря за ${monthName}? Это действие нельзя отменить!`)) {
        return;
    }
    
    const monthKey = fmtMonth(adminCalendarCurrent);
    const events = await API.calendar.getAll(monthKey);
    
    if (events.length === 0) {
        alert('В этом месяце нет событий.');
        return;
    }
    
    let deleted = 0;
    for (const event of events) {
        try {
            await API.calendar.delete(event.id);
            deleted++;
        } catch (err) {
            console.error('Ошибка удаления события:', err);
        }
    }
    
    alert(`Удалено событий: ${deleted}`);
    await loadCalendarAdmin();
}

async function deleteCalendarEvent(id) {
    if (!confirm('Удалить событие?')) return;
    await API.calendar.delete(id);
    await loadCalendarAdmin();
}

let editingCalendarId = null;

async function openCalendarModal(event) {
    const modal = document.getElementById('calendar-event-modal');
    const titleEl = document.getElementById('calendar-event-title');
    const idEl = document.getElementById('calendar-event-id');
    const t = document.getElementById('calendar-title');
    const d = document.getElementById('calendar-date');
    const desc = document.getElementById('calendar-description');
    const img = document.getElementById('calendar-image');
    const disc = document.getElementById('calendar-discipline');
    const prize = document.getElementById('calendar-prize');
    const maxTeams = document.getElementById('calendar-max-teams');
    const regLink = document.getElementById('calendar-registration-link');
    const customLink = document.getElementById('calendar-custom-link');
    
    // Загружаем дисциплины в селект
    if (disc && disc.options.length <= 1) {
        const disciplines = await API.disciplines.getAll();
        disc.innerHTML = '<option value="">Выберите дисциплину</option>' +
            disciplines.map(d => `<option value="${d}">${d}</option>`).join('');
    }

    if (event && event.id) {
        editingCalendarId = event.id;
        titleEl.textContent = 'Изменить событие';
        idEl.value = event.id;
        t.value = event.title || '';
        d.value = (event.event_date || event.eventDate || '').slice(0,10);
        desc.value = event.description || '';
        img.value = event.image_url || event.imageUrl || '';
        if (disc) disc.value = event.discipline || '';
        if (prize) prize.value = event.prize || '';
        if (maxTeams) maxTeams.value = event.max_teams || event.maxTeams || '';
        if (regLink) regLink.value = event.registration_link || event.registrationLink || '';
        if (customLink) customLink.value = event.custom_link || event.customLink || '';
    } else {
        editingCalendarId = null;
        titleEl.textContent = 'Добавить событие';
        idEl.value = '';
        t.value = '';
        d.value = (event && event.eventDate) ? event.eventDate.slice(0,10) : '';
        desc.value = '';
        img.value = '';
        if (disc) disc.value = '';
        if (prize) prize.value = '';
        if (maxTeams) maxTeams.value = '';
        if (regLink) regLink.value = '';
        if (customLink) customLink.value = '';
    }
    modal.classList.add('active');
}

function closeCalendarModal(){
    document.getElementById('calendar-event-modal').classList.remove('active');
}

async function editCalendarEvent(id) {
    // Получаем событие из текущего календаря
    const monthKey = fmtMonth(adminCalendarCurrent);
    const events = await API.calendar.getAll(monthKey);
    const e = events.find(x => x.id === id);
    if (!e) {
        // Если не найдено в текущем месяце, ищем во всех событиях (может быть в другом месяце)
        const allMonths = [];
        for (let i = -2; i <= 2; i++) {
            const checkDate = new Date(adminCalendarCurrent);
            checkDate.setMonth(checkDate.getMonth() + i);
            allMonths.push(fmtMonth(checkDate));
        }
        for (const month of allMonths) {
            const monthEvents = await API.calendar.getAll(month);
            const found = monthEvents.find(x => x.id === id);
            if (found) {
                await openCalendarModal(found);
                return;
            }
        }
        alert('Событие не найдено');
        return;
    }
    await openCalendarModal(e);
}

async function createCalendarEvent() {
    await openCalendarModal(null);
}

window.editCalendarEvent = editCalendarEvent;
window.deleteCalendarEvent = deleteCalendarEvent;
window.createCalendarEvent = createCalendarEvent;

// Подключаем кнопку добавления в админке
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'add-calendar-event-btn') {
        createCalendarEvent();
    }
});

// Подгружаем календарь при переключении вкладки
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (btn && btn.dataset.tab === 'calendar') {
        setTimeout(loadCalendarAdmin, 0);
    }
});

// Обработка формы модалки календаря
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('calendar-event-form');
    const cancelBtn = document.getElementById('cancel-calendar-event');
    const closeBtn = document.getElementById('close-calendar-event-modal');
    async function handleCalendarFormSubmit(e){
        e.preventDefault();
        const title = document.getElementById('calendar-title').value.trim();
        const eventDate = document.getElementById('calendar-date').value;
        const description = document.getElementById('calendar-description').value.trim();
        const imageUrl = document.getElementById('calendar-image').value.trim();
        const discipline = document.getElementById('calendar-discipline').value.trim();
        const prize = document.getElementById('calendar-prize').value.trim();
        const maxTeams = document.getElementById('calendar-max-teams').value.trim();
        const registrationLink = document.getElementById('calendar-registration-link').value.trim();
        const customLink = document.getElementById('calendar-custom-link').value.trim();
        
        if (!title || !eventDate) return;
        
        const data = {
            title,
            eventDate,
            description: description || null,
            imageUrl: imageUrl || null,
            discipline: discipline || null,
            prize: prize || null,
            maxTeams: maxTeams ? parseInt(maxTeams) : null,
            registrationLink: registrationLink || null,
            customLink: customLink || null
        };
        
        if (editingCalendarId) {
            data.id = editingCalendarId;
            await API.calendar.update(data);
        } else {
            await API.calendar.create(data);
        }
        closeCalendarModal();
        await loadCalendarAdmin();
    }
    if (form) form.addEventListener('submit', handleCalendarFormSubmit);
    // Подстраховка, если листенер не повесился: делегирование по id формы
    document.addEventListener('submit', (e) => {
        const formEl = e.target;
        if (formEl && formEl.id === 'calendar-event-form') {
            handleCalendarFormSubmit(e);
        }
    });
    if (cancelBtn) cancelBtn.addEventListener('click', closeCalendarModal);
    if (closeBtn) closeBtn.addEventListener('click', closeCalendarModal);
    
    // Обработчики закрытия модального окна событий дня
    const closeDayEventsBtn = document.getElementById('close-calendar-day-events-modal');
    const dayEventsModal = document.getElementById('calendar-day-events-modal');
    if (closeDayEventsBtn) {
        closeDayEventsBtn.addEventListener('click', closeAdminDayEventsModal);
    }
    if (dayEventsModal) {
        dayEventsModal.addEventListener('click', (e) => {
            if (e.target === dayEventsModal) closeAdminDayEventsModal();
        });
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && dayEventsModal.classList.contains('active')) {
                closeAdminDayEventsModal();
            }
        });
    }
    
    // Обработчики навигации календаря в админке
    const prevMonthBtn = document.getElementById('prev-month-admin');
    const nextMonthBtn = document.getElementById('next-month-admin');
    const clearMonthBtn = document.getElementById('clear-calendar-month-btn');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            adminCalendarCurrent.setMonth(adminCalendarCurrent.getMonth() - 1);
            loadCalendarAdmin();
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            adminCalendarCurrent.setMonth(adminCalendarCurrent.getMonth() + 1);
            loadCalendarAdmin();
        });
    }
    
    if (clearMonthBtn) {
        clearMonthBtn.addEventListener('click', clearCalendarMonth);
    }
});

async function loadActiveTournaments() {
    allActiveTournaments = await API.tournaments.getAll('active');
    await loadActiveDisciplineFilters();
    displayFilteredActiveTournaments();
}

function displayFilteredActiveTournaments() {
    const grid = document.getElementById('active-tournaments-grid');
    
    let filtered = allActiveTournaments;
    if (selectedActiveDiscipline !== 'all') {
        filtered = allActiveTournaments.filter(t => t.discipline === selectedActiveDiscipline);
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>' + 
            (selectedActiveDiscipline === 'all' ? 'Нет активных турниров' : 'Турниров по выбранной дисциплине нет') + 
            '</p></div>';
        return;
    }
    
    grid.innerHTML = filtered.map(t => createAdminTournamentCard(t)).join('');
    
    // Add event listeners for edit and delete buttons
    filtered.forEach(t => {
        const editBtn = document.getElementById(`edit-${t.id}`);
        const deleteBtn = document.getElementById(`delete-${t.id}`);
        if (editBtn) editBtn.addEventListener('click', () => openEditModal(t));
        if (deleteBtn) deleteBtn.addEventListener('click', () => deleteTournamentConfirm(t.id));
    });
}

async function loadActiveDisciplineFilters() {
    const filtersContainer = document.getElementById('active-discipline-filters');
    if (!filtersContainer) return;
    
    const disciplines = await API.disciplines.getAll();
    const disciplinesSet = new Set(allActiveTournaments.map(t => t.discipline));
    const availableDisciplines = [...new Set(disciplines.filter(d => disciplinesSet.has(d)))];
    
    filtersContainer.innerHTML = `
        <button class="filter-btn ${selectedActiveDiscipline === 'all' ? 'active' : ''}" data-discipline="all" onclick="filterActiveTournamentsByDiscipline('all')">
            Все
        </button>
        ${availableDisciplines.map(d => `
            <button class="filter-btn ${selectedActiveDiscipline === d ? 'active' : ''}" data-discipline="${d}" onclick="filterActiveTournamentsByDiscipline('${d}')">
                ${getDisciplineIcon(d)} ${d}
            </button>
        `).join('')}
    `;
}

function filterActiveTournamentsByDiscipline(discipline) {
    selectedActiveDiscipline = discipline;
    
    document.querySelectorAll('#active-discipline-filters .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.discipline === discipline) {
            btn.classList.add('active');
        }
    });
    
    displayFilteredActiveTournaments();
}

window.filterActiveTournamentsByDiscipline = filterActiveTournamentsByDiscipline;

async function loadPastTournaments() {
    allPastTournaments = await API.tournaments.getAll('finished');
    await loadPastDisciplineFilters();
    displayFilteredPastTournaments();
}

function displayFilteredPastTournaments() {
    const grid = document.getElementById('past-tournaments-grid');
    
    let filtered = allPastTournaments;
    if (selectedPastDiscipline !== 'all') {
        filtered = allPastTournaments.filter(t => t.discipline === selectedPastDiscipline);
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>' + 
            (selectedPastDiscipline === 'all' ? 'Нет прошедших турниров' : 'Турниров по выбранной дисциплине нет') + 
            '</p></div>';
        return;
    }
    
    grid.innerHTML = filtered.map(t => createAdminTournamentCard(t, true)).join('');
    
    // Add event listeners for edit and delete buttons
    filtered.forEach(t => {
        const editBtn = document.getElementById(`edit-past-${t.id}`);
        const deleteBtn = document.getElementById(`delete-past-${t.id}`);
        if (editBtn) editBtn.addEventListener('click', () => openEditPastModal(t));
        if (deleteBtn) deleteBtn.addEventListener('click', () => deletePastTournamentConfirm(t.id));
    });
}

async function loadPastDisciplineFilters() {
    const filtersContainer = document.getElementById('past-discipline-filters');
    if (!filtersContainer) return;
    
    const disciplines = await API.disciplines.getAll();
    const disciplinesSet = new Set(allPastTournaments.map(t => t.discipline));
    const availableDisciplines = [...new Set(disciplines.filter(d => disciplinesSet.has(d)))];
    
    filtersContainer.innerHTML = `
        <button class="filter-btn ${selectedPastDiscipline === 'all' ? 'active' : ''}" data-discipline="all" onclick="filterPastTournamentsByDiscipline('all')">
            Все
        </button>
        ${availableDisciplines.map(d => `
            <button class="filter-btn ${selectedPastDiscipline === d ? 'active' : ''}" data-discipline="${d}" onclick="filterPastTournamentsByDiscipline('${d}')">
                ${getDisciplineIcon(d)} ${d}
            </button>
        `).join('')}
    `;
}

function filterPastTournamentsByDiscipline(discipline) {
    selectedPastDiscipline = discipline;
    
    document.querySelectorAll('#past-discipline-filters .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.discipline === discipline) {
            btn.classList.add('active');
        }
    });
    
    displayFilteredPastTournaments();
}

window.filterPastTournamentsByDiscipline = filterPastTournamentsByDiscipline;

function createAdminTournamentCard(tournament, isPast = false) {
    return `
        <div class="tournament-admin-card">
            <div class="tournament-admin-info">
                <div class="info-item">
                    <span class="info-label">Название</span>
                    <span class="info-value">${tournament.title}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Дисциплина</span>
                    <span class="info-value">${formatDisciplineWithIcon(tournament.discipline)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Дата</span>
                    <span class="info-value">${tournament.date}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Призовой фонд</span>
                    <span class="info-value">${tournament.prize}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Команд</span>
                    <span class="info-value">${tournament.teams || 0} / ${tournament.max_teams}</span>
                </div>
                ${isPast && tournament.winner ? `
                <div class="info-item">
                    <span class="info-label">Победитель</span>
                    <span class="info-value">${tournament.winner}</span>
                </div>
                ` : ''}
            </div>
            <div class="tournament-admin-actions">
                ${!isPast ? `
                <button class="btn-edit" id="edit-${tournament.id}">Изменить</button>
                <button class="btn-danger" id="delete-${tournament.id}">Удалить</button>
                ` : `
                <button class="btn-edit" id="edit-past-${tournament.id}">Изменить</button>
                <button class="btn-danger" id="delete-past-${tournament.id}">Удалить</button>
                `}
            </div>
        </div>
    `;
}

async function loadRegistrationLinksForm() {
    const grid = document.getElementById('links-grid');
    const disciplines = await API.disciplines.getAll();
    const links = await API.links.getAll();
    
    grid.innerHTML = disciplines.map(discipline => `
        <div class="link-item" data-discipline="${discipline}">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                ${getDisciplineIcon(discipline)}
                <label style="margin-bottom: 0; flex: 1;">${discipline}</label>
            </div>
            <input type="text" 
                   class="link-input" 
                   data-discipline="${discipline}" 
                   value="${links[discipline] || ''}" 
                   placeholder="Любая ссылка: https://..., mailto:..., tel:...">
        </div>
    `).join('');
}

async function saveRegistrationLinks() {
    console.log('💾 Сохранение ссылок на формы...');
    const links = {};
    document.querySelectorAll('.link-input').forEach(input => {
        const discipline = input.dataset.discipline;
        const url = input.value.trim();
        if (url) {
            links[discipline] = url;
            console.log(`  📝 ${discipline}: ${url}`);
        }
    });
    
    try {
        await API.links.save(links);
        console.log('✅ Ссылки сохранены!');
        alert('Ссылки сохранены!');
    } catch (error) {
        alert('Ошибка сохранения ссылок: ' + error.message);
    }
}

function openAddModal() {
    currentEditingId = null;
    document.getElementById('modal-title').textContent = 'Добавить турнир';
    document.getElementById('tournament-form').reset();
    document.getElementById('tournament-id').value = '';
    document.getElementById('tournament-status').value = 'active';
    document.getElementById('winner-field').style.display = 'none';
    document.getElementById('watch-url-field').style.display = 'none';
    document.getElementById('tournament-modal').classList.add('active');
    updateDisciplineDropdown();
}

function openAddPastModal() {
    currentEditingId = null;
    document.getElementById('modal-title').textContent = 'Добавить прошедший турнир';
    document.getElementById('tournament-form').reset();
    document.getElementById('tournament-id').value = '';
    document.getElementById('tournament-status').value = 'finished';
    document.getElementById('winner-field').style.display = 'block';
    document.getElementById('watch-url-field').style.display = 'block';
    document.getElementById('tournament-modal').classList.add('active');
    updateDisciplineDropdown();
}

function openEditPastModal(tournament) {
    currentEditingId = tournament.id;
    document.getElementById('modal-title').textContent = 'Редактировать прошедший турнир';
    
    document.getElementById('tournament-id').value = tournament.id;
    document.getElementById('tournament-name').value = tournament.title;
    document.getElementById('tournament-discipline').value = tournament.discipline;
    
    // Convert date format
    const dateMatch = tournament.date.match(/(\d+)\s+(\w+)\s+(\d+)/);
    if (dateMatch) {
        const months = {
            'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
            'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
            'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
        };
        const day = dateMatch[1].padStart(2, '0');
        const month = months[dateMatch[2]];
        const year = dateMatch[3];
        document.getElementById('tournament-date').value = `${year}-${month}-${day}`;
    }
    
    document.getElementById('tournament-prize').value = tournament.prize;
    document.getElementById('tournament-max-teams').value = tournament.max_teams;
    document.getElementById('tournament-custom-link').value = tournament.custom_link || '';
    document.getElementById('tournament-winner').value = tournament.winner || '';
    
    // Проверяем поле watch_url - может быть с подчеркиванием или camelCase
    const watchUrlValue = tournament.watch_url || tournament.watchUrl || '';
    document.getElementById('tournament-watch-url').value = watchUrlValue;
    
    // Турнир загружен в форму
    
    document.getElementById('tournament-status').value = 'finished';
    document.getElementById('winner-field').style.display = 'block';
    document.getElementById('watch-url-field').style.display = 'block';
    
    document.getElementById('tournament-modal').classList.add('active');
    updateDisciplineDropdown();
}

function openEditModal(tournament) {
    currentEditingId = tournament.id;
    document.getElementById('modal-title').textContent = 'Редактировать турнир';
    
    document.getElementById('tournament-id').value = tournament.id;
    document.getElementById('tournament-name').value = tournament.title;
    document.getElementById('tournament-discipline').value = tournament.discipline;
    
    // Convert date format
    const dateMatch = tournament.date.match(/(\d+)\s+(\w+)\s+(\d+)/);
    if (dateMatch) {
        const months = {
            'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
            'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
            'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
        };
        const day = dateMatch[1].padStart(2, '0');
        const month = months[dateMatch[2]];
        const year = dateMatch[3];
        document.getElementById('tournament-date').value = `${year}-${month}-${day}`;
    }
    
    document.getElementById('tournament-prize').value = tournament.prize;
    document.getElementById('tournament-max-teams').value = tournament.max_teams;
    document.getElementById('tournament-custom-link').value = tournament.custom_link || '';
    document.getElementById('tournament-status').value = 'active';
    document.getElementById('winner-field').style.display = 'none';
    document.getElementById('watch-url-field').style.display = 'none';
    
    document.getElementById('tournament-modal').classList.add('active');
    updateDisciplineDropdown();
}

function closeModal() {
    document.getElementById('tournament-modal').classList.remove('active');
    currentEditingId = null;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const status = document.getElementById('tournament-status').value;
    const formData = {
        title: document.getElementById('tournament-name').value,
        discipline: document.getElementById('tournament-discipline').value,
        date: formatDate(document.getElementById('tournament-date').value),
        prize: document.getElementById('tournament-prize').value,
        maxTeams: parseInt(document.getElementById('tournament-max-teams').value),
        customLink: document.getElementById('tournament-custom-link').value || null,
        winner: document.getElementById('tournament-winner').value || null,
        watchUrl: (document.getElementById('tournament-watch-url') && document.getElementById('tournament-watch-url').value.trim()) || null,
        status: status
    };
    
    try {
        if (currentEditingId) {
            formData.id = currentEditingId;
            await API.tournaments.update(formData);
            alert('Турнир обновлен!');
        } else {
            await API.tournaments.create(formData);
            alert('Турнир добавлен!');
        }
        
        closeModal();
        
        // Обновляем отображение
        if (status === 'finished') {
            await loadPastTournaments();
        } else {
            await loadActiveTournaments();
        }
    } catch (error) {
        alert('Ошибка сохранения турнира: ' + error.message);
    }
}

function formatDate(dateString) {
    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    const date = new Date(dateString);
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year} г.`;
}

async function deleteTournamentConfirm(tournamentId) {
    if (confirm('Вы уверены, что хотите удалить этот турнир?')) {
        try {
            await API.tournaments.delete(tournamentId);
            alert('Турнир удален!');
            await loadActiveTournaments();
        } catch (error) {
            alert('Ошибка удаления турнира: ' + error.message);
        }
    }
}

async function deletePastTournamentConfirm(tournamentId) {
    if (confirm('Вы уверены, что хотите удалить этот прошедший турнир?')) {
        try {
            await API.tournaments.delete(tournamentId);
            alert('Прошедший турнир удален!');
            await loadPastTournaments();
        } catch (error) {
            alert('Ошибка удаления турнира: ' + error.message);
        }
    }
}

// Загрузка формы социальных ссылок
async function loadSocialLinksForm() {
    const socialLinks = await API.social.getAll();
    
    document.getElementById('twitch-link').value = socialLinks.twitch || '';
    document.getElementById('telegram-link').value = socialLinks.telegram || '';
    document.getElementById('discord-link').value = socialLinks.discord || '';
    document.getElementById('contact-link').value = socialLinks.contact || '';
}

// Сохранение социальных ссылок
async function saveSocialLinks() {
    console.log('💾 Сохранение социальных ссылок...');
    const socialLinks = {
        twitch: document.getElementById('twitch-link').value.trim(),
        telegram: document.getElementById('telegram-link').value.trim(),
        discord: document.getElementById('discord-link').value.trim(),
        contact: document.getElementById('contact-link').value.trim()
    };
    
    try {
        await API.social.save(socialLinks);
        console.log('✅ Социальные ссылки сохранены!');
        alert('Социальные ссылки сохранены!');
    } catch (error) {
        alert('Ошибка сохранения социальных ссылок: ' + error.message);
    }
}

// Загрузка списка дисциплин
async function loadDisciplinesList() {
    const list = document.getElementById('disciplines-list');
    const disciplines = await API.disciplines.getAll();
    
    list.innerHTML = disciplines.map(d => `
        <div class="discipline-item" style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: rgba(107, 45, 143, 0.2); border-radius: 8px; margin-bottom: 10px;">
            <span style="font-size: 16px; font-weight: 500;">${d}</span>
            <button class="btn-danger" onclick="deleteDiscipline('${d.replace(/'/g, "\\'")}')">Удалить</button>
        </div>
    `).join('');
}

// Добавление дисциплины
async function addDiscipline() {
    const input = document.getElementById('new-discipline-input');
    const newDiscipline = input.value.trim();
    
    if (!newDiscipline) {
        alert('Введите название дисциплины!');
        return;
    }
    
    try {
        await API.disciplines.create(newDiscipline);
        await loadDisciplinesList();
        await loadRegistrationLinksForm();
        input.value = '';
        alert(`Дисциплина "${newDiscipline}" добавлена!`);
    } catch (error) {
        alert('Ошибка добавления дисциплины: ' + error.message);
    }
}

// Удаление дисциплины
async function deleteDiscipline(discipline) {
    if (!confirm(`Вы уверены, что хотите удалить дисциплину "${discipline}"?`)) {
        return;
    }
    
    try {
        await API.disciplines.delete(discipline);
        await loadDisciplinesList();
        await loadRegistrationLinksForm();
        alert(`Дисциплина "${discipline}" удалена!`);
    } catch (error) {
        alert('Ошибка удаления дисциплины: ' + error.message);
    }
}

// Обновление dropdown дисциплин в форме турнира
async function updateDisciplineDropdown() {
    const select = document.getElementById('tournament-discipline');
    const currentValue = select.value;
    const disciplines = await API.disciplines.getAll();
    
    select.innerHTML = '<option value="">Выберите дисциплину</option>' +
        disciplines.map(d => `<option value="${d}">${d}</option>`).join('');
    
    // Восстанавливаем выбранное значение если оно есть
    if (currentValue && disciplines.includes(currentValue)) {
        select.value = currentValue;
    }
}

// Загрузка команд в админке
async function loadTeamsAdmin() {
    allTeamsData = [];
    const allTeams = await API.teams.getAll();
    const tournaments = await API.tournaments.getAll();
    
    // Сохраняем все данные для фильтрации
    Object.keys(allTeams).forEach(tournamentId => {
        const tournament = tournaments.find(t => t.id == tournamentId);
        if (tournament) {
            allTeamsData.push({
                tournament: tournament,
                teams: allTeams[tournamentId] || []
            });
        }
    });
    
    await loadTeamsDisciplineFilters();
    displayFilteredTeamsAdmin();
}

function displayFilteredTeamsAdmin() {
    const container = document.getElementById('teams-admin-container');
    
    let filtered = allTeamsData;
    
    // Фильтруем по дисциплине
    if (selectedTeamsDiscipline !== 'all') {
        filtered = allTeamsData.filter(data => 
            data.tournament.discipline === selectedTeamsDiscipline
        );
    }
    
    if (filtered.length === 0 || filtered.every(data => data.teams.length === 0)) {
        container.innerHTML = '<div class="empty-state"><p>' + 
            (selectedTeamsDiscipline === 'all' ? 'Пока нет зарегистрированных команд' : 'Команд по выбранной дисциплине нет') + 
            '</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(({tournament, teams}) => {
        return `
            <div class="tournament-section" style="margin-bottom: 30px;">
                <h3 style="margin-bottom: 15px;">${tournament.title} - ${formatDisciplineWithIcon(tournament.discipline)}</h3>
                ${teams.length > 0 ? teams.map((team) => `
                    <div class="discipline-item" style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: rgba(107, 45, 143, 0.2); border-radius: 8px; margin-bottom: 10px;">
                        <div>

                            <div style="font-size: 16px; font-weight: 600; margin-bottom: 5px;">${team.name}</div>
                            <div style="font-size: 14px; color: var(--color-text-secondary);">
                                👥 ${team.players} игроков
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn-edit" onclick="editTeam(${team.id})">Изменить</button>
                            <button class="btn-danger" onclick="deleteTeam(${team.id})">Удалить</button>
                        </div>
                    </div>
                `).join('') : '<p style="color: var(--color-text-secondary);">Нет команд</p>'}
            </div>
        `;
    }).join('');
}

async function loadTeamsDisciplineFilters() {
    const filtersContainer = document.getElementById('teams-discipline-filters');
    if (!filtersContainer) return;
    
    const disciplines = await API.disciplines.getAll();
    const disciplinesSet = new Set(allTeamsData.map(data => data.tournament.discipline).filter(d => d));
    const availableDisciplines = [...new Set(disciplines.filter(d => disciplinesSet.has(d)))];
    
    filtersContainer.innerHTML = `
        <button class="filter-btn ${selectedTeamsDiscipline === 'all' ? 'active' : ''}" data-discipline="all" onclick="filterTeamsAdminByDiscipline('all')">
            Все
        </button>
        ${availableDisciplines.map(d => `
            <button class="filter-btn ${selectedTeamsDiscipline === d ? 'active' : ''}" data-discipline="${d}" onclick="filterTeamsAdminByDiscipline('${d}')">
                ${getDisciplineIcon(d)} ${d}
            </button>
        `).join('')}
    `;
}

function filterTeamsAdminByDiscipline(discipline) {
    selectedTeamsDiscipline = discipline;
    
    document.querySelectorAll('#teams-discipline-filters .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.discipline === discipline) {
            btn.classList.add('active');
        }
    });
    
    displayFilteredTeamsAdmin();
}

window.filterTeamsAdminByDiscipline = filterTeamsAdminByDiscipline;

// Удаление команды
async function deleteTeam(teamId) {
    if (!confirm('Вы уверены, что хотите удалить эту команду?')) {
        return;
    }
    
    try {
        await API.teams.delete(teamId);
        await loadTeamsAdmin();
        alert('Команда удалена!');
    } catch (error) {
        alert('Ошибка удаления команды: ' + error.message);
    }
}

// Редактирование команды
async function editTeam(teamId) {
    const allTeams = await API.teams.getAll();
    
    // Находим команду по ID
    let team = null;
    for (const teams of Object.values(allTeams)) {
        team = teams.find(t => t.id === teamId);
        if (team) break;
    }
    
    if (!team) {
        alert('Команда не найдена');
        return;
    }
    
    currentEditingTeam = team;
    
    document.getElementById('team-modal-title').textContent = 'Редактировать команду';
    document.getElementById('team-tournament-id').value = team.tournament_id;
    document.getElementById('team-tournament').value = team.tournament_id;
    document.getElementById('team-name').value = team.name;
    document.getElementById('team-players').value = team.players;
    
    document.getElementById('team-modal').classList.add('active');
    await loadTournamentDropdown();
}

// Открыть модал добавления команды
async function openAddTeamModal() {
    currentEditingTeam = null;
    document.getElementById('team-modal-title').textContent = 'Добавить команду';
    document.getElementById('team-form').reset();
    document.getElementById('team-tournament-id').value = '';
    
    document.getElementById('team-modal').classList.add('active');
    await loadTournamentDropdown();
}

// Закрыть модал команды
function closeTeamModal() {
    document.getElementById('team-modal').classList.remove('active');
    currentEditingTeam = null;
}

// Загрузить турниры в dropdown
async function loadTournamentDropdown() {
    const select = document.getElementById('team-tournament');
    const tournaments = await API.tournaments.getAll('active');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Выберите турнир</option>' +
        tournaments.map(t => `<option value="${t.id}">${t.title}</option>`).join('');
    
    if (currentValue) {
        select.value = currentValue;
    }
}

// Обработка формы команды
async function handleTeamFormSubmit(e) {
    e.preventDefault();
    
    const tournamentId = document.getElementById('team-tournament').value;
    
    const teamData = {
        tournamentId: parseInt(tournamentId),
        name: document.getElementById('team-name').value,
        players: parseInt(document.getElementById('team-players').value)
    };
    
    try {
        if (currentEditingTeam) {
            // Редактирование
            teamData.id = currentEditingTeam.id;
            await API.teams.update(teamData);
            alert('Команда обновлена!');
        } else {
            // Добавление
            await API.teams.create(teamData);
            alert('Команда добавлена!');
        }
        
        closeTeamModal();
        await loadTeamsAdmin();
    } catch (error) {
        alert('Ошибка сохранения команды: ' + error.message);
    }
}

// ========== РЕГЛАМЕНТЫ ==========

async function loadRegulationsList() {
    const list = document.getElementById('regulations-list');
    if (!list) return;
    
    try {
        const regulations = await API.regulations.getAll();
        
        if (regulations.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>Нет загруженных регламентов</p></div>';
            return;
        }
        
        list.innerHTML = regulations.map(r => `
            <div class="regulation-item" data-id="${r.id}">
                <div class="regulation-info">
                    <h3>${r.discipline_name}${r.regulation_name ? ` - ${r.regulation_name}` : ''}</h3>
                    <a href="${r.pdf_url}" target="_blank" class="regulation-link">Открыть PDF</a>
                </div>
                <div class="regulation-actions">
                    <button class="btn-edit" onclick="editRegulation(${r.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-delete" onclick="deleteRegulation(${r.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading regulations:', error);
        list.innerHTML = '<div class="error-state"><p>Ошибка загрузки регламентов</p></div>';
    }
}

function openAddRegulationModal() {
    document.getElementById('regulation-modal-title').textContent = 'Добавить регламент';
    document.getElementById('regulation-form').reset();
    document.getElementById('regulation-id').value = '';
    document.getElementById('regulation-name').value = '';
    document.getElementById('regulation-modal').classList.add('active');
    loadDisciplinesForRegulation();
}

function closeRegulationModal() {
    document.getElementById('regulation-modal').classList.remove('active');
}

async function loadDisciplinesForRegulation() {
    const select = document.getElementById('regulation-discipline');
    const disciplines = await API.disciplines.getAll();
    
    // API возвращает массив строк, а не объектов
    select.innerHTML = '<option value="">Выберите дисциплину</option>' +
        disciplines.map(d => `<option value="${d}">${d}</option>`).join('');
}

async function handleRegulationFormSubmit(e) {
    e.preventDefault();
    
    const disciplineName = document.getElementById('regulation-discipline').value;
    const pdfUrl = document.getElementById('regulation-pdf-url').value;
    const regulationName = document.getElementById('regulation-name').value;
    
    try {
        if (document.getElementById('regulation-id').value) {
            // Редактирование
            const id = document.getElementById('regulation-id').value;
            await API.regulations.update(id, { 
                pdf_url: pdfUrl, 
                discipline_name: disciplineName,
                regulation_name: regulationName || null
            });
            alert('Регламент обновлён!');
        } else {
            // Добавление
            await API.regulations.create({ 
                discipline_name: disciplineName, 
                pdf_url: pdfUrl,
                regulation_name: regulationName || null
            });
            alert('Регламент добавлен!');
        }
        
        closeRegulationModal();
        await loadRegulationsList();
    } catch (error) {
        alert('Ошибка сохранения регламента: ' + error.message);
    }
}

async function editRegulation(id) {
    try {
        const regulations = await API.regulations.getAll();
        const regulation = regulations.find(r => r.id === id);
        
        if (!regulation) {
            alert('Регламент не найден');
            return;
        }
        
        document.getElementById('regulation-modal-title').textContent = 'Редактировать регламент';
        document.getElementById('regulation-id').value = regulation.id;
        document.getElementById('regulation-pdf-url').value = regulation.pdf_url;
        document.getElementById('regulation-name').value = regulation.regulation_name || '';
        
        await loadDisciplinesForRegulation();
        document.getElementById('regulation-discipline').value = regulation.discipline_name;
        
        document.getElementById('regulation-modal').classList.add('active');
    } catch (error) {
        alert('Ошибка загрузки регламента: ' + error.message);
    }
}

async function deleteRegulation(id) {
    if (!confirm('Вы уверены, что хотите удалить этот регламент?')) {
        return;
    }
    
    try {
        await API.regulations.delete(id);
        alert('Регламент удалён!');
        await loadRegulationsList();
    } catch (error) {
        alert('Ошибка удаления регламента: ' + error.message);
    }
}

// Добавляем обработчики в setupEventListeners
document.addEventListener('DOMContentLoaded', function() {
    // Регламенты
    const addRegulationBtn = document.getElementById('add-regulation-btn');
    const closeRegulationModalBtn = document.getElementById('close-regulation-modal');
    const cancelRegulationBtn = document.getElementById('cancel-regulation-btn');
    const regulationForm = document.getElementById('regulation-form');
    const regulationModal = document.getElementById('regulation-modal');
    
    if (addRegulationBtn) {
        addRegulationBtn.addEventListener('click', openAddRegulationModal);
    }
    if (closeRegulationModalBtn) {
        closeRegulationModalBtn.addEventListener('click', closeRegulationModal);
    }
    if (cancelRegulationBtn) {
        cancelRegulationBtn.addEventListener('click', closeRegulationModal);
    }
    if (regulationForm) {
        regulationForm.addEventListener('submit', handleRegulationFormSubmit);
    }
    if (regulationModal) {
        regulationModal.addEventListener('click', function(e) {
            if (e.target === this) closeRegulationModal();
        });
    }
});

