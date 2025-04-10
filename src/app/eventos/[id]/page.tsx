'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';
import BotaoExcluir from './components/BotaoExcluir';
import BotaoFinalizar from './components/BotaoFinalizar';
import { formatarNumero, formatarMoeda } from '@/utils/formatters';
import { buildApiUrl, apiGet, apiConfig } from '@/config/api';

interface Lutador {
  id: number;
  nome: string;
  pais: string;
  sexo: string;
}

interface Resultado {
  id: number;
  vencedor: string;
  metodo: string;
  round: number;
  tempo: string;
  titulo: boolean;
  bonusLuta: boolean;
  bonusPerformance: boolean;
}

interface Luta {
  id: number;
  eventoId: number;
  lutadorA: Lutador;
  lutadorB: Lutador;
  categoria: string;
  resultado?: Resultado;
  bonus?: string; // 'luta', 'performance', 'ambos' ou undefined/null
  erro?: string;
}

interface Evento {
  id: number;
  nome: string;
  data?: string;
  local?: string;
  pais?: string;
  finalizado: boolean;
  publicoTotal?: number;
  arrecadacao?: number;
  payPerView?: number;
  lutas?: Array<{
    id: number;
    ordem: number;
    resultado?: string;
    lutadorA: {
      id: number;
      nome: string;
      pais?: string;
    };
    lutadorB: {
      id: number;
      nome: string;
      pais?: string;
    };
  }>;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventoDetalhesPage({ params }: PageProps) {
  // Await params já que agora é uma Promise
  const unwrappedParams = await params;
  const eventoId = unwrappedParams.id;
  
  // Componente cliente que recebe o ID já processado
  return <EventoDetalhesClient eventoId={eventoId} />;
}

// Componente cliente que recebe o ID já processado
function EventoDetalhesClient({ eventoId }: { eventoId: string }) {
  console.log('ID do evento:', eventoId);
  
  const [evento, setEvento] = useState<Evento | null>(null);
  const [lutas, setLutas] = useState<Luta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventoId) {
      setError("ID do evento não encontrado");
      setLoading(false);
      return;
    }

