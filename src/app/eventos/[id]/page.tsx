'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { notFound } from 'next/navigation';
import React from 'react';
import BotaoExcluir from './components/BotaoExcluir';
import BotaoFinalizar from './components/BotaoFinalizar';

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
  const id = unwrappedParams.id;
  
  const [evento, setEvento] = useState<Evento | null>(null);
  const [lutas, setLutas] = useState<Luta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarEvento = async () => {
      try {
        setCarregando(true);
        setError(null);
        
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        const response = await fetch(`${API_URL}/eventos/${id}`);
        
        if (!response.ok) {
          throw new Error(`Erro ao carregar evento: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Dados do evento:', data);
        setEvento(data);
        
        // Verificar se o evento contém lutas
        if (data.lutas && Array.isArray(data.lutas)) {
          console.log(`Encontradas ${data.lutas.length} lutas diretamente no evento:`, data.lutas);
          setLutas(data.lutas);
        } else {
          console.log('Evento não contém lutas ou não está no formato esperado');
          // Tentar carregar lutas separadamente como antes
          try {
            const lutasResponse = await fetch(`${API_URL}/lutas?eventoId=${id}`);
            if (lutasResponse.ok) {
              const lutasData = await lutasResponse.json();
              console.log('Lutas carregadas separadamente:', lutasData);
              setLutas(lutasData);
            } else {
              console.log('Não foi possível carregar lutas separadamente');
              setLutas([]);
            }
          } catch (lutasError) {
            console.error('Erro ao carregar lutas:', lutasError);
            setLutas([]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError(`Falha ao carregar dados: ${error.message}`);
      } finally {
        setCarregando(false);
      }
    };
    
    if (id) {
      carregarEvento();
    }
  }, [id]);

  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      return 'Data não disponível';
    }
  };

  const obterResultadoFormatado = (luta: Luta) => {
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

  if (carregando) {
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
      <div className="mb-6 flex justify-between items-center">
        <Link href="/eventos" className="text-blue-600 hover:underline">
          ← Voltar para lista de eventos
        </Link>
        
        <Link href={`/eventos/${id}/editar`} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          Editar Evento
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{evento.nome}</h1>
        
        <div className="flex flex-col sm:flex-row sm:gap-6 text-gray-600">
          {evento.data && (
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span>{formatarData(evento.data)}</span>
            </div>
          )}
          
          {evento.local && (
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span>{evento.local}{evento.pais ? `, ${evento.pais}` : ''}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Status: {evento.finalizado ? 'Finalizado' : 'Agendado'}</span>
          </div>
        </div>
      </div>

      {evento.finalizado && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h2 className="text-xl font-bold mb-3">Estatísticas do Evento</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {evento.publicoTotal ? (
              <div className="p-3 bg-white rounded-md shadow-sm">
                <div className="text-gray-500 text-sm mb-1">Público Total</div>
                <div className="text-xl font-bold">{formatarNumero(evento.publicoTotal)}</div>
              </div>
            ) : (
              <div className="p-3 bg-white rounded-md shadow-sm">
                <div className="text-gray-500 text-sm mb-1">Público Total</div>
                <div className="text-xl font-medium text-gray-400">Não disponível</div>
              </div>
            )}
            
            {evento.arrecadacao ? (
              <div className="p-3 bg-white rounded-md shadow-sm">
                <div className="text-gray-500 text-sm mb-1">Arrecadação</div>
                <div className="text-xl font-bold">{formatarDinheiro(evento.arrecadacao)}</div>
              </div>
            ) : (
              <div className="p-3 bg-white rounded-md shadow-sm">
                <div className="text-gray-500 text-sm mb-1">Arrecadação</div>
                <div className="text-xl font-medium text-gray-400">Não disponível</div>
              </div>
            )}
            
            {evento.payPerView ? (
              <div className="p-3 bg-white rounded-md shadow-sm">
                <div className="text-gray-500 text-sm mb-1">Vendas Pay-Per-View</div>
                <div className="text-xl font-bold">{formatarNumero(evento.payPerView)}</div>
              </div>
            ) : (
              <div className="p-3 bg-white rounded-md shadow-sm">
                <div className="text-gray-500 text-sm mb-1">Vendas Pay-Per-View</div>
                <div className="text-xl font-medium text-gray-400">Não disponível</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">
          Card de Lutas
          {lutas.length === 0 && <span className="ml-2 text-sm font-normal text-gray-500">(Nenhuma luta registrada)</span>}
        </h2>
        
        {lutas.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border">
            {lutas.map((luta, index) => (
              <div 
                key={luta.id} 
                className={`p-4 ${index !== lutas.length - 1 ? 'border-b' : ''}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium">
                    {luta.categoria && <span className="text-sm text-gray-500 block">{luta.categoria}</span>}
                    <span className="text-lg">{luta.lutadorA.nome} vs. {luta.lutadorB.nome}</span>
                    {luta.resultado?.titulo && (
                      <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Disputa de Título</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {(luta.resultado?.bonusLuta || luta.resultado?.bonusPerformance) && (
                      <div className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        {luta.resultado.bonusLuta && luta.resultado.bonusPerformance 
                          ? 'Luta da Noite + Performance da Noite' 
                          : luta.resultado.bonusLuta 
                            ? 'Luta da Noite' 
                            : 'Performance da Noite'}
                      </div>
                    )}
                    
                    <Link 
                      href={`/eventos/${evento.id}/lutas/${luta.id}/editar`}
                      className="text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-50 text-sm"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  {obterResultadoFormatado(luta)}
                </div>
              </div>
            ))}
          </div>
        ) : evento.finalizado ? (
          <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-yellow-700">
            Este evento foi finalizado, mas nenhuma luta foi registrada.
          </div>
        ) : (
          <div className="bg-blue-50 p-4 rounded border border-blue-200 text-blue-700">
            Nenhuma luta foi adicionada a este evento ainda.
          </div>
        )}
      </div>
      
      <div className="flex gap-3">
        <BotaoFinalizar id={evento.id} finalizado={evento.finalizado} />
        <BotaoExcluir id={evento.id} nome={evento.nome} />
      </div>
    </div>
  );
} 