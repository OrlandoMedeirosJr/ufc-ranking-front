import { notFound } from "next/navigation";
import RankingTable from "@/components/RankingTable";

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

export default async function RankingPage({ params }: { params: { categoria: string } }) {
  // Aguardamos a resolução dos parâmetros para evitar o aviso
  const parametros = await Promise.resolve(params);
  const categoria = decodeURIComponent(parametros.categoria);
  
  console.log(`Tentando buscar ranking para categoria: ${categoria}`);
  
  try {
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
      "peso-pesado": "Peso Pesado"
    };
    
    // Obtém o nome da categoria formatado
    const categoriaFormatada = categoriasMap[categoria] || categoria;
    
    console.log(`URL da requisição: http://localhost:3333/ranking/${categoriaFormatada}`);
    
    const res = await fetch(`http://localhost:3333/ranking/${categoriaFormatada}`, { 
      cache: "no-store",
      next: { revalidate: 0 } 
    });

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

    return (
      <RankingTable
        dados={data}
        categoria={categoria}
        categoriaTitulo={categoriaTitulo}
        corBackgroundMap={corBackgroundMap}
      />
    );
  } catch (error) {
    console.error(`Erro ao buscar ranking para ${categoria}:`, error);
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Ranking: {categoria}</h2>
        <p className="text-red-500">Erro ao carregar o ranking. Tente novamente mais tarde.</p>
      </div>
    );
  }
}
