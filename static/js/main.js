/**
 * Aplicação Principal
 */

import { CONFIG } from './config.js';
import { showNotification, openModal, closeModal, showLoading, hideLoading } from './ui.js';
import { api } from './api-service.js';
import { menuManager } from './menu-actions.js';
import { sanitize, formatDate } from './utils.js';

// Importar módulos de features
import * as TasksModule from './tasks.js';
import * as AppointmentsModule from './appointments.js';
import * as CalendarModule from './calendar.js';
import * as KanbanModule from './kanban.js';
import * as HelpModule from './help.js';
import * as HistoryModule from './history.js';

// Estado Global da Aplicação
const AppState = {
    currentView: 'dashboard',
    stats: null
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    console.log('Inicializando aplicação...');

    setupNavigation();
    setupGlobalExports();
    setupEventListeners();

    await loadDashboard();
}

// Configurar Navegação
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            navigateTo(view);
        });
    });
}

function navigateTo(view) {
    console.log('Navegando para:', view);
    
    // Atualizar botões
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const isActive = btn.dataset.view === view;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
    });

    // Atualizar views
    document.querySelectorAll('.view').forEach(v => {
        const isActive = v.id === `${view}-view`;
        if (isActive) {
            v.classList.add('active');
            v.classList.remove('hidden');
            v.removeAttribute('hidden');
            v.style.display = 'block';
        } else {
            v.classList.remove('active');
            v.classList.add('hidden');
            v.setAttribute('hidden', '');
            v.style.display = 'none';
        }
    });

    AppState.currentView = view;
    loadViewData(view);
}

async function loadViewData(view) {
    try {
        switch (view) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'tasks':
                await TasksModule.loadTasks();
                break;
            case 'appointments':
                await AppointmentsModule.loadAppointments();
                break;
            case 'kanban':
                await KanbanModule.loadKanban();
                break;
            case 'calendar':
                await CalendarModule.loadCalendar();
                break;
            case 'history':
                await HistoryModule.loadHistory();
                break;
            case 'help':
                HelpModule.init();
                break;
        }
    } catch (error) {
        console.error(`Erro ao carregar view ${view}:`, error);
        showNotification('Erro ao carregar dados.', 'error');
    }
}

async function loadDashboard() {
    try {
        const statsData = await api.get('/dashboard/stats');
        const urgentData = await api.get('/dashboard/urgent');

        renderDashboardStats(statsData.data);
        renderUrgentItems(urgentData.data);
    } catch (error) {
        console.error('Erro dashboard:', error);
    }
}

function renderDashboardStats(stats) {
    const container = document.getElementById('stats-container');
    if (!container) return;

    document.getElementById('stats-pendentes').textContent = stats.tarefas.por_status.pendente || 0;
    document.getElementById('stats-hoje').textContent = stats.compromissos.hoje || 0;
    document.getElementById('stats-urgentes').textContent =
        (stats.tarefas.por_prioridade.urgente || 0) + (stats.tarefas.por_prioridade.alta || 0); // Exemplo
    document.getElementById('stats-concluidas').textContent = stats.tarefas.por_status.concluida || 0;
}

function renderUrgentItems(data) {
    const container = document.getElementById('urgent-container');
    if (!container) return;

    let html = '<div class="card"><div class="card-header"><h3 class="card-title">⚠️ Itens Urgentes</h3></div>';

    // Renderizar Tarefas Urgentes
    if (data.tarefas_urgentes && data.tarefas_urgentes.length > 0) {
        html += '<h4 style="margin-bottom: 1rem; color: var(--text-secondary);">Tarefas Urgentes</h4>';
        html += '<div class="task-list">';
        data.tarefas_urgentes.forEach(task => {
            html += TasksModule.renderTaskItem(task);
        });
        html += '</div>';
    }

    // Renderizar Compromissos Próximos
    if (data.compromissos_proximos && data.compromissos_proximos.length > 0) {
        html += '<h4 style="margin: 1.5rem 0 1rem; color: var(--text-secondary);">Compromissos Próximos</h4>';
        html += '<div class="appointment-list">';
        data.compromissos_proximos.forEach(app => {
            html += AppointmentsModule.renderAppointmentItem(app);
        });
        html += '</div>';
    }

    if ((!data.tarefas_urgentes || data.tarefas_urgentes.length === 0) &&
        (!data.compromissos_proximos || data.compromissos_proximos.length === 0)) {
        html += '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhum item urgente no momento 🎉</p>';
    }

    html += '</div>';
    container.innerHTML = html;
}

function setupEventListeners() {
    // Fechar modais ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Expor funções para o escopo global (para onclick no HTML)
function setupGlobalExports() {
    window.navigateTo = navigateTo;

    // UI
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.showNotification = showNotification;

    // Tasks
    window.saveTask = TasksModule.saveTask;
    window.editTask = TasksModule.editTask;
    window.deleteTask = TasksModule.deleteTask;
    window.openNewTaskModal = TasksModule.openNewTaskModal;
    window.applyTaskFilters = TasksModule.applyTaskFilters;
    window.clearTaskFilters = TasksModule.clearTaskFilters;
    window.changeTaskPage = TasksModule.changeTaskPage;

    // Appointments
    window.saveAppointment = AppointmentsModule.saveAppointment;
    window.editAppointment = AppointmentsModule.editAppointment;
    window.deleteAppointment = AppointmentsModule.deleteAppointment;
    window.showAppointmentDetails = AppointmentsModule.showAppointmentDetails;
    window.openNewAppointmentModal = AppointmentsModule.openNewAppointmentModal;
    window.applyAppointmentFilters = AppointmentsModule.applyAppointmentFilters;
    window.clearAppointmentFilters = AppointmentsModule.clearAppointmentFilters;
    window.changeAppointmentPage = AppointmentsModule.changeAppointmentPage;
    window.generateNextSteps = AppointmentsModule.generateNextSteps;

    // History
    window.applyHistoryFilters = HistoryModule.applyHistoryFilters;
    window.clearHistoryFilters = HistoryModule.clearHistoryFilters;
    window.exportHistory = HistoryModule.exportHistory;

    // Menu
    window.toggleActionMenu = (btn, id) => menuManager.toggle(btn, id);
    window.closeActionMenu = (id) => menuManager.close(id);
}