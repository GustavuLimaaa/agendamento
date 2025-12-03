/**
 * Módulo de UI Compartilhado
 */

import { CONFIG } from './config.js';

export function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="spinner"></div>';
    }
}

export function hideLoading(containerId) {
    // A renderização do conteúdo substitui o spinner, então não é estritamente necessário limpar,
    // mas pode ser útil em alguns casos.
}

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Estilos inline para garantir funcionamento mesmo se CSS falhar
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;

    if (type === 'success') notification.style.background = '#10b981';
    else if (type === 'error') notification.style.background = '#ef4444';
    else if (type === 'warning') notification.style.background = '#f59e0b';
    else notification.style.background = '#3b82f6';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, CONFIG.TOAST_DURATION);
}
