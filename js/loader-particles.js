// Particle effects for loader screen with floating "чубрики" images

class LoaderParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this.images = [];
        this.imagesLoaded = 0;
        this.totalImages = 4;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        // Мобильные коэффициенты
        this.isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
        this.countBoost = this.isMobile ? 2.6 : 1;
        this.speedBoost = this.isMobile ? 4.2 : 1;
        this.loadImages();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    loadImages() {
        const imagePaths = [
            'Group 2131328333.png',
            'Group 2131328334.png',
            'Group 2131328335.png',
            'Group 2131328336.png'
        ];
        
        imagePaths.forEach((path, index) => {
            const img = new Image();
            img.onload = () => {
                this.imagesLoaded++;
                // Если частицы уже созданы, привязываем изображения
                if (this.particles.length > 0 && this.imagesLoaded === this.totalImages) {
                    this.assignImagesToParticles();
                } else if (this.imagesLoaded === this.totalImages && this.particles.length === 0) {
                    // Если частицы ещё не созданы, создаём их
                    this.init();
                }
            };
            img.src = path;
            this.images.push(img);
        });
    }
    
    init() {
        // Создаём частицы (на мобиле плотнее)
        const baseDiv = this.isMobile ? 13000 : 15000;
        const particleCount = Math.floor((this.canvas.width * this.canvas.height) / baseDiv * this.countBoost);
        
        for (let i = 0; i < particleCount; i++) {
            // Размер чуть больше для лучшей видимости (7-15px)
            const size = Math.random() * 8 + 7;
            
            this.particles.push({
                img: null, // Будет установлено после загрузки
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5 * this.speedBoost,
                vy: (Math.random() - 0.5) * 0.5 * this.speedBoost,
                size: size,
                opacity: Math.random() * 0.3 + 0.4,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.01 * (this.speedBoost * 2)
            });
        }
        
        // После загрузки всех изображений привязываем их к частицам
        if (this.imagesLoaded === this.totalImages) {
            this.assignImagesToParticles();
        }
    }
    
    assignImagesToParticles() {
        // Привязываем изображения к частицам после загрузки
        this.particles.forEach(p => {
            if (!p.img) {
                const imgIndex = Math.floor(Math.random() * this.images.length);
                p.img = this.images[imgIndex];
            }
        });
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Если частицы ещё не созданы, создаём их сразу
        if (this.particles.length === 0) {
            this.init();
        }
        
        // Рисуем частицы (с изображениями или временно как точки)
        this.particles.forEach(p => {
            // Обновляем позицию (такая же логика как у точек)
            p.x += p.vx;
            p.y += p.vy;
            
            // Отражение от краёв
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
            
            // Держим в границах
            p.x = Math.max(0, Math.min(this.canvas.width, p.x));
            p.y = Math.max(0, Math.min(this.canvas.height, p.y));
            
            // Медленное вращение
            p.rotation += p.rotationSpeed;
            
            // Сохраняем состояние контекста
            this.ctx.save();
            
            // Перемещаем начало координат
            this.ctx.translate(p.x, p.y);
            
            // Поворачиваем изображение
            this.ctx.rotate(p.rotation);
            
            // Устанавливаем прозрачность
            this.ctx.globalAlpha = p.opacity;
            
            // Если изображение загружено, рисуем его, иначе временно рисуем точку
            if (p.img && p.img.complete) {
                this.ctx.drawImage(p.img, -p.size / 2, -p.size / 2, p.size, p.size);
            } else {
                // Временно рисуем точку до загрузки изображения
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(139, 90, 191, ${p.opacity})`;
                this.ctx.fill();
            }
            
            // Восстанавливаем состояние
            this.ctx.restore();
        });
        
        // Если изображения загрузились, привязываем их
        if (this.imagesLoaded === this.totalImages) {
            this.assignImagesToParticles();
        }
        
        // Линии между частицами (на мобиле больше)
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDist = this.isMobile ? 110 : 100; // меньше связей на телефоне (в лоадере)
                if (distance < maxDist) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    const alpha = (this.isMobile ? 0.16 : 0.2) * (1 - distance / maxDist);
                    this.ctx.strokeStyle = `rgba(139, 90, 191, ${alpha})`;
                    this.ctx.lineWidth = this.isMobile ? 0.8 : 1;
                    this.ctx.stroke();
                }
            }
        }
    }
    
    animate() {
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    start() {
        // Если изображения уже загружены, сразу инициализируем
        if (this.imagesLoaded === this.totalImages) {
            this.init();
        }
        this.animate();
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Инициализация для loader
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('loader-particles-canvas');
    if (canvas) {
        const loaderParticles = new LoaderParticleSystem(canvas);
        loaderParticles.start();
        
        // Остановить анимацию когда loader скрывается
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const loader = document.getElementById('loader');
                    if (loader && loader.classList.contains('hidden')) {
                        loaderParticles.stop();
                    }
                }
            });
        });
        
        const loader = document.getElementById('loader');
        if (loader) {
            observer.observe(loader, { attributes: true });
        }
    }
});

