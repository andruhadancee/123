// Простая и надежная версия без сложных функций
console.log("App started!");

// Показ экрана
function showScreen(screenId) {
    console.log("Showing: " + screenId);
    
    // Скрываем все экраны
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.style.display = 'none';
    });
    
    // Показываем нужный экран
    const activeScreen = document.getElementById(screenId);
    if (activeScreen) {
        activeScreen.style.display = 'block';
    }
    
    // Обновляем профиль если нужно
    if (screenId === 'myProfile') {
        loadProfile();
    }
}

// Выбор позиции
let selectedPosition = null;
function selectPosition(pos) {
    selectedPosition = pos;
    
    // Убираем выделение у всех кнопок
    const buttons = document.querySelectorAll('.pos-btn');
    buttons.forEach(btn => {
        btn.style.background = 'white';
        btn.style.color = 'black';
    });
    
    // Выделяем выбранную позицию
    if (buttons[pos-1]) {
        buttons[pos-1].style.background = '#667eea';
        buttons[pos-1].style.color = 'white';
    }
}

// Предпросмотр анкеты
function previewApplication() {
    const name = document.getElementById('name').value;
    const tgUsername = document.getElementById('tgUsername').value;
    const mmr = document.getElementById('mmr').value;
    const about = document.getElementById('aboutText').value;
    
    // Проверка заполнения
    if (!name || !tgUsername || !mmr || !selectedPosition) {
        alert('Пожалуйста, заполните все поля!');
        return;
    }
    
    // Создаем превью
    const previewHTML = `
        <h3>${name}</h3>
        <p><strong>TG:</strong> @${tgUsername}</p>
        <p><strong>MMR:</strong> ${mmr}</p>
        <p><strong>Позиция:</strong> ${selectedPosition}</p>
        <p><strong>О себе:</strong> ${about || 'Не указано'}</p>
    `;
    
    document.getElementById('previewContent').innerHTML = previewHTML;
    showScreen('preview');
}

// Сохранение анкеты
function saveApplication() {
    const application = {
        name: document.getElementById('name').value,
        tgUsername: document.getElementById('tgUsername').value,
        mmr: document.getElementById('mmr').value,
        position: selectedPosition,
        about: document.getElementById('aboutText').value
    };
    
    // Сохраняем в localStorage
    localStorage.setItem('userApplication', JSON.stringify(application));
    alert('Анкета сохранена! ✅');
    showScreen('myProfile');
}

// Загрузка профиля
function loadProfile() {
    const saved = localStorage.getItem('userApplication');
    const profileDiv = document.getElementById('profileContent');
    
    if (!saved) {
        profileDiv.innerHTML = '<p>Анкета еще не заполнена</p>';
        return;
    }
    
    const application = JSON.parse(saved);
    profileDiv.innerHTML = `
        <h3>${application.name}</h3>
        <p><strong>TG:</strong> @${application.tgUsername}</p>
        <p><strong>MMR:</strong> ${application.mmr}</p>
        <p><strong>Позиция:</strong> ${application.position}</p>
        <p><strong>О себе:</strong> ${application.about || 'Не указано'}</p>
    `;
}

// Редактирование анкеты
function editApplication() {
    const saved = localStorage.getItem('userApplication');
    if (saved) {
        const application = JSON.parse(saved);
        
        document.getElementById('name').value = application.name;
        document.getElementById('tgUsername').value = application.tgUsername;
        document.getElementById('mmr').value = application.mmr;
        document.getElementById('aboutText').value = application.about || '';
        
        // Восстанавливаем позицию
        selectPosition(application.position);
    }
    
    showScreen('findTeam');
}

// Удаление анкеты
function deleteApplication() {
    if (confirm('Удалить анкету?')) {
        localStorage.removeItem('userApplication');
        loadProfile();
    }
}

// Поиск команды - заглушки
function setRatingFilter(range) {
    alert('Фильтр рейтинга: ' + range);
}

function setPositionFilter(pos) {
    alert('Фильтр позиции: ' + pos);
}

function startSearch() {
    alert('Поиск запущен! В реальном приложении здесь будет поиск по базе данных.');
    showScreen('viewProfiles');
}

// Mock данные для демонстрации
function showProfile() {
    document.getElementById('currentProfile').innerHTML = `
        <h3>Пример игрока</h3>
        <p><strong>TG:</strong> @example_player</p>
        <p><strong>MMR:</strong> 4500</p>
        <p><strong>Позиция:</strong> 2</p>
        <p><strong>О себе:</strong> Ищу команду для турниров</p>
    `;
}

function nextProfile() {
    alert('Следующий игрок →');
}

function prevProfile() {
    alert('← Предыдущий игрок');
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log("Документ загружен!");
    loadProfile();
    
    // Простая инициализация Telegram Web App
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.expand();
        console.log("Telegram Web App инициализирован");
    }
});
