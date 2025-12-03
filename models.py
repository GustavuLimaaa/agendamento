"""
Modelos de dados para Tarefas e Compromissos
"""
import json
import sqlite3
from typing import List, Dict, Any, Optional, Union
from database import execute_query, execute_update
from utils.logger import setup_logger
from utils.validators import sanitize_string, sanitize_for_search
from config import TaskStatus, TaskPriority

logger = setup_logger(__name__)

class Task:
    """Modelo para Tarefas"""
    
    @staticmethod
    def create(data: Dict[str, Any]) -> int:
        """
        Cria uma nova tarefa
        
        Args:
            data: Dicionário com dados da tarefa
            
        Returns:
            ID da tarefa criada
        """
        try:
            query = '''
                INSERT INTO tarefas (
                    titulo, descricao, categoria, palavra_chave, prioridade,
                    status, data_limite, responsaveis, observacoes, checklist
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            '''
            
            checklist_json = json.dumps(data.get('checklist', [])) if data.get('checklist') else None
            
            # Garantir valores padrão válidos
            priority = data.get('prioridade', TaskPriority.MEDIA.value).lower()
            status = data.get('status', TaskStatus.PENDENTE.value).lower()
            
            params = (
                sanitize_string(data['titulo']),
                sanitize_string(data.get('descricao', '')),
                sanitize_string(data['categoria']),
                sanitize_string(data.get('palavra_chave', '')),
                priority,
                status,
                data.get('data_limite'),
                sanitize_string(data.get('responsaveis', '')),
                sanitize_string(data.get('observacoes', '')),
                checklist_json
            )
            
            task_id = execute_update(query, params)
            logger.info(f"Tarefa criada com ID: {task_id}")
            return task_id
        except Exception as e:
            logger.error(f"Erro ao criar tarefa: {e}")
            raise
    
    @staticmethod
    def get_all(filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Retorna todas as tarefas com filtros opcionais
        
        Args:
            filters: Dicionário com filtros (status, prioridade, categoria, palavra_chave)
            
        Returns:
            Lista de tarefas
        """
        try:
            query = 'SELECT * FROM tarefas WHERE 1=1'
            params = []
            
            if filters:
                if filters.get('status'):
                    query += ' AND status = ?'
                    params.append(filters['status'].lower())
                if filters.get('prioridade'):
                    query += ' AND prioridade = ?'
                    params.append(filters['prioridade'].lower())
                if filters.get('categoria'):
                    query += ' AND categoria LIKE ?'
                    # Sanitiza para busca literal (evita que usuário injete %)
                    safe_cat = sanitize_for_search(filters['categoria'])
                    params.append(f"%{safe_cat}%")
                if filters.get('palavra_chave'):
                    query += ' AND palavra_chave LIKE ?'
                    safe_kw = sanitize_for_search(filters['palavra_chave'])
                    params.append(f"%{safe_kw}%")
            
            # Ordenação personalizada
            query += ''' ORDER BY 
                CASE prioridade 
                    WHEN 'urgente' THEN 1 
                    WHEN 'alta' THEN 2 
                    WHEN 'media' THEN 3 
                    ELSE 4 
                END, 
                data_limite ASC
            '''
            
            rows = execute_query(query, params if params else None)
            return [Task._row_to_dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Erro ao buscar tarefas: {e}")
            raise
    
    @staticmethod
    def get_by_id(task_id: int) -> Optional[Dict[str, Any]]:
        """
        Retorna uma tarefa por ID
        
        Args:
            task_id: ID da tarefa
            
        Returns:
            Dicionário com dados da tarefa ou None
        """
        try:
            query = 'SELECT * FROM tarefas WHERE id = ?'
            rows = execute_query(query, (task_id,))
            return Task._row_to_dict(rows[0]) if rows else None
        except Exception as e:
            logger.error(f"Erro ao buscar tarefa {task_id}: {e}")
            raise
    
    @staticmethod
    def update(task_id: int, data: Dict[str, Any]) -> int:
        """
        Atualiza uma tarefa
        
        Args:
            task_id: ID da tarefa
            data: Dicionário com dados para atualizar
            
        Returns:
            Número de linhas afetadas
        """
        try:
            fields = []
            params = []
            
            allowed_fields = ['titulo', 'descricao', 'categoria', 'palavra_chave', 
                            'prioridade', 'status', 'data_limite', 'responsaveis', 
                            'observacoes', 'checklist']
            
            for field in allowed_fields:
                if field in data:
                    fields.append(f'{field} = ?')
                    if field == 'checklist':
                        params.append(json.dumps(data[field]) if data[field] else None)
                    elif field in ['prioridade', 'status']:
                        params.append(data[field].lower())
                    else:
                        val = data[field]
                        params.append(sanitize_string(val) if isinstance(val, str) else val)
            
            if not fields:
                return 0
            
            fields.append('atualizado_em = CURRENT_TIMESTAMP')
            params.append(task_id)
            
            query = f"UPDATE tarefas SET {', '.join(fields)} WHERE id = ?"
            result = execute_update(query, params)
            logger.info(f"Tarefa {task_id} atualizada")
            return result
        except Exception as e:
            logger.error(f"Erro ao atualizar tarefa {task_id}: {e}")
            raise
    
    @staticmethod
    def delete(task_id: int) -> int:
        """
        Deleta uma tarefa
        
        Args:
            task_id: ID da tarefa
            
        Returns:
            Número de linhas afetadas
        """
        try:
            query = 'DELETE FROM tarefas WHERE id = ?'
            result = execute_update(query, (task_id,))
            logger.info(f"Tarefa {task_id} deletada")
            return result
        except Exception as e:
            logger.error(f"Erro ao deletar tarefa {task_id}: {e}")
            raise
    
    @staticmethod
    def get_completed() -> List[Dict[str, Any]]:
        """
        Retorna histórico de tarefas concluídas
        
        Returns:
            Lista de tarefas concluídas
        """
        try:
            query = 'SELECT * FROM tarefas WHERE status = ? ORDER BY atualizado_em DESC'
            rows = execute_query(query, (TaskStatus.CONCLUIDA.value,))
            return [Task._row_to_dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Erro ao buscar tarefas concluídas: {e}")
            raise
    
    @staticmethod
    def _row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
        """Converte uma row do SQLite para dicionário"""
        data = dict(row)
        if data.get('checklist'):
            try:
                data['checklist'] = json.loads(data['checklist'])
            except:
                data['checklist'] = []
        return data


class Appointment:
    """Modelo para Compromissos"""
    
    @staticmethod
    def create(data: Dict[str, Any]) -> int:
        """
        Cria um novo compromisso
        
        Args:
            data: Dicionário com dados do compromisso
            
        Returns:
            ID do compromisso criado
        """
        try:
            query = '''
                INSERT INTO compromissos (
                    titulo, participantes, assunto_principal, palavra_chave,
                    local_link, data, horario_inicio, horario_fim, objetivo,
                    lembretes, notas_reuniao, proximos_passos
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            '''
            
            params = (
                sanitize_string(data['titulo']),
                sanitize_string(data.get('participantes', '')),
                sanitize_string(data.get('assunto_principal', '')),
                sanitize_string(data.get('palavra_chave', '')),
                sanitize_string(data.get('local_link', '')),
                data['data'],
                data['horario_inicio'],
                data['horario_fim'],
                sanitize_string(data.get('objetivo', '')),
                sanitize_string(data.get('lembretes', '')),
                sanitize_string(data.get('notas_reuniao', '')),
                sanitize_string(data.get('proximos_passos', ''))
            )
            
            appointment_id = execute_update(query, params)
            logger.info(f"Compromisso criado com ID: {appointment_id}")
            return appointment_id
        except Exception as e:
            logger.error(f"Erro ao criar compromisso: {e}")
            raise
    
    @staticmethod
    def get_all(filters: Optional[Dict[str, Any]] = None, page: Optional[int] = None, per_page: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Retorna todos os compromissos com filtros opcionais e paginação
        
        Args:
            filters: Dicionário com filtros (data_inicio, data_fim, palavra_chave)
            page: Número da página (opcional)
            per_page: Itens por página (opcional)
            
        Returns:
            Lista de compromissos
        """
        try:
            query = 'SELECT * FROM compromissos WHERE 1=1'
            params = []
            
            if filters:
                if filters.get('data_inicio'):
                    query += ' AND data >= ?'
                    params.append(filters['data_inicio'])
                if filters.get('data_fim'):
                    query += ' AND data <= ?'
                    params.append(filters['data_fim'])
                if filters.get('palavra_chave'):
                    safe_kw = sanitize_for_search(filters['palavra_chave'])
                    query += ' AND (palavra_chave LIKE ? OR titulo LIKE ?)'
                    params.append(f"%{safe_kw}%")
                    params.append(f"%{safe_kw}%")
            
            query += ' ORDER BY data ASC, horario_inicio ASC'
            
            # Paginação
            if page is not None and per_page is not None:
                try:
                    page = int(page)
                    per_page = int(per_page)
                    offset = (page - 1) * per_page
                    query += ' LIMIT ? OFFSET ?'
                    params.append(per_page)
                    params.append(offset)
                except ValueError:
                    pass
            
            rows = execute_query(query, params if params else None)
            return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Erro ao buscar compromissos: {e}")
            raise
    
    @staticmethod
    def get_by_id(appointment_id: int) -> Optional[Dict[str, Any]]:
        """
        Retorna um compromisso por ID
        
        Args:
            appointment_id: ID do compromisso
            
        Returns:
            Dicionário com dados do compromisso ou None
        """
        try:
            query = 'SELECT * FROM compromissos WHERE id = ?'
            rows = execute_query(query, (appointment_id,))
            return dict(rows[0]) if rows else None
        except Exception as e:
            logger.error(f"Erro ao buscar compromisso {appointment_id}: {e}")
            raise
    
    @staticmethod
    def update(appointment_id: int, data: Dict[str, Any]) -> int:
        """
        Atualiza um compromisso
        
        Args:
            appointment_id: ID do compromisso
            data: Dicionário com dados para atualizar
            
        Returns:
            Número de linhas afetadas
        """
        try:
            fields = []
            params = []
            
            allowed_fields = ['titulo', 'participantes', 'assunto_principal', 'palavra_chave',
                            'local_link', 'data', 'horario_inicio', 'horario_fim', 'objetivo',
                            'lembretes', 'notas_reuniao', 'proximos_passos']
            
            for field in allowed_fields:
                if field in data:
                    fields.append(f'{field} = ?')
                    val = data[field]
                    params.append(sanitize_string(val) if isinstance(val, str) else val)
            
            if not fields:
                return 0
            
            fields.append('atualizado_em = CURRENT_TIMESTAMP')
            params.append(appointment_id)
            
            query = f"UPDATE compromissos SET {', '.join(fields)} WHERE id = ?"
            result = execute_update(query, params)
            logger.info(f"Compromisso {appointment_id} atualizado")
            return result
        except Exception as e:
            logger.error(f"Erro ao atualizar compromisso {appointment_id}: {e}")
            raise
    
    @staticmethod
    def delete(appointment_id: int) -> int:
        """
        Deleta um compromisso
        
        Args:
            appointment_id: ID do compromisso
            
        Returns:
            Número de linhas afetadas
        """
        try:
            query = 'DELETE FROM compromissos WHERE id = ?'
            result = execute_update(query, (appointment_id,))
            logger.info(f"Compromisso {appointment_id} deletado. Linhas afetadas: {result}")
            return result
        except Exception as e:
            logger.error(f"Erro ao deletar compromisso {appointment_id}: {e}")
            raise
    
    @staticmethod
    def generate_next_steps(appointment_id: int, notes: str) -> str:
        """
        Gera próximos passos baseado nas notas da reunião
        
        Args:
            appointment_id: ID do compromisso
            notes: Notas da reunião
            
        Returns:
            String com próximos passos sugeridos
        """
        try:
            if not notes:
                return ""

            # Lógica simples de geração de próximos passos
            next_steps = []
            
            keywords = {
                'decisão': 'Documentar decisão tomada',
                'ação': 'Definir responsável e prazo',
                'pendência': 'Acompanhar pendência',
                'prazo': 'Adicionar ao calendário',
                'revisar': 'Agendar revisão',
                'aprovar': 'Solicitar aprovação',
                'agendar': 'Agendar nova reunião',
                'enviar': 'Enviar material/email',
            }
            
            notes_lower = notes.lower()
            for keyword, action in keywords.items():
                if keyword in notes_lower:
                    next_steps.append(f"• {action}")
            
            if not next_steps:
                next_steps.append("• Revisar notas da reunião")
                next_steps.append("• Definir próximas ações")
            
            generated = '\n'.join(next_steps)
            
            # Atualizar compromisso com próximos passos
            Appointment.update(appointment_id, {'proximos_passos': generated})
            
            logger.info(f"Próximos passos gerados para compromisso {appointment_id}")
            return generated
        except Exception as e:
            logger.error(f"Erro ao gerar próximos passos: {e}")
            raise
