/**
 * Utilitários Gerais
 */

import { CONFIG } from './config.js';

/**
 * Sanitiza uma string para prevenir XSS
 * @param {string} str - String para sanitizar
 * @returns {string} String sanitizada
 */
export function sanitize(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Formata uma data para o formato local
 * @param {string|Date} dateInput - Data para formatar
 * @returns {string} Data formatada
 */
export function formatDate(dateInput) {
    if (!dateInput) return '';
    try {
        // Se for string YYYY-MM-DD, corrigir fuso horário
        if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            const [year, month, day] = dateInput.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString(CONFIG.DATE_LOCALE);
        }

        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return dateInput;

        return date.toLocaleDateString(CONFIG.DATE_LOCALE);
    } catch (e) {
        console.error('Erro ao formatar data:', e);
        return String(dateInput);
    }
}

/**
 * Formata um horário
 * @param {string} timeString - Horário HH:MM
 * @returns {string} Horário formatado
 */
export function formatTime(timeString) {
    if (!timeString) return '';
    return timeString; // Pode adicionar formatação extra se necessário
}

/**
 * Formata o status para exibição
 * @param {string} status - Status em snake_case
 * @returns {string} Status formatado
 */
export function formatStatus(status) {
    const statusMap = {
        [CONFIG.STATUS.PENDENTE]: 'Pendente',
        [CONFIG.STATUS.EM_ANDAMENTO]: 'Em Andamento',
        [CONFIG.STATUS.CONCLUIDA]: 'Concluída',
        [CONFIG.STATUS.ADIADA]: 'Adiada'
    };
    return statusMap[status] || status;
}

/**
 * Cria uma função debounced
 * @param {Function} func - Função para executar
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} Função debounced
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Verifica se uma data é futura
 * @param {string} dateString - Data YYYY-MM-DD
 * @returns {boolean}
 */
export function isFutureDate(dateString) {
    if (!dateString) return false;
    const [year, month, day] = dateString.split('-').map(Number);
    const inputDate = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return inputDate >= today;
}

/**
 * Verifica se um intervalo de horário é válido
 * @param {string} start - HH:MM
 * @param {string} end - HH:MM
 * @returns {boolean}
 */
export function isValidTimeRange(start, end) {
    if (!start || !end) return false;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;

    return endTime > startTime;
}

/**
 * Gera um ID único (simples)
 * @returns {string}
 */
export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}