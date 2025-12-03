# 📅 Sistema de Agendamento de Tarefas e Compromissos

Sistema completo de gerenciamento de tarefas e compromissos com interface web moderna, backend Python/Flask e banco de dados SQLite.

## 🎯 Características

### Tarefas
- ✅ Título, descrição, categoria e palavra-chave
- 🎯 Prioridade (Urgente, Alta, Média, Baixa)
- 📊 Status (Pendente, Em Andamento, Concluída, Adiada)
- 📅 Data limite
- 👥 Responsáveis
- 📝 Observações e checklist opcional

### Compromissos/Reuniões
- 📋 Título e participantes
- 🎯 Assunto principal e palavra-chave
- 📍 Local ou link da reunião
- 📅 Data, horário de início e fim
- 🎯 Objetivo da reunião
- ⏰ Lembretes configuráveis
- 📝 Notas da reunião
- ✨ Geração automática de próximos passos

### Funcionalidades
- ➕ Criar, editar, adiar e concluir tarefas
- 📅 Criar e gerenciar compromissos
- 🔍 Filtros por prioridade, data, categoria, palavra-chave e status
- 📊 Visualizações: Lista diária, Kanban e Calendário mensal
- 📈 Dashboard com estatísticas e resumo geral
- 📜 Histórico de tarefas concluídas
- 🤖 Geração automática de próximos passos baseada em notas de reunião
- ⚠️ Sinalizadores visuais de urgência

## 🚀 Instalação

### Pré-requisitos
- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)

### Passo a Passo

1. **Clone ou navegue até o diretório do projeto**
```bash
cd c:\agendamento
```

2. **Instale as dependências**
```bash
pip install -r requirements.txt
```

3. **Popule o banco de dados com dados de exemplo** (opcional)
```bash
python seed_data.py
```

4. **Inicie o servidor**
```bash
python app.py
```

5. **Acesse a aplicação**
Abra seu navegador e acesse: `http://localhost:5000`

## 📁 Estrutura do Projeto

```
c:\agendamento\
├── app.py                  # Aplicação Flask principal
├── config.py               # Configurações
├── database.py             # Gerenciamento do banco SQLite
├── models.py               # Modelos de dados
├── requirements.txt        # Dependências Python
├── seed_data.py           # Script para dados de exemplo
├── database.db            # Banco de dados SQLite (criado automaticamente)
│
├── routes/                # Rotas da API
│   ├── tasks.py          # Endpoints de tarefas
│   ├── appointments.py   # Endpoints de compromissos
│   └── dashboard.py      # Endpoints de dashboard
│
├── utils/                 # Utilitários
│   ├── logger.py         # Sistema de logging
│   └── validators.py     # Validadores de dados
│
├── static/               # Arquivos estáticos
│   ├── css/
│   │   └── style.css    # Estilos da aplicação
│   └── js/
│       ├── main.js      # Lógica principal
│       ├── tasks.js     # Gerenciamento de tarefas
│       ├── appointments.js  # Gerenciamento de compromissos
│       └── calendar.js  # Visualização de calendário
│
├── templates/            # Templates HTML
│   └── index.html       # Página principal
│
└── logs/                # Logs da aplicação
    └── app.log         # Arquivo de log
```

## 🎨 Interface

### Dashboard
- Estatísticas gerais (total de tarefas, pendentes, em andamento, concluídas)
- Compromissos de hoje e próximos 7 dias
- Itens urgentes (tarefas urgentes e compromissos próximos)

### Visualizações
- **Lista**: Visualização tradicional com filtros avançados
- **Kanban**: Quadro com colunas por status (Pendente, Em Andamento, Concluída, Adiada)
- **Calendário**: Visualização mensal com eventos
- **Histórico**: Tarefas concluídas

### Filtros
- **Tarefas**: Status, prioridade, categoria, palavra-chave
- **Compromissos**: Data início, data fim, palavra-chave

## 🔧 API Endpoints

### Tarefas
- `GET /api/tasks` - Listar tarefas (com filtros opcionais)
- `GET /api/tasks/<id>` - Obter tarefa específica
- `POST /api/tasks` - Criar nova tarefa
- `PUT /api/tasks/<id>` - Atualizar tarefa
- `DELETE /api/tasks/<id>` - Excluir tarefa
- `PATCH /api/tasks/<id>/status` - Atualizar status
- `GET /api/tasks/completed` - Histórico de concluídas

### Compromissos
- `GET /api/appointments` - Listar compromissos (com filtros opcionais)
- `GET /api/appointments/<id>` - Obter compromisso específico
- `POST /api/appointments` - Criar novo compromisso
- `PUT /api/appointments/<id>` - Atualizar compromisso
- `DELETE /api/appointments/<id>` - Excluir compromisso
- `POST /api/appointments/<id>/next-steps` - Gerar próximos passos

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas gerais
- `GET /api/dashboard/urgent` - Itens urgentes
- `GET /api/dashboard/calendar` - Dados do calendário mensal

## 📝 Padrão de Nomenclatura

### Tarefas
```
[PALAVRA-CHAVE] Nome da tarefa
Exemplo: [BACKEND] Implementar autenticação de usuários
```

### Compromissos
```
Categoria > Palavra-chave > Nome do compromisso
Exemplo: Desenvolvimento > SPRINT > Reunião de Planning Sprint 15
```

## 🎯 Experiência do Usuário

1. **Acesso Inicial**: Dashboard com visão geral e itens urgentes
2. **Criação Rápida**: Botões de ação visíveis em cada view
3. **Edição Intuitiva**: Clique em qualquer item para editar
4. **Filtros Dinâmicos**: Aplicação instantânea de filtros
5. **Feedback Visual**: Cores e badges indicam prioridade e status
6. **Navegação Fluida**: Transições suaves entre visualizações
7. **Responsivo**: Interface adaptável a diferentes tamanhos de tela

## 🔒 Segurança

- Validação de dados de entrada
- Sanitização de strings
- Logs de erros detalhados
- Tratamento de exceções em todas as rotas

## 📊 Logs

Os logs são armazenados em `logs/app.log` com rotação automática:
- Tamanho máximo: 10MB
- Backups mantidos: 5 arquivos
- Níveis: DEBUG, INFO, WARNING, ERROR

## 🛠️ Tecnologias Utilizadas

- **Backend**: Python 3.x, Flask 3.0
- **Banco de Dados**: SQLite 3
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Design**: CSS Grid, Flexbox, Gradientes, Animações

## 📈 Próximas Melhorias

- [ ] Autenticação de usuários
- [ ] Notificações por email
- [ ] Exportação para PDF/Excel
- [ ] Integração com calendários externos (Google Calendar, Outlook)
- [ ] Aplicativo mobile
- [ ] Colaboração em tempo real
- [ ] Anexos de arquivos
- [ ] Comentários e discussões

## 🤝 Contribuindo

Sinta-se à vontade para contribuir com melhorias! Sugestões:
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto é de código aberto e está disponível para uso pessoal e comercial.

## 💬 Suporte

Para dúvidas ou problemas, consulte os logs em `logs/app.log` ou abra uma issue no repositório.

---

Desenvolvido com ❤️ usando Python e Flask
