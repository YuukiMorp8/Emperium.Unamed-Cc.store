// static/js/theme-switcher.js

// Sistema de lava para o tema vulcão
class LavaSystem {
    constructor() {
        this.lavaContainer = null;
        this.init();
    }

    init() {
        this.createLavaContainer();
        this.startLavaGenerator();
        this.startEruptions();
    }

    createLavaContainer() {
        this.lavaContainer = document.createElement('div');
        this.lavaContainer.className = 'vulcan-elements';
        this.lavaContainer.innerHTML = `
            <div class="lava-bottom"></div>
            <div class="smoke"></div>
            <div class="smoke"></div>
        `;
        document.body.appendChild(this.lavaContainer);
    }

    createLavaBubble(isEruption = false) {
        const bubble = document.createElement('div');
        bubble.classList.add('lava-bubble');

        // Tamanho e posição
        const size = isEruption ? 
            Math.random() * 25 + 15 : // Bolhas maiores nas erupções
            Math.random() * 20 + 8;   // Bolhas normais

        const left = Math.random() * 100;

        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${left}%`;
        bubble.style.top = '-50px';

        // Velocidade - mais rápidas que as bolhas de água
        const duration = isEruption ? 
            Math.random() * 2 + 1 : // Mais rápidas nas erupções
            Math.random() * 3 + 2;  // Velocidade normal

        bubble.style.animationDuration = `${duration}s`;

        // Cores da lava
        const lavaColors = [
            'rgba(255, 69, 0, 0.8)',
            'rgba(255, 100, 0, 0.7)',
            'rgba(255, 140, 0, 0.6)',
            'rgba(255, 165, 0, 0.5)'
        ];

        bubble.style.background = `radial-gradient(circle at 30% 30%, 
            ${lavaColors[Math.floor(Math.random() * lavaColors.length)]}, 
            rgba(139, 0, 0, 0.4) 70%)`;

        bubble.style.boxShadow = `
            inset 0 0 15px rgba(255, 255, 255, 0.3),
            0 0 20px rgba(255, 69, 0, 0.6)
        `;

        this.lavaContainer.appendChild(bubble);

        // Remover após animação
        setTimeout(() => {
            if (bubble.parentNode) {
                bubble.parentNode.removeChild(bubble);
            }
        }, duration * 1000);
    }

    startLavaGenerator() {
        // Bolhas de lava contínuas
        setInterval(() => {
            // Criar 3-8 bolhas por ciclo
            const bubbleCount = Math.floor(Math.random() * 6) + 3;

            for(let i = 0; i < bubbleCount; i++) {
                setTimeout(() => {
                    this.createLavaBubble();
                }, Math.random() * 500);
            }
        }, 1000);

        // Explosões intensas de lava
        setInterval(() => {
            if (Math.random() < 0.4) { // 40% de chance
                const burstCount = Math.floor(Math.random() * 20) + 15;

                for(let i = 0; i < burstCount; i++) {
                    setTimeout(() => {
                        this.createLavaBubble(true);
                    }, Math.random() * 300);
                }
            }
        }, 8000);
    }

    startEruptions() {
        // Erupções aleatórias
        setInterval(() => {
            if (Math.random() < 0.3) { // 30% de chance
                this.createEruption();
            }
        }, 6000);
    }

    createEruption() {
        const eruption = document.createElement('div');
        eruption.classList.add('eruption');

        const left = Math.random() * 80 + 10; // 10% a 90%
        eruption.style.left = `${left}%`;

        // Aleatorizar tamanho da erupção
        const width = Math.random() * 80 + 40;
        const height = Math.random() * 100 + 100;
        eruption.style.width = `${width}px`;
        eruption.style.height = `${height}px`;

        // Aleatorizar delay da animação
        eruption.style.animationDelay = `${Math.random() * 2}s`;

        this.lavaContainer.appendChild(eruption);

        // Remover após animação
        setTimeout(() => {
            if (eruption.parentNode) {
                eruption.parentNode.removeChild(eruption);
            }
        }, 4000);
    }

    destroy() {
        if (this.lavaContainer && this.lavaContainer.parentNode) {
            this.lavaContainer.parentNode.removeChild(this.lavaContainer);
        }
    }
}

// Sistema principal de temas
class ThemeManager {
    constructor() {
        this.themes = ['ocean', 'vulcan']; // ← ADICIONADO VULCAN
        this.currentTheme = this.getSavedTheme() || 'ocean';
        this.lavaSystem = null;
        this.init();
    }

    init() {
        this.loadTheme(this.currentTheme);
        this.createThemeModal();
        this.addEventListeners();
    }

    getSavedTheme() {
        return localStorage.getItem('selectedTheme');
    }

    saveTheme(theme) {
        localStorage.setItem('selectedTheme', theme);
    }

    loadTheme(themeName) {
        // Remove tema anterior
        const oldTheme = document.getElementById('dynamic-theme');
        if (oldTheme) oldTheme.remove();

        // Remove elementos de temas anteriores
        this.removePreviousThemeElements();

        // Carrega novo tema
        const link = document.createElement('link');
        link.id = 'dynamic-theme';
        link.rel = 'stylesheet';
        link.href = `/static/themes/${themeName}.css`;
        document.head.appendChild(link);

        this.currentTheme = themeName;
        this.saveTheme(themeName);
        this.updateActiveThemeCard();
        
        // Inicializar sistema específico do tema
        this.initializeThemeSystem(themeName);
    }

    removePreviousThemeElements() {
        // Remover sistema de lava se existir
        if (this.lavaSystem) {
            this.lavaSystem.destroy();
            this.lavaSystem = null;
        }
        
        // Remover elementos de temas
        const vulcanElements = document.querySelector('.vulcan-elements');
        if (vulcanElements) vulcanElements.remove();
        
        const oceanElements = document.querySelector('.ocean-elements');
        if (oceanElements) oceanElements.remove();
    }

    initializeThemeSystem(themeName) {
        switch(themeName) {
            case 'vulcan':
                this.lavaSystem = new LavaSystem();
                break;
            case 'ocean':
                // Sistema de bolhas já está inicializado no dashboard
                break;
        }
    }

    createThemeModal() {
        // Cria o modal se não existir
        if (document.getElementById('theme-modal')) return;

        const modalHTML = `
            <div class="theme-modal-overlay" id="theme-overlay"></div>
            <div class="theme-modal" id="theme-modal">
                <div class="theme-header">
                    <h3>🎨 Escolher Tema</h3>
                    <button class="theme-close">&times;</button>
                </div>
                <div class="theme-grid" id="theme-grid">
                    <!-- Temas serão injetados aqui -->
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.renderThemeCards();
    }

