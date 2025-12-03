/**
 * Módulo de Agendamentos
 */

import { api } from './api-service.js';
import { CONFIG, MESSAGES } from './config.js';
import { sanitize, formatDate, formatTime, debounce } from './utils.js';
import { showNotification, openModal, closeModal, showLoading, hideLoading } from './ui.js';
import { menuManager } from './menu-actions.js';

export const AppointmentsState = {
    items: [],
    pagination: {
        page: 1,
        perPage: 10,
        total: 0,
        totalPages: 0
    },
    filters: {
        data_inicio: '',
        data_fim: '',
        palavra_chave: ''
    }
};

export async function loadAppointments(page = 1) {
    showLoading('appointments-list');
    try {
        AppointmentsState.pagination.page = page;
        const params = {
            page: AppointmentsState.pagination.page,
            per_page: AppointmentsState.pagination.perPage,
            ...AppointmentsState.filters
        };

        const response = await api.get('/appointments', params);
        AppointmentsState.items = response.data;
        AppointmentsState.pagination = { ...AppointmentsState.pagination, ...response.meta };

        renderAppointmentsList();
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        showNotification(MESSAGES.ERROR.LOAD_DATA, 'error');
        document.getElementById('appointments-list').innerHTML = `<p class="error-message">${MESSAGES.ERROR.LOAD_DATA}</p>`;
    } finally {
        hideLoading('appointments-list');
    }
}

function renderAppointmentsList() {
    const container = document.getElementById('appointments-list');
    if (!container) return;

    if (AppointmentsState.items.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum compromisso agendado. 📅</p>';
        return;
    }

    let html = '<div class="appointment-list">';
    AppointmentsState.items.forEach(appointment => {
        html += renderAppointmentItem(appointment);
    });
    html += '</div>';

    // Paginação
    if (AppointmentsState.pagination.totalPages > 1) {
        html += renderPagination();
    }

    container.innerHTML = html;
}

export function renderAppointmentItem(appointment) {
    if (!appointment || !appointment.id) return '';

    return `
        <div class="appointment-item" onclick="window.showAppointmentDetails(${appointment.id})">
            <div class="task-header">
                <div class="task-title">${sanitize(appointment.titulo)}</div>
            </div>
            <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">
                📅 ${formatDate(appointment.data)} | ⏰ ${appointment.horario_inicio} - ${appointment.horario_fim}
            </p>
            ${appointment.local_link ? `<p style="color: var(--text-muted); font-size: 0.9rem;">📍 ${sanitize(appointment.local_link)}</p>` : ''}
        </div>
    `;
}

function renderPagination() {
    const { page, totalPages } = AppointmentsState.pagination;
    return `
        <div class="pagination">
            <button class="btn btn-secondary" ${page === 1 ? 'disabled' : ''} onclick="window.changeAppointmentPage(${page - 1})">Anterior</button>
            <span>Página ${page} de ${totalPages}</span>
            <button class="btn btn-secondary" ${page === totalPages ? 'disabled' : ''} onclick="window.changeAppointmentPage(${page + 1})">Próxima</button>
        </div>
    `;
}

export async function saveAppointment(event) {
    event.preventDefault();
    const id = document.getElementById('appointment-id').value;

    const data = {
        titulo: document.getElementById('appointment-titulo').value.trim(),
        participantes: document.getElementById('appointment-participantes').value.trim(),
        assunto_principal: document.getElementById('appointment-assunto').value.trim(),
        palavra_chave: document.getElementById('appointment-palavra-chave').value.trim(),
        local_link: document.getElementById('appointment-local').value.trim(),
        data: document.getElementById('appointment-data').value,
        horario_inicio: document.getElementById('appointment-horario-inicio').value,
        horario_fim: document.getElementById('appointment-horario-fim').value,
        objetivo: document.getElementById('appointment-objetivo').value.trim(),
        lembretes: document.getElementById('appointment-lembretes').value.trim(),
        notas_reuniao: document.getElementById('appointment-notas').value.trim(),
        proximos_passos: document.getElementById('appointment-proximos-passos').value.trim()
    };

    // Validação
    if (!data.titulo || !data.data || !data.horario_inicio || !data.horario_fim) {
        showNotification('Preencha os campos obrigatórios.', 'warning');
        return;
    }

    try {
        if (id) {
            await api.put(`/appointments/${id}`, data);
            showNotification(MESSAGES.SUCCESS.UPDATED, 'success');
        } else {
            await api.post('/appointments', data);
            showNotification(MESSAGES.SUCCESS.SAVED, 'success');
        }

        closeModal('appointment-modal');
        await loadAppointments(AppointmentsState.pagination.page);
        
        // Recarregar calendário sempre após salvar/editar
        try {
            const CalendarModule = await import('./calendar.js');
            await CalendarModule.loadCalendar();
        } catch (e) {
            // Calendário pode não estar carregado, não é erro crítico
        }
    } catch (error) {
        showNotification(error.message || MESSAGES.ERROR.SAVE_DATA, 'error');
    }
}

