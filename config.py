"""
Configurações da aplicação
"""
import os
from enum import Enum

# Configurações Gerais
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, 'agendamento.db')
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.environ.get('FLASK_DEBUG', '0') == '1'
HOST = os.environ.get('FLASK_HOST', '127.0.0.1')
PORT = int(os.environ.get('FLASK_PORT', 5000))

# Constantes de Negócio
class TaskStatus(str, Enum):
    PENDENTE = 'pendente'
    EM_ANDAMENTO = 'em_andamento'
    CONCLUIDA = 'concluida'
    ADIADA = 'adiada'

class TaskPriority(str, Enum):
    URGENTE = 'urgente'
    ALTA = 'alta'
    MEDIA = 'media'
    BAIXA = 'baixa'

# Configurações de Log
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
LOG_FILE = os.path.join(BASE_DIR, 'app.log')
LOG_MAX_BYTES = 10 * 1024 * 1024  # 10 MB
LOG_BACKUP_COUNT = 5
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
