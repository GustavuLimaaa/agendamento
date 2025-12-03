/**
 * Módulo Ajuda
 */

export function init() {
    // Aguardar um pouco para garantir que o DOM está pronto
    setTimeout(() => {
        setupHelpAccordions();
    }, 100);
}

function setupHelpAccordions() {
    const accordions = document.querySelectorAll('.help-accordion');

    accordions.forEach(accordion => {
        // Remover listeners antigos se existirem
        const newAccordion = accordion.cloneNode(true);
        accordion.parentNode.replaceChild(newAccordion, accordion);

        // Configurar o painel inicialmente fechado
        const panel = newAccordion.nextElementSibling;
        if (panel && panel.classList.contains('help-panel')) {
            panel.style.display = 'none';
            newAccordion.setAttribute('aria-expanded', 'false');
        }

        // Adicionar listener de clique
        newAccordion.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isActive = this.classList.contains('active');
            const panel = this.nextElementSibling;
            
            if (!panel || !panel.classList.contains('help-panel')) {
                return;
            }

            // Fechar todos os outros accordions (opcional - pode remover se quiser múltiplos abertos)
            // document.querySelectorAll('.help-accordion.active').forEach(acc => {
            //     if (acc !== this) {
            //         acc.classList.remove('active');
            //         const otherPanel = acc.nextElementSibling;
            //         if (otherPanel && otherPanel.classList.contains('help-panel')) {
            //             otherPanel.style.display = 'none';
            //             acc.setAttribute('aria-expanded', 'false');
            //         }
            //     }
            // });

            // Toggle do accordion atual
            if (isActive) {
                this.classList.remove('active');
                panel.style.display = 'none';
                this.setAttribute('aria-expanded', 'false');
            } else {
                this.classList.add('active');
                panel.style.display = 'block';
                this.setAttribute('aria-expanded', 'true');
            }
        });
    });
}
