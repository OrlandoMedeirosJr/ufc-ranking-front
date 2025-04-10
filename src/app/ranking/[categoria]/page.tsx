import { notFound } from "next/navigation";
import RankingTable from "@/components/RankingTable";
import { rankingColorClassMap } from "@/utils/rankingColors";
import { apiConfig } from "@/config/api";

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

export default async function RankingPage({ 
  params 
}: { 
  params: Promise<{ categoria: string }> 
}) {
  // Await params já que agora é uma Promise
  const unwrappedParams = await params;
  
  // Verificar se temos uma categoria válida
  if (!unwrappedParams?.categoria) {
    return notFound();
  }
  
  const categoria = decodeURIComponent(unwrappedParams.categoria);
  
  // Mapeamento de slugs para nomes de categorias no formato que o backend espera
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
    "peso-palha-feminino": "Peso Palha Feminino",
    "peso-mosca-feminino": "Peso Mosca Feminino",
    "peso-galo-feminino": "Peso Galo Feminino",
    "peso-pena-feminino": "Peso Pena Feminino"
  };
  
  // Obtém o nome da categoria formatado
  const categoriaFormatada = categoriasMap[categoria] || categoria;
  
  try {
    // URL para a API de ranking usando a configuração centralizada
    const apiUrl = `${apiConfig.baseUrl}/ranking/${encodeURIComponent(categoriaFormatada)}`;
    console.log(`Buscando ranking: ${apiUrl}`);
    
    const res = await fetch(apiUrl, {
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
      
      // Tentativa alternativa para o caso de problemas com encoding
      console.log('Tentando abordagem alternativa com encoding diferente...');
      const alternativeUrl = `${apiConfig.baseUrl}/ranking/${encodeURIComponent(categoriaFormatada).replace(/%20/g, '+')}`;
      console.log(`URL alternativa: ${alternativeUrl}`);
      
      try {
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
          const data: RankingItem[] = await alternativeRes.json();
          console.log(`Recuperação alternativa bem-sucedida: ${data.length} itens`);
          
          // Formatar título da categoria para exibição
          const categoriaTitulo = categoriasMap[categoria] || categoria.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');

          return (
            <RankingTable
              dados={data}
              categoria={categoria}
              categoriaTitulo={categoriaTitulo}
              corBackgroundMap={rankingColorClassMap}
            />
          );
        } else {
          console.error(`Falha também na abordagem alternativa: ${alternativeRes.status}`);
          return notFound();
        }
      } catch (alternativeError) {
        console.error('Erro na abordagem alternativa:', alternativeError);
        throw alternativeError; // Propagar para o tratamento de erro global
      }
    }

    const data: RankingItem[] = await res.json();
    console.log(`Dados recebidos com sucesso: ${data.length} itens`);

    // Formatar título da categoria para exibição
    const categoriaTitulo = categoriasMap[categoria] || categoria.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    return (
      <RankingTable
        dados={data}
        categoria={categoria}
        categoriaTitulo={categoriaTitulo}
        corBackgroundMap={rankingColorClassMap}
      />
    );
  } catch (error: unknown) {
    console.error(`Erro ao buscar ranking para ${categoria}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Ranking: {categoria}</h2>
        <p className="text-red-500">Erro ao carregar o ranking. Tente novamente mais tarde.</p>
        <p className="text-red-500">Erro: {errorMessage}</p>
      </div>
    );
  }
}
