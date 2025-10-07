// Sistema principal de temas
class ThemeManager {
    constructor() {
        this.themes = ['ocean', 'vulcan'];
        this.currentTheme = this.getSavedTheme() || 'ocean';
        this.init();
    }

    init() {
        this.loadTheme(this.currentTheme);
        this.renderThemeCards();
        this.addEventListeners();
    }

    getSavedTheme() {
        return localStorage.getItem('selectedTheme');
    }

    saveTheme(theme) {
        localStorage.setItem('selectedTheme', theme);
    }

    loadTheme(themeName) {
        console.log('Carregando tema:', themeName);

        // Remove tema anterior
        const oldTheme = document.getElementById('dynamic-theme');
        if (oldTheme) oldTheme.remove();

        // Remove elementos antigos do body
        this.removePreviousThemeElements();

        // Atualiza a classe do body
        document.body.className = `theme-${themeName}`;

        // Carrega novo CSS
        const link = document.createElement('link');
        link.id = 'dynamic-theme';
        link.rel = 'stylesheet';
        link.href = `/static/themes/${themeName}.css`;
        document.head.appendChild(link);

        this.currentTheme = themeName;
        this.saveTheme(themeName);
        this.updateActiveThemeCard();
    }

    removePreviousThemeElements() {
        document.querySelectorAll('.vulcan-elements, .ocean-elements').forEach(el => el.remove());
    }

    renderThemeCards() {
        const themeGrid = document.getElementById('theme-grid');
        if (!themeGrid) return;

        const themesData = {
            'ocean': { name: '🌊 Oceano', desc: 'Tema aquático com bolhas' },
            'vulcan': { name: '🌋 Vulcão', desc: 'Tema infernal com lava' }
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
        const themeBtn = document.getElementById('btn-change-theme');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.openModal());
        }

        document.getElementById('theme-overlay')?.addEventListener('click', () => this.closeModal());
        document.querySelector('.theme-close')?.addEventListener('click', () => this.closeModal());
        document.addEventListener('keydown', e => { if (e.key === 'Escape') this.closeModal(); });

        document.addEventListener('click', e => {
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
            card.classList.toggle('active', card.dataset.theme === this.currentTheme);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});