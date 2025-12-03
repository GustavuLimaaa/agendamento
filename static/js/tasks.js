/**
 * Módulo de Tarefas
 */

import { api } from './api-service.js';
import { CONFIG, MESSAGES } from './config.js';
import { sanitize, formatDate, formatStatus, debounce } from './utils.js';
import { showNotification, openModal, closeModal, showLoading, hideLoading } from './ui.js';

export const TasksState = {
    items: [],
    pagination: {
        page: 1,
        perPage: 10,
        total: 0,
        totalPages: 0
    },
    filters: {
        status: '',
        prioridade: '',
        categoria: '',
        palavra_chave: ''
    }
};

export async function loadTasks(page = 1) {
    showLoading('tasks-list');
    try {
        TasksState.pagination.page = page;
        const params = {
            page: TasksState.pagination.page,
            per_page: TasksState.pagination.perPage,
            ...TasksState.filters
        };

        const response = await api.get('/tasks', params);
        TasksState.items = response.data;
        TasksState.pagination = { ...TasksState.pagination, ...response.meta };

        renderTasksList();
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
        showNotification(MESSAGES.ERROR.LOAD_DATA, 'error');
        document.getElementById('tasks-list').innerHTML = `<p class="error-message">${MESSAGES.ERROR.LOAD_DATA}</p>`;
    } finally {
        hideLoading('tasks-list'); // Actually handled by render
    }
}

function renderTasksList() {
    const container = document.getElementById('tasks-list');
    if (!container) return;

    if (TasksState.items.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma tarefa encontrada. 📝</p>';
        return;
    }

    let html = '<div class="task-list">';
    TasksState.items.forEach(task => {
        html += renderTaskItem(task);
    });
    html += '</div>';

    // Paginação
    if (TasksState.pagination.totalPages > 1) {
        html += renderPagination();
    }

    container.innerHTML = html;
}

export function renderTaskItem(task) {
    const priorityClass = `priority-${task.prioridade}`;
    const statusClass = task.status;

    return `
        <div class="task-item ${priorityClass}" onclick="window.editTask(${task.id})">
            <div class="task-header">
                <div class="task-title">[${sanitize(task.categoria)}] ${sanitize(task.titulo)}</div>
                <div class="task-badges">
                    <span class="badge badge-status ${statusClass}">${formatStatus(task.status)}</span>
                    <span class="badge badge-priority">${sanitize(task.prioridade)}</span>
                </div>
            </div>
            ${task.descricao ? `<p style="color: var(--text-secondary); margin-bottom: 0.5rem;">${sanitize(task.descricao)}</p>` : ''}
            ${task.data_limite ? `<p style="color: var(--text-muted); font-size: 0.9rem;">📅 ${formatDate(task.data_limite)}</p>` : ''}
        </div>
    `;
}

function renderPagination() {
    const { page, totalPages } = TasksState.pagination;
    return `
        <div class="pagination">
            <button class="btn btn-secondary" ${page === 1 ? 'disabled' : ''} onclick="window.changeTaskPage(${page - 1})">Anterior</button>
            <span>Página ${page} de ${totalPages}</span>
            <button class="btn btn-secondary" ${page === totalPages ? 'disabled' : ''} onclick="window.changeTaskPage(${page + 1})">Próxima</button>
        </div>
    `;
}

