/**
 * Gerenciador de Menus de Ação
 */

export class ActionMenuManager {
    constructor() {
        this.activeMenuId = null;
        this.setupGlobalListeners();
    }

    setupGlobalListeners() {
        // Fechar menus ao clicar fora
        document.addEventListener('click', (event) => {
            // Não fechar se clicou no botão do menu ou dentro do container
            if (event.target.closest('.action-menu-container') || 
                event.target.classList.contains('action-menu-btn')) {
                return;
            }
            this.closeAll();
        });

        // Fechar ao pressionar ESC
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeAll();
            }
        });
    }

    toggle(btn, id) {
        const menuId = `action-menu-${id}`;
        const menu = document.getElementById(menuId);

        if (!menu) return;

        // Se este menu já está aberto, fecha ele
        if (this.activeMenuId === id) {
            this.close(id);
            return;
        }

        // Fecha outros menus abertos
        this.closeAll();

        // Abre este menu
        menu.classList.add('active');
        btn.classList.add('active');
        this.activeMenuId = id;

        // Ajustar posição se necessário (evitar sair da tela)
        this.adjustPosition(menu);
    }

    close(id) {
        const menu = document.getElementById(`action-menu-${id}`);
        if (menu) {
            menu.classList.remove('active');
        }

        // Remover estado ativo dos botões
        document.querySelectorAll(`.action-menu-btn[data-id="${id}"]`).forEach(btn => {
            btn.classList.remove('active');
        });

        if (this.activeMenuId === id) {
            this.activeMenuId = null;
        }
    }

    closeAll() {
        document.querySelectorAll('.action-menu.active').forEach(menu => {
            menu.classList.remove('active');
        });

        document.querySelectorAll('.action-menu-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });

        this.activeMenuId = null;
    }

    adjustPosition(menu) {
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;

        // Se sair pela direita
        if (rect.right > viewportWidth) {
            menu.style.right = '0';
            menu.style.left = 'auto';
        }
    }
}

export const menuManager = new ActionMenuManager();