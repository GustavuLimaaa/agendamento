"""
Rotas para gerenciamento de tarefas
"""
from flask import Blueprint, request, jsonify
from models import Task
from utils.logger import setup_logger
from utils.validators import validate_task_data

logger = setup_logger(__name__)
tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Lista todas as tarefas com filtros opcionais"""
    try:
        filters = {
            'status': request.args.get('status'),
            'prioridade': request.args.get('prioridade'),
            'categoria': request.args.get('categoria'),
            'palavra_chave': request.args.get('palavra_chave')
        }
        
        # Remove filtros vazios
        filters = {k: v for k, v in filters.items() if v}
        
        tasks = Task.get_all(filters if filters else None)
        return jsonify({'success': True, 'data': tasks}), 200
    except Exception as e:
        logger.error(f"Erro ao listar tarefas: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@tasks_bp.route('/api/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    """Retorna uma tarefa específica"""
    try:
        task = Task.get_by_id(task_id)
        if not task:
            return jsonify({'success': False, 'error': 'Tarefa não encontrada'}), 404
        return jsonify({'success': True, 'data': task}), 200
    except Exception as e:
        logger.error(f"Erro ao buscar tarefa {task_id}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@tasks_bp.route('/api/tasks', methods=['POST'])
def create_task():
    """Cria uma nova tarefa"""
    try:
        data = request.get_json()
        
        # Validar dados
        is_valid, errors = validate_task_data(data)
        if not is_valid:
            return jsonify({'success': False, 'errors': errors}), 400
        
        task_id = Task.create(data)
        task = Task.get_by_id(task_id)
        
        return jsonify({'success': True, 'data': task}), 201
    except Exception as e:
        logger.error(f"Erro ao criar tarefa: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@tasks_bp.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Atualiza uma tarefa"""
    try:
        data = request.get_json()
        
        # Verificar se tarefa existe
        if not Task.get_by_id(task_id):
            return jsonify({'success': False, 'error': 'Tarefa não encontrada'}), 404
        
        # Validar dados se campos obrigatórios estiverem presentes
        if any(k in data for k in ['titulo', 'categoria', 'prioridade', 'status']):
            existing = Task.get_by_id(task_id)
            merged_data = {**existing, **data}
            is_valid, errors = validate_task_data(merged_data)
            if not is_valid:
                return jsonify({'success': False, 'errors': errors}), 400
        
        Task.update(task_id, data)
        task = Task.get_by_id(task_id)
        
        return jsonify({'success': True, 'data': task}), 200
    except Exception as e:
        logger.error(f"Erro ao atualizar tarefa {task_id}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@tasks_bp.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Deleta uma tarefa"""
    try:
        if not Task.get_by_id(task_id):
            return jsonify({'success': False, 'error': 'Tarefa não encontrada'}), 404
        
        Task.delete(task_id)
        return jsonify({'success': True, 'message': 'Tarefa deletada com sucesso'}), 200
    except Exception as e:
        logger.error(f"Erro ao deletar tarefa {task_id}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@tasks_bp.route('/api/tasks/<int:task_id>/status', methods=['PATCH'])
def update_task_status(task_id):
    """Atualiza apenas o status de uma tarefa"""
    try:
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'success': False, 'error': 'Status não fornecido'}), 400
        
        if not Task.get_by_id(task_id):
            return jsonify({'success': False, 'error': 'Tarefa não encontrada'}), 404
        
        valid_statuses = ['pendente', 'em_andamento', 'concluida', 'adiada']
        if data['status'].lower() not in valid_statuses:
            return jsonify({'success': False, 'error': f'Status inválido. Use: {", ".join(valid_statuses)}'}), 400
        
        Task.update(task_id, {'status': data['status']})
        task = Task.get_by_id(task_id)
        
        return jsonify({'success': True, 'data': task}), 200
    except Exception as e:
        logger.error(f"Erro ao atualizar status da tarefa {task_id}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@tasks_bp.route('/api/tasks/completed', methods=['GET'])
def get_completed_tasks():
    """Retorna histórico de tarefas concluídas"""
    try:
        tasks = Task.get_completed()
        return jsonify({'success': True, 'data': tasks}), 200
    except Exception as e:
        logger.error(f"Erro ao buscar tarefas concluídas: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
