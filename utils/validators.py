"""
Validadores de dados para tarefas e compromissos
"""
import re
from datetime import datetime
from typing import Tuple, Dict, Any, List, Optional
from config import TaskStatus, TaskPriority
from utils.logger import setup_logger

logger = setup_logger(__name__)

def validate_task_data(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Valida dados de uma tarefa
    
    Args:
        data: Dicionário com dados da tarefa
        
    Returns:
        tuple: (is_valid, errors)
    """
    errors = []
    
    # Campos obrigatórios
    required_fields = ['titulo', 'categoria', 'prioridade', 'status']
    for field in required_fields:
        if not data.get(field):
            errors.append(f"Campo '{field}' é obrigatório")
    
    # Validar prioridade
    if data.get('prioridade'):
        try:
            TaskPriority(data['prioridade'].lower())
        except ValueError:
            valid = [p.value for p in TaskPriority]
            errors.append(f"Prioridade inválida. Deve ser uma de: {', '.join(valid)}")
    
    # Validar status
    if data.get('status'):
        try:
            TaskStatus(data['status'].lower())
        except ValueError:
            valid = [s.value for s in TaskStatus]
            errors.append(f"Status inválido. Deve ser um de: {', '.join(valid)}")
    
    # Validar data limite (se fornecida)
    if data.get('data_limite'):
        try:
            # Aceita YYYY-MM-DD
            datetime.strptime(data['data_limite'], '%Y-%m-%d')
        except ValueError:
            errors.append("Data limite inválida. Use formato YYYY-MM-DD")
    
    if errors:
        logger.warning(f"Validação de tarefa falhou: {errors}")
        return False, errors
    
    return True, []

def validate_appointment_data(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Valida dados de um compromisso
    
    Args:
        data: Dicionário com dados do compromisso
        
    Returns:
        tuple: (is_valid, errors)
    """
    errors = []
    
    # Campos obrigatórios
    required_fields = ['titulo', 'data', 'horario_inicio', 'horario_fim']
    for field in required_fields:
        if not data.get(field):
            errors.append(f"Campo '{field}' é obrigatório")
    
    # Validar data
    if data.get('data'):
        try:
            datetime.strptime(data['data'], '%Y-%m-%d')
        except ValueError:
            errors.append("Data inválida. Use formato YYYY-MM-DD")
    
    # Validar horários
    if data.get('horario_inicio') and data.get('horario_fim'):
        try:
            inicio = datetime.strptime(data['horario_inicio'], '%H:%M')
            fim = datetime.strptime(data['horario_fim'], '%H:%M')
            if fim <= inicio:
                errors.append("Horário de fim deve ser posterior ao horário de início")
        except ValueError:
            errors.append("Horários inválidos. Use formato HH:MM")
    
    if errors:
        logger.warning(f"Validação de compromisso falhou: {errors}")
        return False, errors
    
    return True, []

def sanitize_string(value: Any) -> str:
    """
    Sanitiza uma string removendo caracteres perigosos e espaços extras
    
    Args:
        value: Valor para sanitizar
        
    Returns:
        String sanitizada
    """
    if value is None:
        return ""
    
    # Converter para string
    s_value = str(value)
    
    # Remove caracteres nulos
    s_value = s_value.replace('\x00', '')
    
    # Remove tags HTML básicas (para evitar XSS armazenado simples, 
    # embora o frontend deva sempre escapar)
    s_value = re.sub(r'<[^>]*>', '', s_value)
    
    return s_value.strip()[:2000]  # Aumentado limite para 2000

def sanitize_for_search(value: str) -> str:
    """
    Escapa caracteres curinga SQL (% e _) para uso em buscas LIKE literais
    
    Args:
        value: String de busca
        
    Returns:
        String segura para LIKE
    """
    if not value:
        return ""
    return value.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')
