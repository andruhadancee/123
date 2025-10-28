// Админ-панель

let currentEditingId = null;

document.addEventListener('DOMContentLoaded', function() {
    initAdminPanel();
    loadAdminData();
    setupEventListeners();
});

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

function loadAdminData() {
    console.log('📥 Загрузка данных в админку...');
    // ВАЖНО: Сначала загружаем из localStorage!
    loadTournamentsFromStorage();
    // Потом отображаем
    loadActiveTournaments();
    loadPastTournaments();
    loadTeamsAdmin();
    loadDisciplinesList();
    loadRegistrationLinksForm();
    loadSocialLinksForm();
    console.log('✅ Админка загружена');
}

function loadActiveTournaments() {
    const grid = document.getElementById('active-tournaments-grid');
    const tournaments = getActiveTournaments();
    
    if (tournaments.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>Нет активных турниров</p></div>';
        return;
    }
    
    grid.innerHTML = tournaments.map(t => createAdminTournamentCard(t)).join('');
    
    // Add event listeners for edit and delete buttons
    tournaments.forEach(t => {
        document.getElementById(`edit-${t.id}`).addEventListener('click', () => openEditModal(t));
        document.getElementById(`delete-${t.id}`).addEventListener('click', () => deleteTournamentConfirm(t.id));
    });
}

