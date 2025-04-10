import Link from 'next/link';
import React from 'react';
import { apiConfig } from '@/config/api';

interface Lutador {
  id: number;
  nome: string;
  apelido: string | null;
  pais: string;
  sexo: string;
  altura?: number;
  categorias?: string[]; // Categorias em que o lutador já lutou
}

export default async function LutadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await searchParams já que agora é uma Promise no Next.js 15
  const unwrappedSearchParams = await searchParams;
  const nome = typeof unwrappedSearchParams?.nome === 'string' ? unwrappedSearchParams.nome : undefined;
  const pais = typeof unwrappedSearchParams?.pais === 'string' ? unwrappedSearchParams.pais : undefined;
  const sexo = typeof unwrappedSearchParams?.sexo === 'string' ? unwrappedSearchParams.sexo : undefined;
  
  // Construir URL com parâmetros de busca
  let queryParams = '';
  
  if (nome || pais || sexo) {
    const params = new URLSearchParams();
    if (nome) params.append('nome', nome);
    if (pais) params.append('pais', pais);
    if (sexo) params.append('sexo', sexo);
    queryParams = `?${params.toString()}`;
  }
  
  let lutadores: Lutador[] = [];
  let erro: string | null = null;
  
  try {
    // URL usando configuração centralizada
    const url = `${apiConfig.baseUrl}/lutadores${queryParams}`;
    console.log(`Buscando lutadores: ${url}`);
    
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
      throw new Error(`Erro ao carregar lutadores: ${res.status}`);
    }
    
    lutadores = await res.json();
    console.log(`Lutadores carregados com sucesso: ${lutadores.length}`);
    
    if (!Array.isArray(lutadores)) {
      console.error('Resposta da API não é um array:', lutadores);
      throw new Error('Resposta da API não retornou um array válido');
    }

    // Para cada lutador, buscar as categorias em que já lutou
    for (const lutador of lutadores) {
      try {
        // Usar configuração centralizada para URL
        const categoriaUrl = `${apiConfig.baseUrl}/lutadores/${lutador.id}/categorias`;
        console.log(`Buscando categorias do lutador ${lutador.id}: ${categoriaUrl}`);
        
        const resCategoria = await fetch(categoriaUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          cache: 'no-store',
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (resCategoria.ok) {
          const data = await resCategoria.json();
          lutador.categorias = data.categorias;
          console.log(`Categorias do lutador ${lutador.id} carregadas: ${data.categorias?.length || 0}`);
        } else {
          console.warn(`Erro ao buscar categorias do lutador ${lutador.id}: ${resCategoria.status}`);
        }
      } catch (e) {
        console.error(`Erro ao buscar categorias do lutador ${lutador.id}:`, e);
      }
    }
  } catch (error) {
    console.error("Erro ao buscar lutadores:", error);
    erro = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Tentativa alternativa
    try {
      console.log('Tentando abordagem alternativa para buscar lutadores...');
      const alternativeUrl = `${apiConfig.baseUrl}/lutadores`;
      console.log(`URL alternativa: ${alternativeUrl}`);
      
      const alternativeRes = await fetch(alternativeUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        cache: 'no-store',
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (alternativeRes.ok) {
        const alternativeLutadores = await alternativeRes.json();
        console.log(`Recuperação alternativa bem-sucedida: ${alternativeLutadores.length} lutadores`);
        
        if (Array.isArray(alternativeLutadores) && alternativeLutadores.length > 0) {
          lutadores = alternativeLutadores;
          
          // Se temos filtros, aplicamos manualmente
          if (nome || pais || sexo) {
            lutadores = lutadores.filter(lutador => {
              let match = true;
              if (nome) match = match && lutador.nome.toLowerCase().includes(nome.toLowerCase());
              if (pais) match = match && lutador.pais.toLowerCase().includes(pais.toLowerCase());
              if (sexo) match = match && lutador.sexo === sexo;
              return match;
            });
            console.log(`Filtrados para ${lutadores.length} lutadores após aplicar filtros manualmente`);
          }
          
          erro = null; // Limpar erro pois temos dados
        } else {
          console.error('Resposta alternativa não contém um array válido');
        }
      } else {
        console.error(`Falha também na abordagem alternativa: ${alternativeRes.status}`);
      }
    } catch (alternativeError) {
      console.error('Erro na abordagem alternativa:', alternativeError);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lutadores do UFC</h1>
        <Link 
          href="/lutadores/novo" 
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
        >
          Adicionar Lutador
        </Link>
      </div>
      
      {/* Formulário de busca */}
      <div className="bg-white p-4 rounded-md shadow-sm mb-6">
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium mb-1">Nome</label>
            <input
              type="text"
              id="nome"
              name="nome"
              defaultValue={nome}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Nome do lutador"
            />
          </div>
          <div>
            <label htmlFor="pais" className="block text-sm font-medium mb-1">País</label>
            <input
              type="text"
              id="pais"
              name="pais"
              defaultValue={pais}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="País de origem"
            />
          </div>
          <div>
            <label htmlFor="sexo" className="block text-sm font-medium mb-1">Sexo</label>
            <select
              id="sexo"
              name="sexo"
              defaultValue={sexo}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Todos</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </select>
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button 
              type="submit"
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md"
            >
              Filtrar
            </button>
          </div>
        </form>
      </div>
      
      {erro && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>Erro ao carregar lutadores: {erro}</p>
          <p>Tente novamente mais tarde.</p>
        </div>
      )}
      
      {lutadores.length === 0 && !erro ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum lutador encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lutadores.map((lutador) => (
            <div key={lutador.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold">
                {lutador.nome}
                {lutador.apelido && <span className="text-gray-500 ml-2">"{lutador.apelido}"</span>}
              </h2>
              <div className="flex flex-wrap mt-2 gap-2">
                <span className="px-2 py-1 bg-gray-100 text-sm rounded-full">{lutador.pais}</span>
                <span className="px-2 py-1 bg-purple-100 text-sm rounded-full">{lutador.sexo}</span>
              </div>
              
              {/* Exibir categorias em que o lutador já lutou */}
              {lutador.categorias && lutador.categorias.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {lutador.categorias.map((categoria, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-sm rounded-full">{categoria}</span>
                  ))}
                </div>
              ) : (
                <div className="mt-2">
                  <span className="px-2 py-1 bg-gray-200 text-sm rounded-full text-gray-500">Sem lutas em categorias</span>
                </div>
              )}
              
              <div className="mt-4 flex justify-end">
                <Link
                  href={`/lutadores/${lutador.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Ver detalhes
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
