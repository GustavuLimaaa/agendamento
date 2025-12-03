"""
Aplicação Flask principal - Sistema de Agendamento
"""
from flask import Flask, render_template
from database import init_database
from routes.tasks import tasks_bp
from routes.appointments import appointments_bp
from routes.dashboard import dashboard_bp
from utils.logger import setup_logger
import config

# Configurar logger
logger = setup_logger(__name__)

# Criar aplicação Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = config.SECRET_KEY

# Registrar blueprints
app.register_blueprint(tasks_bp)
app.register_blueprint(appointments_bp)
app.register_blueprint(dashboard_bp)

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.errorhandler(404)
def not_found(error):
    """Handler para erro 404"""
    logger.warning(f"Página não encontrada: {error}")
    return {'success': False, 'error': 'Recurso não encontrado'}, 404

@app.errorhandler(500)
def internal_error(error):
    """Handler para erro 500"""
    logger.error(f"Erro interno do servidor: {error}")
    return {'success': False, 'error': 'Erro interno do servidor'}, 500

if __name__ == '__main__':
    # Inicializar banco de dados
    logger.info("Iniciando aplicação...")
    init_database()
    
    # Iniciar servidor
    logger.info(f"Servidor rodando em http://{config.HOST}:{config.PORT}")
    app.run(
        host=config.HOST,
        port=config.PORT,
        debug=config.DEBUG
    )