export async function editAppointment(id) {
    try {
        const response = await api.get(`/appointments/${id}`);
        const app = response.data;

        document.getElementById('appointment-id').value = app.id;
        document.getElementById('appointment-titulo').value = app.titulo;
        document.getElementById('appointment-participantes').value = app.participantes || '';
        document.getElementById('appointment-assunto').value = app.assunto_principal || '';
        document.getElementById('appointment-palavra-chave').value = app.palavra_chave || '';
        document.getElementById('appointment-local').value = app.local_link || '';
        document.getElementById('appointment-data').value = app.data;
        document.getElementById('appointment-horario-inicio').value = app.horario_inicio;
        document.getElementById('appointment-horario-fim').value = app.horario_fim;
        document.getElementById('appointment-objetivo').value = app.objetivo || '';
        document.getElementById('appointment-lembretes').value = app.lembretes || '';
        document.getElementById('appointment-notas').value = app.notas_reuniao || '';
        document.getElementById('appointment-proximos-passos').value = app.proximos_passos || '';

        document.getElementById('appointment-modal-title').textContent = 'Editar Compromisso';
        openModal('appointment-modal');
    } catch (error) {
        showNotification(MESSAGES.ERROR.LOAD_DATA, 'error');
    }
}

export async function showAppointmentDetails(id) {
    try {
        const response = await api.get(`/appointments/${id}`);
        const appointment = response.data;
        
        // Preencher modal de detalhes
        document.getElementById('appointment-details-title').textContent = appointment.titulo;
        document.getElementById('appointment-details-content').innerHTML = `
            <div class="appointment-details">
                <div class="detail-row">
                    <strong>📅 Data:</strong> ${formatDate(appointment.data)}
                </div>
                <div class="detail-row">
                    <strong>⏰ Horário:</strong> ${appointment.horario_inicio} - ${appointment.horario_fim}
                </div>
                ${appointment.participantes ? `<div class="detail-row"><strong>👥 Participantes:</strong> ${sanitize(appointment.participantes)}</div>` : ''}
                ${appointment.assunto_principal ? `<div class="detail-row"><strong>📋 Assunto:</strong> ${sanitize(appointment.assunto_principal)}</div>` : ''}
                ${appointment.local_link ? `<div class="detail-row"><strong>📍 Local/Link:</strong> ${sanitize(appointment.local_link)}</div>` : ''}
                ${appointment.objetivo ? `<div class="detail-row"><strong>🎯 Objetivo:</strong> ${sanitize(appointment.objetivo)}</div>` : ''}
                ${appointment.notas_reuniao ? `<div class="detail-row"><strong>📝 Notas da Reunião:</strong> ${sanitize(appointment.notas_reuniao)}</div>` : ''}
                ${appointment.proximos_passos ? `<div class="detail-row"><strong>➡️ Próximos Passos:</strong> ${sanitize(appointment.proximos_passos)}</div>` : ''}
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;">
                <button class="btn btn-primary" onclick="window.editAppointment(${appointment.id}); window.closeModal('appointment-details-modal');">
                    ✏️ Editar
                </button>
                <button class="btn btn-danger" onclick="window.deleteAppointment(${appointment.id}); window.closeModal('appointment-details-modal');">
                    🗑️ Excluir
                </button>
            </div>
        `;
        
        openModal('appointment-details-modal');
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        showNotification('Erro ao carregar detalhes do compromisso.', 'error');
    }
}