function loadPastTournaments() {
    const grid = document.getElementById('past-tournaments-grid');
    const tournaments = getPastTournaments();
    
    if (tournaments.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>Нет прошедших турниров</p></div>';
        return;
    }
    
    grid.innerHTML = tournaments.map(t => createAdminTournamentCard(t, true)).join('');
    
    // Add event listeners for edit and delete buttons
    tournaments.forEach(t => {
        const editBtn = document.getElementById(`edit-past-${t.id}`);
        const deleteBtn = document.getElementById(`delete-past-${t.id}`);
        
        if (editBtn) {
            editBtn.addEventListener('click', () => openEditPastModal(t));
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deletePastTournamentConfirm(t.id));
        }
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
                    <span class="info-value">${tournament.discipline}</span>
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
                    <span class="info-value">${tournament.teams || 0} / ${tournament.maxTeams}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Номер</span>
                    <span class="info-value">#${tournament.number}</span>
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

function loadRegistrationLinksForm() {
    const grid = document.getElementById('links-grid');
    const disciplines = getDisciplines();
    const links = JSON.parse(localStorage.getItem('wbcyber_registration_links') || '{}');
    
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

function saveRegistrationLinks() {
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
    
    localStorage.setItem('wbcyber_registration_links', JSON.stringify(links));
    console.log('✅ Ссылки сохранены в localStorage!');
    
    // Update registrationLinks in tournaments-data.js
    Object.assign(registrationLinks, links);
    
    alert('Ссылки сохранены! Обновите главную страницу (Ctrl+Shift+R).');
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
    document.getElementById('tournament-status').value = 'past';
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
    document.getElementById('tournament-max-teams').value = tournament.maxTeams;
    document.getElementById('tournament-custom-link').value = tournament.customLink || '';
    document.getElementById('tournament-winner').value = tournament.winner || '';
    document.getElementById('tournament-status').value = 'past';
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
    document.getElementById('tournament-max-teams').value = tournament.maxTeams;
    document.getElementById('tournament-custom-link').value = tournament.customLink || '';
    
    document.getElementById('tournament-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('tournament-modal').classList.remove('active');
    currentEditingId = null;
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const status = document.getElementById('tournament-status').value;
    const formData = {
        title: document.getElementById('tournament-name').value,
        discipline: document.getElementById('tournament-discipline').value,
        date: formatDate(document.getElementById('tournament-date').value),
        prize: document.getElementById('tournament-prize').value,
        maxTeams: parseInt(document.getElementById('tournament-max-teams').value),
        customLink: document.getElementById('tournament-custom-link').value,
        winner: document.getElementById('tournament-winner').value
    };
    
    if (currentEditingId) {
        // Проверяем, это активный или прошедший турнир
        if (status === 'past') {
            updatePastTournament(currentEditingId, formData);
        } else {
        updateTournament(currentEditingId, formData);
        }
    } else {
        if (status === 'past') {
            addPastTournament(formData);
    } else {
        addTournament(formData);
        }
    }
    
    closeModal();
    
    // Перезагружаем данные и обновляем отображение
    console.log('🔄 Обновление после изменения...');
    loadTournamentsFromStorage();
    loadActiveTournaments();
    loadPastTournaments();
    console.log('✅ Обновлено!');
    
    alert(currentEditingId ? 'Турнир обновлен! Обновите главную страницу.' : 'Турнир добавлен! Обновите главную страницу.');
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

function deleteTournamentConfirm(tournamentId) {
    if (confirm('Вы уверены, что хотите удалить этот турнир?')) {
        console.log('🗑️ Удаление турнира...');
        deleteTournament(tournamentId);
        
        // Перезагружаем данные из localStorage
        loadTournamentsFromStorage();
        
        // Обновляем отображение
        loadActiveTournaments();
        
        console.log('✅ Турнир удален!');
        alert('Турнир удален! Обновите главную страницу (Ctrl+Shift+R).');
    }
}

function deletePastTournamentConfirm(tournamentId) {
    if (confirm('Вы уверены, что хотите удалить этот прошедший турнир?')) {
        console.log('🗑️ Удаление прошедшего турнира...');
        deletePastTournament(tournamentId);
        
        // Перезагружаем данные из localStorage
        loadTournamentsFromStorage();
        
        // Обновляем отображение
        loadPastTournaments();
        
        console.log('✅ Прошедший турнир удален!');
        alert('Прошедший турнир удален! Обновите страницу архива (Ctrl+Shift+R).');
    }
}

// Загрузка формы социальных ссылок
function loadSocialLinksForm() {
    const socialLinks = JSON.parse(localStorage.getItem('wbcyber_social_links') || '{}');
    
    document.getElementById('twitch-link').value = socialLinks.twitch || '';
    document.getElementById('telegram-link').value = socialLinks.telegram || '';
    document.getElementById('contact-link').value = socialLinks.contact || '';
}

// Сохранение социальных ссылок
function saveSocialLinks() {
    console.log('💾 Сохранение социальных ссылок...');
    const socialLinks = {
        twitch: document.getElementById('twitch-link').value.trim(),
        telegram: document.getElementById('telegram-link').value.trim(),
        contact: document.getElementById('contact-link').value.trim()
    };
    
    console.log('  🔗 Twitch:', socialLinks.twitch || 'не указано');
    console.log('  🔗 Telegram:', socialLinks.telegram || 'не указано');
    console.log('  🔗 Contact:', socialLinks.contact || 'не указано');
    
    localStorage.setItem('wbcyber_social_links', JSON.stringify(socialLinks));
    console.log('✅ Социальные ссылки сохранены в localStorage!');
    
    alert('Социальные ссылки сохранены! Обновите главную страницу (Ctrl+Shift+R).');
}

// Получение списка дисциплин
function getDisciplines() {
    const stored = localStorage.getItem('wbcyber_disciplines');
    if (stored) {
        return JSON.parse(stored);
    }
    // Дефолтные дисциплины
    return ['CS 2', 'Dota 2', 'Valorant', 'Overwatch 2', 'League of Legends'];
}

// Сохранение дисциплин
function saveDisciplines(disciplines) {
    localStorage.setItem('wbcyber_disciplines', JSON.stringify(disciplines));
    
    // Обновляем dropdown в форме турнира
    updateDisciplineDropdown();
    
    // Обновляем форму ссылок на регистрацию
    loadRegistrationLinksForm();
}

// Загрузка списка дисциплин
function loadDisciplinesList() {
    const list = document.getElementById('disciplines-list');
    const disciplines = getDisciplines();
    
    list.innerHTML = disciplines.map(d => `
        <div class="discipline-item" style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: rgba(107, 45, 143, 0.2); border-radius: 8px; margin-bottom: 10px;">
            <span style="font-size: 16px; font-weight: 500;">${d}</span>
            <button class="btn-danger" onclick="deleteDiscipline('${d.replace(/'/g, "\\'")}')">Удалить</button>
        </div>
    `).join('');
}

// Добавление дисциплины
function addDiscipline() {
    const input = document.getElementById('new-discipline-input');
    const newDiscipline = input.value.trim();
    
    if (!newDiscipline) {
        alert('Введите название дисциплины!');
        return;
    }
    
    const disciplines = getDisciplines();
    
    if (disciplines.includes(newDiscipline)) {
        alert('Такая дисциплина уже существует!');
        return;
    }
    
    disciplines.push(newDiscipline);
    saveDisciplines(disciplines);
    loadDisciplinesList();
    
    input.value = '';
    alert(`Дисциплина "${newDiscipline}" добавлена!`);
}

// Удаление дисциплины
function deleteDiscipline(discipline) {
    if (!confirm(`Вы уверены, что хотите удалить дисциплину "${discipline}"?`)) {
        return;
    }
    
    let disciplines = getDisciplines();
    disciplines = disciplines.filter(d => d !== discipline);
    
    saveDisciplines(disciplines);
    loadDisciplinesList();
    
    alert(`Дисциплина "${discipline}" удалена!`);
}

// Обновление dropdown дисциплин в форме турнира
function updateDisciplineDropdown() {
    const select = document.getElementById('tournament-discipline');
    const currentValue = select.value;
    const disciplines = getDisciplines();
    
    select.innerHTML = '<option value="">Выберите дисциплину</option>' +
        disciplines.map(d => `<option value="${d}">${d}</option>`).join('');
    
    // Восстанавливаем выбранное значение если оно есть
    if (currentValue && disciplines.includes(currentValue)) {
        select.value = currentValue;
    }
}

// Загрузка команд в админке
function loadTeamsAdmin() {
    const container = document.getElementById('teams-admin-container');
    const allTeams = getAllRegisteredTeams();
    const tournaments = getActiveTournaments();
    
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
                ${teams.length > 0 ? teams.map((team, index) => `
                    <div class="discipline-item" style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: rgba(107, 45, 143, 0.2); border-radius: 8px; margin-bottom: 10px;">
                        <div>
                            <div style="font-size: 16px; font-weight: 600; margin-bottom: 5px;">${team.name}</div>
                            <div style="font-size: 14px; color: var(--color-text-secondary);">
                                👤 ${team.captain} | 👥 ${team.players} игроков | 📅 ${team.registrationDate}
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn-edit" onclick="editTeam(${tournamentId}, ${index})">Изменить</button>
                            <button class="btn-danger" onclick="deleteTeam(${tournamentId}, ${index})">Удалить</button>
                        </div>
                    </div>
                `).join('') : '<p style="color: var(--color-text-secondary);">Нет команд</p>'}
            </div>
        `;
    }).join('');
}

// Удаление команды
function deleteTeam(tournamentId, teamIndex) {
    if (!confirm('Вы уверены, что хотите удалить эту команду?')) {
        return;
    }
    
    const stored = localStorage.getItem('wbcyber_tournaments');
    if (stored) {
        const data = JSON.parse(stored);
        if (data.registeredTeams && data.registeredTeams[tournamentId]) {
            data.registeredTeams[tournamentId].splice(teamIndex, 1);
            localStorage.setItem('wbcyber_tournaments', JSON.stringify(data));
            loadTournamentsFromStorage();
            loadTeamsAdmin();
            alert('Команда удалена!');
        }
    }
}

// Редактирование команды
function editTeam(tournamentId, teamIndex) {
    const teams = getAllRegisteredTeams();
    const team = teams[tournamentId][teamIndex];
    
    document.getElementById('team-modal-title').textContent = 'Редактировать команду';
    document.getElementById('team-tournament-id').value = tournamentId;
    document.getElementById('team-index').value = teamIndex;
    document.getElementById('team-tournament').value = tournamentId;
    document.getElementById('team-name').value = team.name;
    document.getElementById('team-captain').value = team.captain;
    document.getElementById('team-players').value = team.players;
    
    // Конвертируем дату из DD.MM.YYYY в YYYY-MM-DD
    const dateParts = team.registrationDate.split('.');
    if (dateParts.length === 3) {
        document.getElementById('team-date').value = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    }
    
    document.getElementById('team-modal').classList.add('active');
    loadTournamentDropdown();
}

// Открыть модал добавления команды
function openAddTeamModal() {
    document.getElementById('team-modal-title').textContent = 'Добавить команду';
    document.getElementById('team-form').reset();
    document.getElementById('team-tournament-id').value = '';
    document.getElementById('team-index').value = '';
    
    // Установить текущую дату
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('team-date').value = today;
    
    document.getElementById('team-modal').classList.add('active');
    loadTournamentDropdown();
}

// Закрыть модал команды
function closeTeamModal() {
    document.getElementById('team-modal').classList.remove('active');
}

// Загрузить турниры в dropdown
function loadTournamentDropdown() {
    const select = document.getElementById('team-tournament');
    const tournaments = getActiveTournaments();
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Выберите турнир</option>' +
        tournaments.map(t => `<option value="${t.id}">${t.title}</option>`).join('');
    
    if (currentValue) {
        select.value = currentValue;
    }
}

// Обработка формы команды
function handleTeamFormSubmit(e) {
    e.preventDefault();
    
    const tournamentId = document.getElementById('team-tournament').value;
    const teamIndex = document.getElementById('team-index').value;
    
    // Конвертируем дату в DD.MM.YYYY
    const dateValue = document.getElementById('team-date').value;
    const date = new Date(dateValue);
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
    
    const teamData = {
        name: document.getElementById('team-name').value,
        captain: document.getElementById('team-captain').value,
        players: parseInt(document.getElementById('team-players').value),
        registrationDate: formattedDate
    };
    
    const stored = localStorage.getItem('wbcyber_tournaments');
    if (stored) {
        const data = JSON.parse(stored);
        
        if (!data.registeredTeams) {
            data.registeredTeams = {};
        }
        
        if (!data.registeredTeams[tournamentId]) {
            data.registeredTeams[tournamentId] = [];
        }
        
        if (teamIndex !== '') {
            // Редактирование
            data.registeredTeams[tournamentId][teamIndex] = teamData;
        } else {
            // Добавление
            data.registeredTeams[tournamentId].push(teamData);
        }
        
        localStorage.setItem('wbcyber_tournaments', JSON.stringify(data));
        loadTournamentsFromStorage();
        loadTeamsAdmin();
        closeTeamModal();
        alert(teamIndex !== '' ? 'Команда обновлена!' : 'Команда добавлена!');
    }
}

