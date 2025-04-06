'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';
import BotaoExcluir from './components/BotaoExcluir';
import BotaoFinalizar from './components/BotaoFinalizar';
import { formatarNumero, formatarMoeda } from '@/utils/formatters';
import { buildApiUrl } from '@/config/api';

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
  params: { id: string };
}

export default function EventoDetalhesPage({ params }: PageProps) {
  // Usar React.use para "unwrap" os parâmetros
  const unwrappedParams = React.use(params);
  const eventoId = unwrappedParams.id;
  
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
        
        // URL direta para a API
        const url = `http://localhost:3334/eventos/${eventoId}?includeDetails=true&includeBonus=true`;
        console.log(`Buscando evento diretamente: ${url}`);
        
        const res = await fetch(url, { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          cache: 'no-store',
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (!res.ok) {
          console.error(`Erro na resposta da API: ${res.status} - ${res.statusText}`);
          throw new Error(`Erro ao buscar evento: ${res.status}`);
        }
        
        const data = await res.json();
        console.log(`Evento carregado com sucesso: ID ${data.id} - ${data.nome}`);
        return data;
      } catch (error) {
        console.error('Erro ao buscar evento:', error);
        throw error;
      }
    }

    // Função para buscar lutas do evento na API
    async function getLutas() {
      try {
        if (!eventoId) {
          throw new Error('ID do evento não encontrado');
        }
        
        // URL direta para a API
        const url = `http://localhost:3334/eventos/${eventoId}/lutas?includeBonus=true`;
        console.log(`Buscando lutas diretamente: ${url}`);
        
        const res = await fetch(url, { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          cache: 'no-store',
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (!res.ok) {
          console.error(`Erro na resposta da API: ${res.status} - ${res.statusText}`);
          throw new Error(`Erro ao buscar lutas: ${res.status}`);
        }
        
        const data = await res.json();
        console.log(`Lutas carregadas com sucesso: ${data.lutas?.length || 0} lutas encontradas`);
        return data;
      } catch (error) {
        console.error('Erro ao buscar lutas:', error);
        return { lutas: [] };
      }
    }

    const carregarEvento = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getEvento();
        console.log('Dados do evento:', data);
        setEvento(data);
        
        // Verificar se o evento contém lutas
        if (data.lutas && Array.isArray(data.lutas)) {
          console.log(`Encontradas ${data.lutas.length} lutas diretamente no evento:`, data.lutas);
          
          // Processar e normalizar as lutas recebidas para garantir a estrutura correta
          const lutasProcessadas = data.lutas.map(luta => {
            // Garantir que resultado existe ou criar objeto vazio
            const resultado = luta.resultado || {};
            
            // Verificar se há informações de bônus em diferentes formatos
            let bonusLuta = false;
            let bonusPerformance = false;
            
            // 1. Verificar no objeto resultado
            if (resultado) {
              if (resultado.bonusLuta === true || resultado.bonusLuta === 'true') {
                bonusLuta = true;
              }
              
              if (resultado.bonusPerformance === true || resultado.bonusPerformance === 'true') {
                bonusPerformance = true;
              }
            }
            
            // 2. Verificar na propriedade de string bonus
            if (typeof luta.bonus === 'string' && luta.bonus.trim() !== '') {
              const bonusString = luta.bonus.toLowerCase();
              
              // Verificar formatos diretos
              if (bonusString === 'luta' || 
                  bonusString === 'luta da noite' || 
                  bonusString.includes('luta da noite')) {
                bonusLuta = true;
              }
              
              if (bonusString === 'performance' || 
                  bonusString === 'performance da noite' || 
                  bonusString.includes('performance da noite')) {
                bonusPerformance = true;
              }
              
              if (bonusString === 'ambos') {
                bonusLuta = true;
                bonusPerformance = true;
              }
              
              // Verificar formato separado por vírgula
              if (bonusString.includes(',')) {
                const bonusParts = bonusString.split(',').map(p => p.trim());
                
                if (bonusParts.includes('luta') || 
                    bonusParts.includes('luta da noite') || 
                    bonusParts.some(p => p.includes('luta da noite'))) {
                  bonusLuta = true;
                }
                
                if (bonusParts.includes('performance') || 
                    bonusParts.includes('performance da noite') || 
                    bonusParts.some(p => p.includes('performance da noite'))) {
                  bonusPerformance = true;
                }
              }
            }
            
            console.log(`Luta ${luta.id} - Processada - bonusLuta: ${bonusLuta}, bonusPerformance: ${bonusPerformance}, bonus original: ${luta.bonus}`);
            
            // Garantir que as informações de bônus sejam mantidas nas duas estruturas possíveis
            return {
              ...luta,
              bonus: luta.bonus || '',
              resultado: {
                ...resultado,
                bonusLuta: bonusLuta,
                bonusPerformance: bonusPerformance
              }
            };
          });
          
          console.log('Lutas processadas com estrutura normalizada:', lutasProcessadas);
          setLutas(lutasProcessadas);
        } else {
          console.log('Evento não contém lutas ou não está no formato esperado');
          // Tentar carregar lutas separadamente como antes
          try {
            const lutasData = await getLutas();
            console.log('Lutas carregadas separadamente:', lutasData);
            setLutas(lutasData.lutas);
          } catch (lutasError) {
            try {
              console.log('Tentando carregar lutas por abordagem alternativa...');
              const lutasUrl = `http://localhost:3334/lutas?eventoId=${eventoId}`;
              console.log(`URL alternativa: ${lutasUrl}`);
              
              const lutasResponse = await fetch(lutasUrl, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                cache: 'no-store',
                mode: 'cors',
                credentials: 'omit'
              });
              
              if (lutasResponse.ok) {
                const lutasData = await lutasResponse.json();
                console.log(`Lutas alternativas carregadas: ${lutasData.length} encontradas`);
                setLutas(lutasData);
              } else {
                console.error(`Erro na abordagem alternativa: ${lutasResponse.status}`);
                console.log('Não foi possível carregar lutas separadamente');
                setLutas([]);
              }
            } catch (alternativeError) {
              console.error('Erro na abordagem alternativa:', alternativeError);
              setLutas([]);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError(`Falha ao carregar dados: ${error.message}`);
      } finally {
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
      <div className="bg-red-50 p-4 rounded border border-red-200 text-red-700">
        <h2 className="text-lg font-bold mb-2">Erro</h2>
        <p>{error}</p>
        <Link href="/eventos" className="mt-4 inline-block text-blue-600 hover:underline">
          Voltar para lista de eventos
        </Link>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-yellow-700">
        <h2 className="text-lg font-bold mb-2">Evento não encontrado</h2>
        <p>O evento solicitado não foi encontrado.</p>
        <Link href="/eventos" className="mt-4 inline-block text-blue-600 hover:underline">
          Voltar para lista de eventos
        </Link>
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
      <div>
        <h2 className="text-xl font-semibold mb-4">Card do Evento</h2>
        
        {lutas.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-center">
            <p className="text-gray-600">Nenhuma luta cadastrada para este evento.</p>
            <Link 
              href={`/admin?eventoId=${evento.id}`}
              className="mt-2 inline-block text-blue-600 hover:underline"
            >
              Adicionar lutas
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {lutas.map((luta, index) => (
              <div key={luta.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                    {luta.categoria || "Categoria não especificada"}
                  </span>
                  
                  {luta.resultado && luta.resultado.titulo && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                      Disputa de Título
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1 text-center md:text-left mb-2 md:mb-0">
                    <p className="font-bold">{luta.lutadorA.nome}</p>
                    <p className="text-sm text-gray-600">{luta.lutadorA.pais}</p>
                  </div>
                  
                  <div className="text-center px-4">
                    <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
                      VS
                    </span>
                  </div>
                  
                  <div className="flex-1 text-center md:text-right">
                    <p className="font-bold">{luta.lutadorB.nome}</p>
                    <p className="text-sm text-gray-600">{luta.lutadorB.pais}</p>
                  </div>
                </div>
                
                {/* Resultado (apenas se o evento estiver finalizado) */}
                {evento.finalizado && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm">
                      <span className="font-medium">Resultado:</span>{" "}
                      {obterResultadoFormatado(luta)}
                    </p>
                  </div>
                )}
                
                {/* Bônus (visível independente do estado do evento) */}
                {(() => {
                  console.log('Verificando bônus da luta:', luta.id);
                  console.log('Dados da luta:', JSON.stringify(luta, null, 2));
                  
                  // Verificar todos os formatos possíveis para bônus
                  let temBonusLuta = false;
                  let temBonusPerformance = false;
                  
                  // Verificação direta no objeto resultado
                  if (luta.resultado) {
                    temBonusLuta = !!luta.resultado.bonusLuta;
                    temBonusPerformance = !!luta.resultado.bonusPerformance;
                    console.log(`De resultado: bonusLuta=${temBonusLuta}, bonusPerformance=${temBonusPerformance}`);
                  }
                  
                  // Verificação na propriedade bonus como string 
                  if (typeof luta.bonus === 'string') {
                    const bonusLowerCase = luta.bonus.toLowerCase();
                    
                    // Verificar "luta", "ambos", "luta da noite"
                    if (
                      bonusLowerCase === 'luta' || 
                      bonusLowerCase === 'luta da noite' ||
                      bonusLowerCase === 'ambos' ||
                      bonusLowerCase.includes('luta da noite')
                    ) {
                      temBonusLuta = true;
                    }
                    
                    // Verificar "performance", "ambos", "performance da noite"
                    if (
                      bonusLowerCase === 'performance' || 
                      bonusLowerCase === 'performance da noite' ||
                      bonusLowerCase === 'ambos' ||
                      bonusLowerCase.includes('performance da noite')
                    ) {
                      temBonusPerformance = true;
                    }
                    
                    // Verificar strings separadas por vírgula
                    if (bonusLowerCase.includes(',')) {
                      const bonusParts = bonusLowerCase.split(',').map(p => p.trim());
                      
                      if (
                        bonusParts.includes('luta') || 
                        bonusParts.includes('luta da noite') ||
                        bonusParts.some(p => p.includes('luta da noite'))
                      ) {
                        temBonusLuta = true;
                      }
                      
                      if (
                        bonusParts.includes('performance') || 
                        bonusParts.includes('performance da noite') ||
                        bonusParts.some(p => p.includes('performance da noite'))
                      ) {
                        temBonusPerformance = true;
                      }
                    }
                    
                    console.log(`De string: bonusLuta=${temBonusLuta}, bonusPerformance=${temBonusPerformance}, valor='${luta.bonus}'`);
                  }
                  
                  // Mostrar a seção de bônus se houver algum bônus
                  return (temBonusLuta || temBonusPerformance) ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {temBonusLuta && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                          Luta da Noite
                        </span>
                      )}
                      {temBonusPerformance && (
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded">
                          Performance da Noite
                        </span>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <Link href="/eventos" className="text-blue-600 hover:underline">
          ← Voltar para lista de eventos
        </Link>
      </div>
    </div>
  );
} 