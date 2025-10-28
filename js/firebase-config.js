// Firebase Configuration
// Это шаблон конфигурации Firebase. Замените значения на свои после создания проекта в Firebase Console

// Инструкция по настройке Firebase:
// 1. Перейдите на https://console.firebase.google.com/
// 2. Создайте новый проект "WB Cyber Club"
// 3. В настройках проекта найдите "Web app" и скопируйте конфигурацию
// 4. Замените значения ниже на свои
// 5. Включите Firestore Database и Authentication в консоли Firebase

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Раскомментируйте после настройки Firebase
/*
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Экспорт для использования в других файлах
window.firebaseDb = db;
window.firebaseAuth = auth;
*/

// Временно используем localStorage до настройки Firebase
console.log('Firebase не настроен. Используется localStorage для хранения данных.');
console.log('Для настройки Firebase следуйте инструкциям в файле js/firebase-config.js');

