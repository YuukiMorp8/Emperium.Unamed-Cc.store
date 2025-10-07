// static/js/theme-switcher.js - VERSÃO DEBUG

class ThemeManager {
    constructor() {
        this.themes = ['ocean', 'vulcan'];
        this.currentTheme = this.getSavedTheme() || 'ocean';
        this.activeIntervals = [];
        this.init();
    }

    init() {
        console.log('🎨 DEBUG: Sistema de Temas Iniciado');
        console.log('🎨 DEBUG: Tema salvo:', this.currentTheme);
        
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
        console.log('🔄 DEBUG: Aplicando tema:', themeName);
        
        // Limpeza
        this.clearAllIntervals();
        this.removeAllThemeElements();
        
        // Atualiza body
        document.body.className = `theme-${themeName}`;
        
        // CSS
        this.loadThemeCSS(themeName);
        
        // Estado
        this.currentTheme = themeName;
        this.saveTheme(themeName);
        
        // Elementos
        this.createThemeElements(themeName);
        this.startThemeSystem(themeName);
        this.updateThemeCards();
    }

    clearAllIntervals() {
        this.activeIntervals.forEach(interval => clearInterval(interval));
        this.activeIntervals = [];
    }

    removeAllThemeElements() {
        const selectors = ['.ocean-elements', '.vulcan-elements', '.bubble', '.lava-bubble', '.eruption'];
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => el.remove());
        });
        
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
        
        if (themeName === 'ocean') {
            container.innerHTML = `
                <div class="ocean-container">
                    ${Array.from({length: 24}, (_, i) => `<div class="bubble bubble-${i+1}"></div>`).join('')}
                </div>
                <div class="sand-bottom"></div>
                <div class="wave"></div>
                <div class="wave"></div>
            `;
        } else if (themeName === 'vulcan') {
            container.innerHTML = `
                <div class="lava-bottom"></div>
                <div class="smoke"></div>
                <div class="smoke"></div>
            `;
        }
        
        document.body.appendChild(container);
    }

    startThemeSystem(themeName) {
        if (themeName === 'vulcan') {
            console.log('🌋 DEBUG: Iniciando sistema Vulcão');
            
            const lavaInterval = setInterval(() => {
                this.createLavaBubble();
            }, 800);
            
            const eruptionInterval = setInterval(() => {
                if (Math.random() < 0.3) this.createEruption();
            }, 4000);
            
            this.activeIntervals.push(lavaInterval, eruptionInterval);
        }
    }

    createLavaBubble() {
        const container = document.querySelector('.vulcan-elements');
        if (!container) return;

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
            box-shadow: inset 0 0 15px rgba(255,255,255,0.3), 0 0 20px rgba(255,69,0,0.6);
        `;
        
        container.appendChild(bubble);
        setTimeout(() => bubble.remove(), duration * 1000);
    }

    createEruption() {
        const container = document.querySelector('.vulcan-elements');
        if (!container) return;

        const eruption = document.createElement('div');
        eruption.className = 'eruption';
        
        const left = Math.random() * 80 + 10;
        const width = Math.random() * 60 + 40;
        
        eruption.style.cssText = `
            left: ${left}%;
            width: ${width}px;
            animation-delay: ${Math.random() * 2}s;
        `;
        
        container.appendChild(eruption);
        setTimeout(() => eruption.remove(), 4000);
    }

    setupThemeButton() {
        console.log('🔘 DEBUG: Configurando botão de tema');
        
        const header = document.querySelector('header');
        if (!header) {
            console.log('❌ DEBUG: Header não encontrado');
            return;
        }

        // Remove botão existente se houver
        const existingBtn = document.querySelector('.btn-change-theme');
        if (existingBtn) existingBtn.remove();

        const themeBtn = document.createElement('button');
        themeBtn.className = 'btn-change-theme';
        themeBtn.id = 'theme-button'; // ID para debug
        themeBtn.innerHTML = '🎨 Mudar Tema';
        themeBtn.onclick = (e) => {
            console.log('🖱️ DEBUG: Botão clicado', e);
            this.openModal();
        };

        const headerButtons = header.querySelector('.header-buttons');
        if (headerButtons) {
            headerButtons.insertBefore(themeBtn, headerButtons.firstChild);
            console.log('✅ DEBUG: Botão adicionado no header-buttons');
        } else {
            header.appendChild(themeBtn);
            console.log('✅ DEBUG: Botão adicionado diretamente no header');
        }
    }

    setupThemeModal() {
        console.log('📦 DEBUG: Configurando modal de temas');
        
        // Verifica se o modal já existe no HTML
        const existingModal = document.getElementById('theme-modal');
        const existingOverlay = document.getElementById('theme-overlay');
        
        if (existingModal && existingOverlay) {
            console.log('✅ DEBUG: Modal já existe no HTML');
            this.setupModalListeners();
            return;
        }

        console.log('❌ DEBUG: Modal não encontrado, criando...');
        
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
        console.log('✅ DEBUG: Modal criado com sucesso');
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
        console.log('🎯 DEBUG: Configurando listeners do modal');
        
        const overlay = document.getElementById('theme-overlay');
        const closeBtn = document.querySelector('.theme-close');
        const themeGrid = document.getElementById('theme-grid');

        if (!overlay) {
            console.log('❌ DEBUG: Overlay não encontrado');
            return;
        }
        if (!closeBtn) {
            console.log('❌ DEBUG: Botão fechar não encontrado');
            return;
        }
        if (!themeGrid) {
            console.log('❌ DEBUG: Grid de temas não encontrado');
            return;
        }

        // Overlay
        overlay.addEventListener('click', (e) => {
            console.log('🎯 DEBUG: Overlay clicado', e);
            this.closeModal();
        });

        // Botão fechar
        closeBtn.addEventListener('click', (e) => {
            console.log('🎯 DEBUG: Botão fechar clicado', e);
            this.closeModal();
        });

        // Cards de tema
        themeGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.theme-card');
            if (card) {
                const theme = card.dataset.theme;
                console.log('🎯 DEBUG: Card clicado', theme);
                this.applyTheme(theme);
                this.closeModal();
            }
        });

        // Tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                console.log('🎯 DEBUG: Tecla ESC pressionada');
                this.closeModal();
            }
        });

        console.log('✅ DEBUG: Listeners configurados com sucesso');
    }

    openModal() {
        console.log('📱 DEBUG: Abrindo modal');
        
        const modal = document.getElementById('theme-modal');
        const overlay = document.getElementById('theme-overlay');
        
        if (!modal || !overlay) {
            console.log('❌ DEBUG: Modal ou overlay não encontrados para abrir');
            return;
        }

        modal.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        console.log('✅ DEBUG: Modal aberto com sucesso');
    }

    closeModal() {
        console.log('📱 DEBUG: Fechando modal');
        
        const modal = document.getElementById('theme-modal');
        const overlay = document.getElementById('theme-overlay');
        
        if (modal) modal.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        console.log('✅ DEBUG: Modal fechado');
    }

    updateThemeCards() {
        const cards = document.querySelectorAll('.theme-card');
        cards.forEach(card => {
            card.classList.remove('active');
            if (card.dataset.theme === this.currentTheme) {
                card.classList.add('active');
            }
        });
    }
}

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DEBUG: DOM Carregado - Iniciando ThemeManager');
    window.themeManager = new ThemeManager();
});

// Funções de debug para console
window.debugTheme = function() {
    console.log('🔍 DEBUG COMPLETO:');
    console.log('- Tema atual:', window.themeManager?.currentTheme);
    console.log('- Botão existe:', !!document.querySelector('.btn-change-theme'));
    console.log('- Modal existe:', !!document.getElementById('theme-modal'));
    console.log('- Overlay existe:', !!document.getElementById('theme-overlay'));
    console.log('- Cards existem:', document.querySelectorAll('.theme-card').length);
    console.log('- Intervals ativos:', window.themeManager?.activeIntervals.length);
};