export async function saveTask(event) {
    event.preventDefault();
    const form = event.target;
    const id = document.getElementById('task-id').value;

    const data = {
        titulo: document.getElementById('task-titulo').value.trim(),
        descricao: document.getElementById('task-descricao').value.trim(),
        categoria: document.getElementById('task-categoria').value.trim(),
        palavra_chave: document.getElementById('task-palavra-chave').value.trim(),
        prioridade: document.getElementById('task-prioridade').value,
        status: document.getElementById('task-status').value,
        data_limite: document.getElementById('task-data-limite').value,
        responsaveis: document.getElementById('task-responsaveis').value.trim(),
        observacoes: document.getElementById('task-observacoes').value.trim()
    };

    // Validação básica
    if (!data.titulo || !data.categoria) {
        showNotification('Preencha os campos obrigatórios.', 'warning');
        return;
    }

    try {
        if (id) {
            await api.put(`/tasks/${id}`, data);
            showNotification(MESSAGES.SUCCESS.UPDATED, 'success');
        } else {
            await api.post('/tasks', data);
            showNotification(MESSAGES.SUCCESS.SAVED, 'success');
        }

        closeModal('task-modal');
        
        // Recarregar view atual
        const currentView = window.AppState?.currentView || 'tasks';
        if (currentView === 'kanban') {
            const KanbanModule = await import('./kanban.js');
            KanbanModule.loadKanban();
        } else if (currentView === 'history') {
            const HistoryModule = await import('./history.js');
            HistoryModule.loadHistory();
        } else {
            loadTasks(TasksState.pagination.page);
        }
    } catch (error) {
        showNotification(error.message || MESSAGES.ERROR.SAVE_DATA, 'error');
    }
}

export async function editTask(id) {
    try {
        const response = await api.get(`/tasks/${id}`);
        const task = response.data;

        document.getElementById('task-id').value = task.id;
        document.getElementById('task-titulo').value = task.titulo;
        document.getElementById('task-descricao').value = task.descricao || '';
        document.getElementById('task-categoria').value = task.categoria;
        document.getElementById('task-palavra-chave').value = task.palavra_chave || '';
        document.getElementById('task-prioridade').value = task.prioridade;
        document.getElementById('task-status').value = task.status;
        document.getElementById('task-data-limite').value = task.data_limite || '';
        document.getElementById('task-responsaveis').value = task.responsaveis || '';
        document.getElementById('task-observacoes').value = task.observacoes || '';

        document.getElementById('task-modal-title').textContent = 'Editar Tarefa';
        openModal('task-modal');
    } catch (error) {
        showNotification(MESSAGES.ERROR.LOAD_DATA, 'error');
    }
}

export async function deleteTask(id) {
    if (!confirm(MESSAGES.CONFIRM?.DELETE || 'Tem certeza que deseja excluir esta tarefa?')) return;

    try {
        await api.delete(`/tasks/${id}`);
        showNotification(MESSAGES.SUCCESS?.DELETED || 'Tarefa excluída com sucesso', 'success');
        
        // Recarregar a view atual
        const currentView = window.AppState?.currentView || 'tasks';
        if (currentView === 'kanban') {
            // Recarregar Kanban se estiver na view Kanban
            const KanbanModule = await import('./kanban.js');
            KanbanModule.loadKanban();
        } else if (currentView === 'history') {
            // Recarregar histórico se estiver na view History
            const HistoryModule = await import('./history.js');
            HistoryModule.loadHistory();
        } else {
            loadTasks(TasksState.pagination.page);
        }
    } catch (error) {
        showNotification(MESSAGES.ERROR?.DELETE_DATA || 'Erro ao excluir tarefa', 'error');
    }
}

export function openNewTaskModal() {
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';
    document.getElementById('task-modal-title').textContent = 'Nova Tarefa';
    openModal('task-modal');
}

export function applyTaskFilters() {
    TasksState.filters = {
        status: document.getElementById('filter-status').value,
        prioridade: document.getElementById('filter-prioridade').value,
        categoria: document.getElementById('filter-categoria').value.trim(),
        palavra_chave: document.getElementById('filter-palavra-chave').value.trim()
    };
    loadTasks(1);
}

export function clearTaskFilters() {
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-prioridade').value = '';
    document.getElementById('filter-categoria').value = '';
    document.getElementById('filter-palavra-chave').value = '';
    applyTaskFilters();
}

export function changeTaskPage(page) {
    if (page < 1 || page > TasksState.pagination.totalPages) return;
    loadTasks(page);
}