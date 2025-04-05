'use client'

import { notFound } from "next/navigation";
import { useState, useEffect } from 'react';
import { use } from 'react';

interface Lutador {
  id: number;
  nome: string;
  apelido: string | null;
  pais: string;
  categoriaAtual: string;
}

interface RankingItem {
  id: number;
  lutadorId: number;
  lutador: Lutador;
  pontos: number;
  posicao: number;
  variacao: number;
  corFundo: string;
}

interface LutadorEstatisticas {
  nome: string;
  pais: string;
  sexo: string;
  totalLutas: number;
  vitorias: number;
  derrotas: number;
  nocautes: number;
  finalizacoes: number;
  decisoes: number;
  bonus: number;
  vitoriasTitulo: number;
}

// Mapeamento para conversão categoria no formato URL para nome formal
const categoriasMap: Record<string, string> = {
  "peso-por-peso": "Peso por Peso",
  "peso-mosca": "Peso Mosca",
  "peso-galo": "Peso Galo",
  "peso-pena": "Peso Pena",
  "peso-leve": "Peso Leve",
  "peso-meio-medio": "Peso Meio-Médio",
  "peso-medio": "Peso Médio",
  "peso-meio-pesado": "Peso Meio-Pesado",
  "peso-pesado": "Peso Pesado",
  "peso-palha": "Peso Palha",
  "peso-mosca-feminino": "Peso Mosca Feminino",
  "peso-galo-feminino": "Peso Galo Feminino",
  "peso-pena-feminino": "Peso Pena Feminino"
};

