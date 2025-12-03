/**
 * Módulo Histórico - Tarefas Concluídas
 */
import { api } from './api-service.js';
import { showNotification, showLoading, hideLoading } from './ui.js';
import { sanitize, formatDate, formatStatus } from './utils.js';
import * as TasksModule from './tasks.js';

export const HistoryState = {
    items: [],
    filters: {
        periodo: 30,
        categoria: '',
        palavra_chave: ''
    }
};

export async function loadHistory() {
    showLoading('history-list');
    try {
        // Buscar todas as tarefas
        const response = await api.get('/tasks', { per_page: 1000 });
        const allTasks = response.data || [];
        
        // Filtrar apenas tarefas concluídas
        let completedTasks = allTasks.filter(task => task.status === 'concluida');
        
        // Aplicar filtro de período
        if (HistoryState.filters.periodo && HistoryState.filters.periodo !== 'all') {
            const days = parseInt(HistoryState.filters.periodo);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            cutoffDate.setHours(0, 0, 0, 0);
            
            completedTasks = completedTasks.filter(task => {
                // Usar data_limite se disponível, senão usar atualizado_em ou criado_em
                let taskDate = null;
                if (task.data_limite) {
                    try {
                        taskDate = new Date(task.data_limite);
                    } catch {
                        // Ignorar se data inválida
                    }
                }
                if (!taskDate && task.atualizado_em) {
                    try {
                        taskDate = new Date(task.atualizado_em);
                    } catch {
                        // Ignorar se data inválida
                    }
                }
                if (!taskDate && task.criado_em) {
                    try {
                        taskDate = new Date(task.criado_em);
                    } catch {
                        // Ignorar se data inválida
                    }
                }
                
                if (!taskDate) return false;
                taskDate.setHours(0, 0, 0, 0);
                return taskDate >= cutoffDate;
            });
        }
        
        // Aplicar filtro de categoria
        if (HistoryState.filters.categoria) {
            const categoriaLower = HistoryState.filters.categoria.toLowerCase();
            completedTasks = completedTasks.filter(task => 
                task.categoria && task.categoria.toLowerCase().includes(categoriaLower)
            );
        }
        
        // Aplicar filtro de palavra-chave
        if (HistoryState.filters.palavra_chave) {
            const keywordLower = HistoryState.filters.palavra_chave.toLowerCase();
            completedTasks = completedTasks.filter(task => {
                const searchText = `${task.titulo} ${task.descricao || ''} ${task.palavra_chave || ''}`.toLowerCase();
                return searchText.includes(keywordLower);
            });
        }
        
        // Ordenar por data de atualização (mais recentes primeiro)
        completedTasks.sort((a, b) => {
            const dateA = a.atualizado_em || a.criado_em || a.data_limite || '';
            const dateB = b.atualizado_em || b.criado_em || b.data_limite || '';
            
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            
            try {
                return new Date(dateB) - new Date(dateA);
            } catch {
                return 0;
            }
        });
        
        HistoryState.items = completedTasks;
        renderHistoryList();
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        showNotification('Erro ao carregar tarefas concluídas.', 'error');
        document.getElementById('history-list').innerHTML = '<p class="error-message">Erro ao carregar dados.</p>';
    } finally {
        hideLoading('history-list');
    }
}

function renderHistoryList() {
    const container = document.getElementById('history-list');
    if (!container) return;

    if (HistoryState.items.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma tarefa concluída no período selecionado. 📊</p>';
        return;
    }

    let html = '<div class="task-list">';
    HistoryState.items.forEach(task => {
        html += renderHistoryTaskItem(task);
    });
    html += '</div>';

    container.innerHTML = html;
}

function renderHistoryTaskItem(task) {
    const priorityClass = `priority-${task.prioridade}`;
    
    return `
        <div class="task-item ${priorityClass}" onclick="window.editTask(${task.id})">
            <div class="task-header">
                <div class="task-title">[${sanitize(task.categoria)}] ${sanitize(task.titulo)}</div>
                <div class="task-badges">
                    <span class="badge badge-status concluida">${formatStatus(task.status)}</span>
                    <span class="badge badge-priority">${sanitize(task.prioridade)}</span>
                </div>
            </div>
            ${task.descricao ? `<p style="color: var(--text-secondary); margin-bottom: 0.5rem;">${sanitize(task.descricao)}</p>` : ''}
            ${task.atualizado_em ? `<p style="color: var(--text-muted); font-size: 0.9rem;">📅 Concluída em: ${formatDate(task.atualizado_em)}</p>` : task.data_limite ? `<p style="color: var(--text-muted); font-size: 0.9rem;">📅 Data limite: ${formatDate(task.data_limite)}</p>` : ''}
        </div>
    `;
}

export function applyHistoryFilters() {
    HistoryState.filters = {
        periodo: document.getElementById('filter-periodo').value,
        categoria: document.getElementById('filter-history-categoria').value.trim(),
        palavra_chave: document.getElementById('filter-history-palavra-chave').value.trim()
    };
    loadHistory();
}

export function clearHistoryFilters() {
    document.getElementById('filter-periodo').value = '30';
    document.getElementById('filter-history-categoria').value = '';
    document.getElementById('filter-history-palavra-chave').value = '';
    applyHistoryFilters();
}

export function exportHistory() {
    if (HistoryState.items.length === 0) {
        showNotification('Não há tarefas concluídas para exportar.', 'warning');
        return;
    }
    
    // Criar CSV simples
    let csv = 'Título,Categoria,Prioridade,Data Limite,Descrição\n';
    HistoryState.items.forEach(task => {
        const row = [
            `"${task.titulo}"`,
            `"${task.categoria || ''}"`,
            `"${task.prioridade || ''}"`,
            `"${task.data_limite || ''}"`,
            `"${(task.descricao || '').replace(/"/g, '""')}"`
        ].join(',');
        csv += row + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tarefas_concluidas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Histórico exportado com sucesso!', 'success');
}