    // Função para buscar dados do evento na API
    async function getEvento() {
      try {
        if (!eventoId) {
          throw new Error('ID do evento não encontrado');
        }
        
        console.log(`Buscando evento com ID: ${eventoId}`);
        
        try {
          const url = `eventos/${eventoId}?includeDetails=true&includeBonus=true`;
          console.log(`Buscando evento usando apiGet: ${url}`);
          
          const data = await apiGet(url);
          
          // Verificar se recebemos um evento válido
          if (!data || !data.id || !data.nome) {
            console.error(`API retornou dados inválidos para evento ${eventoId}`);
            throw new Error('Dados do evento inválidos ou incompletos');
          }
          
          console.log(`Evento carregado com sucesso: ID ${data.id} - ${data.nome}`);
          return data;
        } catch (error: any) {
          // Verificar se é um erro de "evento não encontrado"
          if (error.message && (
            error.message.includes('404') || 
            error.message.includes('não encontrado')
          )) {
            console.error(`Evento ${eventoId} não encontrado na API`);
            throw new Error(`Evento com ID ${eventoId} não existe mais ou foi removido`);
          }
          
          // Verificar se é erro de conexão
          if (error.message && (
            error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError') ||
            error.message.includes('Erro HTTP')
          )) {
            console.error(`Erro de conexão com a API: ${error.message}`);
            throw new Error('Servidor indisponível. Verifique sua conexão ou tente novamente mais tarde.');
          }
          
          console.error(`Erro ao buscar evento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          throw error;
        }
      } catch (error: any) {
        console.error(`Falha na obtenção do evento:`, error);
        setError(`${error instanceof Error ? error.message : 'Erro desconhecido ao carregar evento'}`);
        return null;
      }
    }

    // Função para buscar lutas do evento na API
    async function getLutas() {
      try {
        console.log(`Início: Buscando lutas para o evento ${eventoId}...`);
        
        // Lista de rotas a tentar, em ordem de prioridade
        const rotasParaTentar = [
          `lutas/evento/${eventoId}`,  // Nova rota (primeira prioridade)
          `eventos/${eventoId}/lutas`, // Rota antiga
          `eventos/${eventoId}?includeDetails=true`, // Evento com detalhes (obter diretamente)
          `lutas`                      // Todas as lutas (para filtragem)
        ];
        
        let lutasEncontradas: any[] = [];
        let mensagemErro = '';
        
        // Tentar cada rota até ter sucesso
        for (let i = 0; i < rotasParaTentar.length; i++) {
          const rota = rotasParaTentar[i];
          try {
            console.log(`Tentativa ${i+1}: Buscando lutas usando apiGet em "${rota}"`);
            
            // Para a rota de todas as lutas, precisamos filtrar após obter os dados
            if (rota === 'lutas') {
              const todasLutas = await apiGet(rota);
              console.log(`Todas as lutas obtidas: ${todasLutas.length || 0}`);
              
              if (Array.isArray(todasLutas)) {
                lutasEncontradas = todasLutas.filter((luta: any) => luta.eventoId === Number(eventoId));
                console.log(`Lutas filtradas: ${lutasEncontradas.length} lutas para o evento ${eventoId}`);
              }
            } 
            // Para a rota do evento com detalhes, extraímos as lutas do objeto evento
            else if (rota.includes('includeDetails=true')) {
              const eventoDetalhado = await apiGet(rota);
              console.log(`Evento detalhado obtido:`, eventoDetalhado?.id, eventoDetalhado?.nome);
              
              if (eventoDetalhado && eventoDetalhado.lutas && Array.isArray(eventoDetalhado.lutas)) {
                lutasEncontradas = eventoDetalhado.lutas;
                console.log(`Lutas extraídas do evento: ${lutasEncontradas.length} lutas`);
              }
            }
            // Para as outras rotas (que retornam array de lutas diretamente)
            else {
              const resultado = await apiGet(rota);
              if (Array.isArray(resultado)) {
                lutasEncontradas = resultado;
                console.log(`Lutas obtidas pela rota ${rota}: ${lutasEncontradas.length} lutas`);
              } else {
                console.error(`A rota ${rota} não retornou um array:`, resultado);
              }
            }
            
            // Se encontramos lutas, podemos parar de tentar
            if (lutasEncontradas && lutasEncontradas.length > 0) {
              console.log(`Sucesso na tentativa ${i+1} (${rota}): ${lutasEncontradas.length} lutas encontradas`);
              // Log detalhado das lutas para diagnóstico (limitado a 5 para não poluir o console)
              const lutasParaLog = lutasEncontradas.slice(0, 3).map(luta => ({
                id: luta.id,
                lutadores: `${luta.lutadorA?.nome || luta.lutador1?.nome || '?'} vs ${luta.lutadorB?.nome || luta.lutador2?.nome || '?'}`,
                categoria: luta.categoria || 'Sem categoria'
              }));
              console.log('Primeiras lutas encontradas:', lutasParaLog);
              return lutasEncontradas;
            } else {
              console.log(`A rota ${rota} não retornou lutas para o evento ${eventoId}`);
            }
          } catch (error: any) {
            console.error(`Erro na tentativa ${i+1} (${rota}):`, error);
            mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
            // Continuamos para a próxima rota
          }
        }
        
        // Se chegamos aqui, todas as tentativas falharam ou não trouxeram resultados
        // Mas não vamos quebrar a aplicação, apenas retornar uma lista vazia
        console.error('Todas as tentativas de buscar lutas falharam ou não retornaram dados');
        
        if (mensagemErro.includes('Failed to fetch') || mensagemErro.includes('NetworkError')) {
          setError('Servidor indisponível. Não foi possível carregar as lutas.');
        } else if (mensagemErro) {
          setError(`Não foi possível carregar as lutas: ${mensagemErro}`);
        } else {
          setError('Este evento não possui lutas registradas.');
        }
        
        return [];
      } catch (error: any) {
        console.error(`Erro ao buscar lutas para evento ${eventoId}:`, error);
        setError(`Erro ao carregar lutas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        return [];
      }
    }

    const carregarEvento = async () => {
      try {
        setLoading(true);
        console.log(`Carregando evento ${eventoId}...`);
        
        const eventoData = await getEvento();
        
        // Se não temos evento, não precisamos buscar lutas
        if (!eventoData) {
          console.error(`Evento ${eventoId} não encontrado`);
          setEvento(null);
          setLutas([]);
          setLoading(false);
          return;
        }
        
        // Garantir que o evento tenha um array de lutas, mesmo que vazio
        if (!eventoData.lutas) {
          eventoData.lutas = [];
        }
        
        // Buscar lutas adicionais e detalhes
        const lutasData = await getLutas();
        
        console.log(`Evento carregado:`, eventoData);
        console.log(`Lutas carregadas:`, lutasData?.length || 0, "lutas");
        
        // Se temos alguma luta, vamos processá-las
        const lutasProcessadas = (lutasData || []).map((luta: any, index: number) => {
          console.log(`Processando luta ${index + 1} (ID: ${luta.id || 'indefinido'}):`, 
            `A: ${luta.lutadorA?.nome || luta.lutador1?.nome || '?'} vs B: ${luta.lutadorB?.nome || luta.lutador2?.nome || '?'}`);
          
          // Adaptar formato da API - verifica se temos lutador1/lutador2 em vez de lutadorA/lutadorB
          const lutadorA = luta.lutadorA || luta.lutador1 || {
            id: 0,
            nome: 'Lutador A não encontrado',
            pais: 'Desconhecido',
            sexo: 'Masculino'
          };
          
          const lutadorB = luta.lutadorB || luta.lutador2 || {
            id: 0,
            nome: 'Lutador B não encontrado',
            pais: 'Desconhecido',
            sexo: 'Masculino'
          };
          
          // Processar informação de bônus
          let bonus = undefined;
          if (luta.bonus) {
            // Se já temos um campo bonus direto da API
            if (typeof luta.bonus === 'string') {
              bonus = luta.bonus;
              console.log(`Bônus encontrado para luta ${luta.id}: ${bonus}`);
            } 
          }
          
          // Verificar se os IDs dos lutadores são iguais (caso de bug)
          let erro = undefined;
          if (lutadorA.id && lutadorB.id && lutadorA.id === lutadorB.id && lutadorA.id !== 0) {
            console.error(`ALERTA: Luta com mesmo lutador em ambos os lados:`, luta);
            erro = `Erro: Mesmo lutador (${lutadorA.nome}) em ambos os lados da luta`;
          }
          
          // Logar cada luta para debug
          console.log(`Luta processada: ${lutadorA.nome} vs ${lutadorB.nome} (Categoria: ${luta.categoria || 'Indefinida'}) - Resultado:`, luta.resultado || 'Sem resultado');
          
          return {
            ...luta,
            id: luta.id || index,
            eventoId: luta.eventoId || Number(eventoId),
            lutadorA,
            lutadorB,
            categoria: luta.categoria || 'Categoria não definida',
            resultado: luta.resultado || null,
            bonus,
            erro
          };
        });
        
        console.log("Total de lutas processadas:", lutasProcessadas.length);
        setEvento(eventoData);
        setLutas(lutasProcessadas);
        setError(null); // Limpar erros se tudo deu certo
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar evento:', error);
        setEvento(null);
        setLutas([]);
        setError(`${error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados'}`);
        setLoading(false);
      }
    };
    
    carregarEvento();
  }, [eventoId]);

  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      return 'Data não disponível';
    }
  };

  // Funçãp para obter resultado formatado para exibição
  const obterResultadoFormatado = (luta: Luta) => {
    console.log('Formatando resultado para luta:', luta.id, 'Resultado:', luta.resultado);
    
    if (!luta.resultado) return 'Não realizada';
    
    const vencedor = luta.resultado.vencedor;
    
    let textoResultado = '';
    if (vencedor === 'lutadorA') {
      textoResultado = `${luta.lutadorA.nome} venceu`;
    } else if (vencedor === 'lutadorB') {
      textoResultado = `${luta.lutadorB.nome} venceu`;
    } else if (vencedor === 'empate') {
      textoResultado = 'Empate';
    } else if (vencedor === 'nocontest') {
      textoResultado = 'No Contest';
    } else {
      textoResultado = 'Sem resultado';
    }
    
    if (luta.resultado.metodo) {
      textoResultado += ` por ${luta.resultado.metodo}`;
    }
    
    if (luta.resultado.round) {
      textoResultado += `, Round ${luta.resultado.round}`;
    }
    
    return textoResultado;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-red-700 shadow-sm">
          <h2 className="text-xl font-bold mb-3">Não foi possível carregar este evento</h2>
          <p className="mb-4">{error}</p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Link href="/eventos" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Voltar para lista de eventos
            </Link>
            
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 text-yellow-800 shadow-sm">
          <h2 className="text-xl font-bold mb-3">Evento não encontrado</h2>
          <p className="mb-4">O evento com ID {eventoId} não está disponível ou foi removido.</p>
          
          <Link href="/eventos" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Voltar para lista de eventos
          </Link>
        </div>
      </div>
    );
  }

  // Função para formatar números como valores monetários
  const formatarDinheiro = (valor: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  // Função para formatar números grandes
  const formatarNumero = (valor: number) => {
    return new Intl.NumberFormat('pt-BR').format(valor);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">{evento.nome}</h1>
          {evento.data && (
            <p className="text-gray-600 mb-1">
              {formatarData(evento.data)}
            </p>
          )}
          {evento.local && evento.pais && (
            <p className="text-gray-600">
              {evento.local}, {evento.pais}
            </p>
          )}
        </div>
        
        <div className="mt-4 md:mt-0 space-x-2 flex flex-wrap gap-2">
          {!evento.finalizado && (
            <BotaoFinalizar eventoId={Number(evento.id)} finalizado={evento.finalizado} />
          )}
          
          <BotaoExcluir eventoId={Number(evento.id)} />
          
          <Link href={`/eventos/${evento.id}/editar`} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Editar Evento
          </Link>
        </div>
      </div>
      
      {evento.finalizado && (
        <div className="bg-green-50 p-3 rounded-md border border-green-200 mb-6 flex items-center">
          <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
          <span className="text-green-800 font-medium">Evento finalizado</span>
        </div>
      )}
      
      {/* Métricas do evento */}
      {evento.finalizado && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {evento.publicoTotal !== null && evento.publicoTotal !== undefined && (
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500 mb-1">Público Total</p>
              <p className="text-xl font-bold">{formatarNumero(evento.publicoTotal)}</p>
            </div>
          )}
          
          {evento.arrecadacao !== null && evento.arrecadacao !== undefined && (
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500 mb-1">Arrecadação</p>
              <p className="text-xl font-bold">{formatarDinheiro(evento.arrecadacao)}</p>
            </div>
          )}
          
          {evento.payPerView !== null && evento.payPerView !== undefined && (
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500 mb-1">Pay-per-view</p>
              <p className="text-xl font-bold">{formatarNumero(evento.payPerView)}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Lista de lutas */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Lutas do Evento</h3>
        </div>
        
        {error && !loading && (
          <div className="p-6 bg-red-50 dark:bg-red-900/20">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {lutas && lutas.length > 0 ? (
            lutas.map((luta, index) => {
              // Verificar se a luta tem erro
              if (luta.erro) {
                return (
                  <div key={luta.id || `luta-${index}`} className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
                    <p className="text-red-600 dark:text-red-400 font-medium">
                      {luta.erro}
                    </p>
                    <p className="text-red-500 dark:text-red-300 text-sm mt-1">
                      ID da luta: {luta.id || 'Desconhecido'} - Categoria: {luta.categoria || 'Desconhecida'}
                    </p>
                    <div className="mt-2 flex space-x-2">
                      <Link 
                        href={`/eventos/${eventoId}/editar`} 
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Editar evento
                      </Link>
                      {luta.id && (
                        <button
                          onClick={async () => {
                            if (confirm(`Deseja remover esta luta problemática com ID ${luta.id}?`)) {
                              try {
                                // Tentar excluir a luta
                                const url = buildApiUrl(`lutas/${luta.id}`);
                                const res = await fetch(url, {
                                  method: 'DELETE',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                  }
                                });
                                
                                if (res.ok) {
                                  alert('Luta removida com sucesso!');
                                  window.location.reload(); // Recarregar a página
                                } else {
                                  alert(`Erro ao remover luta: ${res.status} - ${res.statusText}`);
                                }
                              } catch (error) {
                                console.error('Erro ao excluir luta:', error);
                                alert(`Erro ao excluir luta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                              }
                            }
                          }}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Remover luta
                        </button>
                      )}
                    </div>
                  </div>
                );
              }
              
              // Verificar se os dados do lutador estão disponíveis
              if (!luta.lutadorA || !luta.lutadorB) {
                console.error(`Erro: Dados de lutador ausentes na luta ${luta.id}`, luta);
                return (
                  <div key={luta.id || `luta-${index}`} className="p-4 bg-red-50 dark:bg-red-900/20">
                    <p className="text-red-600 dark:text-red-400">
                      Erro: Dados de lutador incompletos. ID da luta: {luta.id || 'Desconhecido'}
                    </p>
                  </div>
                );
              }
              
              // Dados sobre o resultado
              const resultado = luta.resultado;
              const vencedor = resultado ? 
                (resultado.vencedor === 'lutadorA' ? 'A' : 
                 resultado.vencedor === 'lutadorB' ? 'B' : 
                 resultado.vencedor === 'empate' ? 'Empate' : 
                 resultado.vencedor === 'nc' ? 'NC' : null) : null;
                 
              // Determinar classes CSS com base no vencedor
              const lutadorAClass = vencedor === 'A' ? 'font-bold text-blue-600 dark:text-blue-400' : '';
              const lutadorBClass = vencedor === 'B' ? 'font-bold text-blue-600 dark:text-blue-400' : '';
              
              // Se título, adicionar indicador
              const tituloClass = resultado && resultado.titulo ? 'bg-yellow-50 dark:bg-yellow-900/20' : '';
              
              // Se há bônus, destacar
              const bonusClass = (resultado && (resultado.bonusLuta || resultado.bonusPerformance)) 
                ? 'border-l-4 border-green-400 dark:border-green-600' 
                : '';
                
              // IDs para debugging  
              const lutadorAId = luta.lutadorA?.id || 'ID desconhecido';
              const lutadorBId = luta.lutadorB?.id || 'ID desconhecido';
              
              return (
                <div 
                  key={luta.id || `luta-${index}`} 
                  className={`p-4 ${tituloClass} ${bonusClass} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150`}
                >
                  <div className="flex flex-wrap justify-between items-center">
                    <div className="w-full md:w-8/12 flex flex-wrap items-center">
                      <div className="w-5/12 text-right">
                        <Link 
                          href={`/lutadores/${luta.lutadorA.id}`}
                          className={`inline-block text-sm md:text-base ${lutadorAClass}`}
                          title={`ID: ${lutadorAId}`}
                        >
                          {luta.lutadorA.nome}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{luta.lutadorA.pais}</p>
                      </div>
                      
                      <div className="w-2/12 text-center">
                        <span className="text-xl font-bold text-gray-400 dark:text-gray-500">VS</span>
                      </div>
                      
                      <div className="w-5/12">
                        <Link 
                          href={`/lutadores/${luta.lutadorB.id}`}
                          className={`inline-block text-sm md:text-base ${lutadorBClass}`}
                          title={`ID: ${lutadorBId}`}
                        >
                          {luta.lutadorB.nome}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{luta.lutadorB.pais}</p>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-4/12 mt-2 md:mt-0">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium">{luta.categoria}</span>
                        
                        {resultado && (
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            {vencedor && vencedor !== 'Empate' && vencedor !== 'NC' ? (
                              <span>
                                Vencedor: {vencedor === 'A' ? luta.lutadorA.nome : luta.lutadorB.nome} 
                                {resultado.metodo ? ` por ${resultado.metodo}` : ''}
                                {resultado.round ? ` no ${resultado.round}º round` : ''}
                              </span>
                            ) : (
                              <span>
                                Resultado: {vencedor === 'Empate' ? 'Empate' : 'No Contest'}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Bônus e título */}
                        <div className="flex mt-1 space-x-1">
                          {resultado && resultado.titulo && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                              Título
                            </span>
                          )}
                          
                          {resultado && resultado.bonusLuta && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                              Luta da Noite
                            </span>
                          )}
                          
                          {resultado && resultado.bonusPerformance && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                              Performance
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 mb-4 text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma luta encontrada</h3>
              <p className="text-gray-500 mb-6">
                {loading ? 'Carregando dados...' : 
                 error ? `Ocorreu um erro ao buscar as lutas: ${error}` : 
                 'Este evento ainda não possui lutas registradas.'}
              </p>
              <p className="text-gray-500 mb-6">
                ID do evento: {eventoId} - API Base: {apiConfig.baseUrl}
              </p>
              
              {!loading && !error && (
                <Link 
                  href={`/eventos/${eventoId}/editar`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Adicionar lutas a este evento
                </Link>
              )}
              
              {!loading && error && (
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Tentar novamente
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8">
        <Link href="/eventos" className="text-blue-600 hover:underline">
          ← Voltar para lista de eventos
        </Link>
      </div>
    </div>
  );
} 