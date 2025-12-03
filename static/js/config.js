/**
 * Configurações Globais da Aplicação
 */
export const CONFIG = {
    API_BASE_URL: '/api',
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 3000,
    DATE_LOCALE: 'pt-BR',
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_PER_PAGE: 10
    },
    STATUS: {
        PENDENTE: 'pendente',
        EM_ANDAMENTO: 'em_andamento',
        CONCLUIDA: 'concluida',
        ADIADA: 'adiada'
    },
    PRIORITY: {
        URGENTE: 'urgente',
        ALTA: 'alta',
        MEDIA: 'media',
        BAIXA: 'baixa'
    }
};

export const MESSAGES = {
    ERROR: {
        NETWORK: 'Erro de conexão. Verifique sua internet.',
        GENERIC: 'Ocorreu um erro inesperado.',
        LOAD_DATA: 'Erro ao carregar dados.',
        SAVE_DATA: 'Erro ao salvar dados.',
        DELETE_DATA: 'Erro ao excluir item.'
    },
    SUCCESS: {
        SAVED: 'Salvo com sucesso!',
        DELETED: 'Item excluído com sucesso!',
        UPDATED: 'Atualizado com sucesso!'
    },
    CONFIRM: {
        DELETE: 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.'
    }
};
