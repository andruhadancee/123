// База данных турниров (временная, потом заменим на Firebase)
const tournamentsDB = {
    active: [
        {
            id: 1,
            number: 1,
            title: "Турнир 5X5 CS2 ORCHIDCUP",
            discipline: "CS 2",
            date: "27 октября 2025 г.",
            prize: "25 000 ₽",
            teams: 16,
            maxTeams: 16,
            registrationLink: "https://forms.gle/example-cs2",
            status: "active"
        },
        {
            id: 2,
            number: 3,
            title: "Турнир 5X5 DOTA2 ORCHIDCUP",
            discipline: "Dota 2",
            date: "31 октября 2025 г.",
            prize: "25 000 ₽",
            teams: 32,
            maxTeams: 32,
            registrationLink: "https://forms.gle/example-dota2",
            status: "active"
        }
    ],
    
    past: [
        {
            id: 100,
            number: 0,
            title: "Турнир 5X5 CS2 WBCYBERCLUB",
            discipline: "CS 2",
            date: "15 октября 2025 г.",
            prize: "20 000 ₽",
            teams: 16,
            maxTeams: 16,
            winner: "Team Liquid",
            status: "finished"
        }
    ],
    
    registeredTeams: {
        1: [
            { name: "Team Spirit", captain: "Иванов А.", players: 5, registrationDate: "20.10.2025" },
            { name: "Natus Vincere", captain: "Петров Б.", players: 5, registrationDate: "21.10.2025" },
            { name: "Virtus.pro", captain: "Сидоров В.", players: 5, registrationDate: "22.10.2025" },
        ],
        2: [
            { name: "OG", captain: "Смирнов Г.", players: 5, registrationDate: "23.10.2025" },
            { name: "Team Secret", captain: "Козлов Д.", players: 5, registrationDate: "24.10.2025" },
        ]
    }
};

// Настройки ссылок для регистрации по дисциплинам
const registrationLinks = {
    "CS 2": "https://forms.gle/your-cs2-form-link",
    "Dota 2": "https://forms.gle/your-dota2-form-link",
    "Valorant": "https://forms.gle/your-valorant-form-link",
    "Overwatch 2": "https://forms.gle/your-overwatch-form-link",
};

// Функция для получения активных турниров
function getActiveTournaments() {
    return tournamentsDB.active;
}

// Функция для получения прошедших турниров
function getPastTournaments() {
    return tournamentsDB.past;
}

// Функция для получения зарегистрированных команд
function getRegisteredTeams(tournamentId) {
    return tournamentsDB.registeredTeams[tournamentId] || [];
}

// Функция для получения всех зарегистрированных команд
function getAllRegisteredTeams() {
    return tournamentsDB.registeredTeams;
}

// Функция для добавления турнира (для админ-панели)
function addTournament(tournamentData) {
    const newId = Math.max(...tournamentsDB.active.map(t => t.id), 0) + 1;
    const newNumber = Math.max(...tournamentsDB.active.map(t => t.number), 0) + 1;
    
    // Приоритет: customLink > registrationLinks[discipline] > "#"
    let regLink = "#";
    if (tournamentData.customLink && tournamentData.customLink.trim()) {
        regLink = tournamentData.customLink.trim();
    } else if (registrationLinks[tournamentData.discipline]) {
        regLink = registrationLinks[tournamentData.discipline];
    }
    
    const tournament = {
        id: newId,
        number: newNumber,
        title: tournamentData.title,
        discipline: tournamentData.discipline,
        date: tournamentData.date,
        prize: tournamentData.prize,
        teams: 0,
        maxTeams: tournamentData.maxTeams,
        registrationLink: regLink,
        customLink: tournamentData.customLink || "",
        status: "active"
    };
    
    tournamentsDB.active.push(tournament);
    saveTournamentsToStorage();
    return tournament;
}

// Функция для удаления турнира (для админ-панели)
function deleteTournament(tournamentId) {
    tournamentsDB.active = tournamentsDB.active.filter(t => t.id !== tournamentId);
    saveTournamentsToStorage();
}

// Функция для добавления прошедшего турнира
function addPastTournament(tournamentData) {
    const newId = Math.max(...tournamentsDB.past.map(t => t.id), 0, 100) + 1;
    const newNumber = Math.max(...tournamentsDB.past.map(t => t.number), 0) + 1;
    
    const tournament = {
        id: newId,
        number: newNumber,
        title: tournamentData.title,
        discipline: tournamentData.discipline,
        date: tournamentData.date,
        prize: tournamentData.prize,
        teams: tournamentData.maxTeams, // Для прошедших турниров ставим максимум
        maxTeams: tournamentData.maxTeams,
        winner: tournamentData.winner || "Не указан",
        status: "finished"
    };
    
    tournamentsDB.past.push(tournament);
    saveTournamentsToStorage();
    return tournament;
}

// Функция для удаления прошедшего турнира
function deletePastTournament(tournamentId) {
    tournamentsDB.past = tournamentsDB.past.filter(t => t.id !== tournamentId);
    saveTournamentsToStorage();
}

// Функция для обновления турнира (для админ-панели)
function updateTournament(tournamentId, updateData) {
    const index = tournamentsDB.active.findIndex(t => t.id === tournamentId);
    if (index !== -1) {
        // Обновляем ссылку на регистрацию
        let regLink = tournamentsDB.active[index].registrationLink;
        if (updateData.customLink && updateData.customLink.trim()) {
            regLink = updateData.customLink.trim();
        } else if (updateData.discipline && registrationLinks[updateData.discipline]) {
            regLink = registrationLinks[updateData.discipline];
        }
        
        tournamentsDB.active[index] = { 
            ...tournamentsDB.active[index], 
            ...updateData,
            registrationLink: regLink
        };
        saveTournamentsToStorage();
        return tournamentsDB.active[index];
    }
    return null;
}

// Сохранение в localStorage (временное решение)
function saveTournamentsToStorage() {
    localStorage.setItem('wbcyber_tournaments', JSON.stringify(tournamentsDB));
}

// Загрузка из localStorage
function loadTournamentsFromStorage() {
    const stored = localStorage.getItem('wbcyber_tournaments');
    if (stored) {
        const data = JSON.parse(stored);
        tournamentsDB.active = data.active || tournamentsDB.active;
        tournamentsDB.past = data.past || tournamentsDB.past;
        tournamentsDB.registeredTeams = data.registeredTeams || tournamentsDB.registeredTeams;
    }
    
    // Загрузка ссылок на формы из localStorage
    const storedLinks = localStorage.getItem('wbcyber_registration_links');
    if (storedLinks) {
        const links = JSON.parse(storedLinks);
        Object.assign(registrationLinks, links);
    }
}

// Инициализация при загрузке
loadTournamentsFromStorage();