export async function deleteAppointment(id) {
    // Remover prefixo 'appt-' se existir (vindo do calendário)
    const cleanId = typeof id === 'string' && id.startsWith('appt-') ? parseInt(id.replace('appt-', '')) : id;
    
    if (!confirm(MESSAGES.CONFIRM?.DELETE || 'Tem certeza que deseja excluir este compromisso?')) return;

    // Fechar modais primeiro para melhor UX
    closeModal('appointment-details-modal');
    closeModal('day-details-modal');
    closeModal('appointment-modal');

    try {
        const response = await api.delete(`/appointments/${cleanId}`);
        
        if (!response.success) {
            throw new Error(response.error || 'Erro ao excluir compromisso');
        }
        
        showNotification(MESSAGES.SUCCESS?.DELETED || 'Compromisso excluído com sucesso', 'success');
        
        // Recarregar todas as views relacionadas para garantir sincronização
        const currentView = window.AppState?.currentView || 'appointments';
        
        // Sempre recarregar agenda se estiver na view
        if (currentView === 'appointments') {
            await loadAppointments(AppointmentsState.pagination.page);
        }
        
        // Sempre recarregar calendário (pode estar visível em outra aba)
        // Usar setTimeout para não bloquear a UI
        setTimeout(async () => {
            try {
                const CalendarModule = await import('./calendar.js');
                await CalendarModule.loadCalendar();
            } catch (e) {
                // Calendário pode não estar carregado, não é erro crítico
            }
        }, 100);
        
        // Recarregar dashboard para atualizar estatísticas
        if (currentView === 'dashboard') {
            setTimeout(async () => {
                try {
                    const statsData = await api.get('/dashboard/stats');
                    document.getElementById('stats-hoje').textContent = statsData.data.compromissos.hoje || 0;
                } catch (e) {
                    console.log('Erro ao recarregar dashboard:', e);
                }
            }, 100);
        }
        
    } catch (error) {
        console.error('Erro ao excluir compromisso:', error);
        showNotification(error.message || MESSAGES.ERROR?.DELETE_DATA || 'Erro ao excluir compromisso', 'error');
    }
}

export async function generateNextSteps(id) {
    if (!id) {
        showNotification('Salve o compromisso antes de gerar passos.', 'warning');
        return;
    }

    try {
        const btn = document.querySelector('button[onclick*="generateNextSteps"]');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Gerando...';

        const response = await api.post(`/appointments/${id}/next-steps`, {
            notas_reuniao: document.getElementById('appointment-notas').value
        });

        document.getElementById('appointment-proximos-passos').value = response.data.proximos_passos || '';
        showNotification('Passos gerados com sucesso!', 'success');
    } catch (error) {
        showNotification('Erro ao gerar passos.', 'error');
    } finally {
        const btn = document.querySelector('button[onclick*="generateNextSteps"]');
        if (btn) {
            btn.disabled = false;
            btn.textContent = '🤖 Gerar Automaticamente';
        }
    }
}

export function openNewAppointmentModal() {
    document.getElementById('appointment-form').reset();
    document.getElementById('appointment-id').value = '';

    // Definir data de hoje
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-data').value = today;

    document.getElementById('appointment-modal-title').textContent = 'Novo Compromisso';
    openModal('appointment-modal');
}

export function applyAppointmentFilters() {
    AppointmentsState.filters = {
        data_inicio: document.getElementById('filter-data-inicio').value,
        data_fim: document.getElementById('filter-data-fim').value,
        palavra_chave: document.getElementById('filter-appointment-palavra-chave').value.trim()
    };
    loadAppointments(1);
}

export function clearAppointmentFilters() {
    document.getElementById('filter-data-inicio').value = '';
    document.getElementById('filter-data-fim').value = '';
    document.getElementById('filter-appointment-palavra-chave').value = '';
    applyAppointmentFilters();
}

export function changeAppointmentPage(page) {
    if (page < 1 || page > AppointmentsState.pagination.totalPages) return;
    loadAppointments(page);
}