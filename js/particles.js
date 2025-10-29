// Animated background with floating "чубрики" images

class ParticleSystem {
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
                    this.init();
                }
            };
            img.src = path;
            this.images.push(img);
        });
    }
    
    init() {
        const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 80000);
        
        for (let i = 0; i < particleCount; i++) {
            const imgIndex = Math.floor(Math.random() * this.images.length);
            const img = this.images[imgIndex];
            
            // Радиус вращения вокруг центра
            const radius = Math.random() * Math.min(this.canvas.width, this.canvas.height) * 0.3 + 100;
            const angle = Math.random() * Math.PI * 2;
            
            // Размер изображения
            const size = Math.random() * 40 + 30;
            
            this.particles.push({
                img: img,
                centerX: Math.random() * this.canvas.width,
                centerY: Math.random() * this.canvas.height,
                radius: radius,
                angle: angle,
                speed: (Math.random() * 0.5 + 0.3) * (Math.random() > 0.5 ? 1 : -1), // Скорость вращения
                size: size,
                opacity: Math.random() * 0.4 + 0.3,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02
            });
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.imagesLoaded < this.totalImages) {
            return; // Ждём загрузки всех изображений
        }
        
        this.particles.forEach(p => {
            // Обновляем угол для кругового движения
            p.angle += p.speed * 0.01;
            
            // Вычисляем позицию на круге
            p.x = p.centerX + Math.cos(p.angle) * p.radius;
            p.y = p.centerY + Math.sin(p.angle) * p.radius;
            
            // Обновляем вращение изображения
            p.rotation += p.rotationSpeed;
            
            // Если выходит за границы, перемещаем центр
            if (p.x < -100 || p.x > this.canvas.width + 100 || 
                p.y < -100 || p.y > this.canvas.height + 100) {
                p.centerX = Math.random() * this.canvas.width;
                p.centerY = Math.random() * this.canvas.height;
                p.angle = Math.random() * Math.PI * 2;
            }
            
            // Сохраняем состояние контекста
            this.ctx.save();
            
            // Перемещаем начало координат в центр изображения
            this.ctx.translate(p.x, p.y);
            
            // Поворачиваем изображение
            this.ctx.rotate(p.rotation);
            
            // Устанавливаем прозрачность
            this.ctx.globalAlpha = p.opacity;
            
            // Рисуем изображение
            this.ctx.drawImage(p.img, -p.size / 2, -p.size / 2, p.size, p.size);
            
            // Восстанавливаем состояние контекста
            this.ctx.restore();
        });
    }
    
    animate() {
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    start() {
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

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('particles-canvas');
    if (canvas) {
        const particles = new ParticleSystem(canvas);
        particles.start();
    }
});
