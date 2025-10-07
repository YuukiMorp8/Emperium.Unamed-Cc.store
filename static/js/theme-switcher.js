// static/js/theme-switcher.js
class ThemeManager {
    constructor() {
        this.themes = ['ocean'];
        this.currentTheme = this.getSavedTheme() || 'ocean';
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

        // Carrega novo tema
        const link = document.createElement('link');
        link.id = 'dynamic-theme';
        link.rel = 'stylesheet';
        link.href = `/static/themes/${themeName}.css`;
        document.head.appendChild(link);

        this.currentTheme = themeName;
        this.saveTheme(themeName);
        this.updateActiveThemeCard();
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