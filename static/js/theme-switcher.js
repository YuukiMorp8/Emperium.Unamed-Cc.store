// =============================
// SISTEMA GLOBAL DE TEMAS
// =============================
class ThemeManager {
    constructor() {
        this.themes = ['ocean', 'vulcan'];
        this.currentTheme = this.getSavedTheme() || 'ocean';
        this.themeLinkId = 'dynamic-theme';
        this.init();
    }

    // --- Inicialização ---
    init() {
        this.loadTheme(this.currentTheme);
        this.renderThemeCards();
        this.addEventListeners();
        this.listenForExternalChanges(); // <--- Sincronização global
    }

    // --- Carregar / Salvar ---
    getSavedTheme() {
        return localStorage.getItem('selectedTheme');
    }

    saveTheme(theme) {
        localStorage.setItem('selectedTheme', theme);
    }

    // --- Carregar CSS de um tema ---
    loadTheme(themeName) {
        if (!themeName) return;

        console.log('Carregando tema global:', themeName);

        // Remover tema antigo
        const oldLink = document.getElementById(this.themeLinkId);
        if (oldLink) oldLink.remove();

        // Remover elementos visuais de temas anteriores
        this.removePreviousThemeElements();

        // Atualizar classe do body
        document.body.className = `theme-${themeName}`;

        // Criar e adicionar o novo CSS
        const link = document.createElement('link');
        link.id = this.themeLinkId;
        link.rel = 'stylesheet';
        link.href = `/static/themes/${themeName}.css`;
        document.head.appendChild(link);

        // Atualizar tema atual e salvar
        this.currentTheme = themeName;
        this.saveTheme(themeName);

        // Atualizar UI do seletor
        this.updateActiveThemeCard();

        // Enviar evento global (para SPAs / componentes)
        window.dispatchEvent(new CustomEvent('themechange', { detail: themeName }));
    }

    // --- Remover elementos de temas antigos ---
    removePreviousThemeElements() {
        document.querySelectorAll('.vulcan-elements, .ocean-elements').forEach(el => el.remove());
        document.querySelectorAll('.bubble').forEach(el => el.remove()); // limpa bolhas antigas
    }

    // --- Renderização das opções de tema ---
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

    // --- Eventos locais (botões / modal) ---
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

    // --- Sincronização entre abas/páginas ---
    listenForExternalChanges() {
        window.addEventListener('storage', (event) => {
            if (event.key === 'selectedTheme' && event.newValue && event.newValue !== this.currentTheme) {
                console.log('🔄 Tema alterado em outra página:', event.newValue);
                this.loadTheme(event.newValue);
            }
        });
    }

    // --- Modal ---
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

    // --- Atualizar destaque do tema ativo ---
    updateActiveThemeCard() {
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.toggle('active', card.dataset.theme === this.currentTheme);
        });
    }
}

// --- Inicializar globalmente ---
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});