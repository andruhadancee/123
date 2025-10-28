// Админ-панель с поддержкой API

let currentEditingId = null;
let currentEditingTeam = null;

document.addEventListener('DOMContentLoaded', function() {
    initAdminPanel();
    loadAdminData();
    setupEventListeners();
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
    
    // Add discipline
    document.getElementById('add-discipline-btn').addEventListener('click', addDiscipline);
    document.getElementById('new-discipline-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addDiscipline();
        }
    });
    
    // Team management
    document.getElementById('add-team-btn').addEventListener('click', openAddTeamModal);
    document.getElementById('close-team-modal').addEventListener('click', closeTeamModal);
    document.getElementById('cancel-team-btn').addEventListener('click', closeTeamModal);
    document.getElementById('team-modal').addEventListener('click', function(e) {
        if (e.target === this) closeTeamModal();
    });
    document.getElementById('team-form').addEventListener('submit', handleTeamFormSubmit);
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('wbcyber_admin');
        window.location.href = 'index.html';
    });
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
}

async function loadAdminData() {
    console.log('📥 Загрузка данных в админку...');
    await loadActiveTournaments();
    await loadPastTournaments();
    await loadTeamsAdmin();
    await loadDisciplinesList();
    await loadRegistrationLinksForm();
    await loadSocialLinksForm();
    console.log('✅ Админка загружена');
}

async function loadActiveTournaments() {
    const grid = document.getElementById('active-tournaments-grid');
    grid.innerHTML = '<div class="loading">Загрузка...</div>';
    
    const tournaments = await API.tournaments.getAll('active');
    
    if (tournaments.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>Нет активных турниров</p></div>';
        return;
    }
    
    grid.innerHTML = tournaments.map(t => createAdminTournamentCard(t)).join('');
    
    // Add event listeners for edit and delete buttons
    tournaments.forEach(t => {
        const editBtn = document.getElementById(`edit-${t.id}`);
        const deleteBtn = document.getElementById(`delete-${t.id}`);
        if (editBtn) editBtn.addEventListener('click', () => openEditModal(t));
        if (deleteBtn) deleteBtn.addEventListener('click', () => deleteTournamentConfirm(t.id));
    });
}

async function loadPastTournaments() {
    const grid = document.getElementById('past-tournaments-grid');
    grid.innerHTML = '<div class="loading">Загрузка...</div>';
    
    const tournaments = await API.tournaments.getAll('finished');
    
    if (tournaments.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>Нет прошедших турниров</p></div>';
        return;
    }
    
    grid.innerHTML = tournaments.map(t => createAdminTournamentCard(t, true)).join('');
    
    // Add event listeners for edit and delete buttons
    tournaments.forEach(t => {
        const editBtn = document.getElementById(`edit-past-${t.id}`);
        const deleteBtn = document.getElementById(`delete-past-${t.id}`);
        if (editBtn) editBtn.addEventListener('click', () => openEditPastModal(t));
        if (deleteBtn) deleteBtn.addEventListener('click', () => deletePastTournamentConfirm(t.id));
    });
}

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
        <div class="link-item">
            <label>${discipline}</label>
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
    document.getElementById('tournament-status').value = 'finished';
    document.getElementById('winner-field').style.display = 'block';
    
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
    const container = document.getElementById('teams-admin-container');
    const allTeams = await API.teams.getAll();
    const tournaments = await API.tournaments.getAll();
    
    if (Object.keys(allTeams).length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Пока нет зарегистрированных команд</p></div>';
        return;
    }
    
    container.innerHTML = Object.keys(allTeams).map(tournamentId => {
        const tournament = tournaments.find(t => t.id == tournamentId);
        const teams = allTeams[tournamentId] || [];
        
        return `
            <div class="tournament-section" style="margin-bottom: 30px;">
                <h3 style="margin-bottom: 15px;">${tournament ? tournament.title : `Турнир #${tournamentId}`}</h3>
                ${teams.length > 0 ? teams.map((team) => `
                    <div class="discipline-item" style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: rgba(107, 45, 143, 0.2); border-radius: 8px; margin-bottom: 10px;">
                        <div>
                            <div style="font-size: 16px; font-weight: 600; margin-bottom: 5px;">${team.name}</div>
                            <div style="font-size: 14px; color: var(--color-text-secondary);">
                                👤 ${team.captain} | 👥 ${team.players} игроков | 📅 ${team.registration_date}
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
    document.getElementById('team-captain').value = team.captain;
    document.getElementById('team-players').value = team.players;
    
    // Конвертируем дату из DD.MM.YYYY в YYYY-MM-DD
    const dateParts = team.registration_date.split('.');
    if (dateParts.length === 3) {
        document.getElementById('team-date').value = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    }
    
    document.getElementById('team-modal').classList.add('active');
    await loadTournamentDropdown();
}

// Открыть модал добавления команды
async function openAddTeamModal() {
    currentEditingTeam = null;
    document.getElementById('team-modal-title').textContent = 'Добавить команду';
    document.getElementById('team-form').reset();
    document.getElementById('team-tournament-id').value = '';
    
    // Установить текущую дату
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('team-date').value = today;
    
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
    
    // Конвертируем дату в DD.MM.YYYY
    const dateValue = document.getElementById('team-date').value;
    const date = new Date(dateValue);
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
    
    const teamData = {
        tournamentId: parseInt(tournamentId),
        name: document.getElementById('team-name').value,
        captain: document.getElementById('team-captain').value,
        players: parseInt(document.getElementById('team-players').value),
        registrationDate: formattedDate
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

