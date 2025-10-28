// Particle effects for animated background

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
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
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
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

