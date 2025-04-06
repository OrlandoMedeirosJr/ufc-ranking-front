'use client';

import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Evento {
  id: string;
  nome: string;
  data: string;
  local?: string;
  pais?: string;
  finalizado: boolean;
  lutas?: any[];
  publicoTotal?: number;
  arrecadacao?: number;
  payPerView?: number;
}

// Interface para controlar os filtros aplicados
interface FiltroDados {
  termo: string;
  mostrarFinalizados: boolean;
  mostrarProximos: boolean;
  publicoMinimo: string | number;
  arrecadacaoMinima: string | number;
  ppvMinimo: string | number;
}

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventosFiltrados, setEventosFiltrados] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atualizacaoForçada, setAtualizacaoForçada] = useState(0);
  
  // Estados para filtros e ordenação
  const [filtros, setFiltros] = useState<FiltroDados>({
    termo: '',
    mostrarFinalizados: true,
    mostrarProximos: true,
    publicoMinimo: '',
    arrecadacaoMinima: '',
    ppvMinimo: '',
  });
  
  const [ordenacao, setOrdenacao] = useState('data_desc');
  
  // Buscar eventos do backend
  useEffect(() => {
    const fetchEventos = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('http://localhost:3333/eventos', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!response.ok) {
          throw new Error('Falha ao buscar eventos');
        }
        
        const data = await response.json();
        setEventos(data);
      } catch (err) {
        console.error('Erro ao buscar eventos:', err);
        setError('Falha ao carregar eventos. Por favor, tente novamente mais tarde.');
        
        // Dados de exemplo para desenvolvimento
        setEventos([
          {
            id: '1',
            nome: 'UFC 300: Legacy',
            data: '2024-04-13T00:00:00.000Z',
            local: 'T-Mobile Arena',
            pais: 'Estados Unidos',
            finalizado: true,
            lutas: [
              { id: '101' }, 
              { id: '102' }, 
              { id: '103' }
            ],
            publicoTotal: 18500,
            arrecadacao: 9850000,
            payPerView: 750000,
          },
          {
            id: '2',
            nome: 'UFC Fight Night: Rodriguez vs. Emmett',
            data: '2024-05-13T00:00:00.000Z',
            local: 'UFC Apex',
            pais: 'Estados Unidos',
            finalizado: false,
            lutas: [
              { id: '201' }, 
              { id: '202' }
            ],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventos();
  }, [atualizacaoForçada]);
  
  // Filtrar e ordenar eventos quando houver mudanças nos filtros ou dados
  useEffect(() => {
    if (!eventos.length) {
      setEventosFiltrados([]);
      return;
    }
    
    // Aplicar filtros
    let eventosResultantes = [...eventos];
    
    // Filtrar por status (finalizados/próximos)
    if (!filtros.mostrarFinalizados) {
      eventosResultantes = eventosResultantes.filter(evento => !evento.finalizado);
    }
    
    if (!filtros.mostrarProximos) {
      eventosResultantes = eventosResultantes.filter(evento => evento.finalizado);
    }
    
    // Filtrar por termo de busca (nome do evento)
    if (filtros.termo) {
      const termoBusca = filtros.termo.toLowerCase();
      eventosResultantes = eventosResultantes.filter(
        evento => evento.nome.toLowerCase().includes(termoBusca)
      );
    }
    
    // Filtrar por métricas numéricas (apenas para eventos finalizados)
    if (filtros.publicoMinimo) {
      const minPublico = Number(filtros.publicoMinimo);
      eventosResultantes = eventosResultantes.filter(
        evento => evento.finalizado && evento.publicoTotal && evento.publicoTotal >= minPublico
      );
    }
    
    if (filtros.arrecadacaoMinima) {
      const minArrecadacao = Number(filtros.arrecadacaoMinima);
      eventosResultantes = eventosResultantes.filter(
        evento => evento.finalizado && evento.arrecadacao && evento.arrecadacao >= minArrecadacao
      );
    }
    
    if (filtros.ppvMinimo) {
      const minPPV = Number(filtros.ppvMinimo);
      eventosResultantes = eventosResultantes.filter(
        evento => evento.finalizado && evento.payPerView && evento.payPerView >= minPPV
      );
    }
    
    // Aplicar ordenação
    eventosResultantes.sort((a, b) => {
      // Ordenar por data
      if (ordenacao === 'data_desc') {
        return new Date(b.data).getTime() - new Date(a.data).getTime();
      } else if (ordenacao === 'data_asc') {
        return new Date(a.data).getTime() - new Date(b.data).getTime();
      }
      
      // Ordenar por público
      else if (ordenacao === 'publico_desc') {
        const publicoA = a.publicoTotal || 0;
        const publicoB = b.publicoTotal || 0;
        return publicoB - publicoA;
      } else if (ordenacao === 'publico_asc') {
        const publicoA = a.publicoTotal || 0;
        const publicoB = b.publicoTotal || 0;
        return publicoA - publicoB;
      }
      
      // Ordenar por arrecadação
      else if (ordenacao === 'arrecadacao_desc') {
        const arrecadacaoA = a.arrecadacao || 0;
        const arrecadacaoB = b.arrecadacao || 0;
        return arrecadacaoB - arrecadacaoA;
      } else if (ordenacao === 'arrecadacao_asc') {
        const arrecadacaoA = a.arrecadacao || 0;
        const arrecadacaoB = b.arrecadacao || 0;
        return arrecadacaoA - arrecadacaoB;
      }
      
      // Ordenar por pay-per-view
      else if (ordenacao === 'ppv_desc') {
        const ppvA = a.payPerView || 0;
        const ppvB = b.payPerView || 0;
        return ppvB - ppvA;
      } else if (ordenacao === 'ppv_asc') {
        const ppvA = a.payPerView || 0;
        const ppvB = b.payPerView || 0;
        return ppvA - ppvB;
      }
      
      // Padrão: ordenar por data (mais recente)
      return new Date(b.data).getTime() - new Date(a.data).getTime();
    });
    
    // Atualizar estado
    setEventosFiltrados(eventosResultantes);
  }, [eventos, filtros, ordenacao]);

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Eventos UFC</h1>
        
        <div className="flex flex-wrap gap-3">
          <Link 
            href="/eventos/novo" 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Novo Evento
          </Link>
          
          <LimparBancoDados onLimparConcluido={() => setAtualizacaoForçada(prev => prev + 1)} />
        </div>
      </div>
      
      {/* Filtros para eventos */}
      <FiltrosEventos 
        filtros={filtros} 
        setFiltros={setFiltros} 
        ordenacao={ordenacao} 
        setOrdenacao={setOrdenacao} 
      />
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
          <p>{error}</p>
        </div>
      ) : eventosFiltrados.length === 0 ? (
        <div className="bg-yellow-50 text-yellow-600 p-6 rounded-md text-center">
          <h3 className="text-lg font-medium mb-2">Nenhum evento encontrado</h3>
          <p>Não há eventos que correspondam aos filtros selecionados.</p>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 mb-4">Exibindo {eventosFiltrados.length} eventos</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventosFiltrados.map((evento) => (
              <EventCard key={evento.id} evento={evento} refetch={() => setAtualizacaoForçada(prev => prev + 1)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente do botão de limpar banco de dados
function LimparBancoDados({ onLimparConcluido }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLimpar = async () => {
    // Confirmação do usuário
    if (!window.confirm('ATENÇÃO: Isso irá apagar TODOS os dados do sistema, incluindo lutadores, eventos, lutas e rankings. Esta ação não pode ser desfeita. Deseja continuar?')) {
      return;
    }
    
    // Segunda confirmação para ter certeza
    if (!window.confirm('Tem certeza? Todos os dados serão perdidos permanentemente.')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Enviando requisição para limpar o banco de dados...");
      // Correção da URL do endpoint para limpar o banco de dados
      const response = await fetch('http://localhost:3333/eventos/sistema/limpar-banco', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const resultado = await response.json();
        console.log("Resposta da limpeza do banco:", resultado);
        alert('Banco de dados limpo com sucesso!');
        
        // Chamar o callback de conclusão para forçar a atualização da lista
        if (onLimparConcluido) {
          onLimparConcluido();
        }
      } else {
        const errorText = await response.text();
        let errorMessage = 'Erro desconhecido';
        
        try {
          // Tenta converter para JSON se possível
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorJson.detalhes || 'Erro desconhecido';
        } catch {
          // Se não for JSON, usa o texto da resposta
          errorMessage = errorText || 'Erro desconhecido';
        }
        
        console.error('Resposta de erro completa:', errorText);
        alert(`Erro ao limpar banco de dados: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Erro ao limpar o banco de dados:', error);
      alert(`Erro ao limpar o banco de dados: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleLimpar}
      disabled={isLoading}
      className={`px-4 py-2 rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
      title="Limpar todo o banco de dados"
    >
      {isLoading ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
          <span>Limpando...</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
          <span className="hidden sm:inline">Limpar BD</span>
        </>
      )}
    </button>
  );
}

// Componente de card de evento
function EventCard({ evento, refetch }) {
  const dataFormatada = new Date(evento.data).toLocaleDateString('pt-BR');
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  
  // Formatações para valores numéricos
  const formatarNumero = (numero) => {
    if (numero === undefined || numero === null) return 'N/A';
    return numero.toLocaleString('pt-BR');
  };
  
  const formatarMoeda = (valor) => {
    if (valor === undefined || valor === null) return 'N/A';
    return valor.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      maximumFractionDigits: 0 
    });
  };
  
  const handleDelete = async (eventoId) => {
    if (!window.confirm(`Tem certeza que deseja excluir o evento "${evento.nome}"?`)) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`http://localhost:3333/eventos/${eventoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        alert('Evento excluído com sucesso!');
        refetch();
      } else {
        const errorData = await response.json();
        alert(`Erro ao excluir evento: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      alert(`Erro ao excluir evento: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Determine o ícone baseado no status do evento
  const StatusIcon = () => {
    if (evento.finalizado) {
      return (
        <div className="text-green-600 flex items-center" title="Evento finalizado">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className="ml-1 text-sm">Finalizado</span>
        </div>
      );
    } else {
      return (
        <div className="text-blue-600 flex items-center" title="Evento agendado">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className="ml-1 text-sm">Agendado</span>
        </div>
      );
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-800 truncate">{evento.nome}</h3>
          <StatusIcon />
        </div>
        
        <div className="flex flex-col space-y-2 mb-4">
          <div className="flex items-center text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
            </svg>
            <span>{dataFormatada}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <span>{evento.local || 'Local não definido'}</span>
          </div>
        </div>
        
        {/* Estatísticas do evento (apenas para eventos finalizados) */}
        {evento.finalizado && (
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Estatísticas do Evento</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Público Total</span>
                <span className="font-medium">{formatarNumero(evento.publicoTotal)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Arrecadação</span>
                <span className="font-medium">{formatarMoeda(evento.arrecadacao)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Pay-Per-View</span>
                <span className="font-medium">{formatarNumero(evento.payPerView)}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Contagem de lutas */}
        <div className="text-sm text-gray-500 mb-4">
          Total de lutas: <span className="font-semibold">{evento.lutas?.length || 0}</span>
        </div>
        
        {/* Ações */}
        <div className="flex flex-wrap gap-2 justify-between items-center mt-4">
          <div className="flex gap-2">
            <Link 
              href={`/eventos/${evento.id}`}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              Detalhes
            </Link>
            
            <Link 
              href={`/eventos/${evento.id}/editar`}
              className="px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition-colors flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
              Editar
            </Link>
          </div>
          
          <button
            onClick={() => handleDelete(evento.id)}
            disabled={isDeleting}
            className={`px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center gap-1 ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Excluindo...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                <span>Excluir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente de filtros para eventos
function FiltrosEventos({ filtros, setFiltros, ordenacao, setOrdenacao }) {
  const handleFiltrosChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Para checkboxes usamos o valor de checked, para outros campos o value
    const valorAtualizado = type === 'checkbox' ? checked : value;
    
    setFiltros(prev => ({
      ...prev,
      [name]: valorAtualizado
    }));
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Filtros</h3>
        
        {/* Input de busca pelo nome */}
        <div className="flex-grow">
          <div className="relative">
            <input
              type="text"
              name="termo"
              value={filtros.termo || ''}
              onChange={handleFiltrosChange}
              placeholder="Buscar por nome do evento..."
              className="w-full px-4 py-2 border rounded-md pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Dropdown para ordenação */}
        <div className="min-w-[180px]">
          <select
            name="ordenacao"
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="data_desc">Data (mais recente)</option>
            <option value="data_asc">Data (mais antiga)</option>
            <option value="publico_desc">Público (maior)</option>
            <option value="publico_asc">Público (menor)</option>
            <option value="arrecadacao_desc">Arrecadação (maior)</option>
            <option value="arrecadacao_asc">Arrecadação (menor)</option>
            <option value="ppv_desc">PPV (maior)</option>
            <option value="ppv_asc">PPV (menor)</option>
          </select>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4">
        {/* Filtro de status */}
        <div className="flex items-center gap-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="mostrarFinalizados"
              checked={filtros.mostrarFinalizados}
              onChange={handleFiltrosChange}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span className="ml-2 text-sm text-gray-700">Finalizados</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              name="mostrarProximos"
              checked={filtros.mostrarProximos}
              onChange={handleFiltrosChange}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span className="ml-2 text-sm text-gray-700">Próximos</span>
          </label>
        </div>
        
        {/* Filtros numéricos */}
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2 items-center">
            <label htmlFor="publicoMinimo" className="text-sm text-gray-700">Público mínimo:</label>
            <input
              type="number"
              id="publicoMinimo"
              name="publicoMinimo"
              value={filtros.publicoMinimo || ''}
              onChange={handleFiltrosChange}
              placeholder="Min"
              className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2 items-center">
            <label htmlFor="arrecadacaoMinima" className="text-sm text-gray-700">Arrecadação mínima:</label>
            <input
              type="number"
              id="arrecadacaoMinima"
              name="arrecadacaoMinima"
              value={filtros.arrecadacaoMinima || ''}
              onChange={handleFiltrosChange}
              placeholder="Min"
              className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2 items-center">
            <label htmlFor="ppvMinimo" className="text-sm text-gray-700">PPV mínimo:</label>
            <input
              type="number"
              id="ppvMinimo"
              name="ppvMinimo"
              value={filtros.ppvMinimo || ''}
              onChange={handleFiltrosChange}
              placeholder="Min"
              className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Botão para limpar filtros */}
        <div className="ml-auto">
          <button
            onClick={() => {
              setFiltros({
                termo: '',
                mostrarFinalizados: true,
                mostrarProximos: true,
                publicoMinimo: '',
                arrecadacaoMinima: '',
                ppvMinimo: ''
              });
              setOrdenacao('data_desc');
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            Limpar filtros
          </button>
        </div>
      </div>
    </div>
  );
} 