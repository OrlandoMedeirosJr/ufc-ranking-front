'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Categorias fixas que são sempre mostradas, mesmo que não tenham lutadores
const categoriasFixas = [
  {
    id: 'peso-por-peso',
    nome: 'Peso por Peso',
    descricao: 'Ranking geral considerando lutadores de todas as categorias'
  }
];

// Mapeamento de slugs para nomes de categorias
const categoriasMap: Record<string, string> = {
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

// Mapeamento inverso de nomes de categorias para slugs
const slugsMap: Record<string, string> = Object.entries(categoriasMap).reduce(
  (acc, [slug, nome]) => ({ ...acc, [nome]: slug }), 
  {} as Record<string, string>
);

export default function RankingIndexPage() {
  const [categorias, setCategorias] = useState<{ id: string; nome: string; descricao?: string }[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [horaUltimaAtualizacao, setHoraUltimaAtualizacao] = useState(0);
  
  useEffect(() => {
    const agora = Date.now();
    const intervaloAtualizacao = 60000; // 1 minuto em milissegundos
    
    // Verificar se precisamos atualizar ou se os dados são recentes
    const deveriaAtualizar = agora - horaUltimaAtualizacao > intervaloAtualizacao;
    
    if (!deveriaAtualizar && categorias.length > 0) {
      console.log("Usando categorias em cache. Última atualização:", new Date(horaUltimaAtualizacao).toLocaleTimeString());
      return;
    }
    
    const buscarCategorias = async () => {
      setCarregando(true);
      
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        
        const response = await fetch(`${API_URL}/ranking/categorias`, { 
          cache: "no-store",
          next: { revalidate: 0 },
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          setCategorias(categoriasFixas);
          return;
        }
        
        const categoriasDaAPI = await response.json();
        
        if (!categoriasDaAPI || categoriasDaAPI.length === 0) {
          setCategorias(categoriasFixas);
          return;
        }
        
        // Mapear categorias da API para o formato esperado
        const categoriasFormatadas = categoriasDaAPI.map((categoria: string) => {
          const slug = slugsMap[categoria] || categoria.toLowerCase().replace(/ /g, '-');
          return {
            id: slug,
            nome: categoria,
            descricao: `Ranking dos lutadores da categoria ${categoria}`
          };
        });
        
        // Combinar com as categorias fixas (sempre mostrar Peso por Peso)
        const todasCategorias = [
          ...categoriasFixas,
          ...categoriasFormatadas.filter(c => c.id !== 'peso-por-peso') // Evitar duplicação
        ];
        
        setCategorias(todasCategorias);
        setHoraUltimaAtualizacao(Date.now());
      } catch (error) {
        setCategorias(categoriasFixas);
      } finally {
        setCarregando(false);
      }
    };
    
    buscarCategorias();
  }, [horaUltimaAtualizacao]);
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Rankings UFC</h1>
      
      {carregando ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categorias.map((categoria) => (
            <Link 
              href={`/ranking/${categoria.id}`} 
              key={categoria.id}
              prefetch={true}
              className="block p-4 border rounded-lg shadow hover:shadow-md transition-shadow bg-white hover:bg-gray-50"
            >
              <h2 className="text-xl font-semibold mb-2">{categoria.nome}</h2>
              {categoria.descricao && (
                <p className="text-gray-600 text-sm">{categoria.descricao}</p>
              )}
            </Link>
          ))}
          
          {categorias.length === 0 && !carregando && (
            <div className="col-span-full p-6 bg-gray-100 rounded text-center">
              <p>Nenhuma categoria disponível no momento.</p>
              <p className="text-gray-600 mt-2 text-sm">
                Adicione lutadores e lutas para que os rankings sejam gerados.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 