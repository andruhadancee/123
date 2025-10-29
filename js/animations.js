// Scroll animations for cards
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });
    
    document.querySelectorAll('.tournament-card').forEach(card => {
        observer.observe(card);
    });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initScrollAnimations, 300);
});

// Экспорт функции для переинициализации после фильтрации
window.initScrollAnimations = initScrollAnimations;

