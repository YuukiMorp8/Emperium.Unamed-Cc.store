// static/themes/ocean.js - Sistema de bolhas específico do tema Ocean

class OceanBubbleSystem {
    constructor() {
        this.oceanContainer = null;
        this.bubbleIntervals = [];
        this.init();
    }

    init() {
        this.createOceanContainer();
        this.startBubbleSystem();
    }

    createOceanContainer() {
        this.oceanContainer = document.createElement('div');
        this.oceanContainer.className = 'ocean-elements';
        this.oceanContainer.innerHTML = `
            <div class="ocean-container" id="ocean"></div>
            <div class="sand-bottom"></div>
            <div class="wave"></div>
            <div class="wave"></div>
        `;
        document.body.appendChild(this.oceanContainer);
    }

    createBubbles() {
        const oceanContainer = document.getElementById('ocean');
        if (!oceanContainer) return;
        
        const colors = [
            'rgba(255,255,255,0.25)', 
            'rgba(255,255,255,0.20)', 
            'rgba(255,255,255,0.30)',
            'rgba(255,255,255,0.18)',
            'rgba(255,255,255,0.22)'
        ];

        // Criar bolhas iniciais
        for(let i = 0; i < 30; i++){
            this.createSingleBubble(colors, false);
        }
    }

    createSingleBubble(colors, isBurst = false) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.style.left = Math.random() * 100 + 'vw';

        const size = isBurst ? 
            Math.random() * 30 + 20 : // Bolhas maiores nas rajadas
            Math.random() * 25 + 15;  // Bolhas normais

        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';

        const duration = isBurst ? 
            (2 + Math.random() * 4) : // Mais rápidas nas rajadas
            (4 + Math.random() * 6);  // Velocidade normal

        bubble.style.animationDuration = duration + 's';
        bubble.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        if (!isBurst) {
            bubble.style.animationDelay = (Math.random() * 3) + 's';
        }

        const oceanContainer = document.getElementById('ocean');
        if (oceanContainer) {
            oceanContainer.appendChild(bubble);
        }

        // Remover após animação
        setTimeout(() => {
            if (bubble.parentNode) {
                bubble.parentNode.removeChild(bubble);
            }
        }, duration * 1000);
    }

    startBubbleSystem() {
        const colors = [
            'rgba(255,255,255,0.25)', 
            'rgba(255,255,255,0.20)', 
            'rgba(255,255,255,0.30)'
        ];

        // Bolhas iniciais
        this.createBubbles();

        // Bolhas contínuas
        const continuousInterval = setInterval(() => {
            const bubbleCount = Math.floor(Math.random() * 9) + 10;
            for(let i = 0; i < bubbleCount; i++){
                this.createSingleBubble(colors, false);
            }
        }, 1500);
        this.bubbleIntervals.push(continuousInterval);

        // Rajadas intensas
        const burstInterval = setInterval(() => {
            if (Math.random() < 0.6) {
                const burstCount = Math.floor(Math.random() * 31) + 50;
                for(let i = 0; i < burstCount; i++){
                    setTimeout(() => {
                        this.createSingleBubble(colors, true);
                    }, Math.random() * 600);
                }
            }
        }, 12000);
        this.bubbleIntervals.push(burstInterval);

        // Limpeza periódica
        const cleanupInterval = setInterval(() => {
            const bubbles = document.querySelectorAll('.bubble');
            if (bubbles.length > 200) {
                for (let i = 0; i < 80; i++) {
                    if (bubbles[i]) {
                        bubbles[i].remove();
                    }
                }
            }
        }, 15000);
        this.bubbleIntervals.push(cleanupInterval);
    }

    destroy() {
        // Parar todos os intervals
        this.bubbleIntervals.forEach(interval => clearInterval(interval));
        this.bubbleIntervals = [];

        // Remover container
        if (this.oceanContainer && this.oceanContainer.parentNode) {
            this.oceanContainer.parentNode.removeChild(this.oceanContainer);
        }
    }
}

// Inicializar apenas se for o tema ocean
if (document.body.classList.contains('theme-ocean')) {
    window.oceanBubbleSystem = new OceanBubbleSystem();
}