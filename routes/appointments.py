"""
Rotas para gerenciamento de compromissos
"""
from flask import Blueprint, request, jsonify
from models import Appointment
from utils.logger import setup_logger
from utils.validators import validate_appointment_data

logger = setup_logger(__name__)
appointments_bp = Blueprint('appointments', __name__)

@appointments_bp.route('/api/appointments', methods=['GET'])
def get_appointments():
    """Lista todos os compromissos com filtros opcionais e paginação"""
    try:
        filters = {
            'data_inicio': request.args.get('data_inicio'),
            'data_fim': request.args.get('data_fim'),
            'palavra_chave': request.args.get('palavra_chave')
        }
        
        # Paginação
        page = request.args.get('page')
        per_page = request.args.get('per_page')
        
        # Remove filtros vazios
        filters = {k: v for k, v in filters.items() if v}
        
        appointments = Appointment.get_all(filters if filters else None, page, per_page)
        
        return jsonify({
            'success': True, 
            'data': appointments,
            'meta': {
                'page': int(page) if page else 1,
                'per_page': int(per_page) if per_page else len(appointments)
            }
        }), 200
    except Exception as e:
        logger.error(f"Erro ao listar compromissos: {e}")
        return jsonify({'success': False, 'error': 'Erro interno ao listar compromissos'}), 500

@appointments_bp.route('/api/appointments/<int:appointment_id>', methods=['GET'])
def get_appointment(appointment_id):
    """Retorna um compromisso específico"""
    try:
        appointment = Appointment.get_by_id(appointment_id)
        if not appointment:
            return jsonify({'success': False, 'error': 'Compromisso não encontrado'}), 404
        return jsonify({'success': True, 'data': appointment}), 200
    except Exception as e:
        logger.error(f"Erro ao buscar compromisso {appointment_id}: {e}")
        return jsonify({'success': False, 'error': 'Erro interno ao buscar compromisso'}), 500

@appointments_bp.route('/api/appointments', methods=['POST'])
def create_appointment():
    """Cria um novo compromisso"""
    try:
        if not request.is_json:
            return jsonify({'success': False, 'error': 'Content-Type deve ser application/json'}), 415
            
        data = request.get_json()
        
        # Validar dados
        is_valid, errors = validate_appointment_data(data)
        if not is_valid:
            return jsonify({'success': False, 'errors': errors}), 400
        
        appointment_id = Appointment.create(data)
        appointment = Appointment.get_by_id(appointment_id)
        
        return jsonify({'success': True, 'data': appointment}), 201
    except Exception as e:
        logger.error(f"Erro ao criar compromisso: {e}")
        return jsonify({'success': False, 'error': 'Erro interno ao criar compromisso'}), 500

@appointments_bp.route('/api/appointments/<int:appointment_id>', methods=['PUT'])
def update_appointment(appointment_id):
    """Atualiza um compromisso"""
    try:
        if not request.is_json:
            return jsonify({'success': False, 'error': 'Content-Type deve ser application/json'}), 415
            
        data = request.get_json()
        
        # Verificar se compromisso existe
        existing = Appointment.get_by_id(appointment_id)
        if not existing:
            return jsonify({'success': False, 'error': 'Compromisso não encontrado'}), 404
        
        # Mesclar dados existentes com novos para validação completa
        merged_data = {**existing, **data}
        
        # Validar dados completos
        is_valid, errors = validate_appointment_data(merged_data)
        if not is_valid:
            return jsonify({'success': False, 'errors': errors}), 400
        
        Appointment.update(appointment_id, data)
        appointment = Appointment.get_by_id(appointment_id)
        
        return jsonify({'success': True, 'data': appointment}), 200
    except Exception as e:
        logger.error(f"Erro ao atualizar compromisso {appointment_id}: {e}")
        return jsonify({'success': False, 'error': 'Erro interno ao atualizar compromisso'}), 500

@appointments_bp.route('/api/appointments/<int:appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    """Deleta um compromisso"""
    try:
        # Race condition fix: Tenta deletar diretamente e verifica linhas afetadas
        rows_affected = Appointment.delete(appointment_id)
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'Compromisso não encontrado'}), 404
        
        return jsonify({'success': True, 'message': 'Compromisso deletado com sucesso'}), 200
    except Exception as e:
        logger.error(f"Erro ao deletar compromisso {appointment_id}: {e}")
        return jsonify({'success': False, 'error': 'Erro interno ao deletar compromisso'}), 500

@appointments_bp.route('/api/appointments/<int:appointment_id>/next-steps', methods=['POST'])
def generate_next_steps(appointment_id):
    """Gera próximos passos baseado nas notas da reunião"""
    try:
        if not request.is_json:
            return jsonify({'success': False, 'error': 'Content-Type deve ser application/json'}), 415
            
        data = request.get_json()
        
        if 'notas_reuniao' not in data:
            return jsonify({'success': False, 'error': 'Notas da reunião não fornecidas'}), 400
        
        # Verificar existência antes de gerar
        appointment = Appointment.get_by_id(appointment_id)
        if not appointment:
            return jsonify({'success': False, 'error': 'Compromisso não encontrado'}), 404
        
        next_steps = Appointment.generate_next_steps(appointment_id, data['notas_reuniao'])
        
        return jsonify({'success': True, 'data': {'proximos_passos': next_steps}}), 200
    except Exception as e:
        logger.error(f"Erro ao gerar próximos passos: {e}")
        return jsonify({'success': False, 'error': 'Erro interno ao gerar próximos passos'}), 500
