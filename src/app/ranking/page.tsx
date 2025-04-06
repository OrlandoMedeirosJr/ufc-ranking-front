'use client';

import { useEffect, useState } from 'react';
import RankingTable from '@/components/RankingTable';
import { buildApiUrl } from '@/config/api';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

// Categorias disponíveis no sistema
const categorias = [
  { id: "peso-por-peso", nome: "Peso por Peso" },
  { id: "peso-mosca", nome: "Peso Mosca" },
  { id: "peso-galo", nome: "Peso Galo" },
  { id: "peso-pena", nome: "Peso Pena" },
  { id: "peso-leve", nome: "Peso Leve" },
  { id: "peso-meio-medio", nome: "Peso Meio-Médio" },
  { id: "peso-medio", nome: "Peso Médio" },
  { id: "peso-meio-pesado", nome: "Peso Meio-Pesado" },
  { id: "peso-pesado", nome: "Peso Pesado" },
  { id: "peso-palha-feminino", nome: "Peso Palha Feminino" },
  { id: "peso-mosca-feminino", nome: "Peso Mosca Feminino" },
  { id: "peso-galo-feminino", nome: "Peso Galo Feminino" },
  { id: "peso-pena-feminino", nome: "Peso Pena Feminino" }
];

interface Lutador {
  nome: string;
  apelido: string | null;
  pais: string;
  id: number;
}

interface RankingItem {
  id: number;
  lutadorId: number;
  posicao: number;
  pontos: number;
  corFundo: string;
  variacao: number;
  lutador: Lutador | null;
}

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState<string>("todos");
  const [rankingData, setRankingData] = useState<{[key: string]: RankingItem[]}>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Função para buscar o ranking de uma categoria específica
  const fetchRanking = async (categoria: string) => {
    try {
      const apiUrl = buildApiUrl(`ranking/${categoria}`);
      const res = await fetch(apiUrl, { cache: "no-store" });
      
      if (!res.ok) {
        throw new Error(`Erro ao carregar o ranking: ${res.status}`);
      }
      
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(`Erro ao buscar ranking para ${categoria}:`, error);
      return [];
    }
  };
  
  // Buscar todos os rankings
  useEffect(() => {
    const fetchAllRankings = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Sempre busca o Peso por Peso por ser a categoria principal
        const pesoPorPesoData = await fetchRanking("Peso por Peso");
        
        const newRankingData: {[key: string]: RankingItem[]} = {
          "peso-por-peso": pesoPorPesoData
        };
        
        // Adiciona os dados iniciais para evitar atraso na renderização
        setRankingData(newRankingData);
        
        // Busca as demais categorias em paralelo
        const promises = categorias
          .filter(cat => cat.id !== "peso-por-peso")
          .map(async (categoria) => {
            const data = await fetchRanking(categoria.nome);
            return { id: categoria.id, data };
          });
        
        const results = await Promise.all(promises);
        
        // Atualiza com todos os dados
        const finalRankingData = { ...newRankingData };
        results.forEach(result => {
          finalRankingData[result.id] = result.data;
        });
        
        setRankingData(finalRankingData);
      } catch (error) {
        console.error("Erro ao buscar rankings:", error);
        setError("Ocorreu um erro ao buscar os rankings. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllRankings();
  }, []);
  
  // Filtra as categorias a serem exibidas com base na aba ativa
  const categoriasToShow = activeTab === "todos" 
    ? categorias 
    : activeTab === "masculino"
      ? categorias.filter(cat => !cat.id.includes("feminino") && cat.id !== "peso-por-peso")
      : categorias.filter(cat => cat.id.includes("feminino"));
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Rankings UFC</h1>
        <p className="text-muted-foreground">
          Classificação atualizada dos lutadores por categoria
        </p>
      </div>
      
      <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="todos">Todos os Rankings</TabsTrigger>
          <TabsTrigger value="masculino">Masculino</TabsTrigger>
          <TabsTrigger value="feminino">Feminino</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {error && (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}
      
      {/* Sempre renderizar o Peso por Peso no topo quando estiver na aba "todos" */}
      {activeTab === "todos" && (
        <div className="mb-8">
          {loading && !rankingData["peso-por-peso"] ? (
            <RankingSkeleton />
          ) : (
            <RankingTable 
              dados={rankingData["peso-por-peso"] || []}
              categoria="peso-por-peso"
              categoriaTitulo="Peso por Peso"
            />
          )}
        </div>
      )}
      
      {/* Renderizar as demais categorias */}
      <div className="space-y-12">
        {categoriasToShow
          .filter(cat => activeTab !== "todos" || cat.id !== "peso-por-peso")
          .map((categoria) => (
            <div key={categoria.id}>
              {loading && !rankingData[categoria.id] ? (
                <RankingSkeleton />
              ) : (
                <RankingTable 
                  dados={rankingData[categoria.id] || []}
                  categoria={categoria.id}
                  categoriaTitulo={categoria.nome}
                />
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

// Componente de skeleton para carregamento
function RankingSkeleton() {
  return (
    <div className="space-y-4 mb-8">
      <Skeleton className="h-8 w-48" />
      <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-800 p-4">
          <div className="grid grid-cols-12 gap-4">
            <Skeleton className="h-6 col-span-1" />
            <Skeleton className="h-6 col-span-9" />
            <Skeleton className="h-6 col-span-2" />
          </div>
        </div>
        <div className="p-2 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-12 gap-4 p-2">
              <Skeleton className="h-6 col-span-1" />
              <Skeleton className="h-6 col-span-9" />
              <Skeleton className="h-6 col-span-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 