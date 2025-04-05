'use client';

import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";

interface Evento {
  id: number;
  nome: string;
  data: string;
  local: string;
  pais: string;
  finalizado: boolean;
}

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [usandoDadosExemplo, setUsandoDadosExemplo] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [atualizacaoForçada, setAtualizacaoForçada] = useState(0);

  // Dados de exemplo para fallback
  const eventosExemplo: Evento[] = [
    { 
      id: 1, 
      nome: "UFC 299: O'Malley vs. Dvalishvili", 
      data: "2025-03-09T23:00:00.000Z", 
      local: "Miami, Florida", 
      pais: "EUA",
      finalizado: true
    },
    { 
      id: 2, 
      nome: "UFC Fight Night: Cannonier vs. Imavov", 
      data: "2025-04-13T22:00:00.000Z", 
      local: "Las Vegas, Nevada", 
      pais: "EUA",
      finalizado: false
    },
    { 
      id: 3, 
      nome: "UFC 300: Pereira vs. Hill", 
      data: "2025-04-13T22:00:00.000Z", 
      local: "Las Vegas, Nevada", 
      pais: "EUA",
      finalizado: false
    },
    { 
      id: 4, 
      nome: "UFC Fight Night: Blanchfield vs. Fiorot", 
      data: "2025-03-23T22:00:00.000Z", 
      local: "Atlantic City, New Jersey", 
      pais: "EUA",
      finalizado: true
    },
  ];

  useEffect(() => {
    const buscarEventos = async () => {
      setCarregando(true);
      try {
        // Tentamos buscar do backend com timeout de 3 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        try {
          console.log("Buscando eventos do backend...");
          const res = await fetch("http://localhost:3333/eventos", { 
            cache: "no-store",
            signal: controller.signal,
            // Forçando uma busca 100% nova, sem cache
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (res.ok) {
            const dadosDaApi = await res.json();
            console.log("Dados recebidos da API:", dadosDaApi);
            
            if (Array.isArray(dadosDaApi)) {
              setEventos(dadosDaApi);
              setUsandoDadosExemplo(false);
              
              if (dadosDaApi.length === 0) {
                console.log("API retornou array vazio, sem eventos para mostrar");
              }
            } else {
              // Usar dados de exemplo se o backend retornar algo que não é um array
              console.log("API não retornou um array válido, usando dados de exemplo");
              setEventos(eventosExemplo);
              setUsandoDadosExemplo(true);
            }
          } else {
            // Erro na resposta da API
            console.error("Erro na resposta da API:", res.status, await res.text());
            setEventos(eventosExemplo);
            setUsandoDadosExemplo(true);
          }
        } catch (fetchError) {
          // Erro ao fazer a requisição
          console.error("Erro ao fazer requisição:", fetchError);
          setEventos(eventosExemplo);
          setUsandoDadosExemplo(true);
        }
      } catch (error) {
        console.error("Erro ao tentar buscar eventos do backend:", error);
        setEventos(eventosExemplo);
        setUsandoDadosExemplo(true);
      } finally {
        setCarregando(false);
      }
    };

    buscarEventos();
  }, [atualizacaoForçada]); // Adicionando atualizacaoForçada como dependência

  // Ordenar eventos: próximos primeiro, depois finalizados
  const eventosOrdenados = [...eventos].sort((a, b) => {
    // Primeiro por status (não finalizados primeiro)
    if (a.finalizado !== b.finalizado) {
      return a.finalizado ? 1 : -1;
    }
    // Depois por data (mais recentes primeiro para não finalizados, mais antigos primeiro para finalizados)
    if (a.finalizado) {
      return new Date(b.data).getTime() - new Date(a.data).getTime();
    } else {
      return new Date(a.data).getTime() - new Date(b.data).getTime();
    }
  });

  if (carregando) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Carregando eventos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">🏟️ Eventos</h2>
        <div className="flex gap-2">
          <LimparBancoDados onLimparConcluido={() => setAtualizacaoForçada(prev => prev + 1)} />
          <Link 
            href="/eventos/novo" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Novo Evento
          </Link>
        </div>
      </div>
      
      {usandoDadosExemplo && (
        <div className="mb-6 p-3 bg-yellow-100 rounded border border-yellow-300">
          <p className="text-yellow-800">
            <strong>Nota:</strong> Mostrando dados de exemplo para demonstração.
          </p>
        </div>
      )}
      
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-700">Próximos Eventos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventosOrdenados.filter(e => !e.finalizado).map((evento) => (
            <Link 
              href={`/eventos/${evento.id}`}
              key={evento.id} 
              className="p-4 border rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">{evento.nome}</h3>
                {!evento.finalizado && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Programado
                  </span>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {evento.data && (
                  <div className="flex items-center">
                    <span className="font-medium">📅 Data:</span>
                    <span className="ml-2">
                      {format(new Date(evento.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}
                {evento.local && evento.pais && (
                  <div className="flex items-center mt-1">
                    <span className="font-medium">📍 Local:</span>
                    <span className="ml-2">{evento.local}, {evento.pais}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {eventosOrdenados.some(e => e.finalizado) && (
          <>
            <h3 className="text-lg font-semibold text-gray-700 mt-8">Eventos Finalizados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eventosOrdenados.filter(e => e.finalizado).map((evento) => (
                <Link 
                  href={`/eventos/${evento.id}`}
                  key={evento.id} 
                  className="p-4 border rounded-lg shadow-sm bg-gray-50 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg">{evento.nome}</h3>
                    {evento.finalizado && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded-full">
                        Finalizado
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {evento.data && (
                      <div className="flex items-center">
                        <span className="font-medium">📅 Data:</span>
                        <span className="ml-2">
                          {format(new Date(evento.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    )}
                    {evento.local && evento.pais && (
                      <div className="flex items-center mt-1">
                        <span className="font-medium">📍 Local:</span>
                        <span className="ml-2">{evento.local}, {evento.pais}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Componente do botão de limpar banco de dados
function LimparBancoDados({ onLimparConcluido }) {
  const handleLimpar = async () => {
    // Confirmação do usuário
    if (!window.confirm('ATENÇÃO: Isso irá apagar TODOS os dados do sistema, incluindo lutadores, eventos, lutas e rankings. Esta ação não pode ser desfeita. Deseja continuar?')) {
      return;
    }
    
    // Segunda confirmação para ter certeza
    if (!window.confirm('Tem certeza? Todos os dados serão perdidos permanentemente.')) {
      return;
    }
    
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
      console.error('Erro ao limpar banco:', error);
      alert('Erro ao limpar banco de dados. Verifique o console para mais detalhes.');
    }
  };
  
  return (
    <button
      onClick={handleLimpar}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      title="Limpar todos os dados do sistema"
    >
      Limpar Dados
    </button>
  );
} 