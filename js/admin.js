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
    
    // Add tournament button
    document.getElementById('add-tournament-btn').addEventListener('click', openAddModal);
    
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
    loadActiveTournaments();
    loadPastTournaments();
    loadRegistrationLinksForm();
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
            </div>
            ${!isPast ? `
            <div class="tournament-admin-actions">
                <button class="btn-edit" id="edit-${tournament.id}">Изменить</button>
                <button class="btn-danger" id="delete-${tournament.id}">Удалить</button>
            </div>
            ` : ''}
        </div>
    `;
}

function loadRegistrationLinksForm() {
    const grid = document.getElementById('links-grid');
    const disciplines = ['CS 2', 'Dota 2', 'Valorant', 'Overwatch 2', 'League of Legends'];
    const links = JSON.parse(localStorage.getItem('wbcyber_registration_links') || '{}');
    
    grid.innerHTML = disciplines.map(discipline => `
        <div class="link-item">
            <label>${discipline}</label>
            <input type="url" 
                   class="link-input" 
                   data-discipline="${discipline}" 
                   value="${links[discipline] || ''}" 
                   placeholder="https://forms.gle/...">
        </div>
    `).join('');
}

function saveRegistrationLinks() {
    const links = {};
    document.querySelectorAll('.link-input').forEach(input => {
        const discipline = input.dataset.discipline;
        const url = input.value.trim();
        if (url) {
            links[discipline] = url;
        }
    });
    
    localStorage.setItem('wbcyber_registration_links', JSON.stringify(links));
    
    // Update registrationLinks in tournaments-data.js
    Object.assign(registrationLinks, links);
    
    alert('Ссылки сохранены!');
}

function openAddModal() {
    currentEditingId = null;
    document.getElementById('modal-title').textContent = 'Добавить турнир';
    document.getElementById('tournament-form').reset();
    document.getElementById('tournament-id').value = '';
    document.getElementById('tournament-modal').classList.add('active');
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
    
    const formData = {
        title: document.getElementById('tournament-name').value,
        discipline: document.getElementById('tournament-discipline').value,
        date: formatDate(document.getElementById('tournament-date').value),
        prize: document.getElementById('tournament-prize').value,
        maxTeams: parseInt(document.getElementById('tournament-max-teams').value),
        customLink: document.getElementById('tournament-custom-link').value
    };
    
    if (currentEditingId) {
        updateTournament(currentEditingId, formData);
    } else {
        addTournament(formData);
    }
    
    closeModal();
    loadActiveTournaments();
    alert(currentEditingId ? 'Турнир обновлен!' : 'Турнир добавлен!');
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
        deleteTournament(tournamentId);
        loadActiveTournaments();
        alert('Турнир удален!');
    }
}

