// Particle effects for animated background with floating decorative images

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.decorativeImages = [];
        this.animationId = null;
        this.images = [];
        this.imagesLoaded = 0;
        this.totalImages = 4;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
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
                if (this.imagesLoaded === this.totalImages) {
                    this.initDecorativeImages();
                }
            };
            img.src = path;
            this.images.push(img);
        });
    }
    
    init() {
        const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 15000);
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2 + 1,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                color: Math.random() > 0.5 ? 'rgba(139, 90, 191, 0.5)' : 'rgba(107, 45, 143, 0.3)'
            });
        }
    }
    
    initDecorativeImages() {
        // Добавляем только несколько изображений как декоративные элементы
        const imageCount = Math.floor((this.canvas.width * this.canvas.height) / 500000);
        
        for (let i = 0; i < imageCount; i++) {
            const imgIndex = Math.floor(Math.random() * this.images.length);
            const img = this.images[imgIndex];
            
            this.decorativeImages.push({
                img: img,
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.15, // Очень медленное движение
                vy: (Math.random() - 0.5) * 0.15,
                size: Math.random() * 60 + 80, // Крупные, но не слишком
                opacity: Math.random() * 0.15 + 0.08, // Очень прозрачные
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.005 // Очень медленное вращение
            });
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем обычные частицы (точки)
        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
            
            // Обновляем позицию
            p.x += p.vx;
            p.y += p.vy;
            
            // Отражение от краёв
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
            
            // Держим в границах
            p.x = Math.max(0, Math.min(this.canvas.width, p.x));
            p.y = Math.max(0, Math.min(this.canvas.height, p.y));
        });
        
        // Рисуем линии между близкими частицами
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = `rgba(139, 90, 191, ${0.2 * (1 - distance / 100)})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }
        
        // Рисуем декоративные изображения (очень прозрачные и плавные)
        if (this.imagesLoaded === this.totalImages) {
            this.decorativeImages.forEach(dImg => {
                // Обновляем позицию
                dImg.x += dImg.vx;
                dImg.y += dImg.vy;
                dImg.rotation += dImg.rotationSpeed;
                
                // Плавное отражение от краёв
                if (dImg.x < -dImg.size || dImg.x > this.canvas.width + dImg.size) {
                    dImg.vx *= -1;
                    dImg.x = Math.max(-dImg.size, Math.min(this.canvas.width + dImg.size, dImg.x));
                }
                if (dImg.y < -dImg.size || dImg.y > this.canvas.height + dImg.size) {
                    dImg.vy *= -1;
                    dImg.y = Math.max(-dImg.size, Math.min(this.canvas.height + dImg.size, dImg.y));
                }
                
                // Сохраняем состояние контекста
                this.ctx.save();
                
                // Перемещаем начало координат
                this.ctx.translate(dImg.x, dImg.y);
                
                // Очень медленное вращение
                this.ctx.rotate(dImg.rotation);
                
                // Очень низкая прозрачность - едва заметные
                this.ctx.globalAlpha = dImg.opacity;
                
                // Рисуем изображение
                this.ctx.drawImage(dImg.img, -dImg.size / 2, -dImg.size / 2, dImg.size, dImg.size);
                
                // Восстанавливаем состояние
                this.ctx.restore();
            });
        }
    }
    
    animate() {
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    start() {
        this.init();
        this.animate();
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('particles-canvas');
    if (canvas) {
        const particles = new ParticleSystem(canvas);
        particles.start();
    }
});
