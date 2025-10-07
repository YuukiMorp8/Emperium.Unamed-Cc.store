// static/js/theme-switcher.js - Sistema CORRIGIDO sem conflitos

class SimpleThemeManager {
    constructor() {
        this.themes = ['ocean', 'vulcan'];
        this.currentTheme = this.getSavedTheme() || 'ocean';
        this.activeIntervals = [];
        this.init();
    }

    init() {
        console.log('Iniciando tema:', this.currentTheme);
        this.applyTheme(this.currentTheme);
        this.setupThemeButton();
        this.setupThemeModal();
    }

    getSavedTheme() {
        return localStorage.getItem('appTheme');
    }

    saveTheme(theme) {
        localStorage.setItem('appTheme', theme);
    }

    applyTheme(themeName) {
        console.log('Aplicando tema:', themeName);
        
        // PARA TODOS os intervals anteriores
        this.clearAllIntervals();
        
        // REMOVE completamente elementos anteriores
        this.removeAllThemeElements();
        
        // Atualiza classe do body
        document.body.className = '';
        document.body.classList.add(`theme-${themeName}`);
        
        // Remove CSS anterior e carrega novo
        this.loadThemeCSS(themeName);
        
        // Salva e atualiza estado
        this.currentTheme = themeName;
        this.saveTheme(themeName);
        
        // Cria elementos específicos do tema
        this.createThemeElements(themeName);
        
        // Atualiza UI
        this.updateThemeCards();
    }

    clearAllIntervals() {
        this.activeIntervals.forEach(interval => clearInterval(interval));
        this.activeIntervals = [];
    }

    removeAllThemeElements() {
        // Remove TODOS os elementos de temas
        const elementsToRemove = document.querySelectorAll(
            '.ocean-elements, .vulcan-elements, .theme-elements, .bubble, .lava-bubble, .eruption'
        );
        elementsToRemove.forEach(el => el.remove());
        
        // Remove CSS dinâmico
        const oldCSS = document.getElementById('dynamic-theme-css');
        if (oldCSS) oldCSS.remove();
    }

    loadThemeCSS(themeName) {
        const link = document.createElement('link');
        link.id = 'dynamic-theme-css';
        link.rel = 'stylesheet';
        link.href = `/static/themes/${themeName}.css`;
        document.head.appendChild(link);
    }

    createThemeElements(themeName) {
        const container = document.createElement('div');
        container.className = 'theme-elements';
        
        switch(themeName) {
            case 'ocean':
                container.innerHTML = this.createOceanElements();
                this.startOceanSystem();
                break;
            case 'vulcan':
                container.innerHTML = this.createVulcanElements();
                this.startVulcanSystem();
                break;
        }
        
        document.body.appendChild(container);
    }

    createOceanElements() {
        return `
            <div class="ocean-elements">
                <div class="ocean-container">
                    ${this.generateBubbles()}
                </div>
                <div class="sand-bottom"></div>
                <div class="wave"></div>
                <div class="wave"></div>
            </div>
        `;
    }

    createVulcanElements() {
        return `
            <div class="vulcan-elements">
                <div class="lava-bottom"></div>
                <div class="smoke"></div>
                <div class="smoke"></div>
            </div>
        `;
    }

    generateBubbles() {
        let bubbles = '';
        for (let i = 1; i <= 24; i++) {
            bubbles += `<div class="bubble bubble-${i}"></div>`;
        }
        return bubbles;
    }

    startOceanSystem() {
        // Sistema de bolhas do ocean (se precisar de JavaScript)
        console.log('Sistema Ocean iniciado');
    }

    startVulcanSystem() {
        // Sistema de lava do vulcão
        const lavaInterval = setInterval(() => {
            this.createLavaBubble();
        }, 800);
        
        const eruptionInterval = setInterval(() => {
            if (Math.random() < 0.3) this.createEruption();
        }, 4000);
        
        this.activeIntervals.push(lavaInterval, eruptionInterval);
    }

    createLavaBubble() {
        const bubble = document.createElement('div');
        bubble.className = 'lava-bubble';
        
        const size = Math.random() * 20 + 10;
        const left = Math.random() * 100;
        const duration = Math.random() * 3 + 2;
        
        bubble.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${left}%;
            top: -50px;
            animation-duration: ${duration}s;
            background: radial-gradient(circle, rgba(255,69,0,0.8) 0%, rgba(139,0,0,0.4) 70%);
        `;
        
        document.querySelector('.vulcan-elements')?.appendChild(bubble);
        
        setTimeout(() => bubble.remove(), duration * 1000);
    }

    createEruption() {
        const eruption = document.createElement('div');
        eruption.className = 'eruption';
        
        const left = Math.random() * 80 + 10;
        const width = Math.random() * 60 + 40;
        
        eruption.style.cssText = `
            left: ${left}%;
            width: ${width}px;
            animation-delay: ${Math.random() * 2}s;
        `;
        
        document.querySelector('.vulcan-elements')?.appendChild(eruption);
        
        setTimeout(() => eruption.remove(), 4000);
    }

    setupThemeButton() {
        const header = document.querySelector('header');
        if (!header || document.querySelector('.btn-change-theme')) return;

        const themeBtn = document.createElement('button');
        themeBtn.className = 'btn-change-theme';
        themeBtn.innerHTML = '🎨 Mudar Tema';
        themeBtn.onclick = () => this.openModal();

        const headerButtons = header.querySelector('.header-buttons');
        if (headerButtons) {
            headerButtons.insertBefore(themeBtn, headerButtons.firstChild);
        }
    }

    setupThemeModal() {
        if (document.getElementById('theme-modal')) return;

        const modalHTML = `
            <div class="theme-modal-overlay" id="theme-overlay"></div>
            <div class="theme-modal" id="theme-modal">
                <div class="theme-header">
                    <h3>🎨 Escolher Tema</h3>
                    <button class="theme-close">&times;</button>
                </div>
                <div class="theme-grid" id="theme-grid">
                    ${this.renderThemeCards()}
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.setupModalListeners();
    }

    renderThemeCards() {
        const themesData = {
            'ocean': { name: '🌊 Oceano', desc: 'Tema aquático com bolhas' },
            'vulcan': { name: '🌋 Vulcão', desc: 'Tema infernal com lava' }
        };

        return this.themes.map(theme => {
            const data = themesData[theme];
            const active = theme === this.currentTheme ? 'active' : '';
            return `
                <div class="theme-card ${active}" data-theme="${theme}">
                    <div class="theme-preview ${theme}"></div>
                    <div class="theme-name">${data.name}</div>
                    <div class="theme-desc">${data.desc}</div>
                </div>
            `;
        }).join('');
    }

    setupModalListeners() {
        // Overlay e botão fechar
        document.getElementById('theme-overlay').onclick = () => this.closeModal();
        document.querySelector('.theme-close').onclick = () => this.closeModal();

        // Tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });

        // Clique nos cards
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.theme-card');
            if (card) {
                const theme = card.dataset.theme;
                this.applyTheme(theme);
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

    updateThemeCards() {
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.remove('active');
            if (card.dataset.theme === this.currentTheme) {
                card.classList.add('active');
            }
        });
    }
}

// Inicialização SIMPLES
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new SimpleThemeManager();
});