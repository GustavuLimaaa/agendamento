/**
 * Módulo Kanban
 */
import { api } from './api-service.js';
import { showNotification, showLoading, hideLoading, openModal } from './ui.js';
import { sanitize, formatDate, formatStatus } from './utils.js';
import { menuManager } from './menu-actions.js';

let isLoadingKanban = false;

export async function loadKanban() {
    // Prevenir múltiplas chamadas simultâneas
    if (isLoadingKanban) {
        console.log('Kanban já está carregando...');
        return;
    }
    
    isLoadingKanban = true;
    const container = document.getElementById('kanban-board');
    if (!container) {
        isLoadingKanban = false;
        return;
    }
    
    try {
        // Carregar todas as tarefas sem paginação para o Kanban
        const response = await api.get('/tasks', { per_page: 1000 });
        const tasks = response.data || [];
        
        renderKanban(tasks);
    } catch (error) {
        console.error('Erro ao carregar Kanban:', error);
        showNotification('Erro ao carregar quadro de tarefas.', 'error');
        container.innerHTML = '<p class="empty-message">Erro ao carregar tarefas.</p>';
    } finally {
        isLoadingKanban = false;
    }
}

function renderKanban(tasks) {
    const container = document.getElementById('kanban-board');
    if (!container) return;

    // Organizar tarefas por status
    const tasksByStatus = {
        pendente: [],
        em_andamento: [],
        concluida: [],
        adiada: []
    };

    tasks.forEach(task => {
        const status = task.status || 'pendente';
        if (tasksByStatus[status]) {
            tasksByStatus[status].push(task);
        }
    });

    // Renderizar cada coluna
    Object.keys(tasksByStatus).forEach(status => {
        const columnId = `kanban-${status}`;
        const column = document.getElementById(columnId);
        if (!column) return;

        const statusTasks = tasksByStatus[status];
        
        if (statusTasks.length === 0) {
            column.innerHTML = '<p class="empty-column">Nenhuma tarefa</p>';
        } else {
            let html = '';
            statusTasks.forEach(task => {
                html += renderKanbanTask(task);
            });
            column.innerHTML = html;
        }
    });

    // Configurar drag and drop apenas uma vez após renderização
    setTimeout(() => {
        setupDragAndDrop();
    }, 100);
}

function renderKanbanTask(task) {
    const priorityClass = `priority-${task.prioridade}`;
    const priorityColors = {
        urgente: '#ef5350',
        alta: '#ff9800',
        media: '#ffc107',
        baixa: '#66bb6a'
    };
    const priorityColor = priorityColors[task.prioridade] || '#6b7fd7';

    return `
        <div class="kanban-task" 
             data-task-id="${task.id}" 
             data-status="${task.status}"
             onclick="window.editTask(${task.id})"
             style="border-left: 4px solid ${priorityColor};">
            <div class="kanban-task-header">
                <div class="kanban-task-title">${sanitize(task.titulo)}</div>
                <div class="action-menu-container" onclick="event.stopPropagation();">
                    <button class="action-menu-btn" 
                            onclick="window.toggleActionMenu(this, 'kanban-${task.id}'); event.stopPropagation();"
                            data-id="kanban-${task.id}"
                            aria-label="Ações">
                        ⋮
                    </button>
                    <div id="action-menu-kanban-${task.id}" class="action-menu">
                        <button onclick="window.editTask(${task.id}); window.closeActionMenu('kanban-${task.id}'); event.stopPropagation()">
                            ✏️ Editar
                        </button>
                        <button class="delete-btn" onclick="window.deleteTask(${task.id}); window.closeActionMenu('kanban-${task.id}'); event.stopPropagation()">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
            </div>
            <div class="kanban-task-category">${sanitize(task.categoria || 'Sem categoria')}</div>
            ${task.descricao ? `<div class="kanban-task-desc">${sanitize(task.descricao.substring(0, 60))}${task.descricao.length > 60 ? '...' : ''}</div>` : ''}
            <div class="kanban-task-footer">
                <span class="kanban-task-priority" style="color: ${priorityColor};">${sanitize(task.prioridade)}</span>
                ${task.data_limite ? `<span class="kanban-task-date">📅 ${formatDate(task.data_limite)}</span>` : ''}
            </div>
        </div>
    `;
}

let dragAndDropSetup = false;

function setupDragAndDrop() {
    // Evitar configurar múltiplas vezes
    if (dragAndDropSetup) {
        // Remover listeners antigos antes de adicionar novos
        const oldTasks = document.querySelectorAll('.kanban-task');
        const oldColumns = document.querySelectorAll('.kanban-column-content');
        oldTasks.forEach(task => {
            const newTask = task.cloneNode(true);
            task.parentNode.replaceChild(newTask, task);
        });
        oldColumns.forEach(column => {
            const newColumn = column.cloneNode(true);
            column.parentNode.replaceChild(newColumn, column);
        });
    }
    
    // Implementação básica de drag and drop
    const kanbanTasks = document.querySelectorAll('.kanban-task');
    const kanbanColumns = document.querySelectorAll('.kanban-column-content');

    if (kanbanTasks.length === 0 || kanbanColumns.length === 0) {
        dragAndDropSetup = false;
        return;
    }

    kanbanTasks.forEach(task => {
        task.draggable = true;
        
        task.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            e.dataTransfer.setData('text/plain', task.dataset.taskId);
            task.style.opacity = '0.5';
        });

        task.addEventListener('dragend', (e) => {
            task.style.opacity = '1';
        });
    });

    kanbanColumns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            column.style.backgroundColor = 'rgba(107, 127, 215, 0.1)';
        });

        column.addEventListener('dragleave', (e) => {
            e.stopPropagation();
            column.style.backgroundColor = '';
        });

        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            column.style.backgroundColor = '';
            
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = column.closest('.kanban-column').dataset.status;
            
            if (!taskId || !newStatus) return;
            
            // Atualizar status da tarefa
            try {
                const task = await api.get(`/tasks/${taskId}`);
                const taskData = task.data;
                
                await api.put(`/tasks/${taskId}`, {
                    ...taskData,
                    status: newStatus
                });
                
                showNotification('Status da tarefa atualizado!', 'success');
                dragAndDropSetup = false; // Resetar para permitir nova configuração
                await loadKanban(); // Recarregar o Kanban
            } catch (error) {
                console.error('Erro ao atualizar tarefa:', error);
                showNotification('Erro ao atualizar tarefa.', 'error');
            }
        });
    });
    
    dragAndDropSetup = true;
}