export default function RankingPage({ params }: { params: { categoria: string } }) {
  // Desembrulhar o params usando React.use()
  const resolvedParams = use(params);
  const categoria = resolvedParams.categoria;
  
  const [selectedLutador, setSelectedLutador] = useState<number | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [carregandoEstatisticas, setCarregandoEstatisticas] = useState(false);
  const [estatisticas, setEstatisticas] = useState<LutadorEstatisticas | null>(null);
  
  console.log("Renderizando página de categoria:", categoria);
  
  useEffect(() => {
    console.log("RankingPage [categoria] montada, params:", resolvedParams);
  }, [resolvedParams]);

  async function obterDadosRanking() {
    console.log("Obtendo dados do ranking para categoria:", categoria);
    
    try {
      console.log(`Tentando buscar ranking para categoria: ${categoria}`);
      
      // Obtém o nome da categoria formatado
      const categoriaFormatada = categoriasMap[categoria] || categoria;
      
      // Codificar a categoria para a URL (importante para categorias com espaços)
      const categoriaEncoded = encodeURIComponent(categoriaFormatada);
      
      console.log(`URL da requisição: http://localhost:3333/ranking/${categoriaEncoded}`);
      
      try {
        const res = await fetch(`http://localhost:3333/ranking/${categoriaEncoded}`, { 
          cache: "no-store",
          next: { revalidate: 0 } 
        });
    
        console.log(`Status da resposta: ${res.status} ${res.statusText}`);
    
        if (!res.ok) {
          console.error(`Erro na resposta da API: ${res.status} ${res.statusText}`);
          return notFound();
        }
    
        const data: RankingItem[] = await res.json();
        console.log(`Dados recebidos: ${data.length} itens`);
    
        // Mapeamento de cores para classes CSS
        const corBackgroundMap: Record<string, string> = {
          "dourado-escuro": "bg-yellow-600 text-white hover:bg-yellow-700",
          "dourado-claro": "bg-yellow-400 hover:bg-yellow-500",
          "azul-escuro": "bg-blue-700 text-white hover:bg-blue-800",
          "azul-claro": "bg-blue-400 hover:bg-blue-500",
          "": "bg-gray-100 hover:bg-gray-200"
        };
    
        // Formatar título da categoria para exibição
        const categoriaTitulo = categoriasMap[categoria] || categoria.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        const abrirModalEstatisticas = async (lutadorId: number) => {
          console.log(`Abrindo modal para lutador ID: ${lutadorId}`);
          setSelectedLutador(lutadorId);
          setModalAberto(true);
          setCarregandoEstatisticas(true);
          
          try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
            const url = categoriaFormatada === "Peso por Peso" 
              ? `${API_URL}/lutadores/${lutadorId}/estatisticas`
              : `${API_URL}/lutadores/${lutadorId}/estatisticas?categoria=${encodeURIComponent(categoriaFormatada)}`;
              
            console.log(`Buscando estatísticas do lutador na URL: ${url}`);
            
            const res = await fetch(url, {
              cache: "no-store",
              next: { revalidate: 0 }
            });
            
            console.log(`Status da resposta de estatísticas: ${res.status} ${res.statusText}`);
            
            if (!res.ok) {
              console.error(`Erro na resposta da API de estatísticas: ${res.status} ${res.statusText}`);
              throw new Error(`Erro ao carregar estatísticas: ${res.status} ${res.statusText}`);
            }
            
            const dadosEstatisticas = await res.json();
            console.log('Estatísticas recebidas:', dadosEstatisticas);
            setEstatisticas(dadosEstatisticas);
          } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            setEstatisticas(null);
          } finally {
            setCarregandoEstatisticas(false);
          }
        };
        
        const fecharModal = () => {
          console.log("Fechando modal de estatísticas");
          setModalAberto(false);
          setSelectedLutador(null);
          setEstatisticas(null);
        };
    
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Ranking: {categoriaTitulo}</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="px-4 py-3 text-left w-16">POS</th>
                    <th className="px-4 py-3 text-left">LUTADOR</th>
                    <th className="px-4 py-3 text-right w-24">PONTOS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr 
                      key={item.id} 
                      className={`border-b cursor-pointer ${corBackgroundMap[item.corFundo] || 'bg-white hover:bg-gray-100'}`}
                      onClick={() => abrirModalEstatisticas(item.lutadorId)}
                    >
                      <td className="px-4 py-3 font-bold">
                        {item.posicao}
                        {item.variacao > 0 && <span className="ml-1 text-green-600">↑</span>}
                        {item.variacao < 0 && <span className="ml-1 text-red-600">↓</span>}
                      </td>
                      <td className="px-4 py-3">
                        {item.lutador?.nome}
                        {item.lutador?.apelido && (
                          <span className="ml-1 text-gray-500">"{item.lutador.apelido}"</span>
                        )}
                        <span className="ml-2 text-xs text-gray-500">
                          {item.lutador?.pais}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {item.pontos}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {data.length === 0 && (
              <p className="p-4 text-center bg-gray-100 rounded">
                Não há lutadores classificados nesta categoria.
              </p>
            )}
            
            {/* Modal de Estatísticas */}
            {modalAberto && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">
                        {estatisticas?.nome || 'Estatísticas do Lutador'}
                      </h3>
                      <button 
                        onClick={fecharModal}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {carregandoEstatisticas ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : estatisticas ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b">
                          <span className="font-medium">País:</span>
                          <span>{estatisticas.pais}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-3 rounded">
                            <div className="text-2xl font-bold text-blue-700">{estatisticas.totalLutas}</div>
                            <div className="text-sm text-gray-600">Lutas</div>
                          </div>
                          
                          <div className="bg-green-50 p-3 rounded">
                            <div className="text-2xl font-bold text-green-700">{estatisticas.vitorias}</div>
                            <div className="text-sm text-gray-600">Vitórias</div>
                          </div>
                          
                          <div className="bg-red-50 p-3 rounded">
                            <div className="text-2xl font-bold text-red-700">{estatisticas.derrotas}</div>
                            <div className="text-sm text-gray-600">Derrotas</div>
                          </div>
                          
                          <div className="bg-purple-50 p-3 rounded">
                            <div className="text-2xl font-bold text-purple-700">{estatisticas.vitoriasTitulo}</div>
                            <div className="text-sm text-gray-600">Títulos</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 pt-2 border-t">
                          <h4 className="font-medium">Métodos de Vitória</h4>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-gray-100 p-2 rounded">
                              <div className="font-bold">{estatisticas.nocautes}</div>
                              <div className="text-xs">Nocautes</div>
                            </div>
                            <div className="bg-gray-100 p-2 rounded">
                              <div className="font-bold">{estatisticas.finalizacoes}</div>
                              <div className="text-xs">Finalizações</div>
                            </div>
                            <div className="bg-gray-100 p-2 rounded">
                              <div className="font-bold">{estatisticas.decisoes}</div>
                              <div className="text-xs">Decisões</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Bônus da Noite:</span>
                            <span className="font-bold text-yellow-600">{estatisticas.bonus}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-red-500">
                        Erro ao carregar estatísticas. Tente novamente.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      } catch (error) {
        console.error(`Erro na requisição: ${error}`);
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Ranking: {categoria}</h2>
            <p className="text-red-500">Erro ao carregar o ranking. Tente novamente mais tarde.</p>
            <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        );
      }
    } catch (error) {
      console.error(`Erro ao buscar ranking para ${categoria}:`, error);
      return (
        <div>
          <h2 className="text-2xl font-bold mb-4">Ranking: {categoria}</h2>
          <p className="text-red-500">Erro ao carregar o ranking. Tente novamente mais tarde.</p>
          <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      );
    }
  }
  
  return obterDadosRanking();
}
