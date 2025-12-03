/**
 * Módulo de Calendário
 */

import { api } from './api-service.js';
import { showNotification, showLoading, hideLoading, openModal, closeModal } from './ui.js';
import { formatDate, sanitize } from './utils.js';
import { menuManager } from './menu-actions.js';
import * as AppointmentsModule from './appointments.js';

let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth() + 1;

const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export async function loadCalendar() {
    showLoading('calendar-grid');
    try {
        const response = await api.get('/dashboard/calendar', {
            year: currentYear,
            month: currentMonth
        });
        
        updateMonthHeader();
        renderCalendar(response.data);
        setupCalendarNavigation();
    } catch (error) {
        console.error('Erro ao carregar calendário:', error);
        showNotification('Erro ao carregar calendário.', 'error');
        document.getElementById('calendar-grid').innerHTML = '<p class="empty-message">Erro ao carregar calendário.</p>';
    } finally {
        hideLoading('calendar-grid');
    }
}

function updateMonthHeader() {
    const monthHeader = document.getElementById('current-month');
    if (monthHeader) {
        monthHeader.textContent = `${monthNames[currentMonth - 1]} ${currentYear}`;
    }
}

function setupCalendarNavigation() {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    if (prevBtn) {
        prevBtn.onclick = () => {
            currentMonth--;
            if (currentMonth < 1) {
                currentMonth = 12;
                currentYear--;
            }
            loadCalendar();
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }
            loadCalendar();
        };
    }
}

function renderCalendar(data) {
    const container = document.getElementById('calendar-grid');
    if (!container) return;

    // Calcular primeiro dia do mês e quantos dias tem
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Domingo, 6 = Sábado

    let html = '';

    // Dias vazios no início
    for (let i = 0; i < startingDayOfWeek; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    // Dias do mês
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() + 1 === currentMonth;

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayData = data[dateStr] || { compromissos: [], tarefas: [] };
        const isToday = isCurrentMonth && day === today.getDate();
        
        html += `<div class="calendar-day ${isToday ? 'today' : ''} ${dayData.compromissos.length > 0 || dayData.tarefas.length > 0 ? 'has-events' : ''}" 
                     data-date="${dateStr}"
                     onclick="window.showDayDetails('${dateStr}')">`;
        
        html += `<div class="calendar-day-number">${day}</div>`;
        
        // Mostrar até 3 eventos
        const allEvents = [...dayData.compromissos.slice(0, 2), ...dayData.tarefas.slice(0, 1)];
        allEvents.forEach((event, idx) => {
            const isAppointment = 'horario_inicio' in event;
            const eventType = isAppointment ? 'appointment' : 'task';
            const eventClass = isAppointment ? 'calendar-appointment' : 'calendar-task';
            const eventTitle = sanitize(event.titulo || event.titulo || 'Sem título');
            
            html += `<div class="calendar-event ${eventClass}" 
                          onclick="event.stopPropagation(); window.showEventDetails(${event.id}, '${eventType}')"
                          title="${eventTitle}">
                      ${eventTitle.length > 15 ? eventTitle.substring(0, 15) + '...' : eventTitle}
                    </div>`;
        });
        
        // Indicador de mais eventos
        const totalEvents = dayData.compromissos.length + dayData.tarefas.length;
        if (totalEvents > 3) {
            html += `<div class="calendar-more-events">+${totalEvents - 3} mais</div>`;
        }
        
        html += '</div>';
    }

    container.innerHTML = html;
}

// Função global para mostrar detalhes do dia
window.showDayDetails = function(dateStr) {
    // Fechar qualquer modal de detalhes de compromisso que esteja aberto
    closeModal('appointment-details-modal');
    
    // Buscar dados do dia
    api.get('/dashboard/calendar', {
        year: parseInt(dateStr.split('-')[0]),
        month: parseInt(dateStr.split('-')[1])
    }).then(response => {
        const dayData = response.data[dateStr] || { compromissos: [], tarefas: [] };
        
        let html = '<div class="day-details-content">';
        
        if (dayData.compromissos.length === 0 && dayData.tarefas.length === 0) {
            html += '<p class="empty-message">Nenhum evento neste dia.</p>';
        } else {
            // Compromissos
            if (dayData.compromissos.length > 0) {
                html += '<h3 style="margin-bottom: 1rem; color: var(--primary-color);">📅 Compromissos</h3>';
                html += '<div class="day-events-list">';
                dayData.compromissos.forEach(appointment => {
                    html += renderAppointmentInCalendar(appointment);
                });
                html += '</div>';
            }
            
            // Tarefas
            if (dayData.tarefas.length > 0) {
                html += '<h3 style="margin: 1.5rem 0 1rem; color: var(--success-color);">✅ Tarefas</h3>';
                html += '<div class="day-events-list">';
                dayData.tarefas.forEach(task => {
                    html += renderTaskInCalendar(task);
                });
                html += '</div>';
            }
        }
        
        html += '</div>';
        
        document.getElementById('day-details-content').innerHTML = html;
        document.getElementById('day-details-title').textContent = `Detalhes - ${formatDate(dateStr)}`;
        openModal('day-details-modal');
    }).catch(error => {
        console.error('Erro ao carregar detalhes do dia:', error);
        showNotification('Erro ao carregar detalhes do dia.', 'error');
    });
};

// Função global para mostrar detalhes de um evento
window.showEventDetails = function(id, type) {
    if (type === 'appointment') {
        AppointmentsModule.editAppointment(id);
    } else {
        // Para tarefas, você precisaria importar o módulo de tarefas
        showNotification('Funcionalidade de editar tarefa será implementada.', 'info');
    }
};

function renderAppointmentInCalendar(appointment) {
    if (!appointment || !appointment.id) return '';
    
    return `
        <div class="day-event-item appointment-item">
            <div class="task-header">
                <div class="task-title">${sanitize(appointment.titulo)}</div>
                <div class="action-menu-container" onclick="event.stopPropagation();">
                    <button class="action-menu-btn" 
                            onclick="window.toggleActionMenu(this, 'appt-${appointment.id}'); event.stopPropagation();"
                            data-id="appt-${appointment.id}"
                            aria-label="Ações">
                        ⋮
                    </button>
                    <div id="action-menu-appt-${appointment.id}" class="action-menu">
                        <button onclick="window.editAppointment(${appointment.id}); window.closeActionMenu('appt-${appointment.id}'); event.stopPropagation()">
                            ✏️ Editar
                        </button>
                        <button class="delete-btn" onclick="window.deleteAppointment('appt-${appointment.id}'); window.closeActionMenu('appt-${appointment.id}'); event.stopPropagation()">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
            </div>
            <p style="color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.9rem;">
                ⏰ ${appointment.horario_inicio} - ${appointment.horario_fim}
            </p>
            ${appointment.local_link ? `<p style="color: var(--text-muted); font-size: 0.85rem;">📍 ${sanitize(appointment.local_link)}</p>` : ''}
        </div>
    `;
}

function renderTaskInCalendar(task) {
    if (!task || !task.id) return '';
    
    return `
        <div class="day-event-item task-item">
            <div class="task-header">
                <div class="task-title">${sanitize(task.titulo)}</div>
            </div>
            <p style="color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.9rem;">
                📋 ${task.categoria || 'Sem categoria'} | ${task.prioridade || 'Média'}
            </p>
        </div>
    `;
}
