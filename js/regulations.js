// Regulations modal functionality

// Открыть модалку регламентов
async function openRegulationsModal(e) {
    e.preventDefault();
    const modal = document.getElementById('regulations-modal');
    const buttonsContainer = document.getElementById('regulations-buttons');
    
    // Загружаем регламенты
    try {
        const regulations = await API.regulations.getAll();
        
        if (regulations.length === 0) {
            buttonsContainer.innerHTML = '<p style="color: var(--color-text-secondary); margin: 20px 0;">Регламенты пока не добавлены</p>';
        } else {
            // Создаём кнопки для каждой дисциплины
            buttonsContainer.innerHTML = regulations.map(r => `
                <button class="regulation-discipline-btn" onclick="openRegulationPDF('${r.pdf_url}')">
                    ${r.discipline_name}
                </button>
            `).join('');
        }
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Error loading regulations:', error);
        buttonsContainer.innerHTML = '<p style="color: #ff3b30;">Ошибка загрузки регламентов</p>';
    }
}

// Закрыть модалку
function closeRegulationsModal() {
    const modal = document.getElementById('regulations-modal');
    modal.classList.remove('active');
}

// Открыть PDF регламента
function openRegulationPDF(pdfUrl) {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
}

// Закрытие по клику вне модалки
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('regulations-modal');
    const closeBtn = document.getElementById('close-regulations-modal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeRegulationsModal);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeRegulationsModal();
            }
        });
    }
});

// Экспортируем функции для использования извне
window.openRegulationsModal = openRegulationsModal;
window.closeRegulationsModal = closeRegulationsModal;
window.openRegulationPDF = openRegulationPDF;

