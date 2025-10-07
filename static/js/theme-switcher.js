// static/js/theme-switcher.js - VERSÃO FINAL QUE FUNCIONA

console.log('🎨 theme-switcher.js CARREGADO!');

class ThemeManager {
    constructor() {
        this.themes = ['ocean', 'vulcan'];
        this.currentTheme = localStorage.getItem('appTheme') || 'ocean';
        this.init();
    }

    init() {
        console.log('🚀 Iniciando ThemeManager com tema:', this.currentTheme);
        
        // Aplica o tema salvo
        this.applyTheme(this.currentTheme);
        
        // Configura os eventos
        this.setupEventListeners();
        
        // Atualiza os cards do modal
        this.updateThemeCards();
        
        console.log('✅ ThemeManager iniciado com sucesso!');
    }

    applyTheme(themeName) {
        console.log('🎯 Aplicando tema:', themeName);
        
        // Remove classes antigas
        document.body.classList.remove('theme-ocean', 'theme-vulcan');
        
        // Adiciona nova classe
        document.body.classList.add(`theme-${themeName}`);
        
        // Salva preferência
        this.currentTheme = themeName;
        localStorage.setItem('appTheme', themeName);
        
        console.log('✅ Tema aplicado! Body classes:', document.body.className);
    }

    setupEventListeners() {
        console.log('🔗 Configurando event listeners...');
        
        // Botão "Mudar Tema"
        const themeBtn = document.getElementById('btn-change-theme');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                console.log('🖱️ Botão "Mudar Tema" clicado!');
                this.openModal();
            });
        } else {
            console.log('❌ Botão "Mudar Tema" não encontrado!');
        }

        // Overlay do modal
        const overlay = document.getElementById('theme-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                console.log('🖱️ Overlay clicado!');
                this.closeModal();
            });
        }

        // Botão fechar do modal
        const closeBtn = document.querySelector('.theme-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log('🖱️ Botão fechar clicado!');
                this.closeModal();
            });
        }

        // Cards de tema
        const themeGrid = document.getElementById('theme-grid');
        if (themeGrid) {
            themeGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.theme-card');
                if (card) {
                    const theme = card.getAttribute('data-theme');
                    console.log('🖱️ Card clicado:', theme);
                    this.applyTheme(theme);
                    this.closeModal();
                }
            });
        }

        // Tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                console.log('⌨️ Tecla ESC pressionada!');
                this.closeModal();
            }
        });

        console.log('✅ Event listeners configurados!');
    }

    updateThemeCards() {
        console.log('🔄 Atualizando cards do tema...');
        
        const cards = document.querySelectorAll('.theme-card');
        cards.forEach(card => {
            const theme = card.getAttribute('data-theme');
            if (theme === this.currentTheme) {
                card.classList.add('active');
                console.log(`✅ Card ${theme} marcado como ativo`);
            } else {
                card.classList.remove('active');
            }
        });
    }

    openModal() {
        console.log('📱 Abrindo modal de temas...');
        
        const modal = document.getElementById('theme-modal');
        const overlay = document.getElementById('theme-overlay');
        
        if (modal && overlay) {
            modal.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('✅ Modal aberto!');
        } else {
            console.log('❌ Modal ou overlay não encontrados!');
        }
    }

    closeModal() {
        console.log('📱 Fechando modal de temas...');
        
        const modal = document.getElementById('theme-modal');
        const overlay = document.getElementById('theme-overlay');
        
        if (modal) modal.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        console.log('✅ Modal fechado!');
    }
}

// INICIALIZAÇÃO - Executa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM completamente carregado!');
    window.themeManager = new ThemeManager();
});

// Função de debug para testar no console
window.debugTema = function() {
    console.log('🔍 DEBUG DO SISTEMA DE TEMAS:');
    console.log('- Tema atual:', window.themeManager?.currentTheme);
    console.log('- Body classes:', document.body.className);
    console.log('- Botão existe:', !!document.getElementById('btn-change-theme'));
    console.log('- Modal existe:', !!document.getElementById('theme-modal'));
    console.log('- Overlay existe:', !!document.getElementById('theme-overlay'));
    console.log('- Cards encontrados:', document.querySelectorAll('.theme-card').length);
};