"""
Script para popular o banco de dados com dados de exemplo
"""
from datetime import datetime, timedelta
from models import Task, Appointment
from database import init_database
from utils.logger import setup_logger

logger = setup_logger(__name__)

def seed_tasks():
    """Cria tarefas de exemplo"""
    logger.info("Criando tarefas de exemplo...")
    
    tasks_data = [
        {
            'titulo': 'Implementar autenticação de usuários',
            'descricao': 'Adicionar sistema de login e registro com JWT',
            'categoria': 'Desenvolvimento',
            'palavra_chave': 'BACKEND',
            'prioridade': 'alta',
            'status': 'em_andamento',
            'data_limite': (datetime.now() + timedelta(days=5)).strftime('%Y-%m-%d'),
            'responsaveis': 'João Silva, Maria Santos',
            'observacoes': 'Usar biblioteca Flask-JWT-Extended'
        },
        {
            'titulo': 'Revisar documentação do projeto',
            'descricao': 'Atualizar README e adicionar exemplos de uso',
            'categoria': 'Documentação',
            'palavra_chave': 'DOCS',
            'prioridade': 'media',
            'status': 'pendente',
            'data_limite': (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'),
            'responsaveis': 'Ana Costa',
            'observacoes': 'Incluir diagramas de arquitetura'
        },
        {
            'titulo': 'Corrigir bug no formulário de cadastro',
            'descricao': 'Validação de email não está funcionando corretamente',
            'categoria': 'Bug Fix',
            'palavra_chave': 'URGENTE',
            'prioridade': 'urgente',
            'status': 'pendente',
            'data_limite': (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
            'responsaveis': 'Pedro Oliveira',
            'observacoes': 'Reportado por cliente premium'
        },
        {
            'titulo': 'Otimizar queries do banco de dados',
            'descricao': 'Adicionar índices e melhorar performance das consultas',
            'categoria': 'Performance',
            'palavra_chave': 'OTIMIZAÇÃO',
            'prioridade': 'media',
            'status': 'adiada',
            'data_limite': (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d'),
            'responsaveis': 'Carlos Mendes',
            'observacoes': 'Aguardando aprovação do time de infra'
        },
        {
            'titulo': 'Criar testes unitários para módulo de pagamentos',
            'descricao': 'Cobertura de testes deve ser maior que 80%',
            'categoria': 'Testes',
            'palavra_chave': 'QUALIDADE',
            'prioridade': 'alta',
            'status': 'em_andamento',
            'data_limite': (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d'),
            'responsaveis': 'Juliana Ferreira',
            'observacoes': 'Usar pytest e mock para APIs externas'
        },
        {
            'titulo': 'Implementar dashboard de analytics',
            'descricao': 'Criar visualizações de métricas de uso do sistema',
            'categoria': 'Feature',
            'palavra_chave': 'ANALYTICS',
            'prioridade': 'baixa',
            'status': 'pendente',
            'data_limite': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
            'responsaveis': 'Roberto Lima',
            'observacoes': 'Usar biblioteca de gráficos Chart.js'
        },
        {
            'titulo': 'Migração para Python 3.12',
            'descricao': 'Atualizar código para compatibilidade com Python 3.12',
            'categoria': 'Manutenção',
            'palavra_chave': 'UPGRADE',
            'prioridade': 'media',
            'status': 'concluida',
            'data_limite': (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d'),
            'responsaveis': 'Equipe DevOps',
            'observacoes': 'Concluído com sucesso, todos os testes passando'
        }
    ]
    
    for task_data in tasks_data:
        try:
            Task.create(task_data)
            logger.info(f"Tarefa criada: {task_data['titulo']}")
        except Exception as e:
            logger.error(f"Erro ao criar tarefa: {e}")

def seed_appointments():
    """Cria compromissos de exemplo"""
    logger.info("Criando compromissos de exemplo...")
    
    appointments_data = [
        {
            'titulo': 'Reunião de Planning Sprint 15',
            'participantes': 'Time de Desenvolvimento, Product Owner, Scrum Master',
            'assunto_principal': 'Planejamento das tarefas da próxima sprint',
            'palavra_chave': 'SPRINT',
            'local_link': 'https://meet.google.com/abc-defg-hij',
            'data': (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
            'horario_inicio': '09:00',
            'horario_fim': '11:00',
            'objetivo': 'Definir escopo da sprint 15 e estimar tarefas',
            'lembretes': '1 hora antes, 1 dia antes',
            'notas_reuniao': '',
            'proximos_passos': ''
        },
        {
            'titulo': 'Review com Cliente - Projeto X',
            'participantes': 'Cliente ABC, Gerente de Projeto, Tech Lead',
            'assunto_principal': 'Apresentação do progresso do projeto',
            'palavra_chave': 'CLIENTE',
            'local_link': 'Sala de Reuniões 3 - Escritório',
            'data': datetime.now().strftime('%Y-%m-%d'),
            'horario_inicio': '14:00',
            'horario_fim': '15:30',
            'objetivo': 'Demonstrar funcionalidades implementadas e coletar feedback',
            'lembretes': '30 minutos antes',
            'notas_reuniao': 'Cliente aprovou as funcionalidades. Solicitou ajustes no design da tela de login.',
            'proximos_passos': '• Ajustar design da tela de login\n• Agendar próxima revisão para semana que vem'
        },
        {
            'titulo': 'Daily Standup',
            'participantes': 'Time de Desenvolvimento',
            'assunto_principal': 'Sincronização diária do time',
            'palavra_chave': 'DAILY',
            'local_link': 'https://meet.google.com/daily-standup',
            'data': datetime.now().strftime('%Y-%m-%d'),
            'horario_inicio': '09:30',
            'horario_fim': '09:45',
            'objetivo': 'Compartilhar progresso e identificar impedimentos',
            'lembretes': '5 minutos antes',
            'notas_reuniao': '',
            'proximos_passos': ''
        },
        {
            'titulo': 'Workshop de Arquitetura de Software',
            'participantes': 'Arquitetos, Tech Leads, Desenvolvedores Sênior',
            'assunto_principal': 'Discussão sobre padrões de arquitetura',
            'palavra_chave': 'WORKSHOP',
            'local_link': 'Auditório Principal',
            'data': (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'),
            'horario_inicio': '13:00',
            'horario_fim': '17:00',
            'objetivo': 'Definir padrões de arquitetura para novos projetos',
            'lembretes': '1 dia antes, 2 horas antes',
            'notas_reuniao': '',
            'proximos_passos': ''
        },
        {
            'titulo': 'Entrevista - Desenvolvedor Backend',
            'participantes': 'RH, Tech Lead Backend, Desenvolvedor Sênior',
            'assunto_principal': 'Entrevista técnica para vaga de backend',
            'palavra_chave': 'RECRUTAMENTO',
            'local_link': 'https://meet.google.com/interview-123',
            'data': (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d'),
            'horario_inicio': '10:00',
            'horario_fim': '11:30',
            'objetivo': 'Avaliar conhecimentos técnicos do candidato',
            'lembretes': '1 hora antes',
            'notas_reuniao': '',
            'proximos_passos': ''
        }
    ]
    
    for appointment_data in appointments_data:
        try:
            Appointment.create(appointment_data)
            logger.info(f"Compromisso criado: {appointment_data['titulo']}")
        except Exception as e:
            logger.error(f"Erro ao criar compromisso: {e}")

def main():
    """Função principal"""
    logger.info("Iniciando população do banco de dados...")
    
    # Inicializar banco de dados
    init_database()
    
    # Popular com dados de exemplo
    seed_tasks()
    seed_appointments()
    
    logger.info("Banco de dados populado com sucesso!")
    print("\n[OK] Dados de exemplo criados com sucesso!")
    print("[INFO] 7 tarefas criadas")
    print("[INFO] 5 compromissos criados")
    print("\nVoce pode agora iniciar o servidor com: python app.py")

if __name__ == '__main__':
    main()
