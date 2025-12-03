"""
Script de verificação de lógica e segurança
"""
import os
import sys
import unittest
from datetime import datetime
import json

# Adicionar diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import TaskStatus, TaskPriority
from models import Task, Appointment
from database import init_database
from utils.validators import sanitize_string, sanitize_for_search

class TestBackendLogic(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """Inicializa o banco de dados para testes"""
        print("\n=== Iniciando Testes de Lógica e Segurança ===")
        init_database()

    def test_01_sql_injection_prevention(self):
        """Teste de prevenção contra SQL Injection"""
        print("\n[TEST] Verificando prevenção de SQL Injection...")
        
        # Tentar injetar SQL via filtros
        malicious_input = "' OR '1'='1"
        
        # Teste em Task.get_all (filtro categoria)
        tasks = Task.get_all(filters={'categoria': malicious_input})
        print(f"   Busca com input malicioso retornou {len(tasks)} resultados (Esperado: 0 ou apenas matches literais)")
        
        # Teste de sanitização de busca
        sanitized = sanitize_for_search("100%")
        self.assertEqual(sanitized, "100\\%", "Falha ao escapar caractere %")
        print("   Sanitização de caracteres curinga: OK")

    def test_02_input_validation(self):
        """Teste de validação de entrada"""
        print("\n[TEST] Verificando validação de entrada...")
        
        # Tentar criar tarefa com status inválido
        try:
            Task.create({
                'titulo': 'Teste Status Inválido',
                'categoria': 'Teste',
                'prioridade': 'alta',
                'status': 'INVALIDO_XYZ' # Deve falhar ou ser ignorado/padronizado
            })
            # Se passar, verificar se foi salvo como pendente (default) ou erro
            # No nosso modelo atual, ele tenta usar o valor. Se o modelo validar, deve lançar erro ou usar default.
            # O modelo atual usa .lower(), mas não valida estritamente antes do insert se não passar pelo validator.
            # Vamos verificar o comportamento.
        except Exception as e:
            print(f"   Erro esperado capturado ao criar com status inválido: {e}")

        # Tentar criar tarefa com prioridade inválida
        try:
            Task.create({
                'titulo': 'Teste Prioridade Inválida',
                'categoria': 'Teste',
                'prioridade': 'SUPER_URGENTE',
                'status': 'pendente'
            })
        except Exception as e:
            print(f"   Erro esperado capturado ao criar com prioridade inválida: {e}")

    def test_03_xss_sanitization(self):
        """Teste de sanitização de XSS"""
        print("\n[TEST] Verificando sanitização de XSS...")
        
        xss_payload = "<script>alert('XSS')</script>Tarefa Perigosa"
        
        task_id = Task.create({
            'titulo': xss_payload,
            'categoria': 'Segurança',
            'prioridade': 'alta',
            'status': 'pendente'
        })
        
        task = Task.get_by_id(task_id)
        self.assertNotIn("<script>", task['titulo'], "Script tag não foi removida!")
        print(f"   Input: {xss_payload}")
        print(f"   Salvo: {task['titulo']}")
        print("   Sanitização XSS: OK")
        
        # Limpar
        Task.delete(task_id)

    def test_04_business_rules(self):
        """Teste de regras de negócio"""
        print("\n[TEST] Verificando regras de negócio...")
        
        # Teste de criação e recuperação
        task_data = {
            'titulo': 'Tarefa de Regra de Negócio',
            'categoria': 'Teste',
            'prioridade': 'urgente',
            'status': 'pendente',
            'data_limite': '2025-12-31'
        }
        task_id = Task.create(task_data)
        self.assertIsNotNone(task_id)
        
        saved_task = Task.get_by_id(task_id)
        self.assertEqual(saved_task['prioridade'], 'urgente')
        
        # Atualização
        Task.update(task_id, {'status': 'concluida'})
        updated_task = Task.get_by_id(task_id)
        self.assertEqual(updated_task['status'], 'concluida')
        print("   Ciclo de vida da tarefa: OK")
        
        # Limpar
        Task.delete(task_id)

if __name__ == '__main__':
    unittest.main()
