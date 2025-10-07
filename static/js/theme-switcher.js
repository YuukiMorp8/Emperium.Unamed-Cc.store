// static/js/theme-switcher.js - SISTEMA FINAL SEM CONFLITOS

class ThemeManager {
    constructor() {
        this.themes = ['ocean', 'vulcan'];
        this.currentTheme = this.getSavedTheme() || 'ocean';
        this.activeIntervals = [];
        this.init();
    }

    init() {
        console.log('🎨 Iniciando Sistema de Temas:', this.currentTheme);
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
        console.log('🔄 Aplicando tema:', themeName);
        
        // 1. PARA todos os intervals e timeouts anteriores
        this.clearAllIntervals();
        
        // 2. REMOVE completamente todos os elementos de temas
        this.removeAllThemeElements();
        
        // 3. Atualiza classe do body (IMPORTANTE: remove classes antigas)
        document.body.className = '';
        document.body.classList.add(`theme-${themeName}`);
        
        // 4. Remove CSS anterior e carrega novo
        this.loadThemeCSS(themeName);
        
        // 5. Salva e atualiza estado
        this.currentTheme = themeName;
        this.saveTheme(themeName);
        
        // 6. Cria elementos específicos do tema
        this.createThemeElements(themeName);
        
        // 7. Inicia sistema dinâmico do tema (se necessário)
        this.startThemeSystem(themeName);
        
        // 8. Atualiza UI
        this.updateThemeCards();
        
        console.log('✅ Tema aplicado com sucesso:', themeName);
    }

    clearAllIntervals() {
        this.activeIntervals.forEach(interval => clearInterval(interval));
        this.activeIntervals = [];
    }

    removeAllThemeElements() {
        // Remove TODOS os elementos possíveis de temas
        const selectors = [
            '.ocean-elements', 
            '.vulcan-elements', 
            '.theme-elements',
            '.bubble',
            '.lava-bubble', 
            '.eruption',
            '.ocean-container',
            '.lava-bottom',
            '.sand-bottom',
            '.wave',
            '.smoke'
        ];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });
        
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
        container.className = `${themeName}-elements`;
        
        switch(themeName) {
            case 'ocean':
                container.innerHTML = this.createOceanElements();
                break;
            case 'vulcan':
                container.innerHTML = this.createVulcanElements();
                break;
        }
        
        document.body.appendChild(container);
    }

    createOceanElements() {
        return `
            <div class="ocean-container">
                ${this.generateBubbles()}
            </div>
            <div class="sand-bottom"></div>
            <div class="wave"></div>
            <div class="wave"></div>
        `;
    }

    createVulcanElements() {
        return `
            <div class="lava-bottom"></div>
            <div class="smoke"></div>
            <div class="smoke"></div>
        `;
    }

    generateBubbles() {
        let bubbles = '';
        for (let i = 1; i <= 24; i++) {
            bubbles += `<div class="bubble bubble-${i}"></div>`;
        }
        return bubbles;
    }

    startThemeSystem(themeName) {
        switch(themeName) {
            case 'ocean':
                // Ocean usa apenas CSS - nada para fazer aqui
                break;
            case 'vulcan':
                this.startVulcanSystem();
                break;
        }
    }

    startVulcanSystem() {
        console.log('🌋 Iniciando sistema Vulcão...');
        
        // Bolhas de lava
        const lavaInterval = setInterval(() => {
            this.createLavaBubble();
        }, 800);
        
        // Erupções
        const eruptionInterval = setInterval(() => {
            if (Math.random() < 0.3) this.createEruption();
        }, 4000);
        
        this.activeIntervals.push(lavaInterval, eruptionInterval);
    }

    createLavaBubble() {
        const vulcanElements = document.querySelector('.vulcan-elements');
        if (!vulcanElements) return;

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
            box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 69, 0, 0.6);
        `;
        
        vulcanElements.appendChild(bubble);
        
        // Remove após animação
        setTimeout(() => {
            if (bubble.parentNode) {
                bubble.remove();
            }
        }, duration * 1000);
    }

    createEruption() {
        const vulcanElements = document.querySelector('.vulcan-elements');
        if (!vulcanElements) return;

        const eruption = document.createElement('div');
        eruption.className = 'eruption';
        
        const left = Math.random() * 80 + 10;
        const width = Math.random() * 60 + 40;
        
        eruption.style.cssText = `
            left: ${left}%;
            width: ${width}px;
            animation-delay: ${Math.random() * 2}s;
        `;
        
        vulcanElements.appendChild(eruption);
        
        // Remove após animação
        setTimeout(() => {
            if (eruption.parentNode) {
                eruption.remove();
            }
        }, 4000);
    }

    setupThemeButton() {
        const header = document.querySelector('header');
        if (!header) return;

        // Verifica se o botão já existe
        if (document.querySelector('.btn-change-theme')) return;

        const themeBtn = document.createElement('button');
        themeBtn.className = 'btn-change-theme';
        themeBtn.innerHTML = '🎨 Mudar Tema';
        themeBtn.onclick = () => this.openModal();

        // Insere no header
        const headerButtons = header.querySelector('.header-buttons');
        if (headerButtons) {
            headerButtons.insertBefore(themeBtn, headerButtons.firstChild);
        } else {
            // Cria container se não existir
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'header-buttons';
            buttonsContainer.appendChild(themeBtn);
            
            const profile = header.querySelector('.perfil');
            if (profile) {
                buttonsContainer.appendChild(profile);
            }
            
            header.appendChild(buttonsContainer);
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
        // Overlay
        document.getElementById('theme-overlay').addEventListener('click', () => {
            this.closeModal();
        });

        // Botão fechar
        document.querySelector('.theme-close').addEventListener('click', () => {
            this.closeModal();
        });

        // Tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });

        // Clique nos cards de tema
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

// INICIALIZAÇÃO - Executa em todas as páginas
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Função global para debug
window.debugTheme = function() {
    console.log('🔍 Debug Temas:');
    console.log('- Tema atual:', window.themeManager?.currentTheme);
    console.log('- Elementos Ocean:', document.querySelectorAll('.ocean-elements, .bubble').length);
    console.log('- Elementos Vulcan:', document.querySelectorAll('.vulcan-elements, .lava-bubble').length);
    console.log('- Intervals ativos:', window.themeManager?.activeIntervals.length);
};