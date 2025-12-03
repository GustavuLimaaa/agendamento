"""
Gerenciamento de banco de dados SQLite
"""
import sqlite3
from contextlib import contextmanager
from typing import Generator, Any, List, Optional, Union, Tuple
import config
from utils.logger import setup_logger

logger = setup_logger(__name__)

@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """
    Context manager para conexão com o banco de dados
    
    Yields:
        sqlite3.Connection: Conexão com o banco
    """
    conn = None
    try:
        conn = sqlite3.connect(config.DATABASE_PATH)
        conn.row_factory = sqlite3.Row  # Permite acessar colunas por nome
        yield conn
        conn.commit()
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        logger.error(f"Erro no banco de dados: {e}")
        raise
    finally:
        if conn:
            conn.close()

def init_database() -> None:
    """
    Inicializa o banco de dados criando as tabelas necessárias
    """
    logger.info("Inicializando banco de dados...")
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Tabela de Tarefas
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS tarefas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    titulo TEXT NOT NULL,
                    descricao TEXT,
                    categoria TEXT NOT NULL,
                    palavra_chave TEXT,
                    prioridade TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pendente',
                    data_limite TEXT,
                    responsaveis TEXT,
                    observacoes TEXT,
                    checklist TEXT,
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Tabela de Compromissos
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS compromissos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    titulo TEXT NOT NULL,
                    participantes TEXT,
                    assunto_principal TEXT,
                    palavra_chave TEXT,
                    local_link TEXT,
                    data TEXT NOT NULL,
                    horario_inicio TEXT NOT NULL,
                    horario_fim TEXT NOT NULL,
                    objetivo TEXT,
                    lembretes TEXT,
                    notas_reuniao TEXT,
                    proximos_passos TEXT,
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Índices para melhor performance
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas(status)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_tarefas_prioridade ON tarefas(prioridade)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_tarefas_categoria ON tarefas(categoria)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_tarefas_palavra_chave ON tarefas(palavra_chave)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_compromissos_data ON compromissos(data)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_compromissos_palavra_chave ON compromissos(palavra_chave)')
            
            logger.info("Banco de dados inicializado com sucesso")
    except Exception as e:
        logger.critical(f"Falha crítica ao inicializar banco de dados: {e}")
        raise

def execute_query(query: str, params: Optional[Union[List, Tuple]] = None) -> List[sqlite3.Row]:
    """
    Executa uma query SELECT e retorna os resultados
    
    Args:
        query: Query SQL
        params: Parâmetros da query (opcional)
        
    Returns:
        Lista de resultados
    """
    if params is not None and not isinstance(params, (list, tuple)):
        raise ValueError("Params deve ser uma lista ou tupla")

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            return cursor.fetchall()
    except sqlite3.Error as e:
        logger.error(f"Erro ao executar query: {e}")
        raise

def execute_update(query: str, params: Optional[Union[List, Tuple]] = None) -> int:
    """
    Executa uma query INSERT/UPDATE/DELETE
    
    Args:
        query: Query SQL
        params: Parâmetros da query (opcional)
        
    Returns:
        ID do último registro inserido ou número de linhas afetadas
    """
    if params is not None and not isinstance(params, (list, tuple)):
        raise ValueError("Params deve ser uma lista ou tupla")

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            return cursor.lastrowid if cursor.lastrowid else cursor.rowcount
    except sqlite3.Error as e:
        logger.error(f"Erro ao executar update: {e}")
        raise
