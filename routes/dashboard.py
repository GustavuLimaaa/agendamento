"""
Rotas para dashboard e estatísticas
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from models import Task, Appointment
from utils.logger import setup_logger

logger = setup_logger(__name__)
dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/dashboard/stats', methods=['GET'])
def get_stats():
    """Retorna estatísticas gerais do sistema"""
    try:
        # Buscar todas as tarefas
        all_tasks = Task.get_all()
        
        # Contar por status
        status_counts = {
            'pendente': 0,
            'em_andamento': 0,
            'concluida': 0,
            'adiada': 0
        }
        
        for task in all_tasks:
            status = task.get('status', 'pendente')
            if status in status_counts:
                status_counts[status] += 1
        
        # Contar por prioridade
        priority_counts = {
            'urgente': 0,
            'alta': 0,
            'media': 0,
            'baixa': 0
        }
        
        for task in all_tasks:
            priority = task.get('prioridade', 'media')
            if priority in priority_counts:
                priority_counts[priority] += 1
        
        # Contar por categoria
        category_counts = {}
        for task in all_tasks:
            category = task.get('categoria', 'Sem categoria')
            category_counts[category] = category_counts.get(category, 0) + 1
        
        # Buscar compromissos
        all_appointments = Appointment.get_all()
        
        # Compromissos hoje
        today = datetime.now().strftime('%Y-%m-%d')
        today_appointments = [a for a in all_appointments if a.get('data', '').strip() == today]
        
        # Compromissos próximos 7 dias
        week_later = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
        upcoming_appointments = [
            a for a in all_appointments 
            if today <= a.get('data', '') <= week_later
        ]
        
        stats = {
            'tarefas': {
                'total': len(all_tasks),
                'por_status': status_counts,
                'por_prioridade': priority_counts,
                'por_categoria': category_counts
            },
            'compromissos': {
                'total': len(all_appointments),
                'hoje': len(today_appointments),
                'proximos_7_dias': len(upcoming_appointments)
            }
        }
        
        return jsonify({'success': True, 'data': stats}), 200
    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@dashboard_bp.route('/api/dashboard/urgent', methods=['GET'])
def get_urgent_items():
    """Retorna itens urgentes (tarefas urgentes e compromissos próximos)"""
    try:
        # Tarefas urgentes ou com prazo próximo
        all_tasks = Task.get_all()
        urgent_tasks = []
        
        today = datetime.now()
        
        for task in all_tasks:
            if task.get('status') == 'concluida':
                continue
                
            is_urgent = False
            
            # Prioridade urgente
            if task.get('prioridade') == 'urgente':
                is_urgent = True
            
            # Data limite próxima (3 dias)
            if task.get('data_limite'):
                try:
                    deadline = datetime.fromisoformat(task['data_limite'].replace('Z', '+00:00'))
                    days_until = (deadline - today).days
                    if days_until <= 3:
                        is_urgent = True
                except:
                    pass
            
            if is_urgent:
                urgent_tasks.append(task)
        
        # Compromissos próximos (hoje e amanhã)
        tomorrow = (today + timedelta(days=1)).strftime('%Y-%m-%d')
        today_str = today.strftime('%Y-%m-%d')
        
        all_appointments = Appointment.get_all()
        upcoming_appointments = [
            a for a in all_appointments 
            if a.get('data') in [today_str, tomorrow]
        ]
        
        return jsonify({
            'success': True, 
            'data': {
                'tarefas_urgentes': urgent_tasks,
                'compromissos_proximos': upcoming_appointments
            }
        }), 200
    except Exception as e:
        logger.error(f"Erro ao buscar itens urgentes: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@dashboard_bp.route('/api/dashboard/calendar', methods=['GET'])
def get_calendar_data():
    """Retorna dados para visualização de calendário mensal"""
    try:
        # Parâmetros de data (mês/ano)
        year = request.args.get('year', datetime.now().year, type=int)
        month = request.args.get('month', datetime.now().month, type=int)
        
        # Primeiro e último dia do mês
        first_day = datetime(year, month, 1).strftime('%Y-%m-%d')
        if month == 12:
            last_day = datetime(year, 12, 31).strftime('%Y-%m-%d')
        else:
            last_day = (datetime(year, month + 1, 1) - timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Buscar compromissos do mês
        appointments = Appointment.get_all({
            'data_inicio': first_day,
            'data_fim': last_day
        })
        
        # Buscar tarefas com prazo no mês
        all_tasks = Task.get_all()
        month_tasks = []
        
        for task in all_tasks:
            if task.get('data_limite'):
                try:
                    deadline_date = datetime.fromisoformat(task['data_limite'].replace('Z', '+00:00')).strftime('%Y-%m-%d')
                    if first_day <= deadline_date <= last_day:
                        month_tasks.append(task)
                except:
                    pass
        
        # Organizar por dia
        calendar_data = {}
        
        for appointment in appointments:
            date = appointment.get('data')
            if date not in calendar_data:
                calendar_data[date] = {'compromissos': [], 'tarefas': []}
            calendar_data[date]['compromissos'].append(appointment)
        
        for task in month_tasks:
            try:
                date = datetime.fromisoformat(task['data_limite'].replace('Z', '+00:00')).strftime('%Y-%m-%d')
                if date not in calendar_data:
                    calendar_data[date] = {'compromissos': [], 'tarefas': []}
                calendar_data[date]['tarefas'].append(task)
            except:
                pass
        
        return jsonify({'success': True, 'data': calendar_data}), 200
    except Exception as e:
        logger.error(f"Erro ao buscar dados do calendário: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
