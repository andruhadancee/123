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
    console.log('✅ Админка загружена');
}

// ===== КАЛЕНДАРЬ (АДМИН) =====
async function loadCalendarAdmin() {
    const container = document.getElementById('calendar-admin-list');
    if (!container) return;
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const events = await API.calendar.getAll(month);
    if (!events || events.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Событий нет</p></div>';
        return;
    }
    container.innerHTML = events.map(e => `
        <div class="tournament-card" style="margin-bottom:12px;">
            <div class="tournament-card-header">
                <h2>${e.title}</h2>
                <div style="display:flex; gap:8px;">
                    <button class="btn-edit" onclick="editCalendarEvent(${e.id})">Изменить</button>
                    <button class="btn-danger" onclick="deleteCalendarEvent(${e.id})">Удалить</button>
                </div>
            </div>
            <div class="info-value" style="margin-bottom:6px;">${e.description || ''}</div>
            <div class="info-label">Дата: ${e.event_date}</div>
            ${e.image_url ? `<img src="${e.image_url}" style="max-width:100%; border-radius:8px; margin-top:8px;">` : ''}
        </div>
    `).join('');
}

async function deleteCalendarEvent(id) {
    if (!confirm('Удалить событие?')) return;
    await API.calendar.delete(id);
    await loadCalendarAdmin();
}

let editingCalendarId = null;

function openCalendarModal(event) {
    const modal = document.getElementById('calendar-event-modal');
    const titleEl = document.getElementById('calendar-event-title');
    const idEl = document.getElementById('calendar-event-id');
    const t = document.getElementById('calendar-title');
    const d = document.getElementById('calendar-date');
    const desc = document.getElementById('calendar-description');
    const img = document.getElementById('calendar-image');

    if (event) {
        editingCalendarId = event.id;
        titleEl.textContent = 'Изменить событие';
        idEl.value = event.id;
        t.value = event.title || '';
        d.value = (event.event_date || '').slice(0,10);
        desc.value = event.description || '';
        img.value = event.image_url || '';
    } else {
        editingCalendarId = null;
        titleEl.textContent = 'Добавить событие';
        idEl.value = '';
        t.value = '';
        d.value = '';
        desc.value = '';
        img.value = '';
    }
    modal.classList.add('active');
}

function closeCalendarModal(){
    document.getElementById('calendar-event-modal').classList.remove('active');
}

async function editCalendarEvent(id) {
    // Получаем событие из списка на странице
    const container = document.getElementById('calendar-admin-list');
    if (!container) return;
    const month = new Date();
    const key = `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}`;
    const events = await API.calendar.getAll(key);
    const e = events.find(x => x.id === id);
    if (!e) return;
    openCalendarModal(e);
}

async function createCalendarEvent() {
    openCalendarModal(null);
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
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('calendar-title').value.trim();
            const eventDate = document.getElementById('calendar-date').value;
            const description = document.getElementById('calendar-description').value.trim();
            const imageUrl = document.getElementById('calendar-image').value.trim();
            if (!title || !eventDate) return;
            if (editingCalendarId) {
                await API.calendar.update({ id: editingCalendarId, title, description, eventDate, imageUrl });
            } else {
                await API.calendar.create({ title, description, eventDate, imageUrl });
            }
            closeCalendarModal();
            await loadCalendarAdmin();
        });
    }
    if (cancelBtn) cancelBtn.addEventListener('click', closeCalendarModal);
    if (closeBtn) closeBtn.addEventListener('click', closeCalendarModal);
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