    renderThemeCards() {
        const themeGrid = document.getElementById('theme-grid');
        const themesData = {
            'ocean': { name: '🌊 Oceano', desc: 'Tema aquático com bolhas' },
            'vulcan': { name: '🌋 Vulcão', desc: 'Tema infernal com lava' }, // ← ADICIONADO
            'dark': { name: '🌙 Escuro', desc: 'Tema escuro elegante' },
            'light': { name: '☀️ Claro', desc: 'Tema claro e moderno' },
            'cyber': { name: '🔮 Cyber', desc: 'Tema cyberpunk futurista' }
        };

        themeGrid.innerHTML = this.themes.map(theme => {
            const data = themesData[theme] || { name: theme, desc: 'Tema personalizado' };
            return `
                <div class="theme-card ${theme === this.currentTheme ? 'active' : ''}" 
                     data-theme="${theme}">
                    <div class="theme-preview ${theme}"></div>
                    <div class="theme-name">${data.name}</div>
                    <div class="theme-desc">${data.desc}</div>
                </div>
            `;
        }).join('');
    }

    addEventListeners() {
        // Fechar modal
        document.getElementById('theme-overlay')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.querySelector('.theme-close')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });

        // Clique nos cards de tema
        document.addEventListener('click', (e) => {
            const themeCard = e.target.closest('.theme-card');
            if (themeCard) {
                const theme = themeCard.dataset.theme;
                this.loadTheme(theme);
                this.closeModal();
            }
        });
    }

    openModal() {
        document.getElementById('theme-modal').classList.add('active');
        document.getElementById('theme-overlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('theme-modal').classList.remove('active');
        document.getElementById('theme-overlay').classList.remove('active');
        document.body.style.overflow = '';
    }

    updateActiveThemeCard() {
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.remove('active');
            if (card.dataset.theme === this.currentTheme) {
                card.classList.add('active');
            }
        });
    }
}

// Inicializa quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();

    // Adiciona botão no header se não existir
    if (!document.querySelector('.btn-change-theme')) {
        const header = document.querySelector('header');
        if (header) {
            const themeBtn = document.createElement('button');
            themeBtn.className = 'btn-change-theme';
            themeBtn.innerHTML = '🎨 Mudar Tema';
            themeBtn.addEventListener('click', () => {
                window.themeManager.openModal();
            });

            // Insere antes do botão do perfil
            const profile = header.querySelector('.perfil');
            if (profile) {
                header.insertBefore(themeBtn, profile);
            } else {
                header.appendChild(themeBtn);
            }
        }
    }
